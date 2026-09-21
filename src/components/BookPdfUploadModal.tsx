import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  BookOpen,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  Bookmark,
  FileCheck,
  RotateCcw,
  Check,
  Copy,
  GraduationCap,
  Zap,
} from 'lucide-react';
import {
  WorksheetGenerationRequest,
  DifficultyLevel,
  QuestionFormatOption,
  UploadedBookInfo,
  QuestionPaperVariationStyle,
} from '../types';
import {
  SAMPLE_BOOKS,
  SAMPLE_QUESTION_PAPERS,
  SampleBook,
  SampleQuestionPaper,
} from '../data/sampleBooks';
import { parsePdfInBrowser } from '../services/pdfParserClient';
import { authService } from '../services/authService';

interface BookPdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: WorksheetGenerationRequest) => Promise<void>;
  isGenerating: boolean;
  initialMode?: 'question_paper' | 'book';
}

const QUESTION_COUNT_OPTIONS = [3, 5, 6, 8, 10, 12, 15];

const QUESTION_FOCUS_OPTIONS = [
  { id: 'comprehension', label: 'Reading Comprehension', desc: 'Assess understanding, central themes, and textual evidence' },
  { id: 'vocabulary', label: 'Vocabulary & Key Terms', desc: 'Test mastery of essential terminology, phrases, and definitions' },
  { id: 'facts_recall', label: 'Factual Recall & Events', desc: 'Direct questions on events, characters, dates, or data points' },
  { id: 'critical_thinking', label: 'Critical Thinking & Analysis', desc: 'Inferential reasoning, author perspective, and deeper meaning' },
];

const QUESTION_PAPER_VARIATIONS: Array<{
  id: QuestionPaperVariationStyle;
  label: string;
  badge: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    id: 'parallel_twin',
    label: 'Parallel Exam / Set B (Recommended)',
    badge: 'Exact Twin Format',
    desc: 'Generates an alternate exam with identical structure, syllabus topics, and difficulty balance, but completely new questions, varied numbers, and distinct answers.',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'practice_mock',
    label: 'Practice & Mock Revision',
    badge: 'Student Practice',
    desc: 'Generates a parallel exam formulated for study sessions and timed mock tests with full step-by-step solutions.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'challenging_variant',
    label: 'Honors / Higher Rigor',
    badge: 'Elevated Rigor',
    desc: 'Maintains the identical syllabus topics but introduces multi-step problem solving, critical transfer, and deeper analysis.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'scaffolded_retest',
    label: 'Re-Test / Guided Support',
    badge: 'Scaffolded',
    desc: 'Designed for re-tests or struggling students with clearer framing, foundational numbers, and helpful hints.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

const SUBJECTS = [
  'Science',
  'Mathematics',
  'English Language Arts',
  'Social Studies / History',
  'Computer Science',
  'Foreign Language',
  'General Knowledge',
];

const GRADE_LEVELS = [
  'Grade 3 - 4 (Elementary)',
  'Grade 5 (Upper Elementary)',
  'Grade 6 (Middle School)',
  'Grade 7 (Middle School)',
  'Grade 8 (Middle School)',
  'Grade 9 - 10 (High School)',
  'Grade 11 - 12 (High School / AP)',
  'College / Adult Learner',
];

export const BookPdfUploadModal: React.FC<BookPdfUploadModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  initialMode = 'question_paper',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'question_paper' | 'book'>(initialMode);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [detectedPaperNotice, setDetectedPaperNotice] = useState<string | null>(null);

  // Parsed document state
  const [bookInfo, setBookInfo] = useState<UploadedBookInfo | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [gradeLevel, setGradeLevel] = useState('Grade 8 (Middle School)');
  const [questionCount, setQuestionCount] = useState(6);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionFormat, setQuestionFormat] = useState<QuestionFormatOption>('both');
  const [variationStyle, setVariationStyle] = useState<QuestionPaperVariationStyle>('parallel_twin');
  const [customInstructions, setCustomInstructions] = useState('');

  // Book-specific states
  const [questionFocus, setQuestionFocus] = useState('comprehension');
  const [scopeMode, setScopeMode] = useState<'all' | 'chapter' | 'pages'>('all');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(5);
  const [showTextPreview, setShowTextPreview] = useState(false);

  // Keep activeTab in sync with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setDetectedPaperNotice(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const processPdfFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Please upload a valid .pdf file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setParseError(
        `File size (${sizeMB}MB) exceeds the 50MB limit. For large textbooks or novels, please export or print the specific chapter or page range you wish to test (e.g., Pages 1–20), or compress the PDF.`
      );
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setDetectedPaperNotice(null);

    try {
      // 1. First Attempt: Direct in-browser PDF parsing (Fast, 0 network cost, works on Cloudflare Pages)
      try {
        const clientParsed = await parsePdfInBrowser(file);
        if (clientParsed && clientParsed.fullText && clientParsed.fullText.trim().length > 30) {
          handleParsedDataSuccess({
            ...clientParsed,
            fileName: file.name,
          });
          setIsParsing(false);
          return;
        } else if (clientParsed && clientParsed.fullText.trim().length <= 30) {
          console.warn('In-browser parser found little to no text, attempting server parser...');
        }
      } catch (clientErr) {
        console.warn('In-browser PDF parsing skipped, falling back to server parser:', clientErr);
      }

      // 2. Second Attempt: Server-side PDF parser with safe response handling
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const authHeaders = authService.getAuthHeaders();
          const response = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pdfBase64: base64Data,
              fileName: file.name,
            }),
          });

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error(
              'Text could not be extracted automatically. The document may be a scanned image without selectable text. Please choose a PDF containing digital text or select one of the curriculum samples below.'
            );
          }

          const data = await response.json();

          if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to extract text from PDF');
          }

          handleParsedDataSuccess({
            fileName: data.fileName || file.name,
            fileSize: data.fileSize,
            pageCount: data.pageCount || 1,
            characterCount: data.characterCount || 0,
            wordCount: data.wordCount || 0,
            previewSnippet: data.previewSnippet || '',
            fullText: data.fullText || '',
            suggestedTitle: data.suggestedTitle,
            detectedChapters: data.detectedChapters || [],
            isLikelyQuestionPaper: data.isLikelyQuestionPaper,
            detectedQuestionCount: data.detectedQuestionCount,
          });
        } catch (err: any) {
          console.error('PDF parsing error:', err);
          setParseError(err.message || 'Could not parse the PDF. Ensure it contains readable text.');
        } finally {
          setIsParsing(false);
        }
      };

      reader.onerror = () => {
        setParseError('Failed to read file from disk.');
        setIsParsing(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setParseError(err.message || 'Error uploading file.');
      setIsParsing(false);
    }
  };

  const handleParsedDataSuccess = (data: any) => {
    setBookInfo({
      fileName: data.fileName,
      fileSize: data.fileSize,
      pageCount: data.pageCount || 1,
      characterCount: data.characterCount || 0,
      wordCount: data.wordCount || 0,
      previewSnippet: data.previewSnippet || '',
      fullText: data.fullText || '',
      suggestedTitle: data.suggestedTitle,
      detectedChapters: data.detectedChapters || [],
      isLikelyQuestionPaper: data.isLikelyQuestionPaper,
      detectedQuestionCount: data.detectedQuestionCount,
    });

    const detectedTitle = data.suggestedTitle || data.fileName.replace(/\.pdf$/i, '');
    setBookTitle(detectedTitle);
    setPageRangeStart(1);
    setPageRangeEnd(Math.min(5, data.pageCount || 1));

    if (data.detectedChapters && data.detectedChapters.length > 0) {
      setSelectedChapter(data.detectedChapters[0].title);
    }

    // Auto-detect subject and grade heuristics
    const lowerText = `${detectedTitle} ${data.fullText.slice(0, 3000)}`.toLowerCase();
    if (/math|algebra|geometry|fraction|arithmetic|calculus|equation/i.test(lowerText)) {
      setSubject('Mathematics');
    } else if (/biology|chemistry|physics|science|photosynthesis|mitosis|velocity/i.test(lowerText)) {
      setSubject('Science');
    } else if (/history|civics|constitution|geography|social studies/i.test(lowerText)) {
      setSubject('Social Studies / History');
    } else if (/english|literature|grammar|reading|vocabulary|poem/i.test(lowerText)) {
      setSubject('English Language Arts');
    }

    if (/grade\s*10|10th\s*grade|high\s*school/i.test(lowerText)) {
      setGradeLevel('Grade 9 - 10 (High School)');
    } else if (/grade\s*8|8th\s*grade/i.test(lowerText)) {
      setGradeLevel('Grade 8 (Middle School)');
    } else if (/grade\s*6|6th\s*grade/i.test(lowerText)) {
      setGradeLevel('Grade 6 (Middle School)');
    } else if (/grade\s*5|5th\s*grade/i.test(lowerText)) {
      setGradeLevel('Grade 5 (Upper Elementary)');
    }

    // If question paper heuristic is triggered, auto-switch to question_paper tab and set notice
    if (data.isLikelyQuestionPaper) {
      setActiveTab('question_paper');
      const count = data.detectedQuestionCount || 6;
      setQuestionCount(Math.min(15, Math.max(3, count)));
      setDetectedPaperNotice(
        `⚡ Question Paper format detected (~${count} questions found). We will generate a similar paper with completely different questions and answers!`
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  const handleSelectSampleBook = (sample: SampleBook) => {
    setBookInfo({
      fileName: `${sample.title}.pdf`,
      pageCount: sample.pageCount,
      characterCount: sample.fullText.length,
      wordCount: sample.wordCount,
      previewSnippet: sample.preview,
      fullText: sample.fullText,
      suggestedTitle: sample.title,
      detectedChapters: sample.chapters,
    });
    setBookTitle(sample.title);
    setSubject(sample.subject);
    setGradeLevel(sample.gradeLevel);
    setPageRangeStart(1);
    setPageRangeEnd(sample.pageCount);
    if (sample.chapters.length > 0) {
      setSelectedChapter(sample.chapters[0].title);
    }
    setParseError(null);
    setDetectedPaperNotice(null);
  };

  const handleSelectSampleQuestionPaper = (sample: SampleQuestionPaper) => {
    const calculatedWords = sample.fullText.split(/\s+/).filter(Boolean).length;
    setBookInfo({
      fileName: `${sample.title}.pdf`,
      pageCount: sample.pageCount,
      characterCount: sample.fullText.length,
      wordCount: calculatedWords,
      previewSnippet: sample.preview,
      fullText: sample.fullText,
      suggestedTitle: sample.title,
      detectedChapters: [],
      isLikelyQuestionPaper: true,
      detectedQuestionCount: sample.questionCount,
    });
    setBookTitle(sample.title);
    setSubject(sample.subject);
    setGradeLevel(sample.gradeLevel);
    setQuestionCount(sample.questionCount);
    setDifficulty('standard');
    setParseError(null);
    setDetectedPaperNotice(
      `Loaded "${sample.title}" (${sample.questionCount} original questions). WizSheet AI will generate an alternate Set B paper testing these topics with different questions!`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookInfo) return;

    if (activeTab === 'question_paper') {
      // Question Paper Mode: Request similar version with alternate questions & solutions
      const excerpt = bookInfo.fullText.slice(0, 42000);
      const selectedVariation = QUESTION_PAPER_VARIATIONS.find((v) => v.id === variationStyle);

      const request: WorksheetGenerationRequest = {
        topic: `${bookTitle.trim() || 'Question Paper'} (Parallel Assessment)`,
        subject,
        gradeLevel,
        category: 'practice',
        difficulty,
        questionCount,
        questionFormat,
        includeAnswerKey: true,
        includeExplanations: true,
        includeWordBank: true,
        isQuestionPaperMode: true,
        questionPaperVariationStyle: variationStyle,
        specialInstructions: [
          `MANDATE: GENERATE A SIMILAR QUESTION PAPER WITH COMPLETELY DIFFERENT QUESTIONS AND ANSWERS.`,
          `Variation Mode: ${selectedVariation?.label || variationStyle}.`,
          `Original Paper: "${bookTitle}".`,
          `Do NOT repeat original questions verbatim. Formulate fresh isomorphic questions with varied numbers, contexts, and verified solutions.`,
          customInstructions ? `Teacher Directive: ${customInstructions}` : '',
        ].filter(Boolean).join(' '),
        bookData: {
          fileName: bookInfo.fileName,
          bookTitle: bookTitle.trim() || bookInfo.fileName,
          pageCount: bookInfo.pageCount,
          documentType: 'question_paper',
          variationStyle,
          bookExcerpt: excerpt,
        },
      };

      await onGenerate(request);
      return;
    }

    // Book Reading Mode
    let excerpt = bookInfo.fullText;
    let selectedPagesDesc = 'All Pages';
    let chapterOrSection = '';

    if (scopeMode === 'chapter' && selectedChapter) {
      chapterOrSection = selectedChapter;
      selectedPagesDesc = `Chapter: ${selectedChapter}`;
      const chIndex = bookInfo.fullText.indexOf(selectedChapter);
      if (chIndex !== -1) {
        excerpt = bookInfo.fullText.slice(chIndex, chIndex + 18000);
      } else {
        excerpt = bookInfo.fullText.slice(0, 20000);
      }
    } else if (scopeMode === 'pages') {
      selectedPagesDesc = `Pages ${pageRangeStart} to ${pageRangeEnd}`;
      const totalPages = Math.max(1, bookInfo.pageCount);
      const startRatio = Math.max(0, (pageRangeStart - 1) / totalPages);
      const endRatio = Math.min(1, pageRangeEnd / totalPages);
      const startChar = Math.floor(startRatio * bookInfo.fullText.length);
      const endChar = Math.ceil(endRatio * bookInfo.fullText.length);
      excerpt = bookInfo.fullText.slice(startChar, Math.min(endChar, startChar + 35000));
    } else {
      excerpt = bookInfo.fullText.slice(0, 40000);
    }

    const selectedFocus = QUESTION_FOCUS_OPTIONS.find((f) => f.id === questionFocus);

    const request: WorksheetGenerationRequest = {
      topic: `${bookTitle.trim() || 'Book'} Comprehension`,
      subject,
      gradeLevel,
      category: 'reading_comprehension',
      difficulty,
      questionCount,
      questionFormat,
      includeAnswerKey: true,
      includeExplanations: true,
      includeWordBank: true,
      isQuestionPaperMode: false,
      specialInstructions: [
        `Ground all questions strictly in the text of the book "${bookTitle}". Focus emphasis on: ${selectedFocus?.label || 'Reading Comprehension'} (${selectedFocus?.desc || ''}). In question explanations, cite evidence from the text.`,
        customInstructions ? `Teacher Directive: ${customInstructions}` : '',
      ].filter(Boolean).join(' '),
      bookData: {
        fileName: bookInfo.fileName,
        bookTitle: bookTitle.trim() || bookInfo.fileName,
        pageCount: bookInfo.pageCount,
        chapterOrSection: chapterOrSection || undefined,
        selectedPages: selectedPagesDesc,
        bookExcerpt: excerpt,
        documentType: 'book_reading',
      },
    };

    await onGenerate(request);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              {activeTab === 'question_paper' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {activeTab === 'question_paper'
                    ? 'Generate Similar Question Paper (Different Q&A)'
                    : 'Ask Questions from Book / PDF'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wide">
                  {activeTab === 'question_paper' ? 'Parallel Set B' : 'Book Grounded'}
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                {activeTab === 'question_paper'
                  ? 'Upload an existing exam or test paper PDF to formulate a new parallel version with different questions and verified answers.'
                  : 'Upload any textbook, reader, or novel PDF. Formulate questions directly derived from the text.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Segmented Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('question_paper')}
            id="tab-mode-question-paper"
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'question_paper'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Upload Question Paper (Generate Similar Paper)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('book')}
            id="tab-mode-book-reading"
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'book'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Upload Book / Textbook (Ask from Text)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Detected Question Paper Banner */}
          {detectedPaperNotice && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{detectedPaperNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetectedPaperNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error message */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">PDF Parsing Error</p>
                <p className="mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Upload or Choose Sample */}
          {!bookInfo ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {activeTab === 'question_paper'
                          ? 'Analyzing Question Paper & Detecting Questions...'
                          : 'Extracting Chapters & Text from PDF...'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Running structural heuristic analysis on pages and questions...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shadow-xs">
                      {activeTab === 'question_paper' ? (
                        <FileText className="w-7 h-7" />
                      ) : (
                        <Upload className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">
                        {activeTab === 'question_paper'
                          ? 'Upload Question Paper / Exam PDF'
                          : 'Upload Book, Reader, or Textbook PDF'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        {activeTab === 'question_paper'
                          ? 'Drag & drop any test paper, midterm, quiz, or final exam PDF here. We will generate a similar paper with different questions & verified answers.'
                          : 'Drag and drop your PDF here, or click to browse. Supports textbooks, excerpts, and reading passages up to 50MB.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-3 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs">
                        Browse Files (.pdf)
                      </span>
                      <span className="text-[11px] text-slate-400">Up to 50MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instant 1-Click Samples */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {activeTab === 'question_paper'
                      ? 'Or Try Sample Question Papers (1-Click)'
                      : 'Or Try Instant Sample Educational Books (1-Click)'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Click to load instantly</span>
                </div>

                {activeTab === 'question_paper' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_QUESTION_PAPERS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSampleQuestionPaper(sample)}
                        className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                              {sample.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {sample.questionCount} Questions
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1">
                            {sample.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {sample.gradeLevel} • {sample.topicsCovered.slice(0, 2).join(', ')}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          <span>Generate Similar Paper</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_BOOKS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSampleBook(sample)}
                        className="text-left p-3 rounded-xl border border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50/40 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                              {sample.category.split('&')[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{sample.pageCount} pgs</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-1">
                            {sample.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {sample.author} • {sample.gradeLevel.split('(')[0]}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-violet-600 group-hover:translate-x-0.5 transition-transform">
                          <span>Load Sample Book</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: Configure Questions from Parsed Document */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Loaded Document Banner */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border border-indigo-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-900">{bookInfo.fileName}</span>
                      <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded-full text-[10px] font-bold">
                        {bookInfo.pageCount} {bookInfo.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                      <span className="px-2 py-0.5 bg-white text-slate-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                        {bookInfo.wordCount.toLocaleString()} words
                      </span>
                      {bookInfo.detectedQuestionCount && bookInfo.detectedQuestionCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                          ~{bookInfo.detectedQuestionCount} questions detected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      {activeTab === 'question_paper'
                        ? 'Original question paper analyzed. Ready to generate alternate Set B paper with different questions.'
                        : 'Successfully parsed. Ready to formulate grounded assessment questions.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white/80 hover:bg-white rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  >
                    {showTextPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showTextPreview ? 'Hide Text' : 'View Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookInfo(null);
                      setParseError(null);
                      setDetectedPaperNotice(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white/80 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    title="Upload another document"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Text Preview Drawer */}
              {showTextPreview && (
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-[10px] font-bold text-slate-400">
                    <span>EXTRACTED DOCUMENT PREVIEW</span>
                    <span>{bookInfo.characterCount.toLocaleString()} Total Chars</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                    {bookInfo.fullText.slice(0, 2000)}
                    {bookInfo.fullText.length > 2000 && '\n\n[... Remaining content ready for question generation ...]'}
                  </pre>
                </div>
              )}

              {/* Title & Subject Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeTab === 'question_paper' ? 'Original Paper Title' : 'Book / Unit Title'}
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="e.g. Grade 8 Science Midterm Examination"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Area
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* QUESTION PAPER MODE: Variation Style Selector */}
              {activeTab === 'question_paper' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Paper Variation Style:
                    </label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      Generates fresh questions & answers
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {QUESTION_PAPER_VARIATIONS.map((style) => (
                      <label
                        key={style.id}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          variationStyle === style.id
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-extrabold text-slate-900">
                            {style.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border shrink-0 ${style.badgeColor}`}
                          >
                            {style.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {style.desc}
                        </p>
                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <input
                            type="radio"
                            name="variationStyle"
                            value={style.id}
                            checked={variationStyle === style.id}
                            onChange={() => setVariationStyle(style.id)}
                            className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-indigo-600">
                            {variationStyle === style.id ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                /* BOOK MODE: Pedagogical Scope & Focus */
                <div className="space-y-3">
                  {/* Pedagogical Focus Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pedagogical Focus & Question Type:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUESTION_FOCUS_OPTIONS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setQuestionFocus(f.id)}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                            questionFocus === f.id
                              ? 'border-violet-600 bg-violet-50/60 ring-1 ring-violet-500'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="font-extrabold text-slate-800 flex items-center justify-between">
                            <span>{f.label}</span>
                            {questionFocus === f.id && <Check className="w-3.5 h-3.5 text-violet-600" />}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{f.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scope Selection: All, Chapter, or Specific Pages */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Text Scope:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setScopeMode('all')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          scopeMode === 'all'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Entire Document
                      </button>

                      <button
                        type="button"
                        onClick={() => setScopeMode('chapter')}
                        disabled={!bookInfo.detectedChapters || bookInfo.detectedChapters.length === 0}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          scopeMode === 'chapter'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Specific Chapter ({bookInfo.detectedChapters?.length || 0})
                      </button>

                      <button
                        type="button"
                        onClick={() => setScopeMode('pages')}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          scopeMode === 'pages'
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Page Range
                      </button>
                    </div>

                    {/* Chapter selector dropdown */}
                    {scopeMode === 'chapter' && bookInfo.detectedChapters && bookInfo.detectedChapters.length > 0 && (
                      <div className="mt-2">
                        <select
                          value={selectedChapter}
                          onChange={(e) => setSelectedChapter(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                        >
                          {bookInfo.detectedChapters.map((ch) => (
                            <option key={ch.id} value={ch.title}>
                              {ch.title} (Page ~{ch.pageNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Page Range inputs */}
                    {scopeMode === 'pages' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-semibold">From Page:</span>
                        <input
                          type="number"
                          min={1}
                          max={bookInfo.pageCount}
                          value={pageRangeStart}
                          onChange={(e) => setPageRangeStart(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300"
                        />
                        <span className="text-xs text-slate-600 font-semibold">To Page:</span>
                        <input
                          type="number"
                          min={pageRangeStart}
                          max={bookInfo.pageCount}
                          value={pageRangeEnd}
                          onChange={(e) => setPageRangeEnd(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300"
                        />
                        <span className="text-[11px] text-slate-400">
                          (Max {bookInfo.pageCount} pages)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question Count, Format & Complexity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Question Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Question Count:
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <option key={count} value={count}>
                        {count} Questions
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Format */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Question Format:
                  </label>
                  <select
                    value={questionFormat}
                    onChange={(e) => setQuestionFormat(e.target.value as QuestionFormatOption)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="both">Both (MCQ + Fill in Blank)</option>
                    <option value="multiple_choice">Multiple Choice Only (4 options)</option>
                    <option value="fill_blank">Fill in the Blank Only</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complexity Level:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Foundational / Beginner</option>
                    <option value="intermediate">Standard / Grade Level</option>
                    <option value="expert">Advanced / Analytical</option>
                  </select>
                </div>
              </div>

              {/* Grade Level Alignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grade Level Alignment:
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Teacher Custom Directives (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Teacher Directives (Optional):
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={
                    activeTab === 'question_paper'
                      ? 'e.g. Change all numerical values in math problems, preserve Section B structure, etc.'
                      : 'e.g. Include questions on the character motivations, focus on vocabulary in chapter 2'
                  }
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  id="btn-generate-from-document"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-violet-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {activeTab === 'question_paper'
                          ? 'Generating Similar Question Paper...'
                          : 'Formulating Questions from Book...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {activeTab === 'question_paper'
                          ? 'Generate Similar Question Paper (Set B)'
                          : 'Generate Questions from this Book'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
