# Development Roadmap

This document tracks implementation phases and deferred work, clarifying which architectural patterns in CLAUDE.md are active now vs. reserved for future iterations.

## Iteration 1: In-Memory CRUD Spike (Current)

**Status:** In Progress

**Scope:**
- Project CRUD (Create, Read, Update, Delete) operations
- In-memory cache (synchronous mutations only)
- Single root render pattern with rAF batching
- Hash-based routing (#project/{id})
- Dumb components + smart connectors architecture
- Basic styling with CSS Grid/Flexbox

**Architectural Notes:**

- **Cache Behavior:** Domain.get() is always synchronous and immediate. No cache misses or async fetches.
- **Skeletons:** Not used in this iteration. Skeletons are UI placeholders rendered while async data is being fetched (relevant when IDB fetches complete asynchronously in future iterations).
- **Effects:** Prepared in state.js dispatch() via queueMicrotask but not yet invoked. Reserved for orchestrated side effects (IndexedDB writes, network requests).
- **State Structure:** UI state only (routing, editing states, selections). No domain data in state.
- **Persistence:** None. All data lives in in-memory cache and is lost on page refresh.

**Deferred to Future Iterations:**
- IndexedDB persistence layer
- Service Worker & offline support
- Async domain cache misses & fulfillment dispatch
- Skeleton rendering while async fetches complete
- Effects pipeline for orchestrated side effects
- Domain Queries for reusable derived calculations
- Archive/read-only project state
- Overview page (project listing)

---

## Iteration 2: IndexedDB Persistence (Planned)

**Scope (Tentative):**
- Write-through cache: mutations update RAM + trigger IDB saves
- Per-ID persistence queuing (prevent "last write wins")
- Cache miss handling: synchronous return undefined + queued async fetch
- Fulfillment dispatch to re-render when async data arrives
- Two-step render process (skeleton while loading)
- Error handling for failed writes

**CLAUDE.md Sections That Will Activate:**
- Domain Modules → Cache Miss (The "Unknown") (lines 37-42)
- Domain Modules → Persistence Guarantee (lines 44-54)
- Handlers and Effects → Effects (lines 87)
- UDF Dispatcher Pipeline → Effect Execution (lines 71-75)

---

## Iteration 3: Service Worker & Offline (Planned)

**Scope (Tentative):**
- Service Worker registration & caching
- NetworkFirst cache strategy for JS/CSS
- Offline-first data access (read from IDB, write to IDB)
- Cache invalidation via SW_VERSION

**CLAUDE.md Sections That Will Activate:**
- Service Worker & Cache Strategy (lines 136-149)

---

## Reference: Which CLAUDE.md Guidance Applies When

| CLAUDE.md Section | Current (Iteration 1) | Future (Iteration 2+) |
|-------------------|----------------------|----------------------|
| Critical Boundaries | ✅ Fully applicable | ✅ Fully applicable |
| Core Constraints | ✅ Fully applicable | ✅ Fully applicable |
| Domain Modules (Cache Miss, Persistence Guarantee) | ⚠️ Partial (cache only, no IDB) | ✅ Fully applicable |
| UDF Dispatcher Pipeline | ✅ Partial (rAF batching active, effects framework ready) | ✅ Fully applicable |
| Component Architecture (Skeletons) | ⚠️ Not used yet (no async fetches) | ✅ Fully applicable |
| Service Worker & Cache Strategy | ❌ Not implemented | ✅ Fully applicable |
| Definition of Done (Persistence Guarantee, Race Condition Check) | ⚠️ Skip these items now | ✅ Fully applicable |

---

## How to Use This Document

**When starting a new task:**
1. Check ROADMAP.md to see what iteration you're in
2. Review the "Deferred" list—don't implement those features yet
3. Refer to CLAUDE.md for architecture guidance (it's iteration-neutral by design)
4. When moving to the next iteration, update ROADMAP.md to mark it active

**When deferring work:**
1. Add it to the "Deferred" list with rationale
2. Document any architectural decisions that depend on it (e.g., "Effects are queued but not executed until Iteration 2")
3. Link from relevant CLAUDE.md sections so future developers understand the dependency
