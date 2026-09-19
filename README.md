# SWE Revision Labs

A focused, local-first revision app for senior software engineers and above.

**Daily flow:** choose a topic → choose a subtopic → choose TypeScript, JavaScript or Python → understand → visualize → code → self-check → mark comfortable → move on.

## What is included

- 12 senior SWE domains covering complexity, algorithms, concurrency, system design, distributed systems, architecture, networking/protocols, databases, secure coding, reliability/observability, testing/delivery, and AI/MCP engineering.
- A deliberately deep complexity track: growth classes, time vs space, hidden allocations, amortized/expected analysis, recursion/DP, JS/TS traps, Python traps, and system-boundary complexity.
- Interactive SVG/CSS visual models rather than static documentation walls.
- Monaco Editor loaded in-browser.
- Live JavaScript/TypeScript execution inside a disposable Web Worker with a hard timeout and no network access.
- Live Python execution through Pyodide in a disposable worker. The first Python run downloads the runtime from jsDelivr.
- Bad → better code comparisons and hands-on exercises.
- Local progress, language preference, code and final-exam state stored in `localStorage`; no account and no backend.
- Fixed 48-question comprehensive final review covering all 12 domains.
- Trusted references from standards, official documentation, university material, Google SRE, Amazon Builders' Library, OWASP, Martin Fowler, Martin Kleppmann and others.

## Run locally

This is a static site. Because it uses ES modules, serve it instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. Once GitHub Pages is configured to use **GitHub Actions** as its publishing source, pushes to `main` deploy automatically.

Expected project URL:

`https://hexrift.github.io/swe-revision-labs/`

## Runtime security model

The coding lab is intentionally browser-only. JavaScript/TypeScript code executes in a disposable Worker that disables `fetch`, `XMLHttpRequest` and `WebSocket`, and the worker is terminated after a timeout. Python runs in a disposable Pyodide worker with outbound fetch disabled after runtime boot. This is a learning sandbox, not a hardened multi-tenant production sandbox.

## Design principles

- Progressive disclosure: only one lab stage is visible at a time.
- Explicit confidence: progress changes only when the learner marks a lab comfortable.
- Recall before recognition: the final self-check asks the learner to explain and defend trade-offs rather than reread notes.
- Language-aware, not language-trapped: concepts stay language-agnostic while examples expose JavaScript/TypeScript and Python idioms.
- Evidence over slogans: architecture and reliability topics are linked back to standards and reputable source material.

## License

MIT
