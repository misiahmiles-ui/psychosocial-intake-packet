import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adult Day Intake Pro",
  description:
    "White-label digital intake packets for adult day and adult medical day care programs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
