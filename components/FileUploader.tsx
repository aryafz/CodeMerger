import React, { useRef, useState } from 'react';
import { UploadCloud, Clipboard } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isProcessing) return;
    
    // If pasting actual files (e.g. from file explorer)
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      onFilesSelected(e.clipboardData.files);
      return;
    }

    // If pasting text content
    const text = e.clipboardData.getData('text');
    if (text) {
      e.preventDefault();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const file = new File([text], `pasted-code-${timestamp}.txt`, {
        type: 'text/plain',
      });
      onFilesSelected([file]);
    }
  };

  const triggerInput = () => {
    inputRef.current?.click();
  };

  return (
    <div class="w-full mb-8">
      <div
        tabIndex={0}
        onPaste={handlePaste}
        class={`relative group w-full h-48 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          ${dragActive 
            ? "border-indigo-500 bg-indigo-50 scale-[1.01]" 
            : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
          }
          ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isProcessing ? triggerInput : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            triggerInput();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          class="hidden"
          onChange={handleChange}
          disabled={isProcessing}
          // Accept common code extensions and zip
          accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.php,.html,.css,.json,.xml,.sql,.md,.txt,.zip,.yaml,.yml"
        />
        
        <div class="flex flex-col items-center text-center p-4">
          <div class={`p-3 rounded-full mb-3 transition-colors duration-200 ${dragActive ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
            <UploadCloud size={32} />
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-1">
            فایل‌ها یا <span class="text-indigo-600">Zip</span> را اینجا رها کنید
          </h3>
          <div class="flex items-center gap-1.5 text-sm text-gray-500">
             <span class="text-indigo-600 font-medium">کلیک کنید</span>
             <span> یا محتوا را </span>
             <span class="inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs border border-gray-200 font-mono text-gray-600">
               <Clipboard size={12} /> Ctrl+V
             </span>
             <span> کنید</span>
          </div>
          <p class="text-xs text-gray-400 mt-3">
            (js, tsx, py, html, css, json, ..., zip)
          </p>
        </div>
      </div>
    </div>
  );
};