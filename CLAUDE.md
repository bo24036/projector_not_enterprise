# Standard Development Rules: Local-First UDF Edition

> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL BOUNDARIES**
>
> - NO CLASSES / NO OOP: No class, this, or new. Use POJOs and exported functions.
> - NO BUILD STEP / ESM ONLY: All imports must use the .js extension (e.g., import { x } from './file.js').
> - VANILLA LIT-HTML: Use html tagged templates via CDN.
> - LIBRARY PHILOSOPHY: CDN-ready only. Minimize dependencies. Approved: workbox (Service Workers) and idb (IndexedDB).
> - ZERO DOMAIN COUPLING: A Domain module must never import another Domain module.
> - NO MAGIC VALUES: use constants instead of bare values.

## Project Management & Git

- Git Workflows: Small, logical chunks with descriptive conventional commit messages.
- ADRs: When adding libraries, using classes, or making other tradeoffs against these rules, document the decision in `docs/adr/NNNN-title.md`. Include: Context (why the decision was needed), Decision (what we chose), Rationale (why), and Consequences (impacts).

## Core Architectural Constraints

- Reference by ID: Objects reference each other via IDs, never direct memory pointers.
- Testing Strategy:
  - Domains (Factories, Queries, Change Functions): Fully testable (pure, synchronous). Test schema, edge cases, mutations, and persistence queue triggers.
  - Handlers: Fully testable (mocked state, mocked domains). Assert state mutations and effect generation.
  - Effects: Testable (mocked async operations). Assert fulfillment dispatch.
  - Connectors: Partially testable. Extract reusable formatting to Domain Queries. Test complex data selection or conditional logic; simple selections are usually verified visually.
  - Dumb Components: Optional (pure templates, no logic).
  - File Structure: Tests live alongside source. Naming: `EntityType.test.js`.

## Data Layer & Persistence

- UI State: Ephemeral flags (e.g., activeTab) and entity IDs only.
- Canonical Data: Domain POJOs live only in the Cache and indexedDB. Never duplicate in UI state.

## Domain Modules (The Nouns)

- Responsibility: Schema (Factories), persistence, and atomic changes to pojo data.
- Synchronous Source of Truth: The in-memory Cache is the primary source of truth. All reads and changes are synchronous. domain.get(id) is ALWAYS synchronous — never await it or return a promise.
- Persistence Guarantee (Write-Through): Every change function is a Gatekeeper. It must:
  - Update the in-memory Cache synchronously. UI reflects this immediately.
  - Trigger a fire-and-forget Serialized Background Save to IndexedDB. If write succeeds, no dispatch is needed. If write fails:
    - Log error to console for debugging.
    - For critical operations (explicit deletions, user-initiated saves): Dispatch error action to notify user and offer recovery.
    - For routine mutations (inline edits): Silent failure is acceptable; a subtle non-invasive visual indicator is sufficient.
  - Serialized Persistence (The Guard): Writes to the same collection/ID must be queued and executed in order. Debounce: only persist the final state once the previous write completes. Priority: prevent "last write wins" errors.
- Cohesion: Domain modules own coordination of their logic and immediate write-through persistence. Handlers and effects do not "remember" to save.
- Mandatory Factory: Must export a factory (e.g., createActor(id, overrides)) defining mandatory schema and default values.
- Isolation: Strictly forbidden to import other domains.
- Domain Queries: Pure functions for single-entity derived calculations. Signature: `(entityId, ...params) => value`.
  - Use when: Calculation is reused across multiple connectors or components.
  - Use local connector code when: One-off formatting for a single component.
- Gatekeeping: Use defensive guard clauses (e.g., if (!entity?.health) return;) regardless of factory guarantees.

## The UDF Dispatcher Pipeline

State changes follow a synchronous-to-deferred pipeline to prevent re-entrancy:

- Synchronous state handler: Pure function. Signature: `(state, action) => { state: nextState, effects: [] }`. No awaits.
- Synchronous state update: setState **immediately** applies updates so effects and subsequent handlers see current state.
- Batched Render: Defer DOM updates using `requestAnimationFrame`.
- Effect Execution: Trigger effects[] via `queueMicrotask` (runs before rAF, can dispatch actions safely).
  - Orchestrated effects must dispatch a fulfillment action upon completion.
  - Effects triggered by user intent must validate context before dispatching (e.g., has user navigated away?).
  - Stale Prevention: Only the most recent in-flight result updates state. Cancel or ignore earlier results.
- Change Initiation: Domain object changes must only be initiated by State Handlers or Effects.
- 1:1 Handler Mapping: Each Action Type maps to exactly one State Handler.
  - Coordination: One handler calls change functions for all involved domains in dependency order.
  - All-or-Nothing: If any domain call fails (throws), the handler does NOT update state and returns no effects.

## Handlers and Effects (The Verbs)

- The only places allowed to couple domains. Coordinate multi-domain workflows.
- State Handlers: Always synchronous. Return `{ state, effects }`.
- Effects: Async I/O or timers. Must dispatch a new action upon completion to re-enter the loop.
- Formatting: Connectors use Domain Queries or local code. Dumb Components receive only final display values.

## UI & CSS Mechanics

### Component Architecture

- Dumb Components: lit-html templates. ZERO logic, math, or string manipulation. No this. Event handlers dispatch Actions.
- Connectors: Bridge Domain Data and UI State to Dumb Components. Pull fresh state/data and re-render. Render Skeleton if get(id) returns undefined.
- Rendering: Single Root Render Pattern — dispatch → handler → setState → rAF → root render. All connectors receive the same state snapshot.
- Template Conditionals: Render different components based on state (e.g., `isCreating ? InputForm : Button`). Use CSS class toggling only for show/hide within the same component.

### Styling & Layout

- Box Model: box-sizing: border-box globally.
- Layout: CSS Grid (2D), Flexbox (1D). Use subgrid for alignment.
- Scoped CSS: Prefix all classes with the component name (e.g., .actor-card\_\_label).
- Dynamic Styling: Class toggling for boolean states. Inline CSS variables for continuous values (e.g., `style="--progress: 60%"`). Do not manipulate `.style.width` via JS.
- Ban List: No !important, display: contents, or position: absolute.
  - Exception: Only with explicit user approval. Before using position: absolute, describe the use case and ask for confirmation.
- HTML-First: Use native HTML capabilities (autofocus, disabled, form elements, semantic tags) before CSS solutions.

## Service Worker & Cache Strategy

App is fully offline with no backend.

- **Source of Truth:** IndexedDB. In-memory cache is write-through synced with IDB.
- **Service Worker:** Caches JS/CSS for offline access only — not a data source.
- **Cache Invalidation:** Increment `SW_VERSION` in main.js when modifying service-worker.js, refactoring JS, adding CSS files, or changing data formats.

## Implementation Contracts

See **UI-SPEC.md** for the concrete specification: component inventory, state shape, data models, page layouts, and key interactions.

## Development Process

See **WORKFLOW.md** for commit practices, code organization, and team workflows.
