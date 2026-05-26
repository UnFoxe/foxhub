"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, AuthError } from "@supabase/supabase-js";

// Добавим интерфейс для таблицы настроек пользователя
interface UserSettingsRow {
  id: string;
  user_id: string;
  master_key_encrypted: string | null; // Зашифрованный мастер-ключ
}

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Получение текущей сессии при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Подписка на изменения (логин/логаут)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Загрузка настроек пользователя (мастер-ключа) из таблицы user_settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data?.master_key_encrypted) {
          // Дешифруем мастер-ключ и передаем в контекст или сохраняем
          // Для этого нужно добавить метод decryptData из lib/crypto
        }
      } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
      }
    };

    loadSettings();
  }, [user]);

  const login = async (credentials: any) => {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
