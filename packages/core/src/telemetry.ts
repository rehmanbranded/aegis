import { AegisEvent, TelemetrySink } from "./types";

/**
 * @internal
 *
 * Active telemetry sink.
 *
 * @remarks
 * Null indicates telemetry is disabled.
 * Only a single sink is supported by design.
 */
let sink: TelemetrySink | null = null;

/**
 * @public
 *
 * Register a telemetry sink to receive security events.
 *
 * @param fn - Telemetry sink implementation.
 *
 * @remarks
 * - Optional
 * - Replaces any existing sink
 * - Must be fail-safe
 */
export function registerTelemetrySink(fn: TelemetrySink): void {
  sink = fn;
}

/**
 * @public
 *
 * Emit a security event.
 *
 * @param event - Structured security event.
 *
 * @remarks
 * - Sole egress point for core telemetry
 * - Must never throw
 * - Silently drops events if no sink is registered
 */
export function emitEvent(event: AegisEvent): void {
  if (!sink) return;

  try {
    sink(event);
  } catch {
    // Fail-silent by design
  }
}
