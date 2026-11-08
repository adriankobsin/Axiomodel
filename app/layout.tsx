import type { Metadata } from "next";
import "./globals.css";
import { SiteNav, Footer } from "@/components/ui";
import { site } from "@/lib/site";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Find the best AI model for any job`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-5">{children}</main>
        <Footer catalog={catalog} />
      </body>
    </html>
  );
}
