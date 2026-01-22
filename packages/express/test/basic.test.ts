import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { aegis } from "../src/index.js";
import type { AegisEvent } from "@aegis/core";

/**
 * @summary
 * Basic integration tests for the Aegis Express adapter.
 *
 * @remarks
 * These tests validate that the Express adapter:
 * - correctly invokes core XS-Leak detection
 * - forwards telemetry events via the registered sink
 * - never interferes with request flow
 *
 * No Express server is created. The middleware is tested
 * in isolation using mocked request objects.
 */
describe("@aegis/express - basic integration", () => {
  let events: AegisEvent[];

  beforeEach(() => {
    events = [];
  });

  it("emits telemetry and calls next() when STTF is present", () => {
    const middleware = aegis({
      telemetry: (event) => {
        events.push(event);
      },
    });

    const req = {
      originalUrl: "/page#:~:text=secret",
    } as Request;

    const res = {} as Response;

    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "XS_LEAK",
      vector: "STTF",
      level: "INFO",
    });

    expect(next).toHaveBeenCalledOnce();
  });

  it("does not emit telemetry when no STTF is present", () => {
    const middleware = aegis({
      telemetry: (event) => {
        events.push(event);
      },
    });

    const req = {
      originalUrl: "/normal-page",
    } as Request;

    const res = {} as Response;

    const next: NextFunction = vi.fn();

    middleware(req, res, next);

    expect(events).toHaveLength(0);
    expect(next).toHaveBeenCalledOnce();
  });

  it("never throws even if the telemetry sink throws", () => {
    const middleware = aegis({
      telemetry: () => {
        throw new Error("sink failure");
      },
    });

    const req = {
      originalUrl: "/page#:~:text=test",
    } as Request;

    const res = {} as Response;

    const next: NextFunction = vi.fn();

    expect(() => {
      middleware(req, res, next);
    }).not.toThrow();

    expect(next).toHaveBeenCalledOnce();
  });
});
