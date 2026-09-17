import React from 'react';
import { Worksheet } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface WorksheetPrintViewProps {
  worksheet: Worksheet;
  mode: 'student' | 'answer_key';
  fontSize?: 'compact' | 'standard' | 'large';
  fontStyle?: 'sans' | 'serif';
}

export const WorksheetPrintView: React.FC<WorksheetPrintViewProps> = ({
  worksheet,
  mode,
  fontSize = 'standard',
  fontStyle = 'sans',
}) => {
  const isAnswerKey = mode === 'answer_key';

  const fontClass = fontStyle === 'serif' ? 'font-serif' : 'font-sans';
  const sizeClass =
    fontSize === 'compact'
      ? 'text-xs leading-tight'
      : fontSize === 'large'
      ? 'text-base leading-relaxed'
      : 'text-sm leading-normal';

  // Compute a sleek reference code
  const refCode = `REF: WS-${(worksheet.gradeLevel || 'GEN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${(worksheet.subject || 'SUB').slice(0, 3).toUpperCase()}-${worksheet.id.slice(-4).toUpperCase()}${worksheet.versionLabel ? `-${worksheet.versionLabel}` : ''}`;

  return (
    <div
      className={`print-page bg-white p-6 sm:p-12 max-w-[720px] mx-auto border border-slate-200 shadow-2xl sm:rounded-sm text-slate-800 flex flex-col relative ${fontClass} ${sizeClass}`}
    >
      {/* Sleek Sheet Header */}
      <header className="worksheet-header border-b-2 border-slate-900 pb-4 mb-8">
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 mb-2 border-b border-slate-150">
          <div className="font-semibold text-slate-600 flex items-center gap-1.5">
            <span>{worksheet.schoolName || 'School Assessment'}</span>
            {worksheet.teacherName && (
              <span className="text-slate-400 font-normal">• {worksheet.teacherName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {worksheet.standardCode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                {worksheet.standardCode}
              </span>
            )}
            {worksheet.versionLabel && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                Version {worksheet.versionLabel}
              </span>
            )}
            {isAnswerKey && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-700 text-white tracking-wider">
                Teacher Answer Key
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-tight text-slate-900">
              {worksheet.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Topic: {worksheet.subtitle || worksheet.subject}
            </p>
          </div>

          {/* Sleek Name / Date / Score Underline Blocks */}
          <div className="w-full sm:w-44 shrink-0 space-y-2.5 text-xs text-slate-400">
            <div className="border-b border-slate-300 pb-1 flex justify-between items-end">
              <span>Name</span>
              {isAnswerKey && (
                <span className="text-emerald-700 font-bold text-[11px]">[KEY]</span>
              )}
            </div>
            <div className="border-b border-slate-300 pb-1 flex justify-between items-end">
              <span>Date</span>
            </div>
            <div className="border-b border-slate-300 pb-1 flex justify-between items-end">
              <span>Score</span>
              <span className="text-slate-700 font-bold text-[11px]">/ {worksheet.totalPoints}</span>
            </div>
          </div>
        </div>

        {/* Student Instructions */}
        {worksheet.instructions && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mr-1.5">
              Instructions:
            </span>
            <span>{worksheet.instructions}</span>
          </div>
        )}

        {/* Source Book Citation if present */}
        {worksheet.sourceBook && (
          <div className="mt-3 px-3 py-1.5 bg-slate-100/80 border border-slate-300 rounded text-[11px] text-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold">Text Source:</span> {worksheet.sourceBook.title}
              {worksheet.sourceBook.chapterOrPages && (
                <span className="text-slate-500 ml-1.5">({worksheet.sourceBook.chapterOrPages})</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Book Grounded</span>
          </div>
        )}

        {/* Reading Passage if included */}
        {worksheet.passage && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-sm">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Reading Passage
            </h4>
            <div className="text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line font-serif">
              {worksheet.passage}
            </div>
          </div>
        )}

        {/* Word Bank if included */}
        {worksheet.wordBank && worksheet.wordBank.length > 0 && (
          <div className="mt-4 p-3 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Word Bank
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs font-medium text-slate-700">
              {worksheet.wordBank.map((word, wIdx) => (
                <span key={wIdx} className="underline decoration-slate-300 decoration-2">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Questions Section */}
      <div className="space-y-7 flex-1">
        {worksheet.questions.map((q, idx) => {
          return (
            <div key={q.id || idx} className="question-item break-inside-avoid space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                  <span>{idx + 1}. </span>
                  <span>{q.question}</span>
                </p>
                <span className="text-xs text-slate-400 font-medium shrink-0 pt-0.5">
                  ({q.points} {q.points === 1 ? 'pt' : 'pts'})
                </span>
              </div>

              {/* Educational Diagram for Visual Identification */}
              {q.imageUrl && (
                <div className="my-2.5 pl-2 sm:pl-4 print:my-2">
                  <div className="inline-block max-w-sm sm:max-w-md border border-slate-300 rounded-lg p-2 bg-white text-center shadow-2xs">
                    <img
                      src={q.imageUrl}
                      alt={q.imageAlt || q.imageCaption || 'Educational Diagram'}
                      referrerPolicy="no-referrer"
                      className="max-h-44 sm:max-h-52 w-auto object-contain mx-auto rounded"
                    />
                    {q.imageCaption && (
                      <p className="text-[10.5px] text-slate-600 font-semibold italic text-center mt-1.5 border-t border-slate-200 pt-1">
                        {q.imageCaption}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Multiple Choice Options with Sleek square checkmarks */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-2 sm:pl-4 mt-2">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = isAnswerKey && opt.trim() === q.correctAnswer?.trim();

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2.5 py-1 px-2 rounded ${
                          isCorrect ? 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 border border-slate-400 rounded-xs flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white'
                          }`}
                        >
                          {isCorrect ? '✓' : ''}
                        </div>
                        <span className="text-xs sm:text-sm">
                          <span className="font-semibold">{letter})</span> {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False Section */}
              {q.type === 'true_false' && (
                <div className="flex items-center gap-8 pl-2 sm:pl-4 mt-2 text-xs sm:text-sm">
                  {['True', 'False'].map((tf) => {
                    const isCorrect =
                      isAnswerKey && tf.toLowerCase() === q.correctAnswer?.toLowerCase();
                    return (
                      <div key={tf} className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 border border-slate-400 rounded-xs flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white'
                          }`}
                        >
                          {isCorrect ? '✓' : ''}
                        </div>
                        <span className={isCorrect ? 'font-bold underline text-emerald-900' : 'text-slate-700'}>
                          {tf}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fill in the blank */}
              {q.type === 'fill_blank' && (
                <div className="pl-2 sm:pl-4 mt-2">
                  {isAnswerKey ? (
                    <div className="text-xs sm:text-sm font-bold text-emerald-800">
                      Answer: <span className="underline decoration-emerald-600 decoration-2">{q.correctAnswer}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 text-xs sm:text-sm text-slate-700">
                      <span className="font-medium">Answer:</span>
                      <div className="border-b border-slate-400 w-52 h-4 inline-block"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Matching */}
              {q.type === 'matching' && q.matchingPairs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2 sm:pl-4 mt-2 text-xs sm:text-sm">
                  <div className="space-y-2">
                    {q.matchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="w-8 border-b border-slate-400 text-center font-bold text-xs text-slate-800">
                          {isAnswerKey ? String.fromCharCode(65 + pIdx) : ''}
                        </span>
                        <span className="text-slate-700">
                          {pIdx + 1}. {pair.left}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {q.matchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{String.fromCharCode(65 + pIdx)}.</span>
                        <span className="text-slate-700">{pair.right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer / Math Problem Writing Space */}
              {(q.type === 'short_answer' || q.type === 'math_problem') && !isAnswerKey && (
                <div className="mt-3 pl-2 sm:pl-4 space-y-3.5">
                  <div className="answer-ruled-line" />
                  <div className="answer-ruled-line" />
                  <div className="answer-ruled-line" />
                </div>
              )}

              {/* Teacher Answer Key Explanations */}
              {isAnswerKey && (
                <div className="mt-2 pl-2 sm:pl-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Key:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-emerald-800 font-semibold">
                      {q.correctAnswer || q.finalAnswer || q.sampleAnswer}
                    </span>
                  </div>

                  {q.stepByStepSolution && q.stepByStepSolution.length > 0 && (
                    <div className="pl-5 space-y-0.5 text-slate-600 text-[11px]">
                      {q.stepByStepSolution.map((step, sIdx) => (
                        <div key={sIdx}>• {step}</div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="pl-5 text-[11px] text-slate-500 italic">
                      Note: {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sleek Sheet Footer line */}
      <footer className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-mono tracking-wide">{refCode} | Page 1 of 1</span>
        <span className="uppercase tracking-widest font-semibold text-slate-400">
          {isAnswerKey ? 'Teacher Answer Key' : 'Student Handout'}
        </span>
      </footer>
    </div>
  );
};
