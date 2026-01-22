/**
 * @public
 *
 * @summary
 * Public API surface for `@aegis/core`.
 *
 * @remarks
 * This module defines the **only stable and supported entry point**
 * for consumers and framework adapters.
 *
 * Any symbol not explicitly re-exported here is considered
 * **internal implementation detail** and may change without notice.
 *
 * Adapters (e.g. `@aegis/express`, `@aegis/next`) must rely
 * exclusively on this surface.
 */
export * from "./types";
export * from "./telemetry";
export * from "./leaks";
