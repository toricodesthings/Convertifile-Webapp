// src/app/layout.tsx
import './globals.css';
import { Lexend } from 'next/font/google';
import { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/react"
import Navbar from '@/components/Navbar/Navbar';
import { ThemeProvider } from '@/context/ThemeContext';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'Convertifile',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Analytics />
      <body className={lexend.className}>
        <ThemeProvider>
          <div className='app-container'>
            <Navbar />
            <div className='app-content'>
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
