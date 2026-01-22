/**
 * @public
 *
 * @summary
 * Enumeration of supported XS-Leak vectors.
 *
 * @remarks
 * Stability contract:
 * - New values **MAY** be added in minor or patch releases
 * - Existing values **MUST NOT** change semantics once published
 */
export type XSLeakVector = "STTF";

/**
 * @public
 *
 * @summary
 * XS-Leak security event emitted by the Aegis core.
 *
 * @remarks
 * This event represents **detection of a potential browser-side
 * side-channel signal**, not confirmed exploitation.
 */
export type XSLeakEvent = {
  /**
   * Event domain discriminator.
   *
   * @remarks
   * Enables safe narrowing when consuming {@link AegisEvent}.
   */
  kind: "XS_LEAK";

  /**
   * Severity level associated with the event.
   *
   * @remarks
   * - `INFO`  - detection-only signal
   * - `WARN`  - suspicious behavior
   * - `ERROR` - policy violation or invariant breach
   */
  level: "INFO" | "WARN" | "ERROR";

  /**
   * XS-Leak technique that triggered the event.
   */
  vector: XSLeakVector;

  /**
   * Optional request path or logical route associated
   * with the detection.
   */
  path?: string;

  /**
   * Optional diagnostic detail.
   *
   * @remarks
   * - Intended for debugging or analysis only
   * - Must **never** contain sensitive user data
   */
  detail?: string;

  /**
   * Event timestamp in epoch milliseconds.
   */
  timestamp: number;
};

/**
 * @public
 *
 * @summary
 * Union of all Aegis security events.
 *
 * @remarks
 * This type forms the **external telemetry contract**.
 *
 * It must be extended exclusively via **discriminated unions**
 * to preserve backward compatibility.
 */
export type AegisEvent = XSLeakEvent;

/**
 * @public
 *
 * @summary
 * Telemetry sink function.
 *
 * @param event - Structured Aegis security event.
 *
 * @remarks
 * A telemetry sink is a **passive, one-way consumer** of events.
 *
 * Design guarantees:
 * - Must never throw
 * - Must never block execution
 * - Must never affect core behavior
 */
export type TelemetrySink = (event: AegisEvent) => void;
