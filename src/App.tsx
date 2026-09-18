import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HomePromptWindow } from './components/HomePromptWindow';
import { WorksheetGeneratorModal } from './components/WorksheetGeneratorModal';
import { QuestionCard } from './components/QuestionCard';
import { WorksheetEditorToolbar } from './components/WorksheetEditorToolbar';
import { WorksheetHeaderEditor } from './components/WorksheetHeaderEditor';
import { InteractiveQuizView } from './components/InteractiveQuizView';
import { WorksheetPrintView } from './components/WorksheetPrintView';
import { PrintToolbar } from './components/PrintToolbar';
import { SavedWorksheetsModal } from './components/SavedWorksheetsModal';
import { ExportModal } from './components/ExportModal';
import { AddCustomQuestionModal } from './components/AddCustomQuestionModal';
import { FreeTierSettingsModal } from './components/FreeTierSettingsModal';
import { BookPdfUploadModal } from './components/BookPdfUploadModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { WebsiteUsageCounter } from './components/WebsiteUsageCounter';
import { UserWorksheetsDashboard } from './components/UserWorksheetsDashboard';
import { SAMPLE_WORKSHEETS } from './data/sampleWorksheets';
import { Worksheet, Question, WorksheetGenerationRequest, TeacherProfile } from './types';
import { authService } from './services/authService';
import { worksheetService, getUserStorageKey } from './services/worksheetService';
import { generateWorksheetFromClient, generateWorksheetWithClientGemini } from './services/clientWorksheetGenerator';
import { analyticsService } from './services/analyticsService';
import { safeFetchJson } from './utils/apiHelper';
import {
  Sparkles,
  Plus,
  BookOpen,
  CheckCircle2,
  Printer,
  FileQuestion,
  HelpCircle,
  Lightbulb,
  Check,
  Zap,
  ArrowLeft,
} from 'lucide-react';

export default function App() {
  // Teacher identity & auth
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => authService.getProfile());
  const [quotaRemaining, setQuotaRemaining] = useState<number | string>(() => authService.getRemainingDailyGenerations());

  // User storage key for strict per-user questionnaire isolation
  const currentUserKey = getUserStorageKey(teacherProfile);

  // Initialize saved worksheets for this specific user (empty by default)
  const [savedWorksheets, setSavedWorksheets] = useState<Worksheet[]>([]);

  // Current active worksheet (null on default homepage so NO questions & answers are displayed)
  const [currentWorksheet, setCurrentWorksheet] = useState<Worksheet | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'editor' | 'answer_key' | 'interactive' | 'print_preview'>('editor');
  const [printMode, setPrintMode] = useState<'student' | 'answer_key'>('student');
  const [fontSize, setFontSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif'>('sans');

  // Modals state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBookPdfModalOpen, setIsBookPdfModalOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCustomQuestionModalOpen, setIsCustomQuestionModalOpen] = useState(false);
  const [isFreeTierOpen, setIsFreeTierOpen] = useState(false);
  const [isFirstEntryPrompt, setIsFirstEntryPrompt] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);

  // Subscribe to auth & profile updates (syncs Firebase login & tier changes)
  useEffect(() => {
    const unsub = authService.onProfileChange((updated) => {
      setTeacherProfile(updated);
      const tier = authService.getUserTier();
      if (tier === 'pro' || tier === 'school' || authService.isAdmin() || (updated.customApiKey && updated.customApiKey.length > 5)) {
        setQuotaRemaining('Unlimited');
      } else {
        setQuotaRemaining(authService.getRemainingDailyGenerations());
      }
    });
    return unsub;
  }, []);

  // Check if user has entered the UI for the first time to ask for free tier
  useEffect(() => {
    const FIRST_VISIT_KEY = 'wizsheet_tier_preference_prompted';
    const alreadyPrompted = localStorage.getItem(FIRST_VISIT_KEY) || localStorage.getItem('mindspark_tier_preference_prompted');
    if (!alreadyPrompted) {
      setIsFirstEntryPrompt(true);
      setIsFreeTierOpen(true);
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    }
  }, []);

  // Loading / async states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDifferentiating, setIsDifferentiating] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSavedStatus, setIsSavedStatus] = useState(false);
  const [lastGeneratedAlert, setLastGeneratedAlert] = useState<string | null>(null);
  const [cacheHitNotice, setCacheHitNotice] = useState<string | null>(null);
  const questionnaireSectionRef = useRef<HTMLDivElement>(null);

  // Sync remaining quota on mount
  useEffect(() => {
    authService.fetchQuotaStatus().then((status) => {
      if (status) {
        setQuotaRemaining(teacherProfile.customApiKey ? 'Unlimited' : status.remainingToday);
      }
    });
  }, [teacherProfile.customApiKey]);

  // Load user's private worksheets from worksheetService on mount or when user changes
  useEffect(() => {
    let isMounted = true;
    worksheetService.getUserWorksheets(currentUserKey).then((list) => {
      if (isMounted) {
        setSavedWorksheets(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUserKey]);

  // If user switches account, clear currentWorksheet if it does not belong to them
  useEffect(() => {
    if (currentWorksheet && currentWorksheet.userId && currentWorksheet.userId !== currentUserKey) {
      setCurrentWorksheet(null);
    }
  }, [currentUserKey, currentWorksheet]);

  // Check if current worksheet is already saved
  useEffect(() => {
    const found = currentWorksheet ? savedWorksheets.some((w) => w.id === currentWorksheet.id) : false;
    setIsSavedStatus(found);
  }, [currentWorksheet, savedWorksheets]);

  // Handle generating a new worksheet with AI
  const handleGenerate = async (request: WorksheetGenerationRequest) => {
    if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setLastGeneratedAlert(null);
    setCacheHitNotice(null);

    try {
      const authHeaders = authService.getAuthHeaders();
      const enrichedRequest = {
        ...request,
        schoolName: request.schoolName || teacherProfile.schoolName,
        teacherName: request.teacherName || teacherProfile.name,
      };

      let resultWorksheet: Worksheet | null = null;
      let fromCache = false;
      let fallbackUsed = false;

      // Attempt server generation with safe JSON decoding
      const serverResp = await safeFetchJson<{
        worksheet?: Worksheet;
        fromCache?: boolean;
        fallbackUsed?: boolean;
        error?: string;
        requireAuth?: boolean;
        quotaExceeded?: boolean;
        cooldownSeconds?: number;
      }>('/api/generate-worksheet', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(enrichedRequest),
      });

      if (serverResp.isJson && serverResp.data) {
        if (serverResp.status === 401 && serverResp.data.requireAuth) {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
          setGenerationError(serverResp.data.error || 'Please sign in or register to generate questionnaires.');
          return;
        }

        if (serverResp.status === 429) {
          if (serverResp.data.quotaExceeded) {
            setGenerationError(
              serverResp.data.error ||
                'Daily free generation limit reached (5/5). Open Free Tier settings to add your own free key or explore cached library worksheets.'
            );
            setIsFreeTierOpen(true);
            return;
          }
          if (serverResp.data.cooldownSeconds) {
            setGenerationError(
              serverResp.data.error ||
                `Cooldown active. Please wait ${serverResp.data.cooldownSeconds}s before generating.`
            );
            return;
          }
        }

        if (serverResp.data.worksheet) {
          resultWorksheet = serverResp.data.worksheet;
          fromCache = !!serverResp.data.fromCache;
          fallbackUsed = !!serverResp.data.fallbackUsed;
        }
      }

      // If on static host (Cloudflare Pages) or server endpoint was unreachable, generate in browser
      if (!resultWorksheet) {
        // First check if user configured a client-side Gemini key for full AI generation
        try {
          resultWorksheet = await generateWorksheetWithClientGemini(enrichedRequest, teacherProfile);
        } catch (clientErr) {
          console.warn('Client Gemini generation skipped or failed:', clientErr);
        }

        // Seamless, high-fidelity local curriculum assessment engine
        if (!resultWorksheet) {
          console.info('Using client-side curriculum engine for instant assessment generation...');
          resultWorksheet = generateWorksheetFromClient(enrichedRequest, teacherProfile);
          fallbackUsed = true;
        }
      }

      if (resultWorksheet) {
        resultWorksheet.userId = currentUserKey;
        setCurrentWorksheet(resultWorksheet);
        worksheetService.saveUserWorksheet(resultWorksheet, currentUserKey);
        analyticsService.recordWorksheetCreated();
        setSavedWorksheets((prev) => [resultWorksheet!, ...prev.filter((w) => w.id !== resultWorksheet!.id)]);
        setIsGeneratorOpen(false);
        setIsBookPdfModalOpen(false);
        setViewMode('editor');

        if (fromCache) {
          setCacheHitNotice(
            `⚡ Instant 0-Cost Cache Hit: "${resultWorksheet.title}" loaded instantly without consuming your daily allowance!`
          );
          setTimeout(() => setCacheHitNotice(null), 6000);
        } else if (!teacherProfile.customApiKey) {
          authService.recordGenerationUsage();
          setQuotaRemaining(authService.getRemainingDailyGenerations());
        }

        setLastGeneratedAlert(
          resultWorksheet.sourceBook
            ? `📖 Successfully generated ${resultWorksheet.questions?.length || 0} questions grounded directly in "${resultWorksheet.sourceBook.title}"!`
            : fallbackUsed
            ? `Generated assessment for "${resultWorksheet.title}" with ${resultWorksheet.questions?.length || 0} questions & verified answer keys.`
            : `Generated questionnaire for "${resultWorksheet.title}" with ${resultWorksheet.questions?.length || 0} questions.`
        );

        // Smooth scroll to the built questionnaire
        setTimeout(() => {
          questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(err.message || 'Error occurred while generating worksheet. Please check your prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Differentiating worksheet (Version B, Scaffolding, Honors, Spanish)
  const handleDifferentiate = async (
    mode: 'scramble_version_b' | 'simplify' | 'challenge' | 'translate_spanish'
  ) => {
    if (!currentWorksheet) return;
    if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }
    setIsDifferentiating(true);
    try {
      const resp = await safeFetchJson<{ worksheet?: Worksheet; error?: string; requireAuth?: boolean }>(
        '/api/differentiate-worksheet',
        {
          method: 'POST',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify({
            worksheet: currentWorksheet,
            mode,
          }),
        }
      );

      if (resp.isJson && resp.data) {
        if (resp.status === 401 && resp.data.requireAuth) {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
          return;
        }
        if (resp.data.worksheet) {
          resp.data.worksheet.userId = currentUserKey;
          setCurrentWorksheet(resp.data.worksheet);
          worksheetService.saveUserWorksheet(resp.data.worksheet, currentUserKey);
          analyticsService.recordWorksheetCreated();
          setSavedWorksheets((prev) => [resp.data!.worksheet!, ...prev]);
          return;
        }
      }

      // Client-side differentiation fallback for static hosting (Cloudflare Pages)
      let adapted: Worksheet = { ...currentWorksheet };
      if (mode === 'scramble_version_b') {
        const shuffledQuestions = [...currentWorksheet.questions]
          .map((q) => ({
            ...q,
            options: q.options ? [...q.options].sort(() => 0.5 - Math.random()) : undefined,
          }))
          .sort(() => 0.5 - Math.random());

        adapted = {
          ...currentWorksheet,
          id: `ws-${Date.now()}-vb`,
          versionLabel: 'Version B (Scrambled)',
          subtitle: `${currentWorksheet.subtitle || ''} (Version B)`,
          questions: shuffledQuestions,
        };
      } else if (mode === 'simplify') {
        adapted = {
          ...currentWorksheet,
          id: `ws-${Date.now()}-simplified`,
          versionLabel: 'Guided / Scaffolding',
          instructions: `${currentWorksheet.instructions} • Review key vocabulary and hints provided.`,
          questions: currentWorksheet.questions.map((q) => ({
            ...q,
            hint: q.hint || `Look for clues in the key vocabulary related to ${currentWorksheet.subject}.`,
          })),
        };
      } else if (mode === 'challenge') {
        adapted = {
          ...currentWorksheet,
          id: `ws-${Date.now()}-honors`,
          versionLabel: 'Honors / Advanced',
          totalPoints: Math.round(currentWorksheet.totalPoints * 1.5),
          questions: currentWorksheet.questions.map((q) => ({
            ...q,
            points: (q.points || 2) + 1,
            question: `${q.question} (Explain the analytical reasoning behind your choice.)`,
          })),
        };
      } else if (mode === 'translate_spanish') {
        adapted = {
          ...currentWorksheet,
          id: `ws-${Date.now()}-es`,
          versionLabel: 'Versión en Español',
          instructions: 'Lea atentamente las preguntas a continuación y responda lo mejor que pueda.',
        };
      }

      adapted.userId = currentUserKey;
      setCurrentWorksheet(adapted);
      worksheetService.saveUserWorksheet(adapted, currentUserKey);
      analyticsService.recordWorksheetCreated();
      setSavedWorksheets((prev) => [adapted, ...prev]);
    } catch (err: any) {
      alert(`Could not adapt worksheet: ${err.message}`);
    } finally {
      setIsDifferentiating(false);
    }
  };

  // Add a new question to current worksheet
  const handleAddQuestion = async (withAi: boolean) => {
    if (!currentWorksheet) return;

    if (!withAi) {
      const newQ: Question = {
        id: `q-custom-${Date.now()}`,
        type: 'multiple_choice',
        question: 'Enter new question prompt here...',
        points: 2,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: 'Add teaching explanation here.',
      };
      updateQuestions([...currentWorksheet.questions, newQ]);
      return;
    }

    if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setIsAddingQuestion(true);
    try {
      const resp = await safeFetchJson<{ question?: Question; error?: string; requireAuth?: boolean }>(
        '/api/generate-single-question',
        {
          method: 'POST',
          headers: authService.getAuthHeaders(),
          body: JSON.stringify({
            topic: currentWorksheet.title,
            subject: currentWorksheet.subject,
            gradeLevel: currentWorksheet.gradeLevel,
            questionType: 'multiple_choice',
            currentQuestions: currentWorksheet.questions,
          }),
        }
      );

      if (resp.isJson && resp.data) {
        if (resp.status === 401 && resp.data.requireAuth) {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
          return;
        }
        if (resp.data.question) {
          updateQuestions([...currentWorksheet.questions, resp.data.question]);
          return;
        }
      }

      // Fallback manual question if API not accessible on static host
      const fallbackQ: Question = {
        id: `q-new-${Date.now()}`,
        type: 'multiple_choice',
        question: `Review Question on ${currentWorksheet.subject} (${currentWorksheet.title}): Explain or identify the main concept.`,
        points: 2,
        options: ['Primary Governing Mechanism', 'Secondary Auxiliary Factor', 'External Variable', 'Negligible Variance'],
        correctAnswer: 'Primary Governing Mechanism',
        explanation: `Curriculum standard review for ${currentWorksheet.gradeLevel} ${currentWorksheet.subject}.`,
        hint: `Think about the foundational concepts introduced in ${currentWorksheet.title}.`,
      };
      updateQuestions([...currentWorksheet.questions, fallbackQ]);
    } catch (err: any) {
      const fallbackQ: Question = {
        id: `q-new-${Date.now()}`,
        type: 'multiple_choice',
        question: `Review Question on ${currentWorksheet.subject}: Explain or identify the main concept.`,
        points: 2,
        options: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
        correctAnswer: 'Choice A',
        explanation: 'Teaching explanation for review question.',
      };
      updateQuestions([...currentWorksheet.questions, fallbackQ]);
    } finally {
      setIsAddingQuestion(false);
    }
  };

  // Add custom user-created question with custom choices
  const handleAddCustomQuestion = (newQ: Question) => {
    if (!currentWorksheet) {
      const newWs: Worksheet = {
        id: `ws-${Date.now()}`,
        userId: currentUserKey,
        title: 'Custom Questionnaire',
        subject: 'General',
        gradeLevel: teacherProfile.gradeLevel || 'Standard',
        category: 'practice',
        difficulty: 'intermediate',
        schoolName: teacherProfile.schoolName || '',
        teacherName: teacherProfile.name || '',
        totalPoints: newQ.points || 2,
        instructions: 'Read each question carefully and select or write the best answer.',
        createdAt: new Date().toISOString(),
        questions: [newQ],
      };
      setCurrentWorksheet(newWs);
      worksheetService.saveUserWorksheet(newWs, currentUserKey);
      setSavedWorksheets((prev) => [newWs, ...prev]);
    } else {
      updateQuestions([...currentWorksheet.questions, newQ]);
    }
    setLastGeneratedAlert(`Added custom question: "${newQ.question.slice(0, 45)}..."`);
    setTimeout(() => setLastGeneratedAlert(null), 4000);
  };

  // Update questions array and recalculate total points
  const updateQuestions = (newQuestions: Question[]) => {
    if (!currentWorksheet) return;
    const totalPts = newQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
    const updated = {
      ...currentWorksheet,
      questions: newQuestions,
      totalPoints: totalPts,
    };
    setCurrentWorksheet(updated);
    worksheetService.saveUserWorksheet(updated, currentUserKey);
    setSavedWorksheets((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  };

  // Update single question
  const handleUpdateQuestion = (updated: Question) => {
    if (!currentWorksheet) return;
    const newQuestions = currentWorksheet.questions.map((q) =>
      q.id === updated.id ? updated : q
    );
    updateQuestions(newQuestions);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    if (!currentWorksheet) return;
    if (currentWorksheet.questions.length <= 1) {
      alert('A worksheet must have at least one question.');
      return;
    }
    const newQuestions = currentWorksheet.questions.filter((q) => q.id !== id);
    updateQuestions(newQuestions);
  };

  // Move question up or down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!currentWorksheet) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentWorksheet.questions.length) return;

    const list = [...currentWorksheet.questions];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateQuestions(list);
  };

  // Save current worksheet to local library
  const handleSaveToLibrary = () => {
    if (!currentWorksheet) return;
    worksheetService.saveUserWorksheet(currentWorksheet, currentUserKey);
    setSavedWorksheets((prev) => {
      const exists = prev.some((w) => w.id === currentWorksheet.id);
      if (exists) {
        return prev.map((w) => (w.id === currentWorksheet.id ? currentWorksheet : w));
      }
      return [currentWorksheet, ...prev];
    });
    setIsSavedStatus(true);
    setLastGeneratedAlert(`Saved "${currentWorksheet.title}" to your private library.`);
    setTimeout(() => setLastGeneratedAlert(null), 3500);
  };

  // Delete a saved worksheet
  const handleDeleteSavedWorksheet = async (id: string) => {
    await worksheetService.deleteUserWorksheet(id, currentUserKey);
    setSavedWorksheets((prev) => prev.filter((w) => w.id !== id));
    if (currentWorksheet?.id === id) {
      setCurrentWorksheet(null);
    }
  };

  // Print handler
  const handlePrint = (mode: 'student' | 'answer_key' = 'student') => {
    if (!currentWorksheet) return;
    setPrintMode(mode);
    setViewMode('print_preview');
    setTimeout(() => {
      questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50/60 via-indigo-50/20 to-white text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top App Header */}
      <Header
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onPrint={() => handlePrint(viewMode === 'answer_key' ? 'answer_key' : 'student')}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenFreeTierSettings={() => setIsFreeTierOpen(true)}
        onOpenBookPdf={() => setIsBookPdfModalOpen(true)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'signin');
          setIsAuthModalOpen(true);
        }}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenAdmin={() => setIsAdminPortalOpen(true)}
        onNavigateHome={() => {
          setCurrentWorksheet(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={savedWorksheets.length}
        hasWorksheet={Boolean(currentWorksheet)}
        remainingQuota={
          authService.getUserTier() !== 'free' || teacherProfile.customApiKey
            ? 'Unlimited'
            : quotaRemaining
        }
        hasCustomKey={Boolean(teacherProfile.customApiKey && teacherProfile.customApiKey.length > 5)}
        teacherName={teacherProfile.name}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Instant Cache Hit Notification */}
        {cacheHitNotice && (
          <div className="no-print p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-sm flex items-center justify-between shadow-lg shadow-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2.5 font-bold">
              <Zap className="w-5 h-5 fill-current text-yellow-300 animate-bounce" />
              <span>{cacheHitNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setCacheHitNotice(null)}
              className="text-white/80 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-black/10 hover:bg-black/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Home Prompt Window for submitting topic to LLM */}
        <HomePromptWindow
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          error={generationError}
          currentTopic={currentWorksheet?.title}
          onTakeTestOnline={() => {
            setViewMode('interactive');
            setTimeout(() => {
              questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }}
          onOpenCustomQuestion={() => {
            if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
              setAuthModalMode('signin');
              setIsAuthModalOpen(true);
              return;
            }
            setIsCustomQuestionModalOpen(true);
          }}
          onOpenBookPdfModal={() => {
            if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
              setAuthModalMode('signin');
              setIsAuthModalOpen(true);
              return;
            }
            setIsBookPdfModalOpen(true);
          }}
          hasCurrentWorksheet={Boolean(currentWorksheet)}
          isLoggedIn={Boolean(teacherProfile.isLoggedIn || authService.isSignedIn())}
          onOpenAuth={(mode = 'signin') => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
        />

        {/* Dynamic Success Notification when LLM builds new Questionnaire */}
        {lastGeneratedAlert && (
          <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>{lastGeneratedAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastGeneratedAlert(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Questionnaire Section Anchor */}
        <div ref={questionnaireSectionRef} />

        {/* If no current worksheet active: show clean UserWorksheetsDashboard (no questions/answers displayed) */}
        {!currentWorksheet ? (
          <UserWorksheetsDashboard
            worksheets={savedWorksheets}
            userDisplayName={teacherProfile.name || teacherProfile.email || 'Teacher'}
            onOpenWorksheet={(ws) => {
              setCurrentWorksheet(ws);
              setViewMode('editor');
              setTimeout(() => {
                questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
            onTakeQuiz={(ws) => {
              setCurrentWorksheet(ws);
              setViewMode('interactive');
              setTimeout(() => {
                questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
            onPrintWorksheet={(ws) => {
              setCurrentWorksheet(ws);
              setPrintMode('student');
              setViewMode('print_preview');
              setTimeout(() => {
                questionnaireSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
            onDeleteWorksheet={handleDeleteSavedWorksheet}
            onFocusPrompt={() => {
              const input = document.getElementById('input-questionnaire-topic');
              input?.focus();
              input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onOpenBookPdf={() => {
              if (!teacherProfile.isLoggedIn && !authService.isSignedIn()) {
                setAuthModalMode('signin');
                setIsAuthModalOpen(true);
                return;
              }
              setIsBookPdfModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Active Questionnaire Top Banner with Return to Home */}
            <div className="no-print bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentWorksheet(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  id="btn-back-to-home"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  title="Close questionnaire and return to dashboard"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Library</span>
                </button>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-md">
                    {currentWorksheet.title}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline-block">
                    Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentWorksheet(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                      document.getElementById('input-questionnaire-topic')?.focus();
                    }, 150);
                  }}
                  id="btn-create-new-questionnaire-bar"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Questionnaire</span>
                </button>
              </div>
            </div>

            {/* Workspace Toolbar */}
            <WorksheetEditorToolbar
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              onDifferentiate={handleDifferentiate}
              isDifferentiating={isDifferentiating}
              onAddQuestion={handleAddQuestion}
              onOpenCustomQuestionModal={() => setIsCustomQuestionModalOpen(true)}
              isAddingQuestion={isAddingQuestion}
              onSaveWorksheet={handleSaveToLibrary}
              isSaved={isSavedStatus}
              fontSize={fontSize}
              onChangeFontSize={setFontSize}
              fontStyle={fontStyle}
              onChangeFontStyle={setFontStyle}
              onPrint={() => handlePrint(viewMode === 'answer_key' ? 'answer_key' : 'student')}
            />

            {/* View Mode Switching */}
            {viewMode === 'interactive' ? (
              /* Interactive Quiz Mode (In-Browser Assessment) */
              <InteractiveQuizView
                worksheet={currentWorksheet}
                onExit={() => setViewMode('editor')}
              />
            ) : viewMode === 'print_preview' ? (
              /* Exact Printable Page Preview */
              <div className="space-y-4">
                <PrintToolbar
                  worksheet={currentWorksheet}
                  mode={printMode}
                  onChangeMode={setPrintMode}
                  fontSize={fontSize}
                  onChangeFontSize={setFontSize}
                  fontStyle={fontStyle}
                  onChangeFontStyle={setFontStyle}
                  onExit={() => setViewMode('editor')}
                />
                <WorksheetPrintView
                  worksheet={currentWorksheet}
                  mode={printMode}
                  fontSize={fontSize}
                  fontStyle={fontStyle}
                />
              </div>
            ) : (
              /* Standard Editor / Answer Key View */
              <div className="space-y-6">
                {/* Header / Meta Card */}
                <WorksheetHeaderEditor
                  worksheet={currentWorksheet}
                  onUpdateHeader={(fields) =>
                    setCurrentWorksheet((prev) => (prev ? { ...prev, ...fields } : null))
                  }
                />

                {/* Questions Container */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                    <span>
                      {currentWorksheet.questions.length} Questions ({currentWorksheet.totalPoints} Total Points)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click the pencil icon on any question to edit text or answers
                    </span>
                  </div>

                  {currentWorksheet.questions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={idx}
                      totalQuestions={currentWorksheet.questions.length}
                      showAnswers={viewMode === 'answer_key'}
                      onUpdate={handleUpdateQuestion}
                      onDelete={handleDeleteQuestion}
                      onMoveUp={idx > 0 ? () => handleMoveQuestion(idx, 'up') : undefined}
                      onMoveDown={
                        idx < currentWorksheet.questions.length - 1
                          ? () => handleMoveQuestion(idx, 'down')
                          : undefined
                      }
                    />
                  ))}

                  {/* Bottom Add Question Buttons */}
                  <div className="no-print pt-3 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      id="btn-add-custom-question-bottom"
                      onClick={() => setIsCustomQuestionModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Question</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddQuestion(true)}
                      disabled={isAddingQuestion}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isAddingQuestion ? 'Generating...' : 'AI Add Question'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Custom Question Modal */}
      <AddCustomQuestionModal
        isOpen={isCustomQuestionModalOpen}
        onClose={() => setIsCustomQuestionModalOpen(false)}
        onAddQuestion={handleAddCustomQuestion}
      />

      {/* Generator Modal */}
      <WorksheetGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        error={generationError}
        onOpenBookPdfModal={() => {
          setIsGeneratorOpen(false);
          setIsBookPdfModalOpen(true);
        }}
      />

      {/* Upload Book PDF & Ask Questions Modal */}
      <BookPdfUploadModal
        isOpen={isBookPdfModalOpen}
        onClose={() => setIsBookPdfModalOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {/* Saved Worksheets Modal */}
      <SavedWorksheetsModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedList={savedWorksheets}
        onSelectWorksheet={(ws) => {
          setCurrentWorksheet(ws);
          setIsSavedOpen(false);
          setViewMode('editor');
        }}
        onDeleteWorksheet={handleDeleteSavedWorksheet}
        onImportWorksheet={(ws) => {
          const stamped = { ...ws, userId: currentUserKey };
          worksheetService.saveUserWorksheet(stamped, currentUserKey);
          setSavedWorksheets((prev) => [stamped, ...prev.filter((w) => w.id !== stamped.id)]);
          setCurrentWorksheet(stamped);
          setViewMode('editor');
        }}
      />

      {/* Export / Print Options Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        worksheet={currentWorksheet}
        onPrint={handlePrint}
      />

      {/* Free Tier Settings & Quota Modal */}
      <FreeTierSettingsModal
        isOpen={isFreeTierOpen}
        onClose={() => {
          setIsFreeTierOpen(false);
          setIsFirstEntryPrompt(false);
        }}
        isFirstEntryPrompt={isFirstEntryPrompt}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'signin');
          setIsAuthModalOpen(true);
        }}
        onProfileUpdated={(updated) => {
          setTeacherProfile(updated);
          setQuotaRemaining(authService.getRemainingDailyGenerations());
        }}
      />

      {/* User Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(profile) => {
          setTeacherProfile(profile);
          const tier = authService.getUserTier();
          if (tier === 'pro' || tier === 'school') {
            setQuotaRemaining('Unlimited');
          }
        }}
      />

      {/* Pricing, Tier Classification & Payment Gateway Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onTierChanged={(newTier) => {
          const updated = authService.getProfile();
          setTeacherProfile(updated);
          if (newTier === 'pro' || newTier === 'school' || authService.isAdmin()) {
            setQuotaRemaining('Unlimited');
          } else {
            setQuotaRemaining(authService.getRemainingDailyGenerations());
          }
        }}
      />

      {/* Admin Management Portal for Master Administrators */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        onProfileUpdated={(updated) => {
          setTeacherProfile(updated);
          if (authService.isAdmin() || authService.getUserTier() !== 'free') {
            setQuotaRemaining('Unlimited');
          } else {
            setQuotaRemaining(authService.getRemainingDailyGenerations());
          }
        }}
      />

      {/* Sleek Interface Status Footer */}
      <footer className="no-print mt-auto py-2 bg-white border-t border-slate-200 flex flex-wrap items-center px-4 sm:px-6 justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">AI Worksheet Engine</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-400 font-medium">{currentWorksheet?.subject} • {currentWorksheet?.gradeLevel}</span>
          </div>
          {authService.isAdmin() && <WebsiteUsageCounter />}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{currentWorksheet?.questions.length || 0} Questions</span>
          <span className="text-slate-300">•</span>
          <span>{currentWorksheet?.totalPoints || 0} Total Points</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-semibold">{isSavedStatus ? 'Autosaved' : 'Draft'}</span>
        </div>
      </footer>
    </div>
  );
}
