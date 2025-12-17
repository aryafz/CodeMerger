import React, { useState, useMemo, useEffect } from 'react';
import { FileCode, ArrowUp, ArrowDown, Trash2, GripVertical, Folder, FolderOpen, List, Network, CheckSquare, Square, ChevronRight, ChevronDown } from 'lucide-react';
import { FileData } from '../types';

interface FileListProps {
  files: FileData[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemoveMultiple: (indices: number[]) => void;
}

type ViewMode = 'list' | 'tree';

// Helper type for Tree Structure
type TreeNode = {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  fileIndex?: number; // Only for files, points to original array index
};

export const FileList: React.FC<FileListProps> = ({ files, onMoveUp, onMoveDown, onRemove, onReorder, onRemoveMultiple }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Tree View State
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Reset selection when files change to prevent index mismatch errors
  useEffect(() => {
    setSelectedIndices(new Set());
  }, [files]);

  if (files.length === 0) return null;

  // --- List View Logic (Drag & Drop) ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
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

  // --- Tree View Logic ---

  // 1. Build Tree Structure
  const treeStructure = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

    files.forEach((file, index) => {
      const parts = file.name.split('/'); // Split path by slash
      let currentNode = root;

      parts.forEach((part, partIndex) => {
        const isLast = partIndex === parts.length - 1;
        const existingChild = currentNode.children.find(child => child.name === part && child.isFolder === !isLast);

        if (existingChild) {
          currentNode = existingChild;
        } else {
          const newNode: TreeNode = {
            name: part,
            path: currentNode.path ? `${currentNode.path}/${part}` : part,
            isFolder: !isLast,
            children: [],
            fileIndex: isLast ? index : undefined
          };
          currentNode.children.push(newNode);
          currentNode = newNode;
        }
      });
    });

    // Sort children: Folders first, then files, alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
      });
      nodes.forEach(node => {
        if (node.isFolder) sortNodes(node.children);
      });
    };

    sortNodes(root.children);
    return root.children;
  }, [files]);

  // 2. Toggle Folder Expansion
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // 3. Collect all file indices under a node (recursive)
  const getAllIndicesUnderNode = (node: TreeNode): number[] => {
    if (!node.isFolder && node.fileIndex !== undefined) {
      return [node.fileIndex];
    }
    return node.children.flatMap(getAllIndicesUnderNode);
  };

  // 4. Handle Selection
  const toggleSelection = (node: TreeNode) => {
    const nodeIndices = getAllIndicesUnderNode(node);
    const newSelected = new Set(selectedIndices);
    
    // Check if all indices of this node are currently selected
    const allSelected = nodeIndices.every(idx => newSelected.has(idx));

    if (allSelected) {
      // Deselect all
      nodeIndices.forEach(idx => newSelected.delete(idx));
    } else {
      // Select all
      nodeIndices.forEach(idx => newSelected.add(idx));
    }
    setSelectedIndices(newSelected);
  };

  // Check selection status for UI
  const getSelectionStatus = (node: TreeNode): 'checked' | 'unchecked' | 'indeterminate' => {
    const nodeIndices = getAllIndicesUnderNode(node);
    if (nodeIndices.length === 0) return 'unchecked';

    const selectedCount = nodeIndices.filter(idx => selectedIndices.has(idx)).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === nodeIndices.length) return 'checked';
    return 'indeterminate';
  };

  // 5. Batch Delete
  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    
    const count = selectedIndices.size;
    if (window.confirm(`آیا از حذف ${count} فایل انتخاب شده اطمینان دارید؟`)) {
      // Convert Set to Array and ensure they are numbers
      const indicesToRemove = Array.from(selectedIndices);
      onRemoveMultiple(indicesToRemove);
      // Selection will be cleared by the useEffect when files prop changes
    }
  };

  // Recursive Tree Renderer
  const renderTree = (nodes: TreeNode[], level = 0) => {
    return nodes.map((node) => {
      const selectionStatus = getSelectionStatus(node);
      const isExpanded = expandedFolders.has(node.path);
      
      return (
        <div key={node.path}>
          <div 
            className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors ${level > 0 ? 'border-r-2 border-gray-100 mr-3' : ''}`}
            style={{ paddingRight: `${level * 16 + 8}px` }}
          >
            {/* Checkbox */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelection(node);
              }}
              className={`text-gray-400 hover:text-indigo-600 ${selectionStatus === 'checked' ? 'text-indigo-600' : ''}`}
            >
              {selectionStatus === 'checked' ? <CheckSquare size={18} /> : 
               selectionStatus === 'indeterminate' ? <div className="relative"><Square size={18} /><div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-indigo-600 rounded-sm"></div></div></div> :
               <Square size={18} />}
            </button>

            {/* Expand/Collapse Icon */}
            <div 
              className="cursor-pointer p-1"
              onClick={() => node.isFolder && toggleFolder(node.path)}
              style={{ visibility: node.isFolder ? 'visible' : 'hidden' }}
            >
               {isExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-400 rtl:rotate-180" />}
            </div>

            {/* Icon & Name */}
            <div 
              className="flex items-center gap-2 flex-1 cursor-pointer select-none"
              onClick={() => node.isFolder && toggleFolder(node.path)}
            >
              {node.isFolder ? (
                 isExpanded ? <FolderOpen size={18} className="text-yellow-500" /> : <Folder size={18} className="text-yellow-500" />
              ) : (
                <FileCode size={16} className="text-indigo-500" />
              )}
              <span className={`text-sm ${node.isFolder ? 'font-semibold text-gray-700' : 'text-gray-600'}`}>
                {node.name}
              </span>
            </div>
            
            {/* Size Info (Files only) */}
            {!node.isFolder && node.fileIndex !== undefined && (
               <span className="text-xs text-gray-400 font-mono">
                 {(files[node.fileIndex].content.length / 1024).toFixed(1)} KB
               </span>
            )}
          </div>

          {/* Recursive Children */}
          {node.isFolder && isExpanded && (
            <div className="pr-2">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
            {files.length}
          </span>
          فایل‌های انتخاب شده
        </h3>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} />
            لیست
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Network size={16} />
            پوشه‌ها
          </button>
        </div>
      </div>

      {/* Controls for Tree View */}
      {viewMode === 'tree' && selectedIndices.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg mb-4 border border-red-100 animate-fade-in">
          <span className="text-sm text-red-700 font-medium">
            {selectedIndices.size} فایل انتخاب شده
          </span>
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
          >
            <Trash2 size={14} />
            حذف انتخاب شده‌ها
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {viewMode === 'list' ? (
          // --- LIST VIEW RENDER ---
          <div className="space-y-2">
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
                  className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-move
                    ${isDragging 
                      ? "opacity-50 border-dashed border-indigo-400 bg-indigo-50" 
                      : "bg-gray-50 border-gray-200 hover:bg-indigo-50/30"
                    }
                    ${isDragOver ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50" : ""}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="text-gray-400 group-hover:text-indigo-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>
                    
                    <div className="p-2 bg-white border border-gray-200 text-indigo-600 rounded-lg shrink-0">
                      <FileCode size={18} />
                    </div>
                    <div className="min-w-0 flex-1 text-left" dir="ltr">
                      <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-gray-400 truncate">{file.content.length.toLocaleString()} chars</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mr-2" onMouseDown={(e) => e.stopPropagation()} draggable={false}>
                    <div className="flex flex-col sm:flex-row gap-1">
                      <button
                        type="button"
                        onClick={() => onMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="بالا"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveDown(index)}
                        disabled={index === files.length - 1}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="پایین"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="حذف فایل"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // --- TREE VIEW RENDER ---
          <div className="space-y-1" dir="ltr">
            {renderTree(treeStructure)}
          </div>
        )}
      </div>
    </div>
  );
};