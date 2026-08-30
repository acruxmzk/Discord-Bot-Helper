---
name: TMDB season durations
description: Rules for resolving season-labeled watchlist titles and calculating their runtime.
---

When a watchlist title includes “Season” or “Temporada”, prefer TMDB’s TV search, also search the title with its season marker removed, and fetch the specific season endpoint. If that season does not exist in TMDB, do not fabricate a season runtime; retain only the general TV data that TMDB actually provides.

**Why:** TMDB’s multi-search can rank an unrelated movie above the intended series, and a series-details response describes the entire show rather than the requested season.

**How to apply:** Keep the season number in stored metadata, calculate totals from episode runtimes when the season endpoint is available, and make missing-season fallbacks visible to the user. Normalize common `S2` notation when extracting the season number.