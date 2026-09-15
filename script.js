document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("youtubeUrlInput");
    const getBtn = document.getElementById("getThumbnailBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const alertBox = document.getElementById("alertBox");
    const statusToast = document.getElementById("statusToast");
    const resultSection = document.getElementById("resultSection");
    const previewImg = document.getElementById("previewImage");
    const videoTitle = document.getElementById("videoTitle");
    const videoIdCode = document.getElementById("videoIdCode");
    const qualityContainer = document.getElementById("qualityOptionsContainer");
    const triggerDownload = document.getElementById("triggerDownloadBtn");
    const tryAnother = document.getElementById("tryAnotherBtn");

    let videoData = null;
    let selectedQuality = null;

    // 🔥 তোমার আসল Adsterra ডিরেক্ট লিংক
    const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/tvr358mi?key=42f9df19181da8382b745111a6ead8f6";

    // অ্যাড দেখার বাধ্যতামূলক সময় (৬ সেকেন্ড)
    const REQUIRED_AD_SECONDS = 6;
    let adWatchStarted = false;
    let adStartTime = 0;

    // পেস্ট বাটন
    if (pasteBtn && navigator.clipboard) {
        pasteBtn.addEventListener("click", async () => {
            try {
                const txt = await navigator.clipboard.readText();
                if (txt) { urlInput.value = txt.trim(); fetchThumbnail(); }
            } catch {}
        });
    }

    getBtn.addEventListener("click", fetchThumbnail);
    urlInput.addEventListener("keypress", (e) => { if (e.key === "Enter") fetchThumbnail(); });

    async function fetchThumbnail() {
        const url = urlInput.value.trim();
        if (!url) { showAlert("দয়া করে একটি YouTube লিংক পেস্ট করুন।"); return; }
        hideToast();
        alertBox.classList.add("hidden");
        getBtn.disabled = true;
        getBtn.querySelector(".btn-text").textContent = "Fetching...";

        try {
            const res = await fetch("/api/fetch-thumbnail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (!data.success) { showAlert(data.error); return; }

            videoData = data;
            videoTitle.textContent = data.title;
            videoIdCode.textContent = data.video_id;

            selectedQuality = data.qualities[0];
            previewImg.src = selectedQuality.url;

            qualityContainer.innerHTML = "";
            data.qualities.forEach((q, idx) => {
                const b = document.createElement("button");
                b.className = `quality-btn ${idx === 0 ? "active" : ""}`;
                b.innerHTML = `<strong>${q.name}</strong><br><small>${q.resolution}</small>`;
                b.onclick = () => {
                    document.querySelectorAll(".quality-btn").forEach(el => el.classList.remove("active"));
                    b.classList.add("active");
                    selectedQuality = q;
                    previewImg.src = q.url;
                };
                qualityContainer.appendChild(b);
            });

            resultSection.classList.remove("hidden");
            resultSection.scrollIntoView({ behavior: "smooth" });
        } catch {
            showAlert("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            getBtn.disabled = false;
            getBtn.querySelector(".btn-text").textContent = "Get Thumbnail";
        }
    }

    // 🔥 ডাউনলোড বাটনে চাপ দিলে সরাসরি আসল বিজ্ঞাপন ওপেন হবে এবং ট্র্যাকিং শুরু হবে
    triggerDownload.addEventListener("click", () => {
        if (!videoData || !selectedQuality) return;

        adWatchStarted = true;
        adStartTime = Date.now();

        // ১. ব্রাউজারে নতুন ট্যাবে সাথে সাথে আসল বিজ্ঞাপন খুলে যাবে
        window.open(AD_DIRECT_LINK, "_blank");

        // ২. বাটনের টেক্সট পরিবর্তন ও মেসেজ দেখানো
        triggerDownload.disabled = true;
        triggerDownload.innerHTML = `<i class="fas fa-spinner fa-spin"></i> বিজ্ঞাপনটি দেখুন...`;

        showToast("info", "⏳ বিজ্ঞাপনটি ওপেন হয়েছে। থাম্বনেইল আনলক করতে বিজ্ঞাপনটিতে অন্তত ৬ সেকেন্ড থাকুন...");
    });

    // 🕵️‍♂️ ইউজার বিজ্ঞাপন দেখে আমাদের সাইটে ফিরে আসলে স্বয়ংক্রিয়ভাবে চেক হবে
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && adWatchStarted) {
            const timeSpent = (Date.now() - adStartTime) / 1000;

            // যদি সে ৬ সেকেন্ড বা তার বেশি সময় বিজ্ঞাপনে থেকে থাকে:
            if (timeSpent >= REQUIRED_AD_SECONDS) {
                adWatchStarted = false;
                triggerDownload.disabled = false;
                triggerDownload.innerHTML = `<i class="fas fa-check"></i> Download Thumbnail`;

                showToast("success", "✅ বিজ্ঞাপন দেখা সফল হয়েছে! আপনার থাম্বনেইল ডাউনলোড হচ্ছে...");

                // 🚀 কোনো ক্লিক ছাড়াই স্বয়ংক্রিয়ভাবে ফোনে ছবি ডাউনলোড হবে!
                executeFileDownload();
            } else {
                // যদি সে ৬ সেকেন্ডের আগে কেটে চলে আসে:
                adWatchStarted = false;
                triggerDownload.disabled = false;
                triggerDownload.innerHTML = `<i class="fas fa-download"></i> Download Thumbnail`;

                showToast("warning", "⚠️ সম্পূর্ণ বিজ্ঞাপনটি দেখা হয়নি! থাম্বনেইল ডাউনলোড করতে বিজ্ঞাপনটিতে অন্তত ৬ সেকেন্ড থাকুন।");
            }
        }
    });

    // আসল ছবি ডাউনলোড ফাংশন
    function executeFileDownload() {
        const a = document.createElement("a");
        a.href = `/download?id=${videoData.video_id}&quality=${selectedQuality.id}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    tryAnother.addEventListener("click", () => {
        urlInput.value = "";
        resultSection.classList.add("hidden");
        hideToast();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    function showToast(type, text) {
        statusToast.className = `status-toast ${type}`;
        statusToast.innerHTML = text;
    }

    function hideToast() {
        statusToast.className = "status-toast";
        statusToast.innerHTML = "";
    }

    function showAlert(msg) {
        alertBox.textContent = msg;
        alertBox.classList.remove("hidden");
    }
});