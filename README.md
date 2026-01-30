# Resume Builder

A modern resume builder application built with Next.js, TypeScript, and Tailwind CSS. Create professional resumes with real-time preview and export to PDF.

## Features

- Real-time resume preview
- Client-side data persistence (localStorage)
- Single shared React template for preview and PDF generation
- Pixel-perfect PDF export via Puppeteer
- Responsive design with Tailwind CSS

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand** - State management with localStorage persistence
- **Puppeteer** - PDF generation
- **Lucide React** - Icons

## Project Structure

```
resume/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Main page
│   │   ├── globals.css       # Global styles
│   │   └── api/
│   │       └── pdf/
│   │           └── route.ts  # PDF generation API
│   ├── components/
│   │   ├── forms/            # Form components
│   │   ├── ui/               # UI components
│   │   ├── Sidebar.tsx       # Left sidebar with forms
│   │   ├── Header.tsx        # Top bar with download button
│   │   └── ResumePreview.tsx # Preview wrapper
│   ├── templates/
│   │   ├── ResumeTemplate.tsx  # Shared resume template (used for preview & PDF)
│   │   └── resumeStyles.ts     # CSS styles for resume
│   ├── store/
│   │   └── useResumeStore.ts   # Zustand store
│   └── types/
│       └── resume.ts           # TypeScript interfaces
├── package.json
└── next.config.ts
```

## Key Architecture Decisions

### Shared Template Approach

The resume template is a single React component (`ResumeTemplate.tsx`) that accepts data via props. This allows the same component to be used:

- On the client for real-time preview
- On the server for PDF generation via `renderToStaticMarkup()`

This ensures pixel-perfect consistency between preview and PDF output.

### PDF Generation Flow

1. User clicks "Download PDF"
2. Client sends resume data to `/api/pdf` endpoint
3. Server uses `renderToStaticMarkup()` to convert React component to HTML
4. Puppeteer renders HTML and generates PDF
5. PDF is sent back to client for download

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. Fill in your personal information in the left sidebar
2. Add work experience, education, skills, and languages
3. See real-time preview on the right
4. Click "Download PDF" to export your resume
5. Your data is automatically saved in the browser's localStorage

## Data Persistence

All resume data is stored in the browser's localStorage using Zustand's persist middleware. Your data will be preserved across page refreshes and browser sessions.

## Customization

### Adding New Resume Templates

1. Create a new template component in `src/templates/`
2. Follow the same props-based pattern as `ResumeTemplate.tsx`
3. Update the PDF generation route to use the new template

### Styling

The resume template uses inline CSS defined in `src/templates/resumeStyles.ts`. This ensures consistent rendering in both browser and PDF output.

For UI components, Tailwind CSS utility classes are used.

## License

MIT
