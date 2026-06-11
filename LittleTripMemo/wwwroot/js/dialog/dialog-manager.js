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
            if (e.target === this.backdrop) this.close();
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
                help = null, onClose = null, theme = null, isFooterFixed = true }) {
        const frame = $Dom.GenerateTemplate("tpl-dialog-frame", this.elementId);
        const titleEl = $Dom.QuerySelector("#dialog-title", frame);
        const contentEl = $Dom.QuerySelector("#dialog-content", frame);
        const headerActions = $Dom.QuerySelector("#dialog-header-actions", frame);
        const btnContainer = $Dom.QuerySelector("#dialog-button-container", frame);
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
        // 最後に「閉じる(✖)」ボタンを必ず追加
        const btnCloseX = document.createElement("button");
        btnCloseX.className = `${this.HEADER_BTN_CLASS} text-[0.8rem]`;
        btnCloseX.textContent = "✖";
        btnCloseX.onclick = () => this.close();
        headerActions.appendChild(btnCloseX);
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
                rowDiv.className = "w-full flex gap-3 " + (isFooterFixed === false ? "mt-4 pb-4" : "");
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
                // btnContainer.appendChild(rowDiv);
                targetContainer.appendChild(rowDiv);
            });
            // btnContainer.classList.remove("hidden");
            if (isFooterFixed !== false) {
                btnContainer.classList.remove("hidden");
            }
        }
        frame._onClose = onClose;
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

    // 【共通】汎用的な確認ダイアログ
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
    // 【共通】エラーダイアログを表示
    ShowError(message = "問題が発生しました。\nしばらくお待ちください。") {
        const el = $Dom.GenerateTemplate('tpl-confirm-base');
        const msgEl = $Dom.QuerySelector('.js-message', el);
        msgEl.innerText = message; // \n を改行として扱うため innerText を使用
        msgEl.classList.add("text-red-500"); // エラー色を付与
        this._core.open({
            title: "SYSTEM ERROR",
            content: el,
            buttons: [{
                label: "OK",
                className: "bg-slate-600 text-white",
                handler: () => this._core.close()
            }]
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
