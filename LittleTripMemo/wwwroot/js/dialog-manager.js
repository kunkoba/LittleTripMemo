// UI操作
const _DialogCore = {
    elementId: "ui-dialog-root",
    dialogRoot: null,
    backdrop: null,
    stack:[],
    // 初期化
    init() {
        this.dialogRoot = $Dom.GetElementById(this.elementId);
        this.backdrop = $Dom.GetElementById("ui-dialog-backdrop");
        // 背景クリック時は最前面のダイアログを閉じる
        this.backdrop.onclick = () => this.close();
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
    create({ title = "", content = "", buttons =[], onClose = null }) {
        const frame = $Dom.GenerateTemplate("tpl-dialog-frame", this.elementId);
        const titleEl = $Dom.QuerySelector("#dialog-title", frame);
        const contentEl = $Dom.QuerySelector("#dialog-content", frame);
        const btnCloseX = $Dom.QuerySelector("#dialog-btn-close-x", frame);
        const btnContainer = $Dom.QuerySelector("#dialog-button-container", frame);
        titleEl.textContent = title;
        if (content instanceof HTMLElement) {
            contentEl.innerHTML = "";
            contentEl.appendChild(content);
        } else {
            contentEl.innerHTML = content || "";
        }
        btnCloseX.onclick = () => this.close();
        if (buttons && buttons.length > 0) {
            buttons.forEach(rowDef => {
                const isArray = Array.isArray(rowDef);
                const items = isArray ? rowDef : (rowDef.items || [rowDef]);
                const rowDiv = document.createElement("div");
                rowDiv.className = "w-full flex gap-3";
                if (!isArray && rowDef.rowId) rowDiv.id = rowDef.rowId;
                if (!isArray && rowDef.isHidden) rowDiv.classList.add("hidden");
                const sizeClass = items.length > 1 ? "flex-1" : "w-full";
                const baseClass = `${sizeClass} font-black text-[14px] h-12 rounded-2xl uppercase active:scale-95 transition-transform`;
                const defaultColorClass = "bg-brand-5 text-white shadow-md";
                items.forEach(btnDef => {
                    const btn = document.createElement("button");
                    btn.className = btnDef.className
                        ? `${baseClass} ${btnDef.className}`
                        : `${baseClass} ${defaultColorClass}`;
                    btn.textContent = btnDef.label;
                    if (btnDef.id) btn.id = btnDef.id;
                    if (btnDef.isHidden) btn.classList.add("hidden");
                    btn.onclick = () => {
                        if (btnDef.handler) btnDef.handler();
                        if (btnDef.closesDialog !== false) this.close();
                    };
                    rowDiv.appendChild(btn);
                });
                btnContainer.appendChild(rowDiv);
            });
            btnContainer.classList.remove("hidden");
        } else {
            // btnContainer.classList.add("hidden");
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
    // (以降はそのまま)
    _renderTimelineChild(child, item, hasLine = true) {
        // ...
    },
};
// 窓口
const DialogController = {
    // 【共通】汎用的な確認ダイアログを表示する
    async ShowConfirm({ title = "", message = "", label = "OK" }) {
        return new Promise((resolve) => {
            const el = $Dom.GenerateTemplate('tpl-confirm-base');
            // クラス名を指定してメッセージ表示用要素を取得しテキストを設定
            $Dom.QuerySelector('.js-message', el).textContent = message;
            let isResolved = false;
            _DialogCore.open({
                title: title,
                content: el,
                // ダイアログが閉じた時に未解決ならキャンセル(false)扱い
                onClose: () => {
                    if (!isResolved) resolve(false);
                },
                // 動的ボタン生成
                buttons: [
                    [
                        {
                            label: "CANCEL",
                            className: "bg-slate-400 text-white shadow-sm",
                            handler: () => { isResolved = true; resolve(false); }
                        },
                        {
                            label: label,
                            handler: () => { isResolved = true; resolve(true); }
                        }
                    ]
                ]
            });
        });
    },
    // 【基幹】システムメニューを表示
    ShowSystemMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-system');
        const btnAuth = $Dom.QuerySelector('#btn-sys-auth', el);
        const authLabel = $Dom.QuerySelector('span:last-child', btnAuth);
        const isLoggedIn = $App.AppData.System.IsLoggedIn;
        authLabel.textContent = isLoggedIn ? "LOGOUT" : "LOGIN";
        // 各ボタンの紐付け（次階層の呼び出しなど）
        $Dom.QuerySelector('#btn-sys-user-profile', el).onclick = async () => {
            const isSuccess = await $Data.Access.GetProfile();
            if (isSuccess && $App.AppData.Owner.Profile) {
                this.ShowUserProfile($App.AppData.Owner.Profile, true);
            }
        };
        $Dom.QuerySelector('#btn-sys-user-config', el).onclick = () => { this.ShowUserSettingsMenu(); };
        $Dom.QuerySelector('#btn-sys-notice', el).onclick = () => { this.ShowNoticeList(); };
        $Dom.QuerySelector('#btn-sys-version', el).onclick = () => { this.ShowAppInfo(); };
        $Dom.QuerySelector('#btn-sys-admin', el).onclick = () => { this.ShowAdminMenu(); };
        btnAuth.onclick = async () => {
            if (isLoggedIn) {
                const isOk = await this.ShowConfirm({ title: "LOGOUT", message: "ログアウトしますか？" });
                if (isOk) {
                    _DialogCore.closeAll();
                    $App.AppData.System.IsLoggedIn = false;
                    $App.AppData.Owner.Token = null;
                    $App._saveSettings();
                    $Notice.Info("Logged out.");
                    setTimeout(() => location.reload(), 500);
                }
            } else {
                this.ShowLoginDialog();
            }
        };
        _DialogCore.open({ title: "SYSTEM MENU", content: el, ok: null });
    },
    // （システム）ユーザー設定メニュー（第2階層）
    ShowUserSettingsMenu() {
        const el = $Dom.GenerateTemplate("tpl-menu-user-settings");
        $Dom.QuerySelector('#btn-set-theme', el).onclick = () => this.ShowThemeConfig();
        $Dom.QuerySelector('#btn-set-map', el).onclick = () => this.ShowMapStyleConfig();
        $Dom.QuerySelector('#btn-set-gps', el).onclick = () => this.ShowGpsFollowConfig();
        $Dom.QuerySelector('#btn-set-currency', el).onclick = () => this.ShowCurrencyConfig();
        //
        _DialogCore.open({ title: "USER SETTINGS", content: el, ok: null });
    },
    // （システム）テーマ設定ダイアログ
    ShowThemeConfig() {
        const oldTheme = $App.AppData.Owner.Theme;
        // プレビュー用バーを0-5までループ生成
        let previewItems = '';
        for (let i = 0; i <= 5; i++) {
            const textColor = i > 2 ? 'text-white' : 'text-black-3';
            previewItems += `<div class="w-full h-10 bg-brand-${i} border border-brand-2 flex items-center px-4 text-[11px] font-bold ${textColor}">LEVEL ${i} PREVIEW</div>`;
        }
        const html = `
            <div class="p-6 w-full space-y-6 bg-brand-0">
                <div class="flex justify-between items-center border-b border-brand-2 pb-6">
                    <button id="th-btn-blue" class="w-12 h-12 bg-[#0ea5e9] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-green" class="w-12 h-12 bg-[#22c55e] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-red" class="w-12 h-12 bg-[#ef4444] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-yellow" class="w-12 h-12 bg-[#eab308] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                </div>
                <div class="space-y-1">${previewItems}</div>
            </div>`;
        const el = document.createElement('div');
        el.style.width = "100%";
        el.innerHTML = html;
        const bind = (id, theme) => $Dom.QuerySelector(id, el).onclick = () => $UI.ChangeTheme(theme);
        bind('#th-btn-blue', 'blue'); bind('#th-btn-green', 'green'); bind('#th-btn-red', 'red'); bind('#th-btn-yellow', 'yellow');
        _DialogCore.open({
            title: "THEME CONFIG",
            content: el,
            buttons: [
                {
                    label: "OK",
                    handler: () => {
                        // 現在のテーマ属性値を取得
                        const current = document.documentElement.getAttribute('data-theme');
                        // テーマの変更・保存処理を実行
                        $App.ChangeTheme(current);
                    }
                }
            ]
        });
    },
    // （システム）マップスタイル設定ダイアログ
    ShowMapStyleConfig() {
        const oldStyle = $App.AppData.Owner.MapStyle;
        let selectedStyle = oldStyle;
        // スタイル一覧をループ生成
        let listHtml = '';
        Object.values($Map.MAP_STYLE).forEach(style => {
            listHtml += `
                <button id="ms-btn-${style.key}" class="w-full h-14 grid grid-cols-10 items-center px-4 border-b border-brand-2 hover:bg-brand-1 active:bg-brand-2 transition-colors text-black-5">
                    <span class="col-span-1 flex justify-center text-lg">🗺️</span>
                    <span class="col-span-1"></span>
                    <span class="col-span-8 text-left font-bold text-[15px] uppercase">${style.name}</span>
                </button>`;
        });
        const el = document.createElement('div');
        el.className = "w-full bg-brand-0";
        el.innerHTML = listHtml;
        // 各ボタンにプレビューイベントを紐付け
        Object.values($Map.MAP_STYLE).forEach(style => {
            $Dom.QuerySelector(`#ms-btn-${style.key}`, el).onclick = () => {
                selectedStyle = style;
                $Map.SetMapStyle(style); // 地図を一時切替
            };
        });
        _DialogCore.open({
            title: "MAP STYLE CONFIG",
            content: el,
            buttons: [
                {
                    label: "OK",
                    handler: () => {
                        // 選択されたマップスタイルを適用・保存
                        $App.ChangeMapStyle(selectedStyle);
                    }
                }
            ]
        });
    },
    // （システム）通貨単位設定ダイアログ
    ShowCurrencyConfig() {
        const el = $Dom.GenerateTemplate("tpl-config-currency");
        const inputCurrency = $Dom.QuerySelector('#input-currency', el);
        // 現在の値をセット
        inputCurrency.value = $App.AppData.Owner.currency_unit || 'JPY';
        _DialogCore.open({
            title: "CURRENCY CONFIG",
            content: el,
            buttons: [
                {
                    label: "OK",
                    handler: () => {
                        const val = inputCurrency.value.trim();
                        // 空の場合は JPY をデフォルトとする
                        $App.ChangeCurrency(val || 'JPY');
                        $Notice.Info("Changes saved.");
                    }
                }
            ]
        });
    },
    // （システム）アプリ情報
    ShowAppInfo() {
        const el = $Dom.GenerateTemplate("tpl-app-info");
        // $Const.APP_INFO から情報を埋め込む
        $Dom.QuerySelector('.js-app-name', el).textContent = $Const.APP_INFO.NAME;
        $Dom.QuerySelector('.js-app-version', el).textContent = `Version ${$Const.APP_INFO.VERSION}`;
        $Dom.QuerySelector('.js-app-developer', el).textContent = $Const.APP_INFO.DEVELOPER;
        const linkOfficial = $Dom.QuerySelector('#link-info-official', el);
        if ($Const.APP_INFO.OFFICIAL_SITE) {
            linkOfficial.href = $Const.APP_INFO.OFFICIAL_SITE;
        } else {
            $Dom.ToggleShow(linkOfficial, false);
        }
        // systemInfo からスコア平均を取得して反映
        const sysInfo = $App.AppData.Owner.systemInfo || {};
        console.log(">sysInfo:", sysInfo);
        const scoreAvg = sysInfo.score_avg || 0;
        $Dom.QuerySelector('.js-app-score', el).textContent = `★ ${scoreAvg.toFixed(1)}`;
        $Dom.QuerySelector('#btn-info-review', el).onclick = () => this.ShowReviewList();
        $Dom.QuerySelector('#btn-info-license', el).onclick = () => $Notice.Info($Const.APP_INFO.LICENSE || "No License Info");
        _DialogCore.open({
            title: "APP INFO",
            content: el,
            buttons:[]
        });
    },
    // アプリ評価・レビュー一覧（フィードバック一覧）
    ShowReviewList() {
        const el = $Dom.GenerateTemplate("tpl-review-list");
        const container = $Dom.QuerySelector(".js-review-container", el);
        // systemInfo からフィードバック情報を取得
        const sysInfo = $App.AppData.Owner.systemInfo || {};
        console.log(">sysInfo:", sysInfo);
        const feedbackList = sysInfo.feedbacks ||[];
        const scoreAvg = sysInfo.score_avg || 0;
        $Dom.QuerySelector(".js-avg-score", el).textContent = scoreAvg.toFixed(1);
        $Dom.QuerySelector(".js-avg-stars", el).textContent = "★".repeat(Math.round(scoreAvg)) + "☆".repeat(5 - Math.round(scoreAvg));
        $Dom.QuerySelector(".js-total-reviews", el).textContent = `Recent ${feedbackList.length} feedbackList`;
        if (feedbackList.length === 0) {
            container.innerHTML = `<div class="text-center text-[12px] font-bold text-slate-400 py-6">フィードバックはありません</div>`;
        } else {
            feedbackList.forEach(rev => {
                const child = $Dom.GenerateTemplate("tpl-list-child-review");
                const score = rev.score || 0;
                $Dom.QuerySelector(".js-stars", child).textContent = "★".repeat(score) + "☆".repeat(5 - score);
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(rev.create_tim, "YYYY.MM.DD");
                $Dom.QuerySelector(".js-body", child).textContent = rev.body || "（内容なし）";
                container.appendChild(child);
            });
        }
        // $Dom.QuerySelector('#btn-post-review', el).onclick = () => this.ShowReviewPost();
        _DialogCore.open({
            title: "FEEDBACKS",
            content: el,
            buttons:[
                {
                    label: "Write Feedback",
                    className: "bg-brand-5 text-white shadow-md",
                    closesDialog: false,
                    handler: async () => {
                        this.ShowReviewPost();
                    }
                }
            ]
        });
    },
    // レビュー（フィードバック）投稿画面
    async ShowReviewPost() {
        // ★ ダイアログを開く前に自分の過去の投稿データを取得
        const isSuccess = await $Data.Access.GetMyFeedback();
        if (!isSuccess) return;
        // 取得したデータがあれば初期値として設定
        const myFeedback = $App.AppData.Owner.myFeedback;
        let currentRating = myFeedback ? (myFeedback.score || 5) : 5;
        let currentBody = myFeedback ? (myFeedback.body || "") : "";
        const el = $Dom.GenerateTemplate("tpl-review-post");
        const starContainer = $Dom.QuerySelector('#review-star-input', el);
        const inputRating = $Dom.QuerySelector('#input-review-rating', el);
        const inputBody = $Dom.QuerySelector('#input-review-body', el);
        const countBody = $Dom.QuerySelector('#review-text-count', el);
        // 初期値の反映
        inputRating.value = currentRating;
        inputBody.value = currentBody;
        countBody.textContent = currentBody.length;
        const stars =[];
        // 星ボタンの生成と制御
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("button");
            star.textContent = "★";
            // 初期値の星の着色
            if (i <= currentRating) {
                star.className = "outline-none transition-colors active:scale-90 text-yellow-500";
            } else {
                star.className = "outline-none transition-colors active:scale-90 text-slate-200";
            }
            star.onclick = () => {
                currentRating = i;
                inputRating.value = currentRating;
                stars.forEach((s, idx) => {
                    if (idx < currentRating) {
                        s.classList.add("text-yellow-500");
                        s.classList.remove("text-slate-200");
                    } else {
                        s.classList.add("text-slate-200");
                        s.classList.remove("text-yellow-500");
                    }
                });
            };
            stars.push(star);
            starContainer.appendChild(star);
        }
        inputBody.addEventListener("input", () => {
            countBody.textContent = inputBody.value.length;
        });
        _DialogCore.open({
            // データが既にあれば編集（EDIT）、なければ新規（WRITE）
            title: myFeedback ? "EDIT FEEDBACK" : "WRITE FEEDBACK",
            content: el,
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-200 text-slate-500 shadow-sm",
                    closesDialog: true
                },
                {
                    label: "SUBMIT",
                    className: "bg-brand-5 text-white shadow-md",
                    closesDialog: false,
                    handler: async () => {
                        const rating = Number(inputRating.value);
                        const body = inputBody.value.trim();
                        const req = { body: body, score: rating };
                        const isSubmitSuccess = await $Data.Access.UpsertFeedback(req);
                        if (!isSubmitSuccess) return;
                        console.log(">$App.AppData.Owner.myFeedback:", $App.AppData.Owner.myFeedback);
                        $App.AppData.Owner.myFeedback.score = rating;
                        $App.AppData.Owner.myFeedback.body = body;
                        console.log($App.AppData.Owner.myFeedback);
                        $Notice.Info("フィードバックを送信しました！");
                        // 投稿ダイアログと一覧ダイアログを閉じて、最新の状態で一覧を開き直す
                        _DialogCore.closeAll(); // 投稿を閉じる
                        // システム情報を取得
                        $Data.Access.GetSystemInfo();
                    }
                }
            ]]
        });
    },
    // アイコン選択ダイアログを表示
    ShowIconPicker(items, onSelect) {
        const el = document.createElement("div");
        el.className = "grid grid-cols-5 gap-2 p-2 my-5";
        // アイコン一覧を生成
        items.forEach(item => {
            const id = item.faceId ?? item.weatherId ?? item.id;
            const btn = document.createElement("button");
            btn.className = "aspect-square border-2 bg-white rounded active:scale-90 flex items-center justify-center p-1";
            // 画像の流し込み
            const img = document.createElement("img");
            img.src = item.imgUrl || item.url;
            img.className = "w-full h-full object-contain pointer-events-none";
            // クリック時に値を適用して閉じる
            btn.onclick = () => {
                onSelect(id);
                _DialogCore.closeAll();
            };
            btn.appendChild(img);
            el.appendChild(btn);
        });
        // ダイアログを表示
        _DialogCore.open({
            title: "SELECT",
            content: el,
            ok: null
        });
    },
    // 絵文字選択（定数リスト＋履歴保存、入力欄反映・OK確定）
    ShowEmojiPicker(onSelect, emojiList = $Const.FACE_EMOJIS) {
        const storageKey = 'ritomemo_emoji_history';
        let history = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const el = $Dom.GenerateTemplate("tpl-emoji-picker");
        const inputCustom = $Dom.QuerySelector('#input-custom-emoji', el);
        const combinedGrid = $Dom.QuerySelector('#emoji-combined-grid', el);
        // グリッド描画処理
        const renderGrid = () => {
            const combinedList = [...new Set([...emojiList, ...history])].slice(0, 50);
            combinedGrid.innerHTML = combinedList.map(e =>
                `<button class="w-10 h-10 rounded-xl hover:bg-slate-50 active:bg-slate-100 active:scale-90 flex items-center justify-center text-[28px] leading-none transition-all">
                    ${e}
                </button>`
            ).join('');
            $Dom.QuerySelectorAll('button', combinedGrid).forEach(btn => {
                btn.onclick = () => {
                    // クリック時は入力欄に反映するだけ
                    inputCustom.value = btn.textContent.trim();
                };
            });
        };
        // 初期描画
        renderGrid();
        // 履歴クリア
        $Dom.QuerySelector('#btn-clear-emoji', el).onclick = async () => {
            const isOk = await this.ShowConfirm({ title: "CLEAR HISTORY", message: "履歴を削除しますか？" });
            if (!isOk) return;
            localStorage.removeItem(storageKey);
            history =[];
            renderGrid();
        };
        // ダイアログを表示
        _DialogCore.open({
            title: "SELECT ICON",
            content: el,
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-100 text-slate-400 shadow-sm",
                        closesDialog: true
                    },
                    {
                        label: "OK",
                        className: "bg-brand-5 text-white shadow-md",
                        closesDialog: false,
                        handler: () => {
                            const val = inputCustom.value.trim();
                            if (val) {
                                // 履歴を更新して確定
                                history = [val, ...history.filter(e => e !== val)].slice(0, 50);
                                localStorage.setItem(storageKey, JSON.stringify(history));
                                onSelect(val);
                            }
                            _DialogCore.close();
                        }
                    }
                ]
            ]
        });
    },
    // 座標・住所指定で移動する
    PointSearchGoogle(onOk) {
        const el = $Dom.GenerateTemplate('tpl-point-search-google');
        _DialogCore.open({
            title: "地点・住所検索",
            content: el,
            buttons: [
                {
                    label: "GO！",
                    closesDialog: false, // 独自で制御するため自動で閉じさせない
                    handler: $Warn.CatchAsync(async () => {
                        // IDを指定して入力要素を取得し、前後の空白を除去した値を取得
                        const val = $Dom.QuerySelector("#inputPointValue", el).value.trim();
                        if (!val) { $Notice.Warn("No input provided."); return; }
                        let pos = $Util.ParseLatLng(val);
                        if (!pos) {
                            pos = await $Util.SearchAddressByWord(val);
                        }
                        if (pos && onOk) {
                            onOk(pos);
                            _DialogCore.closeAll(); // 見つかった時だけ手動で閉じる
                        } else {
                            $Notice.Warn("Not found.");
                        }
                    })
                }
            ]
        });
    },
    // GPS追従設定
    ShowGpsFollowConfig() {
        const isOn = $App.AppData.Owner.IsGpsTracking;
        const el = $Dom.GenerateTemplate("tpl-config-gps");
        const btnOn = $Dom.QuerySelector('#gps-btn-on', el);
        const btnOff = $Dom.QuerySelector('#gps-btn-off', el);
        // 現在の状態を反映
        $Dom.QuerySelector('.js-icon', btnOn).textContent = isOn ? '●' : '○';
        $Dom.QuerySelector('.js-icon', btnOff).textContent = !isOn ? '●' : '○';
        // if (isOn) btnOn.classList.add('bg-brand-1'); else btnOff.classList.add('bg-brand-1');
        // イベント紐付け
        btnOn.onclick = () => {
            let isOn = $App.AppData.Owner.IsGpsTracking;
            $Dom.QuerySelector('.js-icon', btnOn).textContent = isOn ? '○' : '●';
            $Dom.QuerySelector('.js-icon', btnOff).textContent = !isOn ? '○' : '●';
            $App.ChangeGpsTracking(true);
            // _DialogCore.closeAll();
        };
        btnOff.onclick = () => {
            let isOn = $App.AppData.Owner.IsGpsTracking;
            $Dom.QuerySelector('.js-icon', btnOn).textContent = isOn ? '○' : '●';
            $Dom.QuerySelector('.js-icon', btnOff).textContent = !isOn ? '○' : '●';
            $App.ChangeGpsTracking(false);
            // _DialogCore.closeAll();
        };
        _DialogCore.open({ title: "GPS TRACKING", content: el, ok: null });
    },
    // 地点リスト（単一選択・ジャンプ機能）
    ShowDetailsTimeLine() {
        // Storeの機能を使って昇順にソート
        // $Data.Store.SortDetails("date", "asc");
        const details = $Data.Store.GetAllDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("No data.");
            return;
        }
        const el = $Dom.GenerateTemplate("tpl-timeline-container");
        const listContainer = $Dom.QuerySelector(".js-list-container", el);
        let currentDate = ""; // 現在描画中の日付を保持
        // すでにソート済みなので、上から順にループするだけでOK！
        details.forEach((item, index) => {
            const dateStr = (item.memo_date || "").replace(/-/g, '.');
            // 日付が変わったタイミングでだけヘッダーを差し込む
            if (currentDate !== dateStr) {
                const header = $Dom.GenerateTemplate("tpl-timeline-date");
                $Dom.QuerySelector(".js-date-text", header).textContent = dateStr;
                listContainer.appendChild(header);
                currentDate = dateStr;
            }
            // アイテムの描画
            const child = $Dom.GenerateTemplate("tpl-timeline-item");
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = item.body || "";
            // 金額のセットと色分け
            const priceEl = $Dom.QuerySelector(".js-price", child);
            if (priceEl) {
                const price = Number(item.memo_price || 0);
                if (price > 0) {
                    priceEl.textContent = `+${price.toLocaleString()}`;
                    priceEl.className = "js-price text-[14px] font-black shrink-0 whitespace-nowrap text-blue-500";
                } else if (price < 0) {
                    priceEl.textContent = price.toLocaleString();
                    priceEl.className = "js-price text-[14px] font-black shrink-0 whitespace-nowrap text-red-500";
                } else {
                    priceEl.textContent = "";
                }
            }
            child.onclick = () => {
                _DialogCore.closeAll();
                $Marker.SelectMarker(index); // details自体がソート済みなので、このindexをそのまま使える
            };
            listContainer.appendChild(child);
        });
        _DialogCore.open({
            title: "TRIP LOG",
            content: el,
            buttons: []
        });
        setTimeout(() => {
            const activeFrame = _DialogCore.stack[_DialogCore.stack.length - 1];
            if (activeFrame) {
                const titleText = $Dom.QuerySelector('#dialog-title', activeFrame);
                if (titleText) {
                    titleText.classList.remove('truncate');
                    titleText.classList.add('flex', 'flex-col', 'justify-center', 'leading-tight');
                    titleText.innerHTML = `TRIP LOG <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 not-italic">CHRONOLOGICAL ARCHIVE</span>`;
                }
            }
        }, 10);
    },
    // ログイン処理
    ShowLoginDialog() {
        const el = $Dom.GenerateTemplate("tpl-login");
        // Googleログインボタン
        $Dom.QuerySelector("#btn-login-google", el).onclick = $Err.CatchAsync(async () => {
            // 認証処理を実行
            const isLoginSuccess = await $App.ExecuteLoginFlow();
            if (!isLoginSuccess) {
                // 失敗時はコンソールにエラーを出力して中断
                console.error("ログイン失敗");
                return;
            }
            // 表示されているすべてのダイアログを破棄
            _DialogCore.closeAll();
            // 画面表示内容を最新の状態に更新
            $App.RefreshScreen();
        });
        _DialogCore.open({
            title: "LOGIN",
            content: el,
            ok: null,
        });
    },
    // まとめ親一覧選択
    ShowArchiveList() {
        $Warn.CatchAsync(async () => {
            const isSuccess = await $Data.Access.GetArchiveList();
            if (!isSuccess) return;
            const root = $Dom.GenerateTemplate("tpl-list-parent");
            // リストの上下の余白を少し調整
            root.className = "w-full text-black-3 mb-2 px-1";
            const archives = $Data.Store.GetArchiveList() ||[];
            if (archives.length == 0){
                $Notice.Warn("データはありません");
                return;
            }
            // is_public で分類
            const privateList = archives.filter(item => !item.is_public);
            const publicList  = archives.filter(item => item.is_public);
            // リスト描画処理
            const renderGroup = (title, list, isPublicGroup) => {
                if (list.length === 0) return;
                // ヘッダーの生成
                const header = $Dom.GenerateTemplate("tpl-list-group-header");
                // クラス名を指定してヘッダーのバッジ要素を取得
                const badgeEl = $Dom.QuerySelector(".js-header-badge", header);
                // クラス名を指定してタイトル表示要素を取得しテキストを設定
                $Dom.QuerySelector(".js-header-title", header).textContent = title;
                // グループごとのヘッダーカラーとアイコン
                if (isPublicGroup) {
                    // バッジ要素にパブリック用の背景色クラスを追加
                    badgeEl.classList.add("bg-brand-5");
                    // クラス名を指定してアイコン表示要素を取得しパブリック用記号を設定
                    $Dom.QuerySelector(".js-header-icon", header).textContent = "◎";
                } else {
                    // バッジ要素にプライベート用の背景色クラスを追加
                    badgeEl.classList.add("bg-slate-800");
                    // クラス名を指定してアイコン表示要素を取得しプライベート用記号を設定
                    $Dom.QuerySelector(".js-header-icon", header).textContent = "🔒";
                }
                root.appendChild(header);
                // アイテムの生成
                list.forEach(item => {
                    const child = $Dom.GenerateTemplate("tpl-list-child-archive");
                    $Dom.QuerySelector(".js-title", child).textContent = item.title;
                    $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim, 'YYYY-MM-DD  HH:mm:ss');
                    $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                    $Dom.QuerySelector(".js-count", child).textContent = item.cnt || "0";
                    const badge = $Dom.QuerySelector(".js-badge", child);
                    const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                    if (isPublicGroup) {
                        if (item.closed_flg) {
                            // Publicデータ（CLOSE）
                            badge.textContent = "Close";
                            badge.className = "js-badge text-[10px] font-black px-2 py-0.5 rounded-md uppercase italic border border-slate-200 bg-white text-slate-400";
                            leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-200"; // 左線グレー
                        } else {
                            // Publicデータ（OPEN）
                            badge.textContent = "OPEN";
                            badge.className = "js-badge text-[10px] font-black px-2 py-0.5 rounded-md uppercase italic border border-blue-100 bg-brand-2 text-brand-5 shadow-sm";
                            leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-brand-5"; // 左線ブランドカラー
                        }
                    } else {
                        // 内部データ（PRIVATE）
                        badge.textContent = "PRIVATE";
                        badge.className = "js-badge text-[10px] font-black px-2 py-0.5 rounded-md uppercase italic border border-slate-200 bg-slate-100 text-slate-400 shadow-sm";
                        leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-800"; // 左線ブランドカラー
                    }
                    child.onclick = () => {
                        _DialogCore.closeAll();
                        $App.AppData.System.ScreenMode = isPublicGroup
                            ? $Const.SCREEN_MODE.ARCHIVE_PUB
                            : $Const.SCREEN_MODE.ARCHIVE;
                        $App.AppData.System.TargetArchiveId = item.archive_id;
                        $App.RefreshScreen();
                    };
                    root.appendChild(child);
                });
            };
            renderGroup("PRIVATE ARCHIVE", privateList, false);
            renderGroup("PUBLIC ARCHIVE", publicList, true);
            // ダイアログを開く
            _DialogCore.open({
                title: "ARCHIVE LIST",
                content: root,
                buttons: []
            });
        })();
    },
    // 既存まとめへの追加先選択ダイアログ
    SelectArchiveForAdd(seqs) {
        $Warn.CatchAsync(async () => {
            // 最新のアーカイブリストを取得
            const isSuccess = await $Data.Access.GetArchiveList();
            if (!isSuccess) return;
            const root = $Dom.GenerateTemplate("tpl-list-parent");
            root.className = "w-full text-black-3 mb-2 px-1";
            const archives = $Data.Store.GetArchiveList() ||[];
            // 🌟 プライベートデータのみに絞る
            const privateList = archives.filter(item => !item.is_public);
            if (privateList.length === 0) {
                $Notice.Warn("No ArchiveData.");
                return;
            }
            // ヘッダーの生成
            const header = $Dom.GenerateTemplate("tpl-list-group-header");
            $Dom.QuerySelector(".js-header-badge", header).classList.add("bg-slate-800");
            $Dom.QuerySelector(".js-header-icon", header).textContent = "🔒";
            $Dom.QuerySelector(".js-header-title", header).textContent = "SELECT TARGET ARCHIVE";
            root.appendChild(header);
            // リスト描画
            privateList.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-list-child-archive");
                $Dom.QuerySelector(".js-title", child).textContent = item.title;
                $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim, "YYYY-MM-DD  HH:mm:ss");
                $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                $Dom.QuerySelector(".js-count", child).textContent = item.cnt || "0";
                // バッジの装飾（PRIVATE固定）
                const badge = $Dom.QuerySelector(".js-badge", child);
                const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                badge.textContent = "PRIVATE";
                badge.className = "js-badge text-[9px] font-black px-2 py-0.5 rounded-md uppercase italic border border-slate-200 bg-slate-100 text-slate-400 shadow-sm";
                leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-800";
                // アイテムクリック時の処理（追加確認 ＆ API実行）
                child.onclick = async () => {
                    const isOk = await this.ShowConfirm({
                        title: "ADD",
                        message: `${seqs.length}件のアイテムを「${item.title}」に追加しますか？`
                    });
                    if (!isOk) return;
                    const params = { seqs: seqs, archive_id: item.archive_id };
                    const isAddSuccess = await $Data.Access.AddDetails(params);
                    if (!isAddSuccess) return;
                    $Notice.Info("Added successfully.");
                    _DialogCore.closeAll();
                    // ARCHIVEモードに切り替えて対象のまとめを開く
                    $App.AppData.System.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                    $App.AppData.System.TargetArchiveId = item.archive_id;
                    await $App.RefreshScreen();
                };
                root.appendChild(child);
            });
            // 選択用ダイアログを開く
            _DialogCore.open({
                title: "SELECT ARCHIVE",
                content: root,
                buttons: []
            });
        })();
    },
    // メモをまとめる（複数選択モード）
    ShowMultiSelectTimeline() {
        const details = $Data.Store.GetAllDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("No data.");
            return;
        }
        const content = $Dom.GenerateTemplate("tpl-multi-select-content");
        const listContainer = $Dom.QuerySelector(".js-list-container", content);
        const selectedSeqs = new Set();
        let frame = null; // ダイアログ生成後に保持
        const updateSelectionUI = () => {
            const hasSelection = selectedSeqs.size > 0;
            // フッター内に生成されたボタンの活性制御
            if (frame) {
                // 時間差で取得
                const btnMerge = frame.querySelector('#btn-ms-merge');
                const btnAdd = frame.querySelector('#btn-ms-add');
                const btnDelete = frame.querySelector('#btn-ms-delete');
                if (btnMerge) btnMerge.disabled = !hasSelection;
                if (btnAdd) btnAdd.disabled = !hasSelection;
                if (btnDelete) btnDelete.disabled = !hasSelection;
            }
            $Dom.QuerySelectorAll(".js-item-card", content).forEach(card => {
                const seq = Number(card.dataset.seq);
                const isSel = selectedSeqs.has(seq);
                const checkbox = $Dom.QuerySelector(".js-checkbox", card);
                const mark = $Dom.QuerySelector(".js-check-mark", card);
                if (isSel) {
                    card.className = "js-item-card flex items-center gap-3 p-3 mb-2 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all border-brand-5 bg-white shadow-md";
                    checkbox.className = "shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center js-checkbox transition-colors border-brand-5 bg-brand-5";
                    mark.classList.remove("hidden");
                } else {
                    card.className = "js-item-card flex items-center gap-3 p-3 mb-2 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all border-brand-1 bg-white";
                    checkbox.className = "shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center js-checkbox transition-colors border-brand-2 bg-transparent";
                    mark.classList.add("hidden");
                }
            });
        };
        const groups = {};
        details.forEach(item => {
            const dateStr = item.memo_date.replace(/-/g, '.');
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        sortedDates.forEach(date => {
            const header = $Dom.GenerateTemplate("tpl-multi-select-date");
            $Dom.QuerySelector(".js-date-text", header).textContent = date;
            header.onclick = () => {
                const groupItems = groups[date];
                const isAllSelected = groupItems.every(item => selectedSeqs.has(item.seq));
                groupItems.forEach(item => {
                    if (isAllSelected) selectedSeqs.delete(item.seq);
                    else selectedSeqs.add(item.seq);
                });
                updateSelectionUI();
            };
            listContainer.appendChild(header);
            groups[date].sort((a, b) => b.memo_time.localeCompare(a.memo_time)).forEach(item => {
                const card = $Dom.GenerateTemplate("tpl-multi-select-item");
                card.dataset.seq = item.seq;
                $Dom.QuerySelector(".js-time", card).textContent = item.memo_time;
                $Dom.QuerySelector(".js-title", card).textContent = item.title;
                $Dom.QuerySelector(".js-body", card).textContent = item.body;
                $Dom.QuerySelector(".js-emoji", card).textContent = item.face_emoji || '😀';
                card.onclick = () => {
                    if (selectedSeqs.has(item.seq)) selectedSeqs.delete(item.seq);
                    else selectedSeqs.add(item.seq);
                    updateSelectionUI();
                };
                listContainer.appendChild(card);
            });
        });
        updateSelectionUI();
        frame = _DialogCore.open({
            title: "SELECTION MODE",
            content: content,
            buttons: [
                [
                    {
                        id: "btn-ms-merge",
                        label: "⇄ MERGE",
                        className: "min-w-[40%] bg-brand-5 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2",
                        closesDialog: false,
                        handler: async () => {
                            const seqs = Array.from(selectedSeqs);
                            const isOk = await this.ShowConfirm({ title: "MERGE", message: `${seqs.length}件のアイテムを\n新しいまとめにしますか？` });
                            if (!isOk) return;
                            const isSuccess = await $Data.Access.MergeDetails({
                                seqs,
                                title: "TripMemory_" + $Util.FormatDate(new Date(), 'YYYYMMDD_HHmmss'),
                                currency_unit: $App.AppData.Owner.currency_unit || 'JPY'
                            });
                            if (!isSuccess) return;
                            $Notice.Info("作成しました");
                            _DialogCore.closeAll();
                            $App.AppData.System.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                            await $App.RefreshScreen();
                        }
                    },
                    {
                        id: "btn-ms-add",
                        label: "＋ ADD",
                        className: "min-w-[40%] bg-brand-5 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2",
                        closesDialog: false, // 🌟 手動で制御するためfalse
                        handler: () => {
                            const seqs = Array.from(selectedSeqs);
                            // 新しく作った専用メソッドを呼び出す
                            this.SelectArchiveForAdd(seqs);
                        }
                    },
                ]
            ]
        });
        updateSelectionUI(); // フッターボタン生成後に再度呼んで初期状態の disabled を反映
    },
    // 地図用のシンプルリスト表示
    ShowDetailsSimpleList() {
        const details = $Data.Store.GetAllDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("No data.");
            return;
        }
        const el = $Dom.GenerateTemplate("tpl-list-parent");
        el.className = "w-full text-black-3 mb-2 px-1 space-y-4";
        const headerHtml = `
            <div class="flex justify-between items-center mb-6 mt-2 px-1">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></div>
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">HIT MEMOS</span>
                </div>
                <div class="bg-white border border-slate-100 rounded-full px-3 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                    <span class="text-[10px] font-black text-slate-600 tracking-wider">${details.length} FOUND</span>
                </div>
            </div>
        `;
        el.insertAdjacentHTML('beforeend', headerHtml);
        details.forEach((item, index) => {
            const child = $Dom.GenerateTemplate("tpl-list-child-simple");
            const dateStr = (item.memo_date || "").replace(/-/g, '.');
            $Dom.QuerySelector(".js-date", child).textContent = dateStr;
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            // 本文の改行をスペースに置換してセット
            const bodyStr = (item.body || "").replace(/\r?\n/g, ' ');
            $Dom.QuerySelector(".js-body", child).textContent = bodyStr;
            // 金額のセットと色分け
            const priceEl = $Dom.QuerySelector(".js-memo-price", child);
            const currencyEl = $Dom.QuerySelector(".js-memo-currency", child);
            if (priceEl && currencyEl) {
                const price = Number(item.memo_price || 0);
                // 通貨単位の判定
                let displayCurrency = $App.AppData.Owner.currency_unit || 'JPY';
                if (item.archive_id > 0) {
                    const archiveList = $Data.Store.GetArchiveList() ||[];
                    const targetArc = archiveList.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                    if (targetArc && targetArc.currency_unit) {
                        displayCurrency = targetArc.currency_unit;
                    }
                }
                if (price > 0) {
                    priceEl.textContent = `+${price.toLocaleString()}`;
                    priceEl.className = "js-memo-price text-[10px] font-black text-blue-500";
                    currencyEl.textContent = displayCurrency;
                } else if (price < 0) {
                    priceEl.textContent = price.toLocaleString();
                    priceEl.className = "js-memo-price text-[10px] font-black text-red-500";
                    currencyEl.textContent = displayCurrency;
                } else {
                    // 0円の時は枠を詰めるために中身を空に
                    priceEl.textContent = "";
                    currencyEl.textContent = "";
                }
            }
            child.onclick = () => {
                _DialogCore.closeAll();
                $Marker.SelectMarker(index);
            };
            el.appendChild(child);
        });
        _DialogCore.open({
            title: "SEARCH RESULTS",
            content: el,
            buttons: []
        });
        setTimeout(() => {
            const activeFrame = _DialogCore.stack[_DialogCore.stack.length - 1];
            if (activeFrame) {
                const titleText = $Dom.QuerySelector('#dialog-title', activeFrame);
                if (titleText) {
                    titleText.classList.remove('truncate');
                    titleText.classList.add('flex', 'flex-col', 'justify-center', 'leading-tight');
                    titleText.innerHTML = `SEARCH RESULTS <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 not-italic">INDEPENDENT MEMOS</span>`;
                }
            }
        }, 10);
    },
    // 【基幹】アプリメニューを表示
    ShowAppMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-app');
        const mode = $App.AppData.System.ScreenMode;
        // 各ボタンを一度だけ取得してオブジェクトに格納
        const b = {
            create: $Dom.QuerySelector('#btn-app-create', el),
            current: $Dom.QuerySelector('#btn-app-current', el),
            restore: $Dom.QuerySelector('#btn-app-restore', el),
            detailList: $Dom.QuerySelector('#btn-app-list', el),
            batch:   $Dom.QuerySelector('#btn-app-batch', el),
            point:   $Dom.QuerySelector('#btn-app-point', el),
            archiveList: $Dom.QuerySelector('#btn-app-archive-list', el),
            search: $Dom.QuerySelector('#btn-app-search', el),
        };
        // 表示制御（取得済みの変数を使用）
        if (mode === $Const.SCREEN_MODE.CREATE) $Dom.ToggleShow(b.create, false);
        if (mode === $Const.SCREEN_MODE.CREATE) $Dom.ToggleShow(b.batch, true);
        if (mode === $Const.SCREEN_MODE.SEARCH) $Dom.ToggleShow(b.point, true);
        if (mode == $Const.SCREEN_MODE.SEARCH) $Dom.ToggleShow(b.search, false);
        // イベント登録（取得済みの変数を使用）
        b.create.onclick = () => { $App.AppData.System.ScreenMode = $Const.SCREEN_MODE.CREATE; $App.RefreshScreen(); _DialogCore.close(); };
        b.current.onclick = () => { $Marker.RefreshCurrentLocation(); $Marker.FocusToLocationMarker(); _DialogCore.close(); };
        b.restore.onclick = () => { $Marker.RestoreMarkers(); _DialogCore.close(); };
        b.detailList.onclick = () => mode === $Const.SCREEN_MODE.SEARCH ? this.ShowDetailsSimpleList() : this.ShowDetailsTimeLine();
        b.batch.onclick = () => { this.ShowMultiSelectTimeline({ onOk: (l) => console.log(l) }); };
        b.point.onclick = () => { this.PointSearchGoogle((p) => $Map.MoveMap(p.lat, p.lng, 18)); };
        b.archiveList.onclick = () => { this.ShowArchiveList(); };
        b.search.onclick = () => { $App.AppData.System.ScreenMode = $Const.SCREEN_MODE.SEARCH; $App.RefreshScreen(); _DialogCore.close(); };
        //
        _DialogCore.open({ title: "APP MENU", content: el, ok: null });
    },
    // 状態変更の定型処理ヘルパー
    async _execStatusChange(methodName, params, confirmTitle, confirmMsg, successMsg, nextScreenMode = null, onUpdateStore = null) {
        // Promiseで結果を待つ
        const isOk = await this.ShowConfirm({ title: confirmTitle, message: confirmMsg });
        if (!isOk) return; // キャンセルならここで終了
        // OKだった場合のAPI実行処理
        await $Warn.CatchAsync(async () => {
            const isSuccess = await $Data.Access[methodName](params);
            if (!isSuccess) return;
            if (onUpdateStore) onUpdateStore();
            $Notice.Info(successMsg);
            _DialogCore.closeAll();
            if (nextScreenMode) {
                $App.AppData.System.ScreenMode = nextScreenMode;
                await $App.RefreshScreen();
            } else {
                const archive = $Data.Store.GetArchive();
                if (archive) $TopBar.ChangeTitle(archive.title);
            }
        })();
    },
    // 環境コード選択ダイアログ
    ShowAtmospherePicker(currentCode, onOk) {
        const el = $Dom.GenerateTemplate('tpl-setting-weather');
        const rngWind = $Dom.QuerySelector('#atm-wind', el);
        const rngDensity = $Dom.QuerySelector('#atm-density', el);
        const rngDarkness = $Dom.QuerySelector('#atm-darkness', el);
        const weatherBtns = $Dom.QuerySelectorAll('.atm-w-btn', el);
        const txtWindVal = $Dom.QuerySelector('#atm-wind-val', el);
        const txtDensityVal = $Dom.QuerySelector('#atm-density-val', el);
        const txtDarknessVal = $Dom.QuerySelector('#atm-darkness-val', el);
        const txtCode = $Dom.QuerySelector('#atm-code-preview', el);
        // 初期値の適用
        let codeStr = String(currentCode || "0000").padStart(4, '0');
        let currentW = codeStr[0];
        rngWind.value = codeStr[1];
        rngDensity.value = codeStr[2];
        rngDarkness.value = codeStr[3];
        const applyEffect = () => {
            const w = rngWind.value;
            const d = rngDensity.value;
            const a = rngDarkness.value;
            txtWindVal.textContent = w;
            txtDensityVal.textContent = d;
            txtDarknessVal.textContent = a;
            const code = `${currentW}${w}${d}${a}`;
            txtCode.textContent = code;
            if (typeof Atmosphere !== 'undefined') {
                if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '9999';
                Atmosphere.show(code);
            }
        };
        rngWind.addEventListener('input', applyEffect);
        rngDensity.addEventListener('input', applyEffect);
        rngDarkness.addEventListener('input', applyEffect);
        weatherBtns.forEach(btn => {
            if (btn.dataset.val === currentW) {
                btn.classList.replace('bg-white', 'bg-brand-5');
                btn.classList.replace('text-black-5', 'text-white');
                btn.classList.replace('border-brand-3', 'border-brand-5');
            }
            btn.addEventListener('click', (e) => {
                weatherBtns.forEach(b => {
                    b.classList.remove('bg-brand-5', 'text-white', 'border-brand-5');
                    b.classList.add('bg-white', 'text-black-5', 'border-brand-3');
                });
                const target = e.currentTarget;
                target.classList.remove('bg-white', 'text-black-5', 'border-brand-3');
                target.classList.add('bg-brand-5', 'text-white', 'border-brand-5');
                currentW = target.dataset.val;
                applyEffect();
            });
        });
        applyEffect(); // ダイアログを開いた瞬間にエフェクト適用
        _DialogCore.open({
            title: "ATMOSPHERE SETTING",
            content: el,
            onClose: () => {
                // キャンセル・✕ボタン・背景クリック時などにエフェクトを戻す
                if (typeof Atmosphere !== 'undefined') {
                    Atmosphere.hide();
                    if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '0';
                }
            },
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-sm"
                        // onCloseが自動で呼ばれるのでhandlerは不要
                    },
                    {
                        label: "OK",
                        handler: () => {
                            const finalCode = txtCode.textContent;
                            if (onOk) onOk(finalCode);
                        }
                    }
                ]
            ]
        });
    },
    // まとめ親参照（アーカイブ）
    ShowArchiveInfo() {
        const archive = $Data.Store.GetArchive();
        if (!archive) return $Notice.Warn("Not found.");
        const el = $Dom.GenerateTemplate('tpl-view-archive');
        // 参照画面の描画処理（保存後にも再利用してリフレッシュする）
        const renderView = () => {
            $Dom.QuerySelector('#view-mem-title', el).textContent = archive.title || "";
            $Dom.QuerySelector('#view-mem-body', el).textContent = archive.memo || "";
            const viewUrl = $Dom.QuerySelector('#view-mem-url', el);
            const urlWrapper = $Dom.QuerySelector('#view-mem-url-wrapper', el);
            if (archive.link_url) {
                viewUrl.textContent = archive.link_url;
                viewUrl.href = archive.link_url;
                $Dom.ToggleShow(urlWrapper, true);
            } else {
                $Dom.ToggleShow(urlWrapper, false);
            }
            // 統計データの計算
            const details = $Data.Store.GetAllDetails() ||[];
            const totalPrice = details.reduce((sum, item) => sum + Number(item.memo_price || 0), 0);
            $Dom.QuerySelector('#mem-stat-count', el).textContent = details.length;
            const priceBox = $Dom.QuerySelector('#view-mem-price-box', el);
            const priceVal = $Dom.QuerySelector('#mem-stat-price', el);
            const priceLabel = $Dom.QuerySelector('#view-mem-price-label', el);
            const displayCurrency = archive.currency_unit || $App.AppData.Owner.currency_unit || 'JPY';
            if (totalPrice > 0) {
                priceBox.className = "rounded-2xl p-3 flex flex-col items-center justify-center border border-blue-100 bg-blue-50 shadow-sm";
                priceVal.className = "text-[18px] font-black text-blue-600";
                priceLabel.className = "text-[8px] font-black uppercase text-blue-500 mb-1";
                priceVal.innerHTML = `${totalPrice.toLocaleString()} <span class="text-[10px] text-blue-400 ml-0.5">${displayCurrency}</span>`;
            } else if (totalPrice < 0) {
                priceBox.className = "rounded-2xl p-3 flex flex-col items-center justify-center border border-red-100 bg-red-50 shadow-sm";
                priceVal.className = "text-[18px] font-black text-red-600";
                priceLabel.className = "text-[8px] font-black uppercase text-red-500 mb-1";
                priceVal.innerHTML = `- ${Math.abs(totalPrice).toLocaleString()} <span class="text-[10px] text-red-400 ml-0.5">${displayCurrency}</span>`;
            } else {
                priceBox.className = "rounded-2xl p-3 flex flex-col items-center justify-center border border-brand-1 bg-white shadow-sm";
                priceVal.className = "text-[18px] font-black text-black-5";
                priceLabel.className = "text-[8px] font-black uppercase text-black-3 mb-1";
                priceVal.innerHTML = `0 <span class="text-[10px] text-black-3 ml-0.5">${displayCurrency}</span>`;
            }
        };
        renderView();
        // ユーザー情報の制御
        const btnUserProfile = $Dom.QuerySelector('#btn-mem-user-profile', el);
        const profile = $Data.Store.GetUserProfile();
        if (profile) {
            $Dom.QuerySelector('#view-mem-user-icon', el).textContent = profile.icon || "😀";
            $Dom.QuerySelector('#view-mem-user-id', el).textContent = profile.nickName;
            btnUserProfile.onclick = () => this.ShowUserProfile(profile, archive.is_owner);
        } else {
            $Dom.ToggleShow(btnUserProfile, false);
        }
        // ダイアログフッターのボタン配列を構築（縦並びにするため配列をネストする）
        const dialogButtons =[];
        if (archive.is_owner) {
            const btnMainClass = "w-full bg-brand-5 text-white font-bold py-3 rounded-2xl text-[14px] shadow-md active:scale-95 transition-transform";
            const btnReleaseClass = "w-full bg-white text-red-400 border border-brand-4 font-bold py-3 rounded-2xl text-[14px] shadow-sm active:scale-95 transition-transform";
            if (!archive.is_public) {
                // Private ⇒ Public
                dialogButtons.push([{
                    label: "Private　⇒　Public",
                    className: btnMainClass,
                    closesDialog: false,
                    handler: () => this._execStatusChange('PublishArchive', { archive_id: archive.archive_id }, "Switch to [Public]", "Do you want to make\nthis internal data [Public]？", "Set to [Public].", $Const.SCREEN_MODE.ARCHIVE_PUB)
                }]);
                // Archive ⇒ Details
                dialogButtons.push([{
                    label: "Archive　⇒　Details",
                    className: btnReleaseClass,
                    closesDialog: false,
                    handler: () => this._execStatusChange('DeleteArchive', { archive_id: archive.archive_id }, "Restore to Details", "Restore this group to\nindividual detail items？", "Restored to individual detail items.", $Const.SCREEN_MODE.CREATE)
                }]);
            } else {
                if (archive.closed_flg) {
                    // Close ⇒ Open
                    dialogButtons.push([{
                        label: "Close　⇒　Open",
                        className: btnMainClass,
                        closesDialog: false,
                        handler: () => this._execStatusChange('OpenArchive', { archive_id: archive.archive_id }, "Switch to [Open]", "Do you want to switch\nthis data to [Open]？", "Switched to [Open].", null, () => $Data.Store.UpdateArchive({ closed_flg: false }))
                    }]);
                } else {
                    // Open ⇒ Close
                    dialogButtons.push([{
                        label: "Open　⇒　Close",
                        className: btnMainClass,
                        closesDialog: false,
                        handler: () => this._execStatusChange('CloseArchive', { archive_id: archive.archive_id }, "Switch to [Close]", "Do you want to switch\nthis data to [Close]？", "Switched to [Close].", null, () => $Data.Store.UpdateArchive({ closed_flg: true }))
                    }]);
                }
                // Public ⇒ Private
                dialogButtons.push([{
                    label: "Public　⇒　Private",
                    className: btnReleaseClass,
                    closesDialog: false,
                    handler: () => this._execStatusChange('UnpublishArchive', { archive_id: archive.archive_id }, "Switch to [Private]", "Do you want to revert\nthis data to Private？", "Reverted to [Private].", $Const.SCREEN_MODE.ARCHIVE)
                }]);
            }
        } else {
            // ▼ オーナーでない（他人の）アーカイブの場合は通報ボタンを表示する
            dialogButtons.push([{
                label: "REPORT THIS ARCHIVE",
                className: "w-full bg-white text-red-500 border border-red-500 font-bold py-3 rounded-2xl text-[14px] shadow-sm active:scale-95 transition-transform",
                closesDialog: false,
                handler: () => this.ShowReportPost(archive)
            }]);
        }
        // _DialogCore に構築したボタン配列を渡す
        const frame = _DialogCore.open({ title: "", content: el, buttons: dialogButtons });
        // バッジと鉛筆ボタンの追加
        const titleContainer = $Dom.QuerySelector('#dialog-title', frame);
        const headerActions = $Dom.QuerySelector('#dialog-header-actions', frame);
        let badgeHtml = (!archive.is_public) ? `<span class="text-[10px] font-black px-3 py-1 rounded-xl bg-gray-500 text-white border border-gray-200 shadow-sm">Private</span>` :
                        (archive.closed_flg) ? `<span class="text-[10px] font-black px-3 py-1 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 shadow-sm">Close</span>` :
                        `<span class="text-[10px] font-black px-3 py-1 rounded-xl bg-brand-2 text-brand-5 border border-blue-100 shadow-sm">Open</span>`;
        if (titleContainer) titleContainer.innerHTML = badgeHtml;
        if (archive.is_owner && headerActions) {
            const editBtn = document.createElement('button');
            editBtn.className = "w-8 h-8 bg-white rounded-xl shadow-sm text-black-3 flex items-center justify-center active:scale-95 text-[14px] border border-brand-2 transition-transform";
            editBtn.innerHTML = "✏️";
            // 編集ダイアログを「上に」開き、保存後に参照画面を描画し直す関数を渡す
            editBtn.onclick = () => this.ShowEditArchive(archive, renderView);
            headerActions.prepend(editBtn);
        }
    },
    // まとめ親編集（上にスタックされる）
    ShowEditArchive(archive, onUpdate) {
        const el = $Dom.GenerateTemplate('tpl-edit-archive');
        const editTitle = $Dom.QuerySelector('#edit-mem-title', el);
        const editBody = $Dom.QuerySelector('#edit-mem-body', el);
        const editUrl = $Dom.QuerySelector('#edit-mem-url', el);
        const editCurrency = $Dom.QuerySelector('#edit-mem-currency', el);
        editTitle.value = archive.title || "";
        editBody.value = archive.memo || "";
        editUrl.value = archive.link_url || "";
        editCurrency.value = archive.currency_unit || $App.AppData.Owner.currency_unit || 'JPY';
        _DialogCore.open({
            title: "EDIT ARCHIVE",
            content: el,
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-200 text-slate-500 shadow-sm",
                        closesDialog: true
                    },
                    {
                        label: "SAVE DATA",
                        className: "bg-brand-4 text-white shadow-sm",
                        closesDialog: false,
                        handler: $Warn.CatchAsync(async () => {
                            const updatedFields = {
                                title: editTitle.value, memo: editBody.value,
                                link_url: editUrl.value, currency_unit: editCurrency.value.trim(),
                            };
                            const isSuccess = (!archive.is_public)
                                ? await $Data.Access.UpdateArchive({ archive_id: archive.archive_id, ...updatedFields })
                                : await $Data.Access.UpdateArchivePub({ archive_id: archive.archive_id, ...updatedFields });
                            if (!isSuccess) return;
                            $Data.Store.UpdateArchive(updatedFields);
                            $TopBar.ChangeTitle(updatedFields.title);
                            $Notice.Info("Changes saved.");
                            _DialogCore.close(); // 編集画面だけ閉じる
                            if (onUpdate) onUpdate(); // 参照画面のDOMを最新化
                        })
                    }
                ]
            ]
        });
    },
    // プロフィール参照
    async ShowUserProfile(profile, isOwner) {
        if (isOwner) {
            const isSuccess = await $Data.Access.GetProfile();
            if (isSuccess && $App.AppData.Owner.Profile) {
                // 自分のプロフィールで上書き
                profile = $App.AppData.Owner.Profile;
            }
        }
        if (!profile) return $Notice.Warn("ユーザー情報がありません");
        const el = $Dom.GenerateTemplate('tpl-view-profile');
        const renderView = () => {
            const pIcon = profile.icon || "😀";
            const pName = profile.nickName || "No Name";
            const pDesc  = profile.description || "";
            const pL1   = profile.link1 || "";
            const pL2   = profile.link2 || "";
            const pL3   = profile.link3 || "";
            $Dom.QuerySelector('#view-profile-icon', el).textContent = pIcon;
            $Dom.QuerySelector('#view-profile-nickname', el).textContent = pName;
            $Dom.QuerySelector('#view-profile-userid', el).textContent = profile.user_id || "";
            $Dom.QuerySelector('#view-profile-description', el).textContent = pDesc;
            const viewLinks = $Dom.QuerySelector('#view-profile-links', el);
            viewLinks.innerHTML = "";
            const links =[pL1, pL2, pL3].filter(l => l && l.trim() !== "");
            links.forEach(l => {
                const a = document.createElement("a");
                a.href = l; a.target = "_blank";
                a.className = "flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-blue-500 text-[12px] font-bold truncate active:scale-95 transition-transform";
                a.innerHTML = `<span class="shrink-0 text-brand-3 text-[14px]">🔗</span> <span class="truncate">${l}</span>`;
                viewLinks.appendChild(a);
            });
        };
        renderView();
        const frame = _DialogCore.open({ title: "USER PROFILE", content: el, buttons: [] });
        if (isOwner) {
            const headerActions = $Dom.QuerySelector('#dialog-header-actions', frame);
            if (headerActions) {
                const editBtn = document.createElement('button');
                editBtn.className = "w-8 h-8 bg-white rounded-xl shadow-sm text-black-3 flex items-center justify-center active:scale-95 text-[14px] border border-brand-2 transition-transform";
                editBtn.innerHTML = "✏️";
                editBtn.onclick = () => this.ShowEditProfile(profile, renderView);
                headerActions.prepend(editBtn);
            }
        }
    },
    // プロフィール編集（上にスタックされる）
    ShowEditProfile(profile, onUpdate) {
        const el = $Dom.GenerateTemplate('tpl-edit-profile');
        const editIconPreview = $Dom.QuerySelector('#edit-profile-icon-preview', el);
        const editIconInput = $Dom.QuerySelector('#edit-profile-icon', el);
        const editNickname = $Dom.QuerySelector('#edit-profile-nickname', el);
        const editDesc = $Dom.QuerySelector('#edit-profile-description', el);
        const editDescCount = $Dom.QuerySelector('#edit-profile-description-count', el);
        const editLink1 = $Dom.QuerySelector('#edit-profile-link1', el);
        const editLink2 = $Dom.QuerySelector('#edit-profile-link2', el);
        const editLink3 = $Dom.QuerySelector('#edit-profile-link3', el);
        editIconPreview.textContent = profile.icon || "😀";
        editIconInput.value = profile.icon || "😀";
        editNickname.value = profile.nickName || "";
        editDesc.value = profile.description || "";
        editDescCount.textContent = (profile.description || "").length;
        editLink1.value = profile.link1 || "";
        editLink2.value = profile.link2 || "";
        editLink3.value = profile.link3 || "";
        editDesc.addEventListener('input', () => editDescCount.textContent = editDesc.value.length);
        $Dom.QuerySelector('#btn-profile-icon-trigger', el).onclick = () => {
            this.ShowEmojiPicker((emoji) => {
                editIconPreview.textContent = emoji;
                editIconInput.value = emoji;
            });
        };
        _DialogCore.open({
            title: "EDIT PROFILE",
            content: el,
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-200 text-slate-500 shadow-sm",
                        closesDialog: true
                    },
                    {
                        label: "SAVE",
                        className: "bg-brand-4 text-white shadow-sm",
                        closesDialog: false,
                        handler: $Warn.CatchAsync(async () => {
                            const updatedFields = {
                                nickName: editNickname.value.trim(),
                                icon: editIconInput.value,
                                description: editDesc.value.trim(),
                                link1: editLink1.value.trim(),
                                link2: editLink2.value.trim(),
                                link3: editLink3.value.trim(),
                            };
                            const isSuccess = await $Data.Access.UpdateProfile(updatedFields);
                            if (!isSuccess) return;
                            Object.assign(profile, updatedFields);
                            $Notice.Info("プロフィールを更新しました");
                            _DialogCore.close();
                            if (onUpdate) onUpdate();
                        })
                    }
                ]
            ]
        });
    },
    // 通知詳細ダイアログ
    ShowNoticeDetail(notice) {
        // ...既存コードそのまま...
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        const icon = $Const.NOTICE_ICONS[notice.kind] || '📢';
        $Dom.QuerySelector('#view-notice-icon', el).textContent = icon;
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(notice.update_tim, "YYYY.MM.DD HH:mm");
        $Dom.QuerySelector('#view-notice-title', el).textContent = notice.title;
        $Dom.QuerySelector('#view-notice-body', el).textContent = notice.body;
        _DialogCore.open({
            title: "NOTICE DETAILS",
            content: el,
            buttons:[]
        });
    },
    // 通知一覧ダイアログ（API通信化）
    async ShowNoticeList() {
        const notices = $App.AppData.Owner.systemInfo.notifications ||[];
        if (notices.length === 0) {
            $Notice.Warn("データはありません");
            return;
        }
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        root.className = "w-full text-black-3 mb-2 px-1";
        notices.forEach(item => {
            const child = $Dom.GenerateTemplate("tpl-list-child-notice");
            $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim, "YYYY.MM.DD");
            const icon = $Const.NOTICE_ICONS[item.kind] || '📢';
            $Dom.QuerySelector(".js-title", child).textContent = `${icon} ${item.title}`;
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            child.onclick = () => this.ShowNoticeDetail(item);
            root.appendChild(child);
        });
        _DialogCore.open({
            title: "NOTIFICATIONS", content: root,
            buttons:[]
        });
    },
    // 【管理者機能】管理者メニュー
    ShowAdminMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-admin');
        $Dom.QuerySelector('#btn-admin-notice', el).onclick = () => this.ShowAdminNoticeList();
        $Dom.QuerySelector('#btn-admin-report', el).onclick = () => this.ShowAdminReportList();
        $Dom.QuerySelector('#btn-admin-feedback', el).onclick = () => this.ShowAdminFeedbackList();
        _DialogCore.open({ title: "ADMIN TOOLS", content: el, ok: null });
    },
    // 通知管理リスト（API通信化）
    async ShowAdminNoticeList() {
        const isSuccess = await $Data.Access.GetAllNotifications({});
        if (!isSuccess) return;
        const notices = $App.AppData.Admin.notifications ||[];
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        root.className = "w-full text-black-3 mb-2 px-1";
        const renderList = async () => {
            root.innerHTML = "";
            if (notices.length === 0) {
                root.innerHTML = `<div class="text-center text-[12px] font-bold text-slate-400 py-6">通知データがありません</div>`;
                return;
            }
            const now = new Date();
            const sorted = [...notices].sort((a, b) => new Date(b.update_tim) - new Date(a.update_tim));
            sorted.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-notice");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim, "YYYY.MM.DD HH:mm");
                const icon = $Const.NOTICE_ICONS[item.kind] || '📢';
                $Dom.QuerySelector(".js-title", child).textContent = `${icon} ${item.title}`;
                $Dom.QuerySelector(".js-body", child).textContent = item.body;
                const fromDate = new Date(item.disp_from);
                const toDate = new Date(item.disp_to);
                const isPublic = (now >= fromDate && now <= toDate);
                const badge = $Dom.QuerySelector(".js-badge-status", child);
                if (isPublic) {
                    badge.textContent = "公開中";
                    badge.className = "js-badge-status text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-brand-3 bg-brand-5 text-white";
                } else if (now < fromDate) {
                    badge.textContent = "公開前";
                    badge.className = "js-badge-status text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-slate-300 bg-slate-100 text-slate-500";
                } else {
                    badge.textContent = "公開終了";
                    badge.className = "js-badge-status text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-slate-300 bg-slate-500 text-white";
                }
                // 編集を開き、保存成功時は一覧を閉じて開き直す
                child.onclick = () => {
                    this.ShowAdminNoticeEdit(item, () => {
                        _DialogCore.close(); // 一覧も閉じて
                        this.ShowAdminNoticeList(); // 最新データで再度一覧を開く
                    });
                };
                root.appendChild(child);
            });
        };
        await renderList();
        const frame = _DialogCore.open({
            title: "NOTICE Mgmt", content: root,
            buttons:[]
        });
        // 新規登録ボタン
        const headerActions = $Dom.QuerySelector('#dialog-header-actions', frame);
        if (headerActions) {
            const addBtn = document.createElement('button');
            addBtn.className = "w-8 h-8 bg-brand-5 rounded-xl shadow-sm text-white flex items-center justify-center active:scale-95 text-[18px] border border-brand-5 transition-transform";
            addBtn.innerHTML = "＋";
            addBtn.onclick = () => this.ShowAdminNoticeEdit(null, () => {
                _DialogCore.close();
                this.ShowAdminNoticeList();
            });
            headerActions.prepend(addBtn);
        }
    },
    // 通知の編集・新規登録（API通信化）
    ShowAdminNoticeEdit(noticeItem, onSaved) {
        const isNew = !noticeItem;
        const target = isNew ? {
            seq: 0, title: "", body: "", kind: 0,
            disp_from: $Util.FormatDate(new Date(), "YYYY-MM-DDTHH:mm"),
            disp_to: "2099-12-31T23:59",
        } : { ...noticeItem };
        const el = $Dom.GenerateTemplate("tpl-admin-notice-edit");
        const selKind = $Dom.QuerySelector('#edit-notice-kind', el);
        const inptTitle = $Dom.QuerySelector('#edit-notice-title', el);
        const inptBody = $Dom.QuerySelector('#edit-notice-body', el);
        const inptFrom = $Dom.QuerySelector('#edit-notice-from', el);
        const inptTo = $Dom.QuerySelector('#edit-notice-to', el);
        selKind.value = target.kind;
        inptTitle.value = target.title;
        inptBody.value = target.body;
        inptFrom.value = target.disp_from;
        inptTo.value = target.disp_to;
        _DialogCore.open({
            title: isNew ? "NEW NOTICE" : "EDIT NOTICE",
            content: el,
            buttons:[[
                {
                    label: "CANCEL",
                    className: "bg-slate-200 text-slate-500 shadow-sm",
                    closesDialog: true
                },
                {
                    label: "SAVE",
                    className: "bg-brand-5 text-white shadow-md",
                    closesDialog: false,
                    handler: async () => {
                        const req = {
                            seq: target.seq,
                            title: inptTitle.value.trim() || "No Title",
                            body: inptBody.value.trim(),
                            kind: Number(selKind.value),
                            disp_from: inptFrom.value,
                            disp_to: inptTo.value
                        };
                        const isSuccess = await $Data.Access.UpsertNotification(req);
                        if (!isSuccess) return;
                        $Notice.Info("Saved successfully.");
                        _DialogCore.close(); // 編集ダイアログを閉じる
                        if (onSaved) onSaved(); // 親画面の再描画コールバック
                    }
                }
            ]]
        });
    },
    // 通報集計一覧（API通信化）
    async ShowAdminReportList() {
        const isSuccess = await $Data.Access.GetReportSummary({ min_count: 0 });
        if (!isSuccess) return;
        const reportSummary = $App.AppData.Admin.reportSummary ||[];
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        root.className = "w-full text-black-3 mb-2 px-1";
        if (reportSummary.length === 0) {
            root.innerHTML = `<div class="text-center text-[12px] font-bold text-slate-400 py-6">通報データはありません</div>`;
        } else {
            // 通報件数の多い順にソート
            const sorted = [...reportSummary].sort((a, b) => b.report_count - a.report_count);
            sorted.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-summary");
                $Dom.QuerySelector(".js-target-user", child).textContent = `Target: ${item.target_user_name || item.target_user_id}`;
                $Dom.QuerySelector(".js-archive-title", child).textContent = item.archive_title || "Unknown Title";
                $Dom.QuerySelector(".js-archive-id", child).textContent = `Archive ID: ${item.archive_id}`;
                $Dom.QuerySelector(".js-badge-count", child).textContent = `${item.report_count} Reports`;
                child.onclick = () => this.ShowAdminReportDetail(item);
                root.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "REPORT Mgmt",
            content: root,
            buttons:[]
        });
    },
    // 管理者：通報詳細
    async ShowAdminReportDetail(summaryItem) {
        // ★ リストから指定されたターゲットユーザとアーカイブIDで詳細をAPI取得
        const isSuccess = await $Data.Access.GetReportDetails({
            target_user_id: summaryItem.target_user_id,
            archive_id: summaryItem.archive_id
        });
        if (!isSuccess) return;
        // 取得した詳細データ
        const reports = $App.AppData.Admin.reports ||[];
        const el = $Dom.GenerateTemplate("tpl-admin-report-detail");
        // 上部：対象情報（集計データから表示）
        $Dom.QuerySelector(".js-target-user", el).textContent = summaryItem.target_user_id;
        $Dom.QuerySelector(".js-archive-title", el).textContent = `Archive ID: ${summaryItem.archive_id}`;
        // 上部：まとめ親（Public）を開くボタン
        $Dom.QuerySelector("#btn-admin-open-archive", el).onclick = async () => {
            const isOk = await this.ShowConfirm({ title: "OPEN ARCHIVE", message: "この Public まとめデータを開きますか？" });
            if (!isOk) return;
            _DialogCore.closeAll();
            $App.AppData.System.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
            $App.AppData.System.TargetArchiveId = summaryItem.archive_id;
            await $App.RefreshScreen();
        };
        const listContainer = $Dom.QuerySelector("#admin-report-detail-list", el);
        if (reports.length === 0) {
            listContainer.innerHTML = `<div class="text-[12px] text-slate-400 p-2">詳細データがありません</div>`;
        } else {
            // 通報日時（report_tim）の新しい順（降順）にソートして描画
            reports.sort((a, b) => new Date(b.report_tim) - new Date(a.report_tim)).forEach(rep => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-item");
                // 通報者
                $Dom.QuerySelector(".js-reporter-user", child).textContent = `From: ${rep.reporter_user_id}`;
                // 通報日時
                $Dom.QuerySelector(".js-report-tim", child).textContent = $Util.FormatDate(rep.report_tim, "YYYY.MM.DD HH:mm");
                // 通報内容
                $Dom.QuerySelector(".js-report-body", child).textContent = rep.body || "（内容なし）";
                listContainer.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "REPORT DETAILS",
            content: el,
            buttons:[ { label: "BACK", className: "bg-slate-200 text-slate-500 shadow-sm", closesDialog: true } ]
        });
    },
    // 管理者：フィードバックリスト（無限スクロール）
    async ShowAdminFeedbackList() {
        let skip = 0;
        const take = 100;
        // ★ 実行時に即データアクセスし、エラーの場合は開かずに終了
        const isSuccess = await $Data.Access.GetAllFeedback({ skip, take });
        if (!isSuccess) return;
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        // root.className = "w-full text-black-3 mb-2 px-1 _h-[60vh] overflow-y-auto";
        let isLoading = false;
        let hasMore = true;
        const renderItems = (items) => {
            items.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-feedback");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.create_tim || new Date(), "YYYY.MM.DD HH:mm");
                $Dom.QuerySelector(".js-score", child).textContent = `Score: ${item.score || 0}`;
                $Dom.QuerySelector(".js-body", child).textContent = item.body || "（内容なし）";
                root.appendChild(child);
            });
        };
        // 初回取得分の描画
        const initialItems = $App.AppData.Admin.feedbackList ||[];
        if (initialItems.length < take) hasMore = false;
        renderItems(initialItems);
        skip += take;
        // 追加読み込み処理
        const loadMore = async () => {
            if (isLoading || !hasMore) return;
            isLoading = true;
            const isLoadSuccess = await $Data.Access.GetAllFeedback({ skip, take });
            if (!isLoadSuccess) {
                isLoading = false;
                return;
            }
            const newItems = $App.AppData.Admin.feedbackList ||[];
            if (newItems.length < take) hasMore = false;
            renderItems(newItems);
            skip += take;
            isLoading = false;
        };
        // スクロール検知
        root.addEventListener('scroll', () => {
            // スクロール最下部付近で追加ロード
            if (root.scrollTop + root.clientHeight >= root.scrollHeight - 50) loadMore();
        });
        // 1件もない場合の表示
        if (root.children.length === 0) {
            root.innerHTML = `<div class="text-center text-[12px] font-bold text-slate-400 py-6">フィードバックはありません</div>`;
        }
        // ダイアログを開く
        _DialogCore.open({
            title: "FEEDBACK Mgmt",
            content: root,
            buttons:[]
        });
    },
    // 通報投稿画面
    async ShowReportPost(archive) {
        // ダイアログを開く前に、自分が過去にこのアーカイブを通報したか取得
        const reqParam = { target_user_id: archive.user_id, archive_id: archive.archive_id };
        const isSuccess = await $Data.Access.GetMyReport(reqParam);
        if (!isSuccess) return;
        // 取得したデータがあれば初期値として設定
        const myReport = $App.AppData.Owner.myReport || null;
        let currentBody = myReport ? (myReport.body || "") : "";
        const el = $Dom.GenerateTemplate("tpl-report-post");
        const inputBody = $Dom.QuerySelector('#input-report-body', el);
        const countBody = $Dom.QuerySelector('#report-text-count', el);
        // 初期値の反映
        inputBody.value = currentBody;
        countBody.textContent = currentBody.length;
        inputBody.addEventListener("input", () => {
            countBody.textContent = inputBody.value.length;
        });
        _DialogCore.open({
            // データが既にあれば編集（EDIT）、なければ新規（SUBMIT）
            title: myReport ? "EDIT REPORT" : "REPORT SUBMIT",
            content: el,
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-200 text-slate-500 shadow-sm",
                    closesDialog: true
                },
                {
                    label: "SUBMIT",
                    className: "bg-red-500 text-white shadow-md",
                    closesDialog: false,
                    handler: async () => {
                        const body = inputBody.value.trim();
                        if (!body) {
                            $Notice.Warn("通報内容を入力してください。");
                            return;
                        }
                        const req = {
                            target_user_id: archive.user_id,
                            archive_id: archive.archive_id,
                            body: body
                        };
                        const isSubmitSuccess = await $Data.Access.UpsertReport(req);
                        if (!isSubmitSuccess) return;
                        $Notice.Info("通報を送信しました。管理者が確認します。");
                        _DialogCore.close(); // 通報ダイアログを閉じる
                    }
                }
            ]]
        });
    },
};
// 初期処理
_DialogCore.init();
// Public
export default DialogController;