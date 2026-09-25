import React, { useState } from 'react';
import {
  Bookmark,
  Sparkles,
  Play,
  Printer,
  Trash2,
  ExternalLink,
  Search,
  Calendar,
  Layers,
  HelpCircle,
  FileQuestion,
  BookOpen,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Worksheet } from '../types';

interface UserWorksheetsDashboardProps {
  worksheets: Worksheet[];
  userDisplayName: string;
  onOpenWorksheet: (ws: Worksheet) => void;
  onTakeQuiz: (ws: Worksheet) => void;
  onPrintWorksheet: (ws: Worksheet) => void;
  onDeleteWorksheet: (id: string) => void;
  onFocusPrompt?: () => void;
  onOpenBookPdf?: (mode?: 'question_paper' | 'book') => void;
}

export const UserWorksheetsDashboard: React.FC<UserWorksheetsDashboardProps> = ({
  worksheets,
  userDisplayName,
  onOpenWorksheet,
  onTakeQuiz,
  onPrintWorksheet,
  onDeleteWorksheet,
  onFocusPrompt,
  onOpenBookPdf,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const subjects = ['all', ...Array.from(new Set(worksheets.map((w) => w.subject).filter(Boolean)))];

  const filteredWorksheets = worksheets.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.gradeLevel || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || w.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getSubjectBadgeColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (s.includes('science')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (s.includes('history') || s.includes('social')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (s.includes('english') || s.includes('art')) return 'bg-purple-50 text-purple-800 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <section className="space-y-4 animate-fadeIn" id="user-questionnaires-section">
      {worksheets.length > 0 ? (
        /* Grid of Created Questionnaires */
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Saved Questionnaires</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {worksheets.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-normal">
                    Created by you • Saved locally and to cloud
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2 flex-wrap">
              {subjects.length > 2 && (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === 'all' ? 'All Subjects' : sub}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questionnaires..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorksheets.map((ws) => (
              <div
                key={ws.id}
                className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all p-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${getSubjectBadgeColor(
                        ws.subject
                      )}`}
                    >
                      {ws.subject}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {ws.gradeLevel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {ws.title}
                    </h3>
                    {ws.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ws.subtitle}</p>
                    )}
                  </div>

                  {/* Meta Specs */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ws.questions?.length || 0} Questions</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ws.totalPoints || (ws.questions?.length || 0) * 2} pts</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenWorksheet(ws)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    title="Open in Worksheet Editor"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onTakeQuiz(ws)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    title="Take Test Online"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintWorksheet(ws)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Print Worksheet or Answer Key"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete questionnaire "${ws.title}"?`)) {
                        onDeleteWorksheet(ws.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Questionnaire"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Minimal Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center max-w-xl mx-auto space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              No assessments created yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Select a pathway from the side menu to generate your first worksheet, quiz, or parallel exam.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
