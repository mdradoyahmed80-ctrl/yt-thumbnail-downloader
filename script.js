document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("youtubeUrlInput");
    const getBtn = document.getElementById("getThumbnailBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const alertBox = document.getElementById("alertBox");
    const resultSection = document.getElementById("resultSection");
    const previewImg = document.getElementById("previewImage");
    const videoTitle = document.getElementById("videoTitle");
    const videoIdCode = document.getElementById("videoIdCode");
    const qualityContainer = document.getElementById("qualityOptionsContainer");
    const triggerDownload = document.getElementById("triggerDownloadBtn");
    const tryAnother = document.getElementById("tryAnotherBtn");

    // Ad Modal & Floating Badge Elements
    const adModal = document.getElementById("adModal");
    const floatingTimerBadge = document.getElementById("floatingTimerBadge");

    const loadingModal = document.getElementById("loadingModal");
    const completeModal = document.getElementById("completeModal");
    const closeCompleteModal = document.getElementById("closeCompleteModalBtn");

    let videoData = null;
    let selectedQuality = null;
    let timer = null;

    // 🔥 তোমার Adsterra ডিরেক্ট লিংক
    const AD_DIRECT_LINK = "https://www.profitableratecpmnetwork.com/tvr358mi?key=42f9df19181da8382b745111a6ead8f6";

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

    // ডাউনলোড বাটনে চাপ দিলে বিজ্ঞাপনের ওপর ভাসমান ছোট ৫ সেকেন্ডের টাইমার চালু হবে
    triggerDownload.addEventListener("click", () => {
        if (!videoData || !selectedQuality) return;

        adModal.classList.remove("hidden");
        let left = 5;

        // শুরুর টাইমার ব্যাজ
        floatingTimerBadge.className = "floating-timer-badge";
        floatingTimerBadge.innerHTML = `<span>⏱️ Ad: </span><span id="countdownNumber">${left}</span>s`;

        clearInterval(timer);
        timer = setInterval(() => {
            left--;
            const countEl = document.getElementById("countdownNumber");
            if (countEl) countEl.textContent = left;

            // ৫ সেকেন্ড শেষ হলে টাইমার বদলে সবুজ "Close & Download" বাটনে রূপ নেবে!
            if (left <= 0) {
                clearInterval(timer);
                floatingTimerBadge.className = "";
                floatingTimerBadge.innerHTML = `
                    <button type="button" id="adCloseActionBtn" class="floating-close-btn">
                        <i class="fas fa-times"></i> Close & Download
                    </button>
                `;

                // ইউজার যখন ওই কোণার ক্লোজ বাটনে চাপ দেবে
                document.getElementById("adCloseActionBtn").addEventListener("click", () => {
                    // ১. সাথে সাথে নতুন ট্যাবে বিজ্ঞাপন ওপেন হবে (টাকা ইনকাম হবে)
                    window.open(AD_DIRECT_LINK, "_blank");

                    // ২. বিজ্ঞাপনটি সাথে সাথে স্ক্রিন থেকে কেটে যাবে
                    adModal.classList.add("hidden");
                    loadingModal.classList.remove("hidden");

                    // ৩. স্বয়ংক্রিয়ভাবে ছবি ডাউনলোড হয়ে ফোনে সেভ হবে!
                    setTimeout(() => {
                        loadingModal.classList.add("hidden");
                        const a = document.createElement("a");
                        a.href = `/download?id=${videoData.video_id}&quality=${selectedQuality.id}`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        completeModal.classList.remove("hidden");
                    }, 1000);
                });
            }
        }, 1000);
    });

    closeCompleteModal.addEventListener("click", () => completeModal.classList.add("hidden"));
    tryAnother.addEventListener("click", () => { urlInput.value = ""; resultSection.classList.add("hidden"); window.scrollTo({top:0, behavior:"smooth"}); });

    function showAlert(msg) { alertBox.textContent = msg; alertBox.classList.remove("hidden"); }
});