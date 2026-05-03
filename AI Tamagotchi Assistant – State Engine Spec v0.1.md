---
tags:
  - Work
  - Ingested
  - ai-tamagotchi
  - state-engine
  - spec
created: 2026-04-26
updated: 2026-05-03
source: "2 - Source Material/Documents/AI Tamagotchi Assistant – State Engine Spec v0.1.md"
---

# AI Tamagotchi Assistant — State Engine Spec v0.1

## Summary
A deterministic spec for the core state engine of the AI Tamagotchi project. The engine is a pure function that takes vault contents, a history JSON file, and current time — and returns the creature's current state. The creature lives in the terminal as a pet buddy: it renders as ASCII art with a speech bubble, proactively recommends what to do next, and pops up based on state triggers. Covers five state variables, eight triggers, ten fixture tests, a calibration plan, and a terminal rendering layer.

---

## Architecture

- Engine is a **pure function**: `(vault_state, history, now) → state` — no in-memory state between runs
- Two inputs: **vault** (read-only markdown dir) + **history store** (`~/.tama/state.json`)
- Engine never writes to the vault
- **Three layers:** State Engine → Recommendation Engine → Terminal Renderer (each layer only consumes the layer below it)

---

## Layer 1 — State Engine

### What counts as activity (strict rules)
- **Capture**: new `.md` file, new line in a daily note (`YYYY-MM-DD.md`), or new `- [ ]` checkbox — debounced to 5-min windows; excludes `templates/`, `archive/`, `done/`
- **Close**: `- [ ]` → `- [x]`, or file moved into `**/archive/**` or `**/done/**`
- **Open item**: any live `- [ ]` outside excluded dirs

### State variables & formulas
| Variable | Range | Formula |
|---|---|---|
| Hunger | 0–100 | `min(100, hours_since_capture × 4)` — maxes at 25h of silence |
| Mood | 1–5 | Ratio of closes/open_items over 7d rolling window; capped at 2 if 0 captures + >5 open |
| Energy | 0–100 | `max(0, 100 - max(0, open_items - 10) × 3)` — baseline 10 items; hits 0 at 43+ open |
| Streak | int days | Increments on days with ≥1 capture AND ≥1 close; resets if a day passes with neither; freezes on vacation |
| Stage | enum | Egg→Baby(3d)→Child(10d+energy)→Teen(30d+mood)→Adult(90d)→Elder(365d as Adult) — **no regression** |

### Triggers (8 total, 6h cooldown each)
- `hunger_high` (>60), `hunger_critical` (>90) — rising edge only
- `mood_dropped`, `energy_low` (<30)
- `streak_at_risk` (no capture today + local time ≥20:00), `streak_broken`
- `stage_advanced`, `milestone_streak` (7/30/100/365)

### Critical edge cases
- First run: suppress all triggers, set neutral defaults
- Gap >7 days: soft restart — suppress negative triggers for 24h, don't fire `streak_broken` retroactively
- Corrupted state: back up to `state.json.bak.<timestamp>`, reinitialize, don't crash
- Clock skew (last_run_at > now): skip run, log warning, no state mutation
- Vacation mode: freeze streak, suppress hunger triggers, hold mood floor at 3

---

## Layer 2 — Recommendation Engine

Maps current state + active trigger → a single actionable recommendation string. One recommendation at a time. Priority order (highest wins):

| Condition | Recommendation |
|---|---|
| `hunger_critical` | "You haven't captured anything in Xh. Drop a thought — anything." |
| `streak_at_risk` | "It's past 8pm and nothing captured today. Log one thing before midnight." |
| `streak_broken` | "Streak reset. Start fresh — capture something small right now." |
| `energy_low` + open_items > 20 | "You have N open items dragging me down. Close one. Just one." |
| `mood_dropped` | "Close rate is low this week. Pick the easiest open task and finish it." |
| `hunger_high` | "No capture in Xh. What are you working on?" |
| `stage_advanced` | "We just hit [Stage]! Keep the momentum going." |
| `milestone_streak` | "N-day streak. That's real. Don't break it tonight." |
| All healthy | A rotation of encouraging nudges based on stage (see voice table below) |

