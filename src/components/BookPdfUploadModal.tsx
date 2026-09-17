import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  WorksheetGenerationRequest,
  DifficultyLevel,
  QuestionFormatOption,
  UploadedBookInfo,
} from '../types';
import { SAMPLE_BOOKS, SampleBook } from '../data/sampleBooks';
import { parsePdfInBrowser } from '../services/pdfParserClient';
import { authService } from '../services/authService';

interface BookPdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: WorksheetGenerationRequest) => Promise<void>;
  isGenerating: boolean;
}

const QUESTION_COUNT_OPTIONS = [3, 5, 8, 10, 12, 15];

const QUESTION_FOCUS_OPTIONS = [
  { id: 'comprehension', label: 'Reading Comprehension', desc: 'Assess understanding, central themes, and textual evidence' },
  { id: 'vocabulary', label: 'Vocabulary & Key Terms', desc: 'Test mastery of essential terminology, phrases, and definitions' },
  { id: 'facts_recall', label: 'Factual Recall & Events', desc: 'Direct questions on events, characters, dates, or data points' },
  { id: 'critical_thinking', label: 'Critical Thinking & Analysis', desc: 'Inferential reasoning, author perspective, and deeper meaning' },
];

const SUBJECTS = [
  'English Language Arts',
  'Science',
  'Social Studies / History',
  'Mathematics',
  'Philosophy & Civics',
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Parsed book state
  const [bookInfo, setBookInfo] = useState<UploadedBookInfo | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [subject, setSubject] = useState('English Language Arts');
  const [gradeLevel, setGradeLevel] = useState('Grade 6 (Middle School)');
  const [questionCount, setQuestionCount] = useState(6);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [questionFormat, setQuestionFormat] = useState<QuestionFormatOption>('both');
  const [questionFocus, setQuestionFocus] = useState('comprehension');
  const [scopeMode, setScopeMode] = useState<'all' | 'chapter' | 'pages'>('all');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(5);
  const [showTextPreview, setShowTextPreview] = useState(false);

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

    try {
      // 1. First Attempt: Direct in-browser PDF parsing (Fast, 0 network cost, works on Cloudflare Pages)
      try {
        const clientParsed = await parsePdfInBrowser(file);
        if (clientParsed && clientParsed.fullText && clientParsed.fullText.trim().length > 30) {
          setBookInfo(clientParsed);
          setBookTitle(clientParsed.suggestedTitle || file.name.replace(/\.pdf$/i, ''));
          setPageRangeStart(1);
          setPageRangeEnd(Math.min(5, clientParsed.pageCount || 1));
          if (clientParsed.detectedChapters && clientParsed.detectedChapters.length > 0) {
            setSelectedChapter(clientParsed.detectedChapters[0].title);
          }
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
            // Static host or non-JSON response fallback
            throw new Error(
              'Text could not be extracted automatically. The document may be a scanned image without selectable text. Please choose a PDF containing digital text or select one of the curriculum books below.'
            );
          }

          const data = await response.json();

          if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to extract text from PDF');
          }

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
          });

          setBookTitle(data.suggestedTitle || file.name.replace(/\.pdf$/i, ''));
          setPageRangeStart(1);
          setPageRangeEnd(Math.min(5, data.pageCount || 1));

          if (data.detectedChapters && data.detectedChapters.length > 0) {
            setSelectedChapter(data.detectedChapters[0].title);
          }
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

  const handleSelectSample = (sample: SampleBook) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookInfo) return;

    // Determine excerpt based on scope mode
    let excerpt = bookInfo.fullText;
    let selectedPagesDesc = 'All Pages';
    let chapterOrSection = '';

    if (scopeMode === 'chapter' && selectedChapter) {
      chapterOrSection = selectedChapter;
      selectedPagesDesc = `Chapter: ${selectedChapter}`;
      // Find chapter offset in text if possible
      const chIndex = bookInfo.fullText.indexOf(selectedChapter);
      if (chIndex !== -1) {
        excerpt = bookInfo.fullText.slice(chIndex, chIndex + 18000);
      } else {
        excerpt = bookInfo.fullText.slice(0, 20000);
      }
    } else if (scopeMode === 'pages') {
      selectedPagesDesc = `Pages ${pageRangeStart} to ${pageRangeEnd}`;
      // Approximate slice based on page count
      const totalPages = Math.max(1, bookInfo.pageCount);
      const startRatio = Math.max(0, (pageRangeStart - 1) / totalPages);
      const endRatio = Math.min(1, pageRangeEnd / totalPages);
      const startChar = Math.floor(startRatio * bookInfo.fullText.length);
      const endChar = Math.ceil(endRatio * bookInfo.fullText.length);
      excerpt = bookInfo.fullText.slice(startChar, Math.min(endChar, startChar + 35000));
    } else {
      // Limit to 40,000 characters for optimal reasoning
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
      specialInstructions: `Ground all questions strictly in the text of the book "${bookTitle}". Focus emphasis on: ${selectedFocus?.label || 'Reading Comprehension'} (${selectedFocus?.desc || ''}). In question explanations, cite evidence from the text.`,
      bookData: {
        fileName: bookInfo.fileName,
        bookTitle: bookTitle.trim() || bookInfo.fileName,
        pageCount: bookInfo.pageCount,
        chapterOrSection: chapterOrSection || undefined,
        selectedPages: selectedPagesDesc,
        bookExcerpt: excerpt,
      },
    };

    await onGenerate(request);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-indigo-100 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">Ask Questions from Book / PDF</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wide">
                  New Feature
                </span>
              </div>
              <p className="text-xs text-indigo-100 font-medium">
                Upload any book, textbook, or reader. WizSheet AI will formulate questions directly from the text.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* STEP 1: Upload or Choose Sample Book */}
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
                    ? 'border-violet-500 bg-violet-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-violet-400 bg-slate-50/70 hover:bg-violet-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-3" />
                    <p className="text-sm font-bold text-slate-800">Reading & Extracting PDF Content...</p>
                    <p className="text-xs text-slate-500 mt-1">Analyzing pages, text structures, and detected chapters</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-100 to-indigo-100 text-violet-700 flex items-center justify-center mb-3 shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag & drop your Book or Textbook PDF here
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Supports PDF documents up to 50MB. For thick textbooks, extracting the target chapter ensures the best questions.
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 transition-all"
                    >
                      Browse PDF File
                    </button>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Upload Error: </span>
                    {parseError}
                  </div>
                </div>
              )}

              {/* Instant 1-Click Educational Book Samples */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2.5">
                  <Bookmark className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Or Try Instant Sample Educational Books (1-Click)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SAMPLE_BOOKS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50/40 transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs"
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
              </div>
            </div>
          ) : (
            /* STEP 2: Configure Questions from Parsed Book */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Loaded Book Banner */}
              <div className="p-3.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-violet-200">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-violet-900">{bookInfo.fileName}</span>
                      <span className="px-2 py-0.5 bg-violet-200/80 text-violet-900 rounded-full text-[10px] font-bold">
                        {bookInfo.pageCount} {bookInfo.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                      <span className="px-2 py-0.5 bg-white text-slate-700 border border-violet-200 rounded-full text-[10px] font-bold">
                        {bookInfo.wordCount.toLocaleString()} words
                      </span>
                    </div>
                    <p className="text-[11px] text-violet-700">
                      Successfully parsed. Ready to formulate grounded assessment questions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-violet-700 hover:text-violet-900 bg-white/80 hover:bg-white rounded-lg border border-violet-200 transition-colors"
                  >
                    {showTextPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showTextPreview ? 'Hide Text' : 'View Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookInfo(null);
                      setParseError(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white/80 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                    title="Upload another book"
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
                    <span>EXTRACTED BOOK TEXT PREVIEW (First 2,000 characters)</span>
                    <span>{bookInfo.characterCount.toLocaleString()} Total Chars</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                    {bookInfo.fullText.slice(0, 2000)}
                    {bookInfo.fullText.length > 2000 && '\n\n[... Remaining content ready for question generation ...]'}
                  </pre>
                </div>
              )}

              {/* Book Title & Subject Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Book / Unit Title
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="e.g. The Little Prince, Chapter 1"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scope Selection: Whole Book vs Chapter vs Page Range */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Question Scope / Text Range:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScopeMode('all')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      scopeMode === 'all'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📘 Entire Document
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeMode('chapter')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      scopeMode === 'chapter'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📑 Specific Chapter
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeMode('pages')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      scopeMode === 'pages'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📄 Page Range
                  </button>
                </div>

                {/* Chapter selector */}
                {scopeMode === 'chapter' && (
                  <div className="pt-2">
                    {bookInfo.detectedChapters && bookInfo.detectedChapters.length > 0 ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Select Detected Chapter:
                        </label>
                        <select
                          value={selectedChapter}
                          onChange={(e) => setSelectedChapter(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white"
                        >
                          {bookInfo.detectedChapters.map((ch) => (
                            <option key={ch.id} value={ch.title}>
                              {ch.title} (around pg {ch.pageNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Enter Chapter or Section Name:
                        </label>
                        <input
                          type="text"
                          value={selectedChapter}
                          onChange={(e) => setSelectedChapter(e.target.value)}
                          placeholder="e.g. Chapter 3: Photosynthesis"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Page range inputs */}
                {scopeMode === 'pages' && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Start Page (1 to {bookInfo.pageCount}):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={bookInfo.pageCount}
                        value={pageRangeStart}
                        onChange={(e) => setPageRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300"
                      />
                    </div>
                    <span className="text-slate-400 font-bold mt-5">to</span>
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        End Page:
                      </label>
                      <input
                        type="number"
                        min={pageRangeStart}
                        max={bookInfo.pageCount}
                        value={pageRangeEnd}
                        onChange={(e) => setPageRangeEnd(Math.max(pageRangeStart, parseInt(e.target.value) || pageRangeStart))}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pedagogical Focus */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Question Focus & Pedagogical Goal:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUESTION_FOCUS_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setQuestionFocus(f.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                        questionFocus === f.id
                          ? 'bg-violet-50/80 border-violet-500 text-violet-950 ring-1 ring-violet-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{f.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count & Format Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Number of Questions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Questions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUESTION_COUNT_OPTIONS.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 min-w-[34px] py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          questionCount === num
                            ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Format */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Question Format:
                  </label>
                  <select
                    value={questionFormat}
                    onChange={(e) => setQuestionFormat(e.target.value as QuestionFormatOption)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
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
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="beginner">Foundational / Beginner</option>
                    <option value="intermediate">Standard / Grade Level</option>
                    <option value="expert">Advanced / Analytical</option>
                  </select>
                </div>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grade Level Alignment:
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-violet-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Formulating Questions from Book...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Questions from this Book</span>
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
