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
  theme?: 'light' | 'purple' | 'blue';
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
  theme = 'purple',
}) => {
  const [showDiffMenu, setShowDiffMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const toolbarTheme = {
    purple: {
      bar: 'bg-[#22114F] border-purple-500/30 text-white shadow-md',
      segmentBox: 'bg-[#150835] border border-purple-500/30',
      activeTab: 'bg-white text-purple-950 shadow-xs font-bold',
      inactiveTab: 'text-purple-200 hover:text-white hover:bg-purple-900/50',
      btn: 'bg-[#180C3D] border-purple-400/30 text-purple-200 hover:text-white hover:bg-purple-900/60',
      menu: 'bg-[#1A0B3F] border-purple-400/30 text-white shadow-xl',
      menuItem: 'hover:bg-purple-900/70 text-purple-100',
      menuHeading: 'text-purple-300/80',
    },
    blue: {
      bar: 'bg-[#0D284E] border-blue-400/30 text-white shadow-md',
      segmentBox: 'bg-[#061830] border border-blue-400/30',
      activeTab: 'bg-white text-blue-950 shadow-xs font-bold',
      inactiveTab: 'text-blue-200 hover:text-white hover:bg-blue-900/50',
      btn: 'bg-[#082247] border-blue-400/30 text-blue-200 hover:text-white hover:bg-blue-900/60',
      menu: 'bg-[#092244] border-blue-400/30 text-white shadow-xl',
      menuItem: 'hover:bg-blue-900/70 text-blue-100',
      menuHeading: 'text-blue-300/80',
    },
    light: {
      bar: 'bg-white border-slate-200 text-slate-900 shadow-xs',
      segmentBox: 'bg-slate-100 border border-slate-200',
      activeTab: 'bg-white text-slate-900 shadow-xs font-bold',
      inactiveTab: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
      btn: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
      menu: 'bg-white border-slate-200 text-slate-800 shadow-lg',
      menuItem: 'hover:bg-slate-100 text-slate-800',
      menuHeading: 'text-slate-400',
    },
  }[theme] || {
    bar: 'bg-white border-slate-200 text-slate-900',
    segmentBox: 'bg-slate-100 border border-slate-200',
    activeTab: 'bg-white text-slate-900 font-bold',
    inactiveTab: 'text-slate-600 hover:text-slate-900',
    btn: 'bg-white border-slate-200 text-slate-700',
    menu: 'bg-white border-slate-200 text-slate-800',
    menuItem: 'hover:bg-slate-100 text-slate-800',
    menuHeading: 'text-slate-400',
  };

  return (
    <div className={`no-print rounded-xl border p-2.5 transition-all ${toolbarTheme.bar}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Main View Mode Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-lg text-xs font-semibold ${toolbarTheme.segmentBox}`}>
          <button
            type="button"
            onClick={() => onChangeViewMode('editor')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'editor'
                ? toolbarTheme.activeTab
                : toolbarTheme.inactiveTab
            }`}
          >
            <Eye className="w-3.5 h-3.5 opacity-80" />
            <span>Student View</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('answer_key')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'answer_key'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : toolbarTheme.inactiveTab
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Answer Key</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('interactive')}
            id="btn-toolbar-take-test-online"
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'interactive'
                ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                : toolbarTheme.inactiveTab
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
                ? toolbarTheme.activeTab
                : toolbarTheme.inactiveTab
            }`}
          >
            <Printer className="w-3.5 h-3.5 opacity-80" />
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${toolbarTheme.btn}`}
            >
              {isDifferentiating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Differentiate</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showDiffMenu && (
              <div
                className={`absolute right-0 top-full mt-2 w-64 rounded-xl border p-1.5 z-40 space-y-1 text-xs ${toolbarTheme.menu}`}
                onMouseLeave={() => setShowDiffMenu(false)}
              >
                <div className={`px-2 py-1 text-[10px] font-bold uppercase ${toolbarTheme.menuHeading}`}>
                  AI Adaptations
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('scramble_version_b');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 transition-colors cursor-pointer ${toolbarTheme.menuItem}`}
                >
                  <Shuffle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Create Version B</div>
                    <div className="text-[10px] opacity-70">Scramble choices & order</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('simplify');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 transition-colors cursor-pointer ${toolbarTheme.menuItem}`}
                >
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Scaffold for Support</div>
                    <div className="text-[10px] opacity-70">Add hints and sentence stems</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('challenge');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 transition-colors cursor-pointer ${toolbarTheme.menuItem}`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Honors / Challenge Mode</div>
                    <div className="text-[10px] opacity-70">Higher cognitive rigor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDiffMenu(false);
                    onDifferentiate('translate_spanish');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 transition-colors cursor-pointer ${toolbarTheme.menuItem}`}
                >
                  <Languages className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Translate to Spanish</div>
                    <div className="text-[10px] opacity-70">For bilingual & dual-immersion</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Add Custom Question Button */}
          <button
            type="button"
            onClick={onOpenCustomQuestionModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${toolbarTheme.btn}`}
            title="Add your custom question"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Question</span>
          </button>

          {/* AI Generate Question Button */}
          <button
            type="button"
            onClick={() => onAddQuestion(true)}
            disabled={isAddingQuestion}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 cursor-pointer ${toolbarTheme.btn}`}
            title="Generate a new question matching this topic with AI"
          >
            {isAddingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>AI Add</span>
          </button>

          {/* Typography / Layout Controls */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFormatMenu(!showFormatMenu)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${toolbarTheme.btn}`}
              title="Worksheet styling and layout"
            >
              <Type className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showFormatMenu && (
              <div
                className={`absolute right-0 top-full mt-2 w-52 rounded-xl border p-3 z-40 space-y-3 text-xs ${toolbarTheme.menu}`}
                onMouseLeave={() => setShowFormatMenu(false)}
              >
                <div>
                  <div className={`text-[10px] font-bold uppercase mb-1.5 ${toolbarTheme.menuHeading}`}>
                    Font Size
                  </div>
                  <div className={`grid grid-cols-3 gap-1 p-0.5 rounded-lg text-center font-medium ${toolbarTheme.segmentBox}`}>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('compact')}
                      className={`py-1 rounded cursor-pointer ${
                        fontSize === 'compact' ? toolbarTheme.activeTab : toolbarTheme.inactiveTab
                      }`}
                    >
                      Small
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('standard')}
                      className={`py-1 rounded cursor-pointer ${
                        fontSize === 'standard' ? toolbarTheme.activeTab : toolbarTheme.inactiveTab
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize('large')}
                      className={`py-1 rounded cursor-pointer ${
                        fontSize === 'large' ? toolbarTheme.activeTab : toolbarTheme.inactiveTab
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>

                <div>
                  <div className={`text-[10px] font-bold uppercase mb-1.5 ${toolbarTheme.menuHeading}`}>
                    Font Style
                  </div>
                  <div className={`grid grid-cols-2 gap-1 p-0.5 rounded-lg text-center font-medium ${toolbarTheme.segmentBox}`}>
                    <button
                      type="button"
                      onClick={() => onChangeFontStyle('sans')}
                      className={`py-1 rounded font-sans cursor-pointer ${
                        fontStyle === 'sans' ? toolbarTheme.activeTab : toolbarTheme.inactiveTab
                      }`}
                    >
                      Sans Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeFontStyle('serif')}
                      className={`py-1 rounded font-serif cursor-pointer ${
                        fontStyle === 'serif' ? toolbarTheme.activeTab : toolbarTheme.inactiveTab
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-emerald-500 text-white font-bold'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black active:scale-95'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
