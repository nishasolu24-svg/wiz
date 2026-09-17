export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'short_answer'
  | 'matching'
  | 'math_problem';

export type WorksheetCategory =
  | 'quiz'
  | 'practice'
  | 'mixed'
  | 'matching'
  | 'exit_ticket'
  | 'reading_comprehension';

export type DifficultyLevel =
  | 'beginner'
  | 'intermediate'
  | 'expert'
  | 'foundational'
  | 'standard'
  | 'advanced';

export type QuestionFormatOption = 'multiple_choice' | 'fill_blank' | 'both';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
  options?: string[]; // for multiple_choice
  correctAnswer?: string; // for multiple_choice, true_false, fill_blank
  matchingPairs?: MatchingPair[]; // for matching
  sampleAnswer?: string; // for short_answer
  finalAnswer?: string; // for math_problem
  stepByStepSolution?: string[]; // for math_problem
  wordBank?: string[]; // for fill_blank scaffolding
  explanation?: string;
  hint?: string;
  imageUrl?: string; // Direct URL for educational diagram or photo
  imageCaption?: string; // Caption, figure label, or question clue
  imageAlt?: string; // Accessibility text
}

export interface FreeImageResult {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  caption: string;
  license: string;
  source: string;
  category: string;
}

export interface UploadedBookInfo {
  fileName: string;
  fileSize?: number;
  pageCount: number;
  characterCount: number;
  wordCount: number;
  previewSnippet: string;
  fullText: string;
  suggestedTitle?: string;
  detectedChapters?: { id: string; title: string; pageNumber: number }[];
  selectedPageRange?: string; // e.g. "All", "1-5", "Chapter 3"
}

export interface WorksheetMetadata {
  id: string;
  userId?: string;
  title: string;
  subtitle?: string;
  subject: string;
  gradeLevel: string;
  category: WorksheetCategory;
  difficulty: DifficultyLevel;
  schoolName: string;
  teacherName: string;
  totalPoints: number;
  instructions: string;
  passage?: string; // Reading comprehension text
  wordBank?: string[]; // Helpful words for fill in the blank
  createdAt: string;
  versionLabel?: string; // "Version A", "Version B", "Standard", "Scaffolded"
  standardCode?: string; // e.g. "CCSS.MATH.CONTENT.5.NF.B.4" or "NGSS MS-LS1-6"
  sourceBook?: {
    title: string;
    fileName?: string;
    pageCount?: number;
    chapterOrPages?: string;
  };
}

export interface Worksheet extends WorksheetMetadata {
  questions: Question[];
}

export interface WorksheetGenerationRequest {
  topic: string;
  subject: string;
  gradeLevel: string;
  category: WorksheetCategory;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionFormat?: QuestionFormatOption; // 'multiple_choice' | 'fill_blank' | 'both'
  includeAnswerKey: boolean;
  includeExplanations: boolean;
  includeWordBank?: boolean;
  sourceText?: string; // Optional passage or teacher text to base questions on
  specialInstructions?: string; // e.g., "focus on real-world grocery store examples"
  standardsAlignment?: string; // e.g. "Common Core"
  schoolName?: string;
  teacherName?: string;
  includeImages?: boolean; // When true or when prompt requests diagrams/identification, include free educational diagrams
  bookData?: {
    fileName: string;
    bookTitle?: string;
    pageCount?: number;
    chapterOrSection?: string;
    selectedPages?: string;
    bookExcerpt?: string;
  };
}

export type UserTier = 'free' | 'pro' | 'school';

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  tier: UserTier;
  amount: number;
  currency: string;
  status: 'active' | 'canceled' | 'past_due';
  provider: 'stripe' | 'paypal' | 'system';
  currentPeriodEnd: string;
  createdAt: string;
}

export interface PricingPlan {
  id: string;
  tier: UserTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number; // monthly equivalent when paid annually
  annualBilledTotal: number;
  popular?: boolean;
  highlightColor: string;
  features: string[];
  limitations?: string[];
  buttonText: string;
}

export interface UserQuotaStatus {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  cooldownSecondsRemaining: number;
  cachedTopicsCount: number;
  hasCustomKey: boolean;
  serverFreeTierActive: boolean;
  resetTimeFormatted?: string;
  userTier: UserTier;
}

export interface TeacherProfile {
  id: string;
  uid?: string; // Firebase Auth UID if authenticated
  name: string;
  email: string;
  photoURL?: string;
  schoolName: string;
  gradeLevel: string;
  role?: 'teacher' | 'admin';
  isAdmin?: boolean;
  tier: UserTier;
  tierExpiresAt?: string | null;
  subscriptionId?: string | null;
  paymentProvider?: 'stripe' | 'paypal' | null;
  customApiKey?: string;
  isLoggedIn: boolean;
  isAnonymous?: boolean;
  dailyUsageCount: number;
  lastUsageDate: string;
}

export interface DifferentiateRequest {
  worksheet: Worksheet;
  mode: 'scramble_version_b' | 'simplify' | 'challenge' | 'add_hints' | 'translate_spanish';
}
