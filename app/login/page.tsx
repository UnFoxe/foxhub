// app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// --- ДОБАВЬТЕ ЭТУ СТРОКУ ---
import { useAuth } from '@/src/context/AuthContext'; 
// ---------------------------

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  // Теперь useAuth будет знать, что делать
  const { login } = useAuth(); 
  const router = useRouter();

  const handleLogin = async () => {
    // Ваша логика с Supabase (как мы делали ранее)
    const { error } = await login({ email: user, password: pass });
    
    if (error) {
      alert("Ошибка входа: " + error.message);
    } else {
      router.push('/');
    }
  };

  // ... остальной код
}