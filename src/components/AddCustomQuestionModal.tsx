import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ListOrdered,
  Type,
  ToggleLeft,
  FileQuestion,
  Calculator,
  Image as ImageIcon,
} from 'lucide-react';
import { Question, QuestionType } from '../types';
import { ImagePickerModal } from './ImagePickerModal';

interface AddCustomQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (question: Question) => void;
}

const QUESTION_TYPES: { id: QuestionType; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  {
    id: 'multiple_choice',
    label: 'Multiple Choice',
    icon: ListOrdered,
    description: 'Provide 2–6 choices with one designated correct answer',
  },
  {
    id: 'fill_blank',
    label: 'Fill in the Blank',
    icon: Type,
    description: 'Sentence with a missing word or phrase to complete',
  },
  {
    id: 'true_false',
    label: 'True / False',
    icon: ToggleLeft,
    description: 'Binary fact or statement verification',
  },
  {
    id: 'short_answer',
    label: 'Short Answer',
    icon: FileQuestion,
    description: 'Open-ended conceptual explanation or short response',
  },
  {
    id: 'math_problem',
    label: 'Step-by-Step Problem',
    icon: Calculator,
    description: 'Multi-step computational or problem-solving prompt',
  },
];

const OPTION_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 focus-within:border-blue-500',
  'bg-purple-100 text-purple-800 border-purple-200 focus-within:border-purple-500',
  'bg-amber-100 text-amber-800 border-amber-200 focus-within:border-amber-500',
  'bg-emerald-100 text-emerald-800 border-emerald-200 focus-within:border-emerald-500',
  'bg-rose-100 text-rose-800 border-rose-200 focus-within:border-rose-500',
  'bg-cyan-100 text-cyan-800 border-cyan-200 focus-within:border-cyan-500',
];

