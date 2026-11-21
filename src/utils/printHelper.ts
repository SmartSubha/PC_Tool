/**
 * Unified Print Preview + Direct Synchronous Printing Engine.
 * Calls to printImageOnA4 / printMultipleImagesOnA4 / printElementHtml open
 * the interactive Print Preview modal so users can inspect the A4 / 4x6 sheet,
 * toggle page margins, and add a page number watermark before triggering window.print().
 */

const PRINT_SHEET_ID = '__direct_print_sheet';
const PRINT_STYLE_ID = '__direct_print_style';

export type MarginPreset = 'none' | 'narrow' | 'standard' | 'wide';
export type WatermarkPosition = 'bottom-right' | 'bottom-center' | 'diagonal';
export type CustomWatermarkStyle = 'diagonal' | 'header' | 'footer';

export interface PrintOptions {
  marginPreset: MarginPreset;
  showPageWatermark: boolean;
  watermarkPosition: WatermarkPosition;
  customWatermarkText: string;
  customWatermarkStyle: CustomWatermarkStyle;
}

export interface PrintJobPayload {
  id: string;
  kind: 'image' | 'multi-image' | 'html';
  title: string;
  paperSize: 'A4' | '4x6';
  imageDataUrl?: string;
  imageDataUrls?: string[];
  htmlContent?: string;
  defaultMargin: MarginPreset;
}

export const MARGIN_PRESET_MM: Record<MarginPreset, number> = {
  none: 0,
  narrow: 3,
  standard: 10,
  wide: 18,
};

type PrintPreviewListener = (job: PrintJobPayload) => void;
const listeners = new Set<PrintPreviewListener>();

export function subscribePrintPreview(listener: PrintPreviewListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dispatchPrintPreview(job: PrintJobPayload): void {
  if (listeners.size === 0) {
    // Safety fallback if modal is not mounted
    executePrintJob(job, {
      marginPreset: job.defaultMargin,
      showPageWatermark: false,
      watermarkPosition: 'bottom-right',
      customWatermarkText: '',
      customWatermarkStyle: 'diagonal',
    });
    return;
  }
  listeners.forEach((listener) => listener(job));
}

function cleanupDirectPrint(previousTitle: string): void {
  document.documentElement.classList.remove('has-direct-print');
  const sheet = document.getElementById(PRINT_SHEET_ID);
  if (sheet) sheet.remove();
  const styleEl = document.getElementById(PRINT_STYLE_ID);
  if (styleEl) styleEl.remove();
  document.title = previousTitle;
}

function triggerDirectPrint(
  contentBuilder: (container: HTMLElement) => void,
  pageCss: string,
  title: string
): void {
  const previousTitle = document.title;
  cleanupDirectPrint(previousTitle);

  const styleEl = document.createElement('style');
  styleEl.id = PRINT_STYLE_ID;
  styleEl.textContent = pageCss;
  document.head.appendChild(styleEl);

  const container = document.createElement('div');
  container.id = PRINT_SHEET_ID;
  contentBuilder(container);
  document.body.appendChild(container);

  document.documentElement.classList.add('has-direct-print');
  document.title = title;

  let cleaned = false;
  const finish = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('afterprint', finish);
    cleanupDirectPrint(previousTitle);
  };

  window.addEventListener('afterprint', finish);

  // Trigger native browser print dialog synchronously inside the user gesture
  try {
    window.focus();
    window.print();
  } finally {
    // Fallback cleanup if browser returns immediately or suppresses afterprint
    setTimeout(finish, 800);
  }
}

function stripDarkModeClasses(el: Element): void {
  if (typeof el.className === 'string' && el.className.includes('dark:')) {
    el.className = el.className
      .split(/\s+/)
      .filter((token) => token && !token.startsWith('dark:'))
      .join(' ');
  }
  Array.from(el.children).forEach(stripDarkModeClasses);
}

function serializeElementForPrint(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  // Replace live canvas nodes with static PNG images so QR codes / previews stay intact
  const origCanvases = Array.from(element.querySelectorAll('canvas'));
  const cloneCanvases = Array.from(clone.querySelectorAll('canvas'));
  cloneCanvases.forEach((clonedCanvas, idx) => {
    const orig = origCanvases[idx];
    if (!orig) return;
    try {
      const img = document.createElement('img');
      img.src = orig.toDataURL('image/png');
      img.className = clonedCanvas.className;
      img.style.cssText = clonedCanvas.style.cssText;
      clonedCanvas.replaceWith(img);
    } catch {
      // Ignore tainted canvas edge cases
    }
  });

  // Sync live form field values into attributes for cloned preview/print
  const origInputs = Array.from(element.querySelectorAll('input, textarea, select'));
  const cloneInputs = Array.from(clone.querySelectorAll('input, textarea, select'));
  cloneInputs.forEach((clonedField, idx) => {
    const orig = origInputs[idx];
    if (!orig) return;
    if (orig instanceof HTMLInputElement && clonedField instanceof HTMLInputElement) {
      if (orig.type === 'checkbox' || orig.type === 'radio') {
        if (orig.checked) clonedField.setAttribute('checked', 'checked');
        else clonedField.removeAttribute('checked');
      } else {
        clonedField.setAttribute('value', orig.value);
      }
    } else if (orig instanceof HTMLTextAreaElement && clonedField instanceof HTMLTextAreaElement) {
      clonedField.textContent = orig.value;
    } else if (orig instanceof HTMLSelectElement && clonedField instanceof HTMLSelectElement) {
      clonedField.value = orig.value;
    }
  });

  // Strip UI-only helper nodes & dark-mode overrides so sheet always simulates white paper
  clone.querySelectorAll('.no-print').forEach((n) => n.remove());
  stripDarkModeClasses(clone);
  clone.classList.remove('rounded-2xl', 'shadow-md', 'shadow-lg', 'shadow-sm', 'shadow-xs');
  clone.style.boxShadow = 'none';

  return clone.outerHTML;
}

function buildWatermarkNode(pageNum: number, totalPages: number, position: WatermarkPosition): HTMLElement {
  const badge = document.createElement('div');
  badge.className = `pc-print-watermark pc-print-watermark--${position}`;
  badge.textContent =
    position === 'diagonal'
      ? `PAGE ${pageNum} / ${totalPages}`
      : `Page ${pageNum} of ${totalPages}`;
  return badge;
}

function buildCustomTextWatermarkNode(text: string, style: CustomWatermarkStyle): HTMLElement {
  const el = document.createElement('div');
  el.className = `pc-custom-watermark pc-custom-watermark--${style}`;
  el.textContent = text;
  return el;
}

export function executePrintJob(job: PrintJobPayload, options: PrintOptions): void {
  const marginMm = MARGIN_PRESET_MM[options.marginPreset];
  const { showPageWatermark, watermarkPosition, customWatermarkText, customWatermarkStyle } = options;
  const trimmedCustomWatermark = customWatermarkText.trim();
  const hasCustomWatermark = trimmedCustomWatermark.length > 0;

  const watermarkCss =
    showPageWatermark || hasCustomWatermark
      ? `
      #${PRINT_SHEET_ID} .print-page-sheet,
      #${PRINT_SHEET_ID} .print-doc-wrapper { position: relative; }
      #${PRINT_SHEET_ID} .pc-print-watermark,
      #${PRINT_SHEET_ID} .pc-custom-watermark {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 800;
        letter-spacing: 0.06em;
        pointer-events: none;
        z-index: 9999;
      }
      #${PRINT_SHEET_ID} .pc-print-watermark--bottom-right {
        position: fixed;
        bottom: ${Math.max(2, marginMm > 0 ? 2 : 3)}mm;
        right: ${Math.max(3, marginMm > 0 ? 2 : 4)}mm;
        font-size: 9pt;
        color: #334155;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #cbd5e1;
        padding: 1.5mm 3mm;
        border-radius: 2mm;
      }
      #${PRINT_SHEET_ID} .pc-print-watermark--bottom-center {
        position: fixed;
        bottom: ${Math.max(2, marginMm > 0 ? 2 : 3)}mm;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9pt;
        color: #334155;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #cbd5e1;
        padding: 1.5mm 4mm;
        border-radius: 2mm;
      }
      #${PRINT_SHEET_ID} .pc-print-watermark--diagonal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-32deg);
        font-size: 38pt;
        color: rgba(15, 23, 42, 0.09);
        white-space: nowrap;
      }
      #${PRINT_SHEET_ID} .pc-custom-watermark--diagonal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-34deg);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 28pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(15, 23, 42, 0.11);
        white-space: nowrap;
      }
      #${PRINT_SHEET_ID} .pc-custom-watermark--header {
        position: fixed;
        top: ${Math.max(2, marginMm > 0 ? 2 : 3)}mm;
        right: ${Math.max(3, marginMm > 0 ? 2 : 4)}mm;
        font-size: 8.5pt;
        color: #475569;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #cbd5e1;
        padding: 1mm 2.5mm;
        border-radius: 1.5mm;
      }
      #${PRINT_SHEET_ID} .pc-custom-watermark--footer {
        position: fixed;
        bottom: ${Math.max(2, marginMm > 0 ? 2 : 3)}mm;
        left: ${Math.max(3, marginMm > 0 ? 2 : 4)}mm;
        font-size: 8.5pt;
        color: #475569;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #cbd5e1;
        padding: 1mm 2.5mm;
        border-radius: 1.5mm;
      }
      #${PRINT_SHEET_ID} .print-page-sheet .pc-print-watermark--bottom-right,
      #${PRINT_SHEET_ID} .print-page-sheet .pc-print-watermark--bottom-center,
      #${PRINT_SHEET_ID} .print-page-sheet .pc-print-watermark--diagonal,
      #${PRINT_SHEET_ID} .print-page-sheet .pc-custom-watermark--diagonal,
      #${PRINT_SHEET_ID} .print-page-sheet .pc-custom-watermark--header,
      #${PRINT_SHEET_ID} .print-page-sheet .pc-custom-watermark--footer {
        position: absolute;
      }
    `
      : '';

  if (job.kind === 'image' && job.imageDataUrl) {
    const is4x6 = job.paperSize === '4x6';
    const maxW = is4x6 ? `calc(4in - ${marginMm * 2}mm)` : `${Math.max(100, 210 - marginMm * 2)}mm`;
    const maxH = is4x6 ? `calc(6in - ${marginMm * 2}mm)` : `${Math.max(120, 297 - marginMm * 2)}mm`;

    const pageCss = `@media print {
      @page { size: ${is4x6 ? '4in 6in' : 'A4'} portrait; margin: ${marginMm}mm; }
      html, body { width: ${is4x6 ? '4in' : '210mm'}; height: ${is4x6 ? '6in' : '297mm'}; margin: 0 !important; padding: 0 !important; background: #fff !important; }
      #${PRINT_SHEET_ID} { width: 100%; height: 100%; }
      #${PRINT_SHEET_ID} .print-page-sheet { position: relative; width: 100%; height: ${maxH}; display: flex; align-items: flex-start; justify-content: center; }
      #${PRINT_SHEET_ID} img { width: 100%; max-width: ${maxW}; height: auto; max-height: ${maxH}; object-fit: contain; display: block; margin: 0 auto; }
      ${watermarkCss}
    }`;

    triggerDirectPrint(
      (container) => {
        const sheet = document.createElement('div');
        sheet.className = 'print-page-sheet';
        const img = document.createElement('img');
        img.src = job.imageDataUrl!;
        img.alt = job.title;
        sheet.appendChild(img);
        if (hasCustomWatermark) {
          sheet.appendChild(buildCustomTextWatermarkNode(trimmedCustomWatermark, customWatermarkStyle));
        }
        if (showPageWatermark) {
          sheet.appendChild(buildWatermarkNode(1, 1, watermarkPosition));
        }
        container.appendChild(sheet);
      },
      pageCss,
      job.title
    );
    return;
  }

  if (job.kind === 'multi-image' && job.imageDataUrls && job.imageDataUrls.length > 0) {
    const urls = job.imageDataUrls;
    const maxW = `${Math.max(100, 210 - marginMm * 2)}mm`;
    const maxH = `${Math.max(120, 297 - marginMm * 2)}mm`;

    const pageCss = `@media print {
      @page { size: A4 portrait; margin: ${marginMm}mm; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      #${PRINT_SHEET_ID} .print-page-sheet { position: relative; min-height: ${maxH}; page-break-after: always; break-after: page; display: flex; align-items: center; justify-content: center; }
      #${PRINT_SHEET_ID} .print-page-sheet:last-child { page-break-after: auto; break-after: auto; }
      #${PRINT_SHEET_ID} img { width: 100%; max-width: ${maxW}; height: auto; max-height: ${maxH}; object-fit: contain; display: block; margin: 0 auto; }
      ${watermarkCss}
    }`;

    triggerDirectPrint(
      (container) => {
        urls.forEach((url, idx) => {
          const pageDiv = document.createElement('div');
          pageDiv.className = 'print-page-sheet';
          const img = document.createElement('img');
          img.src = url;
          img.alt = `${job.title} - Page ${idx + 1}`;
          pageDiv.appendChild(img);
          if (hasCustomWatermark) {
            pageDiv.appendChild(buildCustomTextWatermarkNode(trimmedCustomWatermark, customWatermarkStyle));
          }
          if (showPageWatermark) {
            pageDiv.appendChild(buildWatermarkNode(idx + 1, urls.length, watermarkPosition));
          }
          container.appendChild(pageDiv);
        });
      },
      pageCss,
      job.title
    );
    return;
  }

  if (job.kind === 'html' && job.htmlContent) {
    const useFixedDocWatermark =
      showPageWatermark && (watermarkPosition === 'diagonal' || marginMm === 0);

    const pageCss = `@media print {
      @page {
        size: A4 portrait;
        margin: ${marginMm}mm;
        ${
          showPageWatermark && watermarkPosition !== 'diagonal' && marginMm > 0
            ? watermarkPosition === 'bottom-center'
              ? `@bottom-center { content: "Page " counter(page) " of " counter(pages); font-family: monospace; font-size: 9pt; font-weight: 700; color: #334155; }`
              : `@bottom-right { content: "Page " counter(page) " of " counter(pages); font-family: monospace; font-size: 9pt; font-weight: 700; color: #334155; }`
            : ''
        }
      }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      #${PRINT_SHEET_ID} { padding: 0 !important; }
      ${useFixedDocWatermark || hasCustomWatermark ? watermarkCss : ''}
    }`;

    triggerDirectPrint(
      (container) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'print-doc-wrapper';
        wrapper.innerHTML = job.htmlContent!;
        if (hasCustomWatermark) {
          wrapper.appendChild(buildCustomTextWatermarkNode(trimmedCustomWatermark, customWatermarkStyle));
        }
        if (useFixedDocWatermark) {
          wrapper.appendChild(buildWatermarkNode(1, 1, watermarkPosition));
        }
        container.appendChild(wrapper);
      },
      pageCss,
      job.title
    );
    return;
  }

  window.print();
}

export function printImageOnA4(
  imageDataUrl: string,
  title = 'A4 Print Sheet',
  paperSize: 'A4' | '4x6' = 'A4'
): void {
  dispatchPrintPreview({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'image',
    title,
    paperSize,
    imageDataUrl,
    defaultMargin: 'narrow',
  });
}

export function printMultipleImagesOnA4(
  imageDataUrls: string[],
  title = 'Multi-Page A4 Print'
): void {
  if (imageDataUrls.length === 0) return;
  dispatchPrintPreview({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'multi-image',
    title,
    paperSize: 'A4',
    imageDataUrls,
    defaultMargin: 'narrow',
  });
}

export function printElementHtml(element: HTMLElement | null, title = 'Document Print'): void {
  if (!element) {
    window.print();
    return;
  }

  dispatchPrintPreview({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: 'html',
    title,
    paperSize: 'A4',
    htmlContent: serializeElementForPrint(element),
    defaultMargin: 'standard',
  });
}
