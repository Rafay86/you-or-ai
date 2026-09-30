import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'You, AI, or Both? Studio — Executive Transformation Plan',
  description: 'Turn business workflows into practical, measurable AI transformation plans.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-warmwhite">{children}</body>
    </html>
  );
}
