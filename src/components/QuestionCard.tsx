import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Circle,
  Lightbulb,
  Plus,
  Image as ImageIcon,
  ZoomIn,
  ShieldCheck,
} from 'lucide-react';
import { Question, QuestionType } from '../types';
import { ImagePickerModal } from './ImagePickerModal';

interface QuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  showAnswers: boolean;
  onUpdate: (updated: Question) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRegenerate?: (id: string) => void;
  isRegenerating?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  showAnswers,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRegenerate,
  isRegenerating,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(question.question);
  const [editedPoints, setEditedPoints] = useState(question.points);
  const [editedAnswer, setEditedAnswer] = useState(question.correctAnswer || question.finalAnswer || '');
  const [editedExplanation, setEditedExplanation] = useState(question.explanation || '');
  const [editedOptions, setEditedOptions] = useState<string[]>(
    question.options ? [...question.options] : ['Option A', 'Option B', 'Option C', 'Option D']
  );
  const [editedImageUrl, setEditedImageUrl] = useState<string | undefined>(question.imageUrl);
  const [editedImageCaption, setEditedImageCaption] = useState<string | undefined>(question.imageCaption);
  const [showHint, setShowHint] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleSaveEdit = () => {
    const updated: Question = {
      ...question,
      question: editedText.trim(),
      points: Math.max(1, Number(editedPoints) || 1),
      explanation: editedExplanation.trim() || undefined,
      imageUrl: editedImageUrl?.trim() || undefined,
      imageCaption: editedImageCaption?.trim() || undefined,
    };

    if (question.type === 'multiple_choice') {
      const cleanOpts = editedOptions.map((o) => o.trim()).filter(Boolean);
      updated.options = cleanOpts.length >= 2 ? cleanOpts : (question.options || ['Option A', 'Option B', 'Option C', 'Option D']);
      if (editedAnswer && cleanOpts.includes(editedAnswer.trim())) {
        updated.correctAnswer = editedAnswer.trim();
      } else if (cleanOpts.length > 0) {
        updated.correctAnswer = cleanOpts[0];
      }
    } else {
      if (question.correctAnswer !== undefined) {
        updated.correctAnswer = editedAnswer.trim();
      }
      if (question.finalAnswer !== undefined) {
        updated.finalAnswer = editedAnswer.trim();
      }
    }

    onUpdate(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(question.question);
    setEditedPoints(question.points);
    setEditedAnswer(question.correctAnswer || question.finalAnswer || '');
    setEditedExplanation(question.explanation || '');
    setEditedOptions(question.options ? [...question.options] : ['Option A', 'Option B', 'Option C', 'Option D']);
    setEditedImageUrl(question.imageUrl);
    setEditedImageCaption(question.imageCaption);
    setIsEditing(false);
  };

  const handleAttachImage = (imageData: { url: string; caption?: string; alt?: string }) => {
    if (isEditing) {
      setEditedImageUrl(imageData.url);
      setEditedImageCaption(imageData.caption);
    } else {
      onUpdate({
        ...question,
        imageUrl: imageData.url,
        imageCaption: imageData.caption,
        imageAlt: imageData.alt,
      });
    }
  };

  const handleRemoveImage = () => {
    if (isEditing) {
      setEditedImageUrl(undefined);
      setEditedImageCaption(undefined);
    } else {
      const copy = { ...question };
      delete copy.imageUrl;
      delete copy.imageCaption;
      delete copy.imageAlt;
      onUpdate(copy);
    }
  };

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Multiple Choice
          </span>
        );
      case 'true_false':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            True / False
          </span>
        );
      case 'fill_blank':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            Fill in Blank
          </span>
        );
      case 'short_answer':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Short Answer
          </span>
        );
      case 'matching':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Matching
          </span>
        );
      case 'math_problem':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Step-by-Step Problem
          </span>
        );
    }
  };

  return (
    <div
      className={`question-item rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
        showAnswers
          ? 'bg-white border-emerald-200'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Question Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
              {index + 1}
            </span>
            {getTypeBadge(question.type)}
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {question.points} {question.points === 1 ? 'pt' : 'pts'}
            </span>
          </div>

          {/* Teacher Controls (Reorder, Edit, Regenerate, Delete) */}
          <div className="no-print flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsImagePickerOpen(true)}
              title={question.imageUrl ? "Change / edit diagram" : "Attach free diagram to question"}
              className={`p-1 rounded transition-colors ${
                question.imageUrl
                  ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 font-bold'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                title="Move question up"
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === totalQuestions - 1}
                title="Move question down"
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(question.id)}
                disabled={isRegenerating}
                title="Regenerate single question with AI"
                className="p-1 rounded text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit question details"
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(question.id)}
              title="Delete question"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Question Content / Edit Mode */}
        {isEditing ? (
          <div className="space-y-3 pt-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question Prompt</label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
              />
            </div>

            {/* Attached Diagram in Edit Mode */}
            <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Educational Diagram / Visual</span>
                </span>
                {editedImageUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Remove Diagram
                  </button>
                ) : null}
              </div>
              {editedImageUrl ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img src={editedImageUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={editedImageCaption || ''}
                      onChange={(e) => setEditedImageCaption(e.target.value)}
                      placeholder="Figure caption / label..."
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Change Diagram...
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsImagePickerOpen(true)}
                  className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Free Non-Copyright Diagram</span>
                </button>
              )}
            </div>
            {/* Multiple Choice Options Editor */}
            {question.type === 'multiple_choice' && (
              <div className="space-y-2 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Choices & Answer Key
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Click the circle to designate correct answer
                  </span>
                </div>
                <div className="space-y-2">
                  {editedOptions.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isCorrect = editedAnswer.trim() === opt.trim() && opt.trim().length > 0;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setEditedAnswer(opt)}
                          title={`Mark ${letter} as correct answer`}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border border-slate-300'
                          }`}
                        >
                          {isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                        </button>
                        <span className="w-5 h-5 rounded font-black text-xs bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newOpts = [...editedOptions];
                            const oldVal = newOpts[optIdx];
                            newOpts[optIdx] = val;
                            setEditedOptions(newOpts);
                            if (editedAnswer === oldVal) {
                              setEditedAnswer(val);
                            }
                          }}
                          placeholder={`Option ${letter}...`}
                          className="flex-1 bg-transparent px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
                        />
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Correct
                          </span>
                        )}
                        {editedOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = editedOptions.filter((_, i) => i !== optIdx);
                              setEditedOptions(newOpts);
                              if (editedAnswer === opt && newOpts.length > 0) {
                                setEditedAnswer(newOpts[0]);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {editedOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setEditedOptions([...editedOptions, ''])}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add Choice ({String.fromCharCode(65 + editedOptions.length)})</span>
                  </button>
                )}
              </div>
            )}

            {/* True / False Quick Selector */}
            {question.type === 'true_false' && (
              <div className="space-y-1.5 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Correct Answer
                </label>
                <div className="flex gap-3">
                  {(['True', 'False'] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditedAnswer(val)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                        editedAnswer.toLowerCase() === val.toLowerCase()
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editedPoints}
                  onChange={(e) => setEditedPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                />
              </div>
              {question.type !== 'multiple_choice' && question.type !== 'true_false' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</label>
                  <input
                    type="text"
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Explanation / Solution Note</label>
              <input
                type="text"
                value={editedExplanation}
                onChange={(e) => setEditedExplanation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-200 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
            {question.question}
          </div>
        )}

        {/* Attached Diagram / Image for Identification Questions */}
        {question.imageUrl && !isEditing && (
          <div className="my-3 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3.5 shadow-2xs">
            <div className="relative group max-h-72 flex flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-50/80">
              <img
                src={question.imageUrl}
                alt={question.imageAlt || question.imageCaption || 'Educational diagram'}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="max-h-64 w-auto object-contain rounded-md transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                title="Inspect diagram up close"
                className="no-print absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 shadow-md backdrop-blur-xs transition-opacity"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom Diagram</span>
              </button>
            </div>

            {/* Caption & Non-Copyright Badge */}
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <p className="font-semibold text-slate-700 italic">
                {question.imageCaption || 'Figure: Educational identification diagram'}
              </p>
              <span className="no-print shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Free / Educational</span>
              </span>
            </div>
          </div>
        )}

        {/* Student View Options by Type */}
        <div className="mt-3.5 space-y-2">
          {/* Multiple Choice Options */}
          {question.type === 'multiple_choice' && question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options.map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isCorrect = showAnswers && opt.trim() === question.correctAnswer?.trim();
                const optionColors = [
                  'bg-blue-100 text-blue-700 border-blue-200',
                  'bg-purple-100 text-purple-700 border-purple-200',
                  'bg-amber-100 text-amber-800 border-amber-200',
                  'bg-emerald-100 text-emerald-800 border-emerald-200',
                ];
                const badgeColor = optionColors[optIdx % optionColors.length];

                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border transition-all ${
                      isCorrect
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : badgeColor
                      }`}
                    >
                      {isCorrect ? '✓' : letter}
                    </div>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* True / False Options */}
          {question.type === 'true_false' && (
            <div className="flex items-center gap-3">
              {['True', 'False'].map((tf) => {
                const isCorrect = showAnswers && tf.toLowerCase() === question.correctAnswer?.toLowerCase();
                const isTrue = tf === 'True';
                return (
                  <div
                    key={tf}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isCorrect
                        ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200'
                        : isTrue
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60'
                        : 'border-rose-200 bg-rose-50/50 text-rose-800 hover:bg-rose-100/60'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isCorrect
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isTrue
                          ? 'border-emerald-500 bg-white'
                          : 'border-rose-500 bg-white'
                      }`}
                    >
                      {isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span>{tf}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fill in the blank student space */}
          {question.type === 'fill_blank' && (
            <div className="pt-1">
              {!showAnswers ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Answer:</span>
                  <div className="border-b border-dashed border-slate-300 w-48 h-5" />
                </div>
              ) : null}
            </div>
          )}

          {/* Matching Pairs */}
          {question.type === 'matching' && question.matchingPairs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Item / Term</div>
                {question.matchingPairs.map((pair, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 text-xs bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                      {pIdx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{pair.left}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Definition / Match</div>
                {question.matchingPairs.map((pair, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 text-xs bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2"
                  >
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                      {String.fromCharCode(65 + pIdx)}
                    </span>
                    <span className="text-slate-700">{pair.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short Answer / Handwritten Response Ruled Lines (for Student Handout) */}
          {(question.type === 'short_answer' || question.type === 'math_problem') && !showAnswers && (
            <div className="space-y-3 pt-2">
              <div className="answer-ruled-line" />
              <div className="answer-ruled-line" />
              <div className="answer-ruled-line" />
            </div>
          )}

          {/* Teacher Answer Key Revealed Mode */}
          {showAnswers && (
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 text-xs space-y-2 animate-fadeIn shadow-2xs">
              <div className="flex items-center gap-2 font-black text-emerald-950">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs uppercase tracking-wide">Answer Key:</span>
                <span className="font-bold text-emerald-950 font-mono bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                  {question.correctAnswer || question.finalAnswer || question.sampleAnswer || 'See solution guide'}
                </span>
              </div>

              {question.stepByStepSolution && question.stepByStepSolution.length > 0 && (
                <div className="mt-2 text-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-900 block">Step-by-step Solution:</span>
                  {question.stepByStepSolution.map((step, sIdx) => (
                    <div key={sIdx} className="text-xs pl-2 border-l-2 border-emerald-300 text-slate-700">
                      {step}
                    </div>
                  ))}
                </div>
              )}

              {question.explanation && (
                <p className="text-slate-700 pt-1 leading-relaxed">
                  <span className="font-semibold text-slate-900">Teaching Note: </span>
                  {question.explanation}
                </p>
              )}
            </div>
          )}

          {/* Optional Hint Toggle for Scaffolding */}
          {question.hint && !showAnswers && (
            <div className="no-print pt-1">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>{showHint ? 'Hide Hint' : 'Show Student Hint'}</span>
              </button>
              {showHint && (
                <p className="mt-1 text-xs text-amber-900 bg-amber-50/80 p-2 rounded border border-amber-200">
                  {question.hint}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isLightboxOpen && question.imageUrl && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="no-print fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-3 shadow-2xl flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={question.imageUrl}
              alt={question.imageCaption || 'Zoomed diagram'}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg"
            />
            {question.imageCaption && (
              <p className="mt-2 text-xs font-bold text-slate-700 text-center px-4">
                {question.imageCaption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleAttachImage}
        initialQuery={question.question}
        currentImageUrl={isEditing ? editedImageUrl : question.imageUrl}
        currentCaption={isEditing ? editedImageCaption : question.imageCaption}
      />
    </div>
  );
};
