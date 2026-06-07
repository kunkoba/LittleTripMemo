// データ管理（通信・保持）を統合したオブジェクト
window.$Data = {
    // 取得したデータを保持する（常に上書き）
    resData: null,
    // データの完全初期化
    Clear() {
        this.Access._rawData.archives =[];
        this.Access._rawData.details =[];
        this.Store.Restore();
    },
    // 通信関連のメソッド群
    Access: {
        baseUrl: "https://localhost:7292",
        // baseUrl: "http://localhost:5000",   // Docker環境のapi_server（5000番ポート）に向けた接続先URL
        _rawData: {
            archive: null,
            details: [],
            myReactions: [],
            archiveList:[],
            userProfile: null,
        },
        // サーバー通信の基礎
        async _fetchData(method, url, params, isDebug = false) {
            console.log("▼ Access:", this.baseUrl + url, params);
            // メイン処理
            const token = $App.AppData.Owner.Token;
            const options = {
                method: method.toUpperCase(),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                }
            };
            // if (options.method !== "GET" && params) options.body = JSON.stringify(params);
            if (options.method !== "GET" && params) {
                // paramsにプロパティがあるときだけ、全リクエストに login_user_id を自動で混ぜる
                if (params && Object.keys(params).length > 0 && $App.AppData.Owner.SystemInfo) {
                    params.login_user_id = $App.AppData.Owner.SystemInfo.login_user_id;
                }
                options.body = JSON.stringify(params);
            }
            console.log("params:", params);
            // 接続
            const response = await fetch(this.baseUrl + url, options);
            // 結果
            if (!response.ok) {
                if (response.status === 401) {
                    $App.AppData.Owner.Token = null;
                    $App.AppData.Context.IsLoggedIn = false;
                    $Dialog.ShowLoginDialog();
                    return false;
                }
                const errData = await response.json();
                console.log("errData:", errData);
                const errMsg = errData.Message || errData.message || "同期失敗";
                const err = new Error(errMsg);
                err.debugInfo = errData.debugInfo;
                throw err;
            }
            const result = await response.json();
            console.log("■ Result:", url, result);
            const data = structuredClone(result.data);  // 値渡し
            // メイン処理
            $App.AppData.Context.IsLoggedIn = result.is_logged_in ?? false;
            $App.AppData.Owner.plan = result.plan;
            // 取得データを内部に保持
            this._setData(data); // ← 切り出し
            // ベース情報をStoreに保持
            $Data.Store.Restore();
            return true;
        },
        // 取得データを内部に保持
        _setData(data) {
            $Data.resData = data;
            console.log(">>$Data.resData:", $Data.resData);
            if (data.archiveId) $App.AppData.Context.TargetArchiveId = data.archiveId;
            // アプリ基幹のデータ
            if (data.archive) this._rawData.archive = data.archive;
            if (data.details) this._rawData.details = data.details;
            if (data.myReactions) this._rawData.myReactions = data.myReactions;
            if (data.archiveList) this._rawData.archiveList = data.archiveList;
            if (data.userProfile) this._rawData.userProfile = data.userProfile;
            // Owner
            if (data.token) $App.AppData.Owner.Token = data.token;
            // ユーザ用：システムデータ
            if (data.systemInfo) {
                $App.AppData.Owner.SystemInfo = data.systemInfo;
                // 通知の未読判定とローカルDBの掃除を非同期で実行
                $Warn.CatchAsync(async () => {
                    await $Data.LocalDb.CheckUnreadNotices();
                    await $Data.LocalDb.CheckUnreadMails();
                    // チェック完了後にUI側の更新を1回呼ぶ
                    $UI.UpdateNoticeBadge();
                })();
            }
            if (data.myFeedback) $App.AppData.Owner.myFeedback = data.myFeedback;
            if (data.myReport) $App.AppData.Owner.myReport = data.myReport;
            // 管理者用：各取得APIのレスポンスを Admin に格納
            if (data.notifications) $App.AppData.Admin.notifications = data.notifications;
            if (data.reportSummary) $App.AppData.Admin.reportSummary = data.reportSummary;
            if (data.feedbackList) $App.AppData.Admin.feedbackList = data.feedbackList;
            if (data.userMailList) $App.AppData.Admin.userMailList = data.userMailList;
            console.log(">>$App.AppData:", $App.AppData);
        },
        // --- (既存のアプリアクセスメソッド群省略なし) ---
        async LoginToServer(email) {
            const url = '/api/Account/LoginFirebase';
            const params = { Email: email };
            return await $Warn.CatchAsync(async () => {
                await this._fetchData('post', url, params);
                console.log("Login 成功");
                // await $App.RefreshScreen();
            })();
        },
        async GetProfile(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Account/GetProfile', params))();
        },
        async UpdateProfile(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Account/UpdateProfile', params))();
        },
        async UpsertDetail(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UpsertDetail', params))();
        },
        async UpdateDetailPub(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UpdateDetailPub', params))();
        },
        async MergeDetails(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/MergeDetails', params))();
        },
        async AddDetails(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/AddDetails', params))();
        },
        async GetArchiveList(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/GetArchiveList', params))();
        },
        async GetUnMergeDetails(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/GetUnMergeDetails', params))();
        },
        async GetArchiveDetails(params, isPublic = false) {
            const url = isPublic ? "/api/GetArchiveDetails_pub" : "/api/GetArchiveDetails";
            return await $Warn.CatchAsync(async () => await this._fetchData('post', url, params))();
        },
        async DeleteArchive(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/DeleteArchive', params))();
        },
        async UpdateArchive(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UpdateArchive', params))();
        },
        async UpdateArchivePub(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UpdateArchivePub', params))();
        },
        async PublishArchive(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/PublishArchive', params))();
        },
        async UnpublishArchive(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UnpublishArchive', params))();
        },
        async SearchByLocationPub(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/SearchByLocationPub', params))();
        },
        async GetArchiveDetailsPub(params = {}) {
            const encodedId = $Util.EncodeId(params.archive_id);
            // 引数 params.archive_id を使用して URL を構築
            const url = `/api/GetArchiveDetailsPub/${encodedId}`;
            // GET リクエストとして実行 (_fetchData の method 引数を 'get' に)
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('get', url, null); 
            })();
        },
        async OpenArchive(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/OpenArchive', params))();
        },
        async CloseArchive(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/CloseArchive', params))();
        },
        async BulkSyncDetails(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/BulkSyncDetails', params))();
        },
        async BulkSyncReactions(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/BulkSyncReactions', params))();
        },
        // Guid userId
        async GetUserProfile(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/GetUserProfile', params))();
        },


        // public record UpsertFeedbackReq(string? body, int score);
        async UpsertFeedback(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertFeedback', params))();
        },
        // public record UpsertReportReq(Guid target_user_id, long archive_id, string? body);
        async UpsertReport(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertReport', params))();
        },
        // public record UpsertNotificationReq(long seq, string title, string body, short kind, DateTime disp_from, DateTime disp_to);
        async UpsertNotification(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertNotification', params))();
        },
        // public record GetReportDetailsReq(Guid target_user_id, long archive_id);
        async GetReportDetails(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetReportDetails', params))();
            // console.warn("TEST: GetMockData(REPORT_DETAIL) を使用します");
            // $Data.resData.reports = $Const.GetMockData('REPORT_DETAIL', 50);
            // $Data.resData.target_userProfile = null;
            // return true;
        },
        async GetMyFeedback(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetMyFeedback', params))();
        },
        // public record GetMyReportReq(long archive_id);
        async GetMyReport(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetMyReport', params))();
        },
        // public record DeleteMyReportReq(long archive_id);
        async DeleteMyReport(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/DeleteMyReport', params))();
        },
        async GetSystemInfo(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetSystemInfo', params))();
        },
        // public record Request(int archive_id, Guid target_user_id);
        async AdminCloseArchive(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/AdminCloseArchive', params))();
        },
        // public record Request(int archive_id, Guid target_user_id);
        async AdminUnpublishArchive(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/AdminUnpublishArchive', params))();
        },
        // public record Request(Guid target_user_id, string emoji, string body);
        async SendUserNotification(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/SendUserNotification', params))();
        },
        async GetMyUserNotifications(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetMyUserNotifications', params))();
        },
        // public record GetAllFeedbackReq(int score = 0);
        async GetAllFeedback(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetAllFeedback', params))();
        },
        async GetAdminAllInfo(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetAdminAllInfo', params))();
        },
    },
    // データ操作・取得のメソッド群
    Store: {
        _archive: null, _details:[], _archiveList: null, _userProfile: null,
        // 生データからクローンを作成
        Restore() {
            this._archive = structuredClone($Data.Access._rawData.archive || null);
            this._details = structuredClone($Data.Access._rawData.details ||[]);
            this._myReactions = structuredClone($Data.Access._rawData.myReactions || []);
            this._archiveList = structuredClone($Data.Access._rawData.archiveList ||[]);
            this._userProfile = structuredClone($Data.Access._rawData.userProfile || null);
        },
        Clear(){
            this._archive = null; this._details =[]; this._archiveList = null; this._userProfile = null;
        },
        // 詳細データを取得
        _getDetails(archiveId, seq) {
            const list = this._details;
            if (archiveId == null && seq == null) return list;
            const hit = list.find(x => x.archive_id === Number(archiveId) && x.seq === Number(seq));
            return hit ? [hit] :[];
        },
        GetArchive() {
            return this._archive;
        },
        GetArchiveList() {
            return this._archiveList;
        },
        _sortData(field = "date", order = "asc") {
            if (!this._details || this._details.length === 0) return;
            const isAsc = order.toLowerCase() === "asc";
            this._details.sort((a, b) => {
                let valA, valB;
                switch (field) {
                    case "date":
                        valA = (a.memo_date || "") + " " + (a.memo_time || "");
                        valB = (b.memo_date || "") + " " + (b.memo_time || "");
                        break;
                    case "update":
                        valA = a.update_tim || "";
                        valB = b.update_tim || "";
                        break;
                }
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        },
        GetDetails(field = "date", order = "asc") {
            this._sortData(field, order);
            return this._getDetails();
        },
        GetDetailByKey(archiveId, seq) {
            const res = this._getDetails(archiveId, seq);
            return res[0] || null;
        },
        GetMyReactions() {
            return this._myReactions;
        },
        UpsertDetail(detail) {
            if (!detail) return;
            const list = $Data.Access._rawData.details;
            let idx = -1;
            if (detail.seq > 0) {
                idx = list.findIndex(x => x.seq === Number(detail.seq));
            } else {
                idx = list.findIndex(x => x.dbid === Number(detail.dbid));
            }
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...detail };
            } else {
                list.push(detail);
            }
            this.Restore();
        },
        UpdateArchive(updatedFields) {
            if (!this._archive) return;
            // メモリ上のデータ更新
            Object.assign(this._archive, updatedFields);
            // 生データも更新する
            if ($Data.Access._rawData.archive) Object.assign($Data.Access._rawData.archive, updatedFields);
            if (this._archiveList) {
                const target = this._archiveList.find(a => a.archive_id === this._archive.archive_id);
                if (target) Object.assign(target, updatedFields);
            }
            // 生リストデータも更新する
            if ($Data.Access._rawData.archiveList) {
                const rawTarget = $Data.Access._rawData.archiveList.find(a => a.archive_id === this._archive.archive_id);
                if (rawTarget) Object.assign(rawTarget, updatedFields);
            }
        },
        GetUserProfile() {
            return this._userProfile; 
        },
        UpdateProfile(updatedFields) {
            if (this._userProfile) {
                Object.assign(this._userProfile, updatedFields);
            }
        },
    },
    // 同期処理の専門部署
    LocalDb: {
        // バックグラウンドで明細を一括送信
        async BulkSendDetails() {
            const list = await $LocalDb.Detail.GetAll();
            if (!list || list.length === 0) return;
            // 1. 全件の送信フラグを一旦「送信中(1)」にする
            for (const detail of list) {
                detail.send_flag = 1;
                await $LocalDb.Detail.Save(detail);
            }
            // 2. サーバー側の BulkSyncReq 形式に合わせてペイロードを作成
            const payload = {
                items: list.map(d => ({
                    seq: d.seq,
                    archive_id: d.archive_id,
                    latitude: d.latitude,
                    longitude: d.longitude,
                    title: d.title,
                    body: d.body,
                    memo_date: d.memo_date,
                    memo_time: d.memo_time,
                    face_emoji: d.face_emoji,
                    weather_code: d.weather_code,
                    link_url: d.link_url,
                    memo_price: d.memo_price,
                    is_public: !!d.is_public
                }))
            };
            // 3. 一括送信
            const isSuccess = await $Data.Access.BulkSyncDetails(payload);
            if (isSuccess) {
                for (const detail of list) {
                    await $LocalDb.Detail.DeleteById(detail.dbid);
                }
            } else {
                console.error(`一括同期に失敗しました。環境が回復するまで待機します。`);
                for (const detail of list) {
                    detail.send_flag = 0;
                    await $LocalDb.Detail.Save(detail);
                }
            }
        },
        // 現在ストアにある明細とリアクションをローカルDBに同期する。リアクションがない明細についても、空のレコードを作成する
        async SetReactionsToLocalDb() {
            const archive = $Data.Store.GetArchive();
            if (!archive) return;
            const archiveId = archive.archive_id;
            const details = $Data.Store.GetDetails();
            const rawReactions = $Data.Store.GetMyReactions(); // サーバーから取得した生リスト
            // ローカルDBの ParseAndSaveMyReactions を呼び出す
            await $Warn.CatchAsync(async () => {
                await $LocalDb.Reaction.ParseAndSaveMyReactions(archiveId, rawReactions, details);
                // 通知
                console.log(`SyncReactions: Archive ${archiveId} の同期完了`);
            })();
        },
        // バックグラウンドでリアクションを一括送信
        async BulkSendReactions() {
            // 1. 未送信（send_flag = 0）のリアクションデータを全件取得
            const list = await $LocalDb.Reaction.GetUnsentAll();
            if (!list || list.length === 0) return;
            // 2. 二重送信を防ぐため、全件の送信フラグを一旦「送信中(1)」にする
            for (const item of list) {
                item.send_flag = 1;
                await $LocalDb.Reaction.Save(item);
            }
            // 3. サーバー側のリクエスト形式に合わせてペイロードを作成
            const payload = {
                items: list.map(d => ({
                    seq: d.seq,
                    archive_id: d.archive_id,
                    is_funny: d.is_funny,
                    is_love: d.is_love,
                    is_surprise: d.is_surprise,
                    is_sad: d.is_sad
                }))
            };
            // 4. 一括送信
            const isSuccess = await $Data.Access.BulkSyncReactions(payload);
            if (isSuccess) {
                // 送信成功時：フラグ1のまま保持（同期済みデータとしてローカルDBに残す）
                console.log(`リアクション ${list.length}件の同期が完了しました。`);
            } else {
                // 送信失敗時：環境が回復するまで待機するため、フラグを未送信(0)に戻す
                console.error(`リアクション一括同期に失敗しました。`);
                for (const item of list) {
                    item.send_flag = 0;
                    await $LocalDb.Reaction.Save(item);
                }
            }
        },
        // 通知の未読判定とクリーンアップ
        async CheckUnreadNotices() {
            const sysInfo = $App.AppData.Owner.SystemInfo;
            if (!sysInfo || !sysInfo.notifications) return;
            // 1. 期限切れの既読履歴をローカルDBから掃除
            await $LocalDb.Notice.Cleanup();
            // 2. 現在ローカルDBに残っている既読履歴を全取得
            const readHistory = await $LocalDb.Notice.GetAll();
            // 3. サーバーから来た通知リストと突合して未読件数をカウント
            let unreadCount = 0;
            for (const notice of sysInfo.notifications) {
                // ローカル履歴の中から同じseqのものを探す
                const history = readHistory.find(h => h.seq === notice.seq);
                // 履歴がない、またはサーバーの通知の方が新しい場合は「未読」
                if (!history || new Date(notice.update_tim) > new Date(history.update_tim)) {
                    notice.is_new = true; // メモリ上のデータに未読フラグを立てる
                    unreadCount++;
                } else {
                    notice.is_new = false;
                }
            }
            // 4. 未読件数を Context に保存し、UIを更新
            $App.AppData.Context.UnreadNoticeCount = unreadCount;
            // console.log(`[Notice] 未読件数: ${unreadCount}件`);
            // メニューアイコンの赤丸を更新
            $UI.UpdateNoticeBadge(unreadCount);
        },
        // ユーザ当て通知
        async CheckUnreadMails_2() {
            const sysInfo = $App.AppData.Owner.SystemInfo;
            if (!sysInfo || !sysInfo.userNotifications) return;
            // 1. ローカルDBから既読履歴を取得
            const readHistory = await $LocalDb.Mail.GetAll();
            let unreadCount = 0;
            for (const mail of sysInfo.userNotifications) {
                const history = readHistory.find(h => h.seq === mail.seq);
                // 2. 履歴がない、またはサーバーの方が新しい場合は未読
                if (!history || new Date(mail.send_tim) > new Date(history.send_tim)) {
                    mail.is_new = true;
                    unreadCount++;
                } else {
                    mail.is_new = false;
                }
            }
            // 3. コンテキストに保持
            $App.AppData.Context.UnreadMailCount = unreadCount;
            // 4. プロフィール画面が開いていればバッジを更新
            if (window.$Dialog) this._updateProfileMailBadge();
        },
        // 通知の未読判定（個別メッセージ版）
        async CheckUnreadMails() {
            const sysInfo = $App.AppData.Owner.SystemInfo;
            if (!sysInfo || !sysInfo.userNotifications) return;

            const readHistory = await $LocalDb.Mail.GetAll();
            let unreadCount = 0;

            for (const mail of sysInfo.userNotifications) {
                const history = readHistory.find(h => h.seq === mail.seq);
                if (!history || new Date(mail.send_tim) > new Date(history.send_tim)) {
                    mail.is_new = true;
                    unreadCount++;
                } else {
                    mail.is_new = false;
                }
            }
            $App.AppData.Context.UnreadMailCount = unreadCount;
        },
    },
};