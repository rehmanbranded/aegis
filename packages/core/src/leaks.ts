import { emitEvent } from "./telemetry.js";
import { parseSTTFFromURL } from "./utils.js";

/**
 * @public
 *
 * @summary
 * Extracts and reports Scroll-To-Text Fragment (STTF) directives from a URL string.
 *
 * @param url - Arbitrary URL string to inspect for STTF syntax.
 * @param path - Optional logical request path for telemetry context.
 * @returns `true` if STTF directives are present, otherwise `false`.
 *
 * @remarks
 * This function performs **syntactic extraction only** and does NOT detect
 * real-world XS-Leak attacks.
 *
 * **Critical Limitation:**
 * Hash fragments (everything after `#`) are NOT transmitted in standard HTTP
 * requests. This function is useful ONLY when the URL string is:
 * - Explicitly sent by client-side code (e.g., analytics beacons)
 * - Passed as query parameters or request body
 * - Constructed server-side with full URL context
 *
 * **This function CANNOT detect STTF attacks from normal browser navigations.**
 * For real-world attack detection, use client-side instrumentation.
 *
 * When STTF syntax is detected, a structured {@link XSLeakEvent} is emitted
 * via the registered telemetry sink for audit purposes.
 *
 * @see {@link parseSTTFFromURL}
 *
 * @example
 * ```typescript
 * // Valid use case: Client explicitly reports navigation
 * app.post('/api/report-navigation', (req, res) => {
 *   extractSTTFDirectives(req.body.fullUrl, req.body.path);
 *   res.sendStatus(204);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Invalid use case: Standard Express middleware
 * app.use((req, res, next) => {
 *   // This will NOT work - req.url does not contain hash fragments
 *   extractSTTFDirectives(req.url);
 *   next();
 * });
 * ```
 */
export function extractSTTFDirectives(url: string, path?: string): boolean {
  const fragments = parseSTTFFromURL(url);

  if (!fragments) {
    return false;
  }

  emitEvent({
    kind: "XS_LEAK",
    level: "INFO",
    vector: "STTF",
    path,
    detail: fragments.join(";"),
    timestamp: Date.now(),
  });

  return true;
}
