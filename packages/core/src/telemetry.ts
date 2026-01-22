import { AegisEvent, TelemetrySink } from "./types";

/**
 * Registered telemetry sink.
 * Null means telemetry is disabled.
 */
let sink: TelemetrySink | null = null;

/**
 * Register a telemetry sink.
 *
 * This is optional and should be called by
 * monitoring or integration layers.
 */
export function registerTelemetrySink(fn: TelemetrySink) {
  sink = fn;
}

/**
 * Emit a security event.
 *
 * This function must never throw or block.
 */
export function emitEvent(event: AegisEvent) {
  if (!sink) return;

  try {
    sink(event);
  } catch {
    // Fail silently by design
  }
}
