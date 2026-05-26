// app/files/page.tsx
import { signIn, signOut, auth } from "@/auth"
import Link from "next/link"
import { getFolderContents, getDiskDiskInfo } from "./actions"
import FileCard from "./FileCard"
import UploadZone from "./UploadZone"

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 МБ'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  if (i <= 1) return parseFloat((bytes / (1024 * 1024)).toFixed(2)) + ' МБ'
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

function getFileTypeMeta(name: string, type: "dir" | "file", mediaType?: string) {
  if (type === "dir") return { icon: "📁", label: "Папка" }
  const ext = name.split('.').pop()?.toLowerCase() || 'file'
  if (mediaType === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return { icon: "🖼️", label: "Изображение" }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: "🗜️", label: "Архив" }
  if (['exe', 'msi', 'bat'].includes(ext)) return { icon: "⚙️", label: "Приложение" }
  if (['doc', 'docx', 'txt', 'pdf', 'odt'].includes(ext)) return { icon: "📄", label: "Документ" }
  if (mediaType === 'video' || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: "🎬", label: "Видео" }
  return { icon: "📄", label: "Файл" }
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>
}) {
  const session = await auth()
  const resolvedSearchParams = await searchParams
  const currentPath = resolvedSearchParams.path || "/"

  const [diskInfo, items] = session 
    ? await Promise.all([getDiskDiskInfo(), getFolderContents(currentPath)]) 
    : [null, []]

  const diskUsed = diskInfo?.used_space || 0
  const diskTotal = diskInfo?.total_space || 1
  const usedPercentage = Math.round((diskUsed / diskTotal) * 100)

  const sortedFolders = items.filter((item: any) => item.type === "dir")
  const sortedFiles = items.filter((item: any) => item.type === "file")
  const allItems = [...sortedFolders, ...sortedFiles]

  const getParentPath = () => {
    if (currentPath === "/") return "/"
    const parts = currentPath.split("/").filter(Boolean)
    parts.pop()
    return parts.length ? "/" + parts.join("/") : "/"
  }

  const renderBreadcrumbs = () => {
    if (currentPath === "/") {
      return <span className="text-zinc-400 dark:text-zinc-500 font-mono">/</span>
    }

    const segments = currentPath.split("/").filter(Boolean)
    let accumulatedPath = ""

    return (
      <div className="flex items-center gap-1 font-mono text-xs">
        <Link href="?path=/" className="text-blue-600 dark:text-blue-400 hover:underline">
          root
        </Link>
        {segments.map((segment, index) => {
          accumulatedPath += `/${segment}`
          const isLast = index === segments.length - 1

          return (
            <div key={accumulatedPath} className="flex items-center gap-1">
              <span className="text-zinc-400 dark:text-zinc-600">/</span>
              {isLast ? (
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold max-w-[120px] truncate">
                  {segment}
                </span>
              ) : (
                <Link 
                  href={`?path=${encodeURIComponent(accumulatedPath)}`} 
                  className="text-blue-600 dark:text-blue-400 hover:underline max-w-[120px] truncate"
                >
                  {segment}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full font-sans transition-colors duration-200">
      
      {/* ХЕДЕР СТРОКА: КРОШКИ + СТАТИСТИКА В СТРОЧКУ + ВЫХОД */}
      {session && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 w-full">
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-[#1E1F22] border border-zinc-200/50 dark:border-zinc-800/50 px-3.5 py-2 rounded-xl shadow-sm transition-colors">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Путь:</span>
              {renderBreadcrumbs()}
            </div>
            {currentPath !== "/" && (
              <Link href={`?path=${getParentPath()}`} className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-[#1E1F22] px-3.5 py-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition flex items-center gap-1.5">
                <span>←</span> Назад
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#1E1F22] p-2 pl-4 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 transition-colors ml-auto">
            
            {/* Компактный прогресс-бар памяти на уровне кнопки Выйти */}
            {diskInfo && (
              <div className="flex items-center gap-3 pr-4 border-r border-zinc-200/60 dark:border-zinc-800">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Диск</span>
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    {formatBytes(diskUsed, 1)} из {formatBytes(diskTotal, 0)}
                  </span>
                </div>
                <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative" title={`Занято: ${usedPercentage}%`}>
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${usedPercentage}%` }} 
                  />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">{usedPercentage}%</span>
              </div>
            )}

            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Аккаунт: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{session.user?.name}</strong>
            </span>
            
            <form action={async () => { "use server"; await signOut() }}>
              <button className="bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-zinc-200/60 dark:border-zinc-700">
                Выйти
              </button>
            </form>
          </div>
        </div>
      )}

      {!session ? (
        <div className="text-center py-24 bg-white dark:bg-[#1E1F22] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm max-w-md mx-auto mt-12 transition-colors">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
            ☁️
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Добро пожаловать</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-xs mx-auto">
            Авторизуйтесь через Яндекс ID для доступа к облаку.
          </p>
          <form action={async () => { "use server"; await signIn("yandex") }}>
            <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/10 transition cursor-pointer">
              Войти через Яндекс ID
            </button>
          </form>
        </div>
      ) : (
        /* Одноколоночная структура: всё растягивается на 100% ширины */
        <div className="flex flex-col gap-6 w-full items-stretch">
          
          {/* ЗОНА ЗАГРУЗКИ СВЕРХУ */}
          <div className="w-full">
            <UploadZone currentPath={currentPath} />
          </div>

          {/* СЕТКА ФАЙЛОВ СНИЗУ */}
          <div className="w-full">
            {allItems.length === 0 ? (
              <div className="text-center text-zinc-400 dark:text-zinc-500 py-20 font-medium text-sm bg-white dark:bg-[#1E1F22] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 transition-colors">
                В этой папке пока ничего нет
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1F22] p-6 sm:p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 min-h-[60vh] shadow-sm transition-colors"> 
                {/* Расширен диапазон колонок сетки для больших экранов до 2xl:grid-cols-12 */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-x-4 gap-y-8">
                  {allItems.map((item: any) => {
                    const meta = getFileTypeMeta(item.name, item.type, item.media_type)
                    return (
                      <FileCard 
                        key={item.resource_id}
                        item={item}
                        meta={meta}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}