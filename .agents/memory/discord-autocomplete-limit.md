---
name: Discord autocomplete limit
description: The Discord slash-command autocomplete constraint and the search behavior needed for larger movie lists
---

Discord autocomplete can return at most 25 choices, so a list larger than that cannot be displayed in one empty dropdown. Search results must prioritize exact, prefix, and substring matches across the full database rather than exposing the first 25 rows by insertion order.

**Why:** The watchlist's insertion order grouped the first 25 choices around Marvel titles, making later titles appear unavailable even though they were stored correctly.

**How to apply:** Keep autocomplete capped at 25 for Discord, but make it accent-insensitive and relevance-ranked; users can type any part of a title to select any item in the full list.