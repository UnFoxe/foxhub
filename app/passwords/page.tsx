// app/passwords/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/src/context/AuthContext';
import { 
  Folder, 
  Search, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  Dices, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  X, 
  Globe,
  Loader2
} from 'lucide-react';

const CHECK_PHRASE = "user_authenticated_successfully";
const TABLE_NAME = 'passwords';
const SETTINGS_TABLE = 'user_settings';

interface Account {
  id: string;
  site: string;
  login: string;
  category: string;
  password?: string;
}

export default function PasswordsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [masterKey, setMasterKey] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [checkingDatabase, setCheckingDatabase] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: 'site' | 'login' | 'category' | null; direction: 'asc' | 'desc' }>({ 
    key: null, 
    direction: 'asc' 
  });

  const [categories, setCategories] = useState<string[]>(['Сайты', 'Игры', 'Разное']);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Все');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isManagingCategories, setIsManagingCategories] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    site: string; login: string; passwordState: string; category: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [site, setSite] = useState<string>('');
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accountCategory, setAccountCategory] = useState<string>('Сайты');

  const [visiblePasswords, setVisiblePasswords] = useState<{[key: string]: boolean}>({});

  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setHasAccount(false);
      setIsUnlocked(false);
      setCheckingDatabase(false);
      return;
    }

    loadCategories();
    checkMasterKeyExistence();
  }, [user]);

  const loadCategories = () => {
    const savedCats = localStorage.getItem('my_password_categories');
    if (savedCats) {
      try { setCategories(JSON.parse(savedCats)); } catch (e) {}
    }
  };

 const checkMasterKeyExistence = async () => {
  if (!user || !user.id) {
    console.warn('Проверка отменена: пользователь не авторизован или нет id', user);
    setHasAccount(false);
    setCheckingDatabase(false);
    return;
  }
  
  setCheckingDatabase(true);
  try {
    const localCheck = localStorage.getItem(`my_password_check_${user.id}`);
    if (localCheck) {
      setHasAccount(true);
      setCheckingDatabase(false);
      return;
    }

    // ЛОГ ДЛЯ ПРОВЕРКИ КЛИЕНТА: проверяем, живой ли клиент Supabase
    console.log('Проверяем клиент Supabase:', typeof supabase?.from);

const { data, error } = await supabase
  .from(SETTINGS_TABLE)
  .select('master_key_encrypted')
  .eq('user_id', user.id)
  .maybeSingle() as { data: { master_key_encrypted: string } | null; error: any }; // <-- Добавили error: any

if (error) throw error;

    if (data?.master_key_encrypted) {
      localStorage.setItem(`my_password_check_${user.id}`, data.master_key_encrypted);
      setHasAccount(true);
    } else {
      setHasAccount(false);
    }
  } catch (e: any) {
    // ЖЕСТКИЙ СПОСОБ ВЫВОДА ЛЮБЫХ ОШИБОК:
    // Превращаем ошибку в строку. Если это нативный TypeError, мы увидим полный стек и текст
    console.error('КРИТИЧЕСКАЯ ОШИБКА В БЛОКЕ TRY:', e?.stack || e?.message || String(e));
    
    // Печатаем сам объект напрямую в консоль (нажмите на него в консоли браузера, чтобы развернуть скрытые свойства)
    console.dir(e);

    const localCheck = localStorage.getItem(`my_password_check_${user.id}`);
    setHasAccount(!!localCheck);
  } finally {
    setCheckingDatabase(false);
  }
};

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert('Такая категория уже существует');
      return;
    }
    const updated = [...categories, newCategoryName.trim()];
    setCategories(updated);
    localStorage.setItem('my_password_categories', JSON.stringify(updated));
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (['Сайты', 'Игры', 'Разное'].includes(catToDelete)) {
      alert('Нельзя удалить базовые категории');
      return;
    }
    const updated = categories.filter(c => c !== catToDelete);
    setCategories(updated);
    localStorage.setItem('my_password_categories', JSON.stringify(updated));
    if (selectedCategoryFilter === catToDelete) {
      setSelectedCategoryFilter('Все');
    }
  };

  const loadFromSupabase = async (key: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setAccounts([]);
        setIsUnlocked(true);
        return;
      }

      const decryptedList = data.map((row: any) => {
        try {
          const siteDecrypted = decryptData(row.site_encrypted || '', key);
          const loginDecrypted = decryptData(row.login_encrypted || '', key);
          const categoryDecrypted = row.category_encrypted ? decryptData(row.category_encrypted, key) : 'Сайты';
          const passwordDecrypted = decryptData(row.password_encrypted || '', key);

          return {
            id: row.id, 
            site: siteDecrypted || '[Ошибка расшифровки]',
            login: loginDecrypted || '[Ошибка расшифровки]',
            category: categoryDecrypted || 'Сайты',
            password: passwordDecrypted || ''
          };
        } catch (e) {
          return {
            id: row.id,
            site: '[Ошибка ключа]',
            login: '[Ошибка ключа]',
            category: 'Сайты',
            password: ''
          };
        }
      });

      setAccounts(decryptedList);
      setIsUnlocked(true);
    } catch (e: any) {
      console.error('Ошибка загрузки данных из Supabase:', e);
      setErrorMsg('Не удалось загрузить данные из облака.');
    }
  };

  const handleMasterKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentKey = e.target.value;
    setMasterKey(currentKey);
    setErrorMsg('');

    if (hasAccount && currentKey.length >= 4 && user) {
      const savedCheck = localStorage.getItem(`my_password_check_${user.id}`);
      if (!savedCheck) return;
      
      try {
        const decryptedCheck = decryptData(savedCheck, currentKey);
        if (decryptedCheck === CHECK_PHRASE) {
          loadFromSupabase(currentKey);
        }
      } catch (err) {}
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Вы не авторизованы в системе.');
      return;
    }
    if (masterKey.length < 4) {
      setErrorMsg('Пароль должен быть не менее 4 символов');
      return;
    }
    
    const storageKey = `my_password_check_${user.id}`;
    
    // Берем слепок либо из локального хранилища, либо повторно запрашиваем (на случай сброса кэша)
    let savedCheck = localStorage.getItem(storageKey);

    if (hasAccount) {
      // РЕЖИМ РАЗБЛОКИРОВКИ
      if (!savedCheck) {
        // Если локальный кэш был очищен, но аккаунт в базе есть, берем слепок прямо из Supabase перед сверкой
        const { data } = await supabase.from(SETTINGS_TABLE).select('master_key_encrypted').eq('user_id', user.id).maybeSingle();
        if (data?.master_key_encrypted) {
            savedCheck = data.master_key_encrypted;
            localStorage.setItem(storageKey, data.master_key_encrypted); // <-- Передаем напрямую
        }
      }

      try {
        const decryptedCheck = decryptData(savedCheck || '', masterKey);
        if (decryptedCheck === CHECK_PHRASE) {
          loadFromSupabase(masterKey);
        } else {
          setErrorMsg('Неверный мастер-пароль. Доступ запрещен.');
        }
      } catch (err) {
        setErrorMsg('Неверный мастер-пароль. Доступ запрещен.');
      }
    } else {
      // РЕЖИМ ПЕРВОГО СОЗДАНИЯ (данных в базе еще нет)
      try {
        const encryptedCheck = encryptData(CHECK_PHRASE, masterKey);
        
        // 1. Сохраняем локально
        localStorage.setItem(storageKey, encryptedCheck);
        
        // 2. Сохраняем в Supabase в таблицу user_settings, чтобы защититься от удаления кэша
        const { error } = await supabase
          .from(SETTINGS_TABLE)
          .upsert({ 
            user_id: user.id, 
            master_key_encrypted: encryptedCheck 
          }, { onConflict: 'user_id' });

        if (error) throw error;

        setHasAccount(true);
        setAccounts([]);
        setIsUnlocked(true);
      } catch (err) {
        console.error('Ошибка сохранения мастер-пароля в профиль:', err);
        setErrorMsg('Ошибка при инициализации хранилища в облаке.');
      }
    }
  };

  const handleAddAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!site || !login || !password || !user || !masterKey) return;

    try {
      const newTempRow = {
        user_id: user.id, 
        site_encrypted: encryptData(site, masterKey),
        login_encrypted: encryptData(login, masterKey),
        category_encrypted: encryptData(accountCategory, masterKey),
        password_encrypted: encryptData(password, masterKey)
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([newTempRow])
        .select();
      
      if (error) throw error;

      if (data && data[0]) {
        const newAccount: Account = {
          id: data[0].id, 
          site, 
          login, 
          category: accountCategory, 
          password
        };
        setAccounts(prev => [...prev, newAccount]);
      }

      setSite(''); 
      setLogin(''); 
      setPassword('');
      setErrorMsg('');
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      setErrorMsg('Не удалось сохранить запись в облако.');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm || !user || !masterKey) return;

    try {
      const updatedRow = {
        site_encrypted: encryptData(editForm.site, masterKey),
        login_encrypted: encryptData(editForm.login, masterKey),
        category_encrypted: encryptData(editForm.category, masterKey),
        password_encrypted: encryptData(editForm.passwordState, masterKey)
      };

      const { error } = await supabase
        .from(TABLE_NAME)
        .update(updatedRow)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === id ? {
        id,
        site: editForm.site,
        login: editForm.login,
        category: editForm.category,
        password: editForm.passwordState
      } : acc));

      setEditingId(null);
      setEditForm(null);
    } catch (e) {
      console.error('Ошибка обновления:', e);
      setErrorMsg('Не удалось обновить запись в облаке.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('Удалить эту запись?')) {
      try {
        const { error } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setAccounts(prev => prev.filter(acc => acc.id !== id));
      } catch (e) {
        console.error('Ошибка удаления:', e);
        alert('Ошибка при удалении записи.');
      }
    }
  };

  const startEditing = (acc: Account) => {
    setEditingId(acc.id);
    setEditForm({
      site: acc.site, 
      login: acc.login, 
      passwordState: acc.password || '', 
      category: acc.category
    });
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editingId && editForm) {
      setEditForm({ ...editForm, passwordState: pass });
    } else {
      setPassword(pass);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (key: 'site' | 'login' | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAccounts = accounts
    .filter(acc => selectedCategoryFilter === 'Все' || acc.category === selectedCategoryFilter)
    .filter(acc => {
      const siteStr = (acc.site || '').toLowerCase();
      const loginStr = (acc.login || '').toLowerCase();
      const searchStr = (searchQuery || '').toLowerCase();

      return siteStr.includes(searchStr) || loginStr.includes(searchStr);
    });

  if (sortConfig.key) {
    filteredAccounts.sort((a, b) => {
      const valA = (a[sortConfig.key!] || '').toLowerCase();
      const valB = (b[sortConfig.key!] || '').toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (authLoading || checkingDatabase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4578F9] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 text-center">
        <div className="w-full max-w-md bg-white dark:bg-[#1D1D29] border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm">
          <Lock className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Доступ ограничен</h2>
          <p className="text-xs text-[#7B7B7B]">Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к хранилищу паролей.</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/50 bg-white dark:bg-[#1D1D29] p-8 shadow-md backdrop-blur-xl text-black dark:text-white">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4578F9]/10 border border-[#4578F9]/20 text-[#4578F9]">
            {hasAccount ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </div>
          <h2 className="text-xl font-bold text-center mb-2 tracking-tight">
            {hasAccount ? 'Защищенное хранилище' : 'Создание мастер-пароля'}
          </h2>
          <p className="text-xs text-center text-[#7B7B7B] mb-6">
            Аккаунт: <span className="text-[#4578F9] font-mono">{user.email}</span>
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder={hasAccount ? "••••••••••••" : "Задайте надежный пароль"}
              value={masterKey}
              onChange={handleMasterKeyChange}
              className="w-full px-4 py-3 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-[#4578F9] text-center tracking-widest text-sm"
              autoFocus
            />
            {errorMsg && (
              <div className="text-xs text-rose-500 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-center font-medium">
                {errorMsg}
              </div>
            )}
            <button type="submit" className="w-full bg-[#4578F9] hover:bg-[#4578F9]/90 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wide transition-all shadow-sm">
              {hasAccount ? 'Разблокировать базу' : 'Инициализировать базу'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-transparent text-black dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white dark:bg-[#121320] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#7B7B7B] uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-3.5 h-3.5" /> Категории
              </h3>
              <button 
                onClick={() => setIsManagingCategories(!isManagingCategories)}
                className="text-[10px] text-[#4578F9] hover:underline cursor-pointer"
              >
                {isManagingCategories ? 'Готово' : 'Управление'}
              </button>
            </div>

            {isManagingCategories ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Новая..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-zinc-100 dark:bg-[#191A2A] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                  <button onClick={handleAddCategory} className="bg-[#4578F9] p-1 rounded-lg text-white">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-[#161726] px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800/40">
                      <span className="truncate">{cat}</span>
                      {!['Сайты', 'Игры', 'Разное'].includes(cat) && (
                        <button onClick={() => handleDeleteCategory(cat)} className="text-rose-500 hover:text-rose-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCategoryFilter('Все')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${selectedCategoryFilter === 'Все' ? 'bg-[#4578F9] text-white font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'}`}
                >
                  Все пароли
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${selectedCategoryFilter === cat ? 'bg-[#4578F9] text-white font-medium' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="bg-white dark:bg-[#121320] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold mb-4 tracking-tight">Добавить новую учетную запись</h3>
            <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-[10px] text-[#7B7B7B] mb-1.5 font-medium">Сайт / Приложение</label>
                <input
                  type="text"
                  required
                  placeholder="example.com"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#171825] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4578F9]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#7B7B7B] mb-1.5 font-medium">Логин / Email</label>
                <input
                  type="text"
                  required
                  placeholder="user@mail.com"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#171825] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4578F9]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#7B7B7B] mb-1.5 font-medium">Пароль</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-[#171825] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-xs focus:outline-none focus:border-[#4578F9]"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#4578F9] cursor-pointer"
                    title="Сгенерировать случайный пароль"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#7B7B7B] mb-1.5 font-medium">Категория</label>
                <select
                  value={accountCategory}
                  onChange={(e) => setAccountCategory(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#171825] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#4578F9]"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-[#4578F9] hover:bg-[#4578F9]/90 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Сохранить
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-[#121320] border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-4">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по сайту или логину..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#171825] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#4578F9]"
                />
              </div>
              <div className="text-[11px] text-[#7B7B7B]">
                Найдено: <span className="font-semibold text-black dark:text-white">{filteredAccounts.length}</span>
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-400">
                Записи не найдены или категория пуста.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-[#161726]/30 text-[10px] text-[#7B7B7B] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/30" onClick={() => handleSort('site')}>Сайт</th>
                      <th className="py-3 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/30" onClick={() => handleSort('login')}>Логин</th>
                      <th className="py-3 px-4">Пароль</th>
                      <th className="py-3 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/30" onClick={() => handleSort('category')}>Категория</th>
                      <th className="py-3 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-xs">
                    {filteredAccounts.map((acc) => {
                      const isEditing = editingId === acc.id;
                      const isVisible = visiblePasswords[acc.id] || false;

                      return (
                        <tr key={acc.id} className="hover:bg-zinc-50/50 dark:hover:bg-[#161726]/20 transition-all">
                          <td className="py-3.5 px-4 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm?.site || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, site: e.target.value } : null)}
                                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5 w-full focus:outline-none"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                                {acc.site}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm?.login || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, login: e.target.value } : null)}
                                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-0.5 w-full focus:outline-none"
                              />
                            ) : acc.login}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                            {isEditing ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editForm?.passwordState || ''}
                                  onChange={(e) => setEditForm(prev => prev ? { ...prev, passwordState: e.target.value } : null)}
                                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded pl-2 pr-6 py-0.5 w-full focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={generatePassword}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#4578F9]"
                                >
                                  <Dices className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{isVisible ? acc.password : "••••••••"}</span>
                                <button onClick={() => togglePasswordVisibility(acc.id)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-all cursor-pointer">
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                {acc.password && (
                                  <button onClick={() => copyToClipboard(acc.password || '', acc.id)} className="text-zinc-400 hover:text-[#4578F9] transition-all cursor-pointer">
                                    {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[#7B7B7B]">
                            {isEditing ? (
                              <select
                                value={editForm?.category || 'Сайты'}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            ) : acc.category}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isEditing ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(acc.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
                                >
                                  ОК
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(null); setEditForm(null); }}
                                  className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  Отмена
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditing(acc)}
                                  className="p-1.5 text-[#7B7B7B] hover:text-[#4578F9] rounded-lg transition-all cursor-pointer"
                                >
                                  Редактировать
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(acc.id)}
                                  className="p-1.5 text-[#7B7B7B] hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}