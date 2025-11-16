import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FluxA MCP Configuration",
  description: "Configure pricing for your MCP proxy server with FluxA payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProviders>{children}</ClientProviders>
          <ThemeSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
