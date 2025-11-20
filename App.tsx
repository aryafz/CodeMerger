import React, { useState, useCallback, useMemo } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { ResultViewer } from './components/ResultViewer';
import { FileList } from './components/FileList';
import { FileData } from './types';

const DEFAULT_TEMPLATE = `================================================================================
File: {fileName}
================================================================================`;

const App: React.FC = () => {
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [headerTemplate, setHeaderTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Calculate file count from the accumulated files
  const fileCount = filesData.length;

  // Derive merged content whenever filesData or headerTemplate changes
  const mergedContent = useMemo(() => {
    if (filesData.length === 0) return "";
    
    return filesData.map((file) => {
      const header = headerTemplate.replace(/{fileName}/g, file.name);
      // Ensure there is a newline after content before the next separator logic handles the join
      return `${header}\n${file.content}`;
    }).join('\n\n');
  }, [filesData, headerTemplate]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newFilesList: FileData[] = [];

    try {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Check for ZIP file by extension or MIME type
        if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
          try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            // Iterate through all files in the zip
            for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
              // Cast zipEntry to any because Object.entries might infer it as unknown depending on TS config/version
              const entry = zipEntry as any;

              // Skip directories
              if (entry.dir) continue;
              
              // Skip macOS system files
              if (relativePath.includes('__MACOSX') || relativePath.includes('.DS_Store')) continue;

              try {
                // Read content as string
                const content = await entry.async("string");
                newFilesList.push({
                  name: relativePath, // Uses the full path inside the zip (e.g., src/components/App.tsx)
                  content: content
                });
              } catch (err) {
                console.warn(`Failed to read content of ${relativePath} inside zip`, err);
                newFilesList.push({
                  name: relativePath,
                  content: `[Error reading file content inside zip]`
                });
              }
            }
          } catch (err) {
            console.error("Error unzipping file:", err);
            newFilesList.push({
              name: file.name,
              content: `[Error: Failed to unzip file]`
            });
          }
        } else {
          // Process regular single file
          try {
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = event.target?.result;
                resolve(typeof result === 'string' ? result : '');
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsText(file);
            });
            
            newFilesList.push({ name: file.name, content });
          } catch (err) {
            console.error(`Error reading file ${file.name}:`, err);
            newFilesList.push({ name: file.name, content: '[Error reading file]' });
          }
        }
      }
      
      setFilesData((prevFiles) => {
        // Append new files to the existing list instead of replacing
        return [...prevFiles, ...newFilesList];
      });

    } catch (error) {
      console.error("Global error processing files:", error);
      alert("مشکلی در پردازش فایل‌ها پیش آمد.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleClear = () => {
    setFilesData([]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFilesData(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === filesData.length - 1) return;
    setFilesData(prev => {
      const newFiles = [...prev];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      return newFiles;
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    setFilesData((prev) => {
      const newFiles = [...prev];
      const [movedItem] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedItem);
      return newFiles;
    });
  };

  const handleRemoveFile = (index: number) => {
    setFilesData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div class="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />

      <main class="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">شروع کنید</h2>
            <p class="text-gray-600">
              فایل‌های پروژه یا فایل <span class="font-mono bg-gray-100 px-1 rounded">.zip</span> خود را آپلود کنید. 
              در صورت آپلود Zip، ساختار پوشه‌ها در نام فایل حفظ می‌شود.
            </p>
          </div>

          <FileUploader 
            onFilesSelected={processFiles} 
            isProcessing={isProcessing} 
          />

          {/* Settings Section */}
          <div class="mt-4 border-t border-gray-100 pt-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              class="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium"
            >
              <Settings size={16} />
              <span>تنظیمات جداکننده فایل‌ها</span>
              {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showSettings && (
              <div class="mt-4 bg-gray-50 rounded-lg p-4 animate-fade-in border border-gray-200">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  الگوی هدر فایل
                </label>
                <p class="text-xs text-gray-500 mb-2">
                  می‌توانید از <code class="bg-gray-200 px-1 rounded text-gray-700">{`{fileName}`}</code> به عنوان متغیر نام فایل استفاده کنید.
                </p>
                <textarea
                  value={headerTemplate}
                  onChange={(e) => setHeaderTemplate(e.target.value)}
                  class="w-full h-32 p-3 text-sm font-mono border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-800"
                  dir="ltr"
                  placeholder="قالب جداکننده را وارد کنید..."
                />
                <div class="mt-2 flex justify-end">
                  <button 
                    onClick={() => setHeaderTemplate(DEFAULT_TEMPLATE)}
                    class="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    بازگردانی به پیش‌فرض
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isProcessing && (
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-indigo-600 font-medium">در حال پردازش و استخراج فایل‌ها...</p>
          </div>
        )}

        {!isProcessing && filesData.length > 0 && (
          <FileList 
            files={filesData}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onReorder={handleReorder}
            onRemove={handleRemoveFile}
          />
        )}

        {!isProcessing && mergedContent && (
          <ResultViewer 
            content={mergedContent} 
            fileCount={fileCount} 
            onClear={handleClear}
          />
        )}

        {!isProcessing && !mergedContent && (
          <div class="text-center py-12 opacity-50">
            <p class="text-gray-400">هنوز فایلی آپلود نشده است</p>
          </div>
        )}
      </main>

      <footer class="bg-white border-t border-gray-200 py-6 mt-auto">
        <div class="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CodeMerger. پردازش تماماً در مرورگر شما انجام می‌شود.
        </div>
      </footer>
    </div>
  );
};

export default App;