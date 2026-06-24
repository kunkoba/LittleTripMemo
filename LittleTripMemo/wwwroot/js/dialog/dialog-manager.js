// 従ファイル群
import DialogSystem from './dialog-manager-system.js';
import DialogApp from './dialog-manager-app.js';
import DialogArchive from './dialog-manager-archive.js';
import DialogNotice from './dialog-manager-notice.js';
import DialogAdmin from './dialog-manager-admin.js';

// UI操作
const _DialogCore = {
    elementId: "ui-dialog-root",
    dialogRoot: null,
    backdrop: null,
    stack:[],
    // 共通クラス定数
    HEADER_BTN_CLASS: "w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 border border-brand-2 transition-transform",
    FOOTER_BTN_BASE:  "font-black text-[0.8rem] h-12 rounded-[1rem] uppercase active:scale-95 transition-transform",
    FOOTER_BTN_DEFAULT: "bg-brand-5 text-white shadow-md",
    // 初期化
    init() {
        this.dialogRoot = $Dom.GetElementById(this.elementId);
        this.backdrop = $Dom.GetElementById("ui-dialog-backdrop");
        // 1. 背景クリック時は「今のダイアログ」だけ閉じる（既存通り）
        this.backdrop.onclick = (e) => {
            // if (e.target === this.backdrop) this.close();
            if (e.target !== this.backdrop) return;
            if (this.stack[this.stack.length - 1]?._isModal) return; // モーダルなら閉じない
            this.close();
        };
        // 2. 「すべて閉じる」ボタンの onclick に直接 closeAll を設置
        const btnCloseAll = $Dom.GetElementById("dialog-btn-close-all");
        btnCloseAll.onclick = (e) => {
            e.stopPropagation(); // 背景の onclick (close) が動かないようにする
            this.closeAll();
        };
    },
    // ダイアログ開く
    open(options) {
        const frame = this.create(options);
        const prev = this.stack[this.stack.length - 1];
        if (prev) prev.classList.add("hidden");
        this.dialogRoot.appendChild(frame);
        this.stack.push(frame);
        this.backdrop.classList.remove("hidden");
        return frame;
    },
    // 1. _DialogCore の create メソッド修正
    create({ title = "", content = "", buttons = [], headerButtons = [], 
            help = null, onClose = null, theme = null, isFooterFixed = true, isModal = false, size = null }) {
        const frame = $Dom.GenerateTemplate("tpl-dialog-frame", this.elementId);
        frame._isModal = isModal; // フラグ保持
        const titleEl = $Dom.QuerySelector("#dialog-title", frame);
        const contentEl = $Dom.QuerySelector("#dialog-content", frame);
        const headerActions = $Dom.QuerySelector("#dialog-header-actions", frame);
        const btnContainer = $Dom.QuerySelector("#dialog-button-container", frame);
        // --- 【追加】サイズ（高さ）の制御 ---
        if (size === 'lg') {
            frameBg.classList.remove("max-h-[70vh]", "min-h-[40vh]");
            frameBg.classList.add("h-[70vh]"); // 最大固定
        } else if (size === 'md') {
            frameBg.classList.remove("max-h-[70vh]", "min-h-[40vh]");
            frameBg.classList.add("h-[50vh]"); // 中間固定
        } else {
            // frameBg.classList.add("max-h-[70vh]", "min-h-[20vh]"); // 可変（最小20vhに変更）
        }
        titleEl.textContent = title;
        // --- ヘルプ・ヘッダーボタン（上段）の構築 ---
        headerActions.innerHTML = ""; // 一旦クリア
        // 【追加】help 引数がある場合、ヘルプボタンを先頭に追加
        if (help) {
            const btnHelp = document.createElement("button");
            btnHelp.className = `${this.HEADER_BTN_CLASS} text-brand-5 font-black`;
            btnHelp.textContent = "?";
            btnHelp.onclick = () => {
                document.getElementById('ui-help-dialog-body').textContent = help;
                document.getElementById('ui-help-dialog').classList.remove('hidden');
            };
            headerActions.appendChild(btnHelp);
        }
        // 引数のカスタムボタンを追加
        if (headerButtons && headerButtons.length > 0) {
            headerButtons.forEach(btnDef => {
                const btn = document.createElement("button");
                btn.className = this.HEADER_BTN_CLASS;
                btn.innerHTML = btnDef.label;
                if (btnDef.id) btn.id = btnDef.id;
                btn.onclick = () => { if (btnDef.handler) btnDef.handler(); };
                headerActions.appendChild(btn);
            });
        }
        // ------------------------------------------
        if (content instanceof HTMLElement) {
            contentEl.innerHTML = "";
            contentEl.appendChild(content);
        } else {
            contentEl.innerHTML = content || "";
        }
        // 通報用レイアウト
        if (theme && theme === "black") {
            const frameBg = $Dom.QuerySelector(".pointer-events-auto", frame);
            const titleBar = $Dom.QuerySelector("#dialog-title-bar", frame);
            const titleText = $Dom.QuerySelector("#dialog-title", frame);
            // 外枠から角丸と色を外し、黒い直線的な枠にする
            frameBg.classList.remove("rounded-[1rem]", "border-brand-5", "bg-brand-0");
            frameBg.classList.add("rounded-none", "border-black", "bg-white");
            // ヘッダーを黒ベース＋赤文字にする
            titleBar.classList.remove("bg-brand-1");
            titleBar.classList.add("bg-black");
            titleText.classList.remove("text-brand-5");
            titleText.classList.add("text-red-500");
            // ボタンエリアの背景も白（角丸なし）に
            btnContainer.classList.remove("bg-brand-1");
            btnContainer.classList.add("bg-white", "border-t", "border-slate-300");
        }
        // フッター
        if (buttons && buttons.length > 0) {
            // isFooterFixed が false の場合は、スクロール領域(contentEl)の末尾にボタンを置く
            const targetContainer = (isFooterFixed === false) ? contentEl : btnContainer;
            buttons.forEach(rowDef => {
                const isArray = Array.isArray(rowDef);
                const items = isArray ? rowDef : (rowDef.items || [rowDef]);
                const rowDiv = document.createElement("div");
                // isFooterFixed が false（埋め込み）の時だけ mt-4 を追加
                rowDiv.className = "w-full flex gap-3 " + (isFooterFixed === false ? "my-4" : "");
                if (!isArray && rowDef.rowId) rowDiv.id = rowDef.rowId;
                if (!isArray && rowDef.isHidden) rowDiv.classList.add("hidden");
                const sizeClass = items.length > 1 ? "flex-1" : "w-full";
                items.forEach(btnDef => {
                    const btn = document.createElement("button");
                    btn.className = `${this.FOOTER_BTN_BASE} ${sizeClass} ${this.FOOTER_BTN_DEFAULT} ${btnDef.className}`;
                    btn.textContent = btnDef.label;
                    if (btnDef.id) btn.id = btnDef.id;
                    if (btnDef.isHidden) btn.classList.add("hidden");
                    btn.onclick = () => {
                        if (btnDef.handler) btnDef.handler();
                    };
                    rowDiv.appendChild(btn);
                });
                targetContainer.appendChild(rowDiv);
            });
            if (isFooterFixed !== false) {
                btnContainer.classList.remove("hidden");
            }
        }
        frame._onClose = onClose;
        // モーダルでない場合のみ「X」ボタンを追加
        if (!isModal) { 
            const btnCloseX = document.createElement("button");
            btnCloseX.className = `${this.HEADER_BTN_CLASS} text-[0.8rem]`;
            btnCloseX.textContent = "✖";
            btnCloseX.onclick = () => this.close();
            headerActions.appendChild(btnCloseX);
        }
        return frame;
    },
    // ダイアログ閉じる
    close() {
        const frame = this.stack.pop();
        if (frame) {
            if (frame._onClose) frame._onClose(); // 閉じる時にコールバックを実行
            frame.remove();
        }
        const prev = this.stack[this.stack.length - 1];
        if (prev) prev.classList.remove("hidden");
        if (this.stack.length === 0) {
            this.backdrop.classList.add("hidden");
        }
    },
    // 全部閉じる
    closeAll() {
        while (this.stack.length > 0) {
            const frame = this.stack.pop();
            if (frame) {
                if (frame._onClose) frame._onClose(); // 閉じる時にコールバックを実行
                frame.remove();
            }
        }
        this.backdrop.classList.add("hidden");
    },
};

const DialogController = {
    // 🌟 コアを内包させる（従ファイルからは this._core でアクセス）
    _core: _DialogCore,

    // 【共通】確認用ダイアログ
    async ShowConfirm({ title = "", message = "", label = "OK", help = ""}) {
        return new Promise((resolve) => {
            const el = $Dom.GenerateTemplate('tpl-confirm-base');
            $Dom.QuerySelector('.js-message', el).textContent = message;
            let isResolved = false;
            this._core.open({
                title: title,
                content: el,
                help: help,
                onClose: () => { if (!isResolved) resolve(false); },
                buttons: [[
                    { label: "CANCEL", className: "bg-slate-400 text-white shadow-md", handler: () => { isResolved = true; resolve(false); this._core.close(); } },
                    { label: label, handler: () => { isResolved = true; resolve(true); this._core.close(); } }
                ]]
            });
        });
    },
    // 【共通】エラー用ダイアログ
    ShowErrorDialog(message) {
        console.log("ShowErrorDialog:", message);
        const el = $Dom.GenerateTemplate('tpl-dialog-error');
        const msgEl = $Dom.QuerySelector('.js-error-message', el);
        // 補足情報の流し込み
        msgEl.textContent = message || "通信環境を確認するか、しばらく時間をおいてから再度お試しください。";
        const frame = this._core.open({
            title: "SYSTEM ERROR",
            isModal: true, // 背景クリックやXボタンで閉じさせない
            content: el,
            buttons: [[{
                label: "RELOAD",
                className: "bg-brand-5 text-white w-full",
                handler: () => $Util.ReloadApp()
            }]]
        });
        // ✖ボタンを強制非表示にして閉じられないようにする
        const headerActions = frame.querySelector("#dialog-header-actions");
        if (headerActions && headerActions.lastChild) {
            headerActions.lastChild.classList.add("hidden");
        }
    },
    // 【共通】入力用ダイアログ
    async ShowInput({ title = "", message = "", type = "text", placeholder = "", initialValue = "", label = "OK" }) {
        return new Promise((resolve) => {
            const div = document.createElement('div');
            div.className = "w-full p-4 space-y-3";
            if (message) {
                const msg = document.createElement('p');
                msg.className = "text-[0.85rem] font-bold text-slate-600";
                msg.textContent = message;
                div.appendChild(msg);
            }
            const input = (type === 'textarea') 
                ? document.createElement('textarea') 
                : document.createElement('input');
                
            input.className = "w-full border-2 border-brand-3 px-4 py-2 text-[1rem] rounded-[1rem] focus:outline-none focus:border-brand-5 bg-white";
            if (type === 'textarea') {
                input.classList.add("h-[150px]", "resize-none");
            } else {
                input.type = type; // text, password等
                input.classList.add("text-[1.2rem]", "font-bold");
            }
            input.placeholder = placeholder;
            input.value = initialValue;
            div.appendChild(input);
            let isResolved = false;
            this._core.open({
                title: title,
                content: div,
                onClose: () => { if (!isResolved) resolve(null); },
                buttons: [[
                    { label: "CANCEL", className: "bg-slate-400 text-white shadow-md", handler: () => { isResolved = true; resolve(null); this._core.close(); } },
                    { label: label, handler: () => { isResolved = true; resolve(input.value); this._core.close(); } }
                ]]
            });
            setTimeout(() => input.focus(), 100);
        });
    },

    // 🌟 従ファイルをスプレッド構文で展開して結合
    ...DialogSystem,
    ...DialogApp,
    ...DialogArchive,
    ...DialogNotice,
    ...DialogAdmin,
};

// 初期処理
DialogController._core.init();

export default DialogController;
