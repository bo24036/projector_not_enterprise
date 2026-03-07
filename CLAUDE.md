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
- ADRs: Document any tradeoff made against these rules, especially regarding new library additions. Get approval.

## Core Architectural Constraints

- Strict No-OOP: Data = POJOs. Logic = Stateless functions.
- Reference by ID: Objects reference each other via IDs, never direct memory pointers.
- Testing: Prioritize unit tests for Pure Consequence Functions and Rule Processors.

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
  - Trigger a fire-and-forget Serialized Background Save to IndexedDB which does not require a completion dispatch unless a specific error handling flow is required.
  - Serialized Persistence (The Guard): Domains must treat IDB writes as Sequential Effects.
    - Writes to the same collection/ID must be queued and executed in order.
    - Debouncing Writes: If multiple mutations happen to the same ID in rapid succession, the Domain should only persist the final state to IDB once the previous write transaction is complete.
    - Implementation approach is flexible (per-ID queues, transaction logs, etc.). Priority: prevent "last write wins" errors.
- Cohesion: Domain modules own the coordination of their specific logic and its immediate write-through persistence. They do not rely on state handlers or effects to "remember" to save.
- Mandatory Factory: Must export a factory (e.g., createActor(id, overrides)) defining mandatory schema and default values.
- Isolation: Strictly forbidden to import other domains.
- Domain Queries: Pure functions for single-entity derived calculations. Signature: `(entityId) => value`.
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
  - Constraint: No this. Event handlers are standalone functions that dispatch Intents.
- Connectors: Domain-aware "Smart" components.
  - Role: They bridge Domain Data (via Domain.get) and UI State (via the Dispatcher/State store) to Dumb Components.
  - Reactivity: They pull fresh state/domain data and re-render their child Dumb Components with fresh props.
  - Skeleton Trigger: If domain data is required but get(id) returns undefined, render a Skeleton.
- Skeletons (Visual Tombstones): Render placeholder fragments for all async/loading states.

### Styling & Layout

- Box Model: box-sizing: border-box locked globally.
- Layout: CSS Grid (2D), Flexbox (1D). Use subgrid for alignment.
- Scoped CSS: Prefix all classes with the component name (e.g., .actor-card\_\_label).
- Dynamic Styling:
  - Use Class Toggling for boolean states (e.g., .is-active).
  - Use Inline CSS Variables for continuous values (e.g., style="--progress: 60%"). Do not manipulate .style.width via JS.
- Ban List: No !important, display: contents, or position: absolute (except overlays/modals).

## File & Folder Structure

- js/domains/: Isolated factories, object changers, persistence, and Domain Queries.
- js/handlers/: Modular UI state handlers that update state and trigger effects.
- js/effects/: Asynchronous side-effect logic (I/O, fetches, timers).
- js/utils/: Synchronous utility functions that meet commonly recurring needs.
- js/ui/components/: Rendering logic for dumb components.
- js/ui/connectors/: Domain-specific (one or more) data-binding components (Smart components). These connect state and domains to dumb components.

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
