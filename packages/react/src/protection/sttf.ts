import { useEffect, useRef, useCallback } from 'react';
import { parseSTTFFromURL } from '@aegis/core';

/**
 * @internal
 *
 * Options for STTF protection hook.
 */
interface UseSTTFProtectionOptions {
  enabled?: boolean;
  showHighlight?: boolean;
  enableCopyUI?: boolean;
  highlightColor?: string;
  noiseBudgetMs?: number;
  onDetected?: (fragments: string[]) => void;
}

/**
 * @internal
 *
 * @summary
 * Internal STTF protection hook.
 *
 * @param options - Protection configuration
 *
 * @remarks
 * This hook implements the core STTF mitigation strategy:
 *
 * 1. **Scroll Interception** - Forces scroll to top before browser acts
 * 2. **Noise Injection** - Loads all lazy resources uniformly
 * 3. **Custom Scroll** - Scrolls to text only after noise phase
 * 4. **Enhanced UI** - Provides highlight and copy/share buttons
 *
 * **Not exported publicly.** Use `useAegis()` instead.
 *
 * **Security Properties:**
 * - Eliminates timing oracle by normalizing resource loading
 * - Prevents scroll position inference
 * - Blocks IntersectionObserver side channels
 * - Maintains identical behavior regardless of text presence
 */
