import { describe, it, expect, beforeEach } from "vitest";
import {
  detectSTTF,
  registerTelemetrySink,
  type AegisEvent,
} from "../src";

/**
 * Core XS-Leak detection tests.
 *
 * These tests validate public, observable behavior only.
 * Internal helpers and implementation details are treated
 * as black boxes.
 */

describe("Aegis core – STTF XS-Leak detection", () => {
  let events: AegisEvent[];

  beforeEach(() => {
    events = [];

    // Register a safe telemetry sink for inspection
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

  it("never throws if the telemetry sink throws", () => {
    registerTelemetrySink(() => {
      throw new Error("sink failure");
    });

    expect(() => {
      detectSTTF("/page#:~:text=test");
    }).not.toThrow();
  });
});
