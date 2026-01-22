import { emitEvent } from "./telemetry.js";
import { getTextFragmentsFromURL } from "./utils.js";

/**
 * @public
 *
 * @summary
 * Detects Scroll-To-Text Fragment (STTF) based XS-Leak signals.
 *
 * @param url - Request URL (absolute or relative) to inspect.
 * @returns `true` if one or more STTF directives are present, otherwise `false`.
 *
 * @remarks
 * This function performs **presence-based detection only**.
 *
 * - Detection does **not** imply exploitability
 * - No DOM state, scroll behavior, or rendering is evaluated
 * - Semantic interpretation of fragments is intentionally avoided
 * - Presence alone is treated as a reconnaissance signal
 *
 * When detection occurs, a structured {@link XSLeakEvent} is
 * emitted via the registered telemetry sink.
 *
 * @see {@link getTextFragmentsFromURL}
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
