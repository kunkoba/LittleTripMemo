export default {
    // 以下のメソッドを移動してきてください。
    // - ShowAdminMenu()
    // - ShowAdminNoticeList()
    // - ShowAdminNoticeEdit()
    // - ShowAdminReportList()
    // - ShowAdminReportDetail()
    // - ShowAdminFeedbackList()
    // - ShowAdminFeedbackDetail()
    // - ShowAdminSendUserNotification()
    // - ShowAdminReportItemDetail()
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
        // const isSuccess = await $Data.Access.GetAllNotifications({});
        // if (!isSuccess) return;
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
            // ★ 新規登録ボタンをここ（下部ボタンエリア）に配置
            buttons: [
                {
                    label: "＋ CREATE NEW NOTICE",
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
        this._core.open({
            title: isNew ? "NEW NOTICE" : "EDIT NOTICE",
            content: el,
            help: "",
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
                        this._core.close(); // 編集ダイアログを閉じる
                        if (onSaved) onSaved(); // 親画面の再描画コールバック
                    }
                }
            ]]
        });
    },
    // 通報集計一覧（API通信化）
    async ShowAdminReportList() {
        // const isSuccess = await $Data.Access.GetReportSummary({ min_count: 0 });
        // if (!isSuccess) return;
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
        const reports = $Data.resData.reports || [];
        const el = $Dom.GenerateTemplate("tpl-admin-report-detail");
        // --- ターゲットユーザーボタンの設定 ---
        const targetIcon = $Dom.QuerySelector("#view-report-target-icon", el);
        const targetName = $Dom.QuerySelector("#view-report-target-name", el);
        const btnTarget = $Dom.QuerySelector("#btn-report-target-profile", el);
        const profile = $Data.resData.target_userProfile;
        if (profile) {
            targetIcon.textContent = profile.icon || "👤";
            targetName.textContent = profile.nick_name || "Unknown User";
            // ボタンクリックでターゲットユーザーのプロフィールを表示
            btnTarget.onclick = async () => {
                this.ShowUserProfile(profile, false);
            };
        }
        // アーカイブタイトルの反映
        $Dom.QuerySelector(".js-archive-title", el).textContent = summaryItem.archive_title || "Unknown Title";
        // 下部の通報理由リスト描画
        const listContainer = $Dom.QuerySelector("#admin-report-detail-list", el);
        if (reports.length === 0) {
            listContainer.innerHTML = `<div class="text-[0.7rem] text-slate-400 p-2">詳細データがありません</div>`;
        } else {
            reports.sort((a, b) => new Date(b.report_tim) - new Date(a.report_tim)).forEach(rep => {
                const child = $Dom.GenerateTemplate("tpl-admin-list-child-report-item");
                $Dom.QuerySelector(".js-report-tim", child).textContent = $Util.FormatDate(rep.report_tim, 'YYYY-MM-DD　HH:mm');
                $Dom.QuerySelector(".js-report-body", child).textContent = rep.body || "（内容なし）";
                child.classList.add("cursor-pointer", "active:bg-slate-50");
                child.onclick = () => this.ShowAdminReportItemDetail(rep);
                listContainer.appendChild(child);
            });
        }
        this._core.open({
            title: "REPORT DETAILS",
            content: el,
            buttons: [
                {
                    label: "🔗 OPEN PUBLIC ARCHIVE",
                    className: "bg-red-500 text-white shadow-md",
                    handler: async () => {
                        const isOk = await this.ShowConfirm({ title: "OPEN ARCHIVE", message: "この Public まとめデータを開きますか？" });
                        if (!isOk) return;
                        this._core.closeAll();
                        $App.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
                        $App.AppData.Context.TargetArchiveId = summaryItem.archive_id;
                        await $App.RefreshScreen();
                    }
                }
            ]
        });
    },
    // 【管理者機能】通報1件の全文詳細を表示
    async ShowAdminReportItemDetail(rep) {
        const el = $Dom.GenerateTemplate("tpl-admin-report-item-detail");
        // 1. 日時と本文の反映
        $Dom.QuerySelector(".js-report-tim", el).textContent = $Util.FormatDate(rep.report_tim, "YYYY-MM-DD　HH:mm");
        $Dom.QuerySelector(".js-report-body", el).textContent = rep.body || "（内容なし）";
        // 2. ユーザーボタンの反映（アイコン＋ニックネーム）
        const userIcon = $Dom.QuerySelector("#view-report-user-icon", el);
        const userName = $Dom.QuerySelector("#view-report-user-name", el);
        const btnUser = $Dom.QuerySelector("#btn-report-reporter-profile", el);
        // サーバーから渡されている通報者の情報を反映
        userIcon.textContent = rep.icon || "👤";
        userName.textContent = rep.nick_name || "Unknown User";
        // ボタンクリック時のアクション
        btnUser.onclick = async () => {
            // APIで対象ユーザーのフルプロフィールを取得
            const isSuccess = await $Data.Access.GetUserProfile({ userId: rep.reporter_user_id });
            if (isSuccess) {
                // $Data.resData (最新レスポンス) から、先ほど取得したプロフィールを抽出
                const profile = $Data.resData;
                // 標準のプロフィール画面を表示 (編集不可モード)
                this.ShowUserProfile(profile, false);
            }
        };
        this._core.open({
            title: "REPORT CONTENT",
            content: el,
            buttons: []
        });
    },
    // 【管理者機能】フィードバックリスト（無限スクロール）
    async ShowAdminFeedbackList() {
        let skip = 0;
        const take = 20;
        // ★ 実行時に即データアクセスし、エラーの場合は開かずに終了
        // const isSuccess = await $Data.Access.GetAllFeedback({ skip, take });
        // if (!isSuccess) return;
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
        this._core.open({
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
        this._core.open({
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
        this._core.open({
            title: "SEND NOTIFICATION",
            content: el,
            help: "特定のユーザーに対して、個別の通知（DM）を送信します。",
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
                                this._core.close(); // 送信画面を閉じる
                            }
                        }
                    }
                ]
            ]
        });
    },
    // 【管理者機能】ユーザーメール一覧
    async ShowAdminUserMailList() {
        // const isSuccess = await $Data.Access.AdminGetAllUserNotifications({ limit: 100 });
        // if (!isSuccess) return;
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
                $Dom.QuerySelector(".js-body", child).textContent = item.body;
                child.onclick = () => this.ShowAdminUserMailDetail(item);
                root.appendChild(child);
            });
        }
        this._core.open({
            title: "USER MESSAGE LOG",
            content: root
        });
    },
    // 【管理者機能】ユーザーメール詳細
    ShowAdminUserMailDetail_2(item) {
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        const lines = (item.body || "").split('\n');
        // 詳細画面のヘッダーに宛先ユーザー名を表示
        const titleArea = $Dom.QuerySelector('#view-notice-title', el);
        titleArea.innerHTML = `
            <div class="text-[0.6rem] text-slate-400 uppercase tracking-widest mb-1">To: ${item.icon} ${item.nick_name}</div>
            <div>${lines[0] || "No Subject"}</div>
        `;
        $Dom.QuerySelector('#view-notice-icon', el).textContent = item.emoji || "✉️";
        // $Dom.QuerySelector('#view-notice-title', el).textContent = lines[0] || "No Subject";
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        $Dom.QuerySelector('#view-notice-body', el).textContent = item.body;
        this._core.open({
            title: "MESSAGE DETAILS (ADMIN)",
            content: el,
            headerButtons: []
        });
    },
    // 【管理者機能】ユーザーメール詳細
    ShowAdminUserMailDetail(item) {
        const el = $Dom.GenerateTemplate('tpl-view-notice');
        // --- 2. ユーザー情報ボタンを表示・設定する ---
        const userWrapper = $Dom.QuerySelector('#view-notice-user-wrapper', el);
        const userIcon = $Dom.QuerySelector('#view-notice-user-icon', el);
        const userId = $Dom.QuerySelector('#view-notice-user-id', el);
        const btnUser = $Dom.QuerySelector('#btn-notice-user-profile', el);
        $Dom.ToggleShow(userWrapper, true);
        userIcon.textContent = item.icon || "👤";
        userId.textContent = item.nick_name || item.user_id.slice(0, 8);
        // ボタンクリックでユーザー詳細を表示
        btnUser.onclick = async () => {
            // API経由で対象ユーザーのフルプロフィールを取得
            const isSuccess = await $Data.Access.GetUserProfile({ userId: item.user_id });
            if (isSuccess) {
                // 最新のプロフィールデータを$Data.resDataから取得
                const profile = $Data.resData;
                // 第2引数 isOwner を false にして編集不可モードで開く
                this.ShowUserProfile(profile, false);
            }
        };
        // --- 3. その他の基本情報を反映 ---
        // 右上のメール（封筒）アイコンなど
        $Dom.QuerySelector('#view-notice-icon', el).textContent = item.emoji || "✉️";
        // 送信日時
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        // 本文（全文表示）
        $Dom.QuerySelector('#view-notice-body', el).textContent = item.body;
        this._core.open({
            title: "MESSAGE DETAILS (ADMIN)",
            content: el,
            headerButtons: []
        });
    },
};