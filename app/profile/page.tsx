"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { User, LogOut, ShieldCheck } from "lucide-react";
import { getYandexSession, loginWithYandex } from "./actions";
// Импортируем клиентский метод выхода NextAuth
import { signOut as yandexSignOut } from "next-auth/react";

export default function ProfilePage() {
  const { user, signOut } = useAuth(); // Это деавторизация Supabase
  const [yandexEmail, setYandexEmail] = useState<string | null>(null);
  const [isYandexLoading, setIsYandexLoading] = useState(true);

  // Мягкая фоновая проверка сессии Яндекса
  useEffect(() => {
    async function checkYandex() {
      try {
        const session = await getYandexSession();
        if (session?.accessToken) {
          setYandexEmail(session.user?.email || session.user?.name || "Подключено");
        }
      } catch (err) {
        console.error("Ошибка при чтении сессии Яндекса:", err);
      } finally {
        setIsYandexLoading(false);
      }
    }
    checkYandex();
  }, []);

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
        
        {/* Информация о пользователе Hub */}
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

        {/* БЛОК: УПРАВЛЕНИЕ ЯНДЕКС ДИСКОМ В ПРОФИЛЕ */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <label className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-3">
            Внешние интеграции
          </label>
          
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#11121E] border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">☁️</span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Яндекс Диск</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {isYandexLoading ? (
                    <span className="animate-pulse text-zinc-400">Проверка...</span>
                  ) : yandexEmail ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Подключен ({yandexEmail})
                    </span>
                  ) : (
                    "Синхронизация отключена"
                  )}
                </p>
              </div>
            </div>

            {!isYandexLoading && (
              yandexEmail ? (
                <button
                  onClick={async () => {
                    setIsYandexLoading(true);
                    // ИСПРАВЛЕНО: используем встроенный клиентскийsignOut от NextAuth с автоматическим редиректом
                    await yandexSignOut({ callbackUrl: "/profile" });
                  }}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/40 rounded-xl transition cursor-pointer"
                >
                  Отключить
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (user?.email) {
                      await loginWithYandex(user.email);
                    }
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Подключить
                </button>
              )
            )}
          </div>
        </div>

        {/* Кнопка глобального логаута из Supabase */}
        <button
          onClick={() => signOut()}
          className="mt-8 w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-sm font-bold rounded-xl transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Выйти из аккаунта Hub</span>
        </button>

      </div>
    </div>
  );
}