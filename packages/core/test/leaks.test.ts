import { describe, it, expect, beforeEach } from "vitest";
import {
  detectSTTF,
  registerTelemetrySink,
  type AegisEvent,
} from "../src/index.js";

/**
 * @summary
 * Core XS-Leak detection tests for Scroll-To-Text Fragment (STTF).
 *
 * @remarks
 * These tests validate **public, observable behavior only**.
 *
 * - Internal helpers are treated as black boxes
 * - No assumptions are made about implementation details
 * - Telemetry emission is used as the primary observation mechanism
 */
describe("Aegis core - STTF XS-Leak detection", () => {
  let events: AegisEvent[];

  /**
   * Reset telemetry capture before each test.
   *
   * @remarks
   * A fresh sink is registered for every test to ensure
   * isolation and deterministic assertions.
   */
  beforeEach(() => {
    events = [];

    registerTelemetrySink((event: AegisEvent) => {
      events.push(event);
    });
  });

  it("detects simple Scroll-To-Text Fragment (STTF)", () => {
    const result = detectSTTF("/page#:~:text=secret");

    expect(result).toBe(true);
    expect(events).toHaveLength(1);

    expect(events[0]).toMatchObject({
      kind: "XS_LEAK",
      vector: "STTF",
      level: "INFO",
    });
  });

  it("detects range-based STTF fragments", () => {
    const result = detectSTTF("/page#:~:text=start,end");

    expect(result).toBe(true);
    expect(events).toHaveLength(1);
  });

  it("detects multiple STTF directives in a single URL", () => {
    const result = detectSTTF("/page#:~:text=one&text=two");

    expect(result).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].detail).toBe("one;two");
  });

  it("returns false and emits no events when no STTF is present", () => {
    const result = detectSTTF("/page#section1");

    expect(result).toBe(false);
    expect(events).toHaveLength(0);
  });

  it("never throws even if the telemetry sink throws", () => {
    registerTelemetrySink(() => {
      throw new Error("sink failure");
    });

    expect(() => {
      detectSTTF("/page#:~:text=test");
    }).not.toThrow();
  });
});
