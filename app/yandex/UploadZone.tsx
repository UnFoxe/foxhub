// app/files/UploadZone.tsx
"use client"

import { useState, useRef } from "react"
import { uploadFileToDisk } from "./actions"

interface QueueItem {
  id: string
  file: File
}

export default function UploadZone({ currentPath }: { currentPath: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]) // Очередь файлов на загрузку
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Перехват drag-событий браузера
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  // Хелпер для добавления уникальных файлов в текущую очередь
  const addFilesToQueue = (files: FileList) => {
    const newItems: QueueItem[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Генерируем уникальный ID на основе имени, размера и времени
      const id = `${file.name}-${file.size}-${Date.now()}-${i}`
      newItems.push({ id, file })
    }
    setUploadQueue((prev) => [...prev, ...newItems])
  }

  // Обработка сброса файлов (Drag & Drop) с ПК
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (isUploading) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files)
    }
  }

  // Обработка выбора файлов через стандартный клик и диалоговое окно
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files)
      // Сбрасываем значение инпута, чтобы можно было выбрать те же файлы повторно
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Удаление конкретного файла из списка перед отправкой
  const removeFileFromQueue = (idToRemove: string) => {
    if (isUploading) return
    setUploadQueue((prev) => prev.filter((item) => item.id !== idToRemove))
  }

  // Отправка всех файлов на сервер по очереди
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (uploadQueue.length === 0 || isUploading) return

    setIsUploading(true)

    try {
      // Загружаем файлы поочередно, чтобы не перегружать API Яндекса одним запросом
      for (const item of uploadQueue) {
        const formData = new FormData()
        formData.append("currentPath", currentPath)
        formData.append("file", item.file)

        await uploadFileToDisk(formData)
      }
      
      // Очищаем очередь после успешной загрузки всех файлов
      setUploadQueue([])
    } catch (err) {
      alert("Произошла ошибка при загрузке файлов")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#1E1F22] p-5 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-colors">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Интерактивная зона для Drag & Drop и Клика */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative group bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-600 dark:text-zinc-400 
            ${isDragActive 
              ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" 
              : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
        >
          {/* Скрытый инпут теперь имеет text-transparent, чтобы браузер не рендерил свой белый текст */}
          <input 
            type="file" 
            name="file" 
            multiple
            ref={fileInputRef}
            disabled={isUploading}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed text-transparent" 
          />
          
          <span className="text-2xl block mb-2 group-hover:scale-105 transition-transform">
            {isUploading ? "⏳" : isDragActive ? "📥" : "✨"}
          </span>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {isDragActive 
              ? "Отпустите файлы для добавления" 
              : "Перетащите файлы сюда (можно несколько)"
            }
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-1">
            или нажмите для выбора на компьютере
          </span>
        </div>

        {/* СПИСОК ВЫБРАННЫХ ФАЙЛОВ С ВОЗМОЖНОСТЬЮ УДАЛЕНИЯ */}
        {uploadQueue.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-1">
              Файлы к загрузке ({uploadQueue.length})
            </div>
            
            {uploadQueue.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60 p-2 rounded-xl text-xs transition-colors group/item"
              >
                <span className="text-zinc-700 dark:text-zinc-300 truncate font-mono max-w-[80%] pl-1" title={item.file.name}>
                  {item.file.name}
                </span>
                
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => removeFileFromQueue(item.id)}
                  className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 disabled:opacity-0 p-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition cursor-pointer text-[11px]"
                  title="Исключить из списка"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ИНДИКАТОР АКТИВНОЙ ЗАГРУЗКИ */}
        {isUploading && (
          <div className="space-y-1.5 px-1 animate-in fade-in duration-200">
            <div className="flex justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <span>Синхронизация с облаком...</span>
              <span className="animate-pulse">В процессе</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full w-1/2 absolute top-0 left-0 animate-loading-bar" />
            </div>
          </div>
        )}

        {/* КНОПКА ОТПРАВКИ */}
        <button 
          type="submit" 
          disabled={isUploading || uploadQueue.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition shadow-md shadow-blue-600/5 cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? "Отправка..." : `Загрузить файлы (${uploadQueue.length})`}
        </button>
      </form>
    </div>
  )
}