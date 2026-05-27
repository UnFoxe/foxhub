'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react'; 
import { Responsive, Layout } from 'react-grid-layout'; 
import { useAuth } from '@/src/context/AuthContext';
import { createClient } from "@/lib/supabase/client";

// Обязательные стили для работы сетки
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ИСПРАВЛЕНО: Теперь здесь четко указано, что под каждым ключом (lg, md) лежит МАССИВ карточек
type Layouts = {
  [key: string]: Layout | undefined;
};

// --- Пользовательский хук для отслеживания ширины ---
function useContainerWidth(defaultWidth: number = 2000) {
  const [width, setWidth] = useState<number>(defaultWidth);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    setWidth(containerRef.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return { width, containerRef };
}

// --- Интерфейсы ---
interface ExchangeRate {
  id: string;
  currency: string;
  value: string;
  change: string;
  isUp: boolean;
}

interface WeatherData {
  id: string;
  city: string;
  temp: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  pressure: string;
}

interface Bookmark {
  id: string;
  name: string;
  url: string;
}

const MODULE_WEATHER_SAMARA = 'weather-Самара';
const MODULE_WEATHER_MOSCOW = 'weather-Москва';
const MODULE_RATES_COMBINED = 'rate-USD'; 
const MODULE_SCRATCHPAD = 'scratchpad-notes';
const MODULE_CALCULATOR = 'calc-simple';
const MODULE_BOOKMARKS = 'bookmarks-list';

const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Ясно';
  if ([1, 2, 3].includes(code)) return 'Облачно';
  if ([45, 48].includes(code)) return 'Туман';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Морось';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Дождь';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Снег';
  if ([95, 96, 99].includes(code)) return 'Гроза';
  return 'Облачно';
};

