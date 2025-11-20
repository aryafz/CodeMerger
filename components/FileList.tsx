import React, { useState } from 'react';
import { FileCode, ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react';
import { FileData } from '../types';

interface FileListProps {
  files: FileData[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onMoveUp, onMoveDown, onRemove, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (files.length === 0) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          {files.length}
        </span>
        فایل‌های انتخاب شده
      </h3>
      <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {files.map((file, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && !isDragging;

          return (
            <div 
              key={`${file.name}-${index}`} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              class={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-move
                ${isDragging 
                  ? "opacity-50 border-dashed border-indigo-400 bg-indigo-50" 
                  : "bg-gray-50 border-gray-200 hover:bg-indigo-50/30"
                }
                ${isDragOver ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50" : ""}
              `}
            >
              <div class="flex items-center gap-3 overflow-hidden flex-1">
                 <div class="text-gray-400 group-hover:text-indigo-400 cursor-grab active:cursor-grabbing">
                   <GripVertical size={16} />
                 </div>
                 
                 <div class="p-2 bg-white border border-gray-200 text-indigo-600 rounded-lg shrink-0">
                   <FileCode size={18} />
                 </div>
                 <div class="min-w-0 flex-1">
                   <p class="text-sm font-medium text-gray-700 truncate" title={file.name}>{file.name}</p>
                   <p class="text-xs text-gray-400 truncate">{file.content.length.toLocaleString()} کاراکتر</p>
                 </div>
              </div>
              
              <div class="flex items-center gap-1 mr-2" onMouseDown={(e) => e.stopPropagation()} draggable={false}>
                <div class="flex flex-col sm:flex-row gap-1">
                  <button
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="بالا"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => onMoveDown(index)}
                    disabled={index === files.length - 1}
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="پایین"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div class="w-px h-6 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => onRemove(index)}
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="حذف فایل"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};