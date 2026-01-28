import { useEffect } from 'react';
import { useSTTFProtection } from './protection/sttf.js';

/**
 * Aegis protection mode presets.
 *
 * @public
 */
export type AegisMode = 'strict' | 'balanced' | 'permissive';

/**
 * STTF (Scroll-To-Text Fragment) protection configuration.
 *
 * @public
 */
export interface STTFConfig {
  /**
   * Enable STTF protection.
   *
   * @defaultValue true
   */
  enabled?: boolean;

  /**
   * Show custom highlight when text is found.
   *
   * @defaultValue true
   */
  showHighlight?: boolean;

  /**
   * Show copy/share UI near highlighted text.
   *
   * @defaultValue true (strict/balanced), false (permissive)
   */
  enableCopyUI?: boolean;

  /**
   * Custom highlight color.
   *
   * @defaultValue '#fef08a'
   */
  highlightColor?: string;

  /**
   * Time budget for noise injection (milliseconds).
   *
   * Higher values increase security but add page load delay.
   *
   * @defaultValue 500 (strict), 300 (balanced), 0 (permissive)
   */
  noiseBudgetMs?: number;
}

/**
 * Aegis configuration options.
 *
 * @public
 */
export interface AegisConfig {
  /**
   * Protection mode preset.
   *
   * Overrides individual STTF settings if provided.
   *
   * - `strict`: Maximum security, 500ms noise budget
   * - `balanced`: Recommended default, 300ms noise budget
   * - `permissive`: Detection only, no UX impact
   *
   * @defaultValue 'balanced'
   */
  mode?: AegisMode;

  /**
   * STTF protection settings.
   *
   * Provides fine-grained control. Ignored if `mode` is set.
   */
  sttf?: STTFConfig;

  /**
   * Telemetry endpoint or handler for security events.
   *
   * - If string: POST endpoint URL
   * - If function: Custom event handler
   * - If undefined: Telemetry disabled
   *
   * @remarks
   * The handler must be non-blocking and fail-safe.
   */
  telemetry?: string | ((event: AegisEvent) => void);

  /**
   * Enable development mode logging.
   *
   * @defaultValue process.env.NODE_ENV === 'development'
   */
  dev?: boolean;
}

/**
 * Aegis security event.
 *
 * @public
 */
export interface AegisEvent {
  /**
   * Event domain discriminator.
   */
  kind: 'XS_LEAK';

  /**
   * XS-Leak attack vector.
   */
  vector: 'STTF' | 'FRAME' | 'TIMING';

  /**
   * Event timestamp (epoch milliseconds).
   */
  timestamp: number;

  /**
   * Optional diagnostic detail.
   *
   * @remarks
   * Must never contain sensitive user data.
   */
  detail?: string;

  /**
   * Request path associated with the event.
   */
  url?: string;
}

const MODE_PRESETS: Record<AegisMode, STTFConfig> = {
  strict: {
    enabled: true,
    showHighlight: true,
    enableCopyUI: true,
    noiseBudgetMs: 500,
    highlightColor: '#fef08a',
  },
  balanced: {
    enabled: true,
    showHighlight: true,
    enableCopyUI: true,
    noiseBudgetMs: 300,
    highlightColor: '#fef08a',
  },
  permissive: {
    enabled: true,
    showHighlight: false,
    enableCopyUI: false,
    noiseBudgetMs: 0,
  },
};

/**
 * @public
 *
 * @summary
 * Main Aegis React hook for XS-Leak protection.
 *
 * @param config - Optional configuration. Defaults to 'balanced' mode.
 *
 * @remarks
 * This hook provides comprehensive protection against browser-based
 * side-channel attacks (XS-Leaks) without breaking legitimate UX.
 *
 * **Call this hook once** at your application root (App.tsx or layout.tsx).
 *
 * **Protection Strategy:**
 * 1. Intercepts browser scroll before it occurs
 * 2. Normalizes resource loading (noise injection)
 * 3. Implements custom scroll after noise phase
 * 4. Provides enhanced highlight and copy UI
 *
 * **Modes:**
 * - `strict`: Maximum security (500ms noise budget). Use for banking, healthcare.
 * - `balanced`: Recommended default (300ms noise budget). Good security/UX balance.
 * - `permissive`: Detection only (no noise). Use for public content, blogs.
 *
 * @example
 * ### Simplest usage (balanced mode)
 * ```tsx
 * import { useAegis } from '@aegis/react';
 *
 * function App() {
 *   useAegis();
 *   return <YourApp />;
 * }
 * ```
 *
 * @example
 * ### High-security mode
 * ```tsx
 * function BankingApp() {
 *   useAegis({ mode: 'strict' });
 *   return <Dashboard />;
 * }
 * ```
 *
 * @example
 * ### Custom configuration
 * ```tsx
 * function App() {
 *   useAegis({
 *     sttf: {
 *       highlightColor: '#a7f3d0',
 *       noiseBudgetMs: 400,
 *     },
 *     telemetry: '/api/security/events',
 *   });
 *   return <MyApp />;
 * }
 * ```
 *
 * @example
 * ### Custom telemetry handler
 * ```tsx
 * function App() {
 *   useAegis({
 *     mode: 'strict',
 *     telemetry: (event) => {
 *       console.log('[Security]', event);
 *       analytics.track('xs_leak_detected', event);
 *     },
 *   });
 *   return <App />;
 * }
 * ```
 *
 * @example
 * ### Next.js App Router
 * ```tsx
 * // app/layout.tsx
 * import { useAegis } from '@aegis/react';
 *
 * export default function RootLayout({ children }) {
 *   useAegis();
 *   return (
 *     <html>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function useAegis(config: AegisConfig = {}) {
  const {
    mode = 'balanced',
    sttf: customSTTF,
    telemetry,
    dev = process.env.NODE_ENV === 'development',
  } = config;

  // Resolve final STTF config (preset or custom)
  const sttfConfig: STTFConfig = customSTTF || MODE_PRESETS[mode];

  // Telemetry handler
  const handleTelemetry = (event: AegisEvent) => {
    if (!telemetry) return;

    if (typeof telemetry === 'function') {
      try {
        telemetry(event);
      } catch (err) {
        if (dev) {
          console.error('[Aegis] Telemetry handler error:', err);
        }
      }
    } else {
      // POST to endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          telemetry,
          new Blob([JSON.stringify(event)], { type: 'application/json' })
        );
      } else {
        fetch(telemetry, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        }).catch(() => {
          // Ignore telemetry errors
        });
      }
    }
  };

  // STTF Protection
  useSTTFProtection({
    enabled: sttfConfig.enabled,
    showHighlight: sttfConfig.showHighlight,
    enableCopyUI: sttfConfig.enableCopyUI,
    highlightColor: sttfConfig.highlightColor,
    noiseBudgetMs: sttfConfig.noiseBudgetMs,
    onDetected: (fragments) => {
      handleTelemetry({
        kind: 'XS_LEAK',
        vector: 'STTF',
        timestamp: Date.now(),
        detail: fragments.join(';'),
        url: window.location.pathname,
      });

      if (dev) {
        console.warn('[Aegis] STTF detected:', fragments);
      }
    },
  });

  // Dev mode initialization log
  useEffect(() => {
    if (dev) {
      console.log('[Aegis] Protection enabled:', {
        mode: customSTTF ? 'custom' : mode,
        sttf: sttfConfig,
        telemetry: !!telemetry,
      });
    }
  }, [dev, mode, customSTTF, sttfConfig, telemetry]);
}
