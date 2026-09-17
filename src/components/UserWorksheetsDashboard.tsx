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
  onOpenBookPdf?: () => void;
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
    if (s.includes('math')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (s.includes('science')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (s.includes('history') || s.includes('social')) return 'bg-rose-100 text-rose-900 border-rose-300';
    if (s.includes('english') || s.includes('art')) return 'bg-purple-100 text-purple-900 border-purple-300';
    return 'bg-indigo-100 text-indigo-900 border-indigo-300';
  };

  return (
    <section className="space-y-6 animate-fadeIn" id="user-questionnaires-section">
      {worksheets.length > 0 ? (
        /* Grid of Created Questionnaires */
        <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-indigo-100/90 p-6 sm:p-8 shadow-xl shadow-indigo-100/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-200">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>My Created Questionnaires</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-violet-100 text-violet-800 border border-violet-200">
                      {worksheets.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Created by you • Only visible and accessible to {userDisplayName || 'your account'}
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
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === 'all' ? 'All Subjects' : sub}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your questionnaires..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorksheets.map((ws) => (
              <div
                key={ws.id}
                className="group relative bg-gradient-to-b from-white to-slate-50/80 rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100/60 transition-all p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${getSubjectBadgeColor(
                        ws.subject
                      )}`}
                    >
                      {ws.subject}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {ws.gradeLevel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2">
                      {ws.title}
                    </h3>
                    {ws.subtitle && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ws.subtitle}</p>
                    )}
                  </div>

                  {/* Meta Specs */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5 text-violet-500" />
                      <span>{ws.questions?.length || 0} Questions</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{ws.totalPoints || (ws.questions?.length || 0) * 2} Points</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenWorksheet(ws)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95"
                    title="Open in Worksheet Editor"
                  >
                    <span>Open & Edit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onTakeQuiz(ws)}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Take Test Online"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintWorksheet(ws)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Print Worksheet or Answer Key"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete questionnaire "${ws.title}"?`)) {
                        onDeleteWorksheet(ws.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Questionnaire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: No questions & answers on default homepage */
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-indigo-200/80 p-8 sm:p-12 text-center shadow-lg shadow-indigo-100/30 max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-violet-200">
            <Sparkles className="w-8 h-8 text-amber-200 fill-amber-200 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ready to create your questionnaire?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Enter any topic in the prompt box above and click{' '}
              <strong className="text-violet-700 font-black">Generate Questionnaire</strong>, or
              upload curriculum materials from a book PDF.
            </p>
            <p className="text-xs text-slate-600 font-semibold bg-violet-50 text-violet-800 border border-violet-200/70 py-1.5 px-3 rounded-full inline-block mt-1">
              🔒 Privacy Guaranteed: Every questionnaire you create is strictly visible to your account.
            </p>
          </div>

          {/* Quick Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100/80">
              <div className="text-xs font-black text-indigo-900 mb-1 flex items-center gap-1.5">
                <span>🎯 Grade & Subject Aware</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Accurate elementary math problems, science systems, or history facts.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-pink-50/40 border border-purple-100/80">
              <div className="text-xs font-black text-purple-900 mb-1 flex items-center gap-1.5">
                <span>📝 Complete Answer Keys</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Step-by-step solutions, explanations, and student scaffolding hints.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100/80">
              <div className="text-xs font-black text-emerald-900 mb-1 flex items-center gap-1.5">
                <span>💻 In-Browser Testing</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Interactive digital quizzes with timers, instant grading & confetti.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            {onFocusPrompt && (
              <button
                type="button"
                onClick={onFocusPrompt}
                id="btn-empty-start-prompt"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-violet-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Enter Prompt Above</span>
              </button>
            )}

            {onOpenBookPdf && (
              <button
                type="button"
                onClick={onOpenBookPdf}
                id="btn-empty-upload-book"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-2xs transition-all active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-violet-600" />
                <span>Upload Book PDF</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
