import React, { useState } from 'react';
import {
  Printer,
  ExternalLink,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  Type,
} from 'lucide-react';
import { Worksheet } from '../types';
import {
  executePrint,
  openPrintableInNewTab,
  downloadPrintableHtml,
  isRunningInIframe,
} from '../utils/printHelper';

interface PrintToolbarProps {
  worksheet: Worksheet;
  mode: 'student' | 'answer_key';
  onChangeMode: (mode: 'student' | 'answer_key') => void;
  fontSize: 'compact' | 'standard' | 'large';
  onChangeFontSize: (size: 'compact' | 'standard' | 'large') => void;
  fontStyle: 'sans' | 'serif';
  onChangeFontStyle: (style: 'sans' | 'serif') => void;
  onExit: () => void;
}

export const PrintToolbar: React.FC<PrintToolbarProps> = ({
  worksheet,
  mode,
  onChangeMode,
  fontSize,
  onChangeFontSize,
  fontStyle,
  onChangeFontStyle,
  onExit,
}) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const inIframe = isRunningInIframe();

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  const handlePrintNow = async () => {
    const res = await executePrint(worksheet, mode, fontSize, fontStyle);
    if (res.methodUsed === 'new_tab') {
      showNotification('Opened in a clean printable tab with print dialog ready!', 'success');
    } else if (res.methodUsed === 'download') {
      showNotification('Downloaded printable file. Open it to print anytime!', 'success');
    } else {
      showNotification('Opening browser print dialog...', 'info');
    }
  };

  const handleOpenNewTab = () => {
    openPrintableInNewTab(worksheet, mode, fontSize, fontStyle);
    showNotification('Opened in new tab! Press Ctrl+P (or Cmd+P) if dialog does not auto-open.', 'success');
  };

  const handleDownload = () => {
    downloadPrintableHtml(worksheet, mode, fontSize, fontStyle);
    showNotification('Saved printable HTML file to your computer!', 'success');
  };

  return (
    <div className="no-print space-y-2.5">
      {/* Main Bar */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-3 sm:p-4 shadow-md shadow-indigo-100/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Back button & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
            title="Return to interactive questionnaire editor"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Student vs Answer Key Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => onChangeMode('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Student Handout</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('answer_key')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'answer_key'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Answer Key</span>
            </button>
          </div>
        </div>

        {/* Right: Typography & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end">
          {/* Font Controls */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={fontSize}
              onChange={(e) => onChangeFontSize(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="compact">Compact Font</option>
              <option value="standard">Standard Font</option>
              <option value="large">Large Font</option>
            </select>
            <span className="text-slate-300">•</span>
            <select
              value={fontStyle}
              onChange={(e) => onChangeFontStyle(e.target.value as any)}
              className="bg-transparent text-slate-700 font-medium text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="sans">Clean Sans</option>
              <option value="serif">Formal Serif</option>
            </select>
          </div>

          {/* Open in New Tab Button (Crucial for iframe environments) */}
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Open in a standalone browser tab with print dialog ready"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open in Tab</span>
          </button>

          {/* Download File Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
            title="Download standalone printable HTML file (opens and prints offline in any browser)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Download File</span>
            <span className="sm:hidden">Save</span>
          </button>

          {/* Print Now Primary Button */}
          <button
            type="button"
            onClick={handlePrintNow}
            id="btn-print-now-primary"
            className="flex items-center gap-1.5 px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Print Now</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-indigo-400 hover:text-indigo-700 font-bold text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Embedded Iframe Helper Notice */}
      {inIframe && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note for Preview:</strong> If your browser blocks print dialogs inside the embedded preview iframe, click <strong>Open in Tab</strong> or <strong>Download File</strong> to print or save to PDF immediately.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
