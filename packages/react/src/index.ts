/**
 * @packageDocumentation
 *
 * React integration for Aegis XS-Leak protection framework.
 *
 * @example
 * ```tsx
 * import { useAegis } from '@aegis/react';
 *
 * function App() {
 *   useAegis();
 *   return <YourApp />;
 * }
 * ```
 */

export { useAegis } from './useAegis.js';
export type {
  AegisConfig,
  AegisMode,
  STTFConfig,
  AegisEvent,
} from './useAegis.js';
