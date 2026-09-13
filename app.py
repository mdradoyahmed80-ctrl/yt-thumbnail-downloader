import os, re, logging, requests, io
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, abort

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "yt-thumb-secret-key-2026")
START_TIME = datetime.utcnow()
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36"

QUALITIES = [
    {"id": "maxres", "name": "Max / 1080p", "filename": "maxresdefault.jpg", "resolution": "1920 x 1080", "badge": "Highest"},
    {"id": "high", "name": "High / 720p", "filename": "hqdefault.jpg", "resolution": "1280 x 720", "badge": "HD"},
    {"id": "medium", "name": "Medium", "filename": "mqdefault.jpg", "resolution": "640 x 480", "badge": "SD"},
    {"id": "default", "name": "Default", "filename": "default.jpg", "resolution": "480 x 360", "badge": "Standard"}
]

def extract_id(url):
    patterns = [r'(?:v=|\/|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})']
    for p in patterns:
        m = re.search(p, url.strip())
        if m: return m.group(1)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url.strip()): return url.strip()
    return None

def get_meta(vid):
    try:
        r = requests.get(f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={vid}&format=json", headers={"User-Agent": USER_AGENT}, timeout=4)
        if r.status_code == 200:
            d = r.json()
            return d.get("title", "YouTube Video"), d.get("author_name", "Creator")
    except: pass
    return "YouTube Video Thumbnail", "Creator"

def check_qualities(vid):
    avail = []
    base = f"https://img.youtube.com/vi/{vid}"
    for q in QUALITIES:
        url = f"{base}/{q['filename']}"
        try:
            h = requests.head(url, headers={"User-Agent": USER_AGENT}, timeout=3)
            if h.status_code == 200:
                if q["id"] == "maxres" and int(h.headers.get("Content-Length", 0)) < 1500: continue
                avail.append({"id": q["id"], "name": q["name"], "url": url, "resolution": q["resolution"], "badge": q["badge"]})
        except:
            if q["id"] in ["high", "default"]:
                avail.append({"id": q["id"], "name": q["name"], "url": url, "resolution": q["resolution"], "badge": q["badge"]})
    if not avail:
        avail.append({"id": "high", "name": "High / 720p", "url": f"{base}/hqdefault.jpg", "resolution": "1280 x 720", "badge": "HD"})
    return avail

@app.route("/")
def index(): return render_template("index.html")

@app.route("/about")
def about(): return render_template("about.html")

@app.route("/privacy")
def privacy(): return render_template("privacy.html")

@app.route("/terms")
def terms(): return render_template("terms.html")

@app.route("/contact", methods=["GET", "POST"])
def contact(): return render_template("contact.html", submitted=(request.method == "POST"))

@app.route("/api/fetch-thumbnail", methods=["POST"])
def api_fetch():
    data = request.get_json() or {}
    vid = extract_id(data.get("url", ""))
    if not vid: return jsonify({"success": False, "error": "সঠিক YouTube ভিডিও লিংক দিন।"}), 400
    title, author = get_meta(vid)
    qualities = check_qualities(vid)
    return jsonify({"success": True, "video_id": vid, "title": title, "author": author, "qualities": qualities})

@app.route("/download")
def download():
    vid = request.args.get("id")
    quality = request.args.get("quality", "high")
    if not vid: return abort(400)
    target = "hqdefault.jpg"
    for q in QUALITIES:
        if q["id"] == quality: target = q["filename"]; break
    url = f"https://img.youtube.com/vi/{vid}/{target}"
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=10)
    return send_file(io.BytesIO(r.content), mimetype="image/jpeg", as_attachment=True, download_name=f"thumb_{vid}_{quality}.jpg")

@app.route("/health")
def health(): return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
