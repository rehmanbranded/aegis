/**
 * Enumeration of supported XS-Leak vectors.
 *
 * New values may be added, but existing values must
 * never change semantics once released.
 */
export type XSLeakVector = "STTF";

/**
 * XS-Leak security event emitted by the core.
 *
 * This event represents detection of a browser-side
 * side-channel that may allow cross-origin inference.
 */
export type XSLeakEvent = {
  /**
   * Event domain discriminator.
   * Allows consumers to safely narrow event shape.
   */
  kind: "XS_LEAK";

  /**
   * Severity level of the event.
   *
   * INFO  – detection only
   * WARN  – suspicious behavior
   * ERROR – policy violation or invariant breach
   */
  level: "INFO" | "WARN" | "ERROR";

  /**
   * Specific XS-Leak technique detected.
   */
  vector: XSLeakVector;

  /**
   * Request path associated with the event, if known.
   */
  path?: string;

  /**
   * Optional detail payload (e.g. URL fragment).
   *
   * Must never contain sensitive user data.
   */
  detail?: string;

  /**
   * Event timestamp (epoch milliseconds).
   */
  timestamp: number;
};

/**
 * Union of all Aegis security events.
 *
 * This type is part of the public contract and should
 * be extended using discriminated unions only.
 */
export type AegisEvent = XSLeakEvent;

/**
 * Telemetry sink function.
 *
 * A sink is a one-way consumer of events and must:
 *  - never throw
 *  - never block
 *  - never influence core behavior
 */
export type TelemetrySink = (event: AegisEvent) => void;
