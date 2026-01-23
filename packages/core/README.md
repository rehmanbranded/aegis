# @aegis/core

Framework-agnostic XS-Leak detection and telemetry core.

## Installation

```bash
npm install @aegis/core
```

## Overview

`@aegis/core` provides low-level primitives for XS-Leak detection. It does NOT provide automatic attack mitigation.

## Key Exports

### `extractSTTFDirectives(url, path?)`

Extracts Scroll-To-Text Fragment syntax from URL strings.

**Important:** This function performs string parsing only. It cannot detect real-world attacks without client-side instrumentation.

```typescript
import { extractSTTFDirectives } from "@aegis/core";

// Returns true if STTF syntax found
const hasSTTF = extractSTTFDirectives(
  "https://example.com/page#:~:text=secret",
  "/page"
);
```

### `parseSTTFFromURL(url)`

Pure parsing function with no side effects.

```typescript
import { parseSTTFFromURL } from "@aegis/core";

const directives = parseSTTFFromURL("/page#:~:text=one&text=two");
// => ["one", "two"]
```

### `registerTelemetrySink(fn)`

Registers a callback to receive security events.

```typescript
import { registerTelemetrySink } from "@aegis/core";

registerTelemetrySink((event) => {
  if (event.kind === "XS_LEAK") {
    console.log(`Detected ${event.vector}:`, event.detail);
  }
});
```

## Architectural Notes

### Why Server-Side Detection is Limited

Hash fragments are defined by RFC 3986 as client-side only. When a browser navigates to `https://example.com/page#:~:text=secret`, the HTTP request contains only `https://example.com/page`.

Real-world XS-Leak detection requires:
1. Client-side instrumentation (monitoring scroll, focus, timing)
2. Reporting to server via explicit API calls
3. Server-side correlation and rate limiting

This package provides the server-side foundation. Client instrumentation will be provided by future `@aegis/react` package.

## License

MIT
