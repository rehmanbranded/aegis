/**
 * @internal
 *
 * Extract Scroll-To-Text Fragment (STTF) directives from a URL.
 *
 * @param url - Absolute or relative URL string.
 * @returns Array of decoded STTF directives, or null if absent.
 *
 * @remarks
 * - Detection-only utility
 * - Does not interpret semantic meaning
 * - Presence alone is considered a signal
 */
export function getTextFragmentsFromURL(url: string): string[] | null {
  try {
    const parsedUrl = new URL(url, "http://localhost");
    const hash = parsedUrl.hash;

    if (!hash.startsWith("#:~:")) {
      return null;
    }

    const directivePart = hash.slice(4);
    const params = new URLSearchParams(directivePart);

    const texts = params.getAll("text").map((value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    });

    return texts.length > 0 ? texts : null;
  } catch {
    return null;
  }
}
