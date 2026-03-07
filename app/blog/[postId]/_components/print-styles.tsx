"use client";

/**
 * Print Styles Component
 * Adds print-optimized CSS for blog posts
 */
export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        /* Page setup */
        @page {
          size: A4;
          margin: 2cm 1.5cm;
        }

        /* Global resets */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          background: #fff !important;
        }

        /* Hide non-essential elements */
        header,
        nav,
        footer,
        aside,
        .no-print,
        button,
        [role='banner'],
        [role='navigation'],
        [role='complementary'] {
          display: none !important;
        }

        /* Hide interactive elements */
        .share-button,
        .bookmark-button,
        .comment-section,
        .related-posts,
        .toolbar,
        .reading-progress,
        .theme-switcher,
        .scroll-to-top {
          display: none !important;
        }

        /* Main content */
        main,
        article,
        .post-content {
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          float: none !important;
        }

        /* Typography */
        h1 {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 12pt;
          page-break-after: avoid;
        }

        h2 {
          font-size: 18pt;
          font-weight: bold;
          margin-top: 18pt;
          margin-bottom: 8pt;
          page-break-after: avoid;
        }

        h3 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 12pt;
          margin-bottom: 6pt;
          page-break-after: avoid;
        }

        h4,
        h5,
        h6 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 10pt;
          margin-bottom: 4pt;
          page-break-after: avoid;
        }

        p {
          margin-bottom: 8pt;
          orphans: 3;
          widows: 3;
          text-align: justify;
        }

        /* Links */
        a {
          color: #000;
          text-decoration: underline;
        }

        a[href^='http']:after {
          content: ' (' attr(href) ')';
          font-size: 9pt;
          font-style: italic;
        }

        a[href^='#']:after,
        a[href^='javascript:']:after {
          content: '';
        }

        /* Images */
        img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid;
          page-break-after: auto;
        }

        /* Code blocks */
        pre,
        code {
          background: #f5f5f5 !important;
          border: 1px solid #ddd !important;
          page-break-inside: avoid;
          font-family: 'Courier New', monospace;
          font-size: 10pt;
        }

        pre {
          padding: 8pt;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        code {
          padding: 2pt 4pt;
        }

        /* Tables */
        table {
          border-collapse: collapse;
          width: 100%;
          page-break-inside: avoid;
          margin: 12pt 0;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 6pt;
          text-align: left;
        }

        th {
          background: #f5f5f5 !important;
          font-weight: bold;
        }

        /* Blockquotes */
        blockquote {
          border-left: 3pt solid #ddd;
          padding-left: 12pt;
          margin: 12pt 0;
          font-style: italic;
          page-break-inside: avoid;
        }

        /* Lists */
        ul,
        ol {
          margin: 8pt 0;
          padding-left: 20pt;
        }

        li {
          margin-bottom: 4pt;
        }

        /* Page breaks */
        .page-break {
          page-break-before: always;
        }

        .avoid-break {
          page-break-inside: avoid;
        }

        /* Post header */
        .post-header {
          margin-bottom: 24pt;
          padding-bottom: 12pt;
          border-bottom: 2pt solid #000;
        }

        .post-title {
          font-size: 28pt;
          font-weight: bold;
          margin-bottom: 8pt;
        }

        .post-meta {
          font-size: 10pt;
          color: #666;
          margin-bottom: 8pt;
        }

        .post-description {
          font-size: 12pt;
          font-style: italic;
          margin-bottom: 12pt;
        }

        /* Chapter headings */
        .chapter-heading {
          font-size: 16pt;
          font-weight: bold;
          margin-top: 18pt;
          margin-bottom: 10pt;
          page-break-after: avoid;
          border-bottom: 1pt solid #ccc;
          padding-bottom: 4pt;
        }

        /* Footer info */
        .print-footer {
          display: block !important;
          position: fixed;
          bottom: 0;
          width: 100%;
          font-size: 9pt;
          color: #666;
          text-align: center;
          border-top: 1pt solid #ddd;
          padding-top: 4pt;
        }

        /* QR code or print-specific elements */
        .print-only {
          display: block !important;
        }

        /* Optimize shadows and effects */
        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }

        /* Remove backgrounds from most elements */
        div:not(.code-block):not(.highlight) {
          background: transparent !important;
        }
      }
    `}</style>
  );
}

/**
 * Component to add print-specific content
 */
interface PrintHeaderProps {
  title: string;
  author?: string;
  date?: string;
  url?: string;
}

export function PrintHeader({ title, author, date, url }: PrintHeaderProps) {
  return (
    <div className="print-only hidden">
      <div className="post-header">
        <h1 className="post-title">{title}</h1>
        <div className="post-meta">
          {author && <span>By {author}</span>}
          {author && date && <span> • </span>}
          {date && <span>{date}</span>}
        </div>
        {url && (
          <div className="post-meta">
            <span>Source: {url}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Print footer with page numbers and metadata
 */
export function PrintFooter({ title }: { title: string }) {
  return (
    <div className="print-footer hidden">
      <p suppressHydrationWarning>{title} • Printed {new Date().toLocaleDateString()}</p>
    </div>
  );
}
