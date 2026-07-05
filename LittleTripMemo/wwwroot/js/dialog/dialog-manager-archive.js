export default {
    // 状態変更の定型処理ヘルパー
    async _execStatusChange(methodName, params, confirmTitle, 
        confirmMsg, successMsg, nextScreenMode = null, onUpdateStore = null) {
        // Promiseで結果を待つ
        const isOk = await this.ShowConfirm({
            title: confirmTitle,
            help: "",
            message: confirmMsg
        });
        if (!isOk) return; // キャンセルならここで終了
        // OKだった場合のAPI実行処理
        await $Warn.CatchAsync(async () => {
            const isSuccess = await $Data.Access[methodName](params);
            if (!isSuccess) return;
            if (onUpdateStore) onUpdateStore();
            $Notice.Info(successMsg);
            this._core.closeAll();
            if (nextScreenMode) {
                $App.AppData.Context.ScreenMode = nextScreenMode;
                await $App.RefreshScreen();
            } else {
                const archive = $Data.Store.GetArchive();
                if (archive) $TopBar.ChangeTitle(archive.title);
            }
        })();
    },
    // タイムライン用リスト
    ShowDetailsTimeLine() {
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) return $Notice.Warn("データはありません。");
        const isPub = $App.AppData.Context.ScreenMode === $Const.SCREEN_MODE.ARCHIVE_PUB;
        const archive = $Data.Store.GetArchive();
        const canDetach = archive && !archive.is_public && archive.is_owner;
        const el = $Dom.GenerateTemplate("tpl-timeline-container");
        const listContainer = $Dom.QuerySelector(".js-list-container", el);
        // ブレーク判定用（公開ならday番号、自分用なら日付文字列）
        let currentBreakKey = null;
        details.forEach((item, index) => {
            const breakKey = isPub ? item.display_day : item.memo_date;
            // 日付が変わるタイミングでヘッダーを挿入
            if (currentBreakKey !== breakKey) {
                const header = $Dom.GenerateTemplate("tpl-timeline-date");
                const container = $Dom.QuerySelector(".js-date-container", header);
                // 【修正箇所】新部品を呼び出し。ヘッダーなので時刻は表示しないよう null を渡す
                $UI.Generator.MemoDateFormatter(container, { ...item, memo_time: null });
                listContainer.appendChild(header);
                currentBreakKey = breakKey;
            }
            // --- アイテム本体の描画（ここからは既存維持） ---
            const child = $Dom.GenerateTemplate("tpl-timeline-item");
            const indexBadge = $Dom.QuerySelector(".js-index-badge", child);
            if (indexBadge) indexBadge.textContent = (index + 1);
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = item.body || "";
            const btnDetach = $Dom.QuerySelector(".js-btn-detach", child);
            if (btnDetach && canDetach) {
                $Dom.ToggleShow(btnDetach, true);
                btnDetach.onclick = async (e) => {
                    e.stopPropagation();
                    if (!await this.ShowConfirm({ title: "REMOVE ITEM", message: "このメモをまとめから外し、単独のメモに戻しますか？" })) return;
                    if (await $Data.Access.DetachDetails({ seqs: [item.seq], archive_id: item.archive_id })) {
                        $Notice.Info("まとめから外しました。"); this._core.closeAll(); await $App.RefreshScreen();
                    }
                };
            }
            const priceWrapper = $Dom.QuerySelector(".js-price-wrapper", child);
            const priceEl = $Dom.QuerySelector(".js-price", child);
            const priceUnitEl = $Dom.QuerySelector(".js-price-unit", child);
            if (priceEl && priceWrapper) {
                const price = Number(item.memo_price || 0);
                if (price !== 0) {
                    $Dom.ToggleShow(priceWrapper, true);
                    let displayCurrency = $App.AppData.Owner.Currency_unit || 'JPY';
                    if (item.archive_id > 0) {
                        const arc = $Data.Store.GetArchiveList()?.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                        if (arc?.currency_unit) displayCurrency = arc.currency_unit;
                    }
                    if (priceUnitEl) priceUnitEl.textContent = displayCurrency;
                    if (price > 0) {
                        priceEl.textContent = `+${price.toLocaleString()}`; priceEl.className += " text-blue-500";
                    } else {
                        priceEl.textContent = price.toLocaleString(); priceEl.className += " text-red-500";
                    }
                } else { $Dom.ToggleShow(priceWrapper, false); }
            }
            child.onclick = () => { this._core.closeAll(); $Marker.SelectMarker(index); };
            listContainer.appendChild(child);
        });
        this._core.open({ title: "タイムライン", content: el });
    },
    // 検索結果用リスト
    ShowDetailsSearchResult() {
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) return $Notice.Warn("データはありません。");
        const el = $Dom.GenerateTemplate("tpl-list-parent");
        const rt = $Const.REACTION_TYPE; // リアクション定数
        details.forEach((item, index) => {
            const child = $Dom.GenerateTemplate("tpl-list-child-search");
            // --- 1. 基本情報の反映 ---
            $Dom.QuerySelector(".js-index", child).textContent = (index + 1);
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-archive-title", child).textContent = item.a_title || "(No Archive)";
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = (item.body || "").replace(/\r?\n/g, ' ');
            // --- 【変更】日付情報の反映 ---
            const dateContainer = $Dom.QuerySelector(".js-date-container", child);
            // dateContainer.innerHTML = "";
            $UI.Generator.MemoDateFormatter(dateContainer, item);
            // --- 3. リアクション統計の反映 ---
            $Dom.QuerySelector(".js-icon-funny", child).textContent = rt.FUNNY.emoji;
            $Dom.QuerySelector(".js-count-funny", child).textContent = item.count_funny || 0;
            $Dom.QuerySelector(".js-icon-love", child).textContent = rt.LOVE.emoji;
            $Dom.QuerySelector(".js-count-love", child).textContent = item.count_love || 0;
            $Dom.QuerySelector(".js-icon-surprise", child).textContent = rt.SURPRISE.emoji;
            $Dom.QuerySelector(".js-count-surprise", child).textContent = item.count_surprise || 0;
            $Dom.QuerySelector(".js-icon-sad", child).textContent = rt.SAD.emoji;
            $Dom.QuerySelector(".js-count-sad", child).textContent = item.count_sad || 0;
            // --- 4. 金額エリアの制御（既存ロジック） ---
            const priceWrapper = $Dom.QuerySelector(".js-price-wrapper", child);
            const priceEl = $Dom.QuerySelector(".js-memo-price", child);
            const currencyEl = $Dom.QuerySelector(".js-memo-currency", child);
            const price = Number(item.memo_price || 0);
            if (price !== 0) {
                $Dom.ToggleShow(priceWrapper, true);
                let displayCurrency = item.currency_unit || 'JPY';
                if (item.archive_id > 0) {
                    const arc = $Data.Store.GetArchiveList()?.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                    if (arc?.currency_unit) displayCurrency = arc.currency_unit;
                }
                currencyEl.textContent = displayCurrency;
                if (price > 0) {
                    priceEl.textContent = `+${price.toLocaleString()}`; priceEl.classList.add("text-blue-500");
                } else {
                    priceEl.textContent = price.toLocaleString(); priceEl.classList.add("text-red-500");
                }
            }
            // マーカー選択イベント
            child.onclick = () => { this._core.closeAll(); $Marker.SelectMarker(index); };
            el.appendChild(child);
        });
        this._core.open({ title: "検索の結果", content: el });
    },
    async ShowArchiveList() {
        const isSuccess = await $Data.Access.GetArchiveList();
        if (!isSuccess) return;
        const archives = $Data.Store.GetArchiveList() || [];
        if (archives.length == 0) {
            $Notice.Warn("データはありません");
            return;
        }
        const root = document.createElement("div");
        root.className = "w-full flex flex-col";
        const searchBar = $Dom.GenerateTemplate("tpl-dialog-search-bar", "ui-template-root", false);
        const input = $Dom.QuerySelector(".js-input", searchBar);
        const clearBtn = $Dom.QuerySelector(".js-clear", searchBar);
        root.appendChild(searchBar);
        const listContainer = document.createElement("div");
        root.appendChild(listContainer);
        const render = (filterText = "") => {
            listContainer.innerHTML = "";
            const query = filterText.toLowerCase().trim();
            const filtered = archives.filter(item => {
                const target = (item.title || "") + (item.memo || "");
                return target.toLowerCase().includes(query);
            });
            if (filtered.length === 0) {
                listContainer.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-600 py-10">合致するまとめがありません</div>`;
                return;
            }
            const pvt = filtered.filter(item => !item.is_public);
            const pub = filtered.filter(item => item.is_public);
            const draw = (title, list, isPub) => {
                if (list.length === 0) return;
                const header = $Dom.GenerateTemplate("tpl-list-group-header");
                const badge = $Dom.QuerySelector(".js-header-badge", header);
                $Dom.QuerySelector(".js-header-title", header).textContent = title;
                if (isPub) {
                    badge.classList.add("bg-brand-5");
                    $Dom.QuerySelector(".js-header-icon", header).textContent = "◎";
                } else {
                    badge.classList.add("bg-slate-800");
                    $Dom.QuerySelector(".js-header-icon", header).textContent = "🔒";
                }
                listContainer.appendChild(header);
                list.forEach(item => {
                    const child = $Dom.GenerateTemplate("tpl-list-child-archive");
                    $Dom.QuerySelector(".js-title", child).textContent = item.title;
                    $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim);
                    $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                    $Dom.QuerySelector(".js-count", child).textContent = item.detail_count || "0";
                    const border = $Dom.QuerySelector(".js-item-border", child);
                    const countBadge = $Dom.QuerySelector(".js-count-badge", child);
                    if (isPub) {
                        const isCls = !!item.closed_flg;
                        border.classList.add(isCls ? "bg-slate-400" : "bg-brand-5");
                        countBadge.classList.add(isCls ? "bg-slate-400" : "bg-brand-5");
                    } else {
                        border.classList.add("bg-slate-800");
                        countBadge.classList.add("bg-slate-800");
                    }
                    child.onclick = () => {
                        this._core.closeAll();
                        $App.AppData.Context.ScreenMode = isPub ? $Const.SCREEN_MODE.ARCHIVE_PUB : $Const.SCREEN_MODE.ARCHIVE;
                        $App.AppData.Context.TargetArchiveId = item.archive_id;
                        $App.RefreshScreen();
                    };
                    listContainer.appendChild(child);
                });
            };
            draw("PRIVATE ARCHIVE", pvt, false);
            draw("PUBLIC ARCHIVE", pub, true);
        };
        input.oninput = (e) => {
            const val = e.target.value;
            $Dom.ToggleShow(clearBtn, val.length > 0);
            render(val);
        };
        clearBtn.onclick = () => {
            input.value = "";
            $Dom.ToggleShow(clearBtn, false);
            render("");
            input.focus();
        };
        render("");
        this._core.open({
            title: "まとめの一覧", 
            size: "lg",
            content: root, 
            help: "上部の入力欄から検索できます。" 
        });
    },
    // 既存まとめへの追加先選択ダイアログ
    SelectArchiveForAdd(seqs) {
        $Warn.CatchAsync(async () => {
            // 最新のアーカイブリストを取得
            const isSuccess = await $Data.Access.GetArchiveList();
            if (!isSuccess) return;
            const root = $Dom.GenerateTemplate("tpl-list-parent");
            // root.className = "w-full text-slate-600 mb-2 px-1";
            const archives = $Data.Store.GetArchiveList() ||[];
            // プライベートデータのみに絞る
            const privateList = archives.filter(item => !item.is_public);
            if (privateList.length === 0) {
                $Notice.Warn("追加できるまとめデータがありません。");
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
                $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim);
                $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                $Dom.QuerySelector(".js-count", child).textContent = item.detail_count || "0";
                // バッジの装飾（PRIVATE固定）
                const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                // leftBorder.className = "absolute left-0 top-0 bottom-0 w-1 bg-slate-800";
                // アイテムクリック時の処理（追加確認 ＆ API実行）
                child.onclick = async () => {
                    const isOk = await this.ShowConfirm({
                        title: "ADD",
                        help: "",
                        message: `${seqs.length}件のアイテムを「${item.title}」に追加しますか？`
                    });
                    if (!isOk) return;
                    const params = { seqs: seqs, archive_id: item.archive_id };
                    const isAddSuccess = await $Data.Access.AddDetails(params);
                    if (!isAddSuccess) return;
                    $Notice.Info("追加しました。");
                    this._core.closeAll();
                    // ARCHIVEモードに切り替えて対象のまとめを開く
                    $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                    $App.AppData.Context.TargetArchiveId = item.archive_id;
                    await $App.RefreshScreen();
                };
                root.appendChild(child);
            });
            // 選択用ダイアログを開く
            this._core.open({
                title: "まとめを選択",
                content: root,
                help: "",
                buttons: []
            });
        })();
    },
    // メモをまとめる（複数選択モード）
    async ShowMultiSelectTimeline() {
        // --- ローカルの未更新データを同期処理 ---
        $Notice.Loading.Show(); // ローディング表示
        try {
            // 1. ローカルDBの未送信明細を一括送信
            await $Data.LocalDb.BulkSendDetails();
            // 2. サーバーから最新の「未マージ明細リスト」を再取得
            // (これが成功すると Store も最新化される)
            const isSuccess = await $Data.Access.GetUnMergeDetails({});
            if (!isSuccess) return; // 失敗時はエラーハンドラに任せて終了
        } finally {
            $Notice.Loading.Hide(); // ローディング解除
        }
        // 最新データを表示
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("データはありません。");
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
            const dateStr = item.memo_date;
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        sortedDates.forEach(date => {
            const header = $Dom.GenerateTemplate("tpl-multi-select-date");
            const dateEl = $Dom.QuerySelector(".js-date-text", header);
            // 共通部品を呼び出し（グループ化のキーである date 文字列をオブジェクトとして渡す）
            $UI.Generator.MemoDateFormatter(dateEl, { memo_date: date });
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
        frame = this._core.open({
            title: "まとめ選択",
            content: content,
            help: "",
            buttons: [[
                {
                    id: "btn-ms-merge",
                    label: "create",
                    className: "disabled:opacity-50",
                    handler: async () => {
                        const seqs = Array.from(selectedSeqs);
                        const isOk = await this.ShowConfirm({
                            title: "MERGE",
                            help: "",
                            message: `${seqs.length}件のメモから\n新しいまとめを作成しますか？`
                        });
                        if (!isOk) return;
                        const isSuccess = await $Data.Access.MergeDetails({
                            seqs,
                            title: "まとめのタイトル" + $Util.FormatDate(new Date(), '_HHmmss'),
                            currency_unit: $App.AppData.Owner.Currency_unit || 'JPY'
                        });
                        if (!isSuccess) return;
                        $Notice.Info("作成しました");
                        this._core.closeAll();
                        $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE;
                        await $App.RefreshScreen();
                    }
                },
                {
                    id: "btn-ms-add",
                    label: "＋ ADD",
                    className: "disabled:opacity-50",
                    handler: () => {
                        const seqs = Array.from(selectedSeqs);
                        // 新しく作った専用メソッドを呼び出す
                        this.SelectArchiveForAdd(seqs);
                    }
                },
                {
                    id: "btn-ms-delete",
                    label: "DELETE",
                    // 危険な操作なので赤枠・赤文字でデザイン
                    className: "disabled:opacity-50 border-2 border-red-200 !bg-white !text-red-500",
                    handler: async () => {
                        const seqs = Array.from(selectedSeqs);
                        const isOk = await this.ShowConfirm({
                            title: "DELETE ITEMS",
                            help: "",
                            message: `選択した ${seqs.length} 件のアイテムを削除しますか？\n（この操作は元に戻せません）`
                        });
                        if (!isOk) return;
                        const isOk2 = await this.ShowConfirm({
                            title: "DELETE ITEMS",
                            help: "",
                            message: `選択した ${seqs.length} 件のアイテムを削除します。`
                        });
                        if (!isOk2) return;     
                        // API通信でサーバー側に配列を渡す
                        const isSuccess = await $Data.Access.DeleteStrayDetails({ seqs: seqs });
                        if (!isSuccess) return;
                        $Notice.Info("選択したメモを削除しました。");
                        this._core.closeAll();
                        await $App.RefreshScreen(); // マーカーと一覧を最新化
                    }
                }
            ]]
        });
        updateSelectionUI(); // フッターボタン生成後に再度呼んで初期状態の disabled を反映
    },
    // まとめ親詳細参照（アーカイブ）
    ShowArchiveInfo() {
        const archive = $Data.Store.GetArchive();
        const isAdmin = $App.AppData.Context.IsLoggedIn && $App.AppData.Owner.Plan === "Admin";
        const el = $Dom.GenerateTemplate('tpl-view-archive');
        // ── スタイル定義（ボタンの状態別クラス） ──────────────────
        const STYLE_BASE = "flex-1 h-11 font-bold text-[0.8rem] rounded-lg tracking-wider outline-none";
        const STYLE_ACTIVE = " bg-white text-slate-900 shadow-md border border-slate-200 active:scale-95 transition-all";
        const STYLE_CURRENT = " bg-brand-5 text-white shadow-inner border border-brand-5 cursor-default pointer-events-none";
        const STYLE_DISABLED = " bg-slate-100 text-slate-600 border border-slate-100 cursor-not-allowed pointer-events-none";
        // ── 1. タイトルと本文 ──────────────────────────────────
        const renderTitleAndBody = (arc) => {
            $Dom.QuerySelector('#view-mem-title', el).textContent = arc.title || "";
            $Dom.QuerySelector('#view-mem-body', el).textContent = arc.memo || "";
        };
        // ── 2. URLリンク ──────────────────────────────────────
        const renderUrlLink = (arc) => {
            const urlWrapper = $Dom.QuerySelector('#view-mem-url-wrapper', el);
            urlWrapper.innerHTML = "";
            if (!arc.link_url) {
                $Dom.ToggleShow(urlWrapper, false);
                return;
            }
            $Dom.ToggleShow(urlWrapper, true);
            const params = {
                target_type: 2,
                target_user_id: arc.user_id,
                archive_id: arc.archive_id,
                item_name: "link_url"
            };
            $UI.Generator.LinkButton(urlWrapper, arc.link_url, params, arc.is_owner);
        };
        // ── 3. 金額・距離・件数（画像通りのリスト形式） ──────────────
        const renderStats = (arc, details) => {
            // 金額
            const totalPrice = details.reduce((sum, item) => sum + Number(item.memo_price || 0), 0);
            const priceVal = $Dom.QuerySelector('#mem-stat-price', el);
            priceVal.textContent = totalPrice.toLocaleString();
            priceVal.className = "font-bold text-[1.1rem]";
            if (totalPrice > 0) priceVal.classList.add("text-blue-500");
            else if (totalPrice < 0) priceVal.classList.add("text-red-500");
            else priceVal.classList.add("text-slate-900");
            $Dom.QuerySelector('#view-mem-price-unit', el).textContent =
                arc.currency_unit || $App.AppData.Owner.Currency_unit || 'JPY';
            // 距離
            $Dom.QuerySelector('#mem-stat-distance', el).textContent = $Util.GetTotalDistance(details).toFixed(1);
            // 件数表示とクリックイベント
            const btnTimeline = $Dom.QuerySelector('#btn-view-mem-timeline', el);
            const countText = $Dom.QuerySelector('#mem-stat-count', el);
            countText.textContent = details.length;
            btnTimeline.onclick = () => this.ShowDetailsTimeLine();
        };
        // ── ボタンへスタイルとイベントをまとめて適用するヘルパー ────────
        const applyButtonState = (btn, state, onClick) => {
            // state: 'active' | 'current' | 'disabled'
            btn.className = STYLE_BASE;
            btn.disabled = false;
            btn.onclick = null;
            switch (state) {
                case 'active':
                    btn.className += STYLE_ACTIVE;
                    btn.onclick = onClick;
                    break;
                case 'current':
                    btn.className += STYLE_CURRENT;
                    break;
                case 'disabled':
                    btn.className += STYLE_DISABLED;
                    btn.disabled = true;
                    break;
            }
        };
        // ── 4. ステータス変更ボタン群（四つ） ──────────────────────
        const renderStatusButtons = (arc, onChanged) => {
            const btnMemo = $Dom.QuerySelector('#btn-status-memo', el);
            const btnPrivate = $Dom.QuerySelector('#btn-status-private', el);
            const btnClose = $Dom.QuerySelector('#btn-status-close', el);
            const btnOpen = $Dom.QuerySelector('#btn-status-open', el);
            if (!arc.is_owner) {
                $Dom.ToggleShow($Dom.QuerySelector('#archive-status-bar', el), false);
                return;
            }
            if (!arc.is_public) {
                // 非公開状態：解体 / 非公開(現在) / 公開準備 / 全体公開(不可)
                applyButtonState(btnMemo, 'active', () =>
                    this._execStatusChange('DeleteArchive', { archive_id: arc.archive_id },
                        "RESTORE", "解体しますか？", "戻しました", $Const.SCREEN_MODE.CREATE));
                applyButtonState(btnPrivate, 'current');
                applyButtonState(btnClose, 'active', () =>
                    this._execStatusChange('PublishArchive', { archive_id: arc.archive_id },
                        "PUBLISH", "公開準備にしますか？", "完了", $Const.SCREEN_MODE.ARCHIVE_PUB,
                        () => $Data.Store.UpdateArchive({ is_public: true, closed_flg: true })));
                applyButtonState(btnOpen, 'disabled');
                return;
            }
            // 公開状態：解体(不可) / 非公開へ戻す / 限定公開 or 全体公開（現状に応じて切替）
            applyButtonState(btnMemo, 'disabled');
            applyButtonState(btnPrivate, 'active', () =>
                this._execStatusChange('UnpublishArchive', { archive_id: arc.archive_id },
                    "PRIVATE", "非公開に戻しますか？", "戻しました", $Const.SCREEN_MODE.ARCHIVE,
                    () => $Data.Store.UpdateArchive({ is_public: false, closed_flg: false })));
            if (arc.closed_flg) {
                applyButtonState(btnClose, 'current');
                applyButtonState(btnOpen, 'active', () =>
                    this._execStatusChange('OpenArchive', { archive_id: arc.archive_id },
                        "OPEN", "全体公開しますか？", "公開しました", null,
                        () => $Data.Store.UpdateArchive({ closed_flg: false })));
            } else {
                applyButtonState(btnClose, 'active', () =>
                    this._execStatusChange('CloseArchive', { archive_id: arc.archive_id },
                        "CLOSE", "限定公開にしますか？", "変更しました", null,
                        () => $Data.Store.UpdateArchive({ closed_flg: true })));
                applyButtonState(btnOpen, 'current');
            }
        };
        // ── 5. 最下段ボタン：limited_open_flg の制御 ────────────────
        const renderLimitedToggle = (arc, onChanged) => {
            const limitArea = $Dom.QuerySelector('#archive-limit-btn-area', el);
            const btnLimit = $Dom.QuerySelector('#btn-toggle-limited', el);
            if (!(arc.is_owner && arc.is_public && !arc.closed_flg)) {
                $Dom.ToggleShow(limitArea, false);
                return;
            }
            $Dom.ToggleShow(limitArea, true);
            const isLimited = !!arc.limited_open_flg; // 正しいフラグを参照
            const icon = $Dom.QuerySelector('.js-check-icon', btnLimit);
            const label = $Dom.QuerySelector('.js-label-text', btnLimit);
            icon.textContent = isLimited ? "" : "";
            label.textContent = isLimited ? "限定公開中" : "全体公開中";
            btnLimit.className = "w-full h-12 font-bold rounded-lg border-2 active:scale-[0.98] transition-all flex items-center justify-center gap-2";
            btnLimit.classList.add(...(isLimited
                ? ["bg-brand-1", "border-brand-3", "text-brand-5"]
                : ["bg-slate-50", "border-slate-200", "text-slate-600"]));
            btnLimit.onclick = async () => {
                const nextStatus = !isLimited;
                // API経由で limited_open_flg のみを更新
                let isSuccess;
                if (nextStatus) {
                    isSuccess = await $Data.Access.OpenLimitedArchive({ archive_id: arc.archive_id });
                } else {
                    isSuccess = await $Data.Access.CloseLimitedArchive({ archive_id: arc.archive_id });
                }
                if (isSuccess) {
                    $Data.Store.UpdateArchive({ limited_open_flg: nextStatus });
                    $Notice.Info(nextStatus ? "限定公開に設定しました" : "全体公開に設定しました");
                    onChanged(); // 自身の状態を再描画
                }
            };
        };
        // ── 描画処理（全体をまとめて呼び出す） ──────────────────────
        const renderView = () => {
            const arc = $Data.Store.GetArchive();
            const details = $Data.Store.GetDetails() || [];
            renderTitleAndBody(arc);
            renderUrlLink(arc);
            renderStats(arc, details);
            renderStatusButtons(arc, renderView);
            renderLimitedToggle(arc, renderView);
        };
        // ── ユーザー情報の表示設定 ───────────────────────────────
        const setupUserBadge = () => {
            const userWrapper = $Dom.QuerySelector('#view-mem-user-wrapper', el);
            const profile = $Data.Store.GetUserProfile();
            if (!profile) {
                $Dom.ToggleShow(userWrapper, false);
                return null;
            }
            $UI.Generator.UserBadge(userWrapper, profile, { type: 'button', isOwner: archive.is_owner });
            return profile;
        };
        // ── QRコードのプリロード（事前ダウンロード） ───────────────
        const preloadQrCode = () => {
            const baseUrl = window.location.origin + window.location.pathname;
            const encodedId = $Util.EncodeId(archive.archive_id);
            const shareUrl = `${baseUrl}?mode=archive_pub&encodedId=${encodedId}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
            const imgPreload = new Image();
            imgPreload.src = qrUrl; // このタイミングでプリロード開始
            return qrUrl;
        };
        // ── ヘッダーボタンの定義 ────────────────────────────────
        const buildHeaderButtons = (profile, qrUrl) => {
            const headerButtons = [];
            if (archive.is_public && !archive.closed_flg) {
                headerButtons.push({
                    label: "🔗",
                    handler: () => this.ShowShareArchive(archive, profile, qrUrl)
                });
            }
            if (archive.is_owner) {
                headerButtons.push({
                    label: "✏️",
                    handler: () => this.ShowEditArchive(archive, renderView)
                });
            } else {
                headerButtons.push({
                    label: "🚫",
                    handler: () => this.ShowReportPost(archive)
                });
            }
            if (archive.is_owner || isAdmin) {
                headerButtons.push({
                    label: "📊",
                    handler: () => this.ShowArchiveClickStats(archive)
                });
            }
            return headerButtons;
        };
        // ── 実行フロー ────────────────────────────────────────
        renderView();
        const profile = setupUserBadge();
        const qrUrl = preloadQrCode();
        const headerButtons = buildHeaderButtons(profile, qrUrl);
        const dialogButtons = []; // 一般ユーザーはダイアログ下部フッター(buttons)は無し
        this._core.open({
            title: "まとめの詳細情報",
            content: el,
            size: 'lg',
            help: "",
            headerButtons: headerButtons,
            buttons: dialogButtons,
        });
    },
    // URL公開画面
    ShowShareArchive(archive, profile, shareUrl) {
        const el = $Dom.GenerateTemplate('tpl-share-archive');
        // 1. タイトルの反映
        $Dom.QuerySelector('#share-archive-title', el).textContent = archive.title || "No Title";
        // 2. QRコードの生成 (無料APIを利用)
        const qrImg = $Dom.QuerySelector('#share-qr-image', el);
        qrImg.src = shareUrl;
        // 3. コピー処理 (QRボタンをクリックでコピー)
        $Dom.QuerySelector('#btn-share-copy', el).onclick = () => {
            navigator.clipboard.writeText(shareUrl).then(() => {
                $Notice.Info("URLをクリップボードにコピーしました！");
            }).catch(err => {
                $Notice.Error("コピーに失敗しました");
            });
        };
        // 4. SNSシェアボタンの処理
        $Dom.QuerySelector('#btn-share-line', el).onclick = async () => {
            const isOk = await $Dialog.ShowConfirm({
                title: "LINE 連携",
                message: "LINE を起動してもよろしいですか？",
                label: "LINE を起動する",
                help: ""
            });
            if (isOk) {
                window.open($Util.GetShareUrl('line', shareUrl), '_blank');
            }
        };
        $Dom.QuerySelector('#btn-share-x', el).onclick = async () => {
            const isOk = await $Dialog.ShowConfirm({
                title: "X 連携",
                message: "X（旧Twitter）を起動してもよろしいですか？",
                label: "X を起動する",
                help: ""
            });
            if (isOk) {
                window.open($Util.GetShareUrl('x', shareUrl, archive.title), '_blank');
            }
        };
        $Dom.QuerySelector('#btn-share-fb', el).onclick = async () => {
            const isOk = await $Dialog.ShowConfirm({
                title: "facebook 連携",
                message: "facebook を起動してもよろしいですか？",
                label: "facebook を起動する",
                help: ""
            });
            if (isOk) {
                window.open($Util.GetShareUrl('facebook', shareUrl), '_blank');
            }
        };
        // 
        this._core.open({
            title: "まとめを共有する",
            content: el,
            size: 'sm',
            help: "",
            buttons: [] // CLOSEボタンは右上の✖で代用
        });
    },
    // 状態変更専用ダイアログ
    ShowStatusChangeDialog(archive) {
        const el = $Dom.GenerateTemplate("tpl-archive-status-change");
        const iconEl = $Dom.QuerySelector("#status-change-icon", el);
        const titleEl = $Dom.QuerySelector("#status-change-title", el);
        const descEl = $Dom.QuerySelector("#status-change-desc", el);
        let title, desc, icon, buttons = [];
        const btnMainClass = "bg-brand-5 text-white shadow-md font-bold";
        const btnSubClass = "bg-white text-slate-900 border border-slate-300 shadow-md font-bold";
        const btnDangerClass = "bg-red-50 text-red-500 border border-red-300 shadow-md font-bold";
        if (!archive.is_public) {
            // ===================================
            // 【現在 PRIVATE の場合】 -> CLOSE または 解体
            // ===================================
            title = "PRIVATE 状態";
            icon = "🔒";
            desc = "現在のステータスは「PRIVATE」です。\n自分以外のユーザーは見ることはできません。\n\n「公開するか解体するか」を選択できます。\n\n※「公開（PUBLIC）」状態に移行すると「公開する準備」が整いますが、即座に公開されるわけではありません。";
            buttons.push([{
                label: "🔒　Private　⇒　－　Public",
                className: btnMainClass,
                handler: () => this._execStatusChange(
                    'PublishArchive',
                    { archive_id: archive.archive_id },
                    "Switch to [CLOSE]",
                    "まとめを [CLOSE] 状態にしますか？",
                    "[CLOSE] 状態に移行しました。",
                    $Const.SCREEN_MODE.ARCHIVE_PUB, // Publicモードへ移行
                    () => $Data.Store.UpdateArchive({ is_public: true, closed_flg: true })
                )
            }]);
            buttons.push([{
                label: "まとめを解体する",
                className: btnDangerClass,
                handler: () => this._execStatusChange(
                    'DeleteArchive',
                    { archive_id: archive.archive_id },
                    "Restore to Details",
                    "このまとめを解体し、単体のメモに戻しますか？",
                    "単体のメモに戻しました。",
                    $Const.SCREEN_MODE.CREATE
                )
            }]);
        } else if (archive.closed_flg) {
            // ===================================
            // 【現在 CLOSE の場合】 -> OPEN または PRIVATE
            // ===================================
            title = "CLOSE 状態";
            icon = "－";
            desc = "現在は「公開準備中 (CLOSE)」です。\nURLを知っているユーザーのみアクセス可能です。\n\n「OPEN」に切り替えるとマップ上に公開され、全てのユーザーが検索・閲覧できるようになります。";
            buttons.push([{
                label: "－　CLOSE　⇒　◎　OPEN",
                className: btnMainClass,
                handler: () => this._execStatusChange(
                    'OpenArchive',
                    { archive_id: archive.archive_id },
                    "Switch to [OPEN]",
                    "まとめをマップ上に公開(OPEN)しますか？",
                    "[OPEN] に切り替えました。",
                    null,
                    () => $Data.Store.UpdateArchive({ closed_flg: false })
                )
            }]);
            buttons.push([{
                label: "－　CLOSE　⇒　🔒　PRIVATE",
                className: btnSubClass,
                handler: () => this._execStatusChange(
                    'UnpublishArchive',
                    { archive_id: archive.archive_id },
                    "Switch to [PRIVATE]",
                    "完全に非公開(PRIVATE)に戻しますか？",
                    "[PRIVATE] に戻しました。",
                    $Const.SCREEN_MODE.ARCHIVE, // Privateモードへ戻る
                    () => $Data.Store.UpdateArchive({ is_public: false, closed_flg: false })
                )
            }]);
        } else {
            // ===================================
            // 【現在 OPEN の場合】 -> CLOSE または PRIVATE
            // ===================================
            title = "OPEN 状態";
            icon = "◎";
            desc = "現在は「公開中 (OPEN)」です。\nマップ上に公開され、全てのユーザーが検索・閲覧できます。\n\n一時的にマップから隠す場合は「CLOSE」に、完全に非公開に戻す場合は「PRIVATE」に変更してください。";
            buttons.push([{
                label: "◎　OPEN　⇒　－　CLOSE",
                className: btnMainClass,
                handler: () => this._execStatusChange(
                    'CloseArchive',
                    { archive_id: archive.archive_id },
                    "Switch to [CLOSE]",
                    "公開を一時停止(CLOSE)しますか？",
                    "[CLOSE] に切り替えました。",
                    null,
                    () => $Data.Store.UpdateArchive({ closed_flg: true })
                )
            }]);
            buttons.push([{
                label: "◎　OPEN　⇒　🔒　PRIVATE",
                className: btnSubClass,
                handler: () => this._execStatusChange(
                    'UnpublishArchive',
                    { archive_id: archive.archive_id },
                    "Switch to [PRIVATE]",
                    "完全に非公開(PRIVATE)に戻しますか？",
                    "[PRIVATE] に戻しました。",
                    $Const.SCREEN_MODE.ARCHIVE,
                    () => $Data.Store.UpdateArchive({ is_public: false, closed_flg: false })
                )
            }]);
        }
        iconEl.textContent = icon;
        titleEl.textContent = title;
        descEl.textContent = desc;
        // すでにダイアログがスタックされる仕様なので、そのまま上に開く
        this._core.open({
            title: "公開状態を変更する",
            content: el,
            help: "",
            buttons: buttons
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
        editCurrency.value = archive.currency_unit || $App.AppData.Owner.Currency_unit || 'JPY';
        // --- 文字数カウント制御 ---
        const cTitle = $Dom.QuerySelector('#edit-mem-title-count', el);
        const cBody  = $Dom.QuerySelector('#edit-mem-body-count', el);
        cTitle.textContent = editTitle.value.length;
        cBody.textContent  = editBody.value.length;
        editTitle.addEventListener('input', () => cTitle.textContent = editTitle.value.length);
        editBody.addEventListener('input',  () => cBody.textContent  = editBody.value.length);
        //
        this._core.open({
            title: "詳細情報の編集",
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
                            $Notice.Info("保存しました。");
                            this._core.closeAll();
                            // if (onUpdate) onUpdate(); // 参照画面のDOMを最新化
                        })
                    }
                ]
            ]
        });
    },
    // アーカイブと明細のクリック集計画面の表示
    ShowArchiveClickStats(archive) {
        if (!archive) return;
        const el = $Dom.GenerateTemplate('tpl-archive-click-stats');
        // --- 1. アーカイブ情報の反映 ---
        $Dom.QuerySelector('.js-arc-title', el).textContent = archive.title || "No Title";
        $Dom.QuerySelector('.js-arc-url', el).textContent = archive.link_url || "リンクなし";
        const arcStats = (archive.click_stats && archive.click_stats.link_url) ? archive.click_stats.link_url : { t: 0, u: 0, g: 0 };
        $Dom.QuerySelector('.js-arc-total', el).textContent = arcStats.t || 0;
        $Dom.QuerySelector('.js-arc-unique', el).textContent = arcStats.u || 0;
        $Dom.QuerySelector('.js-arc-guest', el).textContent = arcStats.g || 0;
        // --- 追加: アーカイブ自体の閲覧数 ---
        const arcViewCount = archive.click_count || (archive.click_stats && archive.click_stats.view && archive.click_stats.view.t) || 0;
        const arcViewCountEl = $Dom.QuerySelector('.js-arc-view-count', el);
        if (arcViewCountEl) arcViewCountEl.textContent = arcViewCount;
        const statusBadge = $Dom.QuerySelector('.js-arc-status-badge', el);
        if (!archive.is_public) {
            statusBadge.textContent = "非公開";
            statusBadge.className += " bg-slate-200 text-slate-900";
        } else if (archive.closed_flg) {
            statusBadge.textContent = "CLOSE";
            statusBadge.className += " bg-slate-400 text-white";
        } else {
            statusBadge.textContent = "公開中";
            statusBadge.className += " bg-emerald-100 text-emerald-600";
        }
        if (archive.is_owner) $Dom.ToggleShow($Dom.QuerySelector('.js-arc-owner-badge', el), true);
        // --- 2. 明細情報の反映 ---
        const detailsContainer = $Dom.QuerySelector('.js-details-container', el);
        const details = $Data.Store.GetDetails() || [];
        if (details.length === 0) {
            detailsContainer.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-600 py-4">明細データがありません</div>`;
        } else {
            details.forEach(dtl => {
                const child = $Dom.GenerateTemplate('tpl-archive-click-stats-item');
                // 修正: seq ではなく no (付与した連番) を表示
                $Dom.QuerySelector('.js-dtl-seq', child).textContent = dtl.no || "-";
                $Dom.QuerySelector('.js-dtl-icon', child).textContent = dtl.face_emoji || "🚩";
                $Dom.QuerySelector('.js-dtl-title', child).textContent = dtl.title || "No Title";
                // --- 2.1 リアクション集計の動的生成 ---
                const reactContainer = $Dom.QuerySelector('.js-dtl-reactions', child);
                reactContainer.innerHTML = ""; 
                Object.values($Const.REACTION_TYPE).forEach(type => {
                    const countProp = type.prop.replace('has_', 'count_');
                    const count = dtl[countProp] || 0;
                    const div = document.createElement("div");
                    div.className = "flex items-center gap-1 text-[0.8rem]";
                    div.innerHTML = `<span class="kb-icon-emoji-sm">${type.emoji}</span><span class="font-bold text-slate-600">${count}</span>`;
                    reactContainer.appendChild(div);
                });
                // --- 2.2 クリック統計の反映 ---
                const urlEl = $Dom.QuerySelector('.js-dtl-url', child);
                const statsBox = $Dom.QuerySelector('.js-dtl-stats-box', child);
                if (dtl.link_url && dtl.link_url.trim() !== "") {
                    urlEl.textContent = dtl.link_url;
                    urlEl.classList.replace("text-slate-600", "text-blue-500");
                    const dStats = (dtl.click_stats && dtl.click_stats.link_url) ? dtl.click_stats.link_url : { t: 0, u: 0, g: 0 };
                    $Dom.QuerySelector('.js-dtl-total', child).textContent = dStats.t || 0;
                    $Dom.QuerySelector('.js-dtl-unique', child).textContent = dStats.u || 0;
                    $Dom.QuerySelector('.js-dtl-guest', child).textContent = dStats.g || 0;
                    $Dom.ToggleShow(statsBox, true);
                } else {
                    urlEl.textContent = "リンクなし";
                    urlEl.classList.add("text-slate-600", "italic");
                    $Dom.ToggleShow(statsBox, false);
                }
                detailsContainer.appendChild(child);
            });
        }
        //
        this._core.open({
            title: "まとめの状態",
            content: el,
            help: "まとめや各明細の統計（閲覧数・リンククリック数・リアクション数）を表示しています。",
            size: 'lg'
        });
    },
};
