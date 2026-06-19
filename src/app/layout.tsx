import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdVerdict — Multi-Agent Ad Review",
  description:
    "AdVerdict reviews ad creatives with a team of AI agents collaborating through Band. By Nexora AI.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
