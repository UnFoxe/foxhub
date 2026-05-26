'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface MetricData {
  cpu: { usage: number; temp: number };
  ram: { total: string; used: string; percentage: number };
  disk: { total: number; free: number; percentage: number };
  gpu: { name: string; usage: number; temp: number };
  timestamp: string;
}

interface HistoryData {
  time: string;
  CPU: number;
  RAM: number;
  GPU: number;
}

// Соответствие цветов статус-баров под новую палитру
const getProgressColor = (percentage: number = 0, defaultColor: string) => {
  if (percentage > 90) return 'bg-rose-500';
  if (percentage > 75) return 'bg-amber-500';
  return defaultColor;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervalMs, setIntervalMs] = useState<number>(5000);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics', { signal: controller.signal });
        const data = await res.json();
        
        if (data.error) return;

        setMetrics(data);
        
        const formattedTime = data.timestamp.includes('T') 
          ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : data.timestamp;

        setHistory((prev) => {
          const newHistory = [
            ...prev, 
            { 
              time: formattedTime, 
              CPU: data.cpu.usage, 
              RAM: data.ram.percentage, 
              GPU: data.gpu.usage 
            }
          ];
          return newHistory.slice(-15);
        });
        
        setLoading(false);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error loading metrics:", err);
        }
      }
    };

    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, intervalMs);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [intervalMs]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#4578F9]" />
          <p className="text-[#7B7B7B] text-xs font-medium tracking-wide animate-pulse">Инициализация модулей хаба...</p>
        </div>
      </div>
    );
  }

  const diskUsedPercentage = metrics ? metrics.disk.percentage : 0;
  
  // Базовый класс для карточек информеров, идентичный копии
  const baseCardStyle = "rounded-2xl bg-white dark:bg-[#1D1D29] text-black dark:text-white border border-zinc-200/60 dark:border-zinc-800/50 p-5 flex flex-col justify-between min-h-[140px] h-full shadow-sm hover:scale-[1.005] hover:shadow-md transition-all duration-200";

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden p-0.5">
      
      {/* Сервисный тулбар в стиле верхней панели из копии */}
      <div className="flex items-center justify-between gap-4 p-3.5 bg-white dark:bg-[#1D1D29] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/50 text-xs shadow-sm">
        <div className="flex items-center space-x-2 text-[#7B7B7B] font-medium pl-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Телеметрия системы в реальном времени</span>
        </div>
        
        {/* Селектор частоты обновления */}
        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-[#11121E] border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
          <label htmlFor="interval-select" className="text-[11px] text-[#7B7B7B] font-medium whitespace-nowrap">
            Интервал:
          </label>
          <select
            id="interval-select"
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="bg-transparent text-black dark:text-zinc-200 text-[11px] font-bold outline-none cursor-pointer pr-1"
          >
            <option value={1000} className="bg-white dark:bg-[#1D1D29]">1 сек</option>
            <option value={5000} className="bg-white dark:bg-[#1D1D29]">5 сек</option>
            <option value={10000} className="bg-white dark:bg-[#1D1D29]">10 сек</option>
          </select>
        </div>
      </div>

      {/* Умная адаптивная сетка карточек (как в копии) */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5 items-stretch w-full">
        
        {/* CPU Card */}
        <div className={baseCardStyle}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-[#4578F9] uppercase">Процессор</span>
            <span className="text-[10px] font-mono font-bold text-[#7B7B7B] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
              {metrics?.cpu.temp ?? 0}°C
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
              {metrics?.cpu.usage ?? 0}%
            </span>
          </div>
          {/* dark:bg-white делает трек прогресс-бара белым в темной теме */}
          <div className="w-full bg-zinc-100 dark:bg-white rounded-full h-1.5 overflow-hidden mt-auto">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.cpu.usage, 'bg-[#4578F9]')}`} 
              style={{ width: `${metrics?.cpu.usage ?? 0}%` }} 
            />
          </div>
        </div>

        {/* GPU Card */}
        <div className={baseCardStyle}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-[#4578F9] uppercase truncate" title={metrics?.gpu.name}>
              Видеокарта
            </span>
            <span className="text-[10px] font-mono font-bold text-[#7B7B7B] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
              {metrics?.gpu.temp ?? 0}°C
            </span>
          </div>
          <div className="my-2 min-w-0">
            <span className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
              {metrics?.gpu.usage ?? 0}%
            </span>
            <div className="text-[10px] font-medium text-[#7B7B7B] truncate mt-0.5" title={metrics?.gpu.name}>
              {metrics?.gpu.name ?? 'Неизвестно'}
            </div>
          </div>
          {/* dark:bg-white делает трек прогресс-бара белым в темной теме */}
          <div className="w-full bg-zinc-100 dark:bg-white rounded-full h-1.5 overflow-hidden mt-auto">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.gpu.usage, 'bg-purple-500')}`} 
              style={{ width: `${metrics?.gpu.usage ?? 0}%` }} 
            />
          </div>
        </div>

        {/* RAM Card */}
        <div className={baseCardStyle}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-[#4578F9] uppercase">Память</span>
            <span className="text-[10px] font-mono text-[#7B7B7B]">
              {metrics?.ram.used ?? 0}/{metrics?.ram.total ?? 0} GB
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
              {metrics?.ram.percentage ?? 0}%
            </span>
          </div>
          {/* dark:bg-white делает трек прогресс-бара белым в темной теме */}
          <div className="w-full bg-zinc-100 dark:bg-white rounded-full h-1.5 overflow-hidden mt-auto">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics?.ram.percentage, 'bg-emerald-500')}`} 
              style={{ width: `${metrics?.ram.percentage ?? 0}%` }} 
            />
          </div>
        </div>

        {/* Disk Card */}
        <div className={baseCardStyle}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tracking-wider text-[#4578F9] uppercase">Диск C:</span>
            <span className="text-[10px] font-mono text-[#7B7B7B]">
              из {metrics?.disk.total ?? 0} ГБ
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-bold tracking-tight text-black dark:text-white font-mono">
              {metrics?.disk.free ?? 0} ГБ
            </span>
            <div className="text-[10px] font-medium text-[#7B7B7B] mt-0.5">свободно</div>
          </div>
          {/* dark:bg-white делает трек прогресс-бара белым в темной теме */}
          <div className="w-full bg-zinc-100 dark:bg-white rounded-full h-1.5 overflow-hidden mt-auto">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(diskUsedPercentage, 'bg-amber-500')}`} 
              style={{ width: `${diskUsedPercentage}%` }} 
            />
          </div>
        </div>

      </div>

      {/* Секция графиков в стиле палитры копии */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        
        {/* График CPU / GPU */}
        <div className="rounded-2xl bg-white dark:bg-[#1D1D29] border border-zinc-200/60 dark:border-zinc-800/50 p-5 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7B7B7B] mb-4">Нагрузка чипов (CPU & GPU)</h3>
          <div className="h-60 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4578F9" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4578F9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#7B7B7B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#7B7B7B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#11121E', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="CPU" stroke="#4578F9" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                <Area type="monotone" dataKey="GPU" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorGpu)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* График RAM */}
        <div className="rounded-2xl bg-white dark:bg-[#1D1D29] border border-zinc-200/60 dark:border-zinc-800/50 p-5 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#7B7B7B] mb-4">Использование ОЗУ (RAM)</h3>
          <div className="h-60 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#7B7B7B" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#7B7B7B" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#11121E', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="RAM" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}