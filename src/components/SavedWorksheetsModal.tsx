import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Search,
  Trash2,
  Copy,
  Download,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Worksheet } from '../types';
import { downloadTextFile } from '../utils/exportUtils';

interface SavedWorksheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedList: Worksheet[];
  onSelectWorksheet: (ws: Worksheet) => void;
  onDeleteWorksheet: (id: string) => void;
  onImportWorksheet: (ws: Worksheet) => void;
}

export const SavedWorksheetsModal: React.FC<SavedWorksheetsModalProps> = ({
  isOpen,
  onClose,
  savedList,
  onSelectWorksheet,
  onDeleteWorksheet,
  onImportWorksheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  if (!isOpen) return null;

  const subjects = ['all', ...Array.from(new Set(savedList.map((w) => w.subject)))];

  const filteredList = savedList.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || w.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleExportAll = () => {
    const jsonStr = JSON.stringify(savedList, null, 2);
    downloadTextFile(jsonStr, `worksheet-library-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((w) => onImportWorksheet(w));
        } else if (parsed.id && parsed.title) {
          onImportWorksheet(parsed);
        }
      } catch (err) {
        alert('Invalid JSON worksheet file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">My Worksheet Library</h2>
              <p className="text-xs text-slate-500">
                {savedList.length} saved curriculum materials & assessments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Subject Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by topic, unit, subject, or grade level..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 outline-none"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === 'all' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Worksheets Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">No worksheets found</p>
              <p className="text-xs">Create a new worksheet or load starter samples</p>
            </div>
          ) : (
            filteredList.map((ws) => (
              <div
                key={ws.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs"
              >
                <div className="space-y-1 cursor-pointer flex-1" onClick={() => onSelectWorksheet(ws)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ws.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {ws.gradeLevel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {ws.questions.length} questions • {ws.totalPoints} pts
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {ws.title}
                  </h3>
                  {ws.subtitle && (
                    <p className="text-xs text-slate-500 line-clamp-1">{ws.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectWorksheet(ws)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    Open & Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteWorksheet(ws.id)}
                    title="Delete worksheet"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All (JSON)</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
