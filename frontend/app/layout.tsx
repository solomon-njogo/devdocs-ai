import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const defaultTitle = "DevDocs AI — AI documentation for engineering teams";
const defaultDescription =
  "Turn GitHub repositories and product briefs into clear, structured technical documentation. Built for engineering teams—readable by your people and by the AI assistants they use every day.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | DevDocs AI",
  },
  description: defaultDescription,
  keywords: [
    "AI documentation",
    "technical documentation",
    "GitHub documentation",
    "engineering documentation",
    "developer docs",
    "DevDocs AI",
  ],
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: "website",
    url: "/",
    siteName: "DevDocs AI",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
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
            {children}
          </ThemeProvider>
        </SupabaseEnvProvider>
      </body>
    </html>
  );
}
