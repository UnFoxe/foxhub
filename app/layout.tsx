// layout.tsx
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthGuard from './components/AuthGuard'; 
import { AuthProvider } from '@/src/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata = {
  title: 'My Personal Hub',
  description: 'Личный сайт с инструментами',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} flex h-screen bg-[#F3F3F3] dark:bg-[#11121E] text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden transition-colors duration-200`}>
        
        {/* Провайдеры - ОДИН РАЗ, в самом верху */}
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            
            <Sidebar />

            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-[#F3F3F3] dark:bg-[#11121E] p-8">
                <div className="w-full">
                  <AuthGuard>
                    {children}
                  </AuthGuard>
                </div>
              </main>
            </div>

          </ThemeProvider>
        </AuthProvider>

      </body>
    </html>
  );
}