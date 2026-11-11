import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';
import '../../../public/workspace-theme.css';
import { themeScript } from '../../../shared/theme.mjs';

export const metadata: Metadata = {
  title: 'SlothAI — Azərbaycan dili mətn düzəldici',
  description: 'Azərbaycan mətnini brauzerdə, AI və API açarı olmadan qaydalarla düzəldin.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="az" data-app="sloth-ai" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
