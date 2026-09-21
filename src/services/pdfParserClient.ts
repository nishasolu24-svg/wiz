import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for browser runtime across all environments (Vite and Cloudflare Pages)
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfData {
  fileName: string;
  fileSize: number;
  pageCount: number;
  characterCount: number;
  wordCount: number;
  previewSnippet: string;
  fullText: string;
  suggestedTitle: string;
  isLikelyQuestionPaper?: boolean;
  detectedQuestionCount?: number;
  detectedChapters: Array<{
    title: string;
    startPage: number;
    preview: string;
  }>;
}

export async function parsePdfInBrowser(file: File): Promise<ExtractedPdfData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: true,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageString = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pageTexts.push(pageString);
  }

  const fullText = pageTexts.join('\n\n');
  const cleanWords = fullText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = cleanWords.length;
  const characterCount = fullText.length;
  const previewSnippet = fullText.slice(0, 1200);

  // Suggest title from first few lines or file name
  const firstLines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 3 && l.length < 80);
  const suggestedTitle = firstLines[0] || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  // Chapter detection heuristic
  const detectedChapters: Array<{ title: string; startPage: number; preview: string }> = [];
  const chapterRegex = /(?:chapter|unit|section|lesson|module|part)\s+([0-9ivxlcdm]+|[a-z]+)[:.\s-]*([^\n]{0,60})/i;

  pageTexts.forEach((text, idx) => {
    const match = text.match(chapterRegex);
    if (match) {
      const title = match[0].trim().slice(0, 60);
      if (!detectedChapters.some(c => c.title.toLowerCase() === title.toLowerCase())) {
        detectedChapters.push({
          title,
          startPage: idx + 1,
          preview: text.slice(0, 200),
        });
      }
    }
  });

  // Question paper detection heuristics
  const questionPattern = /(?:(?:question|q\.?|que\.?)\s*\d+|(?:^|\n)\s*\d+[\.\)]\s+[A-Z])/gi;
  const questionMatches = fullText.match(questionPattern) || [];
  const hasExamKeywords = /(?:question\s*paper|examination|midterm|final\s*exam|total\s*marks|maximum\s*marks|time\s*allowed|section\s*[a-d]|instructions?\s*:|answer\s*all|choose\s*the\s*correct)/i.test(fullText);
  const isLikelyQuestionPaper = (questionMatches.length >= 3) || (hasExamKeywords && questionMatches.length >= 1) || /(?:test\s*paper|quiz|assessment\s*paper|exam)/i.test(file.name);
  const detectedQuestionCount = Math.max(questionMatches.length, isLikelyQuestionPaper ? 5 : 0);

  return {
    fileName: file.name,
    fileSize: file.size,
    pageCount: numPages,
    characterCount,
    wordCount,
    previewSnippet,
    fullText,
    suggestedTitle,
    isLikelyQuestionPaper,
    detectedQuestionCount: detectedQuestionCount > 0 ? detectedQuestionCount : undefined,
    detectedChapters,
  };
}
