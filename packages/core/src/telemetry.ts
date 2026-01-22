import { AegisEvent, TelemetrySink } from "./types.js";

/**
 * @internal
 *
 * Active telemetry sink.
 *
 * @remarks
 * - `null` indicates telemetry is disabled
 * - Only a single sink is supported by design
 * - Sink is treated as a passive observer
 */
let sink: TelemetrySink | null = null;

/**
 * @public
 *
 * @summary
 * Registers a telemetry sink to receive Aegis security events.
 *
 * @param fn - Telemetry sink implementation.
 *
 * @remarks
 * This function is **optional** and intended to be called by
 * framework adapters or monitoring integrations.
 *
 * - Replaces any previously registered sink
 * - Sink must be non-blocking and fail-safe
 * - Core behavior must never depend on sink execution
 *
 * @see {@link TelemetrySink}
 */
export function registerTelemetrySink(fn: TelemetrySink): void {
  sink = fn;
}

/**
 * @public
 *
 * @summary
 * Emits a structured security event to the registered telemetry sink.
 *
 * @param event - Structured Aegis security event.
 *
 * @remarks
 * This is the **sole egress point** for telemetry leaving the core.
 *
 * Design guarantees:
 * - Must never throw
 * - Must never block request execution
 * - Silently drops events if no sink is registered
 * - Sink failures are intentionally swallowed
 */
export function emitEvent(event: AegisEvent): void {
  if (!sink) return;

  try {
    sink(event);
  } catch {
    // Events cannot be transmitted without sink, so ignore errors.
  }
}
