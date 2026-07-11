export default {
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
            this._core.closeAll();
            // Init()で全初期化するのではなく、現在の画面モードを維持して再描画する
            await $App.Init();
        });
        this._core.open({
            title: "ログイン",
            content: el,
            help: "aaaa",
        });
    },
    // 【⚙️ システムメニュー】
    ShowSystemMenu() {
        if (!$App.AppData.Context.IsLoggedIn) return this.ShowLoginDialog();
        const el = $Dom.GenerateTemplate('tpl-menu-sys');
        const isLoggedIn = $App.AppData.Context.IsLoggedIn;
        const isAdmin = isLoggedIn && $App.AppData.Owner.Plan === "Admin";
        const b = {
            notice:  $Dom.QuerySelector('#btn-sys-notice', el),
            version: $Dom.QuerySelector('#btn-sys-version', el),
            login:    $Dom.QuerySelector('#btn-sys-login', el),
            admin:   $Dom.QuerySelector('#btn-sys-admin', el),
        };
        // 表示制御
        $Dom.ToggleShow(b.admin, isAdmin);
        const loginLabel = $Dom.QuerySelector('span:last-child', b.login);
        loginLabel.textContent = isLoggedIn ? "ログアウトする" : "ログイン／サインインする";
        // 新着バッジ更新
        $UI.Generator.ApplyNewBadge(b.notice, $App.AppData.Context.UnreadNoticeCount, 'label');
        // 各種イベント
        b.notice.onclick = () => this.ShowNoticeList();
        b.version.onclick = () => this.ShowAppInfo();
        b.login.onclick = async () => {
            if (isLoggedIn) {
                if (await this.ShowConfirm({ title: "LOGOUT", message: "ログアウトしますか？" })) {
                    this._core.closeAll();
                    $App.Logout();
                    setTimeout(() => location.reload(), 500);
                }
            } else {
                this.ShowLoginDialog();
            }
        };
        b.admin.onclick = async () => {
            this.ShowAdminMenu();
        };
        this._core.open({ title: "システムメニュー", content: el });
    },
    // 【👤 ユーザーメニュー】
    ShowUserMenu() {
        if (!$App.AppData.Context.IsLoggedIn) return this.ShowLoginDialog();
        const el = $Dom.GenerateTemplate('tpl-menu-user');
        const b = {
            profile: $Dom.QuerySelector('#btn-sys-user-profile', el),
            mail:    $Dom.QuerySelector('#btn-user-mail', el),
            config:  $Dom.QuerySelector('#btn-sys-user-config', el),
            reports: $Dom.QuerySelector('#btn-sys-my-report', el),
        };
        // 新着バッヂ更新
        $UI.Generator.ApplyNewBadge(b.mail, $App.AppData.Context.UnreadMailCount, 'label');
        // 各種イベント
        b.profile.onclick = () => this.ShowUserProfile($App.AppData.Owner.SystemInfo.ownerProfile, true);
        b.mail.onclick    = () => this.ShowUserMailList();
        b.config.onclick  = () => this.ShowUserSettingsMenu();
        b.reports.onclick = () => this.ShowMyReportList();
        this._core.open({ title: "ユーザメニュー", content: el });
    },
    // （ユーザ設定）ユーザー設定メニュー（第2階層）
    ShowUserSettingsMenu() {
        const el = $Dom.GenerateTemplate("tpl-menu-user-settings");
        $Dom.QuerySelector('#btn-set-theme', el).onclick = () => this.ShowThemeConfig();
        $Dom.QuerySelector('#btn-set-map', el).onclick = () => this.ShowMapStyleConfig();
        $Dom.QuerySelector('#btn-set-currency', el).onclick = () => this.ShowCurrencyConfig();
        $Dom.QuerySelector('#btn-set-gps', el).onclick = () => this.ShowGpsFollowConfig();
        $Dom.QuerySelector('#btn-set-font', el).onclick = () => this.ShowFontSizeConfig();
        //
        this._core.open({
            title: "ユーザ設定",
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
            const textColor = i > 2 ? 'text-white' : 'text-slate-600';
            previewItems += `<div class="w-full h-10 bg-brand-${i} border border-brand-2 flex items-center px-4 text-[0.9rem] font-bold ${textColor}">LEVEL ${i} PREVIEW</div>`;
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
        this._core.open({
            title: "テーマカラー",
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
                        this._core.close();
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
                        this._core.close();
                        $Notice.Info("保存しました。");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）マップスタイル設定ダイアログ
    ShowMapStyleConfi_2() {
        let isSaved = false;
        const oldStyle = $App.AppData.Owner.MapStyle;
        let selectedStyle = oldStyle;
        // スタイル一覧をループ生成
        let listHtml = '';
        Object.values($Map.MAP_STYLE).forEach(style => {
            listHtml += `
                <button id="ms-btn-${style.key}" class="w-full h-14 grid grid-cols-10 items-center px-4 border-b border-brand-2 hover:bg-brand-1 active:bg-brand-2 transition-colors text-slate-900">
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
        this._core.open({
            title: "地図スタイル",
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
                        this._core.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        // 選択されたマップスタイルを適用・保存
                        $App.ChangeMapStyle(selectedStyle);
                        this._core.close();
                        $Notice.Info("保存しました。");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）マップスタイル設定ダイアログ
    ShowMapStyleConfig() {
        let isSaved = false;
        const mapEl = document.getElementById('ui-map-id');
        // 現在の状態を保持（キャンセル時の復元用）
        const oldStyle = $App.AppData.Owner.MapStyle;
        const oldGrayscale = !!$App.AppData.Owner.IsMapGrayscale;
        let selectedStyle = oldStyle;
        let currentGrayscale = oldGrayscale;
        const el = document.createElement('div');
        el.className = "w-full flex flex-col bg-brand-0";
        // --- 1. 上部固定：グレースケール設定エリア ---
        const stickyTop = document.createElement('div');
        stickyTop.className = "sticky top-0 z-20 bg-white border-b-2 border-brand-2 p-5 mb-1 shadow-sm";
        stickyTop.innerHTML = `
            <label class="flex items-center gap-4 cursor-pointer group">
                <input type="checkbox" id="cfg-map-gray" class="w-6 h-6 accent-brand-5" ${currentGrayscale ? 'checked' : ''}>
                <span class="text-[1rem] font-bold text-slate-700 group-active:scale-95 transition-transform">
                    グレースケールにする
                </span>
            </label>
        `;
        el.appendChild(stickyTop);
        // --- 2. 地図スタイル選択リスト ---
        const listContainer = document.createElement('div');
        listContainer.className = "flex flex-col";
        // プレビュー反映（地図の見た目のみを一時的に変える）
        const applyPreview = () => {
            $Map.SetMapStyle(selectedStyle);
            if (mapEl) mapEl.classList.toggle('map-grayscale', currentGrayscale);
            // リストのラジオボタン風表示を更新
            $Dom.QuerySelectorAll('.js-ms-check', listContainer).forEach(span => {
                const key = span.dataset.key;
                span.textContent = (key === selectedStyle.key) ? '●' : '○';
                span.className = (key === selectedStyle.key) 
                    ? "js-ms-check col-span-1 flex justify-center text-[1.2rem] text-brand-5 font-bold" 
                    : "js-ms-check col-span-1 flex justify-center text-[1.2rem] text-slate-400";
            });
        };
        Object.values($Map.MAP_STYLE).forEach(style => {
            const btn = document.createElement('button');
            btn.className = "w-full h-16 grid grid-cols-10 items-center px-4 border-b border-brand-2 hover:bg-brand-1 active:bg-brand-2 transition-colors text-slate-900";
            btn.innerHTML = `
                <span class="js-ms-check col-span-1 flex justify-center text-[1.2rem]" data-key="${style.key}"></span>
                <span class="col-span-1"></span>
                <span class="col-span-8 text-left font-bold text-[1rem] uppercase">${style.name}</span>
            `;
            btn.onclick = () => {
                selectedStyle = style;
                applyPreview();
            };
            listContainer.appendChild(btn);
        });
        el.appendChild(listContainer);
        // チェックボックスのイベント
        $Dom.QuerySelector('#cfg-map-gray', el).onchange = (e) => {
            currentGrayscale = e.target.checked;
            applyPreview();
        };
        // 初期表示の反映
        applyPreview();
        this._core.open({
            title: "地図スタイル",
            content: el,
            help: "地図の種類と、色味の有無を設定できます。\n航空写真をグレースケールにすると視認性が高まります。",
            onClose: () => {
                if (isSaved) return;
                // キャンセル時は元の状態に物理的に戻す
                $Map.SetMapStyle(oldStyle);
                if (mapEl) mapEl.classList.toggle('map-grayscale', oldGrayscale);
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => this._core.close()
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        // AppDataを更新して保存
                        $App.ChangeMapStyle(selectedStyle, currentGrayscale); 
                        this._core.close();
                        $Notice.Info("保存しました。");
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
        const oldUnit = $App.AppData.Owner.Currency_unit || 'JPY';
        inputCurrency.value = oldUnit;
        this._core.open({
            title: "金額の単位",
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
                        this._core.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        const val = inputCurrency.value.trim();
                        // 空の場合は JPY をデフォルトとする
                        $App.ChangeCurrency(val || 'JPY');
                        this._core.close();
                        $Notice.Info("保存しました。");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）GPS追従設定
    ShowGpsFollowConfig() {
        let isSaved = false;
        const oldSec = $App.AppData.Owner.GpsTrackingSec || 0; // 現在の値を保持
        let tempSec = oldSec; // 操作用の一時変数
        const el = $Dom.GenerateTemplate("tpl-config-gps");
        const slider = $Dom.QuerySelector('#gps-range-slider', el);
        const display = $Dom.QuerySelector('#gps-val-display', el);
        const unit = $Dom.QuerySelector('#gps-unit-display', el);
        // 初期表示の設定
        slider.value = oldSec;
        display.textContent = oldSec === 0 ? "OFF" : oldSec;
        $Dom.ToggleShow(unit, oldSec !== 0);
        // スライダー操作：画面表示だけをリアルタイム更新（Appマネージャにはまだ書かない）
        slider.oninput = (e) => {
            tempSec = parseInt(e.target.value);
            display.textContent = tempSec === 0 ? "OFF" : tempSec;
            $Dom.ToggleShow(unit, tempSec !== 0);
        };
        this._core.open({
            title: "GPS追従の間隔",
            content: el,
            help: "GPSの更新間隔を設定します。\n0sにすると停止します。\n更新間隔が短いほど、バッテリーの消費が早くなります。",
            onClose: () => {
                // 保存せずに閉じた場合は何もしない（値は oldSec のまま維持される）
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => this._core.close()
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        $App.ChangeGpsTracking(tempSec); // OK時のみ確定して保存
                        this._core.close();
                        $Notice.Info("保存しました。");
                    }
                }
            ]]
        });
    },
    // （ユーザ設定）フォントサイズ設定
    ShowFontSizeConfig() {
        let isSaved = false;
        const oldSize = $App.AppData.Owner.FontSize || 'standard';
        let selectedSize = oldSize;
        const el = document.createElement('div');
        el.className = "w-full bg-brand-0";
        const options = [
            { key: 'small',    label: 'SMALL' },
            { key: 'standard', label: 'STANDARD' },
            { key: 'large',    label: 'LARGE' }
        ];
        // リスト描画（現在の設定に基づきラジオボタン風に表示）
        const renderList = (current) => {
            el.innerHTML = options.map(opt => `
                <button data-key="${opt.key}" class="js-font-btn w-full h-14 flex items-center justify-between px-6 border-b border-brand-2 active:bg-brand-1">
                    <span class="font-bold text-[1rem]">${opt.label}</span>
                    <span class="js-check text-brand-5 font-bold text-[1.2rem]">${current === opt.key ? '●' : '○'}</span>
                </button>
            `).join('');
            // ボタンクリックで「一時適用」
            $Dom.QuerySelectorAll('.js-font-btn', el).forEach(btn => {
                btn.onclick = () => {
                    selectedSize = btn.dataset.key;
                    $UI.ChangeFontSize(selectedSize); // UIだけ一時的に変える
                    renderList(selectedSize); // チェックマークの表示を更新
                };
            });
        };
        renderList(selectedSize);
        this._core.open({
            title: "フォントサイズ",
            content: el,
            help: "アプリ全体の文字サイズを調整します。\nデバイスごとの適切なサイズ差は維持されます。",
            onClose: () => {
                if (isSaved) return;
                $UI.ChangeFontSize(oldSize); // 保存されずに閉じたら元に戻す
            },
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => this._core.close(),
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        $App.ChangeFontSize(selectedSize); // ここで初めてAppData更新・保存
                        this._core.close();
                        $Notice.Info("保存しました。");
                    }
                }
            ]]
        });
    },
    // プロフィール参照
    async ShowUserProfile(profile, isOwner) {
        if (isOwner) profile = $App.AppData.Owner.SystemInfo.ownerProfile;
        if (!profile) return $Notice.Warn("ユーザー情報がありません");
        const el = $Dom.GenerateTemplate('tpl-view-profile');
        const renderView = () => {
            const pIcon = profile.icon || "👤";
            const pName = profile.nick_name || "No Name";
            const pDesc  = profile.description || "";
            const pL1   = profile.link_1 || "";
            const pL2   = profile.link_2 || "";
            const pL3   = profile.link_3 || "";
            // 新規項目
            const pMemberNo = profile.member_no || "---";
            const pCategory = profile.user_category || "通りすがり";
            const pRank = profile.user_rank || 0;
            $Dom.QuerySelector('#view-profile-icon', el).textContent = pIcon;
            $Dom.QuerySelector('#view-profile-nickname', el).textContent = pName;
            $Dom.QuerySelector('#view-profile-description', el).textContent = pDesc;
            $Dom.QuerySelector('#view-profile-member-no', el).textContent = pMemberNo;
            $Dom.QuerySelector('#view-profile-category', el).textContent = pCategory;
            $Dom.QuerySelector('#view-profile-rank', el).textContent = pRank;
            const viewLinks = $Dom.QuerySelector('#view-profile-links', el);
            // 【重要】追加前に既存のボタンをすべて削除してリセットする
            viewLinks.innerHTML = '';
            // 項目名と値のペアで定義し、入力があるもののみループ
            [
                { val: pL1, key: "link_1" },
                { val: pL2, key: "link_2" },
                { val: pL3, key: "link_3" }
            ].forEach(item => {
                if (!item.val || item.val.trim() === "") return;
                // サーバー送信用パラメータ (AddClickReq 形式)
                const params = {
                    target_type: 1, // ClickTargetType.User
                    target_user_id: profile.user_id,
                    item_name: item.key
                };
                // ジェネレータでボタンを生成（第3引数は ShowUserProfile の引数 isOwner を使用）
                $UI.Generator.LinkButton(viewLinks, item.val, params, isOwner);
            });
        };
        renderView();
		const headerButtons = [];
        const isAdmin = $App.AppData.Owner.Plan === "Admin"; // 管理者判定
        if (isOwner || isAdmin) {
            // 統計アイコン
            headerButtons.push({
                label: "📊",
                handler: () => this.ShowUserClickStats(profile)
            });
        }
        if (isOwner) {
            headerButtons.push({
                label: "✏️",
                handler: () => this.ShowEditProfile(profile, renderView)
            });
        } else if (isAdmin) {
            // 【自分が管理者 且つ 他人のプロフ】メッセージ送信（返信）ボタンを表示
            headerButtons.push({
                label: "✉️",
                handler: () => this.ShowAdminSendUserNotification(profile)
            });
        }
        //
		this._core.open({
			title: "ユーザ情報",
			content: el,
            help: "",
			headerButtons: headerButtons
		});
    },
    // プロフィール編集（上にスタックされる）
    ShowEditProfile(profile, onUpdate) {
        const el = $Dom.GenerateTemplate('tpl-edit-profile');
        const editIconPreview = $Dom.QuerySelector('#edit-profile-icon-preview', el);
        const editIconInput = $Dom.QuerySelector('#edit-profile-icon', el);
        const editNickname = $Dom.QuerySelector('#edit-profile-nickname', el);
        const editNicknameCount = $Dom.QuerySelector('#edit-profile-nickname-count', el);
        // 新規項目：カテゴリ
        const editCategory = $Dom.QuerySelector('#edit-profile-category', el);
        const editCategoryCount = $Dom.QuerySelector('#edit-profile-category-count', el);
        const editDesc = $Dom.QuerySelector('#edit-profile-description', el);
        const editDescCount = $Dom.QuerySelector('#edit-profile-description-count', el);
        const editLink1 = $Dom.QuerySelector('#edit-profile-link1', el);
        const editLink2 = $Dom.QuerySelector('#edit-profile-link2', el);
        const editLink3 = $Dom.QuerySelector('#edit-profile-link3', el);
        editIconPreview.textContent = profile.icon || "👤";
        editIconInput.value = profile.icon || "👤";
        editNickname.value = profile.nick_name || "";
        editNicknameCount.textContent = (profile.nick_name || "").length;
        // カテゴリの初期値設定
        editCategory.value = profile.user_category || "";
        editCategoryCount.textContent = (profile.user_category || "").length;
        editDesc.value = profile.description || "";
        editDescCount.textContent = (profile.description || "").length;
        editLink1.value = profile.link_1 || "";
        editLink2.value = profile.link_2 || "";
        editLink3.value = profile.link_3 || "";
        editDesc.addEventListener('input', () => editDescCount.textContent = editDesc.value.length);
        editNickname.addEventListener('input', () => editNicknameCount.textContent = editNickname.value.length);
        // カテゴリの文字数カウントイベント
        editCategory.addEventListener('input', () => editCategoryCount.textContent = editCategory.value.length);
        // 追記：3つのリンクすべてにクリアイベントを紐付け
        [1, 2, 3].forEach(num => {
            const input = $Dom.QuerySelector(`#edit-profile-link${num}`, el);
            $Dom.QuerySelector(`#btn-edit-profile-link${num}-clear`, el).onclick = () => input.value = "";
        });
        $Dom.QuerySelector('#btn-profile-icon-trigger', el).onclick = () => {
            $Util.ShowEmojiPicker((emoji) => {
                editIconPreview.textContent = emoji;
                editIconInput.value = emoji;
            });
        };
        this._core.open({
            title: "プロフィールの編集",
            content: el,
            help: "",
            isFooterFixed: false,   // 編集用
            buttons: [
                [
                    {
                        label: "CANCEL",
                        className: "bg-slate-400 text-white shadow-md",
                        handler: () => {
                            this._core.close();
                        },
                    },
                    {
                        label: "SAVE",
                        className: "bg-brand-4 text-white shadow-md",
                        handler: $Warn.CatchAsync(async () => {
                            const updatedFields = {
                                nick_name: editNickname.value.trim(),
                                user_category: editCategory.value.trim(), // パラメータ追加
                                icon: editIconInput.value,
                                description: editDesc.value.trim(),
                                link_1: editLink1.value.trim(),
                                link_2: editLink2.value.trim(),
                                link_3: editLink3.value.trim(),
                            };
                            const isSuccess = await $Data.Access.UpdateProfile(updatedFields);
                            if (!isSuccess) return;
                            Object.assign(profile, updatedFields);
                            $Notice.Info("プロフィールを更新しました");
                            this._core.close();
                            if (onUpdate) onUpdate();
                            // 下段バーのアイコンを更新
                            $BotBar.UpdateUserIcon();
                        })
                    }
                ]
            ]
        });
    },
    // 通報履歴リスト表示
    ShowMyReportList() {
        const reports = $App.AppData.Owner.SystemInfo.myReports || [];
        if (reports.length === 0) {
            $Notice.Warn("通報履歴はありません");
            return;
        }
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        // 日時が新しい順にソート
        [...reports].sort((a, b) => new Date(b.report_tim) - new Date(a.report_tim)).forEach(item => {
            const child = $Dom.GenerateTemplate("tpl-list-child-my-report");
            $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.report_tim);
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            // --- ターゲットユーザー表示（Generator: badgeモードを使用） ---
            const targetWrapper = $Dom.QuerySelector(".js-target-wrapper", child);
            $UI.Generator.UserBadge(targetWrapper, {
                nick_name: item.target_nick_name,
                icon: item.target_icon
            }, { type: 'badge' });
            // ステータスバッジの表示
            if (item.is_deleted) {
                $Dom.ToggleShow($Dom.QuerySelector(".js-badge-deleted", child), true);
            } else {
                if (item.is_closed) {
                    $Dom.ToggleShow($Dom.QuerySelector(".js-badge-closed", child), true);
                } else {
                    $Dom.ToggleShow($Dom.QuerySelector(".js-badge-alive", child), true);
                }
            }
            child.onclick = () => this.ShowMyReportDetail(item);
            root.appendChild(child);
        });
        this._core.open({
            title: "通報したまとめ",
            content: root,
            help: "",
        });
    },
    // 通報詳細表示
    ShowMyReportDetail(report) {
        const el = $Dom.GenerateTemplate("tpl-my-report-detail");
        // --- 1. アーカイブタイトルの表示制御 ---
        const titleEl = $Dom.QuerySelector("#view-report-archive-title", el);
        if (report.is_deleted) {
            titleEl.textContent = "既に削除されています";
            titleEl.classList.add("text-slate-600"); // 無効な感じの色
        } else if (report.is_closed) {
            titleEl.textContent = "現在「CLOSE」中です";
            titleEl.classList.add("text-red-400");   // 警告・停止中の色
        } else {
            titleEl.textContent = report.archive_title || "(No Title)";
            titleEl.classList.add("text-brand-5");   // 通常のブランドカラー
        }
        // 基本反映
        $Dom.QuerySelector(".js-report-tim", el).textContent = $Util.FormatDate(report.report_tim);
        $Dom.QuerySelector("#view-report-body", el).textContent = report.body;
        // ターゲットユーザーボタン（Generatorによる注入へ置換）
        const userWrapper = $Dom.QuerySelector("#view-report-target-user-wrapper", el);
        $UI.Generator.UserBadge(userWrapper, {
            user_id: report.target_user_id,
            nick_name: report.target_nick_name,
            icon: report.target_icon
        }, { type: 'button', isOwner: false });
        // アーカイブジャンプボタン
        const btnJump = $Dom.QuerySelector("#btn-report-jump-archive", el);
        if (report.is_deleted || report.is_closed) {
            btnJump.classList.add("grayscale");
        } else {
            btnJump.onclick = async () => {
                const isOk = await this.ShowConfirm({
                    title: "JUMP",
                    help: "",
                    message: "このアーカイブに移動しますか？"
                });
                if (!isOk) return;
                this._core.closeAll();
                $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
                $App.AppData.Context.TargetArchiveId = report.archive_id;
                await $App.RefreshScreen();
            };
        }
        this._core.open({
            title: "通報情報の詳細",
            content: el,
        });
    },
    // クリック集計画面の表示
    async ShowClickStats(profile) {
        if (!profile) return;
        const el = $Dom.GenerateTemplate('tpl-click-stats');
        // ユーザー情報の反映
        $Dom.QuerySelector('.js-user-id', el).textContent = profile.nick_name || "Unknown";
        $Dom.QuerySelector('.js-nickname', el).textContent = profile.nick_name || "No Name";
        const container = $Dom.QuerySelector('.js-links-container', el);
        const stats = profile.click_stats || {};
        // link_1 〜 link_3 までをループ処理
        [1, 2, 3].forEach(num => {
            const linkKey = `link_${num}`;
            const url = profile[linkKey];
            // URLが未設定のものはスキップ
            if (!url || url.trim() === "") return;
            // URLからホスト名（ドメイン）を抽出してタイトルにする
            let domainName = "URL";
            try { domainName = new URL(url).hostname; } catch(e) {}
            // 対象リンクの集計データ（無ければ0をデフォルトに）
            const stat = stats[linkKey] || { t: 0, u: 0, g: 0 };
            const child = $Dom.GenerateTemplate('tpl-click-stats-item');
            $Dom.QuerySelector('.js-link-title', child).textContent = `リンク ${num} (${domainName})`;
            $Dom.QuerySelector('.js-link-url', child).textContent = url;
            $Dom.QuerySelector('.js-total', child).textContent = stat.t || 0;
            $Dom.QuerySelector('.js-unique', child).textContent = stat.u || 0;
            $Dom.QuerySelector('.js-guest', child).textContent = stat.g || 0;
            container.appendChild(child);
        });
        // リンクが1つも無い場合の表示
        if (container.children.length === 0) {
            container.innerHTML = `<div class="text-center text-[0.9rem] font-bold text-slate-600 py-6">設定されているリンクがありません</div>`;
        }
        this._core.open({
            title: "クリック数",
            content: el,
            help: "各リンクがクリックされた回数を集計しています。\nUniqueはクリックした人数、Guestはguestクリック数のクリック数です。",
            buttons: []
        });
    },
    // 【管理者機能】ユーザ解析情報
    ShowUserClickStats_2(profile) {
        const el = $Dom.GenerateTemplate("tpl-user-click-stats");
        // 1. ユーザバッジ & 通報数
        $UI.Generator.UserBadge($Dom.QuerySelector(".js-user-badge-container", el), profile, { type: 'badge' });
        $Dom.QuerySelector(".js-report-count", el).textContent = profile.report_count || 0;
        // 2. 実績解析（Private/Public共通ヘルパー）
        const fillStats = (selector, data) => {
            const target = $Dom.QuerySelector(selector, el);
            target.innerHTML = ""; // クリア
            if (!data) {
                target.innerHTML = `<span class="text-slate-600 italic">No Data</span>`;
                return;
            }
            const child = $Dom.GenerateTemplate("tpl-user-activity-summary");
            $Dom.QuerySelector(".js-archive-count", child).textContent = data.archive_count;
            $Dom.QuerySelector(".js-memo-count", child).textContent = data.detail_count;
            target.appendChild(child);
        };
        fillStats(".js-stats-pvt", profile.info_stats);
        fillStats(".js-stats-pub", profile.info_stats_pub);
        // 3. クリック集計リスト
        const container = $Dom.QuerySelector(".js-click-container", el);
        const links = [
            { id: 'link_1', url: profile.link_1 },
            { id: 'link_2', url: profile.link_2 },
            { id: 'link_3', url: profile.link_3 }
        ];
        links.forEach(link => {
            if (!link.url) return;
            const stats = profile.click_stats?.[link.id] || { t: 0, u: 0, g: 0 };
            const child = $Dom.GenerateTemplate("tpl-user-click-stats-item");
            $Dom.QuerySelector(".js-url", child).textContent = `🔗 ${link.url}`;
            $Dom.QuerySelector(".js-total", child).textContent = stats.t;
            $Dom.QuerySelector(".js-unique", child).textContent = stats.u;
            $Dom.QuerySelector(".js-guest", child).textContent = stats.g;
            container.appendChild(child);
        });
        // ▼ ヘッダーボタンの追加（管理者の場合のみ）
        const headerButtons = [];
        if ($App.AppData.Owner.Plan === "Admin") {
            headerButtons.push({
                label: "🕒",
                handler: () => this.ShowAdminUserHistory(profile) // 行動履歴画面の呼び出し
            });
            headerButtons.push({
                label: "✉️",
                handler: () => this.ShowAdminSendUserNotification(profile) // 個別通知送信画面の呼び出し
            });
        }
        // 強制アクション
        const isAdmin = $App.AppData.Owner.Plan === "Admin";
        if (isAdmin && !profile.is_owner) {
            const banCtrl = $Dom.QuerySelector('#admin-ban-control', el);
            const btnBan = $Dom.QuerySelector('#btn-admin-ban', el);
            const btnUnban = $Dom.QuerySelector('#btn-admin-unban', el);
            $Dom.ToggleShow(banCtrl, true);
            const refreshBanUI = (isBanned) => {
                $Dom.ToggleShow(btnBan, !isBanned);
                $Dom.ToggleShow(btnUnban, isBanned);
            };
            refreshBanUI(!!profile.ban_flg);
            const handleBanUpdate = async (isBanning) => {
                const title = isBanning ? "CONFIRM BAN" : "CONFIRM UNBAN";
                const msg = isBanning 
                    ? "このユーザをBANしますか？\n（本人の投稿が他人に表示されなくなります）" 
                    : "BANを解除しますか？";
                if (!await this.ShowConfirm({ title, message: msg })) return;
                if (!await $Util.CheckAdminAuth()) return; // 管理者PW確認
                const success = await $Data.Access.UpdateUserBanStatus({
                    target_user_id: profile.user_id,
                    is_banned: isBanning
                });
                if (success) {
                    profile.ban_flg = isBanning;
                    $Notice.Info(isBanning ? "ユーザをBANしました" : "BANを解除しました");
                    refreshBanUI(isBanning);
                }
            };
            btnBan.onclick = () => handleBanUpdate(true);
            btnUnban.onclick = () => handleBanUpdate(false);
        }
        // 画面を開く
        const help = [
            "【ユーザの解析情報です】",
            "",
            "",
            "",
            "",
            "",
        ].join('\n');
        this._core.open({
            title: "ユーザ情報解析",
            content: el,
            help: help,
            theme: profile.is_owner ? "user" : "admin", // 閲覧者が本人の場合は通常、管理者の場合はAdminテーマ
            headerButtons: headerButtons
        });
    },
    // 【管理者機能】ユーザ解析情報
    ShowUserClickStats(profile) {
        const el = $Dom.GenerateTemplate("tpl-user-click-stats");
        // --- 1. ユーザバッジ & 通報数（既存通り） ---
        $UI.Generator.UserBadge($Dom.QuerySelector(".js-user-badge-container", el), profile, { type: 'badge' });
        $Dom.QuerySelector(".js-report-count", el).textContent = profile.report_count || 0;
        // --- 2. 実績解析（既存通り） ---
        const fillStats = (selector, data) => {
            const target = $Dom.QuerySelector(selector, el);
            target.innerHTML = "";
            if (!data) {
                target.innerHTML = `<span class="text-slate-600 italic">No Data</span>`;
                return;
            }
            const child = $Dom.GenerateTemplate("tpl-user-activity-summary");
            $Dom.QuerySelector(".js-archive-count", child).textContent = data.archive_count;
            $Dom.QuerySelector(".js-memo-count", child).textContent = data.detail_count;
            target.appendChild(child);
        };
        fillStats(".js-stats-pvt", profile.info_stats);
        fillStats(".js-stats-pub", profile.info_stats_pub);
        // --- 3. クリック集計リスト（既存通り） ---
        const container = $Dom.QuerySelector(".js-click-container", el);
        const links = [
            { id: 'link_1', url: profile.link_1 },
            { id: 'link_2', url: profile.link_2 },
            { id: 'link_3', url: profile.link_3 }
        ];
        links.forEach(link => {
            if (!link.url) return;
            const stats = profile.click_stats?.[link.id] || { t: 0, u: 0, g: 0 };
            const child = $Dom.GenerateTemplate("tpl-user-click-stats-item");
            $Dom.QuerySelector(".js-url", child).textContent = `🔗 ${link.url}`;
            $Dom.QuerySelector(".js-total", child).textContent = stats.t;
            $Dom.QuerySelector(".js-unique", child).textContent = stats.u;
            $Dom.QuerySelector(".js-guest", child).textContent = stats.g;
            container.appendChild(child);
        });
        // --- 4. ヘッダーボタン（既存通り） ---
        const headerButtons = [];
        if ($App.AppData.Owner.Plan === "Admin") {
            headerButtons.push({
                label: "🕒",
                handler: () => this.ShowAdminUserHistory(profile)
            });
            headerButtons.push({
                label: "✉️",
                handler: () => this.ShowAdminSendUserNotification(profile)
            });
        }
        // ★★★ 修正箇所：シャドウBANコントロール ★★★
        const isAdmin = $App.AppData.Owner.Plan === "Admin";
        if (isAdmin && !profile.is_owner) {
            const banCtrl = $Dom.QuerySelector('#admin-ban-control', el);
            const btnBan = $Dom.QuerySelector('#btn-admin-ban', el);
            const btnUnban = $Dom.QuerySelector('#btn-admin-unban', el);
            $Dom.ToggleShow(banCtrl, true);
            // UI更新関数：is_ban の状態を見てボタンを出し分ける
            const refreshBanUI = () => {
                const isBanned = !!profile.is_ban; // プロパティ名を is_ban に修正
                $Dom.ToggleShow(btnBan, !isBanned);   // BANされていないなら「BAN実行」を表示
                $Dom.ToggleShow(btnUnban, isBanned);  // BANされているなら「解除」を表示
            };
            refreshBanUI(); // 初期表示
            const handleBanUpdate = async (isBanning) => {
                const title = isBanning ? "CONFIRM BAN" : "CONFIRM UNBAN";
                const msg = isBanning 
                    ? "このユーザをシャドウBANしますか？\n（本人の投稿が他人に表示されなくなります）" 
                    : "シャドウBANを解除しますか？";
                if (!await this.ShowConfirm({ title, message: msg })) return;
                if (!await $Util.CheckAdminAuth()) return; // 管理者PW確認
                const success = await $Data.Access.UpdateUserBanStatus({
                    target_user_id: profile.user_id,
                    is_banned: isBanning
                });
                if (success) {
                    profile.is_ban = isBanning; // 内部メモリのフラグを更新
                    $Notice.Info(isBanning ? "ユーザをBANしました" : "BANを解除しました");
                    refreshBanUI(); // ボタン表示を切り替え
                }
            };
            btnBan.onclick = () => handleBanUpdate(true);
            btnUnban.onclick = () => handleBanUpdate(false);
        }
        this._core.open({
            title: "ユーザ情報解析",
            content: el,
            help: "管理者のための解析画面です。",
            theme: profile.is_owner ? "user" : "admin",
            headerButtons: headerButtons
        });
    },
};