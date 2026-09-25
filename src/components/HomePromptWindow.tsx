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
  onOpenBookPdfModal?: (mode?: 'question_paper' | 'book') => void;
  hasCurrentWorksheet?: boolean;
  isLoggedIn?: boolean;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  minimal?: boolean;
  forceShowDirectives?: boolean;
  onOpenFullStudio?: () => void;
  theme?: 'light' | 'purple' | 'blue';
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
  minimal = false,
  forceShowDirectives = false,
  onOpenFullStudio,
  theme = 'purple',
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

  const promptTheme = {
    purple: {
      card: 'bg-[#210F4D] border-purple-500/30 text-white shadow-xl',
      headerBanner: 'bg-[#180A3D]/90 border-purple-500/25',
      heading: 'text-white',
      subtext: 'text-purple-200/80',
      activeBadge: 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold',
      flashBadge: 'bg-purple-500/25 text-purple-200 border-purple-400/30',
      directivesBtn: 'bg-white/10 border-white/20 text-purple-100 hover:bg-white/20 hover:text-white',
      directivesBtnActive: 'bg-purple-600 border-purple-400 text-white font-bold',
      form: 'bg-[#210F4D]',
      label: 'text-purple-200 font-bold',
      input: 'bg-[#150835] border-purple-400/30 text-white placeholder:text-purple-300/40 focus:bg-[#1C0D44] focus:border-amber-400 focus:ring-amber-400/20',
      inputClear: 'text-purple-300 hover:text-white',
      primaryBtn: 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-md',
      popularLabel: 'text-purple-300',
      popularChip: 'bg-[#150835] hover:bg-purple-900/80 text-purple-100 border-purple-500/30',
      divider: 'border-purple-500/25',
      select: 'bg-[#150835] border-purple-400/30 text-white focus:border-amber-400 focus:ring-amber-400/20',
      segmentBox: 'bg-[#150835] border border-purple-500/30 p-1 rounded-xl',
      segmentActive: 'bg-white text-purple-950 font-bold shadow-xs',
      segmentInactive: 'text-purple-200 hover:text-white',
      countActive: 'bg-amber-400 text-slate-950 font-black shadow-xs',
      countInactive: 'bg-[#150835] hover:bg-purple-900/60 text-purple-200 border border-purple-500/30',
      countSubtext: 'text-purple-300/70',
      presetChip: 'bg-[#150835] hover:bg-purple-900/70 text-purple-200 hover:text-white border-purple-500/30',
      minimalSubtext: 'text-purple-200/80',
      minimalStudioLink: 'text-amber-300 hover:text-amber-200 font-bold',
    },
    blue: {
      card: 'bg-[#0D284E] border-blue-400/30 text-white shadow-xl',
      headerBanner: 'bg-[#071D3A]/90 border-blue-400/25',
      heading: 'text-white',
      subtext: 'text-blue-200/80',
      activeBadge: 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold',
      flashBadge: 'bg-blue-500/25 text-blue-200 border-blue-400/30',
      directivesBtn: 'bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white',
      directivesBtnActive: 'bg-blue-600 border-blue-400 text-white font-bold',
      form: 'bg-[#0D284E]',
      label: 'text-blue-200 font-bold',
      input: 'bg-[#061830] border-blue-400/30 text-white placeholder:text-blue-300/40 focus:bg-[#092244] focus:border-cyan-400 focus:ring-cyan-400/20',
      inputClear: 'text-blue-300 hover:text-white',
      primaryBtn: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black shadow-md',
      popularLabel: 'text-blue-300',
      popularChip: 'bg-[#061830] hover:bg-blue-900/80 text-blue-100 border-blue-400/30',
      divider: 'border-blue-400/25',
      select: 'bg-[#061830] border-blue-400/30 text-white focus:border-cyan-400 focus:ring-cyan-400/20',
      segmentBox: 'bg-[#061830] border border-blue-400/30 p-1 rounded-xl',
      segmentActive: 'bg-white text-blue-950 font-bold shadow-xs',
      segmentInactive: 'text-blue-200 hover:text-white',
      countActive: 'bg-cyan-400 text-slate-950 font-black shadow-xs',
      countInactive: 'bg-[#061830] hover:bg-blue-900/60 text-blue-200 border border-blue-400/30',
      countSubtext: 'text-blue-300/70',
      presetChip: 'bg-[#061830] hover:bg-blue-900/70 text-blue-200 hover:text-white border-blue-400/30',
      minimalSubtext: 'text-blue-200/80',
      minimalStudioLink: 'text-cyan-300 hover:text-cyan-200 font-bold',
    },
    light: {
      card: 'bg-white border-slate-200 text-slate-900 shadow-sm',
      headerBanner: 'bg-slate-50/80 border-slate-200',
      heading: 'text-slate-900',
      subtext: 'text-slate-500',
      activeBadge: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
      flashBadge: 'bg-purple-100 text-purple-900 border-purple-200',
      directivesBtn: 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50',
      directivesBtnActive: 'bg-purple-50 border-purple-200 text-purple-700 font-semibold',
      form: 'bg-white',
      label: 'text-slate-700 font-bold',
      input: 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-purple-500/20',
      inputClear: 'text-slate-400 hover:text-slate-600',
      primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs',
      popularLabel: 'text-slate-500',
      popularChip: 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-200/80 hover:border-purple-200',
      divider: 'border-slate-200',
      select: 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500 focus:ring-purple-500/20',
      segmentBox: 'bg-slate-100 border border-slate-200 p-1 rounded-xl',
      segmentActive: 'bg-white text-purple-700 font-bold shadow-xs',
      segmentInactive: 'text-slate-600 hover:text-slate-900',
      countActive: 'bg-purple-600 text-white font-bold shadow-xs',
      countInactive: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      countSubtext: 'text-slate-400',
      presetChip: 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200',
      minimalSubtext: 'text-slate-500',
      minimalStudioLink: 'text-purple-600 hover:text-purple-700 font-bold',
    },
  }[theme] || {
    card: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    headerBanner: 'bg-slate-50/80 border-slate-200',
    heading: 'text-slate-900',
    subtext: 'text-slate-500',
    activeBadge: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    flashBadge: 'bg-purple-100 text-purple-900 border-purple-200',
    directivesBtn: 'bg-white border-slate-200 text-slate-600 hover:text-slate-900',
    directivesBtnActive: 'bg-purple-50 border-purple-200 text-purple-700 font-semibold',
    form: 'bg-white',
    label: 'text-slate-700 font-bold',
    input: 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400',
    inputClear: 'text-slate-400 hover:text-slate-600',
    primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs',
    popularLabel: 'text-slate-500',
    popularChip: 'bg-slate-100 hover:bg-purple-50 text-slate-700',
    divider: 'border-slate-200',
    select: 'bg-slate-50 border-slate-200 text-slate-800',
    segmentBox: 'bg-slate-100 border border-slate-200 p-1 rounded-xl',
    segmentActive: 'bg-white text-purple-700 font-bold',
    segmentInactive: 'text-slate-600 hover:text-slate-900',
    countActive: 'bg-purple-600 text-white font-bold',
    countInactive: 'bg-slate-100 text-slate-700',
    countSubtext: 'text-slate-400',
    presetChip: 'bg-slate-100 text-slate-600 border-slate-200',
    minimalSubtext: 'text-slate-500',
    minimalStudioLink: 'text-purple-600 hover:text-purple-700 font-bold',
  };

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

  useEffect(() => {
    if (forceShowDirectives) {
      setShowOptions(true);
    }
  }, [forceShowDirectives]);

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

  if (minimal) {
    return (
      <div className={`no-print rounded-2xl border ${promptTheme.card} p-4 sm:p-5 transition-all`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="What would you like to create? (e.g. Fractions, Cell Biology, Grade 8 Algebra)..."
                disabled={isGenerating}
                id="input-minimal-topic"
                className={`w-full pl-4 pr-10 py-3 rounded-xl text-sm font-medium border outline-none transition-all ${promptTheme.input}`}
              />
              {topic && !isGenerating && (
                <button
                  type="button"
                  onClick={() => setTopic('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs p-1 ${promptTheme.inputClear}`}
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
                id="btn-minimal-signin"
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
              >
                <Lock className="w-4 h-4 text-purple-200" />
                <span>Sign In to Build</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                id="btn-minimal-generate"
                className={`px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer active:scale-98 ${promptTheme.primaryBtn}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Generate ✨</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className={`truncate ${promptTheme.minimalSubtext}`}>
              Select pathways from the side menu for Set B exams or textbooks
            </span>
            {onOpenFullStudio && (
              <button
                type="button"
                onClick={onOpenFullStudio}
                className={`font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer ${promptTheme.minimalStudioLink}`}
              >
                <span>Full Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`no-print rounded-2xl border overflow-hidden transition-all ${promptTheme.card}`}>
      {/* Top Banner / Streamlined Header for Prompt from Topic */}
      <div className={`px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${promptTheme.headerBanner}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold tracking-tight ${promptTheme.heading}`}>
                Prompt from Topic
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] border ${promptTheme.activeBadge}`}>
                Active
              </span>
              <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${promptTheme.flashBadge}`}>
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${promptTheme.subtext}`}>
              Enter topic, standard code, or concept to generate questions
            </p>
          </div>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              title="Launch interactive online test mode"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Take Test Online</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            id="btn-toggle-advanced-settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer ${
              showOptions || specialInstructions
                ? promptTheme.directivesBtnActive
                : promptTheme.directivesBtn
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Custom Directives</span>
            {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Main Prompt Window Form */}
      <form onSubmit={handleSubmit} className={`p-5 sm:p-6 space-y-4 ${promptTheme.form}`}>
        {/* Sign In Notice when unauthenticated */}
        {!userIsLoggedIn && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>Sign in required:</strong> Log in to generate custom questionnaires, analyze textbook PDFs, and save assessments.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth?.('signin')}
              id="btn-banner-sign-in-prompt"
              className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Prompt Input Bar */}
        <div className="space-y-2">
          <label className={`block text-xs uppercase tracking-wider ${promptTheme.label}`}>
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
                className={`w-full pl-3.5 pr-10 py-3 rounded-xl text-sm font-medium border outline-none transition-all ${promptTheme.input}`}
              />
              {topic && !isGenerating && (
                <button
                  type="button"
                  onClick={() => setTopic('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs p-1 ${promptTheme.inputClear}`}
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
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
              >
                <Lock className="w-4 h-4 text-purple-200" />
                <span>Sign In to Build</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                id="btn-home-generate-questionnaire"
                className={`px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0 active:scale-98 shadow-md ${promptTheme.primaryBtn}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Generate Assessment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Topic Starter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 mr-1 ${promptTheme.popularLabel}`}>
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular Topics:</span>
          </span>
          {QUICK_TOPICS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickTopic(item)}
              disabled={isGenerating}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${promptTheme.popularChip}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Core Controls Grid: Subject & Grade, Complexity, Volume, Format */}
        <div className={`pt-3 border-t ${promptTheme.divider} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
          {/* Subject Selector */}
          <div className="space-y-1.5">
            <label className={`text-xs uppercase tracking-wider block ${promptTheme.label}`}>
              Subject Domain
            </label>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setUserSelectedSubject(true);
              }}
              disabled={isGenerating}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none ${promptTheme.select}`}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div className="space-y-1.5">
            <label className={`text-xs uppercase tracking-wider block ${promptTheme.label}`}>
              Target Grade
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => {
                setGradeLevel(e.target.value);
                setUserSelectedGrade(true);
              }}
              disabled={isGenerating}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer outline-none ${promptTheme.select}`}
            >
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g} className="bg-slate-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Complexity Level */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs uppercase tracking-wider ${promptTheme.label}`}>
                Complexity
              </label>
              <span className="text-[10px] font-bold text-amber-400 capitalize">
                {difficulty}
              </span>
            </div>
            <div className={`grid grid-cols-3 gap-1 ${promptTheme.segmentBox}`}>
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
                        ? promptTheme.segmentActive
                        : promptTheme.segmentInactive
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
              <label className={`text-xs uppercase tracking-wider ${promptTheme.label}`}>
                Question Format
              </label>
            </div>
            <div className={`grid grid-cols-3 gap-1 ${promptTheme.segmentBox}`}>
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
                        ? promptTheme.segmentActive
                        : promptTheme.segmentInactive
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
        <div className={`flex items-center justify-between pt-2 border-t ${promptTheme.divider} flex-wrap gap-2`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs uppercase tracking-wider ${promptTheme.label}`}>
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    questionCount === cnt
                      ? promptTheme.countActive
                      : promptTheme.countInactive
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
          <span className={`text-[11px] font-medium ${promptTheme.countSubtext}`}>
            3-5 for quick warmup • 8-10 for standard quiz • 15-20 for full test
          </span>
        </div>

        {/* Expandable Custom Instructions Panel */}
        {showOptions && (
          <div className={`pt-3 border-t ${promptTheme.divider} animate-fadeIn space-y-2`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs uppercase tracking-wider ${promptTheme.label}`}>
                Custom Directives & Language Constraints
              </label>
              {specialInstructions && (
                <button
                  type="button"
                  onClick={() => setSpecialInstructions('')}
                  className="text-[11px] font-semibold text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Directives
                </button>
              )}
            </div>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Provide questions and explanations in Tamil, include hint tips, real-world context..."
              disabled={isGenerating}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${promptTheme.input}`}
            />
            {/* Quick Directive Preset Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className={`font-medium mr-1 ${promptTheme.popularLabel}`}>Quick presets:</span>
              {[
                'Include step-by-step hints',
                'Scaffold with word bank',
                'Focus on real-world scenarios',
                'Language: தமிழ் (Tamil)',
                'Language: Español (Spanish)',
                'Include challenge bonus question',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (specialInstructions.includes(preset)) return;
                    setSpecialInstructions(
                      specialInstructions ? `${specialInstructions}; ${preset}` : preset
                    );
                  }}
                  className={`px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${promptTheme.presetChip}`}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
