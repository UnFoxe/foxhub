'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Terminal, Cpu, HardDrive, Users, Activity, Settings2 } from 'lucide-react';

interface LogMessage {
  id: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  text: string;
}

interface ServerData {
  status: 'offline' | 'starting' | 'online' | 'stopping';
  logs: string[];
  metrics: {
    cpu: number;
    ramUsed: number;
    ramMax: number;
    tps: number;
    playersOnline: number;
    playersMax: number;
  };
}

export default function MinecraftServerPage() {
  const [serverStatus, setServerStatus] = useState<'offline' | 'starting' | 'online' | 'stopping'>('offline');
  const [commandInput, setCommandInput] = useState('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [metrics, setMetrics] = useState({
    cpu: 0,
    ramUsed: 0,
    ramMax: 8.0,
    tps: 0,
    playersOnline: 0,
    playersMax: 0
  });

  const consoleEndRef = useRef<HTMLDivElement>(null);
  

 // Периодический опрос бэкенда
// Периодический опрос бэкенда
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/minecraft');
        if (!res.ok) return;

        const data: ServerData = await res.json();
        setServerStatus(data.status);
        setMetrics(data.metrics);

        setLogs((prev) => {
          // 1. Если это самая первая загрузка страницы (консоль пуста) — просто отображаем всё, что есть
          if (prev.length === 0) {
            return data.logs.map((text, index) => ({
              id: `srv-init-${index}-${Date.now()}`,
              type: 'INFO',
              text: text
            }));
          }

          // 2. Извлекаем чистый текст только тех строк, которые пришли от сервера (игнорируем cmd-вводы)
          const currentServerLines = prev
            .filter((l) => l.id.startsWith('srv-'))
            .map((l) => l.text);

          // 3. Умный поиск перекрытия (overlap) между старыми и новыми логами
          let newLogLines = data.logs;
          const maxPossibleOverlap = Math.min(currentServerLines.length, data.logs.length);

          for (let overlapLen = maxPossibleOverlap; overlapLen > 0; overlapLen--) {
            const currentTail = currentServerLines.slice(-overlapLen);
            const incomingHead = data.logs.slice(0, overlapLen);

            // Если концовка наших логов совпала с началом входящих логов — мы нашли точку склейки!
            if (JSON.stringify(currentTail) === JSON.stringify(incomingHead)) {
              newLogLines = data.logs.slice(overlapLen); // Отрезаем то, что уже видели
              break;
            }
          }

          // Если свежих строк в файле логов не появилось — возвращаем состояние без изменений
          if (newLogLines.length === 0) return prev;

          // 4. Превращаем исключительно новые строки в объекты сообщений
          const newServerLogs: LogMessage[] = newLogLines.map((text, index) => ({
            id: `srv-${Date.now()}-${index}-${Math.random()}`,
            type: 'INFO',
            text: text
          }));

          // Добавляем новые логи строго в конец. Ваши ответы RCON (cmd-out) не пострадают!
          return [...prev, ...newServerLogs].slice(-100);
        });

      } catch (error) {
        console.error('Ошибка получения логов:', error);
      }
    };

    fetchServerState();
    const interval = setInterval(fetchServerState, 1500);
    return () => clearInterval(interval);
  }, []);
  // Автопрокрутка веб-терминала вниз
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const sendAction = async (action: 'START' | 'STOP' | 'RESTART') => {
    if (action === 'START') setServerStatus('starting');
    if (action === 'STOP') setServerStatus('stopping');
    try {
      await fetch('/api/minecraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (error) {
      console.error(`Ошибка:`, error);
    }
  };

const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || serverStatus !== 'online') return;

    const currentCommand = commandInput;
    setCommandInput('');

    // 1. СРАЗУ (мгновенно) добавляем команду в UI
    const timeIn = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    const cmdLog: LogMessage = { 
      id: `cmd-in-${Date.now()}`, 
      type: 'INFO', 
      text: `[${timeIn}] > ${currentCommand}` 
    };
    
    setLogs(prev => [...prev, cmdLog].slice(-100));

    try {
      const res = await fetch('/api/minecraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMMAND', command: currentCommand })
      });
      
      const data = await res.json();

      // 2. Если есть ответ (например, на команду /list), добавляем его
      if (data.response) {
        const timeOut = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        setLogs(prev => [...prev, { 
          id: `cmd-out-${Date.now()}`, 
          type: 'SUCCESS' as const, 
          text: `[${timeOut}] Ответ RCON: ${data.response}` 
        }].slice(-100));
      } else {
        // 3. Если это команда типа 'say' (которая не дает ответа RCON),
        // но мы хотим видеть её в чате, добавим подтверждение отправки
        const timeOut = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        setLogs(prev => [...prev, { 
          id: `cmd-out-${Date.now()}`, 
          type: 'INFO'  as const, 
          text: `[${timeOut}] Команда отправлена на сервер.` 
        }].slice(-100));
      }

    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const baseCardStyle = "rounded-2xl bg-white dark:bg-[#1D1D29] text-black dark:text-white border border-zinc-200/60 dark:border-zinc-800/40 p-5 flex flex-col w-full h-full shadow-sm";

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden p-0.5 flex flex-col h-full">
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-[#1D1D29] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/40 shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="text-[#7B7B7B] font-medium text-sm">Статус сервера:</span>
          {serverStatus === 'online' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> РАБОТАЕТ
            </span>
          )}
          {serverStatus === 'starting' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-spin" /> ЗАПУСКАЕТСЯ...
            </span>
          )}
          {serverStatus === 'stopping' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-500/20">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> ОСТАНОВКА...
            </span>
          )}
          {serverStatus === 'offline' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 font-bold text-xs border border-zinc-500/20">
              <span className="h-2 w-2 rounded-full bg-zinc-400" /> ВЫКЛЮЧЕН
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => sendAction('START')} disabled={serverStatus !== 'offline'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs transition shadow-sm disabled:cursor-not-allowed"><Play className="w-3.5 h-3.5" /> Запустить</button>
          <button onClick={() => sendAction('STOP')} disabled={serverStatus !== 'online'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs transition shadow-sm disabled:cursor-not-allowed"><Square className="w-3.5 h-3.5" /> Остановить</button>
          <button onClick={() => sendAction('RESTART')} disabled={serverStatus !== 'online'} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 disabled:opacity-40 font-semibold text-xs transition border border-zinc-200 dark:border-zinc-700 disabled:cursor-not-allowed"><RefreshCw className="w-3.5 h-3.5" /> Перезапуск</button>
        </div>
      </div>

      {/* СЕТКА С КОНСОЛЬЮ И МЕТРИКАМИ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start flex-1 min-h-0">
        
        {/* ЛЕВАЯ КОЛОНКА (4 из 12) */}
        <div className="xl:col-span-4 space-y-5">
          <div className={baseCardStyle}>
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4">
              <Activity className="w-4 h-4 text-[#4578F9]" />
              <span className="text-xs font-bold tracking-wider uppercase select-none">Производительность</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1"><span className="text-zinc-500 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Процессор</span><span className="font-bold font-mono">{metrics.cpu}%</span></div>
                <div className="w-full bg-zinc-100 dark:bg-[#11121E] h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${metrics.cpu}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1"><span className="text-zinc-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Оперативная память</span><span className="font-bold font-mono">{metrics.ramUsed} GB / {metrics.ramMax} GB</span></div>
                <div className="w-full bg-zinc-100 dark:bg-[#11121E] h-2 rounded-full overflow-hidden"><div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${(metrics.ramUsed / metrics.ramMax) * 100}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1"><span className="text-zinc-500 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Стабильность (TPS)</span><span className={`font-bold font-mono ${metrics.tps > 19.5 ? 'text-emerald-500' : metrics.tps > 15 ? 'text-amber-500' : 'text-rose-500'}`}>{metrics.tps.toFixed(2)}</span></div>
                <div className="w-full bg-zinc-100 dark:bg-[#11121E] h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(metrics.tps / 20) * 100}%` }}/></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium mb-1"><span className="text-zinc-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Игроки онлайн</span><span className="font-bold font-mono">{metrics.playersOnline} / {metrics.playersMax}</span></div>
                <div className="w-full bg-zinc-100 dark:bg-[#11121E] h-2 rounded-full overflow-hidden"><div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${metrics.playersMax > 0 ? (metrics.playersOnline / metrics.playersMax) * 100 : 0}%` }}/></div>
              </div>
            </div>
          </div>

          {/* КОНФИГУРАЦИЯ */}
          <div className={baseCardStyle}>
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-3">
              <Settings2 className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold tracking-wider uppercase select-none">Параметры запуска</span>
            </div>
            <div className="text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-1.5"><span className="text-zinc-400">Файл ядра:</span><span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md text-[11px]">paper.jar</span></div>
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-1.5"><span className="text-zinc-400">Макс. ОЗУ (-Xmx):</span><span className="font-mono text-zinc-700 dark:text-zinc-300">8 GB</span></div>
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/40 pb-1.5"><span className="text-zinc-400">Мин. ОЗУ (-Xms):</span><span className="font-mono text-zinc-700 dark:text-zinc-300">2 GB</span></div>
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1"><span>Дополнительно:</span><span className="font-mono italic">nogui</span></div>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (8 из 12) */}
        <div className="xl:col-span-8 flex flex-col h-full min-h-[460px]">
          <div className={`${baseCardStyle} flex-1 flex flex-col min-h-0`}>
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4 shrink-0">
              <Terminal className="w-4 h-4 text-[#4578F9]" />
              <span className="text-xs font-bold tracking-wider uppercase select-none">Живой терминал сервера</span>
            </div>

            {/* КОНСОЛЬ */}
            <div className="flex-1 bg-zinc-950 text-zinc-200 font-mono text-[11px] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner overflow-y-auto space-y-1 h-64 min-h-0 select-text">
              {logs.length === 0 ? (
                <div className="text-zinc-600 italic text-center pt-12 select-none">
                  {serverStatus === 'offline' ? 'Сервер оффлайн. Запустите его, чтобы увидеть логи.' : 'Ожидание вывода логов...'}
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed break-all">
                    <span className={`font-semibold mr-1.5 ${
                      log.type === 'WARN' ? 'text-amber-400' :
                      log.type === 'ERROR' ? 'text-rose-400' :
                      log.type === 'SUCCESS' ? 'text-emerald-400' : 'text-sky-400'
                    }`}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>

            {/* ВВОД КОМАНД */}
            <form onSubmit={handleSendCommand} className="mt-4 flex items-center gap-2 shrink-0">
              <div className="flex-1 bg-zinc-50 dark:bg-[#11121E] rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-[#4578F9] px-3 py-2.5 flex items-center gap-2 transition duration-200">
                <span className="text-zinc-400 font-mono font-bold select-none">&gt;</span>
                <input 
                  type="text" 
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  disabled={serverStatus !== 'online'}
                  placeholder={serverStatus === 'online' ? "Введите команду сервера (например, op Nickname, list, stop)..." : "Терминал заблокирован (сервер выключен)"}
                  className="w-full bg-transparent text-xs font-mono font-medium focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-black dark:text-white disabled:cursor-not-allowed"
                />
              </div>
              <button type="submit" disabled={serverStatus !== 'online' || !commandInput.trim()} className="px-4 py-2.5 bg-[#4578F9] hover:bg-[#3462d4] text-white font-bold text-xs rounded-xl disabled:opacity-40 transition cursor-pointer shadow-sm disabled:cursor-not-allowed">Отправить</button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}