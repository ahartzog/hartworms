# Hartdog.com — Game Portal Design Spec

**Date:** 2026-04-11
**Authors:** Alek Hartzog + Claude

## Overview

Hartdog.com is a multi-game web portal for the Hartzog family. It hosts browser games (starting with Hartworms) behind a lightweight user account system. The site is semi-public — open sign-up, no growth ambitions, no abuse prevention beyond what Netlify Identity provides out of the box.

## Goals

- Host multiple games at distinct URL paths under one domain
- Simple user accounts (display name + avatar) with room to add match history later
- Deploy on push to master — no CI/CD complexity
- Keep the whole thing as simple as possible

## Non-Goals (Explicitly Out of Scope)

- Multiplayer / real-time game sessions
- Match history, leaderboards, stats tracking
- Custom avatar uploads (preset emoji list only)
- Automated game build pipelines (manual copy for now)
- Branch protection or PR reviews
- SEO, analytics, social features

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Astro | File-based routing, static output, zero client JS by default |
| Hosting | Netlify (free tier) | Auto-deploy on push, built-in auth, generous free tier |
| Auth | Netlify Identity + Identity Widget | No external auth provider, stores user metadata, free up to 1,000 users |
| DNS | Netlify DNS (nameservers transferred from GoDaddy) | SSL auto-renewal, single dashboard for DNS + hosting |
| Domain | Hartdog.com (owned via GoDaddy) | |
| Game embedding | iframe | Full isolation, zero changes to game code, postMessage available for future stats |

## Pages

### Home (`/`)

- Neon Cyber dark theme: `#0a0a1a` background, cyan (`#00f0ff`) and purple (`#7c3aed`) accents, glow effects on interactive elements
- Shared nav bar: HARTDOG logo (gradient text), login/signup button (or user name + avatar if logged in)
- Game card grid: each card shows game title, thumbnail/emoji, brief description
- Clicking a card navigates to the game page
- Cards are data-driven from `src/data/games.js` — an array of `{ slug, title, emoji, description }` objects. Adding a game means adding an entry here, not editing page HTML

### Game Page (`/games/hartworms`)

- Shared nav bar (same as home, but with a back-to-home link)
- Near-fullscreen iframe pointing at `/games/hartworms/index.html`
- Iframe is the game's complete built output — no modifications to game code
- Each game gets its own Astro page file: `src/pages/games/<name>.astro`

### Auth (Modal Overlay)

- No dedicated login page. Netlify Identity Widget renders a modal overlay triggered from the nav bar.
- Sign-up flow: email + password → after first login, prompt for display name + avatar selection
- Avatar picker: grid of preset emojis (dog, cat, fox, frog, etc.)
- Display name and avatar stored in Netlify Identity user metadata (`user_metadata.display_name`, `user_metadata.avatar`)
- Session persists via JWT — user stays logged in across page loads

---

## Repo Structure

New GitHub repo: `ahartzog/hartdog` (separate from `ahartzog/hartworms`)

```
hartdog/
├── astro.config.mjs           # Astro config + @astrojs/netlify adapter
├── netlify.toml               # build command, publish dir, Identity config
├── package.json
├── public/
│   └── games/
│       └── hartworms/         # Manually copied from hartworms repo dist/
│           ├── index.html
│           └── assets/
├── src/
│   ├── data/
│   │   └── games.js           # Game registry: [{ slug, title, emoji, description }]
│   ├── layouts/
│   │   └── Base.astro         # Shared nav, footer, Netlify Identity Widget, theme CSS
│   ├── pages/
│   │   ├── index.astro        # Home page — game card grid
│   │   └── games/
│   │       └── hartworms.astro  # Game page — iframe wrapper
│   └── components/
│       ├── GameCard.astro     # Reusable card component for home grid
│       ├── AuthButton.astro   # Nav login/signup trigger + logged-in state
│       └── AvatarPicker.astro # Emoji grid for post-signup profile setup
```

### Adding a New Game

1. Build the game in its own repo
2. Copy the built output into `public/games/<game-name>/`
3. Create `src/pages/games/<game-name>.astro` (iframe wrapper, copy from hartworms.astro)
4. Add an entry to the game config array (used by the home page grid)
5. Commit and push

---

## Visual Design

**Theme: Neon Cyber**

- Background: deep dark (`#0a0a1a` base, `#111827` panels)
- Primary accent: cyan (`#00f0ff`) — links, borders, glows
- Secondary accent: purple (`#7c3aed`) — game page accents, hover states
- Text: white/light gray (`#f9fafb` headings, `#9ca3af` body)
- Cards: dark panels with subtle gradient, colored border glow on hover
- Typography: system sans-serif stack, bold headings, generous letter-spacing on labels
- Effects: `box-shadow` glow on cards/buttons using accent colors at low opacity

---

## Deployment

### Initial Setup

All service setup steps will be performed via `claude --chrome` (Chrome browser automation). Alek supervises and handles any CAPTCHAs or login prompts.

1. Create `ahartzog/hartdog` repo on GitHub (via `gh` CLI)
2. Via Chrome: Sign up / log into Netlify → "New site from Git" → connect the repo
3. Via Chrome: Set build settings — command `astro build`, publish directory `dist/`
4. Via Chrome: Enable Netlify Identity in site settings
5. Via Chrome: In GoDaddy, change nameservers to Netlify's DNS servers
6. Via Chrome: In Netlify, add custom domain `hartdog.com` → SSL auto-provisions

### Ongoing Deploys

- Push to `master` → Netlify auto-builds and deploys (typically under 30 seconds for a static Astro site)

### Updating Hartworms

1. In the hartworms repo: `npm run build`
2. Copy `hartworms/dist/*` → `hartdog/public/games/hartworms/`
3. Commit and push hartdog

---

## Future Considerations (Not Built Now)

These are explicitly deferred but the architecture doesn't block them:

- **Match history / stats**: Add a Netlify Function that writes to a lightweight DB (e.g., Netlify Blobs or a free-tier Supabase). Games communicate scores via `postMessage` to the parent frame.
- **Multiplayer**: Would require a WebSocket server (e.g., Partykit, Liveblocks, or a small Node server). The iframe + postMessage architecture supports this — the parent frame could broker connections.
- **Automated game builds**: GitHub Action in the game repo that builds and copies output to the portal repo via a PR or direct push.
- **Leaderboards**: Netlify Function + DB query, displayed on the home page or per-game page.
