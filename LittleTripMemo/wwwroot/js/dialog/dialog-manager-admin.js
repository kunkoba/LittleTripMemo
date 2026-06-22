export default {
    // 【管理者機能】管理者メニュー
    ShowAdminMenu() {
        const el = $Dom.GenerateTemplate('tpl-menu-admin');
        $Dom.QuerySelector('#btn-admin-notice', el).onclick = () => this.ShowAdminNoticeList();
        $Dom.QuerySelector('#btn-admin-report', el).onclick = () => this.ShowAdminReportList();
        $Dom.QuerySelector('#btn-admin-feedback', el).onclick = () => this.ShowAdminFeedbackList();
        $Dom.QuerySelector('#btn-admin-user-mail', el).onclick = () => this.ShowAdminUserMailList();
        this._core.open({
            title: "ADMIN TOOLS",
            content: el,
            help: "",
        });
    },
    // 通知管理リスト（API通信化）
    async ShowAdminNoticeList() {
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
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim);
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
                        this._core.close(); // 一覧も閉じて
                        this.ShowAdminNoticeList(); // 最新データで再度一覧を開く
                    });
                };
                root.appendChild(child);
            });
        };
        await renderList();
        //
        this._core.open({
            title: "NOTICE Mgmt",
            content: root,
            help: "システム全体への通知を管理します。\n下のボタンから新規作成、一覧の項目タップで編集が可能です。",
            // 新規登録ボタンをここ（下部ボタンエリア）に配置
            buttons: [
                {
                    label: "＋ CREATE",
                    className: "w-full bg-brand-5 text-white shadow-md font-black",
                    handler: () => {
                        this.ShowAdminNoticeEdit(null, () => {
                            this._core.close(); // 一覧を閉じる
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
        inptBody.addEventListener('input', () => {
            countBody.textContent = inptBody.value.length;
        });
        $Dom.QuerySelector('#btn-clear-notice-from', el).onclick = () => inptFrom.value = "";
        $Dom.QuerySelector('#btn-clear-notice-to', el).onclick = () => inptTo.value = "";
        //
        this._core.open({
            title: isNew ? "NEW NOTICE" : "EDIT NOTICE",
            content: el,
            help: "",
            isFooterFixed: false,   // 編集用
            buttons:[[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
						this._core.close();
                    },
                },
                {
                    label: "SAVE",
                    className: "bg-brand-5 text-white shadow-md",
                    handler: async () => {
                        // 確認画面
                        const isOk = await this.ShowConfirm({ 
                            title: isNew ? "NEW NOTICE" : "EDIT NOTICE",
                            help: "", 
                            message: "通知情報を保存しますか？" 
                        });
                        if (!isOk) return;
                        // 未入力時のデフォルト値判定
                        const fromVal = inptFrom.value.trim() || $Util.FormatDate(new Date(), 'YYYY-MM-DD');
                        const toVal   = inptTo.value.trim()   || "2099-12-31";
                        const req = {
                            seq: target.seq,
                            title: inptTitle.value.trim() || "No Title",
                            body: inptBody.value.trim(),
                            link_url: inptUrl.value.trim(),
                            kind: Number(selKind.value),
                            disp_from: fromVal + "T00:00:00",
                            disp_to:   toVal   + "T23:59:59"
                        };
                        const isSuccess = await $Data.Access.UpsertNotification(req);
                        if (!isSuccess) return;
                        $Notice.Info("保存しました。");
                        await $Data.Access.GetAdminAllInfo();
                        this._core.close(); // 編集ダイアログを閉じる
                        if (onSaved) onSaved(); // 親画面の再描画コールバック
                    }
                }
            ]]
        });
    },
    // 通報集計一覧（API通信化）
    async ShowAdminReportList() {
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
        this._core.open({
            title: "REPORT Mgmt",
            content: root,
            help: "",
            buttons:[]
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
        // 
        const reports = $Data.resData.reports || [];
        const el = $Dom.GenerateTemplate("tpl-admin-report-detail");
        // アーカイブタイトルの反映
        $Dom.QuerySelector(".js-archive-title", el).textContent = summaryItem.archive_title || "Unknown Title";
        // --- ターゲットユーザーボタンの設定 ---
        const userWrapper = $Dom.QuerySelector("#view-report-target-user-wrapper", el);
        userWrapper.innerHTML = "";
        const profile = $Data.resData.target_userProfile;
        if (profile) {
            const userBtn = $UI.Generator.UserBadge(profile, { type: 'button', isOwner: false });
            if (userBtn) userWrapper.appendChild(userBtn);
        }
        // 1. 各種ボタンの取得
        const btnOpen    = $Dom.QuerySelector("#btn-admin-report-open", el);
        const btnClose   = $Dom.QuerySelector("#btn-admin-report-close", el);
        const btnPrivate = $Dom.QuerySelector("#btn-admin-report-private", el);
        // 2. Open（まとめを開く）
        btnOpen.onclick = async () => {
            const isOk = await this.ShowConfirm({ title: "JUMP", message: "この Public まとめデータを開きますか？" });
            if (!isOk) return;
            this._core.closeAll();
            $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
            $App.AppData.Context.TargetArchiveId = summaryItem.archive_id;
            await $App.RefreshScreen();
        };
        // 3. Close（強制クローズ：URLを知っている人だけ見れる状態へ）
        btnClose.onclick = async () => {
            const isOk = await this.ShowConfirm({ title: "FORCE CLOSE", message: "強制的に公開停止(Close)にしますか？" });
            if (!isOk) return;
            const isSuccess = await $Data.Access.AdminCloseArchive({ 
                archive_id: summaryItem.archive_id, 
                target_user_id: summaryItem.target_user_id 
            });
            if (isSuccess) {
                $Notice.Info("強制的にCloseしました");
                this._core.closeAll();
            }
        };
        // 4. Delete（強制Private：本人以外一切見れない状態へ戻す）
        btnPrivate.onclick = async () => {
            const isOk = await this.ShowConfirm({ title: "FORCE PRIVATE", message: "強制的に非公開(Private)に戻しますか？" });
            if (!isOk) return;
            const isSuccess = await $Data.Access.AdminUnpublishArchive({ 
                archive_id: summaryItem.archive_id, 
                target_user_id: summaryItem.target_user_id 
            });
            if (isSuccess) {
                $Notice.Info("非公開に戻しました");
                this._core.closeAll();
            }
        };
        // 下部の通報理由リスト描画
        const listContainer = $Dom.QuerySelector("#admin-report-detail-list", el);
        if (reports.length === 0) {
            listContainer.innerHTML = `<div class="text-[0.7rem] text-slate-400 p-2">詳細データがありません</div>`;
        } else {
            // 降順ソートしてからリスト化
            reports.sort((a, b) => new Date(b.report_tim) - new Date(a.report_tim)).forEach(rep => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-item");
                $Dom.QuerySelector(".js-report-tim", child).textContent = $Util.FormatDate(rep.report_tim);
                $Dom.QuerySelector(".js-report-body", child).textContent = rep.body || "（内容なし）";
                child.classList.add("cursor-pointer", "active:bg-slate-50");
                child.onclick = () => this.ShowAdminReportItemDetail(rep);
                listContainer.appendChild(child);
            });
        }
        this._core.open({
            title: "REPORT DETAILS",
            content: el,
            help: "",
            buttons: []
        });
    },
    // 【管理者機能】通報1件の全文詳細を表示
    async ShowAdminReportItemDetail(rep) {
        const el = $Dom.GenerateTemplate("tpl-admin-report-item-detail");
        // 1. 日時と本文の反映
        $Dom.QuerySelector(".js-report-tim", el).textContent = $Util.FormatDate(rep.report_tim);
        $Dom.QuerySelector(".js-report-body", el).textContent = rep.body || "（内容なし）";
        // // 2. ユーザーボタンの反映（アイコン＋ニックネーム）
        // const userIcon = $Dom.QuerySelector("#view-report-user-icon", el);
        // const userName = $Dom.QuerySelector("#view-report-user-name", el);
        // const btnUser = $Dom.QuerySelector("#btn-report-reporter-profile", el);
        // // サーバーから渡されている通報者の情報を反映
        // userIcon.textContent = rep.icon || "👤";
        // userName.textContent = rep.nick_name || "Unknown User";
        // ▼ 修正：共通のUIジェネレータでボタンを生成して追加
        // （※通報者のIDは reporter_user_id というプロパティ名に注意）
        const userWrapper = $Dom.QuerySelector("#view-report-user-wrapper", el);
        userWrapper.innerHTML = "";
        const userBtn = $UI.Generator.UserBadge({
            icon: rep.icon,
            nick_name: rep.nick_name,
            user_id: rep.reporter_user_id
        }, { type: 'button', isOwner: false });
        if (userBtn) userWrapper.appendChild(userBtn);
        // // ボタンクリック時のアクション
        // btnUser.onclick = async () => {
        //     // APIで対象ユーザーのフルプロフィールを取得
        //     const isSuccess = await $Data.Access.GetUserProfile({ target_user_id: rep.reporter_user_id });
        //     if (isSuccess) {
        //         // $Data.resData (最新レスポンス) から、先ほど取得したプロフィールを抽出
        //         const profile = $Data.resData;
        //         // 標準のプロフィール画面を表示 (編集不可モード)
        //         this.ShowUserProfile(profile, false);
        //     }
        // };
        this._core.open({
            title: "REPORT CONTENT",
            content: el,
            help: "",
            buttons: []
        });
    },
    // 【管理者機能】フィードバックリスト
    async ShowAdminFeedbackList(currentScore = 0) {
        const isSuccess = await $Data.Access.GetAllFeedback({ score: currentScore });
        if (!isSuccess) return;
        // 新設した「検索バー付き」テンプレートを使用
        const frame = $Dom.GenerateTemplate("tpl-admin-feedback-list-parent");
        const listContainer = $Dom.QuerySelector("#feedback-list-container", frame);
        const scoreButtons = $Dom.QuerySelectorAll(".js-score-btn", frame);
        // 1. ボタンの状態（色）を現在のスコアに合わせて設定
        scoreButtons.forEach(btn => {
            const score = parseInt(btn.dataset.score);
            if (score === currentScore) {
                btn.classList.add("bg-brand-5", "text-white", "shadow-md");
            } else {
                btn.classList.add("text-slate-400");
                // クリック時にスコアを指定して再検索
                btn.onclick = async () => {
                    this._core.close(); // 現在の一覧を閉じる
                    this.ShowAdminFeedbackList(score); // 指定スコアで開き直す
                };
            }
        });
        // 2. リストの描画
        const feedbackList = $App.AppData.Admin.feedbackList || [];
        if (feedbackList.length === 0) {
            listContainer.innerHTML = `<div class="text-center text-[0.7rem] font-bold text-slate-400 py-10">データはありません。</div>`;
        } else {
            feedbackList.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-feedback");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim);
                $Dom.QuerySelector(".js-score", child).textContent = "★".repeat(item.score) + "☆".repeat(5 - item.score);
                $Dom.QuerySelector(".js-body", child).textContent = item.body || "（内容なし）";
                child.onclick = () => this.ShowAdminFeedbackDetail(item);
                listContainer.appendChild(child);
            });
        }
        this._core.open({
            title: "FEEDBACK Mgmt",
            content: frame,
            help: "",
        });
    },
    // 【管理者機能】フィードバック詳細
    ShowAdminFeedbackDetail(item) {
        const el = $Dom.GenerateTemplate("tpl-admin-feedback-detail");
        $Dom.QuerySelector(".js-date", el).textContent = $Util.FormatDate(item.update_tim);
        $Dom.QuerySelector(".js-score", el).textContent = "★".repeat(item.score) + "☆".repeat(5 - item.score);
        $Dom.QuerySelector(".js-body", el).textContent = item.body || "（内容なし）";
        // --- ユーザーボタンへの反映 ---
        // const userIcon = $Dom.QuerySelector("#view-feedback-user-icon", el);
        // const userName = $Dom.QuerySelector("#view-feedback-user-name", el);
        // const btnUser = $Dom.QuerySelector("#btn-feedback-user-profile", el);
        // userIcon.textContent = item.icon || "👤";
        // userName.textContent = item.nick_name || "Unknown User";
        const userWrapper = $Dom.QuerySelector("#view-feedback-user-wrapper", el);
        userWrapper.innerHTML = "";
        const userBtn = $UI.Generator.UserBadge({
            icon: item.icon,
            nick_name: item.nick_name,
            user_id: item.user_id
        }, { type: 'button', isOwner: false });
        if (userBtn) userWrapper.appendChild(userBtn);
        // btnUser.onclick = async () => {
        //     const isSuccess = await $Data.Access.GetUserProfile({ target_user_id: item.user_id });
        //     if (isSuccess) {
        //         const profile = $Data.resData;
        //         // $Data.resData から取得したプロフィールを表示
        //         this.ShowUserProfile(profile, false);
        //     }
        // };
        this._core.open({
            title: "FEEDBACK DETAILS",
            content: el,
            help: "",
            headerButtons: []
        });
    },
    // 【管理者機能】個別通知送信ダイアログ
    ShowAdminSendUserNotification(profile) {
        if (!profile) return $Notice.Warn("ユーザー情報が不明です");
        const el = $Dom.GenerateTemplate("tpl-admin-send-user-notification");
        // --- 1. 宛先ユーザー情報の反映 ---
        // $Dom.QuerySelector('#admin-send-target-icon', el).textContent = profile.icon;
        // $Dom.QuerySelector('#admin-send-target-name', el).textContent = profile.nick_name;
        // ▼ 修正：宛先としてバッジタイプのUI部品を生成して追加
        // （メッセージ作成中にプロフィール画面に飛ぶと不自然なので、ここは 'badge' 形式を指定します）
        const userWrapper = $Dom.QuerySelector('#admin-send-target-user-wrapper', el);
        userWrapper.innerHTML = "";
        const userBadge = $UI.Generator.UserBadge({
            icon: profile.icon,
            nick_name: profile.nick_name,
            user_id: profile.user_id
        }, { type: 'badge' });
        if (userBadge) userWrapper.appendChild(userBadge);
        // --- 2. メッセージ用アイコン選択 (明細入力風) ---
        const previewEmoji = $Dom.QuerySelector('#admin-send-emoji-preview', el);
        const inputKind = $Dom.QuerySelector('#admin-send-emoji-val', el); // 内部的に ID は reuse
        let currentKind = $Const.USER_NOTICE_KIND.INFO;
        inputKind.value = currentKind.id;
        previewEmoji.textContent = `${currentKind.emoji} ${currentKind.label}`;

        $Dom.QuerySelector('#btn-admin-send-emoji-trigger', el).onclick = () => {
            // 3つの種別を順番に切り替える単純なトグル（または選択肢が少ないのでこれで十分）
            const kinds = Object.values($Const.USER_NOTICE_KIND);
            let nextIdx = (kinds.findIndex(k => k.id === Number(inputKind.value)) + 1) % kinds.length;
            const nextKind = kinds[nextIdx];
            inputKind.value = nextKind.id;
            previewEmoji.textContent = `${nextKind.emoji} ${nextKind.label}`;
            previewEmoji.className = "text-[1.2rem] font-bold py-1"; // テキストが出るのでサイズ調整
        };
        // --- 3. 本文入力の設定 ---
        const inputBody = $Dom.QuerySelector('#admin-send-body', el);
        const countBody = $Dom.QuerySelector('#admin-send-body-count', el);
        countBody.textContent = inputBody.value.length;
        inputBody.addEventListener('input', () => countBody.textContent = inputBody.value.length);
        this._core.open({
            title: "SEND MAIL",
            content: el,
            help: "",
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => this._core.close()
                },
                {
                    label: "SEND",
                    handler: async () => {
                        const body = inputBody.value.trim();
                        if (!body) return $Notice.Warn("本文を入力してください");
                        // パスワード制御
                        if (await $Util.CheckAdminAuth()) {
                            const isSuccess = await $Data.Access.SendUserNotification({
                                target_user_id: profile.user_id,
                                kind: Number(inputKind.value), // emoji ではなく kind を送る
                                body: body
                            });
                            if (isSuccess) {
                                $Notice.Info("通知を送信しました。");
                                this._core.close();
                            }
                        }
                    }
                }
            ]]
        });
    },
    // 【管理者機能】ユーザーメール一覧
    async ShowAdminUserMailList() {
        const mails = $App.AppData.Admin.userMailList  || []; // API側で notifications に格納される想定
        const root = $Dom.GenerateTemplate("tpl-list-parent");
        if (mails.length === 0) {
            root.innerHTML = `<div class="text-center text-[0.8rem] font-bold text-slate-400 py-6">送信済みメッセージはありません</div>`;
        } else {
            mails.forEach(item => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-user-mail");
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.send_tim);
                // --- 宛先ユーザー表示（Generator: badgeモードを使用） ---
                const userWrapper = $Dom.QuerySelector(".js-user-wrapper", child);
                userWrapper.innerHTML = ""; // コンテナをクリア
                const badge = $UI.Generator.UserBadge({
                    icon: item.icon,
                    nick_name: item.nick_name || item.user_id.slice(0, 8),
                    user_id: item.user_id
                }, { type: 'badge' });
                if (badge) userWrapper.appendChild(badge);
                // 
                const kindObj = Object.values($Const.USER_NOTICE_KIND).find(k => k.id === item.kind) || $Const.USER_NOTICE_KIND.INFO;
                $Dom.QuerySelector(".js-emoji", child).textContent = kindObj.emoji; // リスト時
                $Dom.QuerySelector(".js-body", child).textContent = item.body;
                child.onclick = () => this.ShowAdminUserMailDetail(item);
                root.appendChild(child);
            });
        }
        this._core.open({
            title: "USER MESSAGE LOG",
            content: root,
            help: "",
        });
    },
    // 【管理者機能】ユーザーメール詳細
    ShowAdminUserMailDetail(item) {
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        // --- 2. ユーザー情報ボタンを表示・設定する ---
        const userWrapper = $Dom.QuerySelector('#view-notice-user-wrapper', el);
        userWrapper.innerHTML = ""; // コンテナをクリア
        $Dom.ToggleShow(userWrapper, true);
        $Dom.ToggleShow($Dom.QuerySelector('#view-notice-title-area', el), false);
        // --- 差出人表示（Generator: buttonモードを使用） ---
        const userBtn = $UI.Generator.UserBadge({
            icon: item.icon,
            nick_name: item.nick_name || item.user_id.slice(0, 8),
            user_id: item.user_id
        }, { type: 'button', isOwner: false });
        if (userBtn) userWrapper.appendChild(userBtn);
        // 右上のメール（封筒）アイコンなど
        const kindObj = Object.values($Const.USER_NOTICE_KIND).find(k => k.id === item.kind) || $Const.USER_NOTICE_KIND.INFO;
        $Dom.QuerySelector('#view-notice-icon', el).textContent = kindObj.emoji; // 詳細時
        // 送信日時
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        // 本文（全文表示）
        $Dom.QuerySelector('#view-notice-body', el).textContent = item.body;
        this._core.open({
            title: "MESSAGE DETAILS (ADMIN)",
            content: el,
            help: "",
            headerButtons: []
        });
    },
};