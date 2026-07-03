
const IconRegistry = {
    // 【辞書】使いたいアイコンをここに登録していく
    icons: {
        // 例: Heroicons等の一般的な 24x24 サイズ
        "home": { 
            viewBox: "0 0 24 24", 
            html: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>' 
        },
        // 塗りつぶしアイコンの例
        "user": { 
            viewBox: "0 0 24 24", 
            html: '<path fill-rule="evenodd" d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 12c-2.67 0-8 1.337-8 4v2h16v-2c0-2.663-5.33-4-8-4z" clip-rule="evenodd"/>' 
        }
    },
    // アプリ起動時に1回だけ呼ばれ、HTMLに見えないSVGの壁を生成する
    Init() {
        console.log("- UI:icon >> Init");
        const svgNS = "http://www.w3.org/2000/svg";
        const svgElement = document.createElementNS(svgNS, "svg");
        svgElement.setAttribute("style", "display: none;");
        let symbols = '';
        for (const [key, data] of Object.entries(this.icons)) {
            symbols += `<symbol id="icon-${key}" viewBox="${data.viewBox}">${data.html}</symbol>`;
        }
        svgElement.innerHTML = symbols;
        // bodyの一番最初にこっそり挿入
        document.body.insertBefore(svgElement, document.body.firstChild);
    }
};

export default IconRegistry;
