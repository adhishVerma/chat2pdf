import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner"
import QueryProvider from "@/components/QueryProvider";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});


export const metadata: Metadata = {
  title: "Chat-pdf",
  description: "Made with love by helix",
  // the favicon comes from src/app/icon.png (a small copy of the logo)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <QueryProvider>
          <body className={cn(
            "bg-background font-sans antialiased",
            fontSans.variable
          )}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster />
              <div className="flex flex-col overflow-hidden h-dvh">
                <Header />
                <div className="p-2 grow relative">
                  <div className="absolute top-0 left-0 h-full w-full">
                    {children}
                  </div>
                </div>
              </div>
            </ThemeProvider>
          </body>
        </QueryProvider >
      </html>
  );
}
