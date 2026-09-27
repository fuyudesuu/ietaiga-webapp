import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PlannerProvider } from "@/lib/encore/store";
import { AppShell } from "@/components/encore/shell";
import { withBasePath } from "@/lib/encore/paths";

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
    icon: withBasePath("/favicon.svg"),
    shortcut: withBasePath("/favicon.svg"),
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
