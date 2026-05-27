"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, Key, Notebook, Laptop, Menu, ChevronLeft, ChevronDown, Cloud } from 'lucide-react'; 
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isCloudOpen, setIsCloudOpen] = useState(false);

  // Разделим на обычные пункты и облачные
  const cloudItems = [
    { name: 'Яндекс.Диск', href: '/yandex', icon: Folder },
    { name: 'Google.Drive', href: '/google', icon: Folder },
  ];

  const menuItems = [
    { name: 'Менеджер паролей', href: '/passwords', icon: Key },
    { name: 'Доска ToDo', href: '/notes', icon: Notebook },
    { name: 'Мой компьютер', href: '/pc', icon: Laptop },
    { name: 'Minecraft Сервер', href: '/minecraft', icon: Laptop },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-24'} transition-all duration-300 bg-zinc-50 dark:bg-[#1d1d29] border-r border-zinc-200/70 dark:border-zinc-800/50 flex flex-col h-screen`}>
      
      {/* Шапка */}
      <div className="p-5 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/40 h-[100px]">
        {isOpen && (
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-16 h-16">
              <Image 
  src="/assets/img/fox.png" 
  alt="FoxHub" 
  fill 
  className="object-contain" 
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // 1. Fixes the sizing warning
  priority                                                        // 2. Fixes the LCP warning
/>
            </div>
            <span className="font-bold text-2xl text-zinc-900 dark:text-white">FoxHub</span>
          </Link>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all ${!isOpen ? 'mx-auto' : ''}`}
        >
          {isOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

    {/* Меню */}
<nav className="flex-1 p-4 space-y-1.5">
  {/* Пункт Облако */}
  <div>
    <button 
      onClick={() => setIsCloudOpen(!isCloudOpen)}
      className={`w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all ${
        cloudItems.some(item => pathname === item.href) 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10'
      } ${isOpen ? 'justify-between' : 'justify-center'}`}
    >
      <div className="flex items-center space-x-3">
        <Cloud className={`w-5 h-5 ${cloudItems.some(item => pathname === item.href) ? 'text-white' : ''}`} />
        {isOpen && <span>Облачное хранилище</span>}
      </div>
      {isOpen && <ChevronDown className={`w-4 h-4 transition-transform ${isCloudOpen ? 'rotate-180' : ''}`} />}
    </button>

    {/* Подпункты */}
    {(isCloudOpen || cloudItems.some(item => pathname === item.href)) && isOpen && (
      <div className="ml-4 mt-1 space-y-1 border-l border-zinc-200 dark:border-zinc-700">
        {cloudItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center space-x-3 px-3 py-2 text-sm transition-colors ${
                isActive ? 'text-blue-600 dark:text-white font-semibold' : 'text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white'
              }`}
            >
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    )}
  </div>

  {/* Остальные пункты */}
  {menuItems.map((item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all ${
          isOpen ? 'space-x-3' : 'justify-center'
        } ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
        {isOpen && <span>{item.name}</span>}
      </Link>
    );
  })}
</nav>
    </aside>
  );
}