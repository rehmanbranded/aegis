# Security Policy

Aegis is a security-focused project. We actively welcome responsible
disclosure of security vulnerabilities affecting **any Aegis package**.

## Scope

This policy applies to all packages in this repository, including but not limited to:

- `@aegis/core`
- `@aegis/express`
- `@aegis/next`
- `@aegis/react`
- `@aegis/monitor`

## What should be reported as a security issue

Report issues **privately** if they involve:

- XS-Leak bypasses or incorrect leak detection
- Authentication or authorization bypass
- Cross-origin data exposure
- Injection vulnerabilities (XSS, HTML injection, template injection)
- Information disclosure through side-channels or telemetry
- Any issue that could be exploited by an attacker

## How to report a vulnerability

Please use **GitHub’s private security advisory feature**:

1. Go to the repository on GitHub
2. Open the **Security** tab
3. Click **Report a vulnerability**

This creates a **private advisory** visible only to maintainers and you.

> !IMPORTANT **Do not open public GitHub issues for security vulnerabilities.**

## What to include in your report

Please include:
- Affected package(s)
- Affected version(s)
- Clear reproduction steps or proof-of-concept
- Impact assessment (if known)

We aim to acknowledge valid reports within **48 hours**.

Thank you for helping keep Aegis and its users safe.
