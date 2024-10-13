import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
// Import the font
import { Fira_Code } from 'next/font/google'

// Initialize the font
const firaCode = Fira_Code({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "🐟",
  description: "A photo album of our travels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`antialiased ${firaCode.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
