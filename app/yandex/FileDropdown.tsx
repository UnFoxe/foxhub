// app/files/FileDropdown.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { deleteResource, getDownloadLink } from "./actions"

export default function FileDropdown({ filePath }: { filePath: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDownload = async () => {
    setIsOpen(false)
    const res = await getDownloadLink(filePath)
    if (res.href) {
      window.open(res.href, "_blank")
    } else {
      alert(res.error || "Ошибка при скачивании")
    }
  }

  const handleDelete = async () => {
    if (confirm("Вы уверены, что хотите удалить этот файл?")) {
      setIsOpen(false)
      const res = await deleteResource(filePath)
      if (res?.error) alert(res.error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-xl transition cursor-pointer text-lg font-bold w-9 h-9 flex items-center justify-center transition-colors"
      >
        ⋮
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-10 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 rounded-2xl shadow-xl py-2 w-36 z-50 animate-in fade-in slide-in-from-top-1 duration-100 transition-colors">
          <button 
            onClick={handleDownload} 
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
          >
            📥 Скачать
          </button>
          <button 
            onClick={handleDelete} 
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            🗑️ Удалить
          </button>
        </div>
      )}
    </div>
  )
}