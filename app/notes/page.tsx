// app/notes/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash, 
  Edit, 
  Tag, 
  MoreVertical, 
  Search, 
  X, 
  Calendar,
  Eye,
  GripHorizontal
} from 'lucide-react';

interface Column {
  id: string;
  title: string;
}

interface NoteCard {
  id: string;
  columnId: string;
  title: string;
  content: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  color: string;
  updatedAt: string;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'Сделать' },
  { id: 'in-progress', title: 'В работе' },
  { id: 'done', title: 'Готово' }
];

const DEFAULT_NOTES: NoteCard[] = [
  {
    id: 'note-1',
    columnId: 'todo',
    title: 'Разработать архитектуру SPA',
    content: 'Спроектировать структуру компонентов, настроить стейт для колонок и карточек заметок.',
    tags: ['React', 'Архитектура'],
    priority: 'high',
    color: 'border-l-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/5',
    updatedAt: new Date().toLocaleDateString('ru-RU')
  },
  {
    id: 'note-2',
    columnId: 'in-progress',
    title: 'Интеграция Tailwind CSS',
    content: 'Сверстать канбан-доску в стильных темных тонах (палитра Slate/Zinc), добавить кастомные скроллбары.',
    tags: ['UI', 'Tailwind'],
    priority: 'medium',
    color: 'border-l-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/5',
    updatedAt: new Date().toLocaleDateString('ru-RU')
  }
];

const PRIORITIES = {
  low: { label: 'Низкий', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Средний', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  high: { label: 'Высокий', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
};

const CARD_COLORS = [
  { id: 'zinc', class: 'border-l-zinc-400 dark:border-l-zinc-500 bg-zinc-500/[0.04] dark:bg-zinc-500/5', label: 'Стандартный' },
  { id: 'rose', class: 'border-l-rose-500 bg-rose-500/[0.04] dark:bg-rose-500/5', label: 'Розовый' },
  { id: 'amber', class: 'border-l-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/5', label: 'Янтарный' },
  { id: 'emerald', class: 'border-l-emerald-500 bg-emerald-500/[0.04] dark:bg-emerald-500/5', label: 'Изумрудный' },
  { id: 'indigo', class: 'border-l-indigo-500 bg-indigo-500/[0.04] dark:bg-indigo-500/5', label: 'Индиго' },
];

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [notes, setNotes] = useState<NoteCard[]>(DEFAULT_NOTES);
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [activeMobileColumn, setActiveMobileColumn] = useState('todo');
  
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  const [currentNote, setCurrentNote] = useState<NoteCard | null>(null);
  const [targetColumnId, setTargetColumnId] = useState('');

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formColor, setFormColor] = useState(CARD_COLORS[0].class);
  const [formTags, setFormTags] = useState('');
  const [formColumnTitle, setFormColumnTitle] = useState('');

  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');

  useEffect(() => {
    const savedColumns = localStorage.getItem('kb_columns');
    const savedNotes = localStorage.getItem('kb_notes');
    if (savedColumns) setColumns(JSON.parse(savedColumns));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('kb_columns', JSON.stringify(columns));
  }, [columns, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('kb_notes', JSON.stringify(notes));
  }, [notes, isLoaded]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuNoteId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => note.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const handleCardDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.setData('drag-type', 'card');
    setDraggedCardId(noteId);
  };

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    e.dataTransfer.setData('text/plain', columnId);
    e.dataTransfer.setData('drag-type', 'column');
    setDraggedColumnId(columnId);
  };

  const handleColumnDragOver = (targetColId: string) => {
    if (!draggedColumnId || draggedColumnId === targetColId) return;

    const sourceIndex = columns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = columns.findIndex(c => c.id === targetColId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updatedColumns = [...columns];
      const [removed] = updatedColumns.splice(sourceIndex, 1);
      updatedColumns.splice(targetIndex, 0, removed);
      setColumns(updatedColumns);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (draggedColumnId) {
      handleColumnDragOver(targetColumnId);
    } else if (draggedCardId) {
      if (dragOverColumn !== targetColumnId) setDragOverColumn(targetColumnId);
    }
  };

  const handleDragLeave = () => setDragOverColumn(null);

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const dragType = e.dataTransfer.getData('drag-type');
    const sourceId = e.dataTransfer.getData('text/plain');

    if (!sourceId) return;

    if (dragType === 'card') {
      setNotes(prev => prev.map(note => 
        note.id === sourceId ? { ...note, columnId: targetColId, updatedAt: new Date().toLocaleDateString('ru-RU') } : note
      ));
    }
    setDraggedColumnId(null);
    setDraggedCardId(null);
  };

  const handleBoardWrapperDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedColumnId(null);
    setDraggedCardId(null);
    setDragOverColumn(null);
  };

  const openCreateModal = (columnId: string) => {
    setTargetColumnId(columnId);
    setCurrentNote(null);
    setFormTitle(''); setFormContent(''); setFormTags('');
    setFormPriority('medium');
    setFormColor(CARD_COLORS[0].class);
    setModalOpen(true);
  };

  const openEditModal = (note: NoteCard) => {
    setCurrentNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormPriority(note.priority);
    setFormColor(note.color);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setModalOpen(true);
    setActiveMenuNoteId(null);
  };

  const openViewModal = (note: NoteCard) => {
    setCurrentNote(note);
    setViewModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedTags = formTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (currentNote) {
      setNotes(prev => prev.map(n => n.id === currentNote.id ? {
        ...n, title: formTitle, content: formContent, priority: formPriority, color: formColor, tags: parsedTags, updatedAt: new Date().toLocaleDateString('ru-RU')
      } : n));
    } else {
      setNotes(prev => [...prev, {
        id: `note-${Date.now()}`, columnId: targetColumnId, title: formTitle, content: formContent, priority: formPriority, color: formColor, tags: parsedTags, updatedAt: new Date().toLocaleDateString('ru-RU')
      }]);
    }
    setModalOpen(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Удалить эту заметку?')) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setActiveMenuNoteId(null);
      setViewModalOpen(false);
    }
  };

  const handleSaveColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formColumnTitle.trim()) return;

    const newId = `col-${Date.now()}`;
    setColumns(prev => [...prev, { id: newId, title: formColumnTitle.trim() }]);
    setActiveMobileColumn(newId);
    setColumnModalOpen(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 1) return alert('Нельзя удалить единственную колонку!');
    if (confirm('При удалении колонки её карточки будут перенесены в первую доступную колонку. Продолжить?')) {
      const firstCol = columns.find(c => c.id !== columnId);
      if (firstCol) {
        setNotes(prev => prev.map(n => n.columnId === columnId ? { ...n, columnId: firstCol.id } : n));
        setColumns(prev => prev.filter(c => c.id !== columnId));
        if (activeMobileColumn === columnId) setActiveMobileColumn(firstCol.id);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* СЕРВИСНЫЙ ТУЛБАР */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/40 p-4 rounded-2xl backdrop-blur-md mb-6 shrink-0 shadow-sm">
        <div className="flex flex-1 sm:flex-none items-center gap-3">
          {/* Поиск */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input 
              type="text"
              placeholder="Поиск заметок..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100/70 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 text-xs pl-9 pr-8 py-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 transition-all placeholder-zinc-400 dark:placeholder-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Теги */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-zinc-100/70 dark:bg-zinc-900/40 text-xs pl-8 pr-8 py-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 appearance-none text-zinc-600 dark:text-zinc-400 cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-zinc-950">Все теги</option>
              {allTags.map(tag => (
                <option key={tag} value={tag} className="bg-white dark:bg-zinc-950">#{tag}</option>
              ))}
            </select>
            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => { setFormColumnTitle(''); setColumnModalOpen(true); }}
          className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 biographies text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
        >
          <Plus size={14} />
          <span>Новая колонка</span>
        </button>
      </div>

      {/* МОБИЛЬНАЯ НАВИГАЦИЯ КОЛОНОК */}
      <div className="md:hidden flex overflow-x-auto bg-white dark:bg-zinc-950/40 p-1 rounded-xl gap-1 mb-4 shrink-0 border border-zinc-200 dark:border-zinc-800/40 shadow-sm">
        {columns.map(col => {
          const count = notes.filter(n => n.columnId === col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileColumn(col.id)}
              className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeMobileColumn === col.id 
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm' 
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {col.title} <span className="ml-1 text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* КАНБАН СЕТКА */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleBoardWrapperDrop}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-start gap-5 pb-4 max-h-[calc(100vh-11rem)] min-h-[400px]"
      >
        {columns.map(col => {
          const columnNotes = filteredNotes.filter(note => note.columnId === col.id);
          const isOver = dragOverColumn === col.id;
          const isColumnBeingDragged = draggedColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-full md:w-80 shrink-0 flex flex-col bg-white dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl self-stretch max-h-full transition-all duration-150 shadow-sm ${
                activeMobileColumn !== col.id ? 'hidden md:flex' : 'flex'
              } ${isOver ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-50/[0.01]' : ''} ${
                isColumnBeingDragged ? 'opacity-25 border-dashed border-zinc-300 dark:border-zinc-700/50 bg-zinc-50/[0.01]' : ''
              }`}
            >
              {/* Колонка: Заголовок */}
              <div 
                draggable
                onDragStart={(e) => handleColumnDragStart(e, col.id)}
                className="p-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/40 bg-zinc-50 dark:bg-zinc-950/40 rounded-t-2xl cursor-grab active:cursor-grabbing select-none group/hdr"
              >
                <div className="flex items-center gap-2 truncate flex-1">
                  <GripHorizontal size={13} className="text-zinc-400 dark:text-zinc-600 group-hover/hdr:text-zinc-600 dark:group-hover/hdr:text-white transition-colors shrink-0" />
                  {editingColumnId === col.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingColumnTitle}
                      onChange={(e) => setEditingColumnTitle(e.target.value)}
                      onBlur={() => {
                        if (editingColumnTitle.trim()) {
                          setColumns(prev => prev.map(c => c.id === col.id ? { ...c, title: editingColumnTitle.trim() } : c));
                        }
                        setEditingColumnId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingColumnTitle.trim()) {
                          setColumns(prev => prev.map(c => c.id === col.id ? { ...c, title: editingColumnTitle.trim() } : c));
                          setEditingColumnId(null);
                        }
                      }}
                      className="bg-white dark:bg-zinc-950 text-xs font-semibold px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none w-full text-zinc-900 dark:text-white"
                    />
                  ) : (
                    <h3 
                      onClick={(e) => { e.stopPropagation(); setEditingColumnId(col.id); setEditingColumnTitle(col.title); }}
                      className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-white hover:text-zinc-800 dark:hover:text-white transition-colors truncate max-w-[150px] cursor-pointer"
                    >
                      {col.title}
                    </h3>
                  )}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 font-mono">{columnNotes.length}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }} 
                  className="text-zinc-400 dark:text-zinc-600 hover:text-rose-500 p-1 transition-colors ml-2"
                >
                  <Trash size={13} />
                </button>
              </div>

              {/* Колонка: Тело */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
                {columnNotes.length === 0 ? (
                  <div className="h-full min-h-[120px] flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-600 font-medium">Перетащите сюда карточку</p>
                  </div>
                ) : (
                  columnNotes.map(note => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={(e) => handleCardDragStart(e, note.id)}
                      onClick={() => openViewModal(note)}
                      className={`group relative p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 border-l-4 ${note.color} hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-200 cursor-grab active:cursor-grabbing bg-zinc-50/40 dark:bg-[#1d1d29] flex flex-col gap-2.5 shadow-sm select-none`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${PRIORITIES[note.priority]?.color}`}>
                          {PRIORITIES[note.priority]?.label}
                        </span>

                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id); }}
                            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {activeMenuNoteId === note.id && (
                            <div ref={menuRef} className="absolute right-0 top-6 w-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openEditModal(note)} className="w-full text-left px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                                <Edit size={12} /> Изменить
                              </button>
                              <button onClick={() => openViewModal(note)} className="w-full text-left px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                                <Eye size={12} /> Развернуть
                              </button>
                              <div className="border-t border-zinc-200 dark:border-zinc-900 my-1"></div>
                              <button onClick={() => handleDeleteNote(note.id)} className="w-full text-left px-2 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-lg flex items-center gap-2 font-medium">
                                <Trash size={12} /> Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                     <div>
                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors break-words">{note.title}</h4>
                        {note.content && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed break-words whitespace-pre-wrap">
                            {note.content}
                          </p>
                        )}
                      </div>

                      {(note.tags?.length > 0 || note.updatedAt) && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          <div className="flex flex-wrap gap-1">
                            {note.tags?.map(tag => (
                              <span key={tag} className="text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/40 px-1.5 py-0.5 rounded">#{tag}</span>
                            ))}
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0"><Calendar size={10} /> {note.updatedAt}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  onClick={() => openCreateModal(col.id)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900/60 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-950/80 transition-all flex items-center justify-center gap-1.5 font-medium"
                >
                  <Plus size={13} /> Добавить карточку
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* МОДАЛКА ПРОСМОТРА */}
      {viewModalOpen && currentNote && (
        <div onClick={() => setViewModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden cursor-default">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${PRIORITIES[currentNote.priority]?.color}`}>
                {PRIORITIES[currentNote.priority]?.label} приоритет
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setViewModalOpen(false); openEditModal(currentNote); }} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors">
                  <Edit size={13} />
                </button>
                <button onClick={() => handleDeleteNote(currentNote.id)} className="text-zinc-500 dark:text-zinc-400 hover:text-rose-500 p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors">
                  <Trash size={13} />
                </button>
                <button onClick={() => setViewModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 ml-1"><X size={16} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 break-words">{currentNote.title}</h3>
              {currentNote.content ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap break-words bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl">
                  {currentNote.content}
                </p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">Нет описания у этой заметки.</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 font-mono">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Tag size={12} className="text-zinc-400 dark:text-zinc-600" />
                  {currentNote.tags && currentNote.tags.length > 0 ? (
                    currentNote.tags.map(tag => (
                      <span key={tag} className="text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-md">#{tag}</span>
                    ))
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-600 text-[11px]">Нет тегов</span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-900 Logan px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800"><Calendar size={12} /> Обновлено: {currentNote.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden cursor-default">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{currentNote ? 'Редактировать задачу' : 'Новая заметка'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveNote} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Заголовок *</label>
                <input type="text" required placeholder="Название..." value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Описание заметки</label>
                <textarea rows={6} placeholder="Добавьте развернутое описание..." value={formContent} onChange={(e) => setFormContent(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 resize-none placeholder-zinc-400 dark:placeholder-zinc-600 leading-relaxed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Приоритет исполнения</label>
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <option value="low" className="bg-white dark:bg-zinc-950">🟢 Низкий приоритет</option>
                    <option value="medium" className="bg-white dark:bg-zinc-950">🟡 Средний приоритет</option>
                    <option value="high" className="bg-white dark:bg-zinc-950">🔴 Высокий приоритет</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Теги (через запятую)</label>
                  <input type="text" placeholder="Например: Срочно, Дизайн" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Цветовой маркер карточки</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CARD_COLORS.map(color => (
                    <button key={color.id} type="button" onClick={() => setFormColor(color.class)} className={`py-2 text-[11px] font-semibold border rounded-xl truncate transition-all ${formColor === color.class ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 hover:dark:border-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold rounded-xl transition-colors">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ КОЛОНКИ */}
      {columnModalOpen && (
        <div onClick={() => setColumnModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden cursor-default">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Создать новую колонку</h3>
              <button onClick={() => setColumnModalOpen(false)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveColumn} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Название колонки *</label>
                <input type="text" required autoFocus placeholder="Например: В очереди..." value={formColumnTitle} onChange={(e) => setFormColumnTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setColumnModalOpen(false)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold rounded-xl transition-colors">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}