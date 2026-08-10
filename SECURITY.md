# Security Policy

## Supported versions

Nika UI is pre-1.0. Only the latest release receives security fixes.

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |
| < latest | ❌       |

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private vulnerability reporting: go to the **Security** tab of
this repository and choose **Report a vulnerability**. This opens a private
channel visible only to maintainers.

Please include:

- What the vulnerability allows an attacker to do
- Steps to reproduce it
- Affected version or commit
- Any suggested fix

You can expect an acknowledgement within 7 days and an assessment within 30.

## Scope

In scope:

- The `nikaui` CLI, including how it resolves credentials and fetches sources
- Component source in `packages/registry`
- This repository's build and release workflows

Out of scope:

- Vulnerabilities in dependencies — report those upstream
- Anything requiring an attacker to already control the developer's machine
