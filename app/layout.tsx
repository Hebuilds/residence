import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Archivo, Great_Vibes } from 'next/font/google';
import Providers from '@/components/providers/Providers';
import './globals.css';
import './styles/intro.css';
import './styles/sections.css';

const melodrama = localFont({
  src: [
    { path: './fonts/Melodrama-300.woff2', weight: '300' },
    { path: './fonts/Melodrama-400.woff2', weight: '400' },
    { path: './fonts/Melodrama-500.woff2', weight: '500' },
    { path: './fonts/Melodrama-600.woff2', weight: '600' },
  ],
  variable: '--font-melodrama',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const script = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ituze Residence · Lake Kivu',
  description:
    'Thirty eight residences on the hills above Gisenyi, facing west across Lake Kivu. Villas, terrace houses and apartments from 118 to 342 m².',
};

export const viewport: Viewport = {
  themeColor: '#F3F0E9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`is-loading ${melodrama.variable} ${archivo.variable} ${script.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
