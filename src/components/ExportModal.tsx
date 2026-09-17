import React, { useState } from 'react';
import {
  X,
  Share2,
  Printer,
  Copy,
  Check,
  FileText,
  Download,
  BookOpen,
  Code,
  ExternalLink,
} from 'lucide-react';
import { Worksheet } from '../types';
import { worksheetToMarkdown, copyToClipboard, downloadTextFile } from '../utils/exportUtils';
import { openPrintableInNewTab, downloadPrintableHtml } from '../utils/printHelper';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: Worksheet | null;
  onPrint: (mode: 'student' | 'answer_key') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onPrint,
}) => {
  const [copiedType, setCopiedType] = useState<'student' | 'key' | null>(null);

  if (!isOpen || !worksheet) return null;

  const handleCopy = async (includeAnswers: boolean, type: 'student' | 'key') => {
    const md = worksheetToMarkdown(worksheet, includeAnswers);
    const success = await copyToClipboard(md);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadMarkdown = (includeAnswers: boolean) => {
    const md = worksheetToMarkdown(worksheet, includeAnswers);
    const suffix = includeAnswers ? '-with-answers' : '-student';
    const filename = `${worksheet.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}${suffix}.md`;
    downloadTextFile(md, filename, 'text/markdown');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(worksheet, null, 2);
    const filename = `${worksheet.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    downloadTextFile(jsonStr, filename, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Export & Print Worksheet</h2>
              <p className="text-xs text-slate-500">
                Ready for Google Docs, Classroom, Canvas, or physical printouts
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

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Print Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Print / Save as PDF
              </label>
              <span className="text-[11px] text-slate-400">8.5 × 11 Page Layout</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span>Student Handout</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Clean blanks, multiple-choice bubbles, and lined response space.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPrint('student');
                    }}
                    className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold text-center transition-colors"
                  >
                    Print Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => openPrintableInNewTab(worksheet, 'student')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                    title="Open in new browser tab to print directly"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPrintableHtml(worksheet, 'student')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                    title="Download printable HTML file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Teacher Answer Key</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Correct answers highlighted, step-by-step solutions, and teacher notes.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onPrint('answer_key');
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center transition-colors"
                  >
                    Print Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => openPrintableInNewTab(worksheet, 'answer_key')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                    title="Open answer key in new browser tab to print directly"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPrintableHtml(worksheet, 'answer_key')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                    title="Download printable answer key HTML file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Copy to Clipboard (LMS / Docs) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Copy to Clipboard (for Google Docs / LMS)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleCopy(false, 'student')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Student Text</span>
                </div>
                {copiedType === 'student' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(true, 'key')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy with Answer Key</span>
                </div>
                {copiedType === 'key' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Downloads */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Download File
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadMarkdown(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Student Handout (.md)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadMarkdown(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>With Answer Key (.md)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Code className="w-3.5 h-3.5 text-slate-400" />
                <span>Raw JSON Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
