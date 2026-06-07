export default {
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
        const sysInfo = $App.AppData.Owner.SystemInfo || {};
        console.log(">sysInfo:", sysInfo);
        const scoreAvg = sysInfo.score_avg || 0;
        $Dom.QuerySelector('.js-app-score', el).textContent = `★ ${scoreAvg.toFixed(1)}`;
        $Dom.QuerySelector('#btn-info-review', el).onclick = () => this.ShowReviewList();
        $Dom.QuerySelector('#btn-info-license', el).onclick = () => $Notice.Info($Const.APP_INFO.LICENSE || "ライセンス情報がありません。");
        this._core.open({
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
        const sysInfo = $App.AppData.Owner.SystemInfo || {};
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
                $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(rev.create_tim);
                $Dom.QuerySelector(".js-body", child).textContent = rev.body || "（内容なし）";
                container.appendChild(child);
            });
        }
        this._core.open({
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
        // ダイアログを開く前に自分の過去の投稿データを取得
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
        this._core.open({
            // データが既にあれば編集（EDIT）、なければ新規（WRITE）
            title: myFeedback ? "EDIT FEEDBACK" : "WRITE FEEDBACK",
            content: el,
            help: "",
            buttons: [[
                {
                    label: "CANCEL",
                    className: "bg-slate-400 text-white shadow-md",
                    handler: () => {
						this._core.close();
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
                        this._core.closeAll(); // 投稿を閉じる
                        // システム情報を取得
                        $Data.Access.GetSystemInfo();
                    }
                }
            ]]
        });
    },
    // 通知詳細ダイアログ (修正版)
	ShowNoticeDetail(notice) {
		const el = $Dom.GenerateTemplate('tpl-view-notice');
		const kindObj = Object.values($Const.NOTICE_KIND).find(k => k.id === notice.kind) || $Const.NOTICE_KIND.NOTICE;
        $Dom.QuerySelector('#view-notice-icon', el).textContent = kindObj.emoji;
		$Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(notice.update_tim);
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
		this._core.open({
			title: "NOTICE DETAILS",
			content: el
		});
	},
    // 通知リスト表示（修正版）
    async ShowNoticeList() {
        const notices = $App.AppData.Owner.SystemInfo.notifications || [];
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
            $Dom.QuerySelector(".js-date", child).textContent = $Util.FormatDate(item.update_tim);
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
        this._core.open({
            title: "NOTIFICATIONS",
            content: root
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
                const isOk = await this.ShowConfirm({ title: "SUBMIT", message: "通報を送信しますか？" });
                if (!isOk) return;
                const isSubmitSuccess = await $Data.Access.UpsertReport(req);
                if (!isSubmitSuccess) return;
                $Notice.Info("通報を送信しました。管理者が確認します。");
                this._core.close();
            }
        }]);
        // 2段目：既に通報済みの場合のみ「削除（取り消し）」ボタンを配置
        if (myReport) {
            dialogButtons.push([{
                label: "取り消す (DELETE)",
                className: "bg-white !text-slate-800 border-2 border-slate-800 shadow-none rounded-none",
                handler: async () => {
                    const isOk = await this.ShowConfirm({ title: "DELETE REPORT", message: "通報を取り消しますか？" });
                    if (!isOk) return;
                    const isDelSuccess = await $Data.Access.DeleteMyReport({ archive_id: archive.archive_id });
                    if (!isDelSuccess) return;
                    $App.AppData.Owner.myReport = null; // メモリ上からも削除
                    $Notice.Info("通報を取り消しました。");
                    this._core.close();
                }
            }]);
        }
        this._core.open({
            theme: "black", // これを指定することで全体が黒ベース・角丸なしになる
            title: myReport ? "EDIT REPORT" : "REPORT SUBMIT",
            content: el,
            help: "",
            buttons: dialogButtons // そのまま配列を渡す
        });
    },
    // ② ユーザあて通知一覧画面
    async ShowUserMailList() {
        const mails = $App.AppData.Owner.SystemInfo.userNotifications || [];
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
            $Dom.QuerySelector(".js-body", child).textContent = item.body;
            $Dom.ToggleShow($Dom.QuerySelector(".js-title", child), false);
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
        this._core.open({
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
        const body = item.body;
        // 各要素への反映
        $Dom.QuerySelector('#view-notice-icon', el).textContent = item.emoji || "✉️️";
        $Dom.QuerySelector('#view-notice-date', el).textContent = $Util.FormatDate(item.send_tim, "YYYY-MM-DD　HH:mm");
        $Dom.ToggleShow($Dom.QuerySelector("#view-notice-title-area", el), false);
        // 2行目以降があれば本文に、なければ全体を表示（運営からの短い連絡を考慮）
        const bodyEl = $Dom.QuerySelector('#view-notice-body', el);
        bodyEl.textContent = body.trim() !== "" ? body : item.body;
        this._core.open({
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
};