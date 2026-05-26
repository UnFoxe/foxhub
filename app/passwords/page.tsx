'use client';

import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
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
  FolderPlus, 
  X, 
  Globe
} from 'lucide-react';

const CHECK_PHRASE = "user_authenticated_successfully";

interface Account {
  id: number;
  site: string;
  login: string;
  category: string;
  password?: string;
}

interface SortConfig {
  key: 'site' | 'login' | 'category' | null;
  direction: 'asc' | 'desc';
}

interface VisiblePasswords {
  [key: number]: boolean;
}

export default function PasswordsPage() {
  const [masterKey, setMasterKey] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const [categories, setCategories] = useState<string[]>(['Сайты', 'Игры', 'Разное']);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Все');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isManagingCategories, setIsManagingCategories] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    site: string;
    login: string;
    passwordState: string;
    category: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [site, setSite] = useState<string>('');
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accountCategory, setAccountCategory] = useState<string>('Сайты');

  const [visiblePasswords, setVisiblePasswords] = useState<VisiblePasswords>({});

  useEffect(() => {
    const savedCheck = localStorage.getItem('my_password_check');
    if (savedCheck) setHasAccount(true);

    const savedCats = localStorage.getItem('my_password_categories');
    if (savedCats) {
      try { setCategories(JSON.parse(savedCats)); } catch (e) {}
    }
  }, []);

  const unlockAndLoad = (key: string) => {
    const savedRaw = localStorage.getItem('my_encrypted_passwords');
    if (savedRaw) {
      try {
        const encryptedList = JSON.parse(savedRaw);
        const decryptedList = encryptedList.map((acc: any) => ({
          id: acc.id,
          site: decryptData(acc.site, key),
          login: decryptData(acc.login, key),
          category: acc.category ? decryptData(acc.category, key) : 'Сайты',
          password: decryptData(acc.password, key)
        }));
        setAccounts(decryptedList);
      } catch (e) {
        setErrorMsg('Неверный ключ шифрования. Доступ заблокирован.');
        return;
      }
    }
    setIsUnlocked(true);
  };

  const handleMasterKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentKey = e.target.value;
    setMasterKey(currentKey);
    setErrorMsg('');

    if (hasAccount && currentKey.length >= 4) {
      const savedCheck = localStorage.getItem('my_password_check');
      if (!savedCheck) return;
      try {
        const decryptedCheck = decryptData(savedCheck, currentKey);
        if (decryptedCheck === CHECK_PHRASE) unlockAndLoad(currentKey);
      } catch (err) {}
    }
  };

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (masterKey.length < 4) {
      setErrorMsg('Пароль должен быть не менее 4 символов');
      return;
    }
    if (!hasAccount) {
      const encryptedCheck = encryptData(CHECK_PHRASE, masterKey);
      localStorage.setItem('my_password_check', encryptedCheck);
      setIsUnlocked(true);
      setHasAccount(true);
    }
  };

  const saveToStorage = (updatedAccounts: Account[]) => {
    const encryptedToSave = updatedAccounts.map(acc => ({
      id: acc.id,
      site: encryptData(acc.site, masterKey),
      login: encryptData(acc.login || '', masterKey),
      category: encryptData(acc.category || 'Сайты', masterKey),
      password: encryptData(acc.password || '', masterKey)
    }));
    localStorage.setItem('my_encrypted_passwords', JSON.stringify(encryptedToSave));
  };

  const generateSecurePassword = (target: 'create' | 'edit') => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    let generated = "";
    generated += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    generated += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    generated += "0123456789"[Math.floor(Math.random() * 10)];
    generated += "!@#$%^*"[Math.floor(Math.random() * 7)];

    for (let i = generated.length; i < length; i++) {
      generated += charset[Math.floor(Math.random() * charset.length)];
    }
    const finalPassword = generated.split('').sort(() => 0.5 - Math.random()).join('');
    
    if (target === 'create') {
      setPassword(finalPassword);
    } else if (target === 'edit' && editForm) {
      setEditForm({ ...editForm, passwordState: finalPassword });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updatedCats = [...categories, trimmed];
    setCategories(updatedCats);
    localStorage.setItem('my_password_categories', JSON.stringify(updatedCats));
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('Должна остаться хотя бы одна категория!');
      return;
    }
    if (confirm(`Удалить категорию "${catToDelete}"? Записи перейдут в дефолтную.`)) {
      const updatedCats = categories.filter(c => c !== catToDelete);
      setCategories(updatedCats);
      localStorage.setItem('my_password_categories', JSON.stringify(updatedCats));

      const fallbackCat = updatedCats[0];
      const updatedAccounts = accounts.map(acc => 
        acc.category === catToDelete ? { ...acc, category: fallbackCat } : acc
      );
      setAccounts(updatedAccounts);
      saveToStorage(updatedAccounts);

      if (selectedCategoryFilter === catToDelete) setSelectedCategoryFilter('Все');
      if (accountCategory === catToDelete) setAccountCategory(fallbackCat);
    }
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!site || !login || !password) return;

    const newAccount: Account = { id: Date.now(), site, login, category: accountCategory, password };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    saveToStorage(updated);

    setSite(''); setLogin(''); setPassword('');
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

  const handleSaveEdit = (id: number) => {
    if (!editForm) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          site: editForm.site,
          login: editForm.login,
          password: editForm.passwordState,
          category: editForm.category
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    saveToStorage(updatedAccounts);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить эту запись?')) {
      const updated = accounts.filter(acc => acc.id !== id);
      setAccounts(updated);
      saveToStorage(updated);
    }
  };

  const handleCopyToClipboard = (text: string, typeId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(typeId);
      setTimeout(() => setCopiedId(null), 1200);
    });
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.site?.toLowerCase().includes(searchQuery.toLowerCase()) || acc.login?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'Все' || acc.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = (a[sortConfig.key] || '').toLowerCase();
    const valueB = (b[sortConfig.key] || '').toLowerCase();
    if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const CopyButton = ({ text, typeId }: { text: string; typeId: string }) => {
    const isCopied = copiedId === typeId;
    return (
      <button
        type="button"
        onClick={() => handleCopyToClipboard(text, typeId)}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          isCopied 
            ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400' 
            : 'text-[#7B7B7B] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    );
  };

  // ЭКРАН БЛОКИРОВКИ (ВХОД)
  if (!isUnlocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/50 bg-white dark:bg-[#1D1D29] p-8 shadow-md backdrop-blur-xl text-black dark:text-white">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4578F9]/10 border border-[#4578F9]/20 text-[#4578F9]">
            {hasAccount ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </div>
          <h2 className="text-xl font-bold text-center mb-2 tracking-tight text-black dark:text-white">
            {hasAccount ? 'Защищенное хранилище' : 'Создание мастер-пароля'}
          </h2>
          <p className="text-xs text-center text-[#7B7B7B] mb-6">
            {hasAccount ? 'Введите ключ авторизации для расшифровки локальной базы' : 'Ключ будет использоваться для шифрования данных в AES-256'}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder={hasAccount ? "••••••••••••" : "Задайте надежный пароль"}
              value={masterKey}
              onChange={handleMasterKeyChange}
              className="w-full px-4 py-3 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-[#4578F9] focus:ring-1 focus:ring-[#4578F9]/30 font-mono text-center tracking-widest text-sm transition-all"
              autoFocus
            />
            {errorMsg && (
              <div className="text-xs text-rose-500 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-center font-medium">
                {errorMsg}
              </div>
            )}
            {!hasAccount && (
              <button type="submit" className="w-full bg-[#4578F9] hover:bg-[#4578F9]/90 text-white font-semibold py-2.5 rounded-xl text-xs tracking-wide transition-all shadow-sm cursor-pointer">
                Инициализировать базу
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ОСНОВНОЙ КОНТЕНТ
  return (
    <div className="space-y-6 text-black dark:text-white">
      
      {/* Верхний сервисный бар для Блокировки */}
      <div className="flex justify-end items-center">
        <button
          type="button"
          onClick={() => { setIsUnlocked(false); setAccounts([]); setMasterKey(''); setEditingId(null); }}
          className="flex items-center space-x-2 bg-white dark:bg-[#1D1D29] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-[#7B7B7B] hover:text-black dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800/50 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-[#4578F9]" />
          <span>Закрыть сессию</span>
        </button>
      </div>

      {/* Двухколоночная сетка */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ЛЕВАЯ ПАНЕЛЬ: Фильтры, Категории и Поиск */}
        <aside className="xl:col-span-3 space-y-4">
          <div className="bg-white dark:bg-[#1D1D29] border border-zinc-200/80 dark:border-zinc-800/50 p-4 rounded-2xl space-y-5 shadow-sm">
            
            {/* Поиск */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-[#7B7B7B] font-bold">Фильтрация</label>
              <div className="relative group">
                <Search className="absolute inset-y-0 left-3 my-auto h-3.5 w-3.5 text-[#7B7B7B] transition-colors group-focus-within:text-[#4578F9]" />
                <input
                  type="text"
                  placeholder="Поиск по базе данных..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none transition-all focus:border-[#4578F9] focus:bg-white dark:focus:bg-[#11121E]"
                />
              </div>
            </div>

            {/* Список категорий */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider text-[#7B7B7B] font-bold">Категории</label>
                <button
                  type="button"
                  onClick={() => setIsManagingCategories(!isManagingCategories)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${isManagingCategories ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'text-[#7B7B7B] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                >
                  {isManagingCategories ? 'Готово' : 'Ред.'}
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { if(!isManagingCategories) setSelectedCategoryFilter('Все'); }}
                  disabled={isManagingCategories}
                  className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${isManagingCategories ? 'opacity-40 cursor-default' : ''} ${selectedCategoryFilter === 'Все' && !isManagingCategories ? 'bg-zinc-100 dark:bg-[#11121E] text-[#4578F9] font-semibold shadow-inner border border-zinc-200 dark:border-zinc-800' : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-black dark:hover:text-white'}`}
                >
                  <span className="flex items-center space-x-2">
                    <Globe className={`w-3.5 h-3.5 ${selectedCategoryFilter === 'Все' && !isManagingCategories ? 'text-[#4578F9]' : 'text-[#7B7B7B]'}`} />
                    <span>Все записи</span>
                  </span>
                  <span className="text-[10px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[#7B7B7B] font-mono border border-zinc-200 dark:border-zinc-700">{accounts.length}</span>
                </button>

                {categories.map(cat => {
                  const count = accounts.filter(a => a.category === cat).length;
                  const isCurrent = selectedCategoryFilter === cat && !isManagingCategories;
                  return (
                    <div key={cat} className="group relative flex items-center">
                      <button
                        type="button"
                        onClick={() => !isManagingCategories && setSelectedCategoryFilter(cat)}
                        disabled={isManagingCategories}
                        className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${isManagingCategories ? 'cursor-default opacity-50' : ''} ${isCurrent ? 'bg-zinc-100 dark:bg-[#11121E] text-[#4578F9] font-semibold shadow-inner border border-zinc-200 dark:border-zinc-800' : 'text-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-black dark:hover:text-white'}`}
                      >
                        <span className="truncate pr-4 flex items-center space-x-2">
                          <Folder className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#4578F9]' : 'text-[#7B7B7B]'}`} />
                          <span>{cat}</span>
                        </span>
                        <span className="text-[10px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[#7B7B7B] font-mono border border-zinc-200 dark:border-zinc-700">{count}</span>
                      </button>
                      
                      {isManagingCategories && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="absolute right-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] hover:bg-rose-50 hover:text-white transition-colors cursor-pointer"
                          title="Удалить категорию"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Добавление категорий */}
            {isManagingCategories && (
              <form onSubmit={handleAddCategory} className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
                <input
                  type="text"
                  placeholder="Название категории..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-100 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-xs outline-none focus:border-[#4578F9]"
                  required
                />
                <button type="submit" className="w-full flex items-center justify-center space-x-1 bg-[#4578F9] hover:bg-[#4578F9]/90 text-white text-xs font-semibold py-1.5 rounded-xl transition-all shadow-sm cursor-pointer">
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </form>
            )}
          </div>

          {/* Кнопка сброса */}
          <div className="px-1 text-center">
            <button
              type="button"
              onClick={() => { if(confirm('Стереть всё локальное хранилище без возможности восстановления?')) { localStorage.clear(); window.location.reload(); } }}
              className="text-[11px] text-[#7B7B7B] hover:text-rose-500 font-medium transition-colors cursor-pointer underline decoration-dotted"
            >
              Очистить локальный кэш приложения
            </button>
          </div>
        </aside>

        {/* ПРАВАЯ ПАНЕЛЬ: Добавление аккаунта и Таблица данных */}
        <main className="xl:col-span-9 space-y-6">
          
          {/* Форма создания записи */}
          <form onSubmit={handleAddAccount} className="bg-white dark:bg-[#1D1D29] border border-zinc-200/80 dark:border-zinc-800/50 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-[#7B7B7B]">
              <Plus className="w-4 h-4 text-[#4578F9]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-zinc-300">Новый аккаунт</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7B7B7B] font-medium">Сайт или сервис</label>
                <input
                  type="text"
                  placeholder="Google, GitHub..."
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-xs outline-none focus:border-[#4578F9] focus:bg-white dark:focus:bg-[#11121E]"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7B7B7B] font-medium">Логин или Email</label>
                <input
                  type="text"
                  placeholder="example@mail.com"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-xs outline-none focus:border-[#4578F9] focus:bg-white dark:focus:bg-[#11121E]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7B7B7B] font-medium">Пароль доступа</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Строгий пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-9 px-3 py-2 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-xs font-mono outline-none focus:border-[#4578F9] focus:bg-white dark:focus:bg-[#11121E]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => generateSecurePassword('create')}
                    className="absolute right-2.5 p-1 text-[#7B7B7B] hover:text-[#4578F9] transition-colors cursor-pointer"
                    title="Сгенерировать пароль"
                  >
                    <Dices className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-[#7B7B7B] font-medium">Раздел</label>
                <div className="relative">
                  <select
                    value={accountCategory}
                    onChange={(e) => setAccountCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100/70 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 rounded-xl text-black dark:text-white text-xs outline-none focus:border-[#4578F9] focus:bg-white dark:focus:bg-[#11121E] cursor-pointer appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-white dark:bg-[#1D1D29] text-black dark:text-white">{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#7B7B7B] text-[10px]">▼</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-[#4578F9] hover:bg-[#4578F9]/90 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer">
                Записать в базу
              </button>
            </div>
          </form>

          {/* Таблица */}
          <div className="bg-white dark:bg-[#1D1D29] border border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/60">
              <span className="text-xs font-semibold text-[#7B7B7B]">
                Раздел: <span className="text-[#4578F9] font-bold bg-[#4578F9]/10 px-2 py-0.5 rounded-md ml-1">{selectedCategoryFilter}</span>
              </span>
              <span className="text-[11px] font-mono text-[#7B7B7B]">Найдено записей: {sortedAccounts.length}</span>
            </div>

            {sortedAccounts.length === 0 ? (
              <div className="p-12 text-center text-[#7B7B7B] text-xs font-medium">
                {searchQuery || selectedCategoryFilter !== 'Все' ? 'Записи, удовлетворяющие условиям поиска, отсутствуют.' : 'В выбранном разделе пока нет сохраненных аккаунтов.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-[#7B7B7B] text-[10px] uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 select-none">
                      <th onClick={() => setSortConfig({ key: 'site', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-4 font-bold cursor-pointer hover:text-[#4578F9] transition-colors">Сервис</th>
                      <th className="p-4 font-bold">Категория</th>
                      <th className="p-4 font-bold">Логин / Почта</th>
                      <th className="p-4 font-bold">Пароль</th>
                      <th className="p-4 font-bold text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-xs text-zinc-800 dark:text-zinc-300">
                    {sortedAccounts.map((acc) => {
                      const isEditing = editingId === acc.id;

                      return (
                        <tr 
                          key={acc.id} 
                          onDoubleClick={() => !isEditing && startEditing(acc)}
                          className={`transition-colors duration-100 ${isEditing ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10'}`}
                        >
                          {/* СЕРВИС */}
                          <td className="p-4 font-semibold text-black dark:text-white">
                            {isEditing && editForm ? (
                              <input
                                type="text"
                                value={editForm.site}
                                onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                                className="w-full bg-white dark:bg-[#11121E] border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4578F9]"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 group">
                                <span className="hover:text-[#4578F9] transition-colors cursor-pointer" onClick={() => startEditing(acc)}>{acc.site}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={acc.site} typeId={`s-${acc.id}`} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* КАТЕГОРИЯ */}
                          <td className="p-4">
                            {isEditing && editForm ? (
                              <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="w-full bg-white dark:bg-[#11121E] border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer focus:border-[#4578F9]"
                              >
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-[#7B7B7B] rounded-md border border-zinc-200 dark:border-zinc-700 font-mono">
                                {acc.category}
                              </span>
                            )}
                          </td>

                          {/* ЛОГИН */}
                          <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono">
                            {isEditing && editForm ? (
                              <input
                                type="text"
                                value={editForm.login}
                                onChange={(e) => setEditForm({ ...editForm, login: e.target.value })}
                                className="w-full bg-white dark:bg-[#11121E] border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#4578F9]"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 group">
                                <span>{acc.login}</span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CopyButton text={acc.login} typeId={`l-${acc.id}`} />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* ПАРОЛЬ */}
                          <td className="p-4 font-mono">
                            {isEditing && editForm ? (
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  value={editForm.passwordState}
                                  onChange={(e) => setEditForm({ ...editForm, passwordState: e.target.value })}
                                  className="w-full pr-8 bg-white dark:bg-[#11121E] border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none font-mono focus:border-[#4578F9]"
                                />
                                <button
                                  type="button"
                                  onClick={() => generateSecurePassword('edit')}
                                  className="absolute right-2 p-1 text-[#7B7B7B] hover:text-[#4578F9] cursor-pointer"
                                  title="Перегенерировать пароль"
                                >
                                    <Dices className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="min-w-[100px] inline-block tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">{visiblePasswords[acc.id] ? acc.password : '••••••••••••'}</span>
                                <button
                                  type="button"
                                  onClick={() => setVisiblePasswords(p => ({ ...p, [acc.id]: !p[acc.id] }))}
                                  className="text-[#7B7B7B] hover:text-black dark:hover:text-white transition-colors p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                                >
                                  {visiblePasswords[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <CopyButton text={acc.password || ''} typeId={`p-${acc.id}`} />
                              </div>
                            )}
                          </td>

                          {/* ДЕЙСТВИЯ */}
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(acc.id)}
                                  className="bg-[#4578F9] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-sm cursor-pointer"
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
                              <button
                                type="button"
                                onClick={() => handleDelete(acc.id)}
                                className="p-1.5 text-[#7B7B7B] hover:text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Удалить аккаунт"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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