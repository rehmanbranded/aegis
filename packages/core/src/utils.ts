/**
 * @internal
 *
 * @summary
 * Extracts Scroll-To-Text Fragment (STTF) directives from a URL.
 *
 * @param url - Absolute or relative URL string to inspect.
 * @returns An array of decoded STTF directives, or `null` if none are present.
 *
 * @example
 * ```text
 * /page#:~:text=secret              => ["secret"]
 * /page#:~:text=start,end           => ["start,end"]
 * /page#:~:text=pre-,text,-suf      => ["pre-,text,-suf"]
 * /page#:~:text=one&text=two        => ["one", "two"]
 * ```
 *
 * @remarks
 * This function performs **syntactic extraction only**.
 *
 * - Does not validate DOM state or scroll behavior
 * - Does not interpret fragment semantics
 * - Does not emit telemetry
 *
 * Presence of extracted directives is treated as a signal
 * **only by higher-level detectors**.
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
    // Invalid or unparsable URLs are ignored by design
    return null;
  }
}
