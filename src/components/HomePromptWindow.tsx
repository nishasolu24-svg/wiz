import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  FileQuestion,
  Play,
  Layers,
  HelpCircle,
  Plus,
  BookOpen,
  Upload,
  Lock,
  ShieldAlert,
  User,
} from 'lucide-react';
import {
  WorksheetGenerationRequest,
  WorksheetCategory,
  DifficultyLevel,
  QuestionFormatOption,
  TeacherProfile,
} from '../types';
import { authService } from '../services/authService';

interface HomePromptWindowProps {
  onGenerate: (request: WorksheetGenerationRequest) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  currentTopic?: string;
  onTakeTestOnline?: () => void;
  onOpenCustomQuestion?: () => void;
  onOpenBookPdfModal?: () => void;
  hasCurrentWorksheet?: boolean;
  isLoggedIn?: boolean;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
}

const QUICK_TOPICS = [
  { label: '💧 Water Cycle', topic: 'The Water Cycle & Evaporation', subject: 'Science', grade: 'Grade 5 (Upper Elementary)', colorClass: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border-cyan-300' },
  { label: '🪐 Solar System', topic: 'Solar System & Planetary Orbits', subject: 'Science', grade: 'Grade 6 (Middle School)', colorClass: 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300' },
  { label: '📐 Fractions & Decimals', topic: 'Adding & Multiplying Fractions', subject: 'Mathematics', grade: 'Grade 5 (Upper Elementary)', colorClass: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300' },
  { label: '📜 Bill of Rights', topic: 'US Constitution & Bill of Rights', subject: 'Social Studies / History', grade: 'Grade 8 (Middle School)', colorClass: 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300' },
  { label: '🧬 DNA & Mitosis', topic: 'DNA Structure & Cell Division', subject: 'Science', grade: 'Grade 9 - 10 (High School)', colorClass: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300' },
  { label: '📚 Figurative Language', topic: 'Metaphors, Similes & Personification', subject: 'English Language Arts', grade: 'Grade 6 (Middle School)', colorClass: 'bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300' },
];

const QUESTION_COUNT_OPTIONS = [3, 5, 8, 10, 15, 20];

const COMPLEXITY_LEVELS: {
  id: DifficultyLevel;
  label: string;
  sublabel: string;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  badgeBg: string;
}[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    sublabel: 'Foundational concepts & step-by-step guidance',
    color: 'emerald',
    activeBg: 'bg-emerald-50',
    activeBorder: 'border-emerald-500',
    activeText: 'text-emerald-900',
    badgeBg: 'bg-emerald-500',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    sublabel: 'Standard grade-level problem solving',
    color: 'blue',
    activeBg: 'bg-blue-50',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-900',
    badgeBg: 'bg-blue-500',
  },
  {
    id: 'expert',
    label: 'Expert',
    sublabel: 'In-depth analysis & rigorous critical thinking',
    color: 'purple',
    activeBg: 'bg-purple-50',
    activeBorder: 'border-purple-500',
    activeText: 'text-purple-900',
    badgeBg: 'bg-purple-500',
  },
];

const QUESTION_FORMATS: {
  id: QuestionFormatOption;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'multiple_choice',
    label: 'Multiple Choice',
    badge: 'MCQ',
    description: '4 structured choices (A, B, C, D) with verified single correct answer',
  },
  {
    id: 'fill_blank',
    label: 'Fill in the Blank',
    badge: 'Blanks',
    description: 'Sentence completion prompts with missing terms & scaffolded word bank',
  },
  {
    id: 'both',
    label: 'Both / Mixed',
    badge: '50/50',
    description: 'Balanced blend combining multiple-choice options & fill-in-the-blank items',
  },
];

const SUBJECTS = [
  'Science',
  'Mathematics',
  'English Language Arts',
  'Social Studies / History',
  'Computer Science',
  'Foreign Language',
  'Health & Physical Ed',
  'General Knowledge',
];

const GRADE_LEVELS = [
  'Grade 1 - 2 (Early Elementary)',
  'Grade 3 - 4 (Elementary)',
  'Grade 5 (Upper Elementary)',
  'Grade 6 (Middle School)',
  'Grade 7 (Middle School)',
  'Grade 8 (Middle School)',
  'Grade 9 - 10 (High School)',
  'Grade 11 - 12 (High School / AP)',
  'College / Adult Learner',
];

function detectSubjectAndGrade(topicText: string): { subject?: string; grade?: string } {
  const lower = topicText.toLowerCase();
  let subject: string | undefined;
  let grade: string | undefined;

  if (/tamil|தமிழ்|உயிர்|மெய்|எழுத்து|இலக்கணம்|urir|uyir/i.test(lower)) {
    subject = 'தமிழ் (Tamil Language)';
  } else if (/\b(addition|add|subtraction|subtract|multiplication|multiply|division|divide|math|mathematics|arithmetic|fraction|fractions|algebra|geometry|shapes|equations|counting|integers|decimals|percent|ratios|numbers|triangle|angle)\b/i.test(lower)) {
    subject = 'Mathematics';
  } else if (/\b(photosynthesis|plant|plants|cell|cells|digestive|ecosystem|solar system|planets|water cycle|anatomy|body|space|weather|earth|magnet|magnets|energy|gravity|acid|dna|mitosis|biology|physics|chemistry|science)\b/i.test(lower)) {
    subject = 'Science';
  } else if (/\b(constitution|bill of rights|history|revolution|civil war|government|civics|geography|continent|continents|president|presidents|war|ancient|culture|social studies)\b/i.test(lower)) {
    subject = 'Social Studies / History';
  } else if (/\b(metaphor|simile|figurative|noun|verb|adjective|spelling|vocabulary|grammar|reading|phonics|story|writing|literature|poetry|comprehension|english)\b/i.test(lower)) {
    subject = 'English Language Arts';
  }

  if (/urir|uyir|உயிர்|vowel/i.test(lower)) {
    grade = 'Grade 1 - 2 (Early Elementary)';
  } else if (/\b(kindergarten|grade\s*1|first\s*grade|1st\s*grade|grade\s*2|second\s*grade|2nd\s*grade|early\s*elementary|kids)\b/i.test(lower)) {
    grade = 'Grade 1 - 2 (Early Elementary)';
  } else if (/\b(grade\s*3|third\s*grade|3rd\s*grade|grade\s*4|fourth\s*grade|4th\s*grade)\b/i.test(lower)) {
    grade = 'Grade 3 - 4 (Elementary)';
  } else if (/\b(grade\s*5|fifth\s*grade|5th\s*grade|upper\s*elementary)\b/i.test(lower)) {
    grade = 'Grade 5 (Upper Elementary)';
  } else if (/\b(grade\s*6|sixth\s*grade|6th\s*grade)\b/i.test(lower)) {
    grade = 'Grade 6 (Middle School)';
  } else if (/\b(grade\s*7|seventh\s*grade|7th\s*grade)\b/i.test(lower)) {
    grade = 'Grade 7 (Middle School)';
  } else if (/\b(grade\s*8|eighth\s*grade|8th\s*grade|middle\s*school)\b/i.test(lower)) {
    grade = 'Grade 8 (Middle School)';
  } else if (/\b(grade\s*9|ninth\s*grade|9th\s*grade|grade\s*10|tenth\s*grade|10th\s*grade|high\s*school)\b/i.test(lower)) {
    grade = 'Grade 9 - 10 (High School)';
  } else if (/\b(grade\s*11|11th\s*grade|grade\s*12|12th\s*grade|ap\s|college)\b/i.test(lower)) {
    grade = 'Grade 11 - 12 (High School / AP)';
  }

  return { subject, grade };
}

export const HomePromptWindow: React.FC<HomePromptWindowProps> = ({
  onGenerate,
  isGenerating,
  error,
  currentTopic,
  onTakeTestOnline,
  onOpenCustomQuestion,
  onOpenBookPdfModal,
  hasCurrentWorksheet = true,
  isLoggedIn = false,
  onOpenAuth,
}) => {
  const [profile, setProfile] = useState<TeacherProfile>(() => authService.getProfile());

  useEffect(() => {
    const unsubProfile = authService.onProfileChange((updated) => {
      setProfile(updated);
    });
    return () => {
      unsubProfile();
    };
  }, []);

  const userIsLoggedIn = Boolean(isLoggedIn || profile.isLoggedIn || authService.isSignedIn());

  const [topic, setTopic] = useState(currentTopic || '');
  const [subject, setSubject] = useState(() => {
    if (currentTopic) {
      const detected = detectSubjectAndGrade(currentTopic);
      if (detected.subject) return detected.subject;
    }
    return 'Science';
  });
  const [gradeLevel, setGradeLevel] = useState(() => {
    if (currentTopic) {
      const detected = detectSubjectAndGrade(currentTopic);
      if (detected.grade) return detected.grade;
    }
    return 'Grade 5 (Upper Elementary)';
  });
  const [userSelectedSubject, setUserSelectedSubject] = useState(false);
  const [userSelectedGrade, setUserSelectedGrade] = useState(false);
  const [category, setCategory] = useState<WorksheetCategory>('quiz');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [questionFormat, setQuestionFormat] = useState<QuestionFormatOption>('both');
  const [showOptions, setShowOptions] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleTopicChange = (val: string) => {
    setTopic(val);
    const detected = detectSubjectAndGrade(val);
    if (detected.subject && !userSelectedSubject) {
      setSubject(detected.subject);
    }
    if (detected.grade && !userSelectedGrade) {
      setGradeLevel(detected.grade);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIsLoggedIn) {
      onOpenAuth?.('signin');
      return;
    }
    if (!topic.trim()) return;

    onGenerate({
      topic: topic.trim(),
      subject,
      gradeLevel,
      category,
      difficulty,
      questionCount,
      questionFormat,
      includeAnswerKey: true,
      includeExplanations: true,
      includeWordBank: true,
      specialInstructions: specialInstructions.trim() || undefined,
    });
  };

  const handleQuickTopic = (item: typeof QUICK_TOPICS[0]) => {
    if (!userIsLoggedIn) {
      onOpenAuth?.('signin');
      return;
    }
    setTopic(item.topic);
    setSubject(item.subject);
    setGradeLevel(item.grade);
    setUserSelectedSubject(true);
    setUserSelectedGrade(true);
  };

  return (
    <div className="no-print bg-white rounded-2xl border border-indigo-100 shadow-md shadow-indigo-100/50 overflow-hidden transition-all">
      {/* Top Banner / Prompt Window Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 px-5 sm:px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-xs shrink-0 border border-white/30">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Questionnaire & Assessment Studio</span>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                ⚡ Powered by Gemini AI
              </span>
            </h2>
            <p className="text-xs text-indigo-100 font-medium">
              Generate custom questionnaires, configure complexity & question types, or launch the interactive online test
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ask from Book / PDF CTA */}
          {onOpenBookPdfModal && (
            <button
              type="button"
              onClick={() => {
                if (!userIsLoggedIn) {
                  onOpenAuth?.('signin');
                  return;
                }
                onOpenBookPdfModal();
              }}
              id="btn-home-open-book-modal"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-violet-950 hover:bg-violet-50 shadow-sm transition-all active:scale-98 cursor-pointer"
              title="Upload any Book or PDF to ask questions grounded directly in the text"
            >
              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
              <span>Ask from Book / PDF</span>
            </button>
          )}

          {/* Option to Take Test Online */}
          {onTakeTestOnline && (
            <button
              type="button"
              onClick={() => {
                if (!userIsLoggedIn) {
                  onOpenAuth?.('signin');
                  return;
                }
                onTakeTestOnline();
              }}
              id="btn-home-take-test-online"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 hover:from-emerald-300 hover:to-teal-300 shadow-sm transition-all active:scale-98 cursor-pointer"
              title="Launch interactive online test mode with real-time scoring and timer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Take Test Online</span>
              <span className="hidden md:inline-flex px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-900/20 text-emerald-950">
                Live Quiz
              </span>
            </button>
          )}

          {/* Toggle Advanced Controls Button */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            id="btn-toggle-advanced-settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showOptions ? 'Less Options' : 'More Settings'}</span>
            {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Prompt Window Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
        {/* Sign In Required Notice Banner when unauthenticated */}
        {!userIsLoggedIn && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border-2 border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Sign In Required</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950">
                    Authentication Gate
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  All features in WizSheet AI — AI assessment generation, textbook PDF comprehension, instant differentiation, and printable exports — require signing in.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              id="btn-banner-sign-in-prompt"
              className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-violet-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}
        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5 font-medium shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span>{error}</span>
          </div>
        )}

        {/* Book / PDF Feature Card */}
        {onOpenBookPdfModal && (
          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-violet-50 via-indigo-50 to-fuchsia-50 border border-violet-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-violet-200">
                <BookOpen className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    Ask Questions Directly from a Book or PDF
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-violet-200 text-violet-900 uppercase tracking-wide">
                    New
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Upload textbooks, novels, or articles. WizSheet AI extracts the text and creates questions with citations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenBookPdfModal}
              id="btn-banner-upload-book"
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-violet-200 transition-all active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Book / PDF</span>
            </button>
          </div>
        )}

        {/* Primary Prompt Input Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent uppercase tracking-wider">
              Questionnaire Topic or Learning Standard
            </label>
            <span className="text-[11px] text-indigo-500 font-semibold hidden sm:inline">
              ✨ Type any subject or pick a colorful starter below
            </span>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="e.g. Simple addition for grade 1, Photosynthesis, Fractions, World War II Causes..."
                disabled={isGenerating}
                id="input-questionnaire-topic"
                className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-indigo-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-400/20 focus:border-purple-500 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {topic && !isGenerating && (
                <button
                  type="button"
                  onClick={() => setTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 text-xs p-1 rounded font-bold"
                  title="Clear topic"
                >
                  ✕
                </button>
              )}
            </div>

            {!userIsLoggedIn ? (
              <button
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                id="btn-home-generate-questionnaire"
                className="px-7 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 hover:from-violet-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-xl font-black text-sm shadow-lg shadow-purple-300/60 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-98 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Sign In to Build</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                id="btn-home-generate-questionnaire"
                className="px-7 py-3.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white rounded-xl font-black text-sm shadow-lg shadow-purple-300/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Generating Questionnaire...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Build Questionnaire</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Smart Subject & Grade Selector Badges */}
          <div className="flex items-center flex-wrap gap-2 pt-2.5">
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-xl shadow-2xs">
              <span className="font-extrabold text-indigo-950 text-[11px] flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Subject:</span>
              </span>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setUserSelectedSubject(true);
                }}
                disabled={isGenerating}
                className="bg-transparent font-black text-indigo-700 text-xs focus:outline-none cursor-pointer pr-1"
                title="Select subject domain"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200/80 px-3 py-1 rounded-xl shadow-2xs">
              <span className="font-extrabold text-purple-950 text-[11px] flex items-center gap-1">
                <span>🎓 Grade:</span>
              </span>
              <select
                value={gradeLevel}
                onChange={(e) => {
                  setGradeLevel(e.target.value);
                  setUserSelectedGrade(true);
                }}
                disabled={isGenerating}
                className="bg-transparent font-black text-purple-700 text-xs focus:outline-none cursor-pointer pr-1"
                title="Select target grade level"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] text-slate-500 font-medium hidden md:inline ml-auto">
              Auto-detected from prompt • Click dropdowns to customize
            </span>
          </div>
        </div>

        {/* Quick Topic Starter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Try:</span>
          </span>
          {QUICK_TOPICS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickTopic(item)}
              disabled={isGenerating}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-2xs hover:scale-105 ${item.colorClass}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Core Quick Controls: Complexity, No. of Questions, Question Type */}
        <div className="pt-3 border-t border-indigo-100/80 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Complexity Marking: Beginner, Intermediate, Expert */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider flex items-center gap-1.5">
                <span>Complexity</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500 capitalize">
                {difficulty === 'beginner'
                  ? '🟢 Beginner Level'
                  : difficulty === 'expert'
                  ? '🟣 Expert Level'
                  : '🔵 Intermediate Level'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {COMPLEXITY_LEVELS.map((lvl) => {
                const isSelected =
                  difficulty === lvl.id ||
                  (lvl.id === 'beginner' && difficulty === 'foundational') ||
                  (lvl.id === 'intermediate' && difficulty === 'standard') ||
                  (lvl.id === 'expert' && difficulty === 'advanced');

                const selectedClasses =
                  lvl.id === 'beginner'
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-300'
                    : lvl.id === 'expert'
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-500 text-purple-950 shadow-sm ring-2 ring-purple-300'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500 text-blue-950 shadow-sm ring-2 ring-blue-300';

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDifficulty(lvl.id)}
                    disabled={isGenerating}
                    id={`btn-complexity-${lvl.id}`}
                    className={`px-2.5 py-2.5 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? selectedClasses
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-extrabold text-xs flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            lvl.id === 'beginner'
                              ? 'bg-emerald-500'
                              : lvl.id === 'expert'
                              ? 'bg-purple-600'
                              : 'bg-blue-500'
                          }`}
                        />
                        {lvl.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-current shrink-0 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">
                      {lvl.id === 'beginner'
                        ? 'Clear basics & support'
                        : lvl.id === 'expert'
                        ? 'Rigorous critical analysis'
                        : 'Standard grade mastery'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Option to select number of questions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent uppercase tracking-wider flex items-center gap-1.5">
                <span>No. of Questions</span>
              </label>
              <span className="text-[11px] font-extrabold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full border border-violet-200">
                {questionCount} Questions
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUESTION_COUNT_OPTIONS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  disabled={isGenerating}
                  id={`btn-question-count-${cnt}`}
                  className={`flex-1 min-w-[42px] py-2 rounded-xl text-xs font-black border transition-all text-center ${
                    questionCount === cnt
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md shadow-violet-200 ring-2 ring-violet-300 scale-105'
                      : 'bg-white hover:bg-violet-50/60 border-slate-200 text-slate-700 hover:text-violet-900'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Select question volume for practice, quick exit tickets (3-5), or comprehensive tests (10-20).
            </div>
          </div>

          {/* 3. Option to select Multiple Choice or Fill in the Blank */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black bg-gradient-to-r from-cyan-600 via-amber-600 to-fuchsia-600 bg-clip-text text-transparent uppercase tracking-wider flex items-center gap-1.5">
                <span>Question Type</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {questionFormat === 'multiple_choice'
                  ? 'Multiple Choice'
                  : questionFormat === 'fill_blank'
                  ? 'Fill in Blank'
                  : 'Mixed 50/50'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUESTION_FORMATS.map((fmt) => {
                const isSelected = questionFormat === fmt.id;
                const formatSelectedClasses =
                  fmt.id === 'multiple_choice'
                    ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-500 text-cyan-950 ring-2 ring-cyan-200 shadow-sm'
                    : fmt.id === 'fill_blank'
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-500 text-amber-950 ring-2 ring-amber-200 shadow-sm'
                    : 'bg-gradient-to-br from-fuchsia-50 to-pink-50 border-2 border-fuchsia-500 text-fuchsia-950 ring-2 ring-fuchsia-200 shadow-sm';

                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setQuestionFormat(fmt.id)}
                    disabled={isGenerating}
                    id={`btn-format-${fmt.id}`}
                    className={`p-2 rounded-xl text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? formatSelectedClasses
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-extrabold text-xs truncate">{fmt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-current shrink-0 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block truncate ${
                        fmt.id === 'multiple_choice'
                          ? 'bg-cyan-100 text-cyan-800'
                          : fmt.id === 'fill_blank'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-fuchsia-100 text-fuchsia-800'
                      }`}
                    >
                      {fmt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Action Footer: Take Test Online callout banner */}
        {hasCurrentWorksheet && onTakeTestOnline && (
          <div className="p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl text-white shadow-md shadow-teal-200 flex flex-wrap items-center justify-between gap-3 transform hover:scale-[1.005] transition-all">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-md">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </span>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>Take Test Online Available</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 uppercase tracking-wide">
                    Interactive
                  </span>
                </div>
                <p className="text-xs text-emerald-50 font-medium">
                  Assess students directly in browser with digital answer inputs, countdown timer, auto-grading & celebration confetti
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenCustomQuestion && (
                <button
                  type="button"
                  onClick={onOpenCustomQuestion}
                  className="px-4 py-2.5 bg-emerald-700/60 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl border border-emerald-300/40 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Custom Question</span>
                </button>
              )}
              <button
                type="button"
                onClick={onTakeTestOnline}
                className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Online Test</span>
              </button>
            </div>
          </div>
        )}

        {/* Expandable Questionnaire Configuration Panel */}
        {showOptions && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {/* Subject Area */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Subject Domain
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Grade Level */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Grade Level
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Directives */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Custom Teacher Instructions
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Focus on real-world examples, vocabulary definitions..."
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
