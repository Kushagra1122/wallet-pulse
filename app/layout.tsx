import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallet Pulse — Live pass updates",
  description: "Issue and update a Google Wallet generic pass in place.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
