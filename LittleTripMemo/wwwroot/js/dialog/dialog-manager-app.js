export default {
    // 【🗺️ データメニュー】
    ShowDataMenu() {
        const isLoggedIn = $App.AppData.Context.IsLoggedIn;
        if (!isLoggedIn) return this.ShowLoginDialog();
        const el = $Dom.GenerateTemplate('tpl-menu-data');
        const b = {
            archiveList: $Dom.QuerySelector('#btn-app-archive-list', el),
            archiveInfo: $Dom.QuerySelector('#btn-app-info', el),
            pointList:   $Dom.QuerySelector('#btn-app-point-list', el),
            batch:       $Dom.QuerySelector('#btn-app-batch', el),
            search:      $Dom.QuerySelector('#btn-app-search', el),
            pointSearch: $Dom.QuerySelector('#btn-app-point-search', el),
            create:      $Dom.QuerySelector('#btn-app-create', el),
        };
        const mode = $App.AppData.Context.ScreenMode;
        const isArchive = (mode === $Const.SCREEN_MODE.ARCHIVE || mode === $Const.SCREEN_MODE.ARCHIVE_PUB);
        $Dom.ToggleShow(b.archiveInfo, isArchive);
        $Dom.ToggleShow(b.search, isLoggedIn && mode !== $Const.SCREEN_MODE.SEARCH);
        $Dom.ToggleShow(b.pointSearch, mode === $Const.SCREEN_MODE.SEARCH);
        $Dom.ToggleShow(b.create, isLoggedIn && mode !== $Const.SCREEN_MODE.CREATE);
        b.archiveList.onclick = () => this.ShowArchiveList();
        b.archiveInfo.onclick = () => this.ShowArchiveInfo();
        b.pointList.onclick = () => (mode === $Const.SCREEN_MODE.SEARCH) ? this.ShowDetailsSearchResult() : this.ShowDetailsTimeLine();
        b.batch.onclick = () => this.ShowMultiSelectTimeline();
        b.search.onclick = () => { this._core.close(); $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.SEARCH; $App.RefreshScreen(); };
        b.pointSearch.onclick = () => this.PointSearchGoogle((p) => $Map.MoveMap(p.lat, p.lng, 18));
        b.create.onclick = () => { this._core.close(); $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE; $App.RefreshScreen(); };
        this._core.open({ title: "DATA MENU", content: el });
    },
    // 【� アクションメニュー】
    ShowActionMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-action');
        const isLoggedIn = $App.AppData.Context.IsLoggedIn;
        const b = {
            reload:   $Dom.QuerySelector('#btn-app-reload', el),
            refresh:  $Dom.QuerySelector('#btn-app-refresh', el),
            current:  $Dom.QuerySelector('#btn-app-current', el),
            restore:  $Dom.QuerySelector('#btn-app-restore', el),
        };
        const mode = $App.AppData.Context.ScreenMode;
        b.reload.onclick = () => { this._core.close(); $Util.ReloadApp(); };
        b.refresh.onclick = () => { this._core.close(); $App.RefreshScreen(); };
        b.current.onclick = () => { this._core.close(); $Marker.RefreshCurrentLocation(); $Marker.FocusToLocationMarker(1000); };
        b.restore.onclick = () => { this._core.close(); $Marker.RestoreMarkers(); };
        this._core.open({ title: "ACTIONS", content: el });
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
                this._core.close();
            },
            locale: 'ja',            // 日本語化
            previewPosition: 'none', // 下部のプレビューエリアを隠す
            skinTonePosition: 'none', // スキントーン選択を隠す
        });
        picker.style.setProperty('--emoji-size', '2rem');
        // コンテナにピッカーを注入
        container.appendChild(picker);
        // ダイアログを表示
        this._core.open({
            title: "SELECT ICON",
            content: el,
            help: "",
            buttons: []
        });
    },
    // 座標・住所指定で移動する
    PointSearchGoogle(onOk) {
        const el = $Dom.GenerateTemplate('tpl-point-search-google');
        this._core.open({
            title: "地点・住所検索",
            content: el,
            help: "",
            buttons: [
                {
                    label: "GO！",
                    handler: $Warn.CatchAsync(async () => {
                        // IDを指定して入力要素を取得し、前後の空白を除去した値を取得
                        const val = $Dom.QuerySelector("#inputPointValue", el).value.trim();
                        if (!val) { $Notice.Warn("ワードが入力されていません。"); return; }
                        let pos = $Util.ParseLatLng(val);
                        if (!pos) {
                            pos = await $Util.SearchAddressByWord(val);
                        }
                        if (pos && onOk) {
                            this._core.closeAll(); // 見つかった時だけ手動で閉じる
                            onOk(pos);
                        } else {
                            $Notice.Warn("見つかりませんでした。");
                        }
                    })
                }
            ]
        });
    },
    // 環境コード選択ダイアログ
    ShowAtmospherePicker_2(currentCode, onOk) {
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
        this._core.open({
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
                            this._core.close();
                        },
                    },
                    {
                        label: "OK",
                        handler: () => {
                            const finalCode = txtCode.textContent;
                            if (onOk) onOk(finalCode);
                            this._core.close();
                        }
                    }
                ]
            ]
        });
    },
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
        // エフェクト更新処理
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
        // ＋ーボタンのイベント登録ヘルパー
        const bindStepper = (minusId, plusId, slider) => {
            $Dom.QuerySelector(minusId, el).onclick = () => {
                slider.value = Math.max(0, parseInt(slider.value) - 1);
                applyEffect();
            };
            $Dom.QuerySelector(plusId, el).onclick = () => {
                slider.value = Math.min(9, parseInt(slider.value) + 1);
                applyEffect();
            };
        };
        // 各ボタンへのバインド
        bindStepper('#btn-wind-minus', '#btn-wind-plus', rngWind);
        bindStepper('#btn-density-minus', '#btn-density-plus', rngDensity);
        bindStepper('#btn-dark-minus', '#btn-dark-plus', rngDarkness);
        // スライダー直接操作時のイベント
        rngWind.addEventListener('input', applyEffect);
        rngDensity.addEventListener('input', applyEffect);
        rngDarkness.addEventListener('input', applyEffect);
        // 天候ボタンのクリックイベント
        weatherBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const clickedVal = btn.dataset.val;
                weatherBtns.forEach(b => {
                    b.classList.remove('bg-brand-5', 'text-white', 'border-brand-5');
                    b.classList.add('bg-white', 'text-brand-5', 'border-brand-2');
                });
                if (clickedVal === "0") {
                    // Clear時はリセット
                    rngWind.value = 0; rngDensity.value = 0; rngDarkness.value = 0;
                    currentW = "0";
                } else {
                    btn.classList.remove('bg-white', 'text-brand-5', 'border-brand-2');
                    btn.classList.add('bg-brand-5', 'text-white', 'border-brand-5');
                    currentW = clickedVal;
                    if (parseInt(rngDensity.value) === 0) rngDensity.value = 1;
                }
                applyEffect();
            });
        });
        // 初期描画
        applyEffect();
        // 天候ボタンの初期選択状態を反映
        weatherBtns.forEach(b => {
            if (b.dataset.val === currentW && currentW !== "0") {
                b.classList.remove('bg-white', 'text-brand-5', 'border-brand-2');
                b.classList.add('bg-brand-5', 'text-white', 'border-brand-5');
            }
        });
        this._core.open({
            title: "ATMOSPHERE SETTING",
            content: el,
            onClose: () => {
                if (typeof Atmosphere !== 'undefined') {
                    Atmosphere.hide();
                    if (Atmosphere.canvas) Atmosphere.canvas.style.zIndex = '0';
                }
            },
            buttons: [[
                { label: "CANCEL", className: "bg-slate-400 text-white shadow-md", handler: () => this._core.close() },
                { label: "OK", handler: () => { if (onOk) onOk(txtCode.textContent); this._core.close(); } }
            ]]
        });
    },
};