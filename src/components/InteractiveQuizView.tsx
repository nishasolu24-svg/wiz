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
}

export const InteractiveQuizView: React.FC<InteractiveQuizViewProps> = ({
  worksheet,
  onExit,
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [showBookText, setShowBookText] = useState(false);

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
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-indigo-100 shadow-md flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs">
              ⚡ Online Assessment Mode
            </span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
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
          <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">{worksheet.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
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
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-rose-50/30 border-rose-200'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    ({q.points} {q.points === 1 ? 'pt' : 'pts'})
                  </span>
                </div>

                {submitted && (
                  <div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-900 mb-4">{q.question}</div>

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
                        className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3 ${
                          submitted
                            ? isTarget
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                              : isSelected
                              ? 'bg-rose-100 border-rose-400 text-rose-950 line-through'
                              : 'bg-white border-slate-200 text-slate-400'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-semibold ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-slate-300 text-slate-500'
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
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                          submitted
                            ? isTarget
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                              : isSelected
                              ? 'bg-rose-100 border-rose-400 text-rose-950'
                              : 'bg-white border-slate-200 text-slate-400'
                            : isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
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
                    className="w-full sm:w-80 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                  />
                  {q.wordBank && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500">Word Bank:</span>
                      {q.wordBank.map((w, wIdx) => (
                        <button
                          key={wIdx}
                          type="button"
                          disabled={submitted}
                          onClick={() => setUserAnswers({ ...userAnswers, [q.id]: w })}
                          className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200"
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
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                  />
                </div>
              )}

              {/* Explanation note when submitted */}
              {submitted && (
                <div className="mt-3 p-3 rounded-xl bg-slate-100 text-xs text-slate-800 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Correct Answer:</span>
                    <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {q.correctAnswer || q.finalAnswer || q.sampleAnswer}
                    </span>
                  </div>
                  {q.explanation && <p className="pt-0.5 text-slate-600">{q.explanation}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      {!submitted && (
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border-2 border-indigo-100 shadow-2xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-700 font-semibold">
            Answered <span className="font-extrabold text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-200">{answeredCount}</span> of{' '}
            <span className="font-bold text-slate-900">{worksheet.questions.length}</span> questions
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            <span>Submit Assessment & Grade</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
