import React from 'react';
import { Layers, Code2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">ادغام‌کننده کد</h1>
            <p className="text-xs text-gray-500">آماده‌سازی کد برای هوش مصنوعی</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Code2 size={20} />
        </div>
      </div>
    </header>
  );
};