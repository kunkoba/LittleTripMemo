export default {
    // 以下のメソッドを移動してきてください。
    // - ShowLoginDialog()
    // - ShowSystemMenu()
    // - ShowUserSettingsMenu()
    // - ShowThemeConfig()
    // - ShowMapStyleConfig()
    // - ShowCurrencyConfig()
    // - ShowGpsFollowConfig()
    // - ShowUserProfile()
    // - ShowEditProfile()
    
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
            // ★修正3: Init()で全初期化するのではなく、現在の画面モードを維持して再描画する
            await $App.RefreshScreen();
        });
        this._core.open({
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
            this._core.close();
            this.ShowUserProfile($App.AppData.Owner.systemInfo.ownerProfile, true)
        };
        b.config.onclick = () => {this._core.close(); this.ShowUserSettingsMenu()};
        b.notice.onclick = () => {this._core.close(); this.ShowNoticeList()};
        b.version.onclick = () => {this._core.close(); this.ShowAppInfo()};
        b.admin.onclick = () => {this._core.close(); this.ShowAdminMenu()};
        b.auth.onclick = async () => {
            if (isLoggedIn) {
                if (await this.ShowConfirm({ title: "LOGOUT", message: "ログアウトしますか？" })) {
                    this._core.closeAll();
                    // ★ここを修正：AppManagerのログアウトを呼ぶ
                    $App.Logout();
                    setTimeout(() => location.reload(), 500);
                }
            } else {
                this.ShowLoginDialog();
            }
        };
        this._core.open({
            title: "SYSTEM MENU",
            content: el,
            help: "システムメニュー\nシステムメニュー",
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
        this._core.open({
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
        this._core.open({
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
        this._core.open({
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
        this._core.open({
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
        this._core.open({
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
                        this._core.close();
                    },
                },
                {
                    label: "OK",
                    handler: () => {
                        isSaved = true;
                        console.log("isOn:", isOn);
                        $App.AppData.Owner.IsGpsTracking = isOn;
                        $App.ChangeGpsTracking(isOn);
                        this._core.close();
                        $Notice.Info("Changes saved.");
                    }
                }
            ]]
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
                    this._core.close();
                    this.ShowUserMailList();
                }
            });
			headerButtons.push({
				label: "✏️",
				handler: () => this.ShowEditProfile(profile, renderView)
			});
		}
		this._core.open({
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
        this._core.open({
            title: "EDIT PROFILE",
            content: el,
            help: "",
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
                            this._core.close();
                            if (onUpdate) onUpdate();
                        })
                    }
                ]
            ]
        });
    },
};