import type { Metadata } from "next";
import "./globals.css";

// Using system fonts to avoid Edge Runtime compatibility issues
// System fonts don't require __dirname or external font loading

export const metadata: Metadata = {
  title: "ArticleFlow - AI-Powered Article Generation",
  description: "Generate high-quality technical articles for Medium, Dev.to, and more using Claude and Gemini AI",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
