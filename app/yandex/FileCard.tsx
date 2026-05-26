// app/files/FileCard.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { deleteResource, getDownloadLink, publishResource } from "./actions"

interface FileCardProps {
  item: {
    type: "dir" | "file"
    path: string
    name: string
    size?: number
    preview?: string
    media_type?: string
    public_url?: string
  }
  meta: {
    icon: string
    label: string
  }
}

interface ContextMenuState {
  visible: boolean; x: number; y: number
}

export default function FileCard({ item, meta }: FileCardProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null)
  const [isLoadingFullImage, setIsLoadingFullImage] = useState(false)
  
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState(item.public_url || "")
  const [isCopied, setIsCopied] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  
  const isDir = item.type === "dir"
  const isImage = item.type === "file" && item.media_type === "image"
  const isShared = !!shareUrl || !!item.public_url

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu()
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeContextMenu()
        setIsPreviewOpen(false)
        setIsShareOpen(false)
      }
    }
    if (contextMenu.visible) document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [contextMenu.visible])

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0 })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }

  const handleOpenPreview = async () => {
    closeContextMenu()
    if (!isImage) return
    setIsPreviewOpen(true)
    if (fullImageSrc) return
    setIsLoadingFullImage(true)
    try {
      const res = await getDownloadLink(item.path)
      if (res.href) setFullImageSrc(res.href)
      else setIsPreviewOpen(false)
    } catch {
      setIsPreviewOpen(false)
    } finally {
      setIsLoadingFullImage(false)
    }
  }

  const handleDownload = async () => {
    closeContextMenu()
    if (isDir) return
    const res = await getDownloadLink(item.path)
    if (res.href) window.open(res.href, "_blank")
  }

  const handleShareClick = async () => {
    closeContextMenu()
    setIsCopied(false)
    if (shareUrl) {
      setIsShareOpen(true)
      return
    }
    try {
      const res = await publishResource(item.path)
      if (res.publicUrl) {
        setShareUrl(res.publicUrl)
        setIsShareOpen(true)
      }
    } catch (err) {
      alert("Ошибка публикации")
    }
  }

  const handleDelete = async () => {
    closeContextMenu()
    if (confirm(`Удалить ${isDir ? 'папку' : 'файл'} "${item.name}"?`)) {
      await deleteResource(item.path)
    }
  }

  const RenderContent = () => (
    <div className="flex flex-col items-center text-center h-full justify-between group select-none">
      
      {/* ИКОНКА / ПРЕВЬЮ */}
      {/* Изменено: w-20 h-20 -> w-full flex-1 для адаптивности под больший размер картинки */}
      <div className="relative w-full flex-1 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 min-h-[96px]">
        {isImage && item.preview ? (
          /* Изменено: w-16 h-16 -> w-24 h-24 (увеличили превью картинки) */
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 shadow-md transition-colors">
            <img src={item.preview} alt={item.name} className="object-cover w-full h-full" />
          </div>
        ) : isDir ? (
          <span className="text-[5rem] leading-none text-[#F1C40F] drop-shadow-sm">📁</span>
        ) : (
          <div className="relative flex flex-col items-center">
            <span className="text-[4.5rem] leading-none text-zinc-400 dark:text-zinc-500 drop-shadow-sm">
              {meta.icon === "⚙️" ? "📄" : meta.icon}
            </span>
            {!["🖼️", "🎬"].includes(meta.icon) && (
              <span className="absolute bottom-4 bg-zinc-500 dark:bg-zinc-600 text-[10px] font-black text-white px-1 py-0.5 rounded uppercase tracking-wider scale-90">
                {item.name.split('.').pop()?.slice(0, 3)}
              </span>
            )}
          </div>
        )}

        {/* Значок ссылки */}
        {isShared && (
          /* Скорректировано позиционирование под новый размер */
          <div className="absolute bottom-1 right-1 md:right-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md transition-colors">
            🔗
          </div>
        )}
      </div>

      {/* НАЗВАНИЕ СНИЗУ ПОД ИКОНКОЙ */}
      <div className="w-full mt-2">
        <p 
          className="text-xs font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 px-1 break-all tracking-tight leading-tight"
          title={item.name}
        >
          {item.name}
        </p>
      </div>

    </div>
  )

  return (
    <>
      {/* Изменено: max-h-32 -> max-h-40 (увеличили высоту карточки, чтобы поместилось превью и текст) */}
      <div onContextMenu={handleContextMenu} className="w-full aspect-square max-h-40 mb-4">
        {isDir ? (
          <Link href={`?path=${encodeURIComponent(item.path.replace("disk:", ""))}`} className="block h-full w-full">
            <RenderContent />
          </Link>
        ) : (
          <div onClick={isImage ? handleOpenPreview : undefined} className="h-full w-full cursor-pointer">
            <RenderContent />
          </div>
        )}
      </div>

      {/* КОНТЕКСТНОЕ МЕНЮ (АДАПТИРОВАНО) */}
      {contextMenu.visible && (
        <div 
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-white dark:bg-[#2D303E] border border-zinc-200 dark:border-zinc-700/50 rounded-xl shadow-2xl py-1 w-48 z-[100] text-zinc-800 dark:text-zinc-200 flex flex-col animate-in fade-in zoom-in-95 duration-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleShareClick} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition cursor-pointer">
            <span className="text-sm opacity-80">📤</span> Поделиться
          </button>
          
          {isImage && (
            <button onClick={handleOpenPreview} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition cursor-pointer">
              <span className="text-sm opacity-80">👁️</span> Просмотреть
            </button>
          )}

          <div className="h-[1px] bg-zinc-200 dark:bg-zinc-700/50 my-1" />

          {!isDir && (
            <button onClick={handleDownload} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition cursor-pointer">
              <span className="text-sm opacity-80">📥</span> Скачать
            </button>
          )}
          
          <button onClick={handleDelete} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer">
            <span className="text-sm">🗑️</span> Удалить
          </button>
        </div>
      )}

      {/* МОДАЛКА ПУБЛИЧНОГО ДОСТУПА (АДАПТИРОВАНА) */}
      {isShareOpen && (
        <div onClick={() => setIsShareOpen(false)} className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#2D303E] border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 w-full max-w-md shadow-2xl text-zinc-900 dark:text-zinc-100 relative cursor-default transition-colors">
            <button onClick={() => setIsShareOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-sm bg-zinc-100 dark:bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors">✕</button>
            <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><span>🔗</span> Публичный доступ</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 truncate">{item.name}</p>
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-xl transition-colors">
              <input type="text" readOnly value={shareUrl} onClick={(e) => (e.target as HTMLInputElement).select()} className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none flex-1 px-2 font-mono" />
              <button 
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl)
                  setIsCopied(true); setTimeout(() => setIsCopied(false), 2000)
                }} 
                className={`text-xs font-bold px-4 py-2 rounded-lg transition min-w-[100px] ${isCopied ? "bg-emerald-600 text-white" : "bg-blue-600 dark:bg-blue-500 text-white"}`}
              >
                {isCopied ? "Готово! ✓" : "Копировать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРОСМОТРА КАРТИНКИ */}
      {isPreviewOpen && (
        <div onClick={() => setIsPreviewOpen(false)} className="fixed inset-0 bg-black/80 dark:bg-black/95 backdrop-blur-md z-[90] flex items-center justify-center p-4 cursor-zoom-out">
          <div className="relative max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {isLoadingFullImage ? (
              <div className="text-white text-xs font-semibold animate-pulse">Загрузка оригинала...</div>
            ) : (
              fullImageSrc && <img src={fullImageSrc} alt={item.name} className="object-contain max-w-full max-h-[85vh] rounded-xl shadow-2xl animate-in zoom-in-95 duration-150" />
            )}
          </div>
        </div>
      )}
    </>
  )
}