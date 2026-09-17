import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Sliders,
  Check,
  FileText,
  HelpCircle,
  School,
  User,
  Lightbulb,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { WorksheetCategory, DifficultyLevel, WorksheetGenerationRequest, QuestionFormatOption } from '../types';

interface WorksheetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: WorksheetGenerationRequest) => Promise<void>;
  isGenerating: boolean;
  error?: string | null;
  onOpenBookPdfModal?: () => void;
}

const PRESET_TOPICS = [
  {
    label: 'Math: Grade 5 Fractions & Mixed Numbers',
    subject: 'Mathematics',
    gradeLevel: 'Grade 5',
    category: 'practice' as WorksheetCategory,
    topic: 'Adding, subtracting, and multiplying fractions with unlike denominators',
    instructions: 'Include real-world recipe and measurement word problems',
  },
  {
    label: 'Science: Middle School Cell Biology',
    subject: 'Science',
    gradeLevel: 'Grade 7',
    category: 'quiz' as WorksheetCategory,
    topic: 'Plant and animal cell organelles, cell membrane, and photosynthesis basics',
    instructions: 'Include organelle function questions and compare plant vs animal cells',
  },
  {
    label: 'ELA: Grade 8 Literary Devices & Tone',
    subject: 'English Language Arts',
    gradeLevel: 'Grade 8',
    category: 'reading_comprehension' as WorksheetCategory,
    topic: 'Identifying metaphors, similes, personification, and analyzing author tone in a short fiction excerpt',
    instructions: 'Generate a short 3-paragraph passage and follow with text-dependent questions',
  },
  {
    label: 'History: Grade 6 Ancient Civilizations',
    subject: 'Social Studies',
    gradeLevel: 'Grade 6',
    category: 'mixed' as WorksheetCategory,
    topic: 'Mesopotamia and Ancient Egypt: agriculture, cuneiform, and the Nile river geography',
    instructions: 'Include a vocabulary matching section and 2 short explanation questions',
  },
  {
    label: 'Quick Exit Ticket: Algebra 1 Linear Equations',
    subject: 'Mathematics',
    gradeLevel: 'Grade 9',
    category: 'exit_ticket' as WorksheetCategory,
    topic: 'Finding slope from two points and writing slope-intercept form (y = mx + b)',
    instructions: '3 high-impact diagnostic questions to assess understanding at end of class',
  },
];

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English Language Arts',
  'Social Studies / History',
  'Foreign Language',
  'Health & Physical Education',
  'Computer Science',
  'Art & Music',
  'General Knowledge',
];

const GRADE_LEVELS = [
  'Kindergarten',
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

const CATEGORIES: { id: WorksheetCategory; label: string; desc: string }[] = [
  { id: 'practice', label: 'Practice Drill', desc: 'Skill building with step-by-step problem solving and blanks' },
  { id: 'quiz', label: 'Quiz / Test', desc: 'Multiple-choice and true/false assessment with points' },
  { id: 'mixed', label: 'Mixed Assessment', desc: 'Comprehensive blend of MCQs, short answer, and matching' },
  { id: 'matching', label: 'Matching Vocabulary', desc: 'Paired terms, definitions, formulas, or concepts' },
  { id: 'exit_ticket', label: 'Exit Ticket', desc: 'Concise 3-5 question check for quick end-of-period diagnostic' },
  { id: 'reading_comprehension', label: 'Reading Passage', desc: 'Custom passage with evidence-based questions' },
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

export const WorksheetGeneratorModal: React.FC<WorksheetGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  error,
  onOpenBookPdfModal,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [gradeLevel, setGradeLevel] = useState('Grade 5 (Upper Elementary)');
  const [userSelectedSubject, setUserSelectedSubject] = useState(false);
  const [userSelectedGrade, setUserSelectedGrade] = useState(false);
  const [category, setCategory] = useState<WorksheetCategory>('practice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionCount, setQuestionCount] = useState(6);
  const [questionFormat, setQuestionFormat] = useState<QuestionFormatOption>('both');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeWordBank, setIncludeWordBank] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [standardsAlignment, setStandardsAlignment] = useState('');
  const [schoolName, setSchoolName] = useState('Pinecrest Academy');
  const [teacherName, setTeacherName] = useState('Ms. Henderson');
  const [activeTab, setActiveTab] = useState<'prompt' | 'source'>('prompt');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setTopic(preset.topic);
    setSubject(preset.subject);
    setGradeLevel(preset.gradeLevel);
    setCategory(preset.category);
    setSpecialInstructions(preset.instructions);
    if (preset.category === 'exit_ticket') {
      setQuestionCount(4);
    } else {
      setQuestionCount(6);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceText.trim()) return;

    await onGenerate({
      topic: topic.trim() || 'Worksheet Assessment',
      subject,
      gradeLevel,
      category,
      difficulty,
      questionCount,
      questionFormat,
      includeAnswerKey,
      includeExplanations,
      includeWordBank,
      sourceText: activeTab === 'source' ? sourceText.trim() : undefined,
      specialInstructions: specialInstructions.trim(),
      standardsAlignment: standardsAlignment.trim(),
      schoolName: schoolName.trim(),
      teacherName: teacherName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New AI Worksheet</h2>
              <p className="text-xs text-slate-500">Configure curriculum parameters, grade level, and assessment style</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Quick Presets for Instant Testing */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Inspiration Presets (Click to Auto-fill)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Method Tabs (Prompt vs Source Material) */}
          <div className="space-y-3">
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`pb-2 px-4 flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'prompt'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>By Topic & Standard</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('source')}
                className={`pb-2 px-4 flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeTab === 'source'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Source Article / Reading Passage</span>
              </button>

              {onOpenBookPdfModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBookPdfModal();
                  }}
                  className="pb-2 px-3 flex items-center gap-1.5 border-b-2 border-transparent text-violet-600 hover:text-violet-800 hover:border-violet-300 transition-all font-bold ml-auto"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Upload Book PDF ↗</span>
                </button>
              )}
            </div>

            {activeTab === 'prompt' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Topic, Unit, or Skill Concept <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={activeTab === 'prompt'}
                  value={topic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTopic(val);
                    const detected = detectSubjectAndGrade(val);
                    if (detected.subject && !userSelectedSubject) {
                      setSubject(detected.subject);
                    }
                    if (detected.grade && !userSelectedGrade) {
                      setGradeLevel(detected.grade);
                    }
                  }}
                  placeholder="e.g. Multiplying Fractions Word Problems, Mitosis vs Meiosis, US Constitution Bill of Rights..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Source Text / Article / Lecture Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required={activeTab === 'source'}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={4}
                  placeholder="Paste a textbook excerpt, poem, historical speech, or scientific article. AI will build questions strictly derived from this text..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y"
                />
              </div>
            )}
          </div>

          {/* Subject & Grade Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Subject Area</label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setUserSelectedSubject(true);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-800"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Target Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => {
                  setGradeLevel(e.target.value);
                  setUserSelectedGrade(true);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-800"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Worksheet Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Format & Structure</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'exit_ticket') {
                        setQuestionCount(4);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>{cat.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complexity, Question Format & Question Count */}
          <div className="space-y-4 pt-1">
            {/* Complexity Level */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Complexity Level</label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {difficulty === 'beginner' || difficulty === 'foundational'
                    ? 'Beginner: Foundational & Scaffolded'
                    : difficulty === 'expert' || difficulty === 'advanced'
                    ? 'Expert: Analytical & High Rigor'
                    : 'Intermediate: Standard Curriculum'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'beginner' as DifficultyLevel,
                    label: 'Beginner',
                    desc: 'Foundational concepts',
                    dot: 'bg-emerald-500',
                    border: 'border-emerald-500 bg-emerald-50 text-emerald-950',
                  },
                  {
                    id: 'intermediate' as DifficultyLevel,
                    label: 'Intermediate',
                    desc: 'Standard curriculum',
                    dot: 'bg-blue-500',
                    border: 'border-blue-500 bg-blue-50 text-blue-950',
                  },
                  {
                    id: 'expert' as DifficultyLevel,
                    label: 'Expert',
                    desc: 'High-rigor analysis',
                    dot: 'bg-purple-600',
                    border: 'border-purple-500 bg-purple-50 text-purple-950',
                  },
                ].map((item) => {
                  const isSelected =
                    difficulty === item.id ||
                    (item.id === 'beginner' && difficulty === 'foundational') ||
                    (item.id === 'intermediate' && difficulty === 'standard') ||
                    (item.id === 'expert' && difficulty === 'advanced');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDifficulty(item.id)}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        isSelected
                          ? `${item.border} ring-2 ring-indigo-200 shadow-xs`
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs mb-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                          {item.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-current shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Format & Number of Questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question Format Option */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Question Format</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'multiple_choice' as QuestionFormatOption, label: 'Multiple Choice', badge: 'MCQ' },
                    { id: 'fill_blank' as QuestionFormatOption, label: 'Fill in Blank', badge: 'Blanks' },
                    { id: 'both' as QuestionFormatOption, label: 'Both / Mixed', badge: 'Combined' },
                  ].map((fmt) => {
                    const isSelected = questionFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setQuestionFormat(fmt.id)}
                        className={`p-2 text-center rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-1 ring-indigo-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold truncate">{fmt.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{fmt.badge}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700">Number of Questions</label>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {questionCount} Questions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[3, 5, 8, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                        questionCount === cnt
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg mt-1"
                />
              </div>
            </div>
          </div>

          {/* Optional Teacher Directives & Personalization */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  School / District Name
                </label>
                <div className="relative">
                  <School className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Westlake High School"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Teacher Name / Course Title
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="e.g. Mr. Vance - Period 3"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Custom Teacher Instructions (Optional)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Include step-by-step word problems, emphasize vocabulary definitions, avoid negative numbers..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGenerating || (!topic.trim() && !sourceText.trim())}
            id="btn-generate-ai-submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 active:scale-98 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting Worksheet with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Worksheet Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