// ИСПРАВЛЕНО: Изменен тип на Layout[] (массив), так как это список карточек
const defaultLayout: Layout = [ 
  { 
    i: MODULE_WEATHER_SAMARA, 
    x: 0, 
    y: 0, 
    w: 3, 
    h: 2, 
    minW: 2, 
    minH: 2 
  },
  { 
    i: MODULE_WEATHER_MOSCOW, 
    x: 3, 
    y: 0, 
    w: 3, 
    h: 2, 
    minW: 2, 
    minH: 2 
  },
  { 
    i: MODULE_RATES_COMBINED, 
    x: 6, 
    y: 0, 
    w: 3, 
    h: 3, 
    minW: 3, 
    minH: 2 
  },
  { 
    i: MODULE_CALCULATOR, 
    x: 9, 
    y: 0, 
    w: 3, 
    h: 2, 
    minW: 2, 
    minH: 2 
  },
  { 
    i: MODULE_BOOKMARKS, 
    x: 0, 
    y: 2, 
    w: 6, 
    h: 3, 
    minW: 4, 
    minH: 2 
  },
  { 
    i: MODULE_SCRATCHPAD, 
    x: 6, 
    y: 3, 
    w: 6, 
    h: 3, 
    minW: 4, 
    minH: 2 
  }
];

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const supabase = createClient();

  const [isMounted, setIsMounted] = useState(false);
  const { width, containerRef } = useContainerWidth();

  const [note, setNote] = useState('');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [bookmarkDraft, setBookmarkDraft] = useState({ name: '', url: '' });

  const [ratesLoading, setRatesLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Важно: Флаг загрузки персональной сетки
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);

  // Состояния для хранения сетки
  const [layouts, setLayouts] = useState<Layouts>({ lg: defaultLayout });
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>({
    [MODULE_WEATHER_SAMARA]: true,
    [MODULE_WEATHER_MOSCOW]: true,
    [MODULE_RATES_COMBINED]: true,
    [MODULE_SCRATCHPAD]: true,
    [MODULE_CALCULATOR]: true,
    [MODULE_BOOKMARKS]: true,
  });

  // 1. Инициализация кликов
  useEffect(() => {
    setIsMounted(true);
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // 2. Восстановление данных, размеров и позиций из Supabase
  useEffect(() => {
    if (!user) return;
    
    const userId = user.id; 

    async function fetchUserData() {
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('key, value')
          .eq('user_id', userId);

        if (!settingsError && settingsData) {
          let savedLayoutLg = defaultLayout;
          let savedVisibility = {
            [MODULE_WEATHER_SAMARA]: true,
            [MODULE_WEATHER_MOSCOW]: true,
            [MODULE_RATES_COMBINED]: true,
            [MODULE_SCRATCHPAD]: true,
            [MODULE_CALCULATOR]: true,
            [MODULE_BOOKMARKS]: true,
          };

          settingsData.forEach(item => {
            if (item.key === 'scratchpad') setNote(item.value);
            
            if (item.key === 'layout') {
              try {
                const parsed = JSON.parse(item.value);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  savedLayoutLg = parsed;
                }
              } catch (e) {
                console.error("Ошибка парсинга разметки сетки", e);
              }
            }
            
            if (item.key === 'modules_visibility') {
              try {
                savedVisibility = JSON.parse(item.value);
              } catch (e) {
                console.error("Ошибка парсинга видимости модулей", e);
              }
            }
          });

          setLayouts({ lg: savedLayoutLg });
          setVisibleModules(savedVisibility);
        }

        // Загрузка закладок
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('id, name, url')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

       if (!bookmarksError && bookmarksData && bookmarksData.length > 0) {
          setBookmarks(bookmarksData);
        } else {
          setBookmarks([
            { id: '1', name: 'GitHub', url: 'https://github.com' },
            { id: '2', name: 'YouTube', url: 'https://youtube.com' }
          ]);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err);
      } finally {
        setIsLayoutLoading(false);
      }
    }

    fetchUserData();
  }, [user, supabase]);

  // 3. Загрузка публичных данных (Погода и Валюта)
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        const data = await res.json();
        const targetCurrencies = ['USD', 'EUR'];
        const formattedRates = targetCurrencies.map(code => {
          const item = data.Valute[code];
          const diff = item.Value - item.Previous;
          return {
            id: `rate-${code}`,
            currency: code,
            value: item.Value.toFixed(2),
            change: `${diff > 0 ? '+' : ''}${diff.toFixed(2)}`,
            isUp: diff >= 0
          };
        });
        setRates(formattedRates);
      } catch (error) {
        console.error(error);
      } finally {
        setRatesLoading(false);
      }
    }

    async function fetchWeather() {
      try {
        const cities = [
          { name: 'Самара', lat: '53.2001', lon: '50.1500' },
          { name: 'Москва', lat: '55.7558', lon: '37.6173' }
        ];
        
        const promises = cities.map(async (city) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
            
            const data = await res.json();
            const current = data.current;
            const temp = Math.round(current.temperature_2m);
            const pressureMmHg = Math.round(current.surface_pressure * 0.750062);
            
            return {
              id: `weather-${city.name}`,
              city: city.name,
              temp: `${temp > 0 ? '+' : ''}${temp}°C`,
              condition: getWeatherCondition(current.weather_code),
              humidity: `${current.relative_humidity_2m}%`,
              windSpeed: `${current.wind_speed_10m.toFixed(1)} м/с`,
              pressure: `${pressureMmHg} мм`
            };
          } catch (cityError) {
            console.error(`Не удалось загрузить погоду для г. ${city.name}:`, cityError);
            return {
              id: `weather-${city.name}`,
              city: city.name,
              temp: '—',
              condition: 'Ошибка сети',
              humidity: '—',
              windSpeed: '—',
              pressure: '—'
            };
          }
        });
        
        const results = await Promise.all(promises);
        setWeatherData(results);
      } catch (error) {
        console.error("Глобальная ошибка пула погоды:", error);
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchRates();
    fetchWeather();
  }, []);

  const handleCalc = (val: string) => {
    setCalcInput(val);
    try {
      if (!val.trim()) {
        setCalcResult('');
        return;
      }
      const res = new Function(`return ${val}`)();
      if (res !== undefined && res !== null && !Number.isNaN(res)) {
        const formattedRes = Number.isInteger(res) ? res : parseFloat(res.toFixed(4));
        setCalcResult(formattedRes.toString());
      } else {
        setCalcResult('');
      }
    } catch {
      setCalcResult('...');
    }
  };

  const handleOpenAddModal = () => {
    setEditingBookmarkId(null);
    setBookmarkDraft({ name: '', url: '' });
    setIsBookmarkModalOpen(true);
  };

  const handleOpenEditModal = (b: Bookmark) => {
    setEditingBookmarkId(b.id);
    setBookmarkDraft({ name: b.name, url: b.url });
    setIsBookmarkModalOpen(true);
  };

  const handleSaveBookmark = async () => {
    if (!user) return;
    
    let finalUrl = bookmarkDraft.url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    const bookmarkName = bookmarkDraft.name || 'Без названия';

    if (editingBookmarkId) {
      const { error } = await supabase
        .from('bookmarks')
        .update({ name: bookmarkName, url: finalUrl })
        .eq('id', editingBookmarkId)
        .eq('user_id', user.id);

      if (!error) {
        setBookmarks(bookmarks.map(b => b.id === editingBookmarkId ? { ...b, name: bookmarkName, url: finalUrl } : b));
      }
    } else {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: user.id, name: bookmarkName, url: finalUrl }])
        .select()
        .single();

      if (!error && data) {
        setBookmarks([...bookmarks, { id: data.id, name: data.name, url: data.url }]);
      }
    }
    
    setIsBookmarkModalOpen(false);
  };

  const removeBookmark = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setBookmarks(bookmarks.filter(b => b.id !== id));
    }
  };

  const handleNoteChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    if (!user) return;

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, key: 'scratchpad', value: value }, { onConflict: 'user_id,key' });
  };

  const resetSettings = async () => {
    setLayouts({ lg: defaultLayout });
    const initialVisibility = {
      [MODULE_WEATHER_SAMARA]: true,
      [MODULE_WEATHER_MOSCOW]: true,
      [MODULE_RATES_COMBINED]: true,
      [MODULE_SCRATCHPAD]: true,
      [MODULE_CALCULATOR]: true,
      [MODULE_BOOKMARKS]: true,
    };
    setVisibleModules(initialVisibility);

    if (!user) return;

    await supabase.from('user_settings').delete().eq('user_id', user.id).in('key', ['layout', 'modules_visibility']);
  };

  const toggleVisibility = async (id: string, value: boolean) => {
    const updated = { ...visibleModules, [id]: value };
    setVisibleModules(updated);

    if (!user) return;

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, key: 'modules_visibility', value: JSON.stringify(updated) }, { onConflict: 'user_id,key' });
  };

