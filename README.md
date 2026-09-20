# SWE Revision Labs

A focused, mobile-first software engineering revision app.

## Learning model

The app is built around a curated pattern library rather than a live terminal. Each lesson now includes a mental model, poor/better comparison, interactive visualization, use/avoid guidance, trade-offs, tips, source material and optional video where useful:

1. Pick a topic and pattern.
2. Choose TypeScript, JavaScript or Python.
3. Compare a poor/risky implementation with a better version.
4. Change the example inputs.
5. Watch an interactive model of work, state, memory, requests, protocol flow or authority boundaries.
6. Mark the pattern comfortable only when the trade-off is clear.

## Pattern library

The current build contains **73 sourced lessons** across:

- Variables & values
- Functions
- Classes & objects
- Collections & complexity
- Async, HTTP & protocols
- Secure coding
- AI & MCP
- Architecture & compute

Examples are adapted from reputable sources rather than copied verbatim. Each lesson links to its source, including MDN, Python/PEP documentation, the TypeScript Handbook, Node.js, OWASP, IETF RFCs and the Model Context Protocol specification.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

Pushes to `main` deploy through `.github/workflows/pages.yml`.

Live site:

`https://hexrift.github.io/swe-revision-labs/`

## Design

- Mobile first
- Minimal monochrome interface
- One primary task per screen
- Large touch targets
- No account or backend required
- Progress stored in `localStorage`
- Reduced-motion support

## License

MIT


## Architecture & compute

The architecture track covers modular monoliths, microservices, event-driven systems, web/queue/worker, sync vs async boundaries, virtual machines/containers/functions, serverless, Kubernetes workload semantics, stateful vs stateless compute, CQRS, event sourcing, gateways/BFFs, batch vs streaming, cache-aside, big compute and horizontal vs vertical scaling.

The content is grounded in current Microsoft Azure Architecture Center guidance, AWS Well-Architected guidance, Kubernetes documentation, Apache Kafka documentation and Martin Fowler's event-driven architecture distinctions. Architecture lessons emphasize when to use a style, when not to use it, and the operational trade-offs.
