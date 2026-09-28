# Under the Same Sky :milky_way:

> *“From the perspective of a person on Earth looking upward, every message becomes a celestial object—symbolizing release, distance, and connection.”*

**Under the Same Sky** is a web-based anonymous messaging platform that transforms unsaid thoughts and emotions into a shared, interactive night sky. It emphasizes emotional expression and impermanence, offering a calm, immersive 360° environment free from social metrics and user accounts.

---

## :sparkles: Core Concept

The application simulates the experience of gazing up at the night sky. Every message submitted by a user becomes a celestial object. The interface is minimal to preserve anonymity and emotional safety.

### Celestial Objects

* :star: **Stars:** The standard visualization for submitted messages.
* :comet: **Falling Stars:** A fleeting form the sender chooses at submission. They aren't pinned in the sky — one streaks across at random intervals, and clicking it mid-flight "catches" it to reveal the message.
* :izakaya_lantern: **Lanterns:** Wishes that float gently upward across the sky. The wish modal shows the live moon phase (wishing is themed around the **Full Moon**), but submitting is always open.

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
* **Form:** The sender chooses the form — a permanent **Star** or a fleeting **Falling Star**. Lanterns are sent from the separate wish form (themed around the Full Moon, always submittable).

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

* **Logic:** Stores the sender's chosen form (Star / Falling Star / Lantern) and assigns sky positions.
* **Moon phase:** Relays live lunar data (upstream API with local-astronomy fallback) for the wish modal's Full Moon display — informational only, it never gates submission.
* **API:** RESTful endpoints for submission and retrieval.

---

## :clipboard: Project Scope & Limitations

### Included

* Anonymous message submission.
* Visual distinction between message types (Star, Falling Star, Lantern).
* Randomized falling-star flybys to encourage presence.

### Excluded (By Design)

* User Authentication/Profiles.
* Direct Messaging or Replies.
* Message search or filtering.
* Edit functionality after submission.

### Known Limitations

* **Performance:** Rendering a high volume of objects in a 360° view may impact low-end devices.
* **Visibility:** Falling-star messages have no fixed position — each one only appears if randomly picked for a flyby and clicked mid-flight, so a given one may rarely be seen.
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
git clone https://github.com/iverene/Under-the-Same-Sky.git

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