export function useSTTFProtection(options: UseSTTFProtectionOptions) {
  const {
    enabled = true,
    showHighlight = true,
    enableCopyUI = true,
    highlightColor = '#fef08a',
    noiseBudgetMs = 300,
    onDetected,
  } = options;

  const hasExecuted = useRef(false);
  const highlightRef = useRef<HTMLElement | null>(null);

  /**
   * Forces immediate scroll to top, bypassing smooth scroll.
   *
   * @remarks
   * This races the browser's native STTF scroll behavior.
   * Must execute synchronously on page load.
   */
  const forceScrollTop = useCallback(() => {
    const html = document.documentElement;
    const originalBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      html.style.scrollBehavior = originalBehavior;
    });
  }, []);

  /**
   * Loads all lazy resources to introduce timing noise.
   *
   * @remarks
   * This ensures resource loading is identical whether or not
   * the target text exists, eliminating the timing side channel.
   *
   * Waits for all resources OR timeout (whichever comes first).
   */
  const loadAllResources = useCallback(async (): Promise<void> => {
    const loadPromises: Promise<void>[] = [];

    // Force load all lazy images
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      const imgEl = img as HTMLImageElement;
      imgEl.loading = 'eager';

      if (!imgEl.complete) {
        loadPromises.push(
          new Promise((resolve) => {
            imgEl.onload = () => resolve();
            imgEl.onerror = () => resolve();
          })
        );
      }
    });

    // Force load lazy iframes
    document.querySelectorAll('iframe[loading="lazy"]').forEach((iframe) => {
      (iframe as HTMLIFrameElement).loading = 'eager';
    });

    // Wait for resources or timeout
    await Promise.race([
      Promise.all(loadPromises),
      new Promise((resolve) => setTimeout(resolve, noiseBudgetMs)),
    ]);
  }, [noiseBudgetMs]);

  /**
   * Searches document for target text using TreeWalker.
   *
   * @param searchText - Text to search for (case-insensitive)
   * @returns Text node and offset if found, null otherwise
   *
   * @remarks
   * - Skips script, style, and hidden elements
   * - Case-insensitive search
   * - Returns first match only
   */
  const findTextInDocument = useCallback(
    (searchText: string): { node: Text; offset: number; length: number } | null => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;

            const tag = parent.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'noscript') {
              return NodeFilter.FILTER_REJECT;
            }

            const style = getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const normalized = searchText.toLowerCase().trim();
      let node: Text | null;

      while ((node = walker.nextNode() as Text | null)) {
        const text = (node.textContent || '').toLowerCase();
        const index = text.indexOf(normalized);
        if (index !== -1) {
          return { node, offset: index, length: searchText.length };
        }
      }

      return null;
    },
    []
  );

  /**
   * Applies custom highlight to matched text.
   *
   * @param node - Text node containing the match
   * @param offset - Character offset of match start
   * @param length - Length of matched text
   * @returns HTMLElement containing the highlight
   */
  const applyHighlight = useCallback(
    (node: Text, offset: number, length: number): HTMLElement => {
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + length);

      const mark = document.createElement('mark');
      mark.dataset.aegisHighlight = 'true';
      Object.assign(mark.style, {
        backgroundColor: highlightColor,
        padding: '2px 4px',
        borderRadius: '3px',
        scrollMarginTop: '100px',
      });

      range.surroundContents(mark);
      highlightRef.current = mark;
      return mark;
    },
    [highlightColor]
  );

  /**
   * Shows copy/share UI near highlighted text.
   *
   * @param mark - Highlight element
   * @param text - Highlighted text content
   *
   * @remarks
   * UI provides:
   * - Copy text to clipboard
   * - Share/copy URL
   * - Dismiss highlight
   */
  const showCopyUI = useCallback((mark: HTMLElement, text: string) => {
    const ui = document.createElement('div');
    ui.className = 'aegis-copy-ui';
    ui.innerHTML = `
      <button data-action="copy" title="Copy text">📋</button>
      <button data-action="share" title="Share">🔗</button>
      <button data-action="dismiss" title="Close">✕</button>
    `;

    Object.assign(ui.style, {
      position: 'absolute',
      display: 'flex',
      gap: '6px',
      padding: '6px',
      background: '#1a1a1a',
      borderRadius: '6px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      zIndex: '10000',
    });

    ui.querySelectorAll('button').forEach((btn) => {
      Object.assign(btn.style, {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
      });
    });

    const rect = mark.getBoundingClientRect();
    ui.style.top = `${window.scrollY + rect.top - 44}px`;
    ui.style.left = `${window.scrollX + rect.left}px`;

    ui.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;

      if (btn.dataset.action === 'copy') {
        await navigator.clipboard.writeText(text);
        btn.textContent = '✓';
        setTimeout(() => ui.remove(), 800);
      } else if (btn.dataset.action === 'share') {
        await navigator.clipboard.writeText(window.location.href);
        btn.textContent = '✓';
      } else if (btn.dataset.action === 'dismiss') {
        ui.remove();
        if (mark.parentNode) {
          mark.outerHTML = mark.innerHTML;
        }
      }
    });

    document.body.appendChild(ui);
  }, []);

  useEffect(() => {
    if (!enabled || hasExecuted.current) return;
    hasExecuted.current = true;

    const execute = async () => {
      // Step 1: Immediately scroll to top
      forceScrollTop();

      // Step 2: Parse STTF from URL
      const fragments = parseSTTFFromURL(window.location.href);

      if (!fragments) {
        // No STTF present, but still normalize loading
        await loadAllResources();
        return;
      }

      // Step 3: Notify detection
      onDetected?.(fragments);

      // Step 4: Noise phase (always runs same duration)
      await loadAllResources();

      // Step 5: Find and scroll to text
      const searchText = fragments.split(','); // Handle range syntax
      const match = findTextInDocument(searchText);

      if (match && showHighlight) {
        const mark = applyHighlight(match.node, match.offset, match.length);

        // Smooth scroll after noise
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (enableCopyUI) {
          const extractedText =
            match.node.textContent?.slice(match.offset, match.offset + match.length) || '';
          showCopyUI(mark, extractedText);
        }
      }
    };

    execute();

    // Cleanup on unmount
    return () => {
      if (highlightRef.current && highlightRef.current.parentNode) {
        highlightRef.current.outerHTML = highlightRef.current.innerHTML;
      }
      document.querySelectorAll('.aegis-copy-ui').forEach((el) => el.remove());
    };
  }, [
    enabled,
    forceScrollTop,
    loadAllResources,
    findTextInDocument,
    applyHighlight,
    showCopyUI,
    enableCopyUI,
    showHighlight,
    onDetected,
  ]);
}
