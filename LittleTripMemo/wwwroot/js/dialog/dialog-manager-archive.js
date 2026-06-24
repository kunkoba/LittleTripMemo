export default {
    // 状態変更の定型処理ヘルパー
    async _execStatusChange(methodName, params, confirmTitle, confirmMsg, successMsg, nextScreenMode = null, onUpdateStore = null) {
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
    ShowDetailsTimeLine_2() {
        // ソートする
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) {
            $Notice.Warn("データはありません。");
            return;
        }
        // ▼ 追加：現在のアーカイブがプライベートかつ自分がオーナーか判定
        const archive = $Data.Store.GetArchive();
        const canDetach = archive && !archive.is_public && archive.is_owner;
        console.log("canDetach:", archive);
        const el = $Dom.GenerateTemplate("tpl-timeline-container");
        const listContainer = $Dom.QuerySelector(".js-list-container", el);
        let currentDate = ""; // 現在描画中の日付を保持
        // すでにソート済みなので、上から順にループするだけでOK！
        details.forEach((item, index) => {
            const dateStr = (item.memo_date || "");
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
            $Dom.QuerySelector(".js-time", child).textContent = item.memo_time || "";
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = item.body || "";
            // ==========================================
            // ▼ 追加：野良化（切り離し）ボタンの制御
            // ==========================================
            const btnDetach = $Dom.QuerySelector(".js-btn-detach", child);
            if (btnDetach) {
                if (canDetach) {
                    $Dom.ToggleShow(btnDetach, true);
                    btnDetach.onclick = async (e) => {
                        e.stopPropagation(); // 親の「マーカー選択(onclick)」が誤爆しないようにストップ
                        const isOk = await this.ShowConfirm({
                            title: "REMOVE ITEM",
                            help: "",
                            message: "このメモをまとめから外し、単独のメモに戻しますか？"
                        });
                        if (!isOk) return;
                        // API通信（対象の seq を送る）
                        const isSuccess = await $Data.Access.DetachDetails({ seqs: [item.seq], archive_id: item.archive_id });
                        if (!isSuccess) return;
                        $Notice.Info("まとめから外しました。");
                        this._core.closeAll();
                        // まとめを再読み込みして画面をリフレッシュ
                        await $App.RefreshScreen(); 
                    };
                } else {
                    $Dom.ToggleShow(btnDetach, false); // 表示条件を満たさない場合は隠す
                }
            }
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
                    let displayCurrency = $App.AppData.Owner.Currency_unit || 'JPY';
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
    ShowDetailsTimeLine() {
        const details = $Data.Store.GetDetails();
        if (!details || details.length === 0) return $Notice.Warn("データはありません。");
        const isPub = $App.AppData.Context.ScreenMode === $Const.SCREEN_MODE.ARCHIVE_PUB;
        const archive = $Data.Store.GetArchive();
        const canDetach = archive && !archive.is_public && archive.is_owner;
        const el = $Dom.GenerateTemplate("tpl-timeline-container");
        const listContainer = $Dom.QuerySelector(".js-list-container", el);
        // ブレーク判定用のキー（公開ならday番号、自分用なら日付文字列）
        let currentBreakKey = null;
        details.forEach((item, index) => {
            const breakKey = isPub ? item.display_day : item.memo_date;
            // 日付（またはDAY）が変わったタイミングでヘッダーを挿入
            if (currentBreakKey !== breakKey) {
                const header = $Dom.GenerateTemplate("tpl-timeline-date");
                const container = $Dom.QuerySelector(".js-date-container", header);
                if (isPub) {
                    const dayNum = item.display_day;
                    const hideMask = (dayNum > 1);
                    // "6月中旬 1day" から重複する " 1day" を除去して部品に渡す
                    const cleanDate = (item.memo_date || "").replace(/\s\d+day$/, "");
                    container.appendChild($UI.Generator.DateLabel(cleanDate, null, {
                        size: 'list',
                        dayNum: dayNum,
                        hideMask: hideMask,
                        isMask: false
                    }));
                } else {
                    container.appendChild($UI.Generator.DateLabel(item.memo_date, null, { size: 'list' }));
                }
                listContainer.appendChild(header);
                currentBreakKey = breakKey;
            }
            // --- 以降、アイテム描画ロジック（既存維持） ---
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
        this._core.open({ title: "TRIP LOG", content: el });
    },
    // 検索結果用リスト
    // 検索結果用リスト
    ShowDetailsSearchResult_2() {
        const details = $Data.Store.GetDetails();
        console.log("ShowDetailsSearchResult:", details);
        if (!details || details.length === 0) {
            $Notice.Warn("データはありません。");
            return;
        }
        const el = $Dom.GenerateTemplate("tpl-list-parent");
        const rt = $Const.REACTION_TYPE; // 定数ショートカット

        details.forEach((item, index) => {
            const child = $Dom.GenerateTemplate("tpl-list-child-search");
            // --- 基本・追加情報の反映 ---
            $Dom.QuerySelector(".js-index", child).textContent = (index + 1);
            $Dom.QuerySelector(".js-face", child).textContent = item.face_emoji || '😀';
            $Dom.QuerySelector(".js-archive-title", child).textContent = item.a_title || "(No Archive)";
            $Dom.QuerySelector(".js-title", child).textContent = item.title || "No Title";
            $Dom.QuerySelector(".js-body", child).textContent = (item.body || "").replace(/\r?\n/g, ' ');
            // --- 日時 (作成・更新) ---
            $Dom.QuerySelector(".js-create-tim", child).textContent = $Util.FormatDate(item.create_tim);
            $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim);
            // --- リアクション統計 (定数から絵文字を取得) ---
            $Dom.QuerySelector(".js-icon-funny", child).textContent = rt.FUNNY.emoji;
            $Dom.QuerySelector(".js-count-funny", child).textContent = item.count_funny || 0;
            $Dom.QuerySelector(".js-icon-love", child).textContent = rt.LOVE.emoji;
            $Dom.QuerySelector(".js-count-love", child).textContent = item.count_love || 0;
            $Dom.QuerySelector(".js-icon-surprise", child).textContent = rt.SURPRISE.emoji;
            $Dom.QuerySelector(".js-count-surprise", child).textContent = item.count_surprise || 0;
            $Dom.QuerySelector(".js-icon-sad", child).textContent = rt.SAD.emoji;
            $Dom.QuerySelector(".js-count-sad", child).textContent = item.count_sad || 0;
            // --- 金額エリア（既存ロジック維持） ---
            const priceWrapper = $Dom.QuerySelector(".js-price-wrapper", child);
            const priceEl = $Dom.QuerySelector(".js-memo-price", child);
            const currencyEl = $Dom.QuerySelector(".js-memo-currency", child);
            const price = Number(item.memo_price || 0);
            if (price !== 0) {
                $Dom.ToggleShow(priceWrapper, true);
                let displayCurrency = item.currency_unit || 'JPY';
                if (item.archive_id > 0) {
                    const archiveList = $Data.Store.GetArchiveList() || [];
                    const targetArc = archiveList.find(a => a.archive_id === item.archive_id) || $Data.Store.GetArchive();
                    if (targetArc && targetArc.currency_unit) displayCurrency = targetArc.currency_unit;
                }
                currencyEl.textContent = displayCurrency;
                if (price > 0) {
                    priceEl.textContent = `+${price.toLocaleString()}`;
                    priceEl.classList.add("text-blue-500");
                } else {
                    priceEl.textContent = price.toLocaleString();
                    priceEl.classList.add("text-red-500");
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
    },
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
            // --- 2. 日時情報の反映（日付マスク適用） ---
            // 公開検索結果のため、正確な作成日ではなく「訪問時期（マスク済み）」を表示する
            // const maskedDate = $Util.GetMaskedDate(item.memo_date);
            $Dom.QuerySelector(".js-create-tim", child).textContent = `${item.memo_date} ${item.memo_time || ""}`;
            $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim);
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
        this._core.open({ title: "SEARCH RESULTS", content: el });
    },
    // まとめ親一覧選択
    ShowArchiveList_2() {
        $Warn.CatchAsync(async () => {
            const isSuccess = await $Data.Access.GetArchiveList();
            if (!isSuccess) return;
            const root = $Dom.GenerateTemplate("tpl-list-parent");
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
                    // 要素取得
                    $Dom.QuerySelector(".js-title", child).textContent = item.title;
                    $Dom.QuerySelector(".js-update-tim", child).textContent = $Util.FormatDate(item.update_tim);
                    $Dom.QuerySelector(".js-memo", child).textContent = item.memo || "";
                    $Dom.QuerySelector(".js-count", child).textContent = item.detail_count || "0";
                    const leftBorder = $Dom.QuerySelector(".js-item-border", child);
                    const countBadge = $Dom.QuerySelector(".js-count-badge", child);
                    // 
                    if (isPublicGroup) {
                        if (item.closed_flg) {
                            // CLOSE (灰)
                            leftBorder.classList.add("bg-slate-400");
                            countBadge.classList.add("bg-slate-400");
                        } else {
                            // OPEN (テーマカラー)
                            leftBorder.classList.add("bg-brand-5");
                            countBadge.classList.add("bg-brand-5");
                        }
                    } else {
                        // PRIVATE (黒)
                        leftBorder.classList.add("bg-slate-800");
                        countBadge.classList.add("bg-slate-800");
                    }
                    // // バッヂ適用
                    // const badgeContainer = $Dom.QuerySelector(".js-badge", child);
                    // let sIdx = 0; // Private
                    // if (item.is_public) {
                    //     sIdx = item.closed_flg ? 1 : 2; // 1:Close, 2:Open
                    // }
                    // $Util.ApplyBadge(badgeContainer, sIdx);
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
                listContainer.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-400 py-10">合致するまとめがありません</div>`;
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
        this._core.open({ title: "ARCHIVE LIST", content: root, help: "上部の入力欄から検索できます。" });
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
                title: "SELECT ARCHIVE",
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
                            title: "title-" + $Util.FormatDate(new Date(), 'YYYYMMDD_HHmmss'),
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
    ShowArchiveInfo_2() {
        const archive = $Data.Store.GetArchive();
        // 管理者かどうかの判定
        const isAdmin = $App.AppData.Context.IsLoggedIn && $App.AppData.Owner.plan === "Admin";
        //
        const el = $Dom.GenerateTemplate('tpl-view-archive');
        const renderView = () => {
            // ① 常に最新のデータを取得
            const currentArchive = $Data.Store.GetArchive(); 
            // ステータスバッジの表示制御
            const bPrivate = $Dom.QuerySelector('#badge-private', el);
            const bClose = $Dom.QuerySelector('#badge-close', el);
            const bOpen = $Dom.QuerySelector('#badge-open', el);
            // 一旦すべて「非アクティブ（グレー文字・背景透明）」にリセット
            const inactiveClass = "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[0.7rem] font-black transition-all tracking-wider text-slate-300";
            bPrivate.className = inactiveClass;
            bClose.className = inactiveClass;
            bOpen.className = inactiveClass;
            // 状態に応じて1つだけ「アクティブ（色付き・影あり）」にする
            const activeBaseClass = "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[0.7rem] font-black transition-all tracking-wider text-white shadow-md ";
            if (!currentArchive.is_public) {
                // PRIVATE (黒系)
                bPrivate.className = activeBaseClass + "bg-slate-900";
            } else if (currentArchive.closed_flg) {
                // CLOSE (グレー系)
                bClose.className = activeBaseClass + "bg-slate-400";
            } else {
                // OPEN (赤系)
                bOpen.className = activeBaseClass + "bg-red-500";
            }
            // ② タイトルと本文の反映
            $Dom.QuerySelector('#view-mem-title', el).textContent = currentArchive.title || "";
            $Dom.QuerySelector('#view-mem-body', el).textContent = currentArchive.memo || "";
            // ③ リンクの反映（すべて currentArchive を参照するように統一）
            // const viewUrl = $Dom.QuerySelector('#view-mem-url', el);
            if (currentArchive.link_url) {
                const iconHtml = $Util.GetUrlIconHtml(currentArchive.link_url, 28);
                // viewUrl.href = currentArchive.link_url;
                viewUrl.onclick = () => $Util.OpenSafeUrl(currentArchive.link_url);
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
            const displayCurrency = currentArchive.currency_unit || $App.AppData.Owner.Currency_unit || 'JPY';
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
            $Dom.QuerySelector('#view-mem-user-id', el).textContent = profile.nick_name;
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
                        "このまとめを[Public]に設定しますか？",
                        "[Public]に設定しました。",
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
                        "このまとめを[Private]に戻しますか？",
                        "単体のメモに戻しました。",
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
                            "このまとめを[Open]に切り替えますか？",
                            "[Open]に切り替えました。",
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
                            "このまとめを[Close]に切り替えますか？",
                            "[Close]に切り替えました。",
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
                        "このまとめを[Private]に戻しますか？",
                        "[Private]に戻しました。",
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
                        const isOk = await this.ShowConfirm({
                            title: "ADMIN: CLOSE",
                            help: "",
                            message: "【注意】\n強制的にClose状態にしますか？"
                        });
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
                    const isOk = await this.ShowConfirm({
                        title: "ADMIN: UNPUBLISH",
                        help: "",
                        message: "【警告】\n強制的にPrivate(公開停止)に戻しますか？"
                    });
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
    // まとめ親詳細参照（アーカイブ）
    ShowArchiveInfo() {
        const archive = $Data.Store.GetArchive();
        const isAdmin = $App.AppData.Context.IsLoggedIn && $App.AppData.Owner.plan === "Admin";
        const el = $Dom.GenerateTemplate('tpl-view-archive');
        const renderView = () => {
            const currentArchive = $Data.Store.GetArchive();
            // ==========================================
            // ▼ ステータスボタンの表示・スタイル切替
            // ==========================================
            const statusBar = $Dom.QuerySelector('#archive-status-bar', el);
            const btnMemo = $Dom.QuerySelector('#btn-status-memo', el);
            const btnPrivate = $Dom.QuerySelector('#btn-status-private', el);
            const btnClose = $Dom.QuerySelector('#btn-status-close', el);
            const btnOpen = $Dom.QuerySelector('#btn-status-open', el);
            // スタイル定義（通常時 vs 現在地）
            // const styleBase = "flex-1 h-11 font-black text-[0.75rem] rounded-[0.5rem] tracking-wider outline-none";
            const styleActive = ` bg-white text-slate-600 shadow-md border border-slate-200 active:scale-95 transition-all`;
            const styleCurrent = ` bg-brand-5 text-white shadow-inner border border-brand-5 cursor-default`;
            const styleDisabled = ` bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed`;
            // ボタンスタイルとテキストを適用するヘルパー関数
            const setBtnStyle = (btn, isCurrent, isEnabled, text) => {
                if (text.length > 0) btn.textContent = text;
                if (!isEnabled) {
                    btn.disabled = true;
                    btn.onclick = null;
                    btn.className += styleDisabled;
                    return;
                }
                btn.disabled = false;
                if (isCurrent) {
                    btn.onclick = null;
                    btn.className += styleCurrent;
                } else {
                    btn.className += styleActive;
                }
            };
            // 一旦すべて非表示にリセット
            if (currentArchive.is_owner) {
                $Dom.ToggleShow(statusBar, true);
                if (!currentArchive.is_public) {
                    // ① PRIVATE 状態 [ 1> memo | (2> private) | 3> public ]
                    setBtnStyle(btnMemo, false, true, "memo");
                    setBtnStyle(btnPrivate, true, true, "");
                    setBtnStyle(btnClose, false, true, "public");
                    setBtnStyle(btnOpen, false, false, "open");
                    btnMemo.onclick = () => this._execStatusChange('DeleteArchive', { archive_id: currentArchive.archive_id }, "RESTORE TO DETAILS", "まとめを解体し、単独のメモに戻しますか？", "単体のメモに戻しました。", $Const.SCREEN_MODE.CREATE);
                    btnClose.onclick = () => this._execStatusChange('PublishArchive', { archive_id: currentArchive.archive_id }, "SWITCH TO CLOSE", "まとめを [CLOSE] 状態にしますか？", "[CLOSE] 状態に移行しました。", $Const.SCREEN_MODE.ARCHIVE_PUB, () => $Data.Store.UpdateArchive({ is_public: true, closed_flg: true }));
                } else if (currentArchive.closed_flg) {
                    // ② CLOSE 状態 [ 2> private | (3> close) | 4> open ]
                    setBtnStyle(btnMemo, false, false, "memo");
                    setBtnStyle(btnPrivate, false, true, "private");
                    setBtnStyle(btnClose, true, true, "close");
                    setBtnStyle(btnOpen, false, true, "open");
                    btnPrivate.onclick = () => this._execStatusChange('UnpublishArchive', { archive_id: currentArchive.archive_id }, "SWITCH TO PRIVATE", "完全に非公開 (PRIVATE) に戻しますか？", "[PRIVATE] に戻しました。", $Const.SCREEN_MODE.ARCHIVE, () => $Data.Store.UpdateArchive({ is_public: false, closed_flg: false }));
                    btnOpen.onclick = () => this._execStatusChange('OpenArchive', { archive_id: currentArchive.archive_id }, "SWITCH TO OPEN", "マップ上に公開 (OPEN) しますか？", "[OPEN] に切り替えました。", null, () => $Data.Store.UpdateArchive({ closed_flg: false }));
                } else {
                    // ③ OPEN 状態 [ 2> private | 3> close | (4> open) ]
                    setBtnStyle(btnMemo, false, false, "memo");
                    setBtnStyle(btnPrivate, false, true, "private");
                    setBtnStyle(btnClose, false, true, "close");
                    setBtnStyle(btnOpen, true, true, "open");
                    btnPrivate.onclick = () => this._execStatusChange('UnpublishArchive', { archive_id: currentArchive.archive_id }, "SWITCH TO PRIVATE", "完全に非公開 (PRIVATE) に戻しますか？", "[PRIVATE] に戻しました。", $Const.SCREEN_MODE.ARCHIVE, () => $Data.Store.UpdateArchive({ is_public: false, closed_flg: false }));
                    btnClose.onclick = () => this._execStatusChange('CloseArchive', { archive_id: currentArchive.archive_id }, "SWITCH TO CLOSE", "公開を一時停止 (CLOSE) しますか？", "[CLOSE] に切り替えました。", null, () => $Data.Store.UpdateArchive({ closed_flg: true }));
                }
            } else {
                // オーナー以外は非表示
                $Dom.ToggleShow(statusBar, false);
            }
            // タイトルと本文の反映
            $Dom.QuerySelector('#view-mem-title', el).textContent = currentArchive.title || "";
            $Dom.QuerySelector('#view-mem-body', el).textContent = currentArchive.memo || "";
            // --- URLリンクの反映（スクロール領域内） ---
            const urlWrapper = $Dom.QuerySelector('#view-mem-url-wrapper', el);
            if (currentArchive.link_url) {
                $Dom.ToggleShow(urlWrapper, true);
                urlWrapper.innerHTML = ""; // コンテナをクリア
                // サーバー送信用パラメータ (AddClickReq 形式)
                const params = {
                    target_type: 2, // ClickTargetType.Archive
                    target_user_id: currentArchive.user_id,
                    archive_id: currentArchive.archive_id,
                    item_name: "link_url"
                };
                // ジェネレータでボタンを生成（第3引数に is_owner を渡す）
                const btn = $UI.Generator.LinkButton(currentArchive.link_url, params, currentArchive.is_owner);
                if (btn) urlWrapper.appendChild(btn);
            } else {
                $Dom.ToggleShow(urlWrapper, false);
            }
            // 件数の反映
            const details = $Data.Store.GetDetails() || [];
            $Dom.QuerySelector('#mem-stat-count', el).textContent = details.length;
            $Dom.QuerySelector('#btn-view-mem-timeline', el).onclick = () => {
                this.ShowDetailsTimeLine();
            };
            // --- 距離の計算と表示 ---
            const totalKm = $Util.GetTotalDistance(details);
            const distVal = $Dom.QuerySelector('#mem-stat-distance', el);
            // 1km未満なら小数点第2位まで、1km以上なら小数点第1位くらいが見やすい
            distVal.textContent = totalKm < 1 ? totalKm.toFixed(2) + ' km' : totalKm.toFixed(1) + ' km';
            // 金額の反映
            const totalPrice = details.reduce((sum, item) => sum + Number(item.memo_price || 0), 0);
            const priceVal = $Dom.QuerySelector('#mem-stat-price', el);
            const priceUnit = $Dom.QuerySelector('#view-mem-price-unit', el);
            const displayCurrency = currentArchive.currency_unit || $App.AppData.Owner.Currency_unit || 'JPY';
            priceUnit.textContent = displayCurrency;
            if (totalPrice > 0) {
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
        // 初期描画の実行
        renderView();
        // --- ユーザー情報の表示設定（Generatorによる部品注入へ置換） ---
        const userWrapper = $Dom.QuerySelector('#view-mem-user-wrapper', el);
        userWrapper.innerHTML = ""; // コンテナをクリア
        const profile = $Data.Store.GetUserProfile();
        if (profile) {
            // ジェネレータでプロフィールボタンを生成して追加
            const userBtn = $UI.Generator.UserBadge(profile, { type: 'button', isOwner: archive.is_owner });
            if (userBtn) userWrapper.appendChild(userBtn);
        } else {
            $Dom.ToggleShow(userWrapper, false);
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
        const dialogButtons = [];
        // // --- 管理者専用ボタン ---
        // if (isAdmin && archive.is_public && !archive.is_owner) {
        //     if (!archive.closed_flg) {
        //         dialogButtons.push([{
        //             label: "【ADMIN】強制 Close",
        //             className: "bg-red-500 text-white shadow-md",
        //             handler: async () => {
        //                 const isOk = await this.ShowConfirm({ title: "ADMIN: CLOSE", help: "", message: "【注意】\n強制的にClose状態にしますか？" });
        //                 if (!isOk) return;
        //                 const isSuccess = await $Data.Access.AdminCloseArchive({ archive_id: archive.archive_id, target_user_id: archive.user_id });
        //                 if (!isSuccess) return;
        //                 $Notice.Info("強制的にCloseしました");
        //                 this._core.closeAll();
        //                 $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
        //                 await $App.RefreshScreen();
        //             }
        //         }]);
        //     }
        //     dialogButtons.push([{
        //         label: "【ADMIN】強制 Privateに戻す",
        //         className: "bg-white text-red-600 border-2 border-red-500 shadow-sm",
        //         handler: async () => {
        //             const isOk = await this.ShowConfirm({ title: "ADMIN: UNPUBLISH", help: "", message: "【警告】\n強制的にPrivate(公開停止)に戻しますか？" });
        //             if (!isOk) return;
        //             const isSuccess = await $Data.Access.AdminUnpublishArchive({ archive_id: archive.archive_id, target_user_id: archive.user_id });
        //             if (!isSuccess) return;
        //             $Notice.Info("強制的にPrivateに戻しました");
        //             this._core.closeAll();
        //             $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
        //             await $App.RefreshScreen();
        //         }
        //     }]);
        // }
        this._core.open({
            title: "Archive info",
            content: el,
            help: "",
            headerButtons: headerButtons,
            buttons: dialogButtons, // 一般ユーザーはダイアログ下部フッター(buttons)は無し
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
        const btnSubClass = "bg-white text-slate-600 border border-slate-300 shadow-md font-bold";
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
            title: "CHANGE STATUS",
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
            title: "EDIT ARCHIVE",
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
                $Notice.Info("URLをクリップボードにコピーしました！");
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