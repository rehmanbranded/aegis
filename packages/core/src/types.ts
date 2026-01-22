/**
 * @public
 *
 * Enumeration of supported XS-Leak vectors.
 *
 * Stability contract:
 * - New values MAY be added.
 * - Existing values MUST NOT change semantics.
 */
export type XSLeakVector = "STTF";

/**
 * @public
 *
 * XS-Leak security event emitted by the Aegis core.
 */
export type XSLeakEvent = {
  /**
   * Event domain discriminator.
   */
  kind: "XS_LEAK";

  /**
   * Severity associated with the event.
   */
  level: "INFO" | "WARN" | "ERROR";

  /**
   * XS-Leak technique that triggered the event.
   */
  vector: XSLeakVector;

  /**
   * Optional request path or logical route.
   */
  path?: string;

  /**
   * Optional diagnostic detail.
   *
   * @remarks
   * Must never contain sensitive user data.
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
 * Union of all Aegis security events.
 *
 * @remarks
 * Extended only via discriminated unions.
 */
export type AegisEvent = XSLeakEvent;

/**
 * @public
 *
 * Telemetry sink function.
 *
 * @remarks
 * - Must never throw
 * - Must never block
 * - Must never affect core behavior
 */
export type TelemetrySink = (event: AegisEvent) => void;
