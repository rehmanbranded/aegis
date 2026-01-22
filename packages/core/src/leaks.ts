import { emitEvent } from "./telemetry";
import { getTextFragmentsFromURL } from "./utils";

/**
 * @public
 *
 * Detect Scroll-To-Text Fragment (STTF) XS-Leaks.
 *
 * @param url - Request URL (absolute or relative).
 * @returns True if STTF directives are detected.
 *
 * @remarks
 * - Detection does not imply exploitability
 * - No DOM validation is performed
 * - Semantics are intentionally ignored
 */
export function detectSTTF(url: string): boolean {
  const fragments = getTextFragmentsFromURL(url);

  if (!fragments) {
    return false;
  }

  emitEvent({
    kind: "XS_LEAK",
    level: "INFO",
    vector: "STTF",
    detail: fragments.join(";"),
    timestamp: Date.now(),
  });

  return true;
}
