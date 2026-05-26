"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // Вызываем login из контекста (который внутри использует supabase)
    const { error } = await login({ email, password });
    
    if (error) {
      alert("Ошибка входа: " + error.message);
    } else {
      router.push('/');
    }
  };

  // Обработчик нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-[#1d1d29] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-zinc-900 dark:text-white">Вход в систему</h1>
        
        <input 
          className="w-full mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input 
          className="w-full mb-6 p-3 rounded-xl bg-zinc-50 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
          type="password" 
          placeholder="Пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
        <button 
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition"
        >
          Войти
        </button>
      </div>
    </div>
  );
}