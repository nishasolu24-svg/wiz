import React, { useState } from 'react';
import {
  Eye,
  BookOpen,
  Play,
  Printer,
  Sparkles,
  Shuffle,
  Layers,
  Languages,
  Plus,
  Save,
  Check,
  Type,
  Maximize2,
  Sliders,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Worksheet } from '../types';

interface WorksheetEditorToolbarProps {
  viewMode: 'editor' | 'answer_key' | 'interactive' | 'print_preview';
  onChangeViewMode: (mode: 'editor' | 'answer_key' | 'interactive' | 'print_preview') => void;
  onDifferentiate: (mode: 'scramble_version_b' | 'simplify' | 'challenge' | 'translate_spanish') => Promise<void>;
  isDifferentiating: boolean;
  onAddQuestion: (withAi: boolean) => void;
  onOpenCustomQuestionModal: () => void;
  isAddingQuestion: boolean;
  onSaveWorksheet: () => void;
  isSaved: boolean;
  fontSize: 'compact' | 'standard' | 'large';
  onChangeFontSize: (size: 'compact' | 'standard' | 'large') => void;
  fontStyle: 'sans' | 'serif';
  onChangeFontStyle: (style: 'sans' | 'serif') => void;
  onPrint: () => void;
}

export const WorksheetEditorToolbar: React.FC<WorksheetEditorToolbarProps> = ({
  viewMode,
  onChangeViewMode,
  onDifferentiate,
  isDifferentiating,
  onAddQuestion,
  onOpenCustomQuestionModal,
  isAddingQuestion,
  onSaveWorksheet,
  isSaved,
  fontSize,
  onChangeFontSize,
  fontStyle,
  onChangeFontStyle,
  onPrint,
}) => {
  const [showDiffMenu, setShowDiffMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  return (
    <div className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-2.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Main View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChangeViewMode('editor')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'editor'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Student View</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('answer_key')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'answer_key'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Answer Key</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('interactive')}
            id="btn-toolbar-take-test-online"
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'interactive'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title="Take this questionnaire online with instant feedback"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Take Test Online</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('print_preview')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'print_preview'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Layout</span>
          </button>
        </div>

        {/* Action Controls (Differentiation, Add Question, Typography, Save) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* AI Differentiation Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDiffMenu(!showDiffMenu)}
              disabled={isDifferentiating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              {isDifferentiating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Differentiate</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDiffMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-40 space-y-1 text-xs"
                onMouseLeave={() => setShowDiffMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  AI Adaptations
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('scramble_version_b');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
                >
                  <Shuffle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Create Version B</div>
                    <div className="text-[10px] text-slate-500">Scramble choices & order</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('simplify');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Scaffold for Support</div>
                    <div className="text-[10px] text-slate-500">Add hints and sentence stems</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('challenge');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Honors / Challenge Mode</div>
                    <div className="text-[10px] text-slate-500">Higher cognitive rigor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('translate_spanish');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
                >
                  <Languages className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">Translate to Spanish</div>
                    <div className="text-[10px] text-slate-500">For bilingual & dual-immersion</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Add Custom Question Button */}
          <button
            type="button"
            onClick={onOpenCustomQuestionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            title="Add your custom question"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>+ Question</span>
          </button>

          {/* AI Generate Question Button */}
          <button
            type="button"
            onClick={() => onAddQuestion(true)}
            disabled={isAddingQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            title="Generate a new question matching this topic with AI"
          >
            {isAddingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>AI Add</span>
          </button>

          {/* Typography / Layout Controls */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Worksheet styling and layout"
            >
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFormatMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-40 space-y-3 text-xs"
                onMouseLeave={() => setShowFormatMenu(false)}
              >
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Font Size
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-center font-medium">
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('compact')}
                      className={`py-1 rounded ${
                        fontSize === 'compact' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      Small
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('standard')}
                      className={`py-1 rounded ${
                        fontSize === 'standard' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('large')}
                      className={`py-1 rounded ${
                        fontSize === 'large' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Font Style
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg text-center font-medium">
                    <button
                      type="button"
                      onClick={() => onChangeFontStyle('sans')}
                      className={`py-1 rounded font-sans ${
                        fontStyle === 'sans' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      Sans Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontStyle('serif')}
                      className={`py-1 rounded font-serif ${
                        fontStyle === 'serif' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      Academic Serif
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save to Local Library Button */}
          <button
            type="button"
            onClick={onSaveWorksheet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              isSaved
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
