import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlannerProvider } from "@/lib/encore/store";
import { AppShell } from "@/components/encore/shell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Encore Mobile — Concerts & journeys",
  description:
    "Your concerts, ticket deadlines, and travels, thoughtfully together. An interactive prototype with sample data.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
        <PlannerProvider>
          <AppShell>{children}</AppShell>
        </PlannerProvider>
      </body>
    </html>
  );
}
