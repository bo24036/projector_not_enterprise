# Standard Development Rules: Local-First UDF Edition

> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL BOUNDARIES**
>
> - NO CLASSES / NO OOP: No class, this, or new. Use POJOs and exported functions.
> - NO BUILD STEP / ESM ONLY: All imports must use the .js extension (e.g., import { x } from './file.js').
> - VANILLA LIT-HTML: Use html tagged templates via CDN.
> - LIBRARY PHILOSOPHY: CDN-ready only. Minimize dependencies. Approved: workbox (Service Workers) and idb (IndexedDB).
> - ZERO DOMAIN COUPLING: A Domain module must never import another Domain module.

## Project Management & Git

- Git Workflows: Small, logical chunks with descriptive conventional commit messages.
- ADRs: When adding libraries, using classes, or making other tradeoffs against these rules, document the decision in `docs/adr/NNNN-title.md`. Include: Context (why the decision was needed), Decision (what we chose), Rationale (why), and Consequences (impacts).

## Core Architectural Constraints

- Strict No-OOP: Data = POJOs. Logic = Stateless functions.
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
- Cache Miss (The "Unknown"): If get(id) is a miss, it SYNCHRONOUSLY returns undefined and simultaneously queues an async fetch (side effect). The get() function itself NEVER awaits or returns a promise. Render uses this synchronous result immediately.
- Two-Step Render Process: Component calls domain.get(id) → receives undefined synchronously → renders skeleton. Meanwhile, async fetch completes in background → dispatches fulfillment action → component re-renders with entity.
- CRITICAL: domain.get(id) is ALWAYS synchronous.
  - ✅ DO: `const entity = Projects.get(id); return skeleton if !entity else entity;`
  - ❌ DON'T: `await Projects.get(id)` or return promises.
- The Fulfillment Dispatch: When the queued async fetch completes and populates the cache, it MUST dispatch a fulfillment action (e.g., ENTITY_LOADED) to trigger a re-render. Component automatically picks up fresh entity from cache on next render.
- Synchronous Source of Truth: The in-memory Cache is the primary source of truth. All reads and changes are synchronous.
- Persistence Guarantee (Write-Through): Every change function (e.g., archiveEntity(id)) is a Gatekeeper. It must:
  - Update the in-memory Cache synchronously. UI reflects this immediately.
  - Trigger a fire-and-forget Serialized Background Save to IndexedDB. If write succeeds, no dispatch is needed (state is already in cache). If write fails:
    - Log error to console for debugging.
    - For critical operations (explicit deletions, user-initiated saves): Dispatch error action to notify user and offer recovery (retry, undo, etc.).
    - For routine mutations (inline edits): Silent failure is acceptable. Cache remains valid; data persists on next successful write or user refresh. UI doesn't need to interrupt user but some subtle, non-invasive visual indicator that changes aren't saving should be included.
  - Serialized Persistence (The Guard): Domains must treat IDB writes as Sequential Effects.
    - Writes to the same collection/ID must be queued and executed in order.
    - Debouncing Writes: If multiple mutations happen to the same ID in rapid succession, the Domain should only persist the final state to IDB once the previous write transaction is complete.
    - Implementation approach is flexible (per-ID queues, transaction logs, etc.). Priority: prevent "last write wins" errors.
- Cohesion: Domain modules own the coordination of their specific logic and its immediate write-through persistence. They do not rely on state handlers or effects to "remember" to save.
- Mandatory Factory: Must export a factory (e.g., createActor(id, overrides)) defining mandatory schema and default values.
- Isolation: Strictly forbidden to import other domains.
- Domain Queries: Pure functions for single-entity derived calculations. Signature: `(entityId, ...params) => value`.
  - Primary parameter is always the entity ID. Additional parameters (e.g., context dates, filter options) may be passed as needed.
  - Use Domain Queries when: Calculation is reused across multiple connectors or components.
  - Use Local Code in Connector when: Calculation is one-off formatting for a single component.
  - Module Layout: Exports alongside factories and change functions. Import in connectors via `import { queryFunction } from '../domains/EntityType.js'`.
- Gatekeeping: Use defensive guard clauses (e.g., if (!entity?.health) return;) regardless of factory guarantees.

## The UDF Dispatcher Pipeline

State changes follow a synchronous-to-deferred pipeline to prevent re-entrancy:

- Synchronous state handler: Update state via Modular State Handler (No central root state handler).
  - Signature: `(state, action) => { state: nextState, effects: [] }`.
- Batched Render: Defer DOM updates using `requestAnimationFrame`.
- Effect Execution: Trigger effects[] via `queueMicrotask`.
  - Rule: Orchestrated effects (cross-domain work, computed UI state) must dispatch a fulfillment action upon completion.
  - Effect Re-Entry Context: Effects triggered in response to user intent must validate context before dispatching (e.g., has user navigated away? is this query still current?).
  - Stale Prevention: If multiple similar effects are in-flight, only the most recent result updates state. Cancel or ignore earlier results.
  - Domain Cache Misses: Automatic cache miss fetches (POJOs loaded from IDB into cache) are internal domain mechanics, not orchestrated effects. They always safely dispatch ENTITY_UPDATED and are not subject to stale-result problems.
- Change Initiation: Domain object changes must only be initiated by State Handlers or Effects. State Handlers trigger a re-render via the Batch Render cycle; Effects must dispatch a new action to re-enter the loop and trigger a render.
- 1:1 Handler Mapping: Each Action Type must map to exactly one State Handler.
  - Coordination: If an action affects multiple domains, the designated State Handler is responsible for calling the change functions for all involved domains in the required order.
    - All-or-Nothing Semantics: If any domain call fails (throws), the handler does NOT update state and returns no effects. UI remains unchanged.
    - Call Order: Invoke domains in dependency order (e.g., children before parent if deleting). This minimizes risk if an error occurs mid-sequence.
  - Benefit: Prevents race conditions and ensures a single, traceable "Logic Path" for every user intent.

## Handlers and Effects (The Verbs)

- Handlers and Effects: The only places that are allowed to "couple" domains. They coordinate multi-domain workflows and rules.
- State Handlers: The "Brain" of the frame. They are always synchronous. They coordinate multi-domain logic, trigger Domain object changes, update UI state, and return a list of effects.
- Effects (Side Effects): Asynchronous I/O or timers. They are triggered after the render. They must re-enter the loop by dispatching a new action upon completion.
- Formatting: Connectors use Domain Queries or local code to prepare data. Dumb Components receive only final display values.

## UI & CSS Mechanics

### Component Architecture

- Dumb Components: lit-html templates.
  - Rule: ZERO logic, math, or string manipulation. (No rounding, formatting, or filtering).
  - Constraint: No this. Event handlers are standalone functions that dispatch Actions.
- Connectors: Domain-aware "Smart" components.
  - Role: They bridge Domain Data (via Domain.get) and UI State (via the Dispatcher/State store) to Dumb Components.
  - Reactivity: They pull fresh state/domain data and re-render their child Dumb Components with fresh props.
  - Skeleton Trigger: If domain data is required but get(id) returns undefined, render a Skeleton.
- Skeletons (Visual Tombstones): Render placeholder fragments for all async/loading states.

### Rendering Strategy

- **Single Root Render Pattern:** On state change, trigger a root-level re-render of the entire component tree. Do not manage fine-grained subscriptions per component or per state key.
- **Mechanism:** Dispatch action → State Handler updates state → rAF batches update → Root render function executes.
- **Root Render Setup:** Register root renderer via `setRootRenderer(fn)` before initializing routes. Root render function pulls fresh state and calls each connector with state as parameter.
- **Connector Responsibility:**
  1. Receive state as a parameter (no subscriptions)
  2. Call own domain queries to fetch data (e.g., `Project.getAllProjects()`)
  3. Render with fresh props synchronously
- **State Consistency:** All connectors in a render cycle receive the same state snapshot, preventing race conditions.
- **DOM Efficiency:** lit-html's virtual DOM diffing ensures only changed DOM nodes are updated. No manual optimization needed.

### Styling & Layout

- Box Model: box-sizing: border-box locked globally.
- Layout: CSS Grid (2D), Flexbox (1D). Use subgrid for alignment.
- Scoped CSS: Prefix all classes with the component name (e.g., .actor-card\_\_label).
- Dynamic Styling:
  - Use Class Toggling for boolean states (e.g., .is-active).
  - Use Inline CSS Variables for continuous values (e.g., style="--progress: 60%"). Do not manipulate .style.width via JS.
- Ban List: No !important, display: contents, or position: absolute.
  - Exception: Only with explicit user approval. Before using position: absolute to solve a layout problem, describe the use case and ask for confirmation.
- HTML-First: Don't use CSS tricks, hacks, or workarounds when HTML can do things more simply. Use native HTML capabilities (autofocus, disabled, form elements, semantic tags) before reaching for CSS solutions.

## File & Folder Structure

- js/domains/: Isolated factories, object changers, persistence, and Domain Queries.
- js/handlers/: Modular UI state handlers that update state and trigger effects.
- js/effects/: Asynchronous side-effect logic (I/O, fetches, timers).
- js/utils/: Synchronous utility functions that meet commonly recurring needs.
- js/ui/components/: Rendering logic for dumb components.
- js/ui/connectors/: Domain-specific (one or more) data-binding components (Smart components). These connect state and domains to dumb components.

## Service Worker & Cache Strategy

This app operates fully offline with no backend. Service Worker caching and IndexedDB persistence must stay in sync:

- **Source of Truth:** IndexedDB holds canonical data (projects, tasks, people, notes).
- **In-Memory Cache:** Write-through synced with IDB. Domain.get() reads from cache; mutations update cache synchronously and trigger background IDB writes.
- **Service Worker Cache:** Caches JS/CSS for offline access and performance. NOT a source of truth—purely a performance layer.
- **Cache Strategy (NetworkFirst):** Attempt to fetch from network (dev server) first. If network is unavailable or times out, fall back to cached version.
  - Dev: Network wins. Ensures fresh code on every reload during development.
  - Production/Offline: Cache wins. App works without network; stale code serves until user navigates and network reconnects.
- **Cache Invalidation:** When you modify service-worker.js or change JS/CSS structure, increment `SW_VERSION` in main.js. This forces fresh code download on next page load.
  - Why: Browser cache key includes version. Bumping version = new cache bucket = fresh files downloaded.
  - When: Any change to service-worker.js, significant JS refactoring, new CSS files, breaking data format changes.
- **Offline Behavior:** User edits work fully offline. Changes persist to IDB immediately. SW serves cached code. On reconnect (or next visit), fresh code loads and sees correct IDB state.

## Definition of Done (Checklist for AI)

- [ ] No class or this keywords.
- [ ] Object change Flow: Does the change update the cache synchronously without waiting for a dispatch? Does it also trigger the persistence write?
- [ ] All imports use the .js extension.
- [ ] Library Check: Service Workers use Workbox; IndexedDB uses idb.
- [ ] Domain Isolation: Does this domain import another domain? (If yes, move logic to state handler or effect).
- [ ] Logic-Free UI: Are math/string operations or formatting moved to a Connector or Domain Query instead of the Dumb Component?
- [ ] CSS Guardrails: Are classes scoped with prefixes? Are skeletons/ghost layouts implemented?
- [ ] Persistence Guarantee: Does the domain mutation update the cache synchronously and trigger the background save?
- [ ] Race Condition Check: For entities that receive rapid mutations, does the persistence layer queue writes per ID? Does rapid mutation of the same entity result in a single final write (not multiple competing writes)? Are writes deduplicated by debouncing?

## Implementation Contracts

See **UI-SPEC.md** for the concrete specification: component inventory, state shape, data models, page layouts, and key interactions for this project.

## Development Process

See **WORKFLOW.md** for commit practices, code organization, and team workflows.
