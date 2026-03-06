Standard Development Rules: Local-First UDF Edition

    [!IMPORTANT]
    CRITICAL ARCHITECTURAL BOUNDARIES

        NO CLASSES / NO OOP: No class, this, or new. Use POJOs and exported functions.

        NO BUILD STEP / ESM ONLY: All imports must use the .js extension (e.g., import { x } from './file.js').

        VANILLA LIT-HTML: Use html tagged templates via CDN.

        LIBRARY PHILOSOPHY: CDN-ready only. Approved: workbox (Service Workers) and idb (IndexedDB).

        ZERO DOMAIN COUPLING: A Domain module must never import another Domain module.

1.  Project Management & Git

    Persistent Todo List: Maintain docs/todo.md. Mark items done; never delete to preserve history.

    Git Workflows: Small, logical chunks with descriptive conventional commit messages.

    ADRs: Document any tradeoff made against these rules, especially regarding new library additions.

2.  Core Architectural Constraints

    Strict No-OOP: Data = POJOs. Logic = Stateless functions.

    Reference by ID: Objects reference each other via IDs, never direct memory pointers.

    Testing: Prioritize unit tests for Pure Consequence Functions and Rule Processors.

3.  Data Layer & Persistence

    Write-Through Cache: Categorized in-memory cache backed by IndexedDB (via idb).

    State Segregation:

        UI State: Ephemeral flags (e.g., activeTab) and entity IDs only.

        Canonical Data: Domain POJOs live only in the Cache. Never duplicate in UI state.

4.  Domain Modules (The Nouns)

    Responsibility: Schema (Factories) and atomic mutations.

    Mandatory Factory: Must export a factory (e.g., createActor(id, overrides)) defining mandatory schema and default values.

    Isolation: Strictly forbidden to import other domains.

    Domain Selectors: Functions for single-entity calculations live here.

    Gatekeeping: Use defensive guard clauses (e.g., if (!entity?.health) return;) regardless of factory guarantees.

5.  The UDF Dispatcher Pipeline

State changes follow a synchronous-to-deferred pipeline to prevent re-entrancy:

    Synchronous Reducer: Mutation via Modular Mutators (No central root reducer).

        Signature: (state, action) => { state: nextState, effects: [] }.

    Batched Render: Defer DOM updates using requestAnimationFrame.

    Effect Execution: Trigger effects[] via queueMicrotask.

        Rule: All effects (e.g., API calls, IDB writes) must re-enter the loop by dispatching a new action upon completion.

6.  Orchestrators, Services, & Selection Logic

    Orchestrators: The only layer allowed to "couple" domains. They coordinate multi-domain workflows and rules.

    Cross-Domain Selectors: Pure functions that "join" data from multiple domains. Place in js/orchestrators/.

    Services (I/O): Asynchronous wrappers for fetch, idb, and workbox.

7.  UI & CSS Mechanics
    Component Architecture

        Dumb Components: lit-html templates.

            Rule: ZERO logic, math, or string manipulation. (No rounding, formatting, or filtering).

            Constraint: No this. Event handlers are standalone functions that dispatch Intents.

        Smart Components: Containers that call Selectors and pass formatted results to Dumb Components.

            Ghost Layout: Must explicitly render a fragment/skeleton if data is missing to prevent layout collapse.

        Skeletons (Visual Tombstones): Render placeholder fragments for all async/loading states.

Styling & Layout

    Box Model: box-sizing: border-box locked globally.

    Layout: CSS Grid (2D), Flexbox (1D). Use subgrid for alignment.

    Scoped CSS: Prefix all classes with the component name (e.g., .actor-card__label).

    Dynamic Styling:

        Use Class Toggling for boolean states (e.g., .is-active).

        Use Inline CSS Variables for continuous values (e.g., style="--progress: 60%"). Do not manipulate .style.width via JS.

    Ban List: No !important, display: contents, or position: absolute (except overlays/modals).

8. File & Folder Structure

   js/domains/: Isolated factories, mutations, and Domain Selectors.

   js/orchestrators/: Coordination logic and Cross-Domain Selectors.

   js/services/: Async I/O (Workbox, idb, fetch).

   js/ui/mutators/: Modular UI state reducers.

   js/ui/components/: Rendering logic (Smart/Dumb pairs).

Definition of Done (Checklist for AI)

    [ ] No class or this keywords.

    [ ] All imports use the .js extension.

    [ ] Library Check: Service Workers use Workbox; IndexedDB uses idb.

    [ ] Domain Isolation: Does this domain import another domain? (If yes, move logic to Orchestrator).

    [ ] Logic-Free UI: Are math/string operations in a Selector instead of the component?

    [ ] CSS Guardrails: Are classes scoped with prefixes? Are skeletons/ghost layouts implemented?

## Implementation Contracts

See **UI-SPEC.md** for the concrete specification: component inventory, state shape, data models, page layouts, and key interactions for this project.

## Development Process

See **WORKFLOW.md** for commit practices, code organization, and team workflows.