export const AddCustomQuestionModal: React.FC<AddCustomQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestion,
}) => {
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState<number>(2);
  const [explanation, setExplanation] = useState('');

  // Multiple choice options state
  const [options, setOptions] = useState<string[]>([
    '',
    '',
    '',
    '',
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  // Other types state
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<'True' | 'False'>('True');
  const [shortAnswerSample, setShortAnswerSample] = useState('');
  const [mathFinalAnswer, setMathFinalAnswer] = useState('');

  // Diagram state
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageCaption, setImageCaption] = useState<string | undefined>();
  const [imageAlt, setImageAlt] = useState<string | undefined>();
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Option management for Multiple Choice
  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError('A multiple choice question must have at least 2 choices.');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctOptionIndex >= updated.length) {
      setCorrectOptionIndex(updated.length - 1);
    } else if (correctOptionIndex === index) {
      setCorrectOptionIndex(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPrompt = questionText.trim();
    if (!trimmedPrompt) {
      setError('Please enter a question prompt.');
      return;
    }

    const newId = `q-custom-${Date.now()}`;

    if (type === 'multiple_choice') {
      const cleanOptions = options.map((opt) => opt.trim());
      const hasEmpty = cleanOptions.some((opt) => opt.length === 0);
      if (hasEmpty) {
        setError('Please fill in all multiple choice options or remove unused ones.');
        return;
      }
      if (cleanOptions.length < 2) {
        setError('Please provide at least 2 choices.');
        return;
      }

      const selectedCorrect = cleanOptions[correctOptionIndex] || cleanOptions[0];

      const newQuestion: Question = {
        id: newId,
        type: 'multiple_choice',
        question: trimmedPrompt,
        points: Math.max(1, Number(points) || 1),
        options: cleanOptions,
        correctAnswer: selectedCorrect,
        explanation: explanation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAlt: imageAlt || undefined,
      };

      onAddQuestion(newQuestion);
      handleClose();
      return;
    }

    if (type === 'fill_blank') {
      if (!fillBlankAnswer.trim()) {
        setError('Please provide the correct answer word or phrase for the blank.');
        return;
      }
      const newQuestion: Question = {
        id: newId,
        type: 'fill_blank',
        question: trimmedPrompt,
        points: Math.max(1, Number(points) || 1),
        correctAnswer: fillBlankAnswer.trim(),
        explanation: explanation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAlt: imageAlt || undefined,
      };
      onAddQuestion(newQuestion);
      handleClose();
      return;
    }

    if (type === 'true_false') {
      const newQuestion: Question = {
        id: newId,
        type: 'true_false',
        question: trimmedPrompt,
        points: Math.max(1, Number(points) || 1),
        correctAnswer: trueFalseAnswer,
        explanation: explanation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAlt: imageAlt || undefined,
      };
      onAddQuestion(newQuestion);
      handleClose();
      return;
    }

    if (type === 'short_answer') {
      const newQuestion: Question = {
        id: newId,
        type: 'short_answer',
        question: trimmedPrompt,
        points: Math.max(1, Number(points) || 1),
        sampleAnswer: shortAnswerSample.trim() || undefined,
        explanation: explanation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAlt: imageAlt || undefined,
      };
      onAddQuestion(newQuestion);
      handleClose();
      return;
    }

    if (type === 'math_problem') {
      const newQuestion: Question = {
        id: newId,
        type: 'math_problem',
        question: trimmedPrompt,
        points: Math.max(1, Number(points) || 1),
        finalAnswer: mathFinalAnswer.trim() || undefined,
        explanation: explanation.trim() || undefined,
        imageUrl: imageUrl || undefined,
        imageCaption: imageCaption || undefined,
        imageAlt: imageAlt || undefined,
      };
      onAddQuestion(newQuestion);
      handleClose();
      return;
    }
  };

  const handleClose = () => {
    // Reset fields
    setQuestionText('');
    setPoints(2);
    setExplanation('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setFillBlankAnswer('');
    setTrueFalseAnswer('True');
    setShortAnswerSample('');
    setMathFinalAnswer('');
    setImageUrl(undefined);
    setImageCaption(undefined);
    setImageAlt(undefined);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header with gradient badge */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs text-amber-300 flex items-center justify-center border border-white/30 shadow-xs shrink-0">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Add Custom Question</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30">
                  Custom Choice Editor
                </span>
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Create your own question and configure multiple choices with answer keys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Question Type Selection */}
          <div>
            <label className="block text-xs font-black bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent uppercase tracking-wider mb-2">
              1. Question Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUESTION_TYPES.map((t) => {
                const isSelected = type === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id);
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-600 text-indigo-950 shadow-xs ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="font-extrabold text-xs">{t.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight line-clamp-1">{t.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Question Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                2. Question Prompt
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Required</span>
            </div>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder={
                type === 'multiple_choice'
                  ? 'e.g. Which organelle is responsible for generating cellular ATP?'
                  : type === 'fill_blank'
                  ? 'e.g. The process by which plants convert sunlight into energy is called _____.'
                  : type === 'true_false'
                  ? 'e.g. Sound waves travel faster in water than through air.'
                  : 'Enter your question prompt here...'
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Optional Educational Diagram / Visual Identification */}
          <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Educational Diagram (Optional)</span>
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(undefined);
                    setImageCaption(undefined);
                    setImageAlt(undefined);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  Remove Diagram
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1 border border-slate-200">
                  <img src={imageUrl} alt="Diagram preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={imageCaption || ''}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="Figure caption or identification label (e.g. Figure 1: Digestive Tract)"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setIsImagePickerOpen(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Change Diagram...
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsImagePickerOpen(true)}
                className="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl text-xs font-bold text-indigo-700 flex items-center justify-center gap-2 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>+ Attach Free Diagram (Digestive System, Anatomy, Biology...)</span>
              </button>
            )}
          </div>

          {/* 3. Multiple Choice Options Editor (Core Request) */}
          {type === 'multiple_choice' && (
            <div className="space-y-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 sm:p-5 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black text-indigo-900 uppercase tracking-wider">
                    3. Answer Choices & Correct Answer
                  </label>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Type each option text and click the <strong className="text-emerald-700">radio button</strong> to mark the correct choice.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                  {options.length} Choices
                </span>
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = correctOptionIndex === idx;
                  const colorBadge = OPTION_COLORS[idx % OPTION_COLORS.length];

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 border-2 border-emerald-500 shadow-xs ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Radio button to select as correct answer */}
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIndex(idx)}
                        title={`Set Option ${letter} as the correct answer`}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs scale-105'
                            : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 border border-slate-300'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        )}
                      </button>

                      {/* Letter Badge */}
                      <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${colorBadge}`}>
                        {letter}
                      </span>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${letter} text...`}
                        className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
                      />

                      {/* Correct label badge */}
                      {isCorrect && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                          Correct Answer
                        </span>
                      )}

                      {/* Delete Option Button (if > 2) */}
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          title="Remove this choice"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Option Button */}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Another Choice ({String.fromCharCode(65 + options.length)})</span>
                </button>
              )}
            </div>
          )}

          {/* 4. Fill in the Blank Configuration */}
          {type === 'fill_blank' && (
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
              <label className="block text-xs font-black text-amber-900 uppercase tracking-wider">
                Correct Blank Answer
              </label>
              <input
                type="text"
                value={fillBlankAnswer}
                onChange={(e) => setFillBlankAnswer(e.target.value)}
                placeholder="e.g. Photosynthesis"
                className="w-full px-4 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-[11px] text-amber-800">
                Students will be expected to fill in this word or phrase. Make sure your question prompt above contains &ldquo;_____&rdquo;.
              </p>
            </div>
          )}

          {/* 5. True / False Configuration */}
          {type === 'true_false' && (
            <div className="space-y-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <label className="block text-xs font-black text-emerald-900 uppercase tracking-wider">
                Designate Correct Value
              </label>
              <div className="flex gap-4">
                {(['True', 'False'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTrueFalseAnswer(val)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                      trueFalseAnswer === val
                        ? val === 'True'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {trueFalseAnswer === val && <CheckCircle2 className="w-4 h-4" />}
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Short Answer Sample */}
          {type === 'short_answer' && (
            <div className="space-y-2 bg-fuchsia-50/50 p-4 rounded-2xl border border-fuchsia-200">
              <label className="block text-xs font-black text-fuchsia-900 uppercase tracking-wider">
                Sample / Model Answer (Teacher Key)
              </label>
              <textarea
                value={shortAnswerSample}
                onChange={(e) => setShortAnswerSample(e.target.value)}
                rows={2}
                placeholder="e.g. Mitochondria break down glucose into ATP through cellular respiration..."
                className="w-full px-4 py-2.5 bg-white border border-fuchsia-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
            </div>
          )}

          {/* 7. Math Problem Final Answer */}
          {type === 'math_problem' && (
            <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
              <label className="block text-xs font-black text-blue-900 uppercase tracking-wider">
                Final Numerical / Algebraic Answer
              </label>
              <input
                type="text"
                value={mathFinalAnswer}
                onChange={(e) => setMathFinalAnswer(e.target.value)}
                placeholder="e.g. x = 7, y = -3 or 42 cm²"
                className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          {/* Points & Explanation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Points Value
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPoints(pt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black border transition-all ${
                      points === pt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-14 px-2 py-1 text-xs text-center font-bold border border-slate-200 rounded-lg bg-white"
                  title="Custom Points"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Explanation / Solution Note</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="e.g. Mitochondria synthesize ATP via oxidative phosphorylation."
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-add-custom-question"
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add to Worksheet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={(img) => {
          setImageUrl(img.url);
          setImageCaption(img.caption);
          setImageAlt(img.alt);
        }}
        initialQuery={questionText}
        currentImageUrl={imageUrl}
        currentCaption={imageCaption}
      />
    </div>
  );
};
