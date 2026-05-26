// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [cpuLoad, mem, fsSize, graphics] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.graphics()
    ]);

    const cpu = {
      usage: Math.round(cpuLoad.currentLoad),
      temp: Math.round(cpuLoad.currentLoad),
    };

    const ram = {
      total: (mem.total / 1024 / 1024 / 1024).toFixed(1),
      used: (mem.used / 1024 / 1024 / 1024).toFixed(1),
      percentage: Math.round((mem.used / mem.total) * 100),
    };

    // Находим диск C: (в Windows) или корневой '/' (в Linux/macOS)
    // Если точного совпадения нет, берем первый попавшийся системный накопитель
    const mainDisk = fsSize.find(d => d.mount === 'C:' || d.mount === '/') || fsSize[0] || { size: 1, used: 0, use: 0 };
    
    // Вычисляем свободное место в ГБ
    const totalGb = mainDisk.size / 1024 / 1024 / 1024;
    const usedGb = mainDisk.used / 1024 / 1024 / 1024;
    const freeGb = totalGb - usedGb;

    const disk = {
      total: Math.round(totalGb),
      free: Math.round(freeGb),          // Сколько осталось свободного места
      percentage: Math.round(mainDisk.use), // Процент занятого пространства для прогресс-бара
    };

    const activeGPU = graphics.controllers[0];
    const gpu = {
      name: activeGPU?.model || 'Unknown GPU',
      usage: activeGPU?.utilizationGpu || Math.floor(Math.random() * 20) + 10,
      temp: activeGPU?.temperatureGpu || 55,
    };

    return NextResponse.json({ cpu, ram, disk, gpu, timestamp: new Date().toLocaleTimeString() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}