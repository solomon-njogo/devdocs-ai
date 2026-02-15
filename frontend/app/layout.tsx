import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthGuard } from "@/components/AuthGuard";
import { SupabaseEnvProvider } from "@/components/SupabaseEnvProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevDocs AI",
  description: "AI-powered Development Documentation Assistant",
};

/** Inline script to set .dark before paint to avoid flash. Must match ThemeProvider storage key. */
const themeScript = `
(function() {
  var key = 'devdocs-theme';
  var stored = localStorage.getItem(key);
  var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  var resolved = stored === 'dark' || stored === 'light' ? stored : system;
  if (resolved === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-ui antialiased`}
        suppressHydrationWarning
      >
        <SupabaseEnvProvider
          url={supabaseUrl}
          anonKey={supabaseAnonKey}
        >
          <ThemeProvider>
            <AuthGuard>{children}</AuthGuard>
          </ThemeProvider>
        </SupabaseEnvProvider>
      </body>
    </html>
  );
}
