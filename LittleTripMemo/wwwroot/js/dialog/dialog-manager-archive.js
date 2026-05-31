export default {
    // 以下のメソッドを移動してきてください。
    // - ShowDetailsTimeLine()
    // - ShowDetailsSimpleList()
    // - ShowArchiveList()
    // - SelectArchiveForAdd()
    // - ShowMultiSelectTimeline()
    // - _execStatusChange()
    // - ShowArchiveInfo()
    // - ShowEditArchive()
    // - ShowShareArchive()
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
                this._core.closeAll();
                $Marker.SelectMarker(index); // details自体がソート済みなので、このindexをそのまま使える
            };
            listContainer.appendChild(child);
        });
        this._core.open({
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
                this._core.closeAll();
                $Marker.SelectMarker(index);
            };
            el.appendChild(child);
        });
        this._core.open({
            title: "SEARCH RESULTS",
            content: el,
            help: "",
            buttons: []
        });
        setTimeout(() => {
            const activeFrame = this._core.stack[this._core.stack.length - 1];
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
                        this._core.closeAll();
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
            this._core.open({
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
        frame = this._core.open({
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
                        this._core.closeAll();
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
                        this._core.closeAll();
                        $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
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
                    this._core.closeAll();
                    $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
                    await $App.RefreshScreen(); // 画面を更新して反映
                }
            }]);
        }
        const frame = this._core.open({
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
        this._core.open({
            title: "EDIT ARCHIVE",
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
                            this._core.closeAll();
                            // if (onUpdate) onUpdate(); // 参照画面のDOMを最新化
                        })
                    }
                ]
            ]
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
        this._core.open({
            title: "SHARE ARCHIVE",
            content: el,
            help: "",
            buttons: [] // CLOSEボタンは右上の✖で代用し、下部はコピーボタンのみにする
        });
    },
};