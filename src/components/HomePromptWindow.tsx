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
    <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Top Banner / Prompt Window Header */}
      <div className="bg-slate-900 px-5 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Assessment & Quiz Generator</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Gemini AI
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize subject, difficulty, and question format to create assessments
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="Upload any Book or PDF to ask questions grounded directly in the text"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask from Book / PDF</span>
            </button>
          )}

          {/* Option to Take Test Online */}
          {hasCurrentWorksheet && onTakeTestOnline && (
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all cursor-pointer"
              title="Launch interactive online test mode"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Take Test Online</span>
            </button>
          )}

          {/* Toggle Advanced Controls Button */}
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            id="btn-toggle-advanced-settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showOptions ? 'Hide Directives' : 'Custom Directives'}</span>
            {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Prompt Window Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 bg-white">
        {/* Sign In Notice when unauthenticated */}
        {!userIsLoggedIn && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Sign in required:</strong> Log in to generate custom questionnaires, analyze textbook PDFs, and save assessments.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              id="btn-banner-sign-in-prompt"
              className="shrink-0 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Prompt Input Bar */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Assessment Topic or Standard
          </label>
          <div className="relative flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="e.g., Photosynthesis, Fraction Operations, US Constitution, தமிழ் திருக்குறள்..."
                disabled={isGenerating}
                id="input-questionnaire-topic"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
              />
              {topic && !isGenerating && (
                <button
                  type="button"
                  onClick={() => setTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
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
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-200" />
                <span>Sign In to Build</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                id="btn-home-generate-questionnaire"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 active:scale-98 shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Assessment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Topic Starter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Popular:</span>
          </span>
          {QUICK_TOPICS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickTopic(item)}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Core Controls Grid: Subject & Grade, Complexity, Volume, Format */}
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Subject Domain
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setUserSelectedSubject(true);
              }}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Target Grade
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => {
                setGradeLevel(e.target.value);
                setUserSelectedGrade(true);
              }}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Complexity Level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Complexity
              </label>
              <span className="text-[10px] font-bold text-indigo-600 capitalize">
                {difficulty}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {COMPLEXITY_LEVELS.map((lvl) => {
                const isSelected =
                  difficulty === lvl.id ||
                  (lvl.id === 'beginner' && difficulty === 'foundational') ||
                  (lvl.id === 'intermediate' && difficulty === 'standard') ||
                  (lvl.id === 'expert' && difficulty === 'advanced');

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDifficulty(lvl.id)}
                    disabled={isGenerating}
                    id={`btn-complexity-${lvl.id}`}
                    className={`py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Format */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Format
              </label>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {QUESTION_FORMATS.map((fmt) => {
                const isSelected = questionFormat === fmt.id;
                const shortLabel =
                  fmt.id === 'multiple_choice' ? 'MCQ' : fmt.id === 'fill_blank' ? 'Fill Blank' : 'Mixed';
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setQuestionFormat(fmt.id)}
                    disabled={isGenerating}
                    id={`btn-format-${fmt.id}`}
                    title={fmt.label}
                    className={`py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Count Pill Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Question Volume:
            </span>
            <div className="flex items-center gap-1">
              {QUESTION_COUNT_OPTIONS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  disabled={isGenerating}
                  id={`btn-question-count-${cnt}`}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    questionCount === cnt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            3-5 for quick warmup • 8-10 for standard quiz • 15-20 for full test
          </span>
        </div>

        {/* Expandable Custom Instructions Panel */}
        {showOptions && (
          <div className="pt-3 border-t border-slate-200 animate-fadeIn">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Directives & Language Constraints (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Provide all questions and answers in Tamil, include hints, focus on real-world application..."
              disabled={isGenerating}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </form>
    </div>
  );
};
