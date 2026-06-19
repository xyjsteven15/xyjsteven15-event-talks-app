import re
import html
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
from datetime import datetime, timezone

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "http://www.w3.org/2005/Atom"


def strip_html(raw_html: str) -> str:
    """Strip HTML tags and decode entities to produce plain text."""
    text = re.sub(r"<[^>]+>", " ", raw_html)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def truncate_tweet(text: str, url: str, limit: int = 280) -> str:
    """Truncate text so the final tweet (text + space + url) fits in `limit` chars."""
    # Twitter counts URLs as 23 chars regardless of actual length
    url_len = 23
    available = limit - url_len - 1  # 1 for the space
    if len(text) > available:
        text = text[: available - 3] + "..."
    return f"{text} {url}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    try:
        resp = requests.get(FEED_URL, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as exc:
        return jsonify({"error": str(exc)}), 502

    try:
        root = ET.fromstring(resp.content)
    except ET.ParseError as exc:
        return jsonify({"error": f"XML parse error: {exc}"}), 500

    entries = []
    for entry in root.findall(f"{{{ATOM_NS}}}entry"):
        title_el = entry.find(f"{{{ATOM_NS}}}title")
        id_el = entry.find(f"{{{ATOM_NS}}}id")
        updated_el = entry.find(f"{{{ATOM_NS}}}updated")
        link_el = entry.find(f"{{{ATOM_NS}}}link[@rel='alternate']")
        content_el = entry.find(f"{{{ATOM_NS}}}content")

        title = title_el.text if title_el is not None else "Unknown"
        entry_id = id_el.text if id_el is not None else ""
        updated_raw = updated_el.text if updated_el is not None else ""
        link = link_el.get("href") if link_el is not None else ""
        content_html = content_el.text if content_el is not None else ""

        # Parse update categories from h3 tags
        categories = re.findall(r"<h3>(.*?)</h3>", content_html, re.IGNORECASE)

        plain_text = strip_html(content_html)
        tweet_text = truncate_tweet(f"📢 BigQuery Update ({title}): {plain_text}", link)

        # Format date nicely
        try:
            dt = datetime.fromisoformat(updated_raw)
            formatted_date = dt.strftime("%B %d, %Y")
        except ValueError:
            formatted_date = updated_raw

        entries.append(
            {
                "id": entry_id,
                "title": title,
                "formatted_date": formatted_date,
                "updated": updated_raw,
                "link": link,
                "content_html": content_html,
                "plain_text": plain_text,
                "tweet_text": tweet_text,
                "categories": list(set(categories)),
            }
        )

    feed_updated_el = root.find(f"{{{ATOM_NS}}}updated")
    feed_updated = feed_updated_el.text if feed_updated_el is not None else ""

    return jsonify(
        {
            "feed_updated": feed_updated,
            "count": len(entries),
            "entries": entries,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
