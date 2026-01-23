# @aegis/express

Express middleware adapter for Aegis XS-Leak detection framework.

## Installation

```bash
npm install @aegis/express
```

## Critical Limitations

**This middleware cannot detect XS-Leak attacks from normal browser navigations.**

Hash fragments (everything after `#` in URLs) are client-side only and never transmitted in HTTP requests. The server receives `https://example.com/page` when a user navigates to `https://example.com/page#:~:text=secret`.

This middleware is useful only when:
- Client code explicitly sends full URLs via fetch/beacon
- URLs are passed as query parameters or request body
- Application uses custom URL forwarding mechanisms

For real-world attack detection, use client-side instrumentation (future `@aegis/react` package).

## Usage

### Basic Telemetry Logging

```typescript
import express from "express";
import { aegis } from "@aegis/express";

const app = express();

app.use(
  aegis({
    telemetry: (event) => {
      console.log("Aegis event:", event);
    },
  })
);
```

### Client-Reported URL Endpoint

```typescript
app.post(
  "/api/report-navigation",
  express.json(),
  (req, res) => {
    // Client sends: { fullUrl: "https://app.com/page#:~:text=secret" }
    extractSTTFDirectives(req.body.fullUrl, req.body.path);
    res.sendStatus(204);
  }
);
```

### Integration with Monitoring Dashboard

```typescript
import { ingestEvent } from "@aegis/monitor";

app.use(
  aegis({
    telemetry: ingestEvent,
  })
);
```

## Configuration

```typescript
interface AegisExpressOptions {
  telemetry?: TelemetrySink;
  enableSTTFExtraction?: boolean; // Default: false
}
```

## License

MIT
