// UI操作
const _DialogCore = {
    elementId: "ui-dialog-root",
    dialogRoot: null,
    backdrop: null,
    stack:[],
    // ★ 共通クラス定数
    HEADER_BTN_CLASS: "w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 border border-brand-2 transition-transform",
    FOOTER_BTN_BASE:  "font-black text-[1rem] h-12 rounded-[1rem] uppercase active:scale-95 transition-transform",
    FOOTER_BTN_DEFAULT: "bg-brand-5 text-white shadow-md",
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
    // 修正後：create メソッド（help機能追加版）
    create({ title = "", content = "", buttons = [], headerButtons = [], help = null, onClose = null, theme = null }) {
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
        // 
        if (buttons && buttons.length > 0) {
            buttons.forEach(rowDef => {
                const isArray = Array.isArray(rowDef);
                const items = isArray ? rowDef : (rowDef.items || [rowDef]);
                const rowDiv = document.createElement("div");
                rowDiv.className = "w-full flex gap-3";
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
                btnContainer.appendChild(rowDiv);
            });
            btnContainer.classList.remove("hidden");
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
                help: "",
                // ダイアログが閉じた時に未解決ならキャンセル(false)扱い
                onClose: () => {
                    if (!isResolved) resolve(false);
                },
                // 動的ボタン生成
                buttons: [
                    [
                        {
                            label: "CANCEL",
                            className: "bg-slate-400 text-white shadow-md",
                            handler: () => {
                                isResolved = true; resolve(false);
                                _DialogCore.close();
                            }
                        },
                        {
                            label: label,
                            handler: () => {
                                isResolved = true; resolve(true);
                                _DialogCore.close();
                            }
                        }
                    ]
                ]
            });
        });
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
            // ★修正3: Init()で全初期化するのではなく、現在の画面モードを維持して再描画する
            await $App.RefreshScreen();
        });
        _DialogCore.open({
            title: "LOGIN",
            content: el,
            help: "aaaa",
        });
    },
    // 【基幹】システムメニューを表示
    ShowSystemMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-system');
        const isLoggedIn = $App.AppData.Context.IsLoggedIn;
        const isAdmin = isLoggedIn && $App.AppData.Owner.plan === "Admin";
        // 1. ShowAppMenuと同様、まとめてボタン変数にする
        const b = {
            profile: $Dom.QuerySelector('#btn-sys-user-profile', el),
            config:  $Dom.QuerySelector('#btn-sys-user-config', el),
            notice:  $Dom.QuerySelector('#btn-sys-notice', el),
            version: $Dom.QuerySelector('#btn-sys-version', el),
            auth:    $Dom.QuerySelector('#btn-sys-auth', el),
            admin:   $Dom.QuerySelector('#btn-sys-admin', el),
        };
        // ログイン中であれば、プロフィールのアイコンを反映する
        if (isLoggedIn) {
            const profile = $App.AppData.Owner.systemInfo.ownerProfile;
            if (profile && profile.icon) {
                // ボタン内の最初のspan（アイコン表示用）を取得して書き換え
                const iconSpan = $Dom.QuerySelector('span:first-child', b.profile);
                iconSpan.textContent = profile.icon;
            }
        }
        // 2. まとめて表示設定（ログイン・権限状態で絞り込み）
        $Dom.ToggleShow(b.profile, isLoggedIn);
        $Dom.ToggleShow(b.notice,  isLoggedIn);
        $Dom.ToggleShow(b.version, isLoggedIn);
        $Dom.ToggleShow(b.admin, isAdmin);
        // 3. ログイン/ログアウトボタンのラベル反映
        const authLabel = $Dom.QuerySelector('span:last-child', b.auth);
        authLabel.textContent = isLoggedIn ? "LOGOUT" : "LOGIN";
        // 新着通知
        const unreadCount = $App.AppData.Context.UnreadNoticeCount || 0;
        if (unreadCount > 0) {
            const labelSpan = $Dom.QuerySelector('span:last-child', b.notice);
            labelSpan.classList.add("flex", "items-center", "gap-2");
            if (!labelSpan.querySelector('.badge-new')) {
                labelSpan.insertAdjacentHTML('beforeend', `<span class="badge-new ml-4 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full tracking-wider mt-0.5">NEW</span>`);
            }
        }
        // 新着メール
        const unreadMail = $App.AppData.Context.UnreadMailCount || 0;
        if (unreadMail > 0) {
            const labelSpan = $Dom.QuerySelector('span:last-child', b.profile);
            labelSpan.classList.add("flex", "items-center", "gap-2");
            if (!labelSpan.querySelector('.badge-new')) {
                labelSpan.insertAdjacentHTML('beforeend', `<span class="badge-new ml-4 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full tracking-wider mt-0.5">NEW</span>`);
            }
        }
        // 4. 各ボタンのイベント登録
        b.profile.onclick = async () => {
            _DialogCore.close();
            this.ShowUserProfile($App.AppData.Owner.systemInfo.ownerProfile, true)
        };
        b.config.onclick = () => {_DialogCore.close(); this.ShowUserSettingsMenu()};
        b.notice.onclick = () => {_DialogCore.close(); this.ShowNoticeList()};
        b.version.onclick = () => {_DialogCore.close(); this.ShowAppInfo()};
        b.admin.onclick = () => {_DialogCore.close(); this.ShowAdminMenu()};
        b.auth.onclick = async () => {
            if (isLoggedIn) {
                if (await this.ShowConfirm({ title: "LOGOUT", message: "ログアウトしますか？" })) {
                    _DialogCore.closeAll();
                    // ★ここを修正：AppManagerのログアウトを呼ぶ
                    $App.Logout();
                    setTimeout(() => location.reload(), 500);
                }
            } else {
                this.ShowLoginDialog();
            }
        };
        _DialogCore.open({
            title: "SYSTEM MENU",
            content: el,
            help: "システムメニュー\nシステムメニュー",
        });
    },
    // 【基幹】アプリメニューを表示
    ShowAppMenu() {
        const isLoggedIn = $App.AppData.Context.IsLoggedIn;
        const mode = $App.AppData.Context.ScreenMode;
        const el = $Dom.GenerateTemplate('tpl-menu-app');
        // 各ボタンを一度だけ取得してオブジェクトに格納
        const b = {
            create: $Dom.QuerySelector('#btn-app-create', el),
            current: $Dom.QuerySelector('#btn-app-current', el),
            restore: $Dom.QuerySelector('#btn-app-restore', el),
            archiveInfo: $Dom.QuerySelector('#btn-app-info', el),
            detailList: $Dom.QuerySelector('#btn-app-list', el),
            batch:   $Dom.QuerySelector('#btn-app-batch', el),
            point:   $Dom.QuerySelector('#btn-app-point', el),
            archiveList: $Dom.QuerySelector('#btn-app-archive-list', el),
            search: $Dom.QuerySelector('#btn-app-search', el),
        };
        // 表示制御（取得済みの変数を使用）
        switch (mode) {
            case $Const.SCREEN_MODE.CREATE:
                $Dom.ToggleShow(b.batch, true);
                $Dom.ToggleShow(b.search, true);
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
                case $Const.SCREEN_MODE.ARCHIVE_PUB:
                $Dom.ToggleShow(b.create, true);
                $Dom.ToggleShow(b.search, true);
                $Dom.ToggleShow(b.archiveInfo, true);
                break;
            case $Const.SCREEN_MODE.SEARCH:
                $Dom.ToggleShow(b.create, true);
                $Dom.ToggleShow(b.point, true);
                $Dom.ToggleShow(b.search, true);
                break;
        }
        // 未ログインなら
        if (!isLoggedIn) {
            $Dom.ToggleShow(b.create, false);
            $Dom.ToggleShow(b.archiveList, false);
            $Dom.ToggleShow(b.batch, false);
            $Dom.ToggleShow(b.search, false);
        }
        // イベント登録（取得済みの変数を使用）
        b.create.onclick = () => {
            _DialogCore.close();
            $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
            $App.RefreshScreen();
        };
        b.current.onclick = () => {
            _DialogCore.close();
            $Marker.RefreshCurrentLocation();
            $Marker.FocusToLocationMarker();
        };
        b.restore.onclick = () => {
            _DialogCore.close();
            $Marker.RestoreMarkers();
        };
        b.archiveInfo.onclick = () => {
            _DialogCore.close();
            this.ShowArchiveInfo();
        }
        b.detailList.onclick = () => {
            mode === $Const.SCREEN_MODE.SEARCH ? this.ShowDetailsSimpleList() : this.ShowDetailsTimeLine();
        }
        b.batch.onclick = () => {
            this.ShowMultiSelectTimeline({ onOk: (l) => console.log(l) });
        };
        b.point.onclick = () => {
            this.PointSearchGoogle((p) => $Map.MoveMap(p.lat, p.lng, 18));
        };
        b.archiveList.onclick = () => {
            _DialogCore.close();
            this.ShowArchiveList();
        };
        b.search.onclick = () => {
            _DialogCore.close();
            $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.SEARCH;
            $App.RefreshScreen();
        };
        //
        _DialogCore.open({
            title: "APP MENU",
            content: el,
            help: "アプリメ\nニュー",
        });
    },
    // （ユーザ設定）ユーザー設定メニュー（第2階層）
    ShowUserSettingsMenu() {
        const el = $Dom.GenerateTemplate("tpl-menu-user-settings");
        $Dom.QuerySelector('#btn-set-theme', el).onclick = () => this.ShowThemeConfig();
        $Dom.QuerySelector('#btn-set-map', el).onclick = () => this.ShowMapStyleConfig();
        $Dom.QuerySelector('#btn-set-gps', el).onclick = () => this.ShowGpsFollowConfig();
        $Dom.QuerySelector('#btn-set-currency', el).onclick = () => this.ShowCurrencyConfig();
        //
        _DialogCore.open({
            title: "USER SETTINGS",
            content: el,
            help: "ユーザシステム\nメニュー",
        });
    },
    // （ユーザ設定）テーマ設定ダイアログ
    ShowThemeConfig() {
        let isSaved = false;
        const oldTheme = $App.AppData.Owner.Theme;
        // プレビュー用バーを0-5までループ生成
        let previewItems = '';
        for (let i = 0; i <= 5; i++) {
            const textColor = i > 2 ? 'text-white' : 'text-black-3';
            previewItems += `<div class="w-full h-10 bg-brand-${i} border border-brand-2 flex items-center px-4 text-[0.7rem] font-bold ${textColor}">LEVEL ${i} PREVIEW</div>`;
        }
        const html = `
            <div class="p-6 w-full space-y-6 bg-brand-0">
                <div class="flex justify-between items-center border-b border-brand-2 pb-6">
                    <button id="th-btn-blue" class="w-12 h-12 bg-[#0ea5e9] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-green" class="w-12 h-12 bg-[#22c55e] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-red" class="w-12 h-12 bg-[#ef4444] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                    <button id="th-btn-yellow" class="w-12 h-12 bg-[#eab308] border-2 border-white shadow-md active:scale-95 transition-transform"></button>
                </div>
                <div class="space-y-1 px-6">${previewItems}</div>
            </div>`;
        const el = document.createElement('div');
        el.style.width = "100%";
        el.innerHTML = html;
        const bind = (id, theme) => $Dom.QuerySelector(id, el).onclick = () => $UI.ChangeTheme(theme);
        bind('#th-btn-blue', 'blue'); bind('#th-btn-green', 'green'); bind('#th-btn-red', 'red'); bind('#th-btn-yellow', 'yellow');
        _DialogCore.open({
            title: "THEME CONFIG",
            content: el,
            help: "",
            onClose: () => {
                if (isSaved) return;
                // もとに戻す
                $UI.ChangeTheme(oldTheme);
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
                        _DialogCore.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        // 現在のテーマ属性値を取得
                        const current = document.documentElement.getAttribute('data-theme');
                        // テーマの変更・保存処理を実行
                        $App.ChangeTheme(current);
                        _DialogCore.close();
                        $Notice.Info("Changes saved.");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）マップスタイル設定ダイアログ
    ShowMapStyleConfig() {
        let isSaved = false;
        const oldStyle = $App.AppData.Owner.MapStyle;
        let selectedStyle = oldStyle;
        // スタイル一覧をループ生成
        let listHtml = '';
        Object.values($Map.MAP_STYLE).forEach(style => {
            listHtml += `
                <button id="ms-btn-${style.key}" class="w-full h-14 grid grid-cols-10 items-center px-4 border-b border-brand-2 hover:bg-brand-1 active:bg-brand-2 transition-colors text-black-5">
                    <span class="col-span-1 flex justify-center text-[1.2rem]">🗺️</span>
                    <span class="col-span-1"></span>
                    <span class="col-span-8 text-left font-bold text-[1rem] uppercase">${style.name}</span>
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
            help: "",
            onClose: () => {
                if (isSaved) return;
                // もとに戻す
                $Map.SetMapStyle(oldStyle);
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
                        _DialogCore.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        // 選択されたマップスタイルを適用・保存
                        $App.ChangeMapStyle(selectedStyle);
                        _DialogCore.close();
                        $Notice.Info("Changes saved.");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）通貨単位設定ダイアログ
    ShowCurrencyConfig() {
        let isSaved = false;
        const el = $Dom.GenerateTemplate("tpl-config-currency");
        const inputCurrency = $Dom.QuerySelector('#input-currency', el);
        // 現在の値をセット
        const oldUnit = $App.AppData.Owner.currency_unit || 'JPY';
        inputCurrency.value = oldUnit;
        _DialogCore.open({
            title: "CURRENCY CONFIG",
            content: el,
            help: "",
            onClose: () => {
                if (isSaved) return;
                // もとに戻す
                $App.ChangeCurrency(oldUnit);
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
                        _DialogCore.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        const val = inputCurrency.value.trim();
                        // 空の場合は JPY をデフォルトとする
                        $App.ChangeCurrency(val || 'JPY');
                        _DialogCore.close();
                        $Notice.Info("Changes saved.");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）GPS追従設定
    ShowGpsFollowConfig() {
        let isSaved = false;
        const oldIsOn = $App.AppData.Owner.IsGpsTracking;
        const el = $Dom.GenerateTemplate("tpl-config-gps");
        const btnOn = $Dom.QuerySelector('#gps-btn-on', el);
        const btnOff = $Dom.QuerySelector('#gps-btn-off', el);
        let isOn = oldIsOn;
        // 現在の状態を反映
        $Dom.QuerySelector('.js-icon', btnOn).textContent = oldIsOn ? '●' : '○';
        $Dom.QuerySelector('.js-icon', btnOff).textContent = !oldIsOn ? '●' : '○';
        // if (isOn) btnOn.classList.add('bg-brand-1'); else btnOff.classList.add('bg-brand-1');
        // イベント紐付け
        btnOn.onclick = () => {
            // let isOn = $App.AppData.Owner.IsGpsTracking;
            $Dom.QuerySelector('.js-icon', btnOn).textContent = isOn ? '○' : '●';
            $Dom.QuerySelector('.js-icon', btnOff).textContent = !isOn ? '○' : '●';
            isOn = true;
        };
        btnOff.onclick = () => {
            // let isOn = $App.AppData.Owner.IsGpsTracking;
            $Dom.QuerySelector('.js-icon', btnOn).textContent = isOn ? '○' : '●';
            $Dom.QuerySelector('.js-icon', btnOff).textContent = !isOn ? '○' : '●';
            isOn = false;
        };
        _DialogCore.open({
            title: "GPS TRACKING",
            content: el,
            help: "",
            onClose: () => {
                if (isSaved) return;
                // もとに戻す
                $App.ChangeGpsTracking(oldIsOn);
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
                        _DialogCore.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        console.log("isOn:", isOn);
                        $App.AppData.Owner.IsGpsTracking = isOn;
                        $App.ChangeGpsTracking(isOn);
                        _DialogCore.close();
                        $Notice.Info("Changes saved.");
                    }
                }
            ]]
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
            help: "",
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
        if (feedbackList.length === 0) {
            container.innerHTML = `<div class="text-center text-[0.7rem] font-bold text-slate-400 py-6">フィードバックはありません</div>`;
        } else {
            feedbackList.forEach(rev => {
                const child = $Dom.GenerateTemplate("tpl-list-child-review");
                const score = rev.score || 0;
                $Dom.QuerySelector(".js-stars", child).textContent = "★".repeat(score) + "☆".repeat(5 - score);
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(rev.create_tim, 'YYYY-MM-DD　HH:mm');
                $Dom.QuerySelector(".js-body", child).textContent = rev.body || "（内容なし）";
                container.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "FEEDBACKS",
            content: el,
            help: "",
            buttons:[
                {
                    label: "Write Feedback",
                    className: "",
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
                star.className = "text-yellow-500";
            } else {
                // star.className = "outline-none transition-colors active:scale-90 text-slate-200";
                star.className = "text-slate-200";
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
            help: "",
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
						_DialogCore.close();
                    },
                },
                {
                    label: "SUBMIT",
                    className: "",
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
    // 絵文字選択（定数リスト＋履歴保存、入力欄反映・OK確定）
    ShowEmojiPicker(onSelect) {
        const el = $Dom.GenerateTemplate("tpl-emoji-picker");
        const container = $Dom.QuerySelector('#emoji-combined-grid', el);
        // Emoji Martのピッカーを初期化
        const picker = new EmojiMart.Picker({
            onEmojiSelect: (emoji) => {
                // 絵文字を選択した瞬間に反映してダイアログを閉じる
                onSelect(emoji.native);
                _DialogCore.close();
            },
            locale: 'ja',            // 日本語化
            previewPosition: 'none', // 下部のプレビューエリアを隠す
            skinTonePosition: 'none', // スキントーン選択を隠す
        });
        // コンテナにピッカーを注入
        container.appendChild(picker);
        // ダイアログを表示
        _DialogCore.open({
            title: "SELECT ICON",
            content: el,
            help: "",
            buttons: []
        });
    },
    // 座標・住所指定で移動する
    PointSearchGoogle(onOk) {
        const el = $Dom.GenerateTemplate('tpl-point-search-google');
        _DialogCore.open({
            title: "地点・住所検索",
            content: el,
            help: "",
            buttons: [
                {
                    label: "GO！",
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
    // 地点リスト（単一選択・ジャンプ機能）
    ShowDetailsTimeLine() {
        // Storeの機能を使って昇順にソート
        // $Data.Store.GetDetailsWithSort("date", "asc");
        const details = $Data.Store.GetDetails();
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
            // インデックス番号のセット
            const indexBadge = $Dom.QuerySelector(".js-index-badge", child);
            if (indexBadge) indexBadge.textContent = (index + 1);
            //
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = item.body || "";
            // 金額のセットと色分け
            const priceWrapper = $Dom.QuerySelector(".js-price-wrapper", child);
            const priceEl = $Dom.QuerySelector(".js-price", child);
            const priceUnitEl = $Dom.QuerySelector(".js-price-unit", child);
            if (priceEl && priceWrapper) {
                const price = Number(item.memo_price || 0);
                if (price !== 0) {
                    // 金額がある場合は表示
                    $Dom.ToggleShow(priceWrapper, true);
                    // 通貨単位の取得（親アーカイブの設定、またはユーザー設定）
                    let displayCurrency = $App.AppData.Owner.currency_unit || 'JPY';
                    if (item.archive_id > 0) {
                        const archiveList = $Data.Store.GetArchiveList() || [];
                        const targetArc = archiveList.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                        if (targetArc && targetArc.currency_unit) {
                            displayCurrency = targetArc.currency_unit;
                        }
                    }
                    if (priceUnitEl) priceUnitEl.textContent = displayCurrency;
                    if (price > 0) {
                        priceEl.textContent = `+${price.toLocaleString()}`;
                        // priceEl.className = "js-price text-[1rem] font-black italic  text-blue-500";
                        priceEl.className += " text-blue-500";
                    } else if (price < 0) {
                        priceEl.textContent = price.toLocaleString();
                        priceEl.className += " text-red-500";
                    }
                } else {
                    // 0円の時は枠ごと隠す
                    $Dom.ToggleShow(priceWrapper, false);
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
            help: "",
            buttons: []
        });
    },
    // 地図用のシンプルリスト表示
    ShowDetailsSimpleList() {
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("No data.");
            return;
        }
        const el = $Dom.GenerateTemplate("tpl-list-parent");
        // el.className = "w-full text-black-3 mb-2 px-1 space-y-4";
        details.forEach((item, index) => {
            const child = $Dom.GenerateTemplate("tpl-list-child-simple");
            const dateStr = (item.memo_date || "").replace(/-/g, '.');
            $Dom.QuerySelector(".js-date", child).textContent = dateStr;
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            // 本文の改行をスペースに置換してセット（1行に収まるように）
            const bodyStr = (item.body || "").replace(/\r?\n/g, ' ');
            $Dom.QuerySelector(".js-body", child).textContent = bodyStr;
            // ▼ 修正：金額エリアのセットと表示制御
            const priceWrapper = $Dom.QuerySelector(".js-price-wrapper", child);
            const priceEl = $Dom.QuerySelector(".js-memo-price", child);
            const currencyEl = $Dom.QuerySelector(".js-memo-currency", child);
            if (priceWrapper && priceEl && currencyEl) {
                const price = Number(item.memo_price || 0);
                if (price !== 0) {
                    $Dom.ToggleShow(priceWrapper, true);
                    let displayCurrency = $App.AppData.Owner.currency_unit || 'JPY';
                    if (item.archive_id > 0) {
                        const archiveList = $Data.Store.GetArchiveList() || [];
                        const targetArc = archiveList.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                        if (targetArc && targetArc.currency_unit) {
                            displayCurrency = targetArc.currency_unit;
                        }
                    }
                    currencyEl.textContent = displayCurrency;
                    if (price > 0) {
                        priceEl.textContent = `+${price.toLocaleString()}`;
                        // priceEl.className = "js-memo-price text-[1rem] font-black italic  text-blue-500";
                        priceEl.className += " text-blue-500";
                    } else if (price < 0) {
                        priceEl.textContent = price.toLocaleString();
                        priceEl.className += " text-red-500";
                    }
                } else {
                    // 0円の時はラッパーごと非表示にして隙間を詰める
                    $Dom.ToggleShow(priceWrapper, false);
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
            help: "",
            buttons: []
        });
        setTimeout(() => {
            const activeFrame = _DialogCore.stack[_DialogCore.stack.length - 1];
            if (activeFrame) {
                const titleText = $Dom.QuerySelector('#dialog-title', activeFrame);
                if (titleText) {
                    titleText.classList.remove('truncate');
                    titleText.classList.add('flex', 'flex-col', 'justify-center');
                    titleText.innerHTML = `SEARCH RESULTS <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 not-italic">INDEPENDENT MEMOS</span>`;
                }
            }
        }, 10);
    },
    // まとめ親一覧選択
    ShowArchiveList() {
        $Warn.CatchAsync(async () => {
            const isSuccess = await $Data.Access.GetArchiveList();
            if (!isSuccess) return;
            const root = $Dom.GenerateTemplate("tpl-list-parent");
            // root.className = "w-full text-black-3 mb-2 px-1";
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
                    $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim, 'YYYY-MM-DD　HH:mm');
                    $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                    $Dom.QuerySelector(".js-count", child).textContent = item.cnt || "0";
                    const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                    if (isPublicGroup) {
                        if (item.closed_flg) {
                            // Publicデータ（CLOSE）
                            // leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-200";
                            leftBorder.className += " bg-slate-200";
                        } else {
                            // Publicデータ（OPEN）
                            leftBorder.className += " bg-brand-5";
                        }
                    } else {
                        // 内部データ（PRIVATE）
                        leftBorder.className += " bg-slate-800";
                    }
                    child.onclick = () => {
                        _DialogCore.closeAll();
                        $App.AppData.Context.ScreenMode = isPublicGroup
                            ? $Const.SCREEN_MODE.ARCHIVE_PUB
                            : $Const.SCREEN_MODE.ARCHIVE;
                        $App.AppData.Context.TargetArchiveId = item.archive_id;
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
            help: "",
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
            // root.className = "w-full text-black-3 mb-2 px-1";
            const archives = $Data.Store.GetArchiveList() ||[];
            // プライベートデータのみに絞る
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
                $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim, 'YYYY-MM-DD　HH:mm');
                $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                $Dom.QuerySelector(".js-count", child).textContent = item.cnt || "0";
                // バッジの装飾（PRIVATE固定）
                const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                // leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-800";
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
                    $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                    $App.AppData.Context.TargetArchiveId = item.archive_id;
                    await $App.RefreshScreen();
                };
                root.appendChild(child);
            });
            // 選択用ダイアログを開く
            _DialogCore.open({
                title: "SELECT ARCHIVE",
                content: root,
                help: "",
                buttons: []
            });
        })();
    },
    // メモをまとめる（複数選択モード）
    ShowMultiSelectTimeline() {
        const details = $Data.Store.GetDetails();
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
                const cardHtml = "js-item-card flex items-center gap-3 p-3 mb-2 rounded-[1rem] border-2 cursor-pointer active:scale-[0.98] transition-all";
                const checkHtml = "shrink-0 w-6 h-6 rounded-[1rem] border-2 flex items-center justify-center js-checkbox transition-colors";
                if (isSel) {
                    // card.className = "js-item-card flex items-center gap-3 p-3 mb-2 rounded-[1rem] border-2 cursor-pointer active:scale-[0.98] transition-all border-brand-5 bg-white shadow-md";
                    // checkbox.className = "shrink-0 w-6 h-6 rounded-[1rem] border-2 flex items-center justify-center js-checkbox transition-colors border-brand-5 bg-brand-5";
                    card.className = cardHtml + " border-brand-5 bg-white shadow-md";
                    checkbox.className = checkHtml + " border-brand-5 bg-brand-5";
                    mark.classList.remove("hidden");
                } else {
                    card.className = cardHtml + " border-brand-1 bg-white";
                    checkbox.className = checkHtml + " border-brand-2 bg-transparent";
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
            help: "",
            buttons: [[
                {
                    id: "btn-ms-merge",
                    label: "⇄ MERGE",
                    // className: "bg-brand-5 text-white shadow-md disabled:opacity-50 flex items-center justify-center gap-2",
                    className: "disabled:opacity-50 flex items-center justify-center gap-2",
                    handler: async () => {
                        const seqs = Array.from(selectedSeqs);
                        const isOk = await this.ShowConfirm({ title: "MERGE", message: `${seqs.length}件のアイテムを\n新しいまとめにしますか？` });
                        if (!isOk) return;
                        const isSuccess = await $Data.Access.MergeDetails({
                            seqs,
                            title: "メモのまとめタイトル_" + $Util.FormatDate(new Date(), 'YYYYMMDD_HHmmss'),
                            currency_unit: $App.AppData.Owner.currency_unit || 'JPY'
                        });
                        if (!isSuccess) return;
                        $Notice.Info("作成しました");
                        _DialogCore.closeAll();
                        $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                        await $App.RefreshScreen();
                    }
                },
                {
                    id: "btn-ms-add",
                    label: "＋ ADD",
                    className: "disabled:opacity-50 flex items-center justify-center gap-2",
                    handler: () => {
                        const seqs = Array.from(selectedSeqs);
                        // 新しく作った専用メソッドを呼び出す
                        this.SelectArchiveForAdd(seqs);
                    }
                },
            ]]
        });
        updateSelectionUI(); // フッターボタン生成後に再度呼んで初期状態の disabled を反映
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
                $App.AppData.Context.ScreenMode = nextScreenMode;
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
            btn.addEventListener('click', (e) => {
                const clickedVal = btn.dataset.val;
                if (clickedVal === "0") {
                    // --- 【Clearボタンの挙動】 ---
                    // すべてのスライダーを0にリセット
                    rngWind.value = 0;
                    rngDensity.value = 0;
                    rngDarkness.value = 0;
                    // 全ボタンの選択状態を解除（Clear自体も選択状態にしない）
                    weatherBtns.forEach(b => {
                        b.classList.remove('bg-brand-5', 'text-white', 'border-brand-5');
                        b.classList.add('bg-white', 'text-brand-5', 'border-brand-3');
                    });
                    currentW = "0"; // 内部値は0（晴れ）にする
                } else {
                    // --- 【天候ボタンの挙動】 ---
                    // 一旦すべての選択を解除
                    weatherBtns.forEach(b => {
                        b.classList.remove('bg-brand-5', 'text-white', 'border-brand-5');
                        b.classList.add('bg-white', 'text-brand-5', 'border-brand-3');
                    });
                    // 押されたボタンを選択状態にする
                    btn.classList.remove('bg-white', 'text-brand-5', 'border-brand-3');
                    btn.classList.add('bg-brand-5', 'text-white', 'border-brand-5');
                    currentW = clickedVal;
                    // 密度が0なら1に引き上げる
                    if (parseInt(rngDensity.value) === 0) {
                        rngDensity.value = 1;
                    }
                }
                // 数値表示とエフェクトの更新
                applyEffect();
            });
        });
        applyEffect(); // ダイアログを開いた瞬間にエフェクト適用
        _DialogCore.open({
            title: "ATMOSPHERE SETTING",
            content: el,
            help: "",
            onClose: () => {
                // キャンセル・✖ボタン・背景クリック時などにエフェクトを戻す
                if (typeof Atmosphere !== 'undefined') {
                    Atmosphere.hide();
                    if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '0';
                }
            },
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-md",
                        handler: () => {
                            _DialogCore.close();
                        },
                    },
                    {
                        label: "OK",
                        handler: () => {
                            const finalCode = txtCode.textContent;
                            if (onOk) onOk(finalCode);
                            _DialogCore.close();
                        }
                    }
                ]
            ]
        });
    },
    // まとめ親詳細参照（アーカイブ）
    ShowArchiveInfo() {
        const archive = $Data.Store.GetArchive();
        if (!archive) return $Notice.Warn("Not found.");
        // 管理者かどうかの判定
        const isAdmin = $App.AppData.Context.IsLoggedIn && $App.AppData.Owner.plan === "Admin";
        //
        const el = $Dom.GenerateTemplate('tpl-view-archive');
        const renderView = () => {
            // ① 常に最新のデータを取得
            const currentArchive = $Data.Store.GetArchive(); 
            // ② タイトルと本文の反映
            $Dom.QuerySelector('#view-mem-title', el).textContent = currentArchive.title || "";
            $Dom.QuerySelector('#view-mem-body', el).textContent = currentArchive.memo || "";
            // ③ ★リンクの反映（すべて currentArchive を参照するように統一）
            const viewUrl = $Dom.QuerySelector('#view-mem-url', el);
            if (currentArchive.link_url) {
                const iconHtml = $Util.GetUrlIconHtml(currentArchive.link_url, 28);
                viewUrl.href = currentArchive.link_url;
                viewUrl.innerHTML = iconHtml;
                $Dom.ToggleShow(viewUrl, true); // 表示する
            } else {
                $Dom.ToggleShow(viewUrl, false); // 隠す
            }
            // ④ 件数の反映
            const details = $Data.Store.GetDetails() || [];
            $Dom.QuerySelector('#mem-stat-count', el).textContent = details.length;
            $Dom.QuerySelector('#btn-view-mem-timeline', el).onclick = () => {
                this.ShowDetailsTimeLine();
            };
            // ⑤ 金額の反映
            const totalPrice = details.reduce((sum, item) => sum + Number(item.memo_price || 0), 0);
            const priceVal = $Dom.QuerySelector('#mem-stat-price', el);
            const priceUnit = $Dom.QuerySelector('#view-mem-price-unit', el);
            const displayCurrency = currentArchive.currency_unit || $App.AppData.Owner.currency_unit || 'JPY';
            priceUnit.textContent = displayCurrency;
            if (totalPrice > 0) {
                // priceVal.className = "text-[1.2rem] font-black text-blue-600 mr-2 italic";
                priceVal.className += " text-blue-600";
                priceVal.textContent = `+${totalPrice.toLocaleString()}`;
            } else if (totalPrice < 0) {
                priceVal.className += " text-red-600";
                priceVal.textContent = `- ${Math.abs(totalPrice).toLocaleString()}`;
            } else {
                priceVal.className += " text-black-5";
                priceVal.textContent = `0`;
            }
        };
        renderView();
        const btnUserProfile = $Dom.QuerySelector('#btn-mem-user-profile', el);
        const profile = $Data.Store.GetUserProfile();
        if (profile) {
            $Dom.QuerySelector('#view-mem-user-icon', el).textContent = profile.icon || "😀";
            $Dom.QuerySelector('#view-mem-user-id', el).textContent = profile.nickName;
            btnUserProfile.onclick = () => this.ShowUserProfile(profile, archive.is_owner);
        } else {
            $Dom.ToggleShow(btnUserProfile, false);
        }
        // --- ヘッダーボタンの定義 ---
        const headerButtons = [];
        if (archive.is_public && !archive.closed_flg) {
            headerButtons.push({
                label: "🔗",
                handler: () => this.ShowShareArchive(archive, profile)
            });
        }
        if (archive.is_owner) {
            headerButtons.push({
                label: "✏️",
                handler: () => this.ShowEditArchive(archive, renderView)
            });
        }
        if (!archive.is_owner) {
            headerButtons.push({
                label: "🚫",
                handler: () => this.ShowReportPost(archive)
            });
        }
        // --- ボタンの定義 ---
        const dialogButtons = [];
        if (archive.is_owner) {
        const btnMainClass    = "bg-brand-5 text-white shadow-md";
        const btnReleaseClass = "bg-white text-red-400 border border-brand-4 shadow-md";
            if (!archive.is_public) {
                dialogButtons.push([{
                    label: "Private　⇒　Public",
                    className: btnMainClass,
                    handler: () => this._execStatusChange(
                        'PublishArchive',
                        { archive_id: archive.archive_id },
                        "Switch to [Public]",
                        "Do you want to make\nthis internal data [Public]？",
                        "Set to [Public].",
                        $Const.SCREEN_MODE.ARCHIVE_PUB
                    )
                }]);
                dialogButtons.push([{
                    label: "Archive　⇒　Details",
                    className: btnReleaseClass,
                    handler: () => this._execStatusChange(
                        'DeleteArchive',
                        { archive_id: archive.archive_id },
                        "Restore to Details",
                        "Restore this group to\nindividual detail items？",
                        "Restored to individual detail items.",
                        $Const.SCREEN_MODE.CREATE
                    )
                }]);
            } else {
                if (archive.closed_flg) {
                    dialogButtons.push([{
                        label: "Close　⇒　Open",
                        className: btnMainClass,
                        handler: () => this._execStatusChange(
                            'OpenArchive',
                            { archive_id: archive.archive_id },
                            "Switch to [Open]",
                            "Do you want to switch\nthis data to [Open]？",
                            "Switched to [Open].",
                            null,
                            () => $Data.Store.UpdateArchive({ closed_flg: false })
                        )
                    }]);
                } else {
                    dialogButtons.push([{
                        label: "Open　⇒　Close",
                        className: btnMainClass,
                        handler: () => this._execStatusChange(
                            'CloseArchive',
                            { archive_id: archive.archive_id },
                            "Switch to [Close]",
                            "Do you want to switch\nthis data to [Close]？",
                            "Switched to [Close].",
                            null,
                            () => $Data.Store.UpdateArchive({ closed_flg: true })
                        )
                    }]);
                }
                dialogButtons.push([{
                    label: "Public　⇒　Private",
                    className: btnReleaseClass,
                    handler: () => this._execStatusChange(
                        'UnpublishArchive',
                        { archive_id: archive.archive_id },
                        "Switch to [Private]",
                        "Do you want to revert\nthis data to Private？",
                        "Reverted to [Private].",
                        $Const.SCREEN_MODE.ARCHIVE
                    )
                }]);
            }
        }
        // --- 管理者専用ボタン ---
        if (isAdmin && archive.is_public && !archive.is_owner) {
            // 【注意】強制Close
            if (!archive.closed_flg) {
                dialogButtons.push([{
                    label: "【ADMIN】強制 Close",
                    className: "bg-red-500 text-white shadow-md",
                    handler: async () => {
                        const isOk = await this.ShowConfirm({ title: "ADMIN: CLOSE", message: "【注意】\n強制的にClose状態にしますか？" });
                        if (!isOk) return;
                        const isSuccess = await $Data.Access.AdminCloseArchive({ archive_id: archive.archive_id, target_user_id: archive.user_id });
                        if (!isSuccess) return;
                        $Notice.Info("強制的にCloseしました");
                        _DialogCore.closeAll();
                        await $App.RefreshScreen(); // 画面を更新して反映
                    }
                }]);
            }
            // 【警告】強制Private戻し
            dialogButtons.push([{
                label: "【ADMIN】強制 Privateに戻す",
                className: "bg-white text-red-600 border-2 border-red-500 shadow-sm",
                handler: async () => {
                    const isOk = await this.ShowConfirm({ title: "ADMIN: UNPUBLISH", message: "【警告】\n強制的にPrivate(公開停止)に戻しますか？" });
                    if (!isOk) return;
                    const isSuccess = await $Data.Access.AdminUnpublishArchive({ archive_id: archive.archive_id, target_user_id: archive.user_id });
                    if (!isSuccess) return;
                    $Notice.Info("強制的にPrivateに戻しました");
                    _DialogCore.closeAll();
                    await $App.RefreshScreen(); // 画面を更新して反映
                }
            }]);
        }
        const frame = _DialogCore.open({
            title: "Archive info",
            content: el,
            help: "",
            headerButtons: headerButtons, // ここで上段ボタンを渡す
            buttons: dialogButtons,
        });
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
        // --- 文字数カウント制御 ---
        const cTitle = $Dom.QuerySelector('#edit-mem-title-count', el);
        const cBody  = $Dom.QuerySelector('#edit-mem-body-count', el);
        cTitle.textContent = editTitle.value.length;
        cBody.textContent  = editBody.value.length;
        editTitle.addEventListener('input', () => cTitle.textContent = editTitle.value.length);
        editBody.addEventListener('input',  () => cBody.textContent  = editBody.value.length);
        //
        _DialogCore.open({
            title: "EDIT ARCHIVE",
            content: el,
            help: "",
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-md",
                        handler: () => {
                            _DialogCore.close();
                        },
                    },
                    {
                        label: "SAVE DATA",
                        className: "",
                        handler: $Warn.CatchAsync(async () => {
                            const updatedFields = {
                                title: editTitle.value,
                                memo: editBody.value,
                                link_url: editUrl.value,
                                currency_unit: editCurrency.value.trim(),
                            };
                            const isSuccess = (!archive.is_public)
                                ? await $Data.Access.UpdateArchive({ archive_id: archive.archive_id, ...updatedFields })
                                : await $Data.Access.UpdateArchivePub({ archive_id: archive.archive_id, ...updatedFields });
                            if (!isSuccess) return;
                            $Data.Store.UpdateArchive(updatedFields);
                            $TopBar.ChangeTitle(updatedFields.title);
                            $Notice.Info("Changes saved.");
                            _DialogCore.closeAll();
                            // if (onUpdate) onUpdate(); // 参照画面のDOMを最新化
                        })
                    }
                ]
            ]
        });
    },
    // プロフィール参照
    async ShowUserProfile(profile, isOwner) {
        if (isOwner) profile = $App.AppData.Owner.systemInfo.ownerProfile;
        if (!profile) return $Notice.Warn("ユーザー情報がありません");
        const el = $Dom.GenerateTemplate('tpl-view-profile');
        const renderView = () => {
            const pIcon = profile.icon || "👤";
            const pName = profile.nickName || "No Name";
            const pDesc  = profile.description || "";
            const pL1   = profile.link1 || "";
            const pL2   = profile.link2 || "";
            const pL3   = profile.link3 || "";
            $Dom.QuerySelector('#view-profile-icon', el).textContent = pIcon;
            $Dom.QuerySelector('#view-profile-nickname', el).textContent = pName;
            // $Dom.QuerySelector('#view-profile-userid', el).textContent = profile.user_id || "";
            $Dom.QuerySelector('#view-profile-description', el).textContent = pDesc;
            const viewLinks = $Dom.QuerySelector('#view-profile-links', el);
            viewLinks.innerHTML = "";
            const links =[pL1, pL2, pL3].filter(l => l && l.trim() !== "");
            links.forEach(l => {
				const a = document.createElement("a");
				a.href = l; a.target = "_blank";
				a.className = "w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md active:scale-90 transition-transform overflow-hidden";
				a.innerHTML = $Util.GetUrlIconHtml(l, 24);
				a.title = l;
				viewLinks.appendChild(a);
			});
        };
        renderView();
		const headerButtons = [];
		if (isOwner) {
            headerButtons.push({
                label: "✉️",
                id: "btn-header-mail",
                handler: () => {
                    _DialogCore.close();
                    this.ShowUserMailList();
                }
            });
			headerButtons.push({
				label: "✏️",
				handler: () => this.ShowEditProfile(profile, renderView)
			});
		}
		_DialogCore.open({
			title: "USER PROFILE",
			content: el,
			headerButtons: headerButtons
		});
        // バッジを反映
        setTimeout(() => this._updateProfileMailBadge(), 10);
    },
    // プロフィール編集（上にスタックされる）
    ShowEditProfile(profile, onUpdate) {
        const el = $Dom.GenerateTemplate('tpl-edit-profile');
        const editIconPreview = $Dom.QuerySelector('#edit-profile-icon-preview', el);
        const editIconInput = $Dom.QuerySelector('#edit-profile-icon', el);
        const editNickname = $Dom.QuerySelector('#edit-profile-nickname', el);
        const editNicknameCount = $Dom.QuerySelector('#edit-profile-nickname-count', el);
        const editDesc = $Dom.QuerySelector('#edit-profile-description', el);
        const editDescCount = $Dom.QuerySelector('#edit-profile-description-count', el);
        const editLink1 = $Dom.QuerySelector('#edit-profile-link1', el);
        const editLink2 = $Dom.QuerySelector('#edit-profile-link2', el);
        const editLink3 = $Dom.QuerySelector('#edit-profile-link3', el);
        editIconPreview.textContent = profile.icon || "👤";
        editIconInput.value = profile.icon || "👤";
        editNickname.value = profile.nickName || "";
        editNicknameCount.textContent = (profile.nickName || "").length;
        editDesc.value = profile.description || "";
        editDescCount.textContent = (profile.description || "").length;
        editLink1.value = profile.link1 || "";
        editLink2.value = profile.link2 || "";
        editLink3.value = profile.link3 || "";
        editDesc.addEventListener('input', () => editDescCount.textContent = editDesc.value.length);
        editNickname.addEventListener('input', () => editNicknameCount.textContent = editNickname.value.length);
        $Dom.QuerySelector('#btn-profile-icon-trigger', el).onclick = () => {
            $Util.ShowEmojiPicker((emoji) => {
                editIconPreview.textContent = emoji;
                editIconInput.value = emoji;
            });
        };
        _DialogCore.open({
            title: "EDIT PROFILE",
            content: el,
            help: "",
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-md",
                        handler: () => {
                            _DialogCore.close();
                        },
                    },
                    {
                        label: "SAVE",
                        className: "bg-brand-4 text-white shadow-md",
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
    // ② ユーザあて通知一覧画面
    async ShowUserMailList() {
        const mails = $App.AppData.Owner.systemInfo.userNotifications || [];
        if (mails.length === 0) {
            $Notice.Warn("メッセージはありません");
            return;
        }
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        root.className = "w-full text-black-3 mb-2 px-1";
        // システム通知と同様のスタイル制御（未読：太枠＋影 / 既読：薄枠）
        const setMailStyle = (el, isNew) => {
            const badge = $Dom.QuerySelector(".js-badge-new", el);
            $Dom.ToggleShow(badge, isNew);
            if (isNew) {
                el.classList.add("border-brand-5", "shadow-xl", "bg-white");
                el.classList.remove("border-slate-200", "shadow-sm", "bg-slate-50");
            } else {
                el.classList.remove("border-brand-5", "shadow-xl", "bg-white");
                el.classList.add("border-slate-200", "shadow-sm", "bg-slate-50");
                el.style.opacity = "0.8";
            }
        };
        // 送信日時が新しい順にソートして描画
        [...mails].sort((a, b) => new Date(b.send_tim) - new Date(a.send_tim)).forEach(item => {
            const child = $Dom.GenerateTemplate("tpl-list-child-notice");
            // 既読管理（後ほど既読判定ロジックを追加可能。一旦すべて未読として扱う）
            const isNew = item.is_new ?? true; 
            setMailStyle(child, isNew);
            $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
            $Dom.QuerySelector(".js-icon", child).textContent = item.emoji || "✉️️";
            // 本文の1行目をタイトル、全体を本文としてリストに表示
            const lines = item.body.split('\n');
            $Dom.QuerySelector(".js-title", child).textContent = lines[0];
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            child.onclick = async () => {
                // クリック時の既読処理（スタイル変更）
                if (item.is_new) {
                    item.is_new = false;
                    await $LocalDb.Mail.Save(item.seq, item.send_tim);
                    setMailStyle(child, false);
                    if ($App.AppData.Context.UnreadMailCount > 0) {
                        $App.AppData.Context.UnreadMailCount--;
                        // プロフィール内のバッジと、システムメニューの赤丸の両方を更新
                        this._updateProfileMailBadge();
                        $UI.UpdateNoticeBadge(); // これを追加
                    }
                }
                // ③ 詳細画面へ
                this.ShowUserMailDetail(item);
            };
            root.appendChild(child);
        });
        _DialogCore.open({
            title: "MESSAGES",
            content: root
        });
        // バッジを反映
        setTimeout(() => this._updateProfileMailBadge(), 10);
    },
    // ③ ユーザあて通知詳細画面
    ShowUserMailDetail(item) {
        // テンプレートはプロフィール形式に整えた tpl-view-notice を使用
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        // 本文の1行目をタイトル、残りを本文として分割
        const lines = (item.body || "").split('\n');
        const title = lines[0] || "No Subject";
        const body = lines.slice(1).join('\n');
        // 各要素への反映
        $Dom.QuerySelector('#view-notice-icon', el).textContent = item.emoji || "✉️️";
        $Dom.QuerySelector('#view-notice-title', el).textContent = title;
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        // 2行目以降があれば本文に、なければ全体を表示（運営からの短い連絡を考慮）
        const bodyEl = $Dom.QuerySelector('#view-notice-body', el);
        bodyEl.textContent = body.trim() !== "" ? body : item.body;
        _DialogCore.open({
            title: "MESSAGE DETAILS",
            content: el,
            buttons: []
        });
    },
    // ユーザあて通知の赤丸バッジ更新
    _updateProfileMailBadge() {
        const count = $App.AppData.Context.UnreadMailCount || 0;
        const btn = document.getElementById("btn-header-mail");
        if (!btn) return;
        const oldBadge = btn.querySelector(".js-unread-badge");
        if (oldBadge) oldBadge.remove();
        if (count > 0) {
            btn.classList.add("relative");
            btn.insertAdjacentHTML('beforeend', 
                `<span class="js-unread-badge absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white pointer-events-none shadow-sm"></span>`
            );
        }
    },
    // 通知詳細ダイアログ (修正版)
	ShowNoticeDetail(notice) {
		const el = $Dom.GenerateTemplate('tpl-view-notice');
		const kindObj = Object.values($Const.NOTICE_KIND).find(k => k.id === notice.kind) || $Const.NOTICE_KIND.NOTICE;
        $Dom.QuerySelector('#view-notice-icon', el).textContent = kindObj.emoji;
		$Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(notice.update_tim, 'YYYY-MM-DD　HH:mm');
		$Dom.QuerySelector('#view-notice-title', el).textContent = notice.title;
		$Dom.QuerySelector('#view-notice-body', el).textContent = notice.body;
        // リンクURLの表示制御 (共通メソッドを使用)
        const urlWrapper = $Dom.QuerySelector('#view-notice-url-wrapper', el);
        if (notice.link_url && notice.link_url.trim() !== "") {
            $Dom.ToggleShow(urlWrapper, true);
            const urlLink = $Dom.QuerySelector('#view-notice-url', el);
            // aタグのhrefを設定し、中身に共通アイコンHTMLを注入
            urlLink.href = notice.link_url;
            urlLink.innerHTML = $Util.GetUrlIconHtml(notice.link_url, 28);
        } else {
            $Dom.ToggleShow(urlWrapper, false);
        }
		_DialogCore.open({
			title: "NOTICE DETAILS",
			content: el
		});
	},
    // 通知リスト表示（修正版）
    async ShowNoticeList() {
        const notices = $App.AppData.Owner.systemInfo.notifications || [];
        if (notices.length === 0) {
            $Notice.Warn("データはありません");
            return;
        }
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        // root.className = "w-full text-black-3 mb-2 px-1";
        const setNoticeStyle = (el, isNew) => {
            const badge = $Dom.QuerySelector(".js-badge-new", el);
            $Dom.ToggleShow(badge, isNew);
            if (isNew) {
                // 【未読】ブランドカラーの太枠 ＋ 強い影 ＋ 白背景
                el.classList.remove("border-slate-200", "shadow-sm", "bg-slate-50");
                el.classList.add("border-brand-5", "shadow-md", "bg-white");
            } else {
                // 【既読】薄いグレー枠 ＋ 影なし ＋ わずかにグレー背景
                el.classList.remove("border-brand-5", "shadow-md", "bg-white");
                el.classList.add("border-slate-200", "shadow-sm", "bg-slate-50");
                // テキストも少し薄くする
                el.style.opacity = "0.8";
            }
        };
        notices.forEach(item => {
            const child = $Dom.GenerateTemplate("tpl-list-child-notice");
            // スタイルの初期適用
            setNoticeStyle(child, item.is_new);
            $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim, 'YYYY-MM-DD　HH:mm');
            const kindObj = Object.values($Const.NOTICE_KIND).find(k => k.id === item.kind) || $Const.NOTICE_KIND.NOTICE;
            $Dom.QuerySelector('.js-icon', child).textContent = kindObj.emoji;
            $Dom.QuerySelector(".js-title", child).textContent = item.title;
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            child.onclick = async () => {
                if (item.is_new) {
                    item.is_new = false; 
                    await $LocalDb.Notice.Save(item.seq, item.update_tim, item.disp_to);
                    // クリックした瞬間にスタイルを「既読」へ変更（即時反映）
                    setNoticeStyle(child, false);
                    if ($App.AppData.Context.UnreadNoticeCount > 0) {
                        $App.AppData.Context.UnreadNoticeCount--;
                        $UI.UpdateNoticeBadge($App.AppData.Context.UnreadNoticeCount);
                    }
                }
                this.ShowNoticeDetail(item);
            };
            root.appendChild(child);
        });
        _DialogCore.open({
            title: "NOTIFICATIONS",
            content: root
        });
    },
    // 【管理者機能】管理者メニュー
    ShowAdminMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-admin');
        $Dom.QuerySelector('#btn-admin-notice', el).onclick = () => this.ShowAdminNoticeList();
        $Dom.QuerySelector('#btn-admin-report', el).onclick = () => this.ShowAdminReportList();
        $Dom.QuerySelector('#btn-admin-feedback', el).onclick = () => this.ShowAdminFeedbackList();
        $Dom.QuerySelector('#btn-admin-user-mail', el).onclick = () => this.ShowAdminUserMailList();
        _DialogCore.open({
            title: "ADMIN TOOLS",
            content: el,
            help: "",
        });
    },
    // 通知管理リスト（API通信化）
    async ShowAdminNoticeList() {
        const isSuccess = await $Data.Access.GetAllNotifications({});
        if (!isSuccess) return;
        const notices = $App.AppData.Admin.notifications ||[];
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        // root.className = "w-full text-black-3 mb-2 px-1";
        const renderList = async () => {
            root.innerHTML = "";
            if (notices.length === 0) {
                root.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-400 py-6">通知データがありません</div>`;
                return;
            }
            const now = new Date();
            const sorted = [...notices].sort((a, b) => new Date(b.update_tim) - new Date(a.update_tim));
            sorted.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-notice");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim, 'YYYY-MM-DD　HH:mm');
                const kindObj = Object.values($Const.NOTICE_KIND).find(k => k.id === item.kind) || $Const.NOTICE_KIND.NOTICE;
                $Dom.QuerySelector(".js-title", child).textContent = `${kindObj.emoji} ${item.title}`;
                $Dom.QuerySelector(".js-body", child).textContent = item.body;
                const fromDate = new Date(item.disp_from);
                const toDate = new Date(item.disp_to);
                const isPublic = (now >= fromDate && now <= toDate);
                const badge = $Dom.QuerySelector(".js-badge-status", child);
                if (isPublic) {
                    badge.textContent = "公開中";
                    // badge.className = "js-badge-status text-[9px] font-black px-2 py-0.5 _rounded-full uppercase tracking-wider shadow-md border border-brand-3 bg-brand-5 text-white";
                    badge.className += " border-brand-3 bg-brand-5 text-white";
                } else if (now < fromDate) {
                    badge.textContent = "公開前";
                    badge.className += " border-slate-300 bg-slate-100 text-slate-500";
                } else {
                    badge.textContent = "公開終了";
                    badge.className += " border-slate-300 bg-slate-500 text-white";
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
        //
        _DialogCore.open({
            title: "NOTICE Mgmt",
            content: root,
            help: "システム全体への通知を管理します。\n下のボタンから新規作成、一覧の項目タップで編集が可能です。",
            // ★ 新規登録ボタンをここ（下部ボタンエリア）に配置
            buttons: [
                {
                    label: "＋ CREATE NEW NOTICE",
                    className: "w-full bg-brand-5 text-white shadow-md font-black",
                    handler: () => {
                        this.ShowAdminNoticeEdit(null, () => {
                            _DialogCore.close(); // 一覧を閉じる
                            this.ShowAdminNoticeList(); // 最新状態で一覧を出し直す
                        });
                    }
                }
            ]
        });
    },
    // 通知の編集・新規登録（API通信化）
    ShowAdminNoticeEdit(noticeItem, onSaved) {
        const isNew = !noticeItem;
        const target = isNew ? {
            seq: 0, title: "", body: "", kind: 0,
            link_url: "",
            disp_from: $Util.FormatDate(new Date(), 'YYYY-MM-DD'), // 時間を消す
            disp_to: "2099-12-31", // 時間を消す
        } : { ...noticeItem };
        const el = $Dom.GenerateTemplate("tpl-admin-notice-edit");
        const selKind = $Dom.QuerySelector('#edit-notice-kind', el);
        const inptTitle = $Dom.QuerySelector('#edit-notice-title', el);
        const inptBody = $Dom.QuerySelector('#edit-notice-body', el);
        const inptUrl = $Dom.QuerySelector('#edit-notice-url', el);
        const inptFrom = $Dom.QuerySelector('#edit-notice-from', el);
        const inptTo = $Dom.QuerySelector('#edit-notice-to', el);
        // カウンター要素の取得
        const countTitle = $Dom.QuerySelector('#edit-notice-title-count', el);
        const countBody = $Dom.QuerySelector('#edit-notice-body-count', el);
        // 定数からセレクトボックスの選択肢を動的生成
        selKind.innerHTML = "";
        Object.values($Const.NOTICE_KIND).forEach(k => {
            const opt = document.createElement("option");
            opt.value = k.id;
            opt.textContent = `${k.id}: ${k.label} ${k.emoji}`;
            selKind.appendChild(opt);
        });
        // 値をセット
        selKind.value = target.kind;
        inptTitle.value = target.title;
        inptBody.value = target.body;
        inptUrl.value = target.link_url || "";
        inptFrom.value = $Util.FormatDate(target.disp_from, 'YYYY-MM-DD');
        inptTo.value = $Util.FormatDate(target.disp_to, 'YYYY-MM-DD');
        // --- 即時反映のための初期カウント表示 ---
        countTitle.textContent = inptTitle.value.length;
        countBody.textContent = inptBody.value.length;
        // --- イベントリスナーの登録 (inputイベントを使う) ---
        inptTitle.addEventListener('input', () => {
            countTitle.textContent = inptTitle.value.length;
        });
        _DialogCore.open({
            title: isNew ? "NEW NOTICE" : "EDIT NOTICE",
            content: el,
            help: "",
            buttons:[[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
						_DialogCore.close();
                    },
                },
                {
                    label: "SAVE",
                    className: "bg-brand-5 text-white shadow-md",
                    handler: async () => {
                        const req = {
                            seq: target.seq,
                            title: inptTitle.value.trim() || "No Title",
                            body: inptBody.value.trim(),
                            link_url: inptUrl.value.trim(),
                            kind: Number(selKind.value),
                            disp_from: inptFrom.value + "T00:00:00",
                            disp_to: inptTo.value + "T23:59:59"
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
        // root.className = "w-full text-black-3 mb-2 px-1";
        if (reportSummary.length === 0) {
            root.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-400 py-6">通報データはありません</div>`;
        } else {
            // 通報件数の多い順にソート
            const sorted = [...reportSummary].sort((a, b) => b.report_count - a.report_count);
            sorted.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-summary");
                $Dom.QuerySelector(".js-target-user", child).textContent = `Target: ${item.target_user_name || item.target_user_id}`;
                $Dom.QuerySelector(".js-archive-title", child).textContent = item.archive_title || "Unknown Title";
                $Dom.QuerySelector(".js-badge-count", child).textContent = `${item.report_count}`;
                child.onclick = () => this.ShowAdminReportDetail(item);
                root.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "REPORT Mgmt",
            content: root,
            help: "",
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
        // 下部のボタン定義
        const dialogButtons = [];
        // 1段目：送信（SUBMIT）ボタン
        dialogButtons.push([{
            label: "SUBMIT",
            className: "bg-red-600 text-white shadow-none rounded-none",
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
                _DialogCore.close();
            }
        }]);
        // 2段目：既に通報済みの場合のみ「削除（取り消し）」ボタンを配置
        if (myReport) {
            dialogButtons.push([{
                label: "取り消す (DELETE)",
                className: "bg-white text-slate-800 border-2 border-slate-800 shadow-none rounded-none",
                handler: async () => {
                    const isOk = await this.ShowConfirm({ title: "DELETE REPORT", message: "通報を取り消しますか？" });
                    if (!isOk) return;
                    const isDelSuccess = await $Data.Access.DeleteMyReport({ archive_id: archive.archive_id });
                    if (!isDelSuccess) return;
                    $App.AppData.Owner.myReport = null; // メモリ上からも削除
                    $Notice.Info("通報を取り消しました。");
                    _DialogCore.close();
                }
            }]);
        }
        _DialogCore.open({
            theme: "black", // これを指定することで全体が黒ベース・角丸なしになる
            title: myReport ? "EDIT REPORT" : "REPORT SUBMIT",
            content: el,
            help: "",
            buttons: dialogButtons // そのまま配列を渡す
        });
    },
    // URL公開画面
    ShowShareArchive(archive, profile) {
        const el = $Dom.GenerateTemplate('tpl-share-archive');
        // 1. タイトルの反映
        $Dom.QuerySelector('#share-archive-title', el).textContent = archive.title || "No Title";
        // 2. URLの生成 (現在のドメイン + パラメータ)
        const baseUrl = window.location.origin + window.location.pathname;
        const encodedId = $Util.EncodeId(archive.archive_id);
        const shareUrl = `${baseUrl}?mode=archive_pub&encodedId=${encodedId}`;
        // 3. QRコードの生成 (無料APIを利用)
        const qrImg = $Dom.QuerySelector('#share-qr-image', el);
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
        // 4. コピー処理 (ボタンをクリックでコピー)
        $Dom.QuerySelector('#btn-share-copy', el).onclick = () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                $Notice.Info("URL copied to clipboard!");
            }).catch(err => {
                $Notice.Error("コピーに失敗しました");
            });
        };
        _DialogCore.open({
            title: "SHARE ARCHIVE",
            content: el,
            help: "",
            buttons: [] // CLOSEボタンは右上の✖で代用し、下部はコピーボタンのみにする
        });
    },
    // 【管理者機能】通報詳細
    async ShowAdminReportDetail(summaryItem) {
        // 詳細データをAPI取得
        const isSuccess = await $Data.Access.GetReportDetails({
            target_user_id: summaryItem.target_user_id,
            archive_id: summaryItem.archive_id
        });
        if (!isSuccess) return;
        const reports = $App.AppData.Admin.reports || [];
        const el = $Dom.GenerateTemplate("tpl-admin-report-detail");
        // データの反映
        $Dom.QuerySelector(".js-target-user", el).textContent = summaryItem.target_user_id;
        $Dom.QuerySelector(".js-archive-title", el).textContent = summaryItem.archive_title || "Unknown Title";
        const listContainer = $Dom.QuerySelector("#admin-report-detail-list", el);
        if (reports.length === 0) {
            listContainer.innerHTML = `<div class="text-[0.7rem] text-slate-400 p-2">詳細データがありません</div>`;
        } else {
            reports.sort((a, b) => new Date(b.report_tim) - new Date(a.report_tim)).forEach(rep => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-item");
                $Dom.QuerySelector(".js-report-tim", child).textContent = $Util.FormatDate(rep.report_tim, 'YYYY-MM-DD　HH:mm');
                $Dom.QuerySelector(".js-report-body", child).textContent = rep.body || "（内容なし）";
                // クリックで全文詳細を開く
                child.classList.add("cursor-pointer", "active:bg-slate-50");
                child.onclick = () => this.ShowAdminReportItemDetail(rep);
                listContainer.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "REPORT DETAILS",
            content: el,
            help: "",
            // ボタン設定を修正：BACKを消し、OPENボタンを下段に配置
            buttons: [
                {
                    label: "🔗 OPEN PUBLIC ARCHIVE",
                    className: "bg-red-500 text-white shadow-md",
                    handler: async () => {
                        const isOk = await this.ShowConfirm({ title: "OPEN ARCHIVE", message: "この Public まとめデータを開きますか？" });
                        if (!isOk) return;
                        _DialogCore.closeAll();
                        $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
                        $App.AppData.Context.TargetArchiveId = summaryItem.archive_id;
                        await $App.RefreshScreen();
                    }
                }
            ]
        });
    },
    // 【管理者機能】フィードバックリスト（無限スクロール）
    async ShowAdminFeedbackList() {
        let skip = 0;
        const take = 20;
        // ★ 実行時に即データアクセスし、エラーの場合は開かずに終了
        const isSuccess = await $Data.Access.GetAllFeedback({ skip, take });
        if (!isSuccess) return;
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        let isLoading = false;
        let hasMore = true;
        const renderItems = (items) => {
            items.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-feedback");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.create_tim || new Date(), 'YYYY-MM-DD　HH:mm');
                const score = item.score || 0;
                $Dom.QuerySelector(".js-score", child).textContent = "★".repeat(score) + "☆".repeat(5 - score);
                $Dom.QuerySelector(".js-body", child).textContent = item.body || "（内容なし）";
                child.onclick = () => this.ShowAdminFeedbackDetail(item);
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
            root.innerHTML = `<div class="text-center text-[0.7rem] font-bold text-slate-400 py-6">フィードバックはありません</div>`;
        }
        // ダイアログを開く
        _DialogCore.open({
            title: "FEEDBACK Mgmt",
            content: root,
            help: "",
            buttons:[]
        });
    },
    // 【管理者機能】フィードバック詳細
    ShowAdminFeedbackDetail(item) {
        const el = $Dom.GenerateTemplate("tpl-admin-feedback-detail");
        $Dom.QuerySelector(".js-date", el).textContent = $Util.FormatDate(item.create_tim || new Date(), 'YYYY-MM-DD　HH:mm');
        const score = item.score || 0;
        $Dom.QuerySelector(".js-score", el).textContent = "★".repeat(score) + "☆".repeat(5 - score);
        $Dom.QuerySelector(".js-body", el).textContent = item.body || "（内容なし）";
        _DialogCore.open({
            title: "FEEDBACK DETAILS",
            content: el,
            headerButtons: [
                {
                    label: "✉️", // 送信アイコン
                    id: "btn-admin-reply-user",
                    handler: () => {
                        // このユーザーに対して送信画面を開く
                        this.ShowAdminSendUserNotification(item.user_id, `フィードバックありがとうございます！\n`);
                    }
                }
            ],
            help: "",
            buttons: []
        });
    },
    // 【管理者機能】ユーザー個別通知送信ダイアログ
    ShowAdminSendUserNotification(targetUserId, defaultText = "") {
        if (!targetUserId) return $Notice.Warn("ユーザーIDが不明です");
        const el = $Dom.GenerateTemplate("tpl-admin-send-user-notification");
        const previewEmoji = $Dom.QuerySelector('#admin-send-emoji-preview', el);
        const inputEmoji = $Dom.QuerySelector('#admin-send-emoji-val', el);
        const displayUserId = $Dom.QuerySelector('#admin-send-target-id', el);
        const inputBody = $Dom.QuerySelector('#admin-send-body', el);
        const countBody = $Dom.QuerySelector('#admin-send-body-count', el);
        // 初期値セット
        displayUserId.textContent = targetUserId;
        inputBody.value = defaultText;
        countBody.textContent = inputBody.value.length;
        // イベントリスナー
        inputBody.addEventListener('input', () => countBody.textContent = inputBody.value.length);
        $Dom.QuerySelector('#btn-admin-send-emoji-trigger', el).onclick = () => {
            $Util.ShowEmojiPicker((emoji) => {
                previewEmoji.textContent = emoji;
                inputEmoji.value = emoji;
            });
        };
        _DialogCore.open({
            title: "SEND NOTIFICATION",
            content: el,
            help: "特定のユーザーに対して、個別の通知（DM）を送信します。",
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-md",
                        handler: () => {
                            _DialogCore.close();
                        },
                    },
                    {
                        label: "SEND MESSAGE",
                        className: "",
                        handler: async () => {
                            const body = inputBody.value.trim();
                            if (!body) return $Notice.Warn("本文を入力してください");
                            const isSuccess = await $Data.Access.SendUserNotification({
                                target_user_id: targetUserId,
                                emoji: inputEmoji.value,
                                body: body
                            });
                            if (isSuccess) {
                                $Notice.Info("通知を送信しました。");
                                _DialogCore.close(); // 送信画面を閉じる
                            }
                        }
                    }
                ]
            ]
        });
    },
    // 【管理者機能】通報1件の全文詳細を表示
    ShowAdminReportItemDetail(rep) {
        const el = $Dom.GenerateTemplate("tpl-admin-report-item-detail");
        $Dom.QuerySelector(".js-report-tim", el).textContent = $Util.FormatDate(rep.report_tim, "YYYY-MM-DD　HH:mm");
        $Dom.QuerySelector(".js-reporter-id", el).textContent = rep.reporter_user_id;
        $Dom.QuerySelector(".js-report-body", el).textContent = rep.body || "（内容なし）";
        _DialogCore.open({
            title: "REPORT CONTENT",
            content: el,
            buttons: []
        });
    },
    // 【管理者機能】ユーザーメール一覧
    async ShowAdminUserMailList() {
        const isSuccess = await $Data.Access.AdminGetAllUserNotifications({ limit: 100 });
        if (!isSuccess) return;
        const mails = $App.AppData.Admin.userMailList  || []; // API側で notifications に格納される想定
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        if (mails.length === 0) {
            root.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-400 py-6">送信済みメッセージはありません</div>`;
        } else {
            mails.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-user-mail");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.send_tim, 'YYYY-MM-DD　HH:mm');
                $Dom.QuerySelector(".js-target-icon", child).textContent = item.icon || "👤";
                $Dom.QuerySelector(".js-target-user", child).textContent = item.nick_name || item.user_id.slice(0,8);
                $Dom.QuerySelector(".js-emoji", child).textContent = item.emoji || "✉️";
                const lines = (item.body || "").split('\n');
                $Dom.QuerySelector(".js-title", child).textContent = lines[0] || "No Subject";
                $Dom.QuerySelector(".js-body", child).textContent = item.body;
                child.onclick = () => this.ShowAdminUserMailDetail(item);
                root.appendChild(child);
            });
        }
        _DialogCore.open({
            title: "USER MESSAGE LOG",
            content: root
        });
    },
    // 【管理者機能】ユーザーメール詳細
    ShowAdminUserMailDetail(item) {
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        const lines = (item.body || "").split('\n');
        // 詳細画面のヘッダーに宛先ユーザー名を表示
        const titleArea = $Dom.QuerySelector('#view-notice-title', el);
        titleArea.innerHTML = `
            <div class="text-[0.6rem] text-slate-400 uppercase tracking-widest mb-1">To: ${item.icon} ${item.nick_name}</div>
            <div>${lines[0] || "No Subject"}</div>
        `;
        $Dom.QuerySelector('#view-notice-icon', el).textContent = item.emoji || "✉️";
        $Dom.QuerySelector('#view-notice-title', el).textContent = lines[0] || "No Subject";
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        $Dom.QuerySelector('#view-notice-body', el).textContent = item.body;
        _DialogCore.open({
            title: "MESSAGE DETAILS (ADMIN)",
            content: el,
            headerButtons: []
        });
    },
};
// 初期処理
_DialogCore.init();
// Public
export default DialogController;