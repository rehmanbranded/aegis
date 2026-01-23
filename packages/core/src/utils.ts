/**
 * @public
 *
 * @summary
 * Parses Scroll-To-Text Fragment (STTF) directives from a URL string.
 *
 * @param url - Absolute or relative URL string to inspect.
 * @returns Array of decoded STTF text directives, or `null` if none are present.
 *
 * @remarks
 * This is a pure parsing function with no side effects.
 *
 * **STTF Syntax:**
 * - Prefix: `#:~:`
 * - Single text: `#:~:text=searchTerm`
 * - Range: `#:~:text=startText,endText`
 * - Context: `#:~:text=prefix-,text,-suffix`
 * - Multiple: `#:~:text=one&text=two`
 *
 * **Parsing Behavior:**
 * - Invalid URLs return `null` (no exceptions thrown)
 * - Malformed percent-encoding is preserved as-is
 * - Empty text directives are filtered out
 * - Does not validate fragment semantics
 *
 * @see {@link https://wicg.github.io/scroll-to-text-fragment/}
 *
 * @example
 * ```typescript
 * parseSTTFFromURL('/page#:~:text=secret')
 * // => ["secret"]
 *
 * parseSTTFFromURL('/page#:~:text=start,end')
 * // => ["start,end"]
 *
 * parseSTTFFromURL('/page#:~:text=one&text=two')
 * // => ["one", "two"]
 *
 * parseSTTFFromURL('/page#section')
 * // => null
 * ```
 */
export function parseSTTFFromURL(url: string): string[] | null {
  try {
    const parsedUrl = new URL(url, "http://localhost");
    const hash = parsedUrl.hash;

    if (!hash.startsWith("#:~:")) {
      return null;
    }

    const directivePart = hash.slice(4);
    const params = new URLSearchParams(directivePart);
    const texts = params.getAll("text");

    if (texts.length === 0) {
      return null;
    }

    // Attempt to decode each text directive, preserving original if decoding fails
    const decoded = texts.map((value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    });

    return decoded;
  } catch {
    // Malformed URLs or parsing errors result in no detection
    return null;
  }
}
