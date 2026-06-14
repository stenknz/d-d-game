import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "AI Dungeon Master",
  description: "A local AI-powered Dungeon Master for D&D 5.5e (2024).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-body">
        <div className="relative min-h-screen">{children}</div>
      </body>
    </html>
  );
}
