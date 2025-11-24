# Prompt for Coding Agent

**Project:** Build a Sports Box-Score App (Project Name: *ThunderScroll*)

**Role:** You are an expert React developer with a focus on minimalist UI/UX and real-time data integration.

**Tech Stack:**
*   **Framework:** Vite + React + Javascript
*   **Styling:** Tailwind CSS (Crucial for the "vibe")
*   **Hosting/Backend:** Vercel Serverless Functions (Use only if necessary to avoid CORS issues with ESPN API; otherwise, fetch client-side).
*   **Icons:** Lucide React

**Core Objective:**
Create a mobile-first, single-page application dedicated to the Oklahoma City Thunder (Team ID: `25`). The goal is to replace the bloated ESPN app with a hyper-fast, text-forward, distraction-free interface.

**Design Philosophy ("The Vibe"):**
*   **Theme:** Dark Mode only. Background `#0a0a0a`. Text `zinc-100` for primary, `zinc-500` for secondary.
*   **Typography:** Use a monospace font (like 'Geist Mono' or 'JetBrains Mono') for all data/numbers. Sans-serif for names.
*   **Accent:** Use OKC Thunder Blue (`#007AC1`) *only* for the live score and "Live" indicators.
*   **Layout:** Minimal cards. No shadows, just thin borders (`border-zinc-800`).

**Key Features & Logic:**

1.  **Data Source (The Hidden API):**
    *   We are using ESPN's public (but undocumented) endpoints.
    *   **Schedule Endpoint:** `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/25/schedule`
    *   **Game Summary Endpoint:** `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={gameId}`

2.  **The "Schedule" View (Top of Page):**
    *   Fetch the schedule for OKC (Team ID 25).
    *   Display a horizontal scrolling list or vertical list of:
        *   **Past Games:** Result (W/L), Score (e.g., "112 - 95"), Opponent logo/code.
        *   **Live Game:** Highlighted distinctly. Shows live score and game clock.
        *   **Future Games:** Date, Time, and Opponent.

3.  **The "Live Box Score" View (Main Content):**
    *   **Conditional Logic:** If a game is currently LIVE (Status `in`) or just finished (Status `post`), fetch the **Game Summary** endpoint.
    *   **Display:** Render a minimalist table of the OKC players.
    *   **Columns:** Name (Last name only), MIN, PTS, REB, AST, +/-.
    *   **Sorting:** Sort active players by Minutes or Points. Hide players with 0 minutes (DNP).

4.  **Auto-Refresh (The Heartbeat):**
    *   Implement a `useEffect` hook that polls the Game Summary endpoint every 30 seconds *only* if a game is live.
    *   Add a tiny, subtle visual indicator (like a pulsing green dot) to show the user that data is live.

5.  **Error Handling:**
    *   If the API fetch fails, do not crash. Show a simple "Offline" text.

**Implementation Steps:**
1.  Set up the Vite project with Tailwind.
2.  Create a utility file `api.js` to handle the ESPN fetches.
3.  Build the `GameCard` component for the schedule.
4.  Build the `BoxScore` component for the live game details.
5.  Wire up the polling logic in `App.jsx`.

**Start coding. Focus on speed and minimalism.**
