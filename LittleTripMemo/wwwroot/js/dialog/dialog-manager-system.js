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
            // Init()で全初期化するのではなく、現在の画面モードを維持して再描画する
            // await $App.RefreshScreen();
            await $App.Init();
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
            reports: $Dom.QuerySelector('#btn-sys-my-report', el),
            auth:    $Dom.QuerySelector('#btn-sys-auth', el),
            admin:   $Dom.QuerySelector('#btn-sys-admin', el),
        };
        // // ログイン中であれば、プロフィールのアイコンを反映する
        // if (isLoggedIn) {
        //     const profile = $App.AppData.Owner.SystemInfo.ownerProfile;
        //     if (profile && profile.icon) {
        //         // ボタン内の最初のspan（アイコン表示用）を取得して書き換え
        //         const iconSpan = $Dom.QuerySelector('span:first-child', b.profile);
        //         iconSpan.textContent = profile.icon;
        //     }
        // }
        // 2. まとめて表示設定（ログイン・権限状態で絞り込み）
        $Dom.ToggleShow(b.profile, isLoggedIn);
        $Dom.ToggleShow(b.notice,  isLoggedIn);
        $Dom.ToggleShow(b.version, isLoggedIn);
        $Dom.ToggleShow(b.reports, isLoggedIn);
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
            this.ShowUserProfile($App.AppData.Owner.SystemInfo.ownerProfile, true)
        };
        b.config.onclick = () => {this.ShowUserSettingsMenu()};
        b.notice.onclick = () => {this.ShowNoticeList()};
        b.version.onclick = () => {this.ShowAppInfo()};
        b.reports.onclick = async () => {this.ShowMyReportList();};
        b.auth.onclick = async () => {
            if (isLoggedIn) {
                if (await this.ShowConfirm({ title: "LOGOUT", message: "ログアウトしますか？" })) {
                    this._core.closeAll();
                    // AppManagerのログアウトを呼ぶ
                    $App.Logout();
                    setTimeout(() => location.reload(), 500);
                }
            } else {
                this.ShowLoginDialog();
            }
        };
        b.admin.onclick = async () => {
            // メニューを開く前に一括取得を実行
            const isSuccess = await $Data.Access.GetAdminAllInfo();
            if (isSuccess) {
                this.ShowAdminMenu();
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
        $Dom.QuerySelector('#btn-set-currency', el).onclick = () => this.ShowCurrencyConfig();
        $Dom.QuerySelector('#btn-set-gps', el).onclick = () => this.ShowGpsFollowConfig();
        $Dom.QuerySelector('#btn-set-font', el).onclick = () => this.ShowFontSizeConfig();
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
                        $Notice.Info("保存しました。");
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
            title: "GPS TRACKING",
            content: el,
            help: "GPSの更新間隔を設定します。0sにすると停止します。",
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
                    <span class="js-check text-brand-5 font-black text-[1.2rem]">${current === opt.key ? '●' : '○'}</span>
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
            title: "FONT SIZE CONFIG",
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
            const pL1   = profile.link1 || "";
            const pL2   = profile.link2 || "";
            const pL3   = profile.link3 || "";
            $Dom.QuerySelector('#view-profile-icon', el).textContent = pIcon;
            $Dom.QuerySelector('#view-profile-nickname', el).textContent = pName;
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
        const isAdmin = $App.AppData.Owner.plan === "Admin"; // 管理者判定
        if (isOwner) {
            // 【自分のプロフ】受信箱ボタン ＋ 編集ボタン
            headerButtons.push({
                label: "📥",
                id: "btn-header-mail",
                handler: () => this.ShowUserMailList()
            });
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
        editNickname.value = profile.nick_name || "";
        editNicknameCount.textContent = (profile.nick_name || "").length;
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
                                nick_name: editNickname.value.trim(),
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
            $Dom.QuerySelector(".js-target", child).textContent = `${item.target_icon} ${item.target_nick_name}`;
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            // ステータスバッジの表示
            if (item.is_deleted) {
                $Dom.ToggleShow($Dom.QuerySelector(".js-badge-deleted", child), true);
            } else {
                if (item.is_closed)  $Dom.ToggleShow($Dom.QuerySelector(".js-badge-closed", child), true);
            }
            child.onclick = () => this.ShowMyReportDetail(item);
            root.appendChild(child);
        });
        this._core.open({ title: "MY REPORTS", content: root });
    },
    // 通報詳細表示
    ShowMyReportDetail(report) {
        const el = $Dom.GenerateTemplate("tpl-my-report-detail");
        // --- 1. アーカイブタイトルの表示制御 ---
        const titleEl = $Dom.QuerySelector("#view-report-archive-title", el);
        if (report.is_deleted) {
            titleEl.textContent = "このまとめは既に削除されています";
            titleEl.classList.add("text-slate-400"); // 無効な感じの色
        } else if (report.is_closed) {
            titleEl.textContent = "このまとめは現在「CLOSE」中です";
            titleEl.classList.add("text-red-400");   // 警告・停止中の色
        } else {
            titleEl.textContent = report.archive_title || "(No Title)";
            titleEl.classList.add("text-brand-5");   // 通常のブランドカラー
        }
        // 基本反映
        $Dom.QuerySelector(".js-report-tim", el).textContent = $Util.FormatDate(report.report_tim);
        $Dom.QuerySelector("#view-report-body", el).textContent = report.body;
        // $Dom.QuerySelector("#view-report-archive-title", el).textContent = report.archive_title || "(No Title)";
        // ターゲットユーザーボタン
        const userIcon = $Dom.QuerySelector("#view-report-target-icon", el);
        const userName = $Dom.QuerySelector("#view-report-target-name", el);
        userIcon.textContent = report.target_icon || "👤";
        userName.textContent = report.target_nick_name || "Unknown";
        $Dom.QuerySelector("#btn-report-target-profile", el).onclick = async () => {
            const isSuccess = await $Data.Access.GetUserProfile({ userId: report.target_user_id });
            if (isSuccess) this.ShowUserProfile($Data.resData, false);
        };
        // アーカイブジャンプボタン
        const btnJump = $Dom.QuerySelector("#btn-report-jump-archive", el);
        if (report.is_deleted || report.is_closed) {
            btnJump.classList.add("grayscale");
        } else {
            btnJump.onclick = async () => {
                const isOk = await this.ShowConfirm({ title: "JUMP", message: "このアーカイブに移動しますか？" });
                if (!isOk) return;
                this._core.closeAll();
                $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
                $App.AppData.Context.TargetArchiveId = report.archive_id;
                await $App.RefreshScreen();
            };
        }
        this._core.open({ title: "REPORT DETAIL", content: el });
    },
};