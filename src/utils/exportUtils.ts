import { Worksheet, Question } from '../types';

export function worksheetToMarkdown(worksheet: Worksheet, includeAnswers = false): string {
  let md = `# ${worksheet.title}\n`;
  if (worksheet.subtitle) md += `*${worksheet.subtitle}*\n\n`;
  
  md += `**School:** ${worksheet.schoolName || '_______________'} | **Teacher:** ${worksheet.teacherName || '_______________'}\n`;
  md += `**Name:** ___________________________ **Date:** ____________ **Period:** _____ **Score:** ___/${worksheet.totalPoints}\n\n`;
  
  if (worksheet.instructions) {
    md += `**Instructions:** ${worksheet.instructions}\n\n`;
  }

  if (worksheet.passage) {
    md += `### Reading Passage\n> ${worksheet.passage.split('\n').join('\n> ')}\n\n`;
  }

  if (worksheet.wordBank && worksheet.wordBank.length > 0) {
    md += `**Word Bank:** [ ${worksheet.wordBank.join('  |  ')} ]\n\n`;
  }

  md += `---\n\n### Questions\n\n`;

  worksheet.questions.forEach((q, idx) => {
    md += `**${idx + 1}. (${q.points} pt${q.points > 1 ? 's' : ''})** ${q.question}\n\n`;

    if (q.type === 'multiple_choice' && q.options) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      q.options.forEach((opt, optIdx) => {
        md += `   [ ] ${letters[optIdx]}. ${opt}\n`;
      });
      md += '\n';
    } else if (q.type === 'true_false') {
      md += `   [ ] True     [ ] False\n\n`;
    } else if (q.type === 'fill_blank') {
      md += `   Answer: _________________________________\n\n`;
    } else if (q.type === 'matching' && q.matchingPairs) {
      md += `   Match the following items:\n`;
      q.matchingPairs.forEach((pair) => {
        md += `   - [   ] ${pair.left}  ----->  ${pair.right}\n`;
      });
      md += '\n';
    } else if (q.type === 'short_answer' || q.type === 'math_problem') {
      md += `\n   ______________________________________________________________________\n\n`;
      md += `   ______________________________________________________________________\n\n`;
    }

    if (includeAnswers) {
      md += `   > **Answer:** ${q.correctAnswer || q.finalAnswer || q.sampleAnswer || 'See answer key'}\n`;
      if (q.explanation) {
        md += `   > **Explanation:** ${q.explanation}\n`;
      }
      if (q.stepByStepSolution && q.stepByStepSolution.length > 0) {
        md += `   > **Steps:**\n`;
        q.stepByStepSolution.forEach((step) => {
          md += `   > - ${step}\n`;
        });
      }
      md += '\n';
    }
  });

  if (includeAnswers) {
    md += `\n---\n### Complete Answer Key & Scoring Guide\n\n`;
    worksheet.questions.forEach((q, idx) => {
      md += `**Q${idx + 1}:** ${q.correctAnswer || q.finalAnswer || q.sampleAnswer || 'N/A'}\n`;
      if (q.explanation) md += `*Note:* ${q.explanation}\n\n`;
    });
  }

  return md;
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
