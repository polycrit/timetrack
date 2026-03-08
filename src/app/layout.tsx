import type { Metadata } from "next";
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TimeTrack",
  description: "Personal productivity and time tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pressStart.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans antialiased noise-bg`}
      >
        <ThemeProvider>
          <div className="relative z-10 flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-4 py-4 pt-16 md:px-6 md:py-6 md:pt-6 lg:px-8">{children}</main>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                boxShadow:
                  "inset 0 1px 0 0 rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.08)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
