# Under the Same Sky :milky_way:

> *“From the perspective of a person on Earth looking upward, every message becomes a celestial object—symbolizing release, distance, and connection.”*

**Under the Same Sky** is a web-based anonymous messaging platform that transforms unsaid thoughts and emotions into a shared, interactive night sky. It emphasizes emotional expression and impermanence, offering a calm, immersive 360° environment free from social metrics and user accounts.

---

## :sparkles: Core Concept

The application simulates the experience of gazing up at the night sky. Every message submitted by a user becomes a celestial object. The interface is minimal to preserve anonymity and emotional safety.

### Celestial Objects

* :star: **Stars:** The standard visualization for submitted messages.
* :comet: **Falling Stars:** Messages that exceed a specific character length. These are rare, appearing randomly or only when "caught" by a user.
* :izakaya_lantern: **Lanterns:** Special wishes submitted during **Full Moon** events that float gently across the sky.

---

## :hammer_and_wrench: Tech Stack

| Component | Technology | Description |
| --- | --- | --- |
| **Frontend** | **React** | Renders the 360° environment and handles user interaction (pan/zoom). |
| **Backend** | **Node.js** | Handles message logic, classification, and event timing. |
| **Database** | **Supabase** | Stores message data and handles real-time capabilities. |

---

## :telescope: Features & Experience

### 1. The View

The main interface is a **360° interactive night sky**.

* **Pan & Zoom:** Users can explore the sky to find stars.
* **Discovery:** Zooming into specific areas reveals messages hidden within stars.

### 2. Message Submission

Input is intentionally minimal. There are **no accounts** and **no login** required.

* **Fields:** Recipient Name (Free text) + Message Content.
* **Classification:** The system automatically determines if a message is a Star or a Falling Star based on length. Lanterns are only available during specific dates (Full Moon).

### 3. Anti-Social Metrics

To ensure the platform remains a place for release rather than validation:

* No Likes, Comments, or Reactions.
* No User Profiles.
* No Reply functionality.

---

## :building_construction: System Architecture

### Frontend (React)

* **Visualization:** Responsible for the 360° canvas rendering.
* **Interactivity:** Manages touch/mouse events for navigation and "catching" falling stars.
* **State:** Fetches celestial data based on the viewport location.

### Backend (Node.js)

* **Logic:** Classifies incoming text (Star vs. Falling Star).
* **Cron/Timing:** Manages the "Full Moon" state for Lantern activation.
* **API:** RESTful endpoints for submission and retrieval.

---

## :clipboard: Project Scope & Limitations

### Included

* Anonymous message submission.
* Visual distinction between message types (Star, Falling Star, Lantern).
* Randomized visibility for falling stars to encourage presence.

### Excluded (By Design)

* User Authentication/Profiles.
* Direct Messaging or Replies.
* Message search or filtering.
* Edit functionality after submission.

### Known Limitations

* **Performance:** Rendering a high volume of objects in a 360° view may impact low-end devices.
* **Visibility:** Due to the "Falling Star" mechanic, some long messages may rarely be seen.
* **Moderation:** As an anonymous platform, moderation is limited to basic safeguards; messages are not traced to users.

---

## :busts_in_silhouette: The Team

| Role | Name |
| --- | --- |
| **Frontend Developer** | **Iverene Grace Causapin** |
| **Backend Developer** | **John Rey Bagunas** |

---

## :computer: Getting Started (Development)


1. **Clone the repository**
```bash
git clone https://github.com/iverene/under-the-same-sky.git

```


2. **Install Dependencies**
```bash
cd under-the-same-sky
npm install

```


3. **Environment Setup**
Create a `.env` file and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key

```


4. **Run the Project**
```bash
npm start

```

