# Under the Same Sky :milky_way:

> *“From the perspective of a person on Earth looking upward, every message becomes a celestial object—symbolizing release, distance, and connection.”*

**Under the Same Sky** is a web-based anonymous messaging platform that transforms unsaid thoughts and emotions into a shared, interactive night sky. It emphasizes emotional expression and impermanence, offering a calm, immersive 360° environment free from social metrics and user accounts.

---

## :sparkles: Core Concept

The application simulates the experience of gazing up at the night sky. Every message submitted by a user becomes a celestial object. The interface is minimal to preserve anonymity and emotional safety.

### Celestial Objects

* :star: **Stars:** The standard visualization for submitted messages — permanently pinned across the sky. Brightness and size scale with distance so nearer stars glow brighter.
* :izakaya_lantern: **Lanterns:** Wishes that float gently upward across the sky. The wish modal also shows the live moon phase.
* :comet: **Shooting Stars:** A purely ambient effect — single bolts and occasional showers streak across the sky at random intervals. Not tied to any user submission.
* :sparkles: **Decorative Constellations:** Fixed dot-to-dot figures (lantern, letter, comet, stargazer, heart, smiley, cat) pinned to the far sky shell with slightly randomized star positions. Purely ambient — not clickable, tied to no message.

---

## :hammer_and_wrench: Tech Stack

| Component | Technology | Description |
| --- | --- | --- |
| **Frontend** | **React + Vite + Tailwind** | Renders the 360° environment (Three.js via React Three Fiber) and handles user interaction (pan/zoom). |
| **Backend** | **Node.js + Express** | Handles message logic, validation/rate-limiting, security headers, and a moon-phase relay. |
| **Database** | **Supabase (Postgres)** | Stores message data. No realtime/subscription usage — the frontend polls. |

---

## :telescope: Features & Experience

### 1. The Intro

Every visit opens on a fullscreen dialogue scene: a boy and girl under the night sky exchange two lines (a random variation each load — tap anywhere to advance, typewriter-style text), then a **Start Exploring** button fades the scene into the live sky.

### 2. The View

The main interface is a **360° interactive night sky** that slowly auto-pans until touched.

* **Pan & Zoom:** Users can explore the sky to find stars.
* **Discovery:** Zooming into specific areas reveals messages hidden within stars.
* **Sky Moods:** The atmosphere cycles Dusk → Nightfall → Deep Night → Early Dawn (auto-rotating, manually switchable from the sky picker). The TopBar pill always shows the live sky theme plus the current moon phase.

### 3. Message Submission

Input is intentionally minimal. There are **no accounts** and **no login** required.

* **Fields:** Recipient Name (free text) + optional Sender signature + Message Content.
* **Form:** Stars are permanent messages; Lanterns are wishes (with live moon phase shown). Shooting stars are ambient only.
* **Feedback:** A success toast confirms each release; failures surface a dismissible error banner. No message is ever faked locally — unsaved submissions never appear.

### 4. Discovery & Sharing

* **Search:** Find messages by recipient name, with a focused mobile takeover mode.
* **Share:** QR code + link to the send page.
* **Reading cards:** Quotes with attribution (`— from …` when signed), styled scrollbars for long messages.

### 5. Anti-Social Metrics

To ensure the platform remains a place for release rather than validation:

* No Likes, Comments, or Reactions.
* No User Profiles.
* No Reply functionality.

---

## :building_construction: System Architecture

### Frontend (React)

* **Visualization:** Responsible for the 360° canvas rendering (terrain, bench/sign/stargazers hilltop, message stars, lanterns, constellations, moon).
* **Interactivity:** Manages touch/mouse events for navigation, focus flights, and reading cards.
* **State:** Polls the wall API and merges arrivals by ID so placed stars never jump.

### Backend (Node.js)

* **Logic:** Stores the sender's chosen form (Star / Lantern) and assigns sky positions; optional sender signatures.
* **Moon phase:** Relays live lunar data (upstream API with local-astronomy fallback) for the wish modal's phase badge.
* **API:** `GET /api/messages` (wall list) and `POST /api/messages` (submit), plus a `GET /api/moonphase` relay.

---

## :clipboard: Project Scope & Limitations

### Included

* Anonymous message submission (optional sender signature).
* Visual distinction between message types (Star, Lantern).
* Ambient shooting-star animations for atmosphere.
* Intro dialogue scene, sky-mood cycle, search, and share page.

### Excluded (By Design)

* User Authentication/Profiles.
* Direct Messaging or Replies.
* Edit functionality after submission.

### Known Limitations

* **Performance:** Rendering a high volume of objects in a 360° view may impact low-end devices.
* **Visibility:** Messages are visible to all visitors who explore the sky.
* **Moderation:** As an anonymous platform, moderation is limited to basic safeguards; messages are not traced to users.

---

## :busts_in_silhouette: The Team

| Role | Name |
| --- | --- |
| **Frontend Developer** | **Iverene Grace Causapin** |
| **Full-Stack Developer** | **John Rey Bagunas** |

---

## :computer: Getting Started (Development)


1. **Clone the repository**
```bash
git clone https://github.com/iverene/Under-the-Same-Sky.git
cd Under-the-Same-Sky
```


2. **Install Dependencies** (frontend and backend are separate packages)
```bash
cd frontend && npm install
cd ../backend && npm install

```


3. **Environment Setup**
```bash
copy backend\.env.example backend\.env   # then fill in DATABASE_URL
```

| File | Key | Value |
| --- | --- | --- |
| `backend/.env` | `DATABASE_URL` | Supabase Postgres URI (Project Settings → Database → Connection string). On IPv4-only networks use the **Session Pooler** URI (port `6543`), not the direct `db.*` host. |
| `frontend/.env` | `VITE_API_URL` | Backend base URL + `/api/messages` (defaults to `http://localhost:5000/api/messages`, so local dev works without this file). |


4. **Run the Project**
```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm start

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

Frontend checks: `npm run lint`, `npm run build` (both inside `frontend/`).

