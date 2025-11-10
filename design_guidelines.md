# Design Guidelines for Innovate-X Expo Platform

## Design Approach
**Reference-Based + Design System Hybrid**: Drawing inspiration from modern tech platforms like Linear (for admin dashboard), Stripe (for form clarity), and Vercel (for marketing aesthetic) with glassmorphism treatments popular in web3/tech events.

## Core Design Elements

### A. Typography
**Font Family**: Inter (Google Fonts)
- **Hero Headlines**: Font weight 800, size 4xl-6xl (responsive), letter-spacing tight, line-height 1.1
- **Section Headings**: Font weight 700, size 2xl-4xl, neon-green (#00FF85) accent
- **Body Text**: Font weight 400, size base-lg, subtle gray (#C7D2D9), line-height 1.6
- **Form Labels**: Font weight 500, size sm, uppercase tracking-wide
- **Button Text**: Font weight 600, size base, letter-spacing normal
- **Code/Stats**: Font weight 700, size 3xl-5xl, tabular numbers

### B. Layout System
**Spacing Units**: Tailwind scale - predominantly 4, 6, 8, 12, 16, 20, 24, 32 for consistency
- **Section Padding**: py-20 md:py-32 for major sections
- **Container**: max-w-7xl mx-auto px-6 for content containment
- **Component Spacing**: gap-6 to gap-12 for grids
- **Form Fields**: mb-6 for vertical rhythm

### C. Color System
- **Background**: #0B0F10 (primary dark)
- **Accent**: #00FF85 (neon-green for CTAs, highlights, borders)
- **Text Primary**: #FFFFFF (headings, important content)
- **Text Secondary**: #C7D2D9 (body, descriptions)
- **Surface**: rgba(255,255,255,0.05) for glassmorphism cards
- **Border**: rgba(0,255,133,0.2) for subtle green glows
- **Error**: #FF4444, Success: #00FF85, Warning: #FFB800

### D. Component Library

**Glassmorphism Cards**:
- Background: rgba(255,255,255,0.05) with backdrop-blur-xl
- Border: 1px solid rgba(255,255,255,0.1)
- Border-radius: rounded-2xl (1rem)
- Shadow: soft glow with rgba(0,255,133,0.1)
- Hover: subtle scale-105 transform with border glow intensification

**Buttons**:
- Primary CTA: neon-green background, black text, px-8 py-4, rounded-xl, font-semibold
- Secondary: transparent with neon-green border, green text, same padding
- Ghost: no border, green text, subtle hover background
- Disabled: 50% opacity, no interactions

**Forms**:
- Input fields: dark background (#1A1F24), green border on focus, rounded-lg, p-4
- Multi-step indicator: horizontal progress bar with green fill, numbered circles
- File upload: dashed border dropzone, preview thumbnails in grid
- Validation: inline error messages in red below fields, success checkmark in green

**Navigation**:
- Fixed header with glassmorphism background on scroll
- Logo left, nav links center, CTA button right
- Mobile: hamburger menu with slide-in drawer

**Data Tables (Admin)**:
- Alternating row colors with hover highlight
- Sticky header, sortable columns with icons
- Action buttons (Verify/Reject) with color coding
- Search bar and filter dropdowns above table

**Modals/Dialogs**:
- Centered overlay with glassmorphism card
- Close button top-right, actions bottom-right
- Max-width-2xl, p-8

### E. Page-Specific Layouts

**Landing Page** (5-7 sections):
1. **Hero**: Full viewport height, centered content with large heading "Build. Break. Brag.", animated gradient lines background, dual CTAs (Register Team + View Brochure), trust indicator "500+ Students | 50+ Projects"
2. **Event Info**: 3-column grid (Date/Time, Location/Venue, Categories) with icons
3. **Tracks & Prizes**: Cards showcasing Software/Hardware tracks, prize amounts with neon-green highlights
4. **Schedule**: Timeline layout with time markers on left, activities on right
5. **FAQ**: Accordion component with expand/collapse animations
6. **Sponsors**: Logo grid (4 columns desktop, 2 mobile) with grayscale-to-color hover
7. **Footer**: 3-column layout (Quick Links, Contact Info with payment QR, Social Icons), newsletter signup optional

**Registration Form** (Multi-step):
- Step indicator at top (Team → Members → Uploads → Review)
- Progress bar showing completion percentage
- Form sections in glassmorphism cards with generous padding
- Dynamic member fields (Add Member button, Remove icon)
- File upload with drag-drop, image previews, file size/type indicators
- Navigation buttons: Back (secondary), Next/Submit (primary), positioned bottom-right
- Save draft indicator in top-right corner

**Admin Dashboard**:
- Sidebar navigation (Teams, Analytics, Settings, Logout)
- Top bar with search, filters (Category, Status, Date range), export button
- Main content area with data table
- View modal: split layout (left: team details, right: uploaded images/documents)
- Action panel in modal footer with Verify/Reject buttons and notes textarea

### F. Animations
**Use sparingly**:
- Hero: subtle gradient animation on background lines
- Cards: scale-105 on hover, duration 200ms
- Page transitions: fade-in with slide-up for sections (Framer Motion)
- Form steps: slide transitions between steps
- Success states: checkmark animation, confetti (on submission)

## Images
**Large Hero Image**: NO - use animated gradient lines/geometric patterns instead
**Other Images**:
- Event venue photo in Event Info section (rounded-2xl, subtle border glow)
- Past event gallery (3-4 images in grid) in optional "Previous Edition" section
- Team photos in optional "Teams Gallery" (after verification, opt-in)
- Sponsor logos as mentioned above
- Admin uploaded payment QR code displayed in footer contact section

## Accessibility
- All form inputs with proper labels and aria-attributes
- Focus outlines: 2px solid neon-green with offset
- Keyboard navigation: Tab order logical, Enter to submit forms
- Color contrast: WCAG AA compliant (white text on dark, sufficient contrast for green accents)
- Screen reader announcements for form validation and success states