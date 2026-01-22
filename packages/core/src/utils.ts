/**
 * Extract Scroll-To-Text Fragment (STTF) directives from a URL.
 *
 * Examples:
 *   /page#:~:text=secret                => ["secret"]
 *   /page#:~:text=start,end             => ["start,end"]
 *   /page#:~:text=pre-,text,-suf         => ["pre-,text,-suf"]
 *   /page#:~:text=one&text=two           => ["one", "two"]
 *
 * Returns an array of decoded text directives if present,
 * otherwise returns null.
 */
export function getTextFragmentsFromURL(url: string): string[] | null {
  try {
    const parsedUrl = new URL(url, "http://localhost");
    const hash = parsedUrl.hash;

    // STTF always starts with #:~:
    if (!hash.startsWith("#:~:")) {
      return null;
    }

    // Remove "#:~:" prefix
    const directivePart = hash.slice(4);

    // Parse directives manually (URLSearchParams can't parse fragments directly)
    const params = new URLSearchParams(directivePart);

    const texts = params.getAll("text").map((v) => decodeURIComponent(v));

    return texts.length > 0 ? texts : null;
  } catch {
    // Fail silently by design
    return null;
  }
}
