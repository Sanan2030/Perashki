import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "../../../../public/workspace-theme.css";
import { themeScript } from "../../../../shared/theme.mjs";

export const metadata: Metadata = {
  title: "ArtıSaat — Əlavə iş saatları",
  description:
    "Əlavə iş saatlarınızı qeyd edin, gəlirinizi hesablayın və Excel hesabatınızı hazırlayın.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az" data-app="overtimer" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
