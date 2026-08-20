---
name: Discord movie search and recency
description: Non-obvious requirements for the movie tracker autocomplete and latest-watched ordering.
---

The Discord bot must explicitly handle autocomplete interactions in the central interaction router; declaring autocomplete on a command is not enough. Movie search should be accent-insensitive because users commonly type titles without Portuguese diacritics. “Visto por último” requires a timestamp, not a date-only column, because multiple movies can be watched on the same day.

**Why:** A declared autocomplete handler was never reached, and date-only storage made same-day watches appear in the wrong order.

**How to apply:** When changing movie commands or migrations, verify both the interaction router and the database ordering precision.