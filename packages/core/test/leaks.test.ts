import { describe, it, expect, beforeEach } from "vitest";
import {
  extractSTTFDirectives,
  parseSTTFFromURL,
  registerTelemetrySink,
  type AegisEvent,
} from "../src/index.js";

/**
 * @summary
 * Core XS-Leak detection tests for Scroll-To-Text Fragment (STTF).
 *
 * @remarks
 * These tests validate STTF syntax extraction from URL strings.
 * They do NOT test real-world attack detection, which requires
 * client-side instrumentation.
 */
describe("Aegis core - STTF directive extraction", () => {
  let events: AegisEvent[];

  beforeEach(() => {
    events = [];
    registerTelemetrySink((event: AegisEvent) => {
      events.push(event);
    });
  });

  describe("parseSTTFFromURL", () => {
    it("extracts single text directive", () => {
      const result = parseSTTFFromURL("/page#:~:text=secret");
      expect(result).toEqual(["secret"]);
    });

    it("extracts range-based directive", () => {
      const result = parseSTTFFromURL("/page#:~:text=start,end");
      expect(result).toEqual(["start,end"]);
    });

    it("extracts context-based directive", () => {
      const result = parseSTTFFromURL("/page#:~:text=prefix-,target,-suffix");
      expect(result).toEqual(["prefix-,target,-suffix"]);
    });

    it("extracts multiple directives", () => {
      const result = parseSTTFFromURL("/page#:~:text=one&text=two&text=three");
      expect(result).toEqual(["one", "two", "three"]);
    });

    it("returns null for standard fragment", () => {
      const result = parseSTTFFromURL("/page#section");
      expect(result).toBeNull();
    });

    it("returns null when no fragment present", () => {
      const result = parseSTTFFromURL("/page");
      expect(result).toBeNull();
    });

    it("handles percent-encoded directives", () => {
      const result = parseSTTFFromURL("/page#:~:text=hello%20world");
      expect(result).toEqual(["hello world"]);
    });

    it("handles malformed URLs gracefully", () => {
      const result = parseSTTFFromURL("not a valid url");
      expect(result).toBeNull();
    });

    it("handles empty text directives", () => {
      const result = parseSTTFFromURL("/page#:~:text=");
      expect(result).toBeNull();
    });
  });

  describe("extractSTTFDirectives", () => {
    it("returns true and emits event when STTF syntax present", () => {
      const result = extractSTTFDirectives("/page#:~:text=secret", "/page");

      expect(result).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        kind: "XS_LEAK",
        vector: "STTF",
        level: "INFO",
        path: "/page",
        detail: "secret",
      });
    });

    it("includes all directives in event detail", () => {
      extractSTTFDirectives("/page#:~:text=one&text=two");

      expect(events[0].detail).toBe("one;two");
    });

    it("returns false and emits no events when no STTF present", () => {
      const result = extractSTTFDirectives("/page#section");

      expect(result).toBe(false);
      expect(events).toHaveLength(0);
    });

    it("never throws even when telemetry sink throws", () => {
      registerTelemetrySink(() => {
        throw new Error("sink failure");
      });

      expect(() => {
        extractSTTFDirectives("/page#:~:text=test");
      }).not.toThrow();
    });

    it("omits path when not provided", () => {
      extractSTTFDirectives("/page#:~:text=test");

      expect(events[0].path).toBeUndefined();
    });
  });
});