**Voice table by stage (healthy state):**

| Stage | Example nudge |
|---|---|
| Egg | "Still hatching… keep going." |
| Baby | "Feed me ideas. I'm hungry." |
| Child | "What are we building today?" |
| Teen | "Getting stronger. What's next on the list?" |
| Adult | "Solid streak. Anything blocking you?" |
| Elder | "We've been at this a while. What matters most today?" |

Rules:
- Recommendation text is always ≤2 sentences
- Never invents numbers — only paraphrases what the state engine returned
- Never fires two negative triggers in the same speech bubble

---

## Layer 3 — Terminal Renderer

### Invocation
```
tama          # show current state + speech bubble
tama --watch  # stay open, re-render on vault change (inotify/fswatch)
tama --quiet  # only render if a trigger is active (good for shell hooks)
```

### Output format
```
  (=^･ω･^=)
  /|       |\
  ╭─────────────────────────────╮
  │ No capture in 6h. What are │
  │ you working on?             │
  ╰─────────────────────────────╯

  Hunger ████████░░ 74   Mood ★★★☆☆
  Energy ██████░░░░ 58   Streak 12d  [Teen]
```

Rules:
- Creature ASCII changes by stage and mood (sad/neutral/happy variants)
- Speech bubble width: max 40 chars per line, wraps automatically
- Status bar always shown below the bubble
- Colors optional (support `NO_COLOR` env var)
- Renders to stdout only — no curses/TUI framework required for v1

### Stage ASCII variants (placeholder — refine during shadow mode)
| Stage | Happy | Neutral | Sad |
|---|---|---|---|
| Egg | `( ˘ᵕ˘ )🥚` | `(  •  )🥚` | `( ;;  )🥚` |
| Baby | `(=^･ω･^=)` | `(=･ω･=)` | `(=；ω；=)` |
| Child | `(ﾉ◕ヮ◕)ﾉ` | `(•ω•)` | `(╥_╥)` |
| Teen | `(ง•̀_•́)ง` | `(¬_¬)` | `(ó﹏ò)` |
| Adult | `(⌐■_■)` | `(._.)` | `(っ˘̩╭╮˘̩)っ` |
| Elder | `(ᵔᴥᵔ)` | `(_.-)` | `(ノД`)` |

### Shell integration (recommended hooks)
```bash
# .bashrc / .zshrc
tama --quiet   # runs on every new terminal session

# Claude Code stop hook (settings.json)
# After Claude Code finishes a session, tama pops up with a recommendation
```

---

## Fixture Tests (10)

`fresh_install`, `neglected_3_days`, `healthy_user`, `overloaded`, `vacation`, `streak_at_risk`, `stage_advance_to_baby`, `huge_vault` (<2s on 10k files), `corrupted_state`, `clock_skew`

Each fixture must assert: correct state variables + correct recommendation string + correct ASCII variant selected.

---

## Calibration Plan

Run in **shadow mode for 14 days** — compute state hourly, log to `~/.tama/shadow.log`, render nothing. Then:
1. Review logs — does hunger/mood/energy feel right against actual work patterns?
2. Tune constants before building any UI
3. Enable `--quiet` shell hook first (lowest friction) before `--watch`

---

## Success Criteria

1. All 10 fixtures pass
2. Real vault output passes the "huh, that's wrong" test (<1 surprise/day)
3. Completes in <2s on 10k-file vault
4. 14 days of shadow logs reviewed and constants tuned
5. Speech bubble fires at the right moment — not annoying, not silent

---

## Out of Scope (v1)
- Web UI, desktop app, or system tray widget
- Sound / notifications
- Multi-vault support
- Multiplayer / shared creatures

---

## My Notes

2026-05-03 — Pivoted form factor to terminal assistant. Acts as a pet buddy alongside Claude Code sessions. Speech bubble recommends next action based on state. Three-layer architecture: State Engine → Recommendation Engine → Terminal Renderer.
