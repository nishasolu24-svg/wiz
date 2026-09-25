import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Worksheet, Question } from '../types';

interface InteractiveQuizViewProps {
  worksheet: Worksheet;
  onExit: () => void;
  theme?: 'light' | 'purple' | 'blue';
}

export const InteractiveQuizView: React.FC<InteractiveQuizViewProps> = ({
  worksheet,
  onExit,
  theme = 'purple',
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [showBookText, setShowBookText] = useState(false);

  const quizTheme = {
    purple: {
      bar: 'bg-[#22114F] border-purple-500/30 text-white shadow-md',
      title: 'text-white',
      badge: 'bg-purple-900/60 text-purple-200 border-purple-400/30',
      exitBtn: 'text-purple-200 hover:text-white hover:bg-purple-900/60 border-purple-400/30',
      card: 'bg-[#22114F] border-purple-500/30 text-white shadow-md',
      numBadge: 'bg-amber-400 text-slate-950 font-black',
      points: 'text-purple-300/80',
      qText: 'text-white',
      optUnselected: 'bg-[#150835] border-purple-500/30 hover:border-purple-400 text-purple-100',
      optSelected: 'bg-purple-900/80 border-amber-400 text-white ring-2 ring-amber-400/30 font-bold',
      input: 'bg-[#150835] border-purple-400/30 text-white placeholder:text-purple-300/40 focus:border-amber-400',
      stickySubmit: 'bg-[#19093E]/95 border-purple-500/40 text-white shadow-2xl',
      submitBtn: 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-lg',
      summaryBox: 'bg-[#160A38] text-purple-200 border border-purple-500/30',
    },
    blue: {
      bar: 'bg-[#0D284E] border-blue-400/30 text-white shadow-md',
      title: 'text-white',
      badge: 'bg-blue-900/60 text-blue-200 border-blue-400/30',
      exitBtn: 'text-blue-200 hover:text-white hover:bg-blue-900/60 border-blue-400/30',
      card: 'bg-[#0D284E] border-blue-400/30 text-white shadow-md',
      numBadge: 'bg-cyan-400 text-slate-950 font-black',
      points: 'text-blue-300/80',
      qText: 'text-white',
      optUnselected: 'bg-[#061830] border-blue-400/30 hover:border-blue-300 text-blue-100',
      optSelected: 'bg-blue-900/80 border-cyan-400 text-white ring-2 ring-cyan-400/30 font-bold',
      input: 'bg-[#061830] border-blue-400/30 text-white placeholder:text-blue-300/40 focus:border-cyan-400',
      stickySubmit: 'bg-[#081F3E]/95 border-blue-400/40 text-white shadow-2xl',
      submitBtn: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black shadow-lg',
      summaryBox: 'bg-[#071933] text-blue-200 border border-blue-400/30',
    },
    light: {
      bar: 'bg-white border-slate-200 text-slate-900 shadow-sm',
      title: 'text-slate-900',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      exitBtn: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200',
      card: 'bg-white border-slate-200 text-slate-900 shadow-xs',
      numBadge: 'bg-slate-900 text-white font-bold',
      points: 'text-slate-500',
      qText: 'text-slate-900',
      optUnselected: 'bg-white border-slate-200 hover:border-slate-300 text-slate-800',
      optSelected: 'bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-200 font-semibold',
      input: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-500',
      stickySubmit: 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl',
      submitBtn: 'bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg',
      summaryBox: 'bg-slate-100 text-slate-800 border border-slate-200',
    },
  }[theme] || {
    bar: 'bg-white border-slate-200 text-slate-900',
    title: 'text-slate-900',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    exitBtn: 'text-slate-600 hover:text-slate-900 border-slate-200',
    card: 'bg-white border-slate-200 text-slate-900',
    numBadge: 'bg-slate-900 text-white font-bold',
    points: 'text-slate-500',
    qText: 'text-slate-900',
    optUnselected: 'bg-white border-slate-200 text-slate-800',
    optSelected: 'bg-purple-50 border-purple-600 text-purple-950 font-semibold',
    input: 'bg-white border-slate-300 text-slate-900',
    stickySubmit: 'bg-white/95 border-slate-200 text-slate-900',
    submitBtn: 'bg-purple-600 text-white font-black',
    summaryBox: 'bg-slate-100 text-slate-800 border border-slate-200',
  };

  // Timer
  useEffect(() => {
    let interval: any;
    if (timerActive && !submitted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, submitted]);

  // Calculate score when submitted
  const handleSubmit = () => {
    let earned = 0;
    let total = 0;

    worksheet.questions.forEach((q) => {
      const qPoints = q.points || 1;
      total += qPoints;

      const userAns = (userAnswers[q.id] || '').trim().toLowerCase();

      if (q.type === 'multiple_choice') {
        const correct = (q.correctAnswer || '').trim().toLowerCase();
        if (userAns === correct) {
          earned += qPoints;
        }
      } else if (q.type === 'true_false') {
        const correct = (q.correctAnswer || '').trim().toLowerCase();
        if (userAns === correct) {
          earned += qPoints;
        }
      } else if (q.type === 'fill_blank') {
        const correct = (q.correctAnswer || '').trim().toLowerCase();
        if (userAns === correct || correct.includes(userAns) && userAns.length > 2) {
          earned += qPoints;
        }
      } else {
        // Short answer or math problem: give partial/full if answered
        if (userAns.length > 5) {
          earned += Math.round(qPoints * 0.85); // good effort base
        }
      }
    });

    setScore(earned);
    setMaxScore(total || worksheet.totalPoints);
    setSubmitted(true);
    setTimerActive(false);

    // Trigger confetti if scored well
    const percentage = total > 0 ? (earned / total) * 100 : 0;
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // canvas-confetti fallback
      }
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setElapsedSeconds(0);
    setTimerActive(true);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] && userAnswers[k].trim() !== ''
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Quiz Progress & Top Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 relative overflow-hidden ${quizTheme.bar}`}>
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs">
              ⚡ Online Assessment Mode
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${quizTheme.badge}`}>
              {worksheet.questions.length} Questions
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black capitalize ${
                worksheet.difficulty === 'beginner' || worksheet.difficulty === 'foundational'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : worksheet.difficulty === 'expert' || worksheet.difficulty === 'advanced'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              }`}
            >
              {worksheet.difficulty === 'beginner' || worksheet.difficulty === 'foundational'
                ? 'Beginner Complexity'
                : worksheet.difficulty === 'expert' || worksheet.difficulty === 'advanced'
                ? 'Expert Complexity'
                : 'Intermediate Complexity'}
            </span>
          </div>
          <h2 className={`text-base sm:text-lg font-black mt-1 ${quizTheme.title}`}>{worksheet.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={onExit}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors border cursor-pointer ${quizTheme.exitBtn}`}
          >
            Exit to Worksheet
          </button>
        </div>
      </div>

      {/* Submitted Score Summary Card */}
      {submitted && (
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-indigo-200 animate-scaleIn relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md text-amber-300 flex items-center justify-center shadow-lg border border-white/30 shrink-0">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">
                  Assessment Completed! 🎉
                </span>
                <h3 className="text-3xl font-black text-white">
                  {score} / {maxScore} Points
                  <span className="text-lg font-bold text-white/80 ml-2">
                    ({Math.round((score / (maxScore || 1)) * 100)}%)
                  </span>
                </h3>
                <p className="text-xs text-indigo-100 mt-1 font-medium">
                  Time taken: {formatTime(elapsedSeconds)} • Review correct answers and solution explanations below
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-indigo-900 bg-white hover:bg-indigo-50 shadow-lg active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>Retake Test</span>
            </button>
          </div>
        </div>
      )}

      {/* Source Book Reference Context if applicable */}
      {worksheet.sourceBook ? (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-violet-950">
                    Book Source: {worksheet.sourceBook.title}
                  </h4>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-violet-200 text-violet-900">
                    Book Grounded
                  </span>
                </div>
                <p className="text-[11px] text-violet-700">
                  {worksheet.sourceBook.chapterOrPages || 'Full Document'} • All questions are derived directly from this book
                </p>
              </div>
            </div>

            {worksheet.passage && (
              <button
                type="button"
                onClick={() => setShowBookText(!showBookText)}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 px-3 py-1.5 bg-white rounded-xl border border-violet-200 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>{showBookText ? 'Hide Book Passage' : 'Read Book Passage'}</span>
                {showBookText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {showBookText && worksheet.passage && (
            <div className="mt-3 p-4 bg-white rounded-xl border border-violet-200 text-xs sm:text-sm font-serif text-slate-800 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line shadow-inner">
              {worksheet.passage}
            </div>
          )}
        </div>
      ) : worksheet.passage ? (
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Reading Passage / Reference Context</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-serif">
            {worksheet.passage}
          </p>
        </div>
      ) : null}

      {/* Questions List */}
      <div className="space-y-4">
        {worksheet.questions.map((q, idx) => {
          const userAns = userAnswers[q.id] || '';
          const isAnswered = Boolean(userAns);
          const isCorrect =
            submitted &&
            q.correctAnswer &&
            userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-950/40 border-emerald-400 text-white'
                    : 'bg-rose-950/40 border-rose-400 text-white'
                  : quizTheme.card
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${quizTheme.numBadge}`}>
                    {idx + 1}
                  </span>
                  <span className={`text-xs font-medium ${quizTheme.points}`}>
                    ({q.points} {q.points === 1 ? 'pt' : 'pts'})
                  </span>
                </div>

                {submitted && (
                  <div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-900/60 border border-rose-400/40 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={`text-sm font-semibold mb-4 ${quizTheme.qText}`}>{q.question}</div>

              {/* Multiple Choice Options */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userAns === opt;
                    const isTarget = submitted && opt.trim() === q.correctAnswer?.trim();

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={submitted}
                        onClick={() => setUserAnswers({ ...userAnswers, [q.id]: opt })}
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                          submitted
                            ? isTarget
                              ? 'bg-emerald-900/70 border-emerald-400 text-emerald-200 font-bold'
                              : isSelected
                              ? 'bg-rose-900/70 border-rose-400 text-rose-200 line-through'
                              : 'opacity-50 ' + quizTheme.optUnselected
                            : isSelected
                            ? quizTheme.optSelected
                            : quizTheme.optUnselected
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                              : 'border-current opacity-70'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {q.type === 'true_false' && (
                <div className="flex gap-3">
                  {['True', 'False'].map((choice) => {
                    const isSelected = userAns.toLowerCase() === choice.toLowerCase();
                    const isTarget =
                      submitted && choice.toLowerCase() === q.correctAnswer?.toLowerCase();

                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={submitted}
                        onClick={() => setUserAnswers({ ...userAnswers, [q.id]: choice })}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                          submitted
                            ? isTarget
                              ? 'bg-emerald-900/70 border-emerald-400 text-emerald-200'
                              : isSelected
                              ? 'bg-rose-900/70 border-rose-400 text-rose-200'
                              : 'opacity-50 ' + quizTheme.optUnselected
                            : isSelected
                            ? quizTheme.optSelected
                            : quizTheme.optUnselected
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank */}
              {q.type === 'fill_blank' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    disabled={submitted}
                    value={userAns}
                    onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                    placeholder="Type your answer here..."
                    className={`w-full sm:w-80 px-3.5 py-2 text-sm rounded-xl border outline-none ${quizTheme.input}`}
                  />
                  {q.wordBank && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`text-[11px] font-semibold ${quizTheme.points}`}>Word Bank:</span>
                      {q.wordBank.map((w, wIdx) => (
                        <button
                          key={wIdx}
                          type="button"
                          disabled={submitted}
                          onClick={() => setUserAnswers({ ...userAnswers, [q.id]: w })}
                          className={`px-2 py-0.5 text-[11px] rounded border cursor-pointer ${quizTheme.optUnselected}`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Short Answer or Math Problem */}
              {(q.type === 'short_answer' || q.type === 'math_problem') && (
                <div>
                  <textarea
                    rows={3}
                    disabled={submitted}
                    value={userAns}
                    onChange={(e) => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })}
                    placeholder="Write your explanation or step-by-step calculations..."
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border outline-none ${quizTheme.input}`}
                  />
                </div>
              )}

              {/* Explanation note when submitted */}
              {submitted && (
                <div className={`mt-3 p-3 rounded-xl text-xs space-y-1 ${quizTheme.summaryBox}`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Correct Answer:</span>
                    <span className="font-mono text-amber-300 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                      {q.correctAnswer || q.finalAnswer || q.sampleAnswer}
                    </span>
                  </div>
                  {q.explanation && <p className="pt-0.5 opacity-80">{q.explanation}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      {!submitted && (
        <div className={`sticky bottom-4 backdrop-blur-md p-4 rounded-2xl border flex items-center justify-between gap-4 ${quizTheme.stickySubmit}`}>
          <div className="text-xs font-semibold">
            Answered <span className="font-extrabold px-2 py-0.5 rounded-md border bg-amber-400/20 text-amber-300 border-amber-400/40">{answeredCount}</span> of{' '}
            <span className="font-bold">{worksheet.questions.length}</span> questions
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer ${quizTheme.submitBtn}`}
          >
            <span>Submit Assessment & Grade</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
