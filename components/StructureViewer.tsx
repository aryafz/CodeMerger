import React, { useMemo, useState } from 'react';
import { Network, Copy, Check, FolderTree } from 'lucide-react';
import { FileData } from '../types';

interface StructureViewerProps {
  files: FileData[];
}

export const StructureViewer: React.FC<StructureViewerProps> = ({ files }) => {
  const [copied, setCopied] = useState(false);

  const treeString = useMemo(() => {
    if (files.length === 0) return '';

    // Step 1: Build a nested object structure
    const root: any = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      let current = root;
      parts.forEach((part, i) => {
        if (!current[part]) {
          // If it's the last part, it's a file (null value), otherwise a folder (object value)
          current[part] = i === parts.length - 1 ? null : {};
        }
        current = current[part];
      });
    });

    // Step 2: Recursive function to generate the string
    let output = '';
    const traverse = (node: any, prefix: string) => {
      const keys = Object.keys(node).sort((a, b) => {
        // Sort: Folders first, then files
        const aIsFolder = node[a] !== null;
        const bIsFolder = node[b] !== null;
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.localeCompare(b);
      });

      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const marker = isLast ? '└── ' : '├── ';
        output += `${prefix}${marker}${key}\n`;

        if (node[key] !== null) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          traverse(node[key], newPrefix);
        }
      });
    };

    output += '.\n'; // Root notation
    traverse(root, '');
    return output.trim();
  }, [files]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(treeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy tree:", err);
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="w-full mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FolderTree className="text-indigo-600" size={20} />
          ساختار درختی پروژه
        </h2>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="text-xs text-gray-400 font-mono">Project Structure</div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shadow-sm
              ${copied 
                ? "bg-green-600 text-white" 
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "کپی شد" : "کپی ساختار"}
          </button>
        </div>

        {/* Content Area */}
        <div className="relative overflow-auto max-h-[300px] custom-scrollbar">
          <pre className="p-4 text-green-400 font-mono text-sm leading-relaxed whitespace-pre" dir="ltr">
            {treeString}
          </pre>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        این ساختار درختی برای ارائه دید کلی از پروژه به هوش مصنوعی بسیار مفید است.
      </p>
    </div>
  );
};