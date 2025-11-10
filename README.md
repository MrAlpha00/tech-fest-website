# Innovate-X 2025 - Inter-College Tech Expo Platform

A production-ready web application for managing inter-college project expo registrations with admin dashboard, team management, and automated email notifications.

## Features

### Public Website
- 🎨 Stunning dark theme with neon-green accents (#0B0F10 + #00FF85)
- 📱 Fully responsive design with glassmorphism effects
- ✨ Smooth animations with Framer Motion
- 🏆 Event information, tracks, prizes, schedule, and FAQ sections
- 📧 Contact information with payment QR code display

### Registration System
- 📝 Multi-step registration form (Team → Members → Uploads → Review)
- 👥 Support for 2-4 team members per registration
- 📤 File upload with drag-and-drop for payment proofs and documents
- 🔒 hCaptcha integration for bot protection
- 💾 Auto-save drafts to localStorage
- ✅ Real-time form validation with Zod

### Admin Dashboard
- 🔐 Secure admin authentication with bcrypt
- 📊 Team management with search, filtering, and pagination
- ✅ Verify/Reject workflow with email notifications
- 📧 Automated emails with QR codes and calendar (.ics) attachments
- 🎛️ Content management for event settings and payment QR
- 📈 Registration statistics and analytics

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Wouter for routing
- TanStack Query for data fetching
- React Hook Form + Zod for forms
- Framer Motion for animations
- hCaptcha for bot protection
- React Dropzone for file uploads

**Backend:**
- Node.js + Express
- PostgreSQL (Neon) with Drizzle ORM
- Bcrypt for password hashing
- Express Session for authentication
- Cloudinary for file storage
- Brevo for email delivery
- QRCode generation for verified teams
- ICS file generation for calendar events

## Free Services Used

All services in this application use free tiers:

- **Database**: Neon PostgreSQL (0.5GB free, auto-suspend when idle)
- **File Storage**: Cloudinary (25GB storage + 25GB bandwidth/month)
- **Email**: Brevo (300 emails/day = 9,000/month)
- **CAPTCHA**: hCaptcha (100% free for websites)
- **Hosting**: Can be deployed on Vercel or Replit (both have free tiers)

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

Required environment variables:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - From Cloudinary dashboard
- `BREVO_API_KEY` - From Brevo API settings
- `HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET_KEY` - From hCaptcha dashboard
- `VITE_HCAPTCHA_SITE_KEY` - Same as HCAPTCHA_SITE_KEY (for frontend)
- `SESSION_SECRET` - Random string for session encryption

### 2. Database Setup

\`\`\`bash
npm install
npm run db:push
\`\`\`

### 3. Create Admin Account

The default admin credentials are:
- **Email**: Sm4686771@gmail.com
- **Password**: SUHAS@ADMIN

These will be created automatically on first startup. You can change them in the admin settings later.

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:5000`

## Project Structure

\`\`\`
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and configs
│   │   └── App.tsx      # Main app component
│   └── index.html
├── server/              # Backend Express application
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── db.ts            # Database connection
│   └── index.ts         # Server entry point
├── shared/              # Shared code between frontend and backend
│   └── schema.ts        # Database schema and types
└── design_guidelines.md # Design system documentation
\`\`\`

## API Endpoints

### Public Routes
- `GET /api/settings/public` - Get public event settings
- `POST /api/register` - Register a new team

### Admin Routes (requires authentication)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/admin/teams` - Get all teams with filters
- `PATCH /api/admin/teams/:id/status` - Update team status
- `GET /api/admin/settings` - Get admin settings
- `POST /api/admin/settings` - Update event settings
- `POST /api/admin/upload-qr` - Upload payment QR code

## Design System

The application follows a carefully crafted design system documented in `design_guidelines.md`:

**Colors:**
- Background: #0B0F10 (dark)
- Primary Accent: #00FF85 (neon-green)
- Text Primary: #FFFFFF
- Text Secondary: #C7D2D9

**Typography:**
- Font Family: Inter (400, 500, 600, 700, 800)
- Generous spacing with Tailwind scale

**Components:**
- Glassmorphism cards with backdrop blur
- Smooth hover/active states
- Consistent border radius (rounded-2xl for cards)
- Accessible focus states with green outline

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Build the frontend
- Run the backend as serverless functions
- Provide HTTPS and global CDN

### Replit

The app is already configured to run on Replit. Just click "Run" and it will start on port 5000.

## Admin Features

### Team Verification Workflow

1. New registrations appear as "PENDING" in admin dashboard
2. Admin can view full team details including uploaded documents
3. Click "Verify" to:
   - Update status to "VERIFIED"
   - Generate unique QR code for the team
   - Send acceptance emails to all team members
   - Attach calendar (.ics) file with event details
4. Click "Reject" to:
   - Update status to "REJECTED"
   - Send rejection notification to team contact

### Content Management

Admins can update:
- Event date, time, venue, and address
- Payment QR code (displayed in website footer)
- Future: Schedule, prizes, FAQ, sponsors (coming soon)

## Email Templates

The application sends 3 types of emails:

1. **Organizer Alert** - Sent when new team registers
2. **Acceptance Email** - Sent to all team members when verified (includes QR code + calendar invite)
3. **Rejection Email** - Sent to team contact when rejected

All emails use Brevo's API and are styled to match the brand.

## Security Features

- Bcrypt password hashing for admin authentication
- CSRF protection with express-session
- hCaptcha verification for registrations
- File type and size validation
- Rate limiting on API endpoints
- Input sanitization with Zod schemas
- Secure file storage with Cloudinary

## Contributing

This is an open-source project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

MIT License - See LICENSE file for details

## Support

For questions or support, contact:
- Email: organizer@innovatex.edu
- Admin: Sm4686771@gmail.com

---

Built with ❤️ for Innovate-X 2025
