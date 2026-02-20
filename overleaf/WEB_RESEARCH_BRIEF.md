# Web Research Brief (CampusGo Thesis)

This document is designed to be copy‑pasted into a browsing-capable “web version” model to quickly collect **recent papers, datasets, APIs, and research gaps** for a thesis about the **interaction between convenience (friction reduction) and social interaction** on an integrated campus platform (CampusGo/CampusRide).

---

## 0) One‑Shot Prompt (paste to a web‑browsing model)

You are helping with a thesis literature + data-source review. Please browse the web and deliver:

1) An annotated bibliography (30–45 sources) with BibTeX for each item.
2) For each source: 3–5 bullet summary + how it connects to our research question + what variables/methods it suggests.
3) A “research gap” section that is specific (not generic), with 5–8 gaps and how our thesis fills them.
4) A methods menu: multiple viable models for our data (panel time series, survival, temporal networks, quasi‑experiments, system dynamics), including prerequisites and pros/cons.
5) An external data/API catalog (weather, transit GTFS, OSM, Census, campus calendar, etc.) with links, variable availability, and how each can be used for validation.

Context:
- Platform: CampusGo (integrated campus lifestyle platform) includes rideshare/carpooling, second-hand marketplace, activities/groups, in-app messaging, check-in verification, and some trust features (verification, ratings, reporting).
- Data: event logs with timestamps for messages (sender/receiver/time; **no message content**), posts/listings, bookings, completion/cancellation, activity registration and check-in.
- Time window: March–May (~3 months) in Ithaca, NY (12–13 weeks if aggregated weekly).
- Goal: study the **bidirectional/dynamic interaction** between:
  (A) convenience / friction reduction (e.g., time-to-match, cancellation rate, workflow efficiency),
  (B) social interaction / connectedness (e.g., unique counterpart count, interaction network metrics).
- We have a questionnaire that only validates *need/necessity* (not psychometric scales), so main evidence comes from logs + external APIs.

Deliverables format:
- Start with a table of contents.
- Provide BibTeX blocks for each paper.
- Group sources by theme (platform economics; social capital; online communities; trust & reputation; temporal networks; mobility/ride-sharing; marketplaces; sociotechnical systems; systems engineering & validation).
- For APIs/datasets, include direct links and short usage notes.

---

## 1) Thesis Focus (what we are actually testing)

### Core question
- Does an integrated campus platform create a **feedback loop** where:
  - **Convenience** (lower coordination/search costs) increases **social interaction**, and
  - **Social interaction** further increases **convenience** (faster matching, fewer cancellations, higher completion)?

### Why it’s non-trivial
- No “pre-platform” baseline data is available.
- We cannot use message content; only metadata and outcomes.
- We must rely on **dynamic mechanisms** + **external shocks** for identification/validation.

---

## 2) Available Data (log-based; no new scales)

Minimum events we assume exist (all with timestamps):
- Messaging: `sender_id`, `receiver_id`, `sent_at` (no content)
- Rideshare: ride posted; booking created; booking cancelled; ride completed (or booking completed)
- Marketplace: item posted; user engages (favorite/comment/message); item sold/removed/cancelled (as available)
- Activities: activity created; registration; check-in (possibly code-based / optional location verification)

Recommended analysis granularity:
- Main: **user-week panel** (reduces sparsity, stable estimates)
- Secondary: **listing/trip-level** event chains (time-to-book/time-to-complete)

---

## 3) Key Constructs Without Surveys (operationalization)

### A) Social Interaction (log-based)
Candidate proxy variables (weekly per user):
- `unique_counterparts`: number of distinct users messaged
- `conversation_count`: number of dyads with >=1 message that week
- `message_volume`: number of messages sent/received
- `repeat_interaction_rate`: share of counterparts that were also contacted last week
- `group_activity_participation`: activity registrations/check-ins; group joins (if logged)

Optional temporal-network metrics (weekly network):
- mean degree, density, clustering, component size, reciprocity

Deliverable: a standardized **Social Index** (equal weights, or PCA/factor weights).

### B) Convenience / Low-Friction (log-based)
Candidate proxy variables (weekly per user, or by module then aggregated):
- time-to-first-response: posting → first incoming message / first favorite / first booking
- time-to-book: posting → booking
- time-to-complete: booking → completion (or posting → completion)
- cancellation rate: cancellations / bookings
- workflow “steps”: messages exchanged until completion (count of back-and-forth rounds)

Deliverable: standardized **Convenience Index** (higher = less friction).

---

## 4) Research Gaps (draft; web research should refine)

Gap 1 — Integrated multi-service campus platforms:
- Most studies isolate one market (ride-sharing OR marketplace OR events). Fewer examine **multi-service integration** and cross-module spillovers.

Gap 2 — Bidirectional dynamics (convenience ↔ social) from trace data:
- Literature often treats social ties as inputs or outcomes, not a **feedback loop** with coordination cost/friction.

Gap 3 — Privacy-preserving measurement:
- Many community studies use content/semantic analysis; fewer show robust results using **metadata-only** interaction traces + outcomes.

Gap 4 — External shocks as validation in campus micro-communities:
- Limited evidence on how weather/exam cycles change the social–convenience mechanism in a dense campus setting.

Gap 5 — Mechanism-level explanation (systems perspective):
- Results are often correlational; fewer combine **dynamic models** + **system dynamics** reasoning to explain why effects emerge.

How our thesis fills these:
- Unified event log across modules; dynamic panel + survival analysis; temporal-network evidence; external API moderation/validation; explicit system feedback-loop model.

---

## 5) Methods Menu (multiple viable models)

Pick 1–2 as “main” and keep others as robustness / triangulation.

### Model A — Cross-lag / Panel VAR (primary for interaction)
Use when:
- You want to test **bidirectional lagged effects**: convenience_(t-1) → social_t and social_(t-1) → convenience_t.
Data required:
- user-week panel indices + controls; enough weeks (12–13 is okay).
Outputs:
- coefficients, impulse-response style plots, directionality.
Notes:
- Add user fixed effects + week fixed effects to control heterogeneity and common shocks.

### Model B — Dynamic panel (Arellano–Bond / system GMM)
Use when:
- You suspect strong inertia and need better handling of lagged dependent variables.
Outputs:
- causal-ish dynamic estimates under assumptions; stronger than OLS with lags.

### Model C — Survival / hazard models (listing/trip efficiency)
Use when:
- You want “hard” efficiency claims: social activity predicts **time-to-book/time-to-complete**.
Data required:
- event chain timestamps; censoring handling.
Outputs:
- hazard ratios; survival curves by social quartiles.

### Model D — Event study / interrupted time series (external shocks)
Use when:
- You can code shocks: heavy rain/snow weeks, exam weeks, platform rule changes.
Outputs:
- treatment effect over time; moderation of convenience–social loop.

### Model E — Temporal network analysis (social structure)
Use when:
- You need to show “social connectedness” beyond volume metrics.
Outputs:
- network evolution; community formation; reciprocity; bridging vs bonding patterns.

### Model F — Hawkes/self-exciting processes (optional, advanced)
Use when:
- You suspect “bursty” behavior: messaging spikes trigger bookings/posts and vice versa.
Outputs:
- estimated excitation between event types (messages ↔ bookings).

### Model G — State-space / HMM (latent engagement state)
Use when:
- You want to model hidden states (e.g., dormant/active/transaction-focused/social-focused).
Outputs:
- transition probabilities; how convenience/social shifts state.

### Model H — System dynamics / agent-based simulation (mechanism explanation)
Use when:
- You want a systems-engineering narrative with feedback loops and policy levers.
Outputs:
- simulated trajectories; “what-if” interventions (e.g., stronger verification, default groups).

---

## 6) External APIs / Public Data (easy to find; use for validation & context)

### Weather (Ithaca)
- NOAA (NWS/NCEI) APIs: precipitation, temperature, wind, alerts.
- Alternative: Open-Meteo (simple, no key; good for prototyping).
Use cases:
- Weather as an external shock / moderator of mobility + activity attendance.

### Transit (GTFS)
- Look for TCAT (Tompkins Consolidated Area Transit) GTFS feed or NY regional GTFS.
Use cases:
- “Outside option” strength: better transit coverage may reduce rideshare demand; helps interpret patterns.

### Map / POIs
- OpenStreetMap + Overpass API: POI density, distances, walkability proxies.
Use cases:
- Spatial friction proxies: campus density, POI clustering near activity locations.

### Demographics / Background
- U.S. Census API (ACS): Ithaca/Tompkins County characteristics.
Use cases:
- Contextualize discussion (not necessarily for causal identification).

### Safety / Risk context (optional)
- FBI Crime Data API or local open-data portals (if available).
Use cases:
- Framing trust/safety motivation; careful not to overclaim causality.

### Academic calendar (manual coding)
- Cornell/IC campus calendar pages (often HTML/ICS): spring break, prelims/finals.
Use cases:
- Weekly indicators; interpret demand changes.

---

## 7) Paper Themes to Collect (with search keywords)

Ask the web model to find **recent** (2015–2026) work plus a few foundational classics.

### Theme 1 — Platform economics / two-sided markets / network effects
Keywords:
- "two-sided market campus platform", "platform governance trust verification", "network effects matching markets"
Foundational anchors (verify exact citations):
- Rochet & Tirole (two-sided markets), Armstrong (two-sided competition), Rysman (two-sided market survey), Katz & Shapiro (network effects).

### Theme 2 — Transaction costs / coordination costs / friction
Keywords:
- "coordination cost digital platforms", "search cost reduction online platforms", "friction user behavior conversion"
Anchors:
- Coase, Williamson; plus modern digital transaction-cost papers.

### Theme 3 — Social capital / weak ties / online communities
Keywords:
- "social capital online communities trace data", "weak ties platform interactions", "bridging bonding social capital facebook"
Anchors:
- Granovetter (weak ties), Coleman/Putnam (social capital), Ellison et al. (SNS and social capital).

### Theme 4 — Trust, identity verification, reputation systems
Keywords:
- "reputation systems marketplace trust", "identity verification platform safety", "trust mechanisms peer-to-peer"
Anchors:
- Resnick et al. reputation systems; trust/risk literature in P2P markets.

### Theme 5 — Mobility / ride-sharing in closed communities
Keywords:
- "campus ridesharing study", "carpool matching trust university", "rideshare cancellation predictors"
Collect:
- papers on micro-mobility/ride-sharing adoption; safety/trust; matching efficiency.

### Theme 6 — Marketplace dynamics / second-hand platforms
Keywords:
- "second-hand marketplace friction", "peer-to-peer resale platform trust", "image-based listings conversion"

### Theme 7 — Temporal networks / dynamic social interaction modeling
Keywords:
- "temporal network analysis messaging", "panel VAR social interaction convenience", "cross-lagged panel digital trace"
Anchors:
- surveys on temporal networks (e.g., Holme & Saramäki) and cross-lag methodology (RI-CLPM etc.).

### Theme 8 — Sociotechnical systems & systems engineering validation
Keywords:
- "sociotechnical systems platform design validation", "observability logging requirements traceability"
Collect:
- V&V, requirements traceability, and sociotechnical feedback-loop studies.

---

## 8) What the Web Model Should Output (so it’s usable in writing)

Minimum outputs:
- A curated list of ~30–45 papers with BibTeX
- A mapping table: each paper → which chapter/section it supports
- A gap table: gap → how we address it → what analysis supports it
- A dataset/API table: name → variables → granularity → how used (moderator/control/validation)
- A model selection guide: which model answers which RQ; data needs; assumptions

---

## 9) Notes (important constraints)

- We **cannot** access message content; methods must rely on metadata and outcomes.
- No new psychometric scales will be collected; thesis must stand on logs + external data.
- Avoid overclaiming causality; use dynamic designs + external shocks to strengthen identification.

