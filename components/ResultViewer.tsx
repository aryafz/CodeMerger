import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Trash2, FileText } from 'lucide-react';

interface ResultViewerProps {
  content: string;
  fileCount: number;
  onClear: () => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ content, fileCount, onClear }) => {
  const [copied, setCopied] = useState(false);

  // Reset copied state if content changes
  useEffect(() => {
    setCopied(false);
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merged_code_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!content) return null;

  return (
    <div class="w-full animate-fade-in">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-indigo-600" size={20} />
          نتیجه ({fileCount} فایل)
        </h2>
        
        <div class="flex gap-2">
          <button
            onClick={onClear}
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="پاک کردن همه"
          >
            <Trash2 size={16} />
            <span class="hidden sm:inline">پاک کردن</span>
          </button>
        </div>
      </div>

      <div class="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col h-[600px]">
        {/* Toolbar */}
        <div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div class="flex gap-2">
            <span class="flex h-3 w-3 rounded-full bg-red-500"></span>
            <span class="flex h-3 w-3 rounded-full bg-yellow-500"></span>
            <span class="flex h-3 w-3 rounded-full bg-green-500"></span>
          </div>
          <div class="flex gap-2">
            <button
              onClick={handleDownload}
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white rounded-md transition-all"
            >
              <Download size={14} />
              دانلود .txt
            </button>
            <button
              onClick={handleCopy}
              class={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shadow-sm
                ${copied 
                  ? "bg-green-600 text-white" 
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "کپی شد!" : "کپی کل متن"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div class="relative flex-1 overflow-hidden">
          <textarea
            class="w-full h-full p-4 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
            value={content}
            readOnly
            dir="ltr" // Code is usually LTR
            spellCheck={false}
          />
        </div>
      </div>
      
      <p class="text-center text-xs text-gray-400 mt-4 mb-8">
        محتوای فوق شامل نام فایل و محتویات آن است که برای چسباندن در چت‌بات‌ها بهینه‌سازی شده است.
      </p>
    </div>
  );
};