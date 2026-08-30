---
name: Automatic panel refresh
description: The Discord movie panel must be registered and refreshed after watchlist mutations.
---

Automatic panel updates depend on the `movie_panel` record that identifies the message to edit. If that record is missing after a database reset, recover a recent bot-authored movie panel when possible; otherwise `/painel` must be run once.

**Why:** Commands can update the database successfully while leaving the visible Discord message unchanged when the panel message ID is unavailable.

**How to apply:** Await panel refreshes after commands that change watched state or ratings, pass the current channel as the preferred recovery location, and keep the no-panel case explicit in logs.