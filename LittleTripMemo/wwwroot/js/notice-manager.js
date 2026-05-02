// notice-controller.js
const Notice = {
    _toast(message, type = "info") {
        const root = $Dom.GenerateTemplate("tpl-toast", "toast-container");
        const el = $Dom.QuerySelector("div", root);
        const config = {
            info:  { bg: "rgba(22, 163, 74, 0.8)" },   // 緑
            warn:  { bg: "rgba(234, 88, 12, 0.8)" },   // オレンジ
            error: { bg: "rgba(220, 38, 38, 0.8)" },   // 赤
        };
        const c = config[type] || config.info;
        el.style.background = c.bg;
        el.style.color = "#fff";
        $Dom.QuerySelector(".message", el).textContent = message;
        setTimeout(() => {
            el.classList.remove("opacity-0", "-translate-y-2");
            el.classList.add("opacity-100", "translate-y-0");
        }, 0);
        setTimeout(() => {
            el.classList.add("opacity-0", "-translate-y-2");
            el.classList.remove("opacity-100", "translate-y-0");
            setTimeout(() => root.remove(), 300);
        }, 5 * 1000);
        root.addEventListener("click", () => {
            el.classList.add("opacity-0", "-translate-y-2");
            el.classList.remove("opacity-100", "translate-y-0");
            setTimeout(() => root.remove(), 300);
        });
    },
    // ラッパーメソッド
    Info(msg) { this._toast(msg, "info"); },
    Warn(msg) { this._toast(msg, "warn"); },
    Error(msg) { this._toast(msg, "error"); },
    // ローディング
    Loading: {
        Show() {
            if (!this.el) {
                this.el = $Dom.GenerateTemplate("tpl-loading");
            }
            this.el.classList.remove("opacity-0", "pointer-events-none");
        },
        Hide() {
            if (!this.el) return;
            this.el.classList.add("opacity-0", "pointer-events-none");
        }
    },
    // オフライン通知
    Offline: {
        Show() {
            if (!this.el) {
                // const tpl = document.getElementById("tpl-offline");
                // this.el = tpl.content.firstElementChild.cloneNode(true);
                // document.body.appendChild(this.el);
                this.el = $Dom.GenerateTemplate("tpl-offline");
            }
            this.el.classList.remove("opacity-0", "pointer-events-none");
        },
        Hide() {
            if (!this.el) return;
            this.el.classList.add("opacity-0", "pointer-events-none");
        }
    }
};

export default Notice;
