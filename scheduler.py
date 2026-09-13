import os, time, logging, requests
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Scheduler]: %(message)s")
logger = logging.getLogger("Scheduler")

APP_URL = os.environ.get("RENDER_EXTERNAL_URL", "").strip() or os.environ.get("APP_URL", "").strip()
PING_INTERVAL = int(os.environ.get("PING_INTERVAL_SECONDS", "600"))

def ping():
    if not APP_URL: return
    try:
        r = requests.get(APP_URL.rstrip("/") + "/health", timeout=15)
        logger.info("Health ping status: %s", r.status_code)
    except Exception as e:
        logger.error("Ping failed: %s", e)

if __name__ == "__main__":
    logger.info("Scheduler started...")
    while True:
        ping()
        time.sleep(PING_INTERVAL)
