import type { Request, Response, NextFunction } from "express";
import {
  extractSTTFDirectives,
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
   * Optional telemetry sink for receiving security events.
   *
   * @remarks
   * If provided, events emitted by Aegis core will be forwarded
   * to this sink for logging or monitoring.
   *
   * The sink must be non-blocking and fail-safe.
   */
  telemetry?: TelemetrySink;

  /**
   * Enables STTF directive extraction from request URLs.
   *
   * @remarks
   * **Critical Limitation:**
   * Standard browser navigations do NOT send hash fragments to the server.
   * This option is only effective when:
   * - Client code explicitly sends full URLs (e.g., via fetch/beacon)
   * - URLs are passed as query parameters or in request bodies
   * - Application uses custom URL forwarding mechanisms
   *
   * For detecting real-world STTF attacks, client-side instrumentation
   * (e.g., `@aegis/react`) is required.
   *
   * @defaultValue false
   */
  enableSTTFExtraction?: boolean;
}

/**
 * @public
 *
 * @summary
 * Creates an Express middleware that performs XS-Leak telemetry extraction.
 *
 * @param options - Optional configuration for the middleware.
 * @returns Express-compatible request handler.
 *
 * @remarks
 * This middleware is **detection-only** and never mutates requests or responses.
 *
 * **Architectural Limitations:**
 * Due to browser security model (RFC 3986), hash fragments are client-side only.
 * This middleware cannot detect STTF attacks from normal page navigations.
 *
 * **Valid Use Cases:**
 * - Analytics endpoints receiving client-reported URLs
 * - API routes with explicit URL forwarding
 * - SSR contexts with custom URL parsing
 *
 * **Invalid Use Cases:**
 * - Standard request interception (fragments not present in req.url)
 * - Automatic attack detection without client instrumentation
 *
 * @see {@link extractSTTFDirectives}
 *
 * @example
 * ### Basic telemetry logging
 * ```typescript
 * import { aegis } from "@aegis/express";
 *
 * app.use(
 *   aegis({
 *     telemetry: (event) => console.log(event),
 *   })
 * );
 * ```
 *
 * @example
 * ### API endpoint for client-reported URLs
 * ```typescript
 * // Client sends full URL including fragment
 * app.post('/api/report-nav', aegis({ enableSTTFExtraction: true }), (req, res) => {
 *   extractSTTFDirectives(req.body.fullUrl, req.body.path);
 *   res.sendStatus(204);
 * });
 * ```
 *
 * @example
 * ### Integration with monitoring dashboard
 * ```typescript
 * import { ingestEvent } from "@aegis/monitor";
 *
 * app.use(
 *   aegis({
 *     telemetry: ingestEvent,
 *     enableSTTFExtraction: false, // Explicit opt-in required
 *   })
 * );
 * ```
 */
export function aegis(options: AegisExpressOptions = {}) {
  const { telemetry, enableSTTFExtraction = false } = options;

  if (telemetry) {
    registerTelemetrySink(telemetry);
  }

  /**
   * Express request handler.
   *
   * @internal
   *
   * @param req - Express request object.
   * @param _res - Express response object (unused in detection-only mode).
   * @param next - Callback to pass control to next middleware.
   *
   * @remarks
   * - Never throws exceptions
   * - Never blocks request flow
   * - Never mutates request or response
   */
  return function aegisMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    if (enableSTTFExtraction) {
      try {
        // Note: req.originalUrl does NOT contain hash fragments in standard
        // HTTP requests. This extraction only works when fragments are
        // explicitly passed via query params or custom headers.
        extractSTTFDirectives(req.originalUrl, req.path);
      } catch {
        // Detection failures must not impact application behavior
      }
    }

    next();
  };
}
