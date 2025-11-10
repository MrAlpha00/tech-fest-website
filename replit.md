# Innovate-X 2025 - Inter-College Tech Expo Platform

## Overview

This is a production-ready web application for managing an inter-college project exposition. The platform enables teams to register for the event, upload payment proofs and project documents, and provides administrators with a comprehensive dashboard to review, verify, or reject registrations. Upon verification, teams receive automated emails with QR codes and calendar invitations.

The application features a stunning dark-themed public website with neon-green accents, a multi-step registration form with bot protection, and a secure admin portal with team management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing:**
- React 18 with TypeScript for type safety and modern React features
- Wouter for lightweight client-side routing (alternative to React Router)
- Single-page application (SPA) architecture with multiple routes

**State Management & Data Fetching:**
- TanStack Query (React Query) for server state management, caching, and data synchronization
- React Hook Form for performant form state management with minimal re-renders
- Local storage for draft auto-save functionality in registration forms
- CSRF token management at the module level in queryClient.ts

**UI Component System:**
- shadcn/ui component library based on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- Framer Motion for declarative animations and transitions
- Dark theme with glassmorphism effects (rgba backgrounds with backdrop blur)
- Design inspired by Linear (admin dashboard), Stripe (form clarity), and Vercel (marketing)

**Form Handling & Validation:**
- React Hook Form with Zod resolver for schema-based validation
- Multi-step form wizard with progress indicators
- Drag-and-drop file uploads via React Dropzone
- hCaptcha integration for bot protection on registration

**Design System:**
- Primary colors: #0B0F10 (background), #00FF85 (neon-green accent)
- Typography: Inter font family with varying weights (400-800)
- Glassmorphism cards with subtle borders and backdrop blur
- Consistent spacing using Tailwind's spacing scale
- Responsive design with mobile-first approach

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using express-session
- CSRF protection via @dr.pogodin/csurf middleware
- Rate limiting to prevent abuse

**API Design:**
- RESTful API endpoints under /api prefix
- Request/response logging middleware for debugging
- Raw body capture for webhook verification if needed
- JSON and URL-encoded body parsing

**Authentication & Authorization:**
- Bcrypt for password hashing (admin accounts)
- Session cookies with httpOnly and secure flags
- Admin-only routes protected by authentication middleware
- CSRF tokens provided on login and validated on mutations

**File Upload Strategy:**
- Multer for handling multipart/form-data uploads
- In-memory storage during upload processing
- 10MB file size limit enforced

**Request Validation:**
- Zod schemas shared between frontend and backend
- Centralized schema definitions in shared/schema.ts
- Runtime validation of all incoming requests

### Data Storage Solutions

**Database:**
- PostgreSQL hosted on Neon (serverless PostgreSQL)
- Drizzle ORM for type-safe database queries
- Connection pooling via @neondatabase/serverless with WebSocket support

**Schema Design:**
- `admins` - Admin user accounts with bcrypt-hashed passwords
- `teams` - Team registrations with project details and verification status
- `members` - Individual team member information (2-4 per team)
- `eventSettings` - Key-value store for admin-configurable settings
- `auditLogs` - Audit trail of admin actions on teams

**Enums:**
- `category` - SOFTWARE or HARDWARE project categories
- `status` - PENDING, VERIFIED, or REJECTED registration states

**Relationships:**
- One-to-many: teams to members
- Audit logs linked to teams and admin users

**File Storage:**
- Cloudinary for persistent file storage (payment proofs, documents, QR codes)
- Files uploaded via Multer, then transferred to Cloudinary
- URLs stored in database for retrieval

### External Dependencies

**Email Service:**
- Brevo (formerly Sendinblue) for transactional email delivery
- Automated emails on registration verification/rejection
- Attachment support for QR codes (PNG) and calendar events (ICS)

**Bot Protection:**
- hCaptcha for CAPTCHA verification on registration form
- Frontend integration via @hcaptcha/react-hcaptcha
- Token validation on backend before processing registration

**File Storage:**
- Cloudinary for cloud-based file storage
- Configuration via environment variables (cloud_name, api_key, api_secret)
- Automatic URL generation for uploaded assets

**QR Code Generation:**
- QRCode library for generating verification QR codes
- QR codes created upon team verification
- Base64 or buffer output uploaded to Cloudinary

**Calendar Events:**
- ICS library for generating iCalendar files
- Calendar invitations attached to verification emails
- Includes event date, time, venue, and address from admin settings

**Environment Variables Required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Cloudinary credentials
- `HCAPTCHA_SECRET` - hCaptcha secret key
- Brevo API credentials for email delivery

**Development Tools:**
- Vite for fast development server and optimized production builds
- esbuild for server-side bundle compilation
- Drizzle Kit for database schema migrations
- TypeScript compiler for type checking

## Recent Changes (November 10, 2025)

**New Features Implemented:**

1. **CSV Export Functionality**
   - Added GET `/api/admin/export` endpoint for streaming CSV export
   - Uses fast-csv library for efficient streaming
   - Denormalized format: one row per member with all team fields
   - Timestamped filename format: `innovate-x-teams-YYYY-MM-DD.csv`
   - Export button added to admin dashboard toolbar
   - Includes all team and member data for offline analysis

2. **Public Teams Gallery**
   - New `showInGallery` boolean field in teams table (default: false)
   - GET `/api/gallery` public endpoint returns verified teams opted into gallery
   - PATCH `/api/admin/teams/:id/gallery` admin endpoint for visibility toggle
   - New `/gallery` public page with responsive grid layout
   - Gallery cards display: project title, team name, category, verification badge, summary, college, member count, and all team members
   - Admin dashboard "Gallery" column with Switch component for verified teams
   - ImageIcon indicator shows when team is visible in gallery
   - Gallery link added to public navbar
   - Automatic cache invalidation on toggle changes

**Technical Implementation:**
- Database migration added `show_in_gallery` column with default false
- Storage layer methods: `getGalleryTeams()`, `toggleTeamGalleryVisibility()`
- Gallery query uses explicit fetcher for public API access
- CSRF protection on admin gallery toggle endpoint
- Audit logs track gallery visibility changes