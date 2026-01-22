import type { Request, Response, NextFunction } from "express";
import {
  detectSTTF,
  registerTelemetrySink,
  type TelemetrySink,
} from "@aegis/core";

/**
 * @public
 *
 * @summary
 * Configuration options for the Aegis Express middleware.
 */
export interface AegisExpressOptions {
  /**
   * Optional telemetry sink.
   *
   * @remarks
   * If provided, security events emitted by the Aegis core
   * will be forwarded to this sink.
   *
   * Design guarantees:
   * - Sink must be non-blocking
   * - Sink must not throw
   * - Telemetry is disabled by default
   */
  telemetry?: TelemetrySink;
}

/**
 * @public
 *
 * @summary
 * Creates an Express middleware that invokes Aegis XS-Leak detection.
 *
 * @remarks
 * This function is a **middleware factory** and must be called
 * once during application initialization.
 *
 * The returned middleware:
 * - Performs detection only
 * - Never blocks or mutates requests
 * - Never alters responses
 *
 * @param options - Optional configuration for the middleware.
 * @returns An Express-compatible request handler.
 *
 * @example
 * ### Basic usage
 * ```ts
 * import { aegis } from "@aegis/express";
 *
 * app.use(aegis());
 * ```
 *
 * @example
 * ### With telemetry logging
 * ```ts
 * app.use(
 *   aegis({
 *     telemetry: (event) => {
 *       console.log(event);
 *     },
 *   })
 * );
 * ```
 *
 * @example
 * ### With monitor adapter (local ingestion)
 * ```ts
 * import { ingestEvent } from "@aegis/monitor";
 *
 * app.use(
 *   aegis({
 *     telemetry: (event) => {
 *       ingestEvent(event);
 *     },
 *   })
 * );
 * ```
 *
 * @example
 * ### With custom filtering or buffering
 * ```ts
 * const buffer: unknown[] = [];
 *
 * app.use(
 *   aegis({
 *     telemetry: (event) => {
 *       if (event.kind === "XS_LEAK") {
 *         buffer.push(event);
 *       }
 *     },
 *   })
 * );
 * ```
 */
export function aegis(options: AegisExpressOptions = {}) {
  // Register telemetry sink once at middleware creation time.
  if (options.telemetry) {
    registerTelemetrySink(options.telemetry);
  }

  /**
   * Express request handler.
   *
   * @internal
   *
   * @param req - Express request object.
   * @param _res - Express response object (unused).
   * @param next - Callback to pass control to the next middleware.
   *
   * @remarks
   * - Detection-only
   * - Never mutates request or response
   * - Never throws
   * - Must never interfere with request flow
   */
  return function aegisMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    try {
      detectSTTF(req.originalUrl);
    } catch {
      // Adapter must never impact application behavior, so ignore errors.
    }

    next();
  };
}
