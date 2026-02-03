# Resume Builder

A modern resume builder application built with Next.js, TypeScript, and Tailwind CSS. Create professional resumes with real-time preview and export to PDF.

## Features

- ⚡ Real-time resume preview
- 💾 Client-side data persistence (localStorage)
- 🎯 Single shared React template for preview and PDF generation
- 📄 Pixel-perfect PDF export via Puppeteer
- 🎨 Responsive design with Tailwind CSS
- 🚀 **Optimized PDF generation with browser pooling**
- 🛡️ **Rate limiting for API protection**
- ⏱️ **Sub-5-second PDF generation with timeouts**
- 📊 **Health monitoring endpoint**

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
3. **Middleware** checks rate limit (10 per 3 minutes) ← _NEW: At edge, before processing_
4. Server validates data with Zod
5. Server uses `renderToStaticMarkup()` to convert React component to HTML
6. **Browser pool** provides a reusable Puppeteer instance
7. Puppeteer renders HTML and generates PDF (with timeout)
8. PDF is sent back to client for download
9. Browser is released back to the pool for reuse

### Performance Optimizations

#### Browser Pooling
- Reuses 1-5 browser instances instead of launching new ones
- **5-10x faster** after initial request (1-2s vs 3-4s)
- Handles 30-40 concurrent requests efficiently
- Auto-cleanup of disconnected browsers

#### Rate Limiting (Middleware)
- **Implemented as Next.js middleware** for better performance
- Early rejection of rate-limited requests (before API processing)
- Protects against abuse: 10 requests per 3 minutes per IP
- Returns helpful error messages with retry timing
- In-memory tracking (upgrade to Redis for multi-server)
- Centralized logic, easy to extend to multiple endpoints

#### Timeouts
- Page load: 3 seconds
- PDF generation: 4 seconds
- Total SLA: < 5 seconds
- Graceful error handling

See `IMPROVEMENTS.md` for detailed implementation notes.

## Getting Started

### Prerequisites

For PDF generation to work, you need Chromium and its dependencies:

#### Ubuntu/Debian
```bash
sudo apt-get update && sudo apt-get install -y \
  chromium-browser \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils
```

#### macOS
```bash
# Chromium comes bundled with Puppeteer
# No additional installation needed
```

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

### Testing PDF Generation

```bash
# Generate a test PDF
curl -X POST http://localhost:3000/api/pdf \
  -H "Content-Type: application/json" \
  -d @test-data.json \
  --output test-resume.pdf

# Check system health
curl http://localhost:3000/api/health | jq
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

## Performance & Scalability

### Current Capacity
- **10K PDF/day**: Optimal with 2 vCPU, 4 GB RAM
- **30K PDF/day**: Comfortable with 4 vCPU, 8 GB RAM (recommended)
- **50K+ PDF/day**: Requires scaling (see documentation)

### Recommended Server
- **Hetzner CPX31**: 4 vCPU, 8 GB RAM (~$19/month)
- Handles 10K-40K PDF/day
- 3-4x growth capacity

See `PDF_GENERATION.md` for detailed architecture, monitoring, and scaling strategies.

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Returns:
- System status
- Browser pool statistics
- Rate limit stats
- Memory usage
- Recommendations

### Key Metrics
- PDF generation time: Target < 5s (typically 1-3s)
- Browser pool utilization
- Rate limit hits
- Error rates

## Documentation

- `README.md` - This file (quick start)
- `IMPROVEMENTS.md` - Implementation details and testing
- `MIDDLEWARE.md` - Middleware architecture and configuration
- `PDF_GENERATION.md` - Complete architecture and deployment guide

## Troubleshooting

### "Browser acquisition timeout"
→ All browsers busy. Check CPU/RAM or increase pool size.

### "Page load timeout"
→ Content too large or slow network. Check HTML size.

### High memory usage
→ Check browser pool stats, reduce max browsers, or restart.

See `PDF_GENERATION.md` for complete troubleshooting guide.

## License

MIT
