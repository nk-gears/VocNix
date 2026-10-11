'use client';

import Link from 'next/link';
import { Activity, Shield, ArrowRight, Lock } from 'lucide-react';

export default function CommonLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>AUTHENTICATION PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Select Your Login Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Choose your designated portal below to sign in to your platform console.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Admin Card */}
          <Link
            href="/admin/login"
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-3xl p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition">
                <Activity className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Tenant Portal
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Admin Login
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sign in to manage event language channels, translators, listener statistics, and live sessions.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center space-x-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Go to Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Super Admin Card */}
          <Link
            href="/super-admin/login"
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/60 rounded-3xl p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Platform Command Center
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  Super Admin Login
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Restricted portal for platform governance, all organizations, subscription plans, and platform revenue.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center space-x-2 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Go to Super Admin Login</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
