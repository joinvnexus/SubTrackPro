import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/query-provider";
import { AuthProviderWrapper } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubTrack Pro - Subscription Analytics Dashboard",
  description: "Track all your digital subscriptions, view monthly and yearly cost analytics, and get renewal reminders.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProviderWrapper>
              {children}
              <Toaster />
            </AuthProviderWrapper>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
