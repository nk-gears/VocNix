import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radio, Activity, Shield, LogOut, Lock } from 'lucide-react';
import { getServerSession, getUserDisplayName } from '@/lib/auth/session';
import ThemeToggle from '@/components/ThemeToggle';
import ThemeScript from '@/components/ThemeScript';

export const metadata: Metadata = {
  title: 'VocNix — Real-Time Audio Translation Platform',
  description: 'Real-time human audio translation platform delivering browser microphone audio directly to audiences worldwide.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const displayName = getUserDisplayName(session);

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col min-h-screen transition-colors duration-150">
        <header className="border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">VocNix</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  REAL-TIME AUDIO
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
              <Link
                href="/#about"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                About
              </Link>

              <Link
                href="/#features"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                Features
              </Link>

              <Link
                href="/#support"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                Support
              </Link>

              {/* Authenticated as Admin: Only display Admin Dashboard */}
              {session?.role === 'admin' && (
                <>
                  <Link
                    href="/dashboard"
                    className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition flex items-center space-x-1.5"
                  >
                    <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Dashboard</span>
                  </Link>

                  <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                        Admin
                      </span>
                      <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">
                        {displayName}
                      </span>
                    </div>

                    <a
                      href="/api/auth/logout"
                      className="text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </a>
                  </div>
                </>
              )}

              {/* Authenticated as Super Admin: Only display Super Admin Console */}
              {session?.role === 'super_admin' && (
                <>
                  <Link
                    href="/admin"
                    className="text-amber-600 hover:text-amber-700 dark:text-amber-400/90 dark:hover:text-amber-300 transition flex items-center space-x-1.5 font-semibold"
                  >
                    <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Super Admin</span>
                  </Link>

                  <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold">
                        Super Admin
                      </span>
                      <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300">
                        {displayName}
                      </span>
                    </div>

                    <a
                      href="/api/auth/logout"
                      className="text-slate-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Log Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </a>
                  </div>
                </>
              )}

              {/* Unauthenticated: Separate Admin and Super Admin login links */}
              {!session && (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/admin/login"
                    className="text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center space-x-1.5 font-medium shadow-sm text-xs sm:text-sm"
                  >
                    <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Admin</span>
                  </Link>

                  <Link
                    href="/super-admin/login"
                    className="text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-500/10 hover:bg-amber-500/20 transition flex items-center space-x-1.5 font-medium shadow-sm text-xs sm:text-sm"
                  >
                    <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Super Admin</span>
                  </Link>
                </div>
              )}

              {/* Theme Switcher Toggle */}
              <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 transition-colors">
          <p>© 2026 VocNix Real-Time Audio Platform. Real-Time Human Translation Audio.</p>
        </footer>
      </body>
    </html>
  );
}
