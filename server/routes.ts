import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { registrationSchema, updateTeamStatusSchema, loginSchema, eventSettingSchema } from "@shared/schema";
import { ZodError } from "zod";
import { v2 as cloudinary } from "cloudinary";
import QRCode from "qrcode";
import { createEvent } from "ics";
import { format } from "@fast-csv/format";
import multer from "multer";
import session from "express-session";
import rateLimit from "express-rate-limit";
import csrf from "@dr.pogodin/csurf";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Configure session
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later.",
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: "Too many registration attempts, please try again later.",
});

// CSRF protection middleware (session-based, no cookies)
// Token can be sent in X-CSRF-Token header or _csrf body field
const csrfProtection = csrf({ 
  cookie: false,
  value: (req) => {
    // Check header first (for file uploads), then body
    return req.headers['x-csrf-token'] as string || req.body?._csrf;
  }
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Upload file to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `innovate-x/${folder}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
}

// Verify hCaptcha
async function verifyHCaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${token}`,
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

// Send email via Brevo
async function sendEmail(to: string[], subject: string, htmlContent: string, attachments?: any[]) {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: { email: "noreply@innovatex.com", name: "Innovate-X Team" },
        to: to.map((email) => ({ email })),
        subject,
        htmlContent,
        attachment: attachments || [],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Brevo email error:", error);
      throw new Error("Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Generate QR code
async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, { width: 300, margin: 1 });
    // Upload QR code to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(qrDataUrl, {
      folder: "innovate-x/qr-codes",
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("QR code generation error:", error);
    throw error;
  }
}

// Generate .ics calendar file
function generateICS(teamName: string, projectTitle: string): string {
  const eventDate = new Date("2025-11-25T09:00:00+05:30");
  const endDate = new Date(eventDate.getTime() + 8 * 60 * 60 * 1000); // 8 hours later

  const event = createEvent({
    start: [2025, 11, 25, 9, 0],
    end: [2025, 11, 25, 17, 0],
    title: "Innovate-X 2025 - Project Expo",
    description: `Team: ${teamName}\nProject: ${projectTitle}\n\nPlease arrive 30 minutes early for check-in and setup.`,
    location: "Main Auditorium, Your College",
    status: "CONFIRMED",
    busyStatus: "BUSY",
    organizer: { name: "Innovate-X Team", email: "organizer@innovatex.com" },
  });

  if (event.error) {
    console.error("ICS generation error:", event.error);
    return "";
  }

  return event.value || "";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply middleware
  app.use(sessionMiddleware);
  app.use(generalLimiter);

  // Ensure admin account exists
  const initializeAdmin = async () => {
    const adminEmail = "Sm4686771@gmail.com";
    const adminPassword = "SUHAS@ADMIN";

    const existingAdmin = await storage.getAdminByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await storage.createAdmin({ email: adminEmail, password: hashedPassword });
      console.log("Admin account created:", adminEmail);
    }
  };
  await initializeAdmin();

  // PUBLIC ROUTES

  // Get public event settings
  app.get("/api/settings/public", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get gallery teams (public)
  app.get("/api/gallery", async (req: Request, res: Response) => {
    try {
      const teams = await storage.getGalleryTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching gallery teams:", error);
      res.status(500).json({ error: "Failed to fetch gallery teams" });
    }
  });

  // Team registration
  app.post(
    "/api/register",
    registrationLimiter,
    upload.fields([
      { name: "paymentFile", maxCount: 1 },
      { name: "extraFile", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const { data: dataStr, captchaToken } = req.body;
        const data = JSON.parse(dataStr);

        // Validate data
        const validatedData = registrationSchema.parse(data);

        // Verify captcha
        const captchaValid = await verifyHCaptcha(captchaToken);
        if (!captchaValid) {
          return res.status(400).json({ error: "Captcha verification failed" });
        }

        // Upload payment proof
        if (!files.paymentFile || files.paymentFile.length === 0) {
          return res.status(400).json({ error: "Payment proof is required" });
        }

        const paymentProofUrl = await uploadToCloudinary(files.paymentFile[0], "payment-proofs");

        // Upload extra doc if provided
        let extraDocUrl = undefined;
        if (files.extraFile && files.extraFile.length > 0) {
          extraDocUrl = await uploadToCloudinary(files.extraFile[0], "extra-docs");
        }

        // Create team
        const team = await storage.createTeam({
          ...validatedData,
          paymentProofUrl,
          extraDocUrl,
        });

        // Create members
        await storage.createMembers(team.id, validatedData.members);

        // Create audit log
        await storage.createAuditLog(team.id, "TEAM_REGISTERED", "system", "Team registered via website");

        // Send organizer alert email
        const organizerEmail = "Sm4686771@gmail.com";
        const emailHtml = `
          <h2>New Team Registration - Innovate-X 2025</h2>
          <p><strong>Team Name:</strong> ${team.teamName}</p>
          <p><strong>Category:</strong> ${team.category}</p>
          <p><strong>Project:</strong> ${team.projectTitle}</p>
          <p><strong>College:</strong> ${team.collegeName}</p>
          <p><strong>Contact:</strong> ${team.contactEmail} | ${team.contactPhone}</p>
          <p><strong>Members:</strong> ${team.memberCount}</p>
          <hr/>
          <p><a href="${paymentProofUrl}" target="_blank">View Payment Proof</a></p>
          ${extraDocUrl ? `<p><a href="${extraDocUrl}" target="_blank">View Supporting Document</a></p>` : ""}
          <p>Please review and verify this registration in the admin dashboard.</p>
        `;

        await sendEmail([organizerEmail], "New Team Registration - Innovate-X", emailHtml);

        res.status(201).json({ message: "Registration successful", teamId: team.id });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    }
  );

  // ADMIN ROUTES

  // Get CSRF token (for authenticated sessions)
  app.get("/api/auth/csrf", requireAuth, csrfProtection, (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Admin login - CSRF not required for login itself
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordValid = await bcrypt.compare(password, admin.password);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session!.adminId = admin.id;
      req.session!.adminEmail = admin.email;

      // After session is established, generate and return CSRF token
      // We need to call csrfProtection middleware to initialize the token
      csrfProtection(req, res, () => {
        res.json({ message: "Login successful", csrfToken: req.csrfToken() });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/auth/logout", requireAuth, csrfProtection, (req: Request, res: Response) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get all teams
  app.get("/api/admin/teams", requireAuth, async (req: Request, res: Response) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Export teams to CSV
  app.get("/api/admin/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `innovate-x-teams-${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const csvStream = format({ headers: true });
      csvStream.pipe(res);
      
      const teams = await storage.getAllTeams();
      
      for (const team of teams) {
        for (let i = 0; i < team.memberCount; i++) {
          const member = team.members[i];
          csvStream.write({
            'Team ID': team.id,
            'Team Name': team.teamName,
            'Category': team.category,
            'Project Title': team.projectTitle,
            'Project Summary': team.projectSummary,
            'College Name': team.collegeName,
            'Mentor Name': team.mentorName || '',
            'Mentor Email': team.mentorEmail || '',
            'Contact Phone': team.contactPhone,
            'Contact Email': team.contactEmail,
            'Member Count': team.memberCount,
            'Status': team.status,
            'Verification Note': team.verificationNote || '',
            'Verified At': team.verifiedAt ? team.verifiedAt.toISOString() : '',
            'Verified By': team.verifiedBy || '',
            'Created At': team.createdAt.toISOString(),
            'Member Index': i + 1,
            'Member Name': member?.fullName || '',
            'Member Email': member?.email || '',
            'Member Year': member?.year || '',
            'Member Department': member?.department || '',
          });
        }
      }
      
      csvStream.end();
    } catch (error) {
      console.error("Error exporting CSV:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export CSV" });
      }
    }
  });

  // Update team status (verify/reject)
  app.patch("/api/admin/teams/:id/status", requireAuth, csrfProtection, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note } = updateTeamStatusSchema.parse(req.body);

      const team = await storage.getTeamById(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Update team status
      const updatedTeam = await storage.updateTeamStatus(id, status, note, req.session!.adminEmail);

      // Create audit log
      await storage.createAuditLog(
        id,
        status === "VERIFIED" ? "TEAM_VERIFIED" : "TEAM_REJECTED",
        req.session!.adminEmail!,
        note
      );

      // Get team members
      const members = await storage.getMembersByTeamId(id);

      if (status === "VERIFIED") {
        // Generate QR code
        const qrData = JSON.stringify({
          teamId: id,
          teamName: team.teamName,
          category: team.category,
          verified: true,
        });
        const qrCodeUrl = await generateQRCode(qrData);
        await storage.updateTeamQrCode(id, qrCodeUrl);

        // Generate ICS file
        const icsContent = generateICS(team.teamName, team.projectTitle);
        const icsBase64 = Buffer.from(icsContent).toString("base64");

        // Send acceptance emails to all members
        const emailRecipients = members.map((m) => m.email);

        const acceptanceHtml = `
          <h2>Congratulations! Your Team Has Been Verified 🎉</h2>
          <p>Dear Team ${team.teamName},</p>
          <p>We're excited to inform you that your registration for Innovate-X 2025 has been verified!</p>
          <h3>Event Details:</h3>
          <p><strong>Date:</strong> November 25, 2025</p>
          <p><strong>Time:</strong> 9:00 AM - 5:00 PM</p>
          <p><strong>Venue:</strong> Main Auditorium, Your College</p>
          <h3>Your Team QR Code:</h3>
          <p>Please bring this QR code on the event day for check-in:</p>
          <img src="${qrCodeUrl}" alt="Team QR Code" style="width: 250px; height: 250px; border: 2px solid #00FF85; border-radius: 8px;"/>
          <h3>What to Bring:</h3>
          <ul>
            <li>Your project and required equipment</li>
            <li>Team ID proof</li>
            <li>This confirmation email and QR code</li>
          </ul>
          ${note ? `<p><strong>Note from organizers:</strong> ${note}</p>` : ""}
          <p>We've also attached a calendar invite (.ics file) - add it to your calendar so you don't miss the event!</p>
          <p>See you at Innovate-X 2025!</p>
          <p>Best regards,<br/>Innovate-X Team</p>
        `;

        await sendEmail(emailRecipients, "✅ Team Verified - Innovate-X 2025", acceptanceHtml, [
          {
            content: icsBase64,
            name: "innovate-x-2025.ics",
          },
        ]);
      } else {
        // Send rejection email
        const rejectionHtml = `
          <h2>Innovate-X 2025 Registration Update</h2>
          <p>Dear Team ${team.teamName},</p>
          <p>Thank you for your interest in Innovate-X 2025. Unfortunately, we are unable to accept your registration at this time.</p>
          ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ""}
          <p>If you believe this is an error or have questions, please contact us at organizer@innovatex.edu</p>
          <p>We appreciate your participation and hope to see you in future events.</p>
          <p>Best regards,<br/>Innovate-X Team</p>
        `;

        await sendEmail([team.contactEmail], "Innovate-X 2025 Registration Update", rejectionHtml);
      }

      res.json({ message: "Team status updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid input" });
      }
      console.error("Error updating team status:", error);
      res.status(500).json({ error: "Failed to update team status" });
    }
  });

  // Toggle team gallery visibility
  app.patch("/api/admin/teams/:id/gallery", requireAuth, csrfProtection, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { showInGallery } = req.body;

      const team = await storage.getTeamById(id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      await storage.toggleTeamGalleryVisibility(id, showInGallery);

      await storage.createAuditLog(
        id,
        showInGallery ? "GALLERY_ENABLED" : "GALLERY_DISABLED",
        req.session!.adminEmail!,
        `Gallery visibility ${showInGallery ? "enabled" : "disabled"}`
      );

      res.json({ message: "Gallery visibility updated" });
    } catch (error) {
      console.error("Error updating gallery visibility:", error);
      res.status(500).json({ error: "Failed to update gallery visibility" });
    }
  });

  // Get admin settings
  app.get("/api/admin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update admin settings
  app.post("/api/admin/settings", requireAuth, csrfProtection, async (req: Request, res: Response) => {
    try {
      const updates = req.body;

      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string") {
          await storage.upsertSetting({ key, value });
        }
      }

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Upload payment QR code
  app.post("/api/admin/upload-qr", requireAuth, csrfProtection, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const qrUrl = await uploadToCloudinary(req.file, "payment-qr");
      await storage.upsertSetting({ key: "PAYMENT_QR_URL", value: qrUrl });

      res.json({ message: "QR code uploaded successfully", url: qrUrl });
    } catch (error) {
      console.error("Error uploading QR code:", error);
      res.status(500).json({ error: "Failed to upload QR code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
