import React from 'react';
import {
  Sparkles,
  FileQuestion,
  BookOpen,
  FolderArchive,
  Play,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';

interface QuickFeaturesGridProps {
  savedCount: number;
  onOpenPromptStudio: () => void;
  onOpenQuestionPaper: () => void;
  onOpenBookPdf: () => void;
  onOpenSavedQuestionnaires: () => void;
  onOpenCustomDirectives: () => void;
  onOpenTakeTest: () => void;
  theme?: 'light' | 'purple' | 'blue';
}

export const QuickFeaturesGrid: React.FC<QuickFeaturesGridProps> = ({
  savedCount,
  onOpenPromptStudio,
  onOpenQuestionPaper,
  onOpenBookPdf,
  onOpenSavedQuestionnaires,
  onOpenCustomDirectives,
  onOpenTakeTest,
  theme = 'purple',
}) => {
  const gridTheme = {
    purple: {
      heading: 'text-purple-300',
      pill: 'bg-purple-500/25 text-purple-200 border-purple-400/30',
      subtext: 'text-purple-300/70',
      card: 'bg-[#22114F] border-purple-500/30 hover:border-purple-400 hover:bg-[#2A1560] shadow-md',
      title: 'text-white group-hover:text-amber-300',
      desc: 'text-purple-200/80',
      footer: 'border-purple-500/20 text-amber-300 group-hover:text-amber-200',
      defaultTag: 'bg-purple-500/25 text-purple-200 border-purple-400/30',
    },
    blue: {
      heading: 'text-blue-300',
      pill: 'bg-blue-500/25 text-blue-200 border-blue-400/30',
      subtext: 'text-blue-300/70',
      card: 'bg-[#0D284E] border-blue-400/30 hover:border-blue-300 hover:bg-[#113261] shadow-md',
      title: 'text-white group-hover:text-cyan-300',
      desc: 'text-blue-200/80',
      footer: 'border-blue-400/20 text-cyan-300 group-hover:text-cyan-200',
      defaultTag: 'bg-blue-500/25 text-blue-200 border-blue-400/30',
    },
    light: {
      heading: 'text-slate-500',
      pill: 'bg-slate-100 text-slate-700 border-slate-200',
      subtext: 'text-slate-400',
      card: 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50 shadow-2xs',
      title: 'text-slate-900 group-hover:text-purple-700',
      desc: 'text-slate-500',
      footer: 'border-slate-100 text-purple-600 group-hover:text-purple-700',
      defaultTag: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }[theme] || {
    heading: 'text-slate-500',
    pill: 'bg-slate-100 text-slate-700 border-slate-200',
    subtext: 'text-slate-400',
    card: 'bg-white border-slate-200',
    title: 'text-slate-900',
    desc: 'text-slate-500',
    footer: 'border-slate-100 text-purple-600',
    defaultTag: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const quickLinks = [
    {
      id: 'prompt_studio',
      title: 'Prompt from Topic',
      tag: 'Studio',
      description: 'Enter any topic, unit or standard to generate assessment questions with Gemini 3.8 Flash',
      icon: Sparkles,
      iconColor: 'bg-purple-600 text-white',
      accentColor: 'hover:border-purple-300 hover:bg-purple-50/40',
      actionText: 'Open Studio',
      onClick: onOpenPromptStudio,
    },
    {
      id: 'upload_exam',
      title: 'Upload Exam PDF (Set B)',
      tag: 'Set B Twin',
      description: 'Upload sample exam PDF to generate a parallel twin question paper',
      icon: FileQuestion,
      iconColor: 'bg-indigo-600 text-white',
      accentColor: 'hover:border-indigo-300 hover:bg-indigo-50/40',
      actionText: 'Upload PDF',
      onClick: onOpenQuestionPaper,
    },
    {
      id: 'upload_book',
      title: 'Textbook / Notes PDF',
      tag: 'Direct Text',
      description: 'Upload textbook or notes PDF to formulate questions directly from source pages',
      icon: BookOpen,
      iconColor: 'bg-blue-600 text-white',
      accentColor: 'hover:border-blue-300 hover:bg-blue-50/40',
      actionText: 'Upload Book',
      onClick: onOpenBookPdf,
    },
    {
      id: 'saved_questionnaires',
      title: 'Saved Questionnaires',
      tag: `${savedCount} Saved`,
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Access your private library of generated quizzes, twin papers, and worksheets',
      icon: FolderArchive,
      iconColor: 'bg-emerald-600 text-white',
      accentColor: 'hover:border-emerald-300 hover:bg-emerald-50/40',
      actionText: 'View Library',
      onClick: onOpenSavedQuestionnaires,
    },
    {
      id: 'take_test',
      title: 'Take Test Online',
      tag: 'Interactive',
      description: 'Launch self-paced interactive test mode with instant score grading and hints',
      icon: Play,
      iconColor: 'bg-teal-600 text-white',
      accentColor: 'hover:border-teal-300 hover:bg-teal-50/40',
      actionText: 'Start Test',
      onClick: onOpenTakeTest,
    },
    {
      id: 'custom_directives',
      title: 'Custom Directives',
      tag: 'Rubrics',
      description: 'Tune grade level, question distribution, Bloom taxonomy, and answer rubrics',
      icon: SlidersHorizontal,
      iconColor: 'bg-slate-700 text-white',
      accentColor: 'hover:border-slate-300 hover:bg-slate-50',
      actionText: 'Configure',
      onClick: onOpenCustomDirectives,
    },
  ];

  return (
    <section className="no-print space-y-3.5 pt-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${gridTheme.heading}`}>
            Quick Link Features
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${gridTheme.pill}`}>
            1-Click Access
          </span>
        </div>
        <span className={`text-xs ${gridTheme.subtext}`}>
          Also accessible in the side menu
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              id={`quick-link-${item.id}`}
              className={`group p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${gridTheme.card}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${item.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.tagColor || gridTheme.defaultTag
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>

                <h4 className={`text-sm font-bold transition-colors mb-1 tracking-tight ${gridTheme.title}`}>
                  {item.title}
                </h4>
                <p className={`text-xs line-clamp-2 leading-relaxed ${gridTheme.desc}`}>
                  {item.description}
                </p>
              </div>

              <div className={`mt-4 pt-2.5 border-t flex items-center justify-between text-xs font-semibold ${gridTheme.footer}`}>
                <span>{item.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
