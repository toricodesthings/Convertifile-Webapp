// src/app/layout.tsx
import './globals.css';
import { Lexend } from 'next/font/google';
import { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next'; // <-- updated import path
import Navbar from '@/components/Navbar/Navbar';
import { ThemeProvider } from '@/context/ThemeContext';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'Your App Title',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        <div className='content'>
          <ThemeProvider>
            <Navbar />

            {children}

          </ThemeProvider>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
