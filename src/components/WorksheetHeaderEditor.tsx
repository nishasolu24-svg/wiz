import React, { useState } from 'react';
import { Worksheet } from '../types';
import { Edit3, Check, Sparkles, School, User, Award, BookOpen } from 'lucide-react';

interface WorksheetHeaderEditorProps {
  worksheet: Worksheet;
  onUpdateHeader: (fields: Partial<Worksheet>) => void;
}

export const WorksheetHeaderEditor: React.FC<WorksheetHeaderEditorProps> = ({
  worksheet,
  onUpdateHeader,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(worksheet.title);
  const [subtitle, setSubtitle] = useState(worksheet.subtitle || '');
  const [instructions, setInstructions] = useState(worksheet.instructions);
  const [schoolName, setSchoolName] = useState(worksheet.schoolName || '');
  const [teacherName, setTeacherName] = useState(worksheet.teacherName || '');
  const [standardCode, setStandardCode] = useState(worksheet.standardCode || '');

  const handleSave = () => {
    onUpdateHeader({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      instructions: instructions.trim(),
      schoolName: schoolName.trim(),
      teacherName: teacherName.trim(),
      standardCode: standardCode.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(worksheet.title);
    setSubtitle(worksheet.subtitle || '');
    setInstructions(worksheet.instructions);
    setSchoolName(worksheet.schoolName || '');
    setTeacherName(worksheet.teacherName || '');
    setStandardCode(worksheet.standardCode || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="no-print bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Configure Header & Meta</span>
            <h3 className="text-sm font-bold text-slate-900">Worksheet Identification</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs shadow-indigo-200 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Worksheet Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subtitle / Unit</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">School Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teacher / Course</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Code</label>
            <input
              type="text"
              value={standardCode}
              onChange={(e) => setStandardCode(e.target.value)}
              placeholder="e.g. CCSS.MATH.5.NF.B"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Student Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="no-print bg-white p-5 sm:p-6 rounded-2xl border-2 border-indigo-100 shadow-md relative group transition-all overflow-hidden">
      {/* Rainbow Top Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-pink-500 to-amber-400" />

      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-5 right-5 text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 text-xs font-bold border border-indigo-200 shadow-2xs"
        title="Edit title & instructions"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Edit Details</span>
      </button>

      <div className="flex items-center gap-2 flex-wrap mb-2 text-xs text-slate-500 pt-1">
        <span className="font-bold text-slate-800">{worksheet.schoolName || 'Assessment Assessment'}</span>
        {worksheet.teacherName && <span className="text-slate-400 font-medium">• {worksheet.teacherName}</span>}
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
          {worksheet.subject}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {worksheet.gradeLevel}
        </span>
        {/* Complexity Badge */}
        {(() => {
          const diff = worksheet.difficulty || 'intermediate';
          if (diff === 'beginner' || diff === 'foundational') {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xs flex items-center gap-1">
                Beginner Complexity
              </span>
            );
          }
          if (diff === 'expert' || diff === 'advanced') {
            return (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xs flex items-center gap-1">
                Expert Complexity
              </span>
            );
          }
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xs flex items-center gap-1">
              Intermediate Complexity
            </span>
          );
        })()}
        {worksheet.standardCode && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {worksheet.standardCode}
          </span>
        )}
        {worksheet.versionLabel && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
            {worksheet.versionLabel}
          </span>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-serif font-black uppercase tracking-tight text-slate-900">
        {worksheet.title}
      </h2>

      {worksheet.subtitle && (
        <p className="text-xs sm:text-sm text-indigo-700 font-bold mt-1">Topic: {worksheet.subtitle}</p>
      )}

      {worksheet.instructions && (
        <div className="mt-3.5 p-3.5 bg-indigo-50/50 rounded-xl text-xs text-slate-800 border border-indigo-100 leading-relaxed">
          <span className="font-black text-indigo-900 uppercase text-[10px] tracking-wider mr-1.5">
            Instructions:
          </span>
          <span>{worksheet.instructions}</span>
        </div>
      )}

      {/* Source Book Citation if applicable */}
      {worksheet.sourceBook && (
        <div className="mt-3 p-3 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-violet-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-violet-600 shrink-0" />
            <div>
              <span className="font-extrabold text-violet-950">
                Source Book: {worksheet.sourceBook.title}
              </span>
              <span className="text-slate-600 ml-2">
                ({worksheet.sourceBook.chapterOrPages || 'Full Document'} • {worksheet.sourceBook.pageCount} {worksheet.sourceBook.pageCount === 1 ? 'page' : 'pages'})
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-violet-200 text-violet-900 shrink-0">
            Book Grounded
          </span>
        </div>
      )}

      {/* Source Question Paper Citation if applicable */}
      {worksheet.sourceQuestionPaper && (
        <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-950">
                Parallel Version of: {worksheet.sourceQuestionPaper.originalTitle}
              </span>
              <span className="text-slate-600 ml-2 hidden sm:inline">
                (Generated with fresh questions, varied numbers & verified answers)
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 shrink-0">
            Set B Twin Paper
          </span>
        </div>
      )}

      {/* Reading passage preview if applicable */}
      {worksheet.passage && (
        <div className="mt-3.5 p-4 bg-slate-50 rounded-xl text-xs border border-slate-300 font-serif leading-relaxed text-slate-800">
          <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider font-sans mb-1.5 border-b border-slate-200 pb-1">
            Reading Passage Context
          </div>
          <div className="whitespace-pre-line">{worksheet.passage}</div>
        </div>
      )}
    </div>
  );
};
