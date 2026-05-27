// Header.tsx
"use client";
import { useAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Calendar, User, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link"; // Импортируем Link для навигации

const routeLabels: Record<string, string> = {
  "": "Главная",
  "files": "Хранилище файлов",
  "passwords": "Менеджер паролей",
  "notes": "Личные заметки",
  "minecraft": "Minecraft Сервер",
  "pc": "Мониторинг ПК",
  "profile": "Профиль", // Добавили метку для отображения в H1
};

export default function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dateTime, setDateTime] = useState({ time: "", date: "" });
  
  // Больше не вызываем logout здесь, убираем деструктуризацию, оставляем только импорт контекста если нужен

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString("ru-RU", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      
      const dateStr = now.toLocaleDateString("ru-RU", { 
        day: "numeric", 
        month: "short",
        weekday: "short"
      });

      setDateTime({ time: timeStr, date: dateStr });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentSegment = pathname.split("/").filter(Boolean).pop() || "";
  const pageTitle = routeLabels[currentSegment] || "Дашборд";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/40 px-8 backdrop-blur-xl transition-colors duration-200">
      
      {/* Левая часть: Заголовок и Индикатор */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {pageTitle}
        </h1>
        <div className="hidden items-center space-x-2 rounded-full bg-zinc-200/50 dark:bg-zinc-800/40 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300/40 dark:border-zinc-700/30 lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>Online</span>
        </div>
      </div>

      {/* Правая часть: Дата, Время, Переключатель темы и Профиль */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        
        {/* Виджет Дата + Время */}
        <div className="flex items-center space-x-3 text-zinc-500 dark:text-zinc-400 bg-zinc-200/30 dark:bg-zinc-900/30 border border-zinc-300/50 dark:border-zinc-800/60 rounded-xl px-3 py-1.5 text-xs font-medium shadow-inner">
          <Calendar className="h-3.5 w-3.5 text-blue-500/70" />
          <div className="flex items-center space-x-2">
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold font-mono">{dateTime.time || "--:--"}</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px] capitalize">{dateTime.date || "---, -- ---"}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800/60" />

        {/* Интерактивная Кнопка Переключения Темы */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all active:scale-95"
          aria-label="Переключить тему оформления"
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500 animate-fade-in" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-700 animate-fade-in" />
            )
          ) : (
            <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          )}
        </button>

        {/* Ссылка на Профиль вместо кнопки логаута */}
        <Link 
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 p-0.5 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Профиль"
        >
          <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white dark:bg-zinc-950">
            <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
        </Link>

      </div>
    </header>
  );
}