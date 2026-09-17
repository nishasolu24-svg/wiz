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
    <div className="no-print bg-white rounded-2xl border-2 border-indigo-100 shadow-md shadow-indigo-100/40 p-3.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Main View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => onChangeViewMode('editor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'editor'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Eye className={`w-3.5 h-3.5 ${viewMode === 'editor' ? 'text-amber-300' : 'text-indigo-600'}`} />
            <span>Student View</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('answer_key')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'answer_key'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${viewMode === 'answer_key' ? 'text-emerald-200' : 'text-emerald-600'}`} />
            <span>Answer Key & Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('interactive')}
            id="btn-toolbar-take-test-online"
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'interactive'
                ? 'bg-gradient-to-r from-amber-500 via-pink-500 to-violet-600 text-white shadow-md font-black ring-2 ring-pink-300 scale-105'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-extrabold'
            }`}
            title="Take this questionnaire online with digital answer inputs and instant feedback"
          >
            <Play className={`w-3.5 h-3.5 ${viewMode === 'interactive' ? 'fill-white text-white' : 'fill-emerald-700 text-emerald-700'}`} />
            <span>Take Test Online</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
              viewMode === 'interactive' ? 'bg-white/30 text-white' : 'bg-emerald-600 text-white'
            }`}>
              Interactive
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('print_preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'print_preview'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Printer className={`w-3.5 h-3.5 ${viewMode === 'print_preview' ? 'text-cyan-200' : 'text-slate-700'}`} />
            <span>Print Layout</span>
          </button>
        </div>

        {/* Action Controls (Differentiation, Add Question, Typography, Save) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Differentiation Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDiffMenu(!showDiffMenu)}
              disabled={isDifferentiating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white shadow-sm shadow-purple-200 transition-all disabled:opacity-50"
            >
              {isDifferentiating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-200" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Differentiate</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showDiffMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 space-y-1 text-xs animate-scaleIn"
                onMouseLeave={() => setShowDiffMenu(false)}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  AI Adaptations & Variations
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('scramble_version_b');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors"
                >
                  <Shuffle className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="font-semibold">Create Version B</div>
                    <div className="text-[10px] text-slate-500">Scramble choices & values to prevent cheating</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('simplify');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">Scaffold for Struggling Students</div>
                    <div className="text-[10px] text-slate-500">Add hints, sentence stems, and word banks</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('challenge');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold">Honors / Extension Mode</div>
                    <div className="text-[10px] text-slate-500">Higher Bloom's taxonomy & analytical rigor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('translate_spanish');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition-colors"
                >
                  <Languages className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-semibold">Translate to Spanish</div>
                    <div className="text-[10px] text-slate-500">For bilingual, ELL, and dual-immersion classes</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Add Custom Question Button */}
          <button
            type="button"
            onClick={onOpenCustomQuestionModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all active:scale-95"
            title="Add your custom question with multiple choice options"
          >
            <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
            <span>+ Custom Question</span>
          </button>

          {/* AI Generate Question Button */}
          <button
            type="button"
            onClick={() => onAddQuestion(true)}
            disabled={isAddingQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm shadow-cyan-200 transition-all active:scale-95"
            title="Generate a new question matching this topic with AI"
          >
            {isAddingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            )}
            <span>AI Question</span>
          </button>

          {/* Typography / Layout Controls */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Worksheet styling and layout"
            >
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFormatMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40 space-y-3 text-xs"
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isSaved
                ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200 active:scale-95'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved to Library' : 'Save Worksheet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