const onLayoutChange = async (currentLayout: Layout, allLayouts: Layouts) => {
    if (isLayoutLoading || !user) return;
    
    const targetLayout = allLayouts.lg || currentLayout;
    
    const filteredLayout = targetLayout.filter(item => item.w > 0 && item.h > 0);

    setLayouts({ lg: filteredLayout });

    await supabase
      .from('user_settings')
      .upsert({ 
        user_id: user.id, 
        key: 'layout', 
        value: JSON.stringify(filteredLayout) 
      }, { onConflict: 'user_id,key' });
  };
  const moduleNames: Record<string, string> = {
    [MODULE_WEATHER_SAMARA]: 'Погода Самара',
    [MODULE_WEATHER_MOSCOW]: 'Погода Москва',
    [MODULE_RATES_COMBINED]: 'Курсы валют (USD/EUR)',
    [MODULE_SCRATCHPAD]: 'Быстрый блокнот',
    [MODULE_CALCULATOR]: 'Калькулятор',
    [MODULE_BOOKMARKS]: 'Закладки',
  };

  const hasHiddenModules = Object.values(visibleModules).some(v => !v);
  const baseCardStyle = "rounded-2xl bg-white dark:bg-[#1D1D29] text-black dark:text-white border border-zinc-200/60 dark:border-zinc-800/40 p-5 flex flex-col w-full h-full shadow-sm hover:shadow-md transition-shadow duration-200";

  if (isAuthLoading || !isMounted || isLayoutLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-zinc-500 bg-[#F3F3F3] dark:bg-[#11121E]">Загрузка персонального дашборда...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-xl font-bold">Доступ ограничен</h2>
        <p className="text-zinc-500 text-sm">Пожалуйста, авторизуйтесь в системе, чтобы увидеть свой персональный рабочий стол.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="space-y-5 w-full max-w-full overflow-hidden p-0.5">
        
        {/* ПАНЕЛЬ УПРАВЛЕНИЯ */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white dark:bg-[#1D1D29] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/40 text-xs shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#7B7B7B] font-medium text-sm">Информеры ({user.email}):</span>
            {hasHiddenModules ? (
              Object.keys(moduleNames).map(id => !visibleModules[id] && (
                <button
                  key={id}
                  onClick={() => toggleVisibility(id, true)}
                  className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#4578F9] hover:text-white transition duration-150 border border-zinc-200 dark:border-zinc-700 cursor-pointer text-[11px] font-medium"
                >
                  + {moduleNames[id]}
                </button>
              ))
            ) : (
              <span className="text-[#7B7B7B] italic font-medium">Все blocks отображаются</span>
            )}
          </div>
          <button 
            onClick={resetSettings} 
            className="text-[#7B7B7B] hover:text-[#4578F9] font-medium transition duration-150 underline decoration-dotted cursor-pointer"
          >
            Сбросить сетку
          </button>
        </div>

        {/* СЕТКА С ЖЕСТКОЙ ПРИВЯЗКОЙ К ДАННЫМ ИЗ БД */}
        <Responsive
          width={width}
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1280, md: 992, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
          rowHeight={85}
          onLayoutChange={onLayoutChange}
          {...{ draggableHandle: ".drag-handle" } as any}
          margin={[20, 20]}
          containerPadding={[0, 0]}
          isBounded={false}
          useCSSTransforms={true}
        >
          {Object.keys(moduleNames).map((id) => {
            if (!visibleModules[id]) return <div key={id} data-grid={{ w: 0, h: 0, x: 0, y: 0 }} className="hidden" />;

            const currentItemSettings = layouts.lg?.find(item => item.i === id) || defaultLayout.find(item => item.i === id);

            const actionsDropdown = (
              <div className="relative inline-block text-left shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === id ? null : id);
                  }}
                  className="text-[#7B7B7B] hover:text-[#4578F9] p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition duration-150 text-base leading-none font-bold cursor-pointer"
                  title="Опции"
                >
                  ⋮
                </button>
                
                {activeMenuId === id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1.5 w-38 origin-top-right rounded-xl bg-white dark:bg-[#1D1D29] border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 py-1"
                  >
                    <button
                      onClick={() => {
                        toggleVisibility(id, false);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition duration-150 font-medium cursor-pointer"
                    >
                      Скрыть информер
                    </button>
                  </div>
                )}
              </div>
            );

            // КАРТОЧКИ ПОГОДЫ
            if (id.startsWith('weather-')) {
              if (weatherLoading) {
                return (
                  <div key={id} data-grid={currentItemSettings} className={baseCardStyle + " flex items-center justify-center animate-pulse"}>
                    <span className="text-[11px] text-[#7B7B7B] uppercase font-semibold">Синхронизация...</span>
                  </div>
                );
              }
              const w = weatherData.find(item => item.id === id);
              if (!w) return <div key={id} className="hidden" />;
              return (
                <div key={w.id} data-grid={currentItemSettings} className="h-full">
                  <div className={baseCardStyle}>
                    <div className="drag-handle flex items-center justify-between gap-2 min-w-0 cursor-grab active:cursor-grabbing mb-2">
                      <span className="text-xs font-bold tracking-wider text-black dark:text-white uppercase truncate select-none">Погода • {w.city}</span>
                      {actionsDropdown}
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-4xl lg:text-5xl font-bold tracking-tight block truncate text-black dark:text-white">{w.temp}</span>
                      <div className="text-sm font-medium text-[#7B7B7B] truncate mt-1">{w.condition}</div>
                    </div>
                    <div className="text-[11px] font-mono text-[#7B7B7B] space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-3 mt-auto min-w-0">
                      <div className="flex justify-between gap-1"><span>Влажность:</span><span className="text-black dark:text-white font-bold shrink-0">{w.humidity}</span></div>
                      <div className="flex justify-between gap-1 min-w-0"><span>Ветер:</span><span className="text-black dark:text-white font-bold truncate">{w.windSpeed}</span></div>
                    </div>
                  </div>
                </div>
              );
            }

            // ОБЪЕДИНЕННАЯ КАРТОЧКА ВАЛЮТ
            if (id === MODULE_RATES_COMBINED) {
              if (ratesLoading) {
                return (
                  <div key={id} data-grid={currentItemSettings} className={baseCardStyle + " flex items-center justify-center animate-pulse"}>
                    <span className="text-[11px] text-[#7B7B7B] uppercase font-semibold">Синхронизация...</span>
                  </div>
                );
              }
              return (
                <div key={id} data-grid={currentItemSettings} className="h-full">
                  <div className={baseCardStyle}>
                    <div className="drag-handle flex items-center justify-between gap-2 mb-2 min-w-0 cursor-grab active:cursor-grabbing">
                      <span className="text-xs font-bold tracking-wider text-black dark:text-white uppercase truncate select-none">Курсы валют</span>
                      {actionsDropdown}
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-3 min-w-0 my-1 overflow-y-auto">
                      {rates.map((rate) => (
                        <div key={rate.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-2 last:border-0 last:pb-0 gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono tracking-wide">{rate.currency}</span>
                          <div className="flex items-center gap-2 min-w-0 justify-end">
                            <span className="text-lg font-bold text-black dark:text-white tracking-tight truncate">
                              {rate.value}<span className="text-xs font-normal text-[#7B7B7B] ml-0.5">₽</span>
                            </span>
                            <div className="flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-lg">
                              {rate.isUp ? (
                                <>
                                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-emerald-500 rounded-sm" />
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{rate.change}</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[5px] border-t-rose-500 rounded-sm" />
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">{rate.change}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // КАЛЬКУЛЯТОР
            if (id === MODULE_CALCULATOR) {
              return (
                <div key={id} data-grid={currentItemSettings} className="h-full">
                  <div className={baseCardStyle}>
                    <div className="drag-handle flex items-center justify-between mb-3 shrink-0 gap-2 min-w-0 cursor-grab active:cursor-grabbing">
                      <span className="text-xs font-bold tracking-wider text-black dark:text-white uppercase truncate select-none">Калькулятор</span>
                      {actionsDropdown}
                    </div>
                    <div className="flex flex-col h-full flex-1">
                      <div className="bg-zinc-50 dark:bg-[#11121E] rounded-xl p-3 flex flex-col items-end justify-center border border-zinc-200 dark:border-zinc-800 h-full min-h-[90px]">
                        <input 
                          value={calcInput}
                          onChange={(e) => handleCalc(e.target.value)}
                          placeholder="2 + 2 * 2"
                          className="w-full bg-transparent text-right text-zinc-500 dark:text-zinc-400 text-sm font-medium focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 tracking-wider mb-2"
                        />
                        <div className="text-3xl font-bold font-mono tracking-tight text-[#4578F9] truncate w-full text-right" title={calcResult || '0'}>
                          {calcResult !== '' ? calcResult : '='}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // ЗАКЛАДКИ
            if (id === MODULE_BOOKMARKS) {
              return (
                <div key={id} data-grid={currentItemSettings} className="h-full">
                  <div className={baseCardStyle}>
                    <div className="drag-handle flex items-center justify-between mb-3 shrink-0 gap-2 min-w-0 cursor-grab active:cursor-grabbing">
                      <span className="text-xs font-bold tracking-wider text-black dark:text-white uppercase truncate select-none">Закладки</span>
                      {actionsDropdown}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mt-1 overflow-y-auto">
                      {bookmarks.map(b => (
                        <div key={b.id} className="group relative bg-zinc-50 hover:bg-zinc-100 dark:bg-[#11121E] dark:hover:bg-zinc-800 transition-all duration-200 rounded-xl border border-zinc-100 dark:border-zinc-800/60 flex items-center h-[46px] px-3 shadow-sm overflow-hidden">
                          <a 
                            href={b.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[13px] sm:text-sm font-bold text-black dark:text-zinc-200 truncate w-full group-hover:max-w-[calc(100%-48px)] transition-all block"
                          >
                            {b.name}
                          </a>
                          <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-zinc-100 dark:bg-zinc-800 pl-1.5">
                            <button 
                              onClick={(e) => { e.preventDefault(); handleOpenEditModal(b); }} 
                              className="text-zinc-400 hover:text-[#4578F9] flex items-center justify-center w-6 h-6 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                              <span className="text-[12px] leading-none mb-0.5">✎</span>
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); removeBookmark(b.id); }} 
                              className="text-zinc-400 hover:text-white hover:bg-rose-500 flex items-center justify-center w-6 h-6 rounded-md"
                            >
                              <span className="text-[16px] font-bold leading-none mb-0.5">×</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={handleOpenAddModal} 
                        className="bg-transparent border-2 border-dashed border-zinc-200 hover:border-[#4578F9] dark:border-zinc-800 dark:hover:border-[#4578F9] transition-colors rounded-xl flex items-center justify-center cursor-pointer h-[46px] group"
                      >
                        <span className="text-xl text-zinc-400 group-hover:text-[#4578F9] leading-none mb-1 transition-colors">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // БЫСТРЫЙ БЛОКНОТ
            if (id === MODULE_SCRATCHPAD) {
              return (
                <div key={id} data-grid={currentItemSettings} className="h-full flex flex-col">
                  <div className={baseCardStyle}>
                    <div className="drag-handle flex items-center justify-between mb-2 shrink-0 gap-2 min-w-0 cursor-grab active:cursor-grabbing">
                      <span className="text-xs font-bold tracking-wider text-black dark:text-white uppercase truncate select-none">Быстрый блокнот</span>
                      {actionsDropdown}
                    </div>
                    <textarea
                      value={note}
                      onChange={handleNoteChange}
                      placeholder="Напишите что-нибудь важное..."
                      className="w-full flex-1 h-full resize-none rounded-xl bg-zinc-50 dark:bg-[#11121E] p-3 text-xs text-black dark:text-zinc-100 placeholder-[#7B7B7B] border border-zinc-200 dark:border-zinc-800 focus:border-[#4578F9] focus:outline-none focus:ring-1 focus:ring-[#4578F9]/30 transition duration-200 min-h-[75px] font-medium"
                    />
                  </div>
                </div>
              );
            }

            return null;
          })}
        </Responsive>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ЗАКЛАДОК */}
      {isBookmarkModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setIsBookmarkModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#1D1D29] rounded-2xl w-full max-w-xs p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider mb-5 text-black dark:text-white">
              {editingBookmarkId ? 'Редактировать' : 'Новая закладка'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Название</label>
                <input 
                  autoFocus 
                  value={bookmarkDraft.name} 
                  onChange={e => setBookmarkDraft(prev => ({...prev, name: e.target.value}))} 
                  placeholder="GitHub"
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#11121E] rounded-xl border border-zinc-200 dark:border-zinc-800 focus:border-[#4578F9] focus:outline-none focus:ring-1 focus:ring-[#4578F9]/30 text-sm font-medium text-black dark:text-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">URL адрес</label>
                <input 
                  value={bookmarkDraft.url} 
                  onChange={e => setBookmarkDraft(prev => ({...prev, url: e.target.value}))} 
                  placeholder="github.com"
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#11121E] rounded-xl border border-zinc-200 dark:border-zinc-800 focus:border-[#4578F9] focus:outline-none focus:ring-1 focus:ring-[#4578F9]/30 text-sm font-medium text-black dark:text-white transition-all" 
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => setIsBookmarkModalOpen(false)} 
                className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                ОТМЕНА
              </button>
              <button 
                onClick={handleSaveBookmark} 
                className="px-4 py-2 text-xs font-bold text-white bg-[#4578F9] hover:bg-[#3462d4] rounded-xl transition-colors cursor-pointer"
              >
                СОХРАНИТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}