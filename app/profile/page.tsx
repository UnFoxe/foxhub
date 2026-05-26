"use client";

import { useAuth } from "@/src/context/AuthContext";
import { User, LogOut, Mail, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-sm font-semibold text-zinc-500 animate-pulse">
          Загрузка профиля...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      <div className="rounded-3xl bg-white dark:bg-[#1D1D29] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Ваш профиль</h2>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Авторизованы</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#11121E] border border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Email адрес</label>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 font-mono">
              {user.email}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="mt-8 w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-all active:scale-95 border border-rose-200 dark:border-rose-900/30"
        >
          <LogOut className="h-4 w-4" />
          Выйти из системы
        </button>
      </div>
    </div>
  );
}