import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenSearch Explorer',
  description: 'Search interface for AWS OpenSearch Serverless',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            const d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (d) document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
