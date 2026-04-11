# Hartdog.com Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a multi-game portal at Hartdog.com with user accounts, starting with Hartworms as the first hosted game.

**Architecture:** Astro static site with file-based routing, Netlify Identity for auth (CDN widget approach), games embedded via iframe from `public/games/` static folders. New repo `ahartzog/hartdog`, separate from the hartworms game repo.

**Tech Stack:** Astro 5, Netlify (hosting + Identity + DNS), netlify-identity-widget (CDN), vanilla JS for client-side auth logic

---

## File Structure

```
hartdog/
├── astro.config.mjs           # Astro config + Netlify adapter
├── netlify.toml               # Build command, publish dir
├── package.json
├── public/
│   └── games/
│       └── hartworms/         # Copied from hartworms repo dist/
├── src/
│   ├── data/
│   │   └── games.js           # Game registry array
│   ├── layouts/
│   │   └── Base.astro         # Shared layout: nav, Identity widget, theme CSS
│   ├── pages/
│   │   ├── index.astro        # Home — game card grid
│   │   └── games/
│   │       └── hartworms.astro # Game page — iframe wrapper
│   └── components/
│       ├── GameCard.astro     # Card for home grid
│       ├── NavBar.astro       # Top nav with logo + auth button
│       └── AvatarPicker.astro # Emoji picker for profile setup
```

---

### Task 1: Create GitHub Repo and Scaffold Astro Project

**Files:**
- Create: `~/Code/hartdog/` (new project directory)
- Create: `package.json`, `astro.config.mjs`, `netlify.toml`
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create the GitHub repo**

```bash
cd ~/Code
gh repo create ahartzog/hartdog --public --clone
cd hartdog
```

- [ ] **Step 2: Initialize Astro project**

Run the Astro scaffolder inside the repo. Use the "empty" template so we start clean:

```bash
npm create astro@latest . -- --template minimal --install --no-git
```

This creates `astro.config.mjs`, `package.json`, `src/pages/index.astro`, and `tsconfig.json`.

Expected: `package.json` has `astro` as a dependency, scripts include `dev`, `build`, `preview`.

- [ ] **Step 3: Install Netlify adapter**

```bash
npx astro add netlify --yes
```

This updates `astro.config.mjs` to include the Netlify adapter automatically.

- [ ] **Step 4: Create `netlify.toml`**

Create `netlify.toml` at project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Astro dev server starts at `http://localhost:4321`, shows the default index page.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with Netlify adapter"
git push -u origin master
```

---

### Task 2: Neon Cyber Theme and Base Layout

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/NavBar.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create the NavBar component**

Create `src/components/NavBar.astro`:

```astro
---
// NavBar.astro — shared top navigation
---
<nav class="navbar">
  <a href="/" class="logo">HARTDOG</a>
  <div class="nav-right">
    <button id="auth-btn" class="auth-btn" style="display:none;">Login</button>
    <div id="user-info" class="user-info" style="display:none;">
      <span id="user-avatar" class="user-avatar"></span>
      <span id="user-name" class="user-name"></span>
      <button id="logout-btn" class="auth-btn">Logout</button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(17, 17, 17, 0.9);
    border-bottom: 1px solid rgba(0, 240, 255, 0.15);
    backdrop-filter: blur(8px);
  }
  .logo {
    font-size: 22px;
    font-weight: 900;
    background: linear-gradient(90deg, #00f0ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-decoration: none;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .auth-btn {
    padding: 6px 16px;
    background: transparent;
    border: 1px solid rgba(0, 240, 255, 0.4);
    color: #00f0ff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  .auth-btn:hover {
    background: rgba(0, 240, 255, 0.1);
    border-color: #00f0ff;
  }
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .user-avatar {
    font-size: 20px;
  }
  .user-name {
    color: #f9fafb;
    font-size: 14px;
  }
</style>
```

- [ ] **Step 2: Create the Base layout**

Create `src/layouts/Base.astro`:

```astro
---
import NavBar from '../components/NavBar.astro';
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} | Hartdog</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐶</text></svg>" />
  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</head>
<body>
  <NavBar />
  <main>
    <slot />
  </main>
</body>
</html>

<style is:global>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a1a;
    color: #f9fafb;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
  }
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 24px;
  }
</style>
```

- [ ] **Step 3: Update index.astro to use Base layout**

Replace `src/pages/index.astro` with:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Home">
  <h1 class="page-title">Games</h1>
  <p class="page-subtitle">Pick a game and play.</p>
</Base>

<style>
  .page-title {
    font-size: 36px;
    font-weight: 900;
    margin-bottom: 8px;
    background: linear-gradient(90deg, #00f0ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .page-subtitle {
    color: #9ca3af;
    font-size: 16px;
    margin-bottom: 32px;
  }
</style>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: dark background, gradient HARTDOG logo in nav, "Games" heading with neon gradient, "Pick a game and play" subtitle.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro src/components/NavBar.astro src/pages/index.astro
git commit -m "feat: neon cyber theme with Base layout and NavBar"
git push
```

---

### Task 3: Game Registry and Home Page Card Grid

**Files:**
- Create: `src/data/games.js`
- Create: `src/components/GameCard.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create the game registry**

Create `src/data/games.js`:

```js
export const games = [
  {
    slug: 'hartworms',
    title: 'Hartworms',
    emoji: '🪱',
    description: 'Turn-based artillery chaos. Aim, fire, and destroy your friends.',
  },
];
```

- [ ] **Step 2: Create the GameCard component**

Create `src/components/GameCard.astro`:

```astro
---
interface Props {
  slug: string;
  title: string;
  emoji: string;
  description: string;
}
const { slug, title, emoji, description } = Astro.props;
---
<a href={`/games/${slug}`} class="game-card">
  <div class="card-emoji">{emoji}</div>
  <div class="card-body">
    <h3 class="card-title">{title}</h3>
    <p class="card-desc">{description}</p>
  </div>
</a>

<style>
  .game-card {
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #1a1a3a 0%, #0d0d1a 100%);
    border: 1px solid rgba(0, 240, 255, 0.15);
    border-radius: 12px;
    padding: 24px;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
    width: 240px;
  }
  .game-card:hover {
    border-color: rgba(0, 240, 255, 0.5);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.15), 0 0 40px rgba(124, 58, 237, 0.1);
    transform: translateY(-2px);
  }
  .card-emoji {
    font-size: 48px;
    margin-bottom: 16px;
  }
  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: #f9fafb;
    margin-bottom: 6px;
  }
  .card-desc {
    font-size: 13px;
    color: #9ca3af;
    line-height: 1.5;
  }
</style>
```

- [ ] **Step 3: Wire the card grid into the home page**

Update `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import GameCard from '../components/GameCard.astro';
import { games } from '../data/games.js';
---
<Base title="Home">
  <h1 class="page-title">Games</h1>
  <p class="page-subtitle">Pick a game and play.</p>
  <div class="game-grid">
    {games.map((game) => (
      <GameCard {...game} />
    ))}
  </div>
</Base>

<style>
  .page-title {
    font-size: 36px;
    font-weight: 900;
    margin-bottom: 8px;
    background: linear-gradient(90deg, #00f0ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .page-subtitle {
    color: #9ca3af;
    font-size: 16px;
    margin-bottom: 32px;
  }
  .game-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }
</style>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: Hartworms card with worm emoji, title, description. Card glows cyan on hover. Clicking navigates to `/games/hartworms` (404 for now — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/data/games.js src/components/GameCard.astro src/pages/index.astro
git commit -m "feat: game registry and card grid on home page"
git push
```

---

### Task 4: Game Page with iframe Embed

**Files:**
- Create: `src/pages/games/hartworms.astro`
- Create: `public/games/hartworms/` (copy from hartworms dist/)

- [ ] **Step 1: Copy Hartworms build output**

```bash
mkdir -p public/games/hartworms
cp -r ~/Code/hartworms/dist/* public/games/hartworms/
```

Verify the copy:

```bash
ls public/games/hartworms/
```

Expected: `index.html`, `assets/` directory.

- [ ] **Step 2: Create the game page**

Create `src/pages/games/hartworms.astro`:

```astro
---
import Base from '../../layouts/Base.astro';
---
<Base title="Hartworms">
  <div class="game-header">
    <a href="/" class="back-link">← Back to Games</a>
    <h1 class="game-title">🪱 Hartworms</h1>
  </div>
  <div class="game-container">
    <iframe
      src="/games/hartworms/index.html"
      class="game-iframe"
      allowfullscreen
    ></iframe>
  </div>
</Base>

<style>
  .game-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  .back-link {
    color: #00f0ff;
    text-decoration: none;
    font-size: 14px;
    transition: opacity 0.2s;
  }
  .back-link:hover {
    opacity: 0.7;
  }
  .game-title {
    font-size: 24px;
    font-weight: 800;
    color: #f9fafb;
  }
  .game-container {
    width: 100%;
    aspect-ratio: 16 / 9;
    max-height: calc(100vh - 180px);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(124, 58, 237, 0.3);
    box-shadow: 0 0 30px rgba(124, 58, 237, 0.1);
  }
  .game-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
</style>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321/games/hartworms`. Expected: back link, title, and the Hartworms game running inside the iframe. The game should be fully playable.

- [ ] **Step 4: Commit**

Note: `public/games/hartworms/` will be a large commit (game build assets). This is expected.

```bash
git add public/games/hartworms/ src/pages/games/hartworms.astro
git commit -m "feat: hartworms game page with iframe embed"
git push
```

---

### Task 5: Netlify Identity Auth Integration

**Files:**
- Modify: `src/components/NavBar.astro`
- Create: `src/components/AvatarPicker.astro`
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Create the AvatarPicker component**

Create `src/components/AvatarPicker.astro`:

```astro
---
// AvatarPicker.astro — modal for first-time profile setup
const avatars = ['🐶', '🐱', '🦊', '🐸', '🐻', '🐼', '🦁', '🐲', '🤖', '👾', '🎮', '🪱'];
---
<div id="avatar-picker" class="picker-overlay" style="display:none;">
  <div class="picker-modal">
    <h2 class="picker-title">Choose Your Avatar</h2>
    <p class="picker-subtitle">Pick an avatar and enter your display name</p>
    <div class="avatar-grid">
      {avatars.map((a) => (
        <button class="avatar-option" data-avatar={a}>{a}</button>
      ))}
    </div>
    <input
      id="display-name-input"
      class="name-input"
      type="text"
      placeholder="Display name"
      maxlength="20"
    />
    <button id="save-profile-btn" class="save-btn" disabled>Save</button>
  </div>
</div>

<style>
  .picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  .picker-modal {
    background: #111827;
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 12px;
    padding: 32px;
    width: 360px;
    text-align: center;
  }
  .picker-title {
    font-size: 22px;
    font-weight: 800;
    color: #f9fafb;
    margin-bottom: 4px;
  }
  .picker-subtitle {
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 20px;
  }
  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }
  .avatar-option {
    font-size: 28px;
    padding: 8px;
    background: #1a1a3a;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .avatar-option:hover {
    border-color: rgba(0, 240, 255, 0.4);
  }
  .avatar-option.selected {
    border-color: #00f0ff;
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
  }
  .name-input {
    width: 100%;
    padding: 10px 12px;
    background: #0a0a1a;
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 6px;
    color: #f9fafb;
    font-size: 14px;
    margin-bottom: 16px;
    outline: none;
  }
  .name-input:focus {
    border-color: #00f0ff;
  }
  .save-btn {
    width: 100%;
    padding: 10px;
    background: linear-gradient(90deg, #00f0ff, #7c3aed);
    border: none;
    border-radius: 6px;
    color: #0a0a1a;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .save-btn:not(:disabled):hover {
    opacity: 0.9;
  }
</style>
```

- [ ] **Step 2: Add auth client script to Base layout**

Add the following `<script>` block to `src/layouts/Base.astro`, just before the closing `</body>` tag. This script handles all Netlify Identity interactions:

```html
<script>
  // Wait for Identity widget to load
  if (window.netlifyIdentity) {
    initAuth();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.netlifyIdentity) initAuth();
    });
  }

  function initAuth() {
    const identity = window.netlifyIdentity;
    identity.init();

    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    function updateUI(user) {
      if (user) {
        const meta = user.user_metadata || {};
        authBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userAvatar.textContent = meta.avatar || '👤';
        userName.textContent = meta.display_name || user.email;

        // Show avatar picker if no profile set up yet
        if (!meta.display_name || !meta.avatar) {
          showAvatarPicker(user);
        }
      } else {
        authBtn.style.display = 'block';
        userInfo.style.display = 'none';
      }
    }

    function showAvatarPicker(user) {
      const picker = document.getElementById('avatar-picker');
      if (!picker) return;
      picker.style.display = 'flex';

      let selectedAvatar = null;
      const nameInput = document.getElementById('display-name-input');
      const saveBtn = document.getElementById('save-profile-btn');

      picker.querySelectorAll('.avatar-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          picker.querySelectorAll('.avatar-option').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedAvatar = btn.dataset.avatar;
          saveBtn.disabled = !nameInput.value.trim() || !selectedAvatar;
        });
      });

      nameInput.addEventListener('input', () => {
        saveBtn.disabled = !nameInput.value.trim() || !selectedAvatar;
      });

      saveBtn.addEventListener('click', async () => {
        if (!selectedAvatar || !nameInput.value.trim()) return;
        try {
          await user.update({
            data: {
              display_name: nameInput.value.trim(),
              avatar: selectedAvatar,
            },
          });
          picker.style.display = 'none';
          updateUI(identity.currentUser());
        } catch (err) {
          console.error('Failed to save profile:', err);
        }
      });
    }

    // Show login button once widget is ready
    authBtn.style.display = 'block';
    authBtn.addEventListener('click', () => identity.open());

    logoutBtn.addEventListener('click', () => identity.logout());

    identity.on('init', (user) => updateUI(user));
    identity.on('login', (user) => {
      updateUI(user);
      identity.close();
    });
    identity.on('logout', () => updateUI(null));
  }
</script>
```

- [ ] **Step 3: Add AvatarPicker to Base layout**

In `src/layouts/Base.astro`, add the AvatarPicker import in the frontmatter:

```astro
---
import NavBar from '../components/NavBar.astro';
import AvatarPicker from '../components/AvatarPicker.astro';
```

And add `<AvatarPicker />` in the body, after `<NavBar />`:

```html
<body>
  <NavBar />
  <AvatarPicker />
  <main>
    <slot />
  </main>
</body>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected:
- "Login" button appears in nav bar
- Clicking it opens the Netlify Identity modal (will show an error about not being configured — this is expected in local dev without Netlify, and will work once deployed)
- The avatar picker is hidden until first login

- [ ] **Step 5: Commit**

```bash
git add src/components/AvatarPicker.astro src/components/NavBar.astro src/layouts/Base.astro
git commit -m "feat: Netlify Identity auth with avatar picker"
git push
```

---

### Task 6: Production Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the production build**

```bash
npm run build
```

Expected: Build succeeds, output in `dist/` directory. Should see pages for `/`, `/games/hartworms`, and the static game files copied through.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Open the preview URL. Expected:
- Home page renders with game card grid
- Clicking Hartworms card navigates to game page
- iframe loads and game is playable
- Login button visible in nav

- [ ] **Step 3: Commit any build fixes**

If the build revealed issues, fix and commit them:

```bash
git add -A
git commit -m "fix: production build issues"
git push
```

---

### Task 7: Netlify Setup via Chrome

**Prerequisites:** `claude --chrome` mode enabled, Chrome extension installed, Alek logged into GitHub in Chrome.

This task is performed via browser automation. Alek supervises and handles any login prompts or CAPTCHAs.

- [ ] **Step 1: Sign up / log into Netlify**

Via Chrome: Navigate to `https://app.netlify.com/signup`. Sign up with GitHub (recommended — links the account automatically). If Alek already has a Netlify account, log in instead.

- [ ] **Step 2: Create new site from Git**

Via Chrome: In the Netlify dashboard:
1. Click "Add new site" → "Import an existing project"
2. Select GitHub as the Git provider
3. Search for and select `ahartzog/hartdog`
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

Wait for the first deploy to complete (should take under a minute).

- [ ] **Step 3: Verify the deployed site**

Via Chrome: Click the deployed site URL (will be something like `https://random-name.netlify.app`). Verify:
- Home page loads with neon theme
- Game card appears
- Clicking card loads the game page
- Game is playable in the iframe

- [ ] **Step 4: Enable Netlify Identity**

Via Chrome: In the Netlify dashboard for the hartdog site:
1. Go to "Integrations" → search for "Identity" → "Enable"
2. Under Identity settings, set registration to "Open" (default)
3. No other configuration needed

- [ ] **Step 5: Test auth on deployed site**

Via Chrome: On the deployed site:
1. Click "Login" in the nav
2. Netlify Identity modal should appear
3. Sign up with a test email
4. Avatar picker should appear after signup
5. Select avatar and display name, save
6. Verify name + avatar appear in nav
7. Refresh page — verify session persists

---

### Task 8: Domain and DNS Setup via Chrome

**Prerequisites:** Alek logged into GoDaddy in Chrome.

- [ ] **Step 1: Add custom domain in Netlify**

Via Chrome: In the Netlify dashboard for the hartdog site:
1. Go to "Domain management" → "Add a domain"
2. Enter `hartdog.com`
3. Netlify will show the required nameservers (typically `dns1.p0X.nsone.net` through `dns4.p0X.nsone.net`)

Write down or screenshot the nameserver values.

- [ ] **Step 2: Update nameservers in GoDaddy**

Via Chrome: Navigate to `https://dcc.godaddy.com/` (GoDaddy Domain Control Center):
1. Find `hartdog.com` in the domain list
2. Click to manage DNS
3. Find "Nameservers" section → click "Change"
4. Select "Custom" nameservers
5. Enter the 4 nameserver values from Netlify
6. Save

Note: DNS propagation can take up to 48 hours, but often completes within 30 minutes.

- [ ] **Step 3: Verify SSL provisioning**

Via Chrome: Back in Netlify dashboard → Domain management:
- Wait for DNS verification to complete (may take a few minutes)
- Netlify will auto-provision an SSL certificate
- Once complete, `https://hartdog.com` should load the site

- [ ] **Step 4: Verify the live site**

Via Chrome: Navigate to `https://hartdog.com`. Verify:
- Site loads over HTTPS
- Home page renders correctly
- Game is playable
- Auth (login/signup) works
- `https://www.hartdog.com` redirects to `https://hartdog.com` (or vice versa — Netlify handles this automatically)

---

### Task 9: Final Polish and Documentation

**Files:**
- Create: `README.md`
- Modify: any visual tweaks identified during Task 8 verification

- [ ] **Step 1: Create README**

Create `README.md` at project root:

```markdown
# Hartdog.com

Multi-game web portal for the Hartzog family.

## Dev

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # production build → dist/
```

## Adding a Game

1. Build the game in its own repo
2. Copy the built output into `public/games/<game-name>/`
3. Create `src/pages/games/<game-name>.astro` (copy from `hartworms.astro`)
4. Add entry to `src/data/games.js`
5. Commit and push — Netlify auto-deploys

## Updating Hartworms

```bash
cd ~/Code/hartworms && npm run build
cp -r dist/* ~/Code/hartdog/public/games/hartworms/
cd ~/Code/hartdog && git add -A && git commit -m "update hartworms" && git push
```

## Auth

Uses Netlify Identity. Managed at https://app.netlify.com → site dashboard → Identity.
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add README with dev and deployment instructions"
git push
```

- [ ] **Step 3: Verify auto-deploy**

Wait ~30 seconds, then check `https://hartdog.com` to confirm the push triggered a successful deploy.
