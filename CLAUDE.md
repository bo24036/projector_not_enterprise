AI System Prompt: Local-First UDF Architecture
Core Constraints
• Tech Stack: Vanilla JavaScript (ESM), `lit-html` (via CDN), IndexedDB.

• No Build Steps: Strictly no Webpack, Vite, Babel, TypeScript, or JSX.

• Paradigm: Strict Unidirectional Data Flow (UDF) and functional Entity-Component patterns. No OOP Classes.

1. State & Persistence (The Write-Through Cache)
   • State Segregation:

• UI State: Store ONLY ephemeral flags (e.g., `isModalOpen`) and entity pointers (IDs). Never duplicate domain POJOs in the UI state.

• Categorized Data: Domain data lives in an in-memory Categorized Write-Through Cache segregated by collections.

• Repositories: Access data strictly through domain wrappers (e.g., `Actors.get(id)`, `Items.set(id, entity)`).

• Cache Sync: The Cache must never call render directly. Upon mutation, it must strictly dispatch an `ENTITY_UPDATED` action through the UDF dispatcher.

2. Domain Modules (The Recorders)
   • Responsibility: Act as the "Source of Truth" for data schema and atomic state mutations.

• Structure: Each domain module (e.g., `actors.js`) must colocate:

• Mandatory Factory: `create<Type>(id, overrides)` to enforce the POJO schema and defaults.

• Pure Consequence Functions: Atomic "What" functions that operate on specific data components.

• Gatekeeping: Interaction functions must use defensive guard clauses (e.g., `if (!entity?.health) return;`) regardless of factory guarantees.

3. The UDF Dispatcher (Execution Model)
   State changes follow this synchronous-to-deferred pipeline:

1. Synchronous Reducer: Mutation happens immediately via Modular Mutators (no central `rootReducer`). Dispatcher delegates based on action type.

• Signature: `(state, action) => { state: nextState, effects: [] }`.

2. Batched Render: Defer DOM updates using `requestAnimationFrame` to batch synchronous changes.

3. Deferred Effects: Execute orchestrator logic via `queueMicrotask` to prevent re-entrant dispatch calls.

4. Orchestrators (The Rule Processors)
   • Responsibility: Manage the "When" and "How." Coordinate complex workflows and cross-domain interactions.

• Logic Hub: Orchestrators are the primary location for "Business Logic" and cross-entity calculations. They fetch entities, perform calculations, and call Domain Consequence functions to apply the results.

• The Write Path: Intent -> Fetch POJOs (via Repositories) -> Process Rules/Calculations -> Execute Domain Mutates -> Repository Save.

• DRY Logic: Extract repetitive calculations into shared utility functions rather than forcing them into inappropriate Domain Modules.

5. Component Architecture
   • Dumb Components (Presentational): Pure functions returning `lit-html` templates. Consume props, dispatch intents.

• Smart Components (Containers): Read pointers from UI state, fetch POJOs from Repositories, and handle fallback rendering (loading/null).

6. Intent vs. Mutation
   • Components dispatch Intents (past-tense events: `ATTACK_RESOLVED`).

• Mutators update UI state and return Effect Intents.

• Orchestrators process the Effect Intents and manage the persistence transaction.
