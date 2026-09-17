import { Worksheet } from '../types';

export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

/**
 * Generates standalone, pixel-perfect printable HTML for a worksheet
 */
export const generateWorksheetHtml = (
  worksheet: Worksheet,
  mode: 'student' | 'answer_key' = 'student',
  fontSize: 'compact' | 'standard' | 'large' = 'standard',
  fontStyle: 'sans' | 'serif' = 'sans'
): string => {
  const isAnswerKey = mode === 'answer_key';
  const refCode = `REF: WS-${(worksheet.gradeLevel || 'GEN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase()}-${(worksheet.subject || 'SUB').slice(0, 3).toUpperCase()}-${(worksheet.id || '0000').slice(-4).toUpperCase()}${worksheet.versionLabel ? `-${worksheet.versionLabel}` : ''}`;

  const fontFam =
    fontStyle === 'serif'
      ? 'Georgia, Cambria, "Times New Roman", Times, serif'
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const baseFontSize =
    fontSize === 'compact' ? '12px' : fontSize === 'large' ? '16px' : '14px';

  const questionsHtml = worksheet.questions
    .map((q, idx) => {
      let contentHtml = '';

      // Diagram / Image
      if (q.imageUrl) {
        contentHtml += `
          <div style="margin: 10px 0 10px 16px; text-align: center;">
            <div style="display: inline-block; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; background: #ffffff;">
              <img src="${q.imageUrl}" alt="${q.imageAlt || 'Diagram'}" style="max-height: 180px; max-width: 100%; object-fit: contain; border-radius: 4px;" />
              ${q.imageCaption ? `<div style="font-size: 11px; font-style: italic; color: #475569; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 3px;">${q.imageCaption}</div>` : ''}
            </div>
          </div>
        `;
      }

      // Multiple Choice
      if (q.type === 'multiple_choice' && q.options) {
        contentHtml += `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; margin: 8px 0 6px 16px;">
            ${q.options
              .map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isCorrect = isAnswerKey && opt.trim() === q.correctAnswer?.trim();
                return `
                  <div style="display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 4px; ${isCorrect ? 'background-color: #ecfdf5; border: 1px solid #10b981; font-weight: 600; color: #064e3b;' : 'color: #334155;'}">
                    <div style="width: 16px; height: 16px; border: 1px solid ${isCorrect ? '#059669' : '#94a3b8'}; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; background: ${isCorrect ? '#059669' : '#ffffff'}; color: #ffffff;">
                      ${isCorrect ? '✓' : ''}
                    </div>
                    <span><strong>${letter})</strong> ${opt}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }

      // True / False
      if (q.type === 'true_false') {
        contentHtml += `
          <div style="display: flex; align-items: center; gap: 24px; margin: 8px 0 6px 16px; font-size: 13px;">
            ${['True', 'False']
              .map((tf) => {
                const isCorrect = isAnswerKey && tf.toLowerCase() === q.correctAnswer?.toLowerCase();
                return `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 16px; height: 16px; border: 1px solid ${isCorrect ? '#059669' : '#94a3b8'}; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; background: ${isCorrect ? '#059669' : '#ffffff'}; color: #ffffff;">
                      ${isCorrect ? '✓' : ''}
                    </div>
                    <span style="${isCorrect ? 'font-weight: bold; color: #064e3b; text-decoration: underline;' : 'color: #334155;'}">${tf}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }

      // Fill in blank
      if (q.type === 'fill_blank') {
        contentHtml += `
          <div style="margin: 8px 0 6px 16px; font-size: 13px;">
            ${
              isAnswerKey
                ? `<div style="font-weight: bold; color: #065f46;">Answer: <span style="text-decoration: underline; color: #047857;">${q.correctAnswer || ''}</span></div>`
                : `<div style="display: flex; align-items: baseline; gap: 8px; color: #334155;"><span>Answer:</span><div style="border-bottom: 1.5px solid #94a3b8; width: 220px; height: 16px; display: inline-block;"></div></div>`
            }
          </div>
        `;
      }

      // Matching
      if (q.type === 'matching' && q.matchingPairs) {
        contentHtml += `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px 0 6px 16px; font-size: 13px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${q.matchingPairs
                .map(
                  (pair, pIdx) => `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="width: 32px; border-bottom: 1.5px solid #94a3b8; text-align: center; font-weight: bold; font-size: 12px; color: #0f172a;">
                    ${isAnswerKey ? String.fromCharCode(65 + pIdx) : ''}
                  </span>
                  <span>${pIdx + 1}. ${pair.left}</span>
                </div>
              `
                )
                .join('')}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${q.matchingPairs
                .map(
                  (pair, pIdx) => `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: #0f172a;">${String.fromCharCode(65 + pIdx)}.</strong>
                  <span>${pair.right}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      }

      // Short Answer / Math Problem Writing Space
      if ((q.type === 'short_answer' || q.type === 'math_problem') && !isAnswerKey) {
        contentHtml += `
          <div style="margin: 10px 0 6px 16px;">
            <div style="border-bottom: 1px dashed #cbd5e1; height: 26px; width: 100%;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 26px; width: 100%;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 26px; width: 100%;"></div>
          </div>
        `;
      }

      // Teacher Answer Key details
      if (isAnswerKey) {
        contentHtml += `
          <div style="margin: 8px 0 4px 16px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #334155;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #0f172a;">
              <span style="color: #059669;">✓ Key:</span>
              <span style="background: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; color: #065f46; font-family: monospace;">
                ${q.correctAnswer || q.finalAnswer || q.sampleAnswer || 'See solution'}
              </span>
            </div>
            ${
              q.stepByStepSolution && q.stepByStepSolution.length > 0
                ? `<div style="margin-top: 6px; padding-left: 14px; font-size: 11px; color: #475569;">
                    ${q.stepByStepSolution.map((s) => `<div>• ${s}</div>`).join('')}
                   </div>`
                : ''
            }
            ${q.explanation ? `<div style="margin-top: 4px; padding-left: 14px; font-size: 11px; color: #64748b; font-style: italic;">Note: ${q.explanation}</div>` : ''}
          </div>
        `;
      }

      return `
        <div class="question-card" style="margin-bottom: 22px; page-break-inside: avoid; break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 1.05em; line-height: 1.35;">
              <span>${idx + 1}. </span>
              <span>${q.question}</span>
            </div>
            <span style="font-size: 11px; color: #64748b; font-weight: 500; white-space: nowrap; padding-top: 2px;">
              (${q.points} ${q.points === 1 ? 'pt' : 'pts'})
            </span>
          </div>
          ${contentHtml}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${worksheet.title} - ${isAnswerKey ? 'Answer Key' : 'Student Handout'}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 24px;
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: ${fontFam};
      font-size: ${baseFontSize};
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .floating-toolbar {
      position: sticky;
      top: 12px;
      max-width: 800px;
      margin: 0 auto 16px auto;
      background: #1e1b4b;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
      z-index: 100;
    }
    .btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-container {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .question-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Bar (Visible in browser, hidden when printed) -->
  <div class="floating-toolbar no-print">
    <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
      <span style="background: ${isAnswerKey ? '#059669' : '#6366f1'}; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
        ${isAnswerKey ? 'Teacher Answer Key' : 'Student Handout'}
      </span>
      <span style="font-weight: 600; opacity: 0.9;">${worksheet.title}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print Now (or Save PDF)</button>
    </div>
  </div>

  <!-- Main Sheet Layout -->
  <div class="print-container">
    <!-- Header -->
    <header style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
        <div style="font-weight: 600; color: #475569;">
          <span>${worksheet.schoolName || 'School Assessment'}</span>
          ${worksheet.teacherName ? ` • <span>${worksheet.teacherName}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${worksheet.standardCode ? `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace; background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569;">${worksheet.standardCode}</span>` : ''}
          ${worksheet.versionLabel ? `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #0f172a; color: #ffffff;">Version ${worksheet.versionLabel}</span>` : ''}
          ${isAnswerKey ? `<span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; background: #047857; color: #ffffff; letter-spacing: 0.5px;">Teacher Answer Key</span>` : ''}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 8px;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: -0.5px;">
            ${worksheet.title}
          </h1>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500;">
            Topic: ${worksheet.subtitle || worksheet.subject}
          </div>
        </div>

        <div style="width: 180px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; font-size: 12px; color: #64748b;">
          <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between;">
            <span>Name:</span>
            ${isAnswerKey ? `<span style="color: #047857; font-weight: bold;">[KEY]</span>` : ''}
          </div>
          <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Date:</div>
          <div style="border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between;">
            <span>Score:</span>
            <strong style="color: #0f172a;">/ ${worksheet.totalPoints}</strong>
          </div>
        </div>
      </div>

      ${
        worksheet.instructions
          ? `<div style="margin-top: 14px; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #334155; line-height: 1.5;">
              <strong style="color: #0f172a; text-transform: uppercase; font-size: 10px; margin-right: 6px;">Instructions:</strong>
              ${worksheet.instructions}
             </div>`
          : ''
      }

      ${
        worksheet.passage
          ? `<div style="margin-top: 14px; padding: 14px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Reading Passage</div>
              <div style="font-size: 13px; line-height: 1.6; color: #1e293b; font-family: Georgia, serif; white-space: pre-line;">${worksheet.passage}</div>
             </div>`
          : ''
      }

      ${
        worksheet.wordBank && worksheet.wordBank.length > 0
          ? `<div style="margin-top: 14px; padding: 10px; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; background-color: #f8fafc;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Word Bank</div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; font-size: 12px; font-weight: 500; color: #334155;">
                ${worksheet.wordBank.map((w) => `<span style="text-decoration: underline; text-underline-offset: 3px;">${w}</span>`).join('')}
              </div>
             </div>`
          : ''
      }
    </header>

    <!-- Questions -->
    <main>
      ${questionsHtml}
    </main>

    <!-- Footer -->
    <footer style="margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
      <span>${refCode} | Page 1 of 1</span>
      <span style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
        ${isAnswerKey ? 'Teacher Answer Key' : 'Student Handout'}
      </span>
    </footer>
  </div>

  <script>
    // Automatic print trigger after DOM rendering
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print notice:', e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;
};

/**
 * Downloads the worksheet as a standalone, printable HTML document
 * that automatically prompts for printing when opened in any browser.
 */
export const downloadPrintableHtml = (
  worksheet: Worksheet,
  mode: 'student' | 'answer_key' = 'student',
  fontSize: 'compact' | 'standard' | 'large' = 'standard',
  fontStyle: 'sans' | 'serif' = 'sans'
): void => {
  const html = generateWorksheetHtml(worksheet, mode, fontSize, fontStyle);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  const sanitizedTitle = (worksheet.title || 'Worksheet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const modeSuffix = mode === 'answer_key' ? '_Answer_Key' : '_Student_Handout';
  a.download = `${sanitizedTitle}${modeSuffix}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 1000);
};

/**
 * Opens the printable worksheet in a new browser tab/window.
 * This completely bypasses iframe modal restrictions.
 */
export const openPrintableInNewTab = (
  worksheet: Worksheet,
  mode: 'student' | 'answer_key' = 'student',
  fontSize: 'compact' | 'standard' | 'large' = 'standard',
  fontStyle: 'sans' | 'serif' = 'sans'
): boolean => {
  try {
    const html = generateWorksheetHtml(worksheet, mode, fontSize, fontStyle);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWin = window.open(blobUrl, '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      // Fallback if popup blocked: create temporary anchor
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    }
    return true;
  } catch (e) {
    console.error('Failed to open printable in new tab:', e);
    // Fallback to direct download
    downloadPrintableHtml(worksheet, mode, fontSize, fontStyle);
    return false;
  }
};

/**
 * Robust universal print execution that handles:
 * 1. Native in-page print (`window.print()`)
 * 2. Automatic detection of iframe sandbox limitations
 * 3. Graceful fallback to opening in new tab or download
 */
export const executePrint = async (
  worksheet: Worksheet,
  mode: 'student' | 'answer_key' = 'student',
  fontSize: 'compact' | 'standard' | 'large' = 'standard',
  fontStyle: 'sans' | 'serif' = 'sans'
): Promise<{ success: boolean; methodUsed: 'native' | 'new_tab' | 'download'; message?: string }> => {
  const inIframe = isRunningInIframe();

  // If in iframe, window.print() is often blocked by Chrome/Safari without 'allow-modals'
  if (inIframe) {
    // Attempt window.print() first just in case
    try {
      window.print();
    } catch (e) {
      console.warn('Iframe window.print() prevented by sandbox:', e);
    }

    // Also open in a new clean window which is guaranteed to print cleanly
    const opened = openPrintableInNewTab(worksheet, mode, fontSize, fontStyle);
    if (opened) {
      return {
        success: true,
        methodUsed: 'new_tab',
        message: 'Opened in clean printable tab with print dialog ready!',
      };
    } else {
      downloadPrintableHtml(worksheet, mode, fontSize, fontStyle);
      return {
        success: true,
        methodUsed: 'download',
        message: 'Downloaded printable document file for offline printing.',
      };
    }
  }

  // Not in iframe, standard window.print()
  try {
    window.print();
    return { success: true, methodUsed: 'native' };
  } catch (err: any) {
    console.warn('Direct print failed, falling back to new tab:', err);
    openPrintableInNewTab(worksheet, mode, fontSize, fontStyle);
    return {
      success: true,
      methodUsed: 'new_tab',
      message: 'Opened in new tab to print.',
    };
  }
};
