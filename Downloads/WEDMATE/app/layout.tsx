import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WEDMATE - Portal Layanan & Manajemen Pernikahan',
  description: 'Aplikasi internal wedding organizer: manajemen booking paket, checklist persiapan pernikahan, dan verifikasi pembayaran resmi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`scroll-smooth ${plusJakartaSans.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#333333] font-sans antialiased selection:bg-[#C8A46A]/20 selection:text-[#333333]">
        <AuthProvider>
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
