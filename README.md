# 📊 BigQuery Release Notes Viewer

A sleek, dark-themed web application that fetches the latest **Google BigQuery release notes** from the official Google Cloud Atom feed and presents them in a clean, filterable UI — with one-click sharing to **X (Twitter)**.

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=flat-square&logo=flask&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🔄 **Live feed** — Fetches directly from Google Cloud's official Atom XML feed
- ⚡ **Refresh button** — Animated spinner with instant skeleton-card placeholders while loading
- 🗂️ **Category filters** — Filter by `Feature`, `Announcement`, `Issue`, `Deprecated`, and more
- 📖 **Expand / Collapse** — Long entries are clipped with a gradient fade; click to read in full
- 🐦 **Tweet sharing** — Pre-fills an editable tweet with a summary + link; live 280-char counter
- 🔗 **Docs deep-link** — Each card links directly to the matching section on Google Cloud Docs
- 🌑 **Dark glassmorphism UI** — Animated background particles, hover glow, smooth micro-animations
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Server** | Python 3.8+, Flask 3.x |
| **HTTP client** | `requests` |
| **XML parsing** | `xml.etree.ElementTree` (stdlib) |
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2020) |
| **Fonts** | Inter, JetBrains Mono (Google Fonts) |
| **Data source** | [BigQuery Atom Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml) |

---

## 📁 Project Structure

```
bigquery-release-notes/
├── app.py               # Flask server — routes, XML parsing, JSON API
├── requirements.txt     # Python dependencies
├── .gitignore
├── templates/
│   └── index.html       # Single-page HTML template
└── static/
    ├── style.css        # Dark theme, animations, responsive layout
    └── app.js           # All client-side logic (fetch, render, filter, tweet)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- `pip`

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/xyjsteven15/xyjsteven15-event-talks-app.git
   cd xyjsteven15-event-talks-app
   ```

2. **Create and activate a virtual environment** *(recommended)*

   ```bash
   python -m venv venv
   source venv/bin/activate      # macOS / Linux
   venv\Scripts\activate         # Windows
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app**

   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to:

   ```
   http://127.0.0.1:5001
   ```

> **Note:** Port `5001` is used intentionally to avoid conflicts with AirPlay on macOS (which uses port 5000).

---

## 🔌 API Reference

The server exposes two endpoints:

### `GET /`
Returns the main HTML page.

### `GET /api/release-notes`
Fetches, parses, and returns the BigQuery release notes as JSON.

**Response (200 OK):**
```json
{
  "feed_updated": "2026-06-17T00:00:00-07:00",
  "count": 42,
  "entries": [
    {
      "id": "tag:google.com,2016:bigquery-release-notes#June_17_2026",
      "title": "June 17, 2026",
      "formatted_date": "June 17, 2026",
      "updated": "2026-06-17T00:00:00-07:00",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_17_2026",
      "content_html": "<h3>Feature</h3><p>…</p>",
      "plain_text": "Feature You can enable autonomous embedding …",
      "tweet_text": "📢 BigQuery Update (June 17, 2026): Feature … https://docs.cloud…",
      "categories": ["Feature"]
    }
  ]
}
```

**Error response (502):**
```json
{ "error": "Connection timeout or upstream error message" }
```

---

## 🐦 How Tweet Sharing Works

1. Click the **Tweet** button on any release note card
2. A modal opens with a pre-written, editable tweet:
   ```
   📢 BigQuery Update (June 17, 2026): <plain-text summary> <docs URL>
   ```
3. Edit freely — the live character counter turns **yellow** at 240 chars and **red** past 280
4. Click **Post on X** → opens `twitter.com/intent/tweet` in a popup window (no API key needed)

---

## 🏗️ Architecture

```
Browser  ──GET /──►  Flask  ──requests.get──►  Google Cloud (Atom XML)
         ◄──HTML──           ◄──XML──
         ──GET /api/release-notes──►
         ◄──JSON (parsed entries)──
```

Flask acts as a **proxy and transformer**: it fetches raw Atom XML, strips HTML,
extracts categories, formats dates, pre-computes tweet text, and returns clean JSON.
The browser then owns all rendering, filtering, and interactivity with no page reloads.

---

## 📸 UI Highlights

| Element | Detail |
|---|---|
| Header | Sticky, glassmorphic, with live status dot |
| Cards | Mouse-tracking radial glow on hover |
| Skeletons | Shimmer placeholders appear before data loads |
| Filter chips | Dynamically built from feed content |
| Tweet modal | Slide-up animation, editable textarea, char counter |
| Toast | Slide-up notification on load and tweet actions |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Feed Source:** [BigQuery Release Notes XML](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)
- **BigQuery Release Notes (Web):** [docs.cloud.google.com](https://docs.cloud.google.com/bigquery/docs/release-notes)
- **Repository:** [github.com/xyjsteven15/xyjsteven15-event-talks-app](https://github.com/xyjsteven15/xyjsteven15-event-talks-app)
