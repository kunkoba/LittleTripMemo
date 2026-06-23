const BaseUrl = "https://localhost:7292";
// const BaseUrl = "https://eminently-meet-terrapin.ngrok-free.app";  // ngrok　※外部に公開
// const BaseUrl = "http://localhost:5000";   // Docker環境のapi_server（5000番ポート）に向けた接続先URL
const API_ENDPOINTS = {
    // Account
    LoginFirebase:          { method: 'post', url: '/api/Account/LoginFirebase' },
    EnsureLoginUser:        { method: 'post', url: '/api/Account/EnsureLoginUser' },
    UpdateProfile:          { method: 'post', url: '/api/Account/UpdateProfile' },
    GetUserProfile:         { method: 'post', url: '/api/Account/GetUserProfile' },
    Withdrawal:             { method: 'post', url: '/api/Account/Withdrawal' }, // 未使用
    // Private
    GetArchiveDetails:      { method: 'post', url: '/api/Private/GetArchiveDetails' },
    UpdateDetail:           { method: 'post', url: '/api/Private/UpdateDetail' },
    UpdateArchive:          { method: 'post', url: '/api/Private/UpdateArchive' },
    MergeDetails:           { method: 'post', url: '/api/Private/MergeDetails' },
    AddDetails:             { method: 'post', url: '/api/Private/AddDetails' },
    GetArchiveList:         { method: 'post', url: '/api/Private/GetArchiveList' },
    GetUnMergeDetails:      { method: 'post', url: '/api/Private/GetUnMergeDetails' },
    DeleteArchive:          { method: 'post', url: '/api/Private/DeleteArchive' },
    PublishArchive:         { method: 'post', url: '/api/Private/PublishArchive' },
    BulkSyncDetails:        { method: 'post', url: '/api/Private/BulkSyncDetails' },
    DeleteStrayDetails:     { method: 'post', url: '/api/Private/DeleteStrayDetails' },
    DetachDetails:          { method: 'post', url: '/api/Private/DetachDetails' },
    RecreatePublicArchive:  { method: 'post', url: '/api/Private/RecreatePublicArchive' },  // 未使用
    // Public (Anonymous)
    GetArchiveDetailsPub:   { method: 'get',  url: '/api/Public/GetArchiveDetailsPub/{encodedId}' },
    AddClick:               { method: 'post', url: '/api/Public/AddClick' },
    // Public
    UpdateDetailPub:        { method: 'post', url: '/api/Public/UpdateDetailPub' },
    UnpublishArchive:       { method: 'post', url: '/api/Public/UnpublishArchive' },
    UpdateArchivePub:       { method: 'post', url: '/api/Public/UpdateArchivePub' },
    SearchByLocationPub:    { method: 'post', url: '/api/Public/SearchByLocationPub' },
    OpenArchive:            { method: 'post', url: '/api/Public/OpenArchive' },
    CloseArchive:           { method: 'post', url: '/api/Public/CloseArchive' },
    BulkSyncReactions:      { method: 'post', url: '/api/Public/BulkSyncReactions' },
    // Sys
    UpsertFeedback:         { method: 'post', url: '/api/Sys/UpsertFeedback' },
    UpsertReport:           { method: 'post', url: '/api/Sys/UpsertReport' },
    GetMyFeedback:          { method: 'post', url: '/api/Sys/GetMyFeedback' },
    GetMyReport:            { method: 'post', url: '/api/Sys/GetMyReport' },
    DeleteMyReport:         { method: 'post', url: '/api/Sys/DeleteMyReport' },
    GetSystemInfo:          { method: 'post', url: '/api/Sys/GetSystemInfo' },
    GetMyUserNotifications: { method: 'post', url: '/api/Sys/GetMyUserNotifications' },
    // Admin
    GetAdminAllInfo:        { method: 'post', url: '/api/Admin/GetAdminAllInfo' },
    UpsertNotification:     { method: 'post', url: '/api/Admin/UpsertNotification' },
    GetReportDetails:       { method: 'post', url: '/api/Admin/GetReportDetails' },
    AdminCloseArchive:      { method: 'post', url: '/api/Admin/AdminCloseArchive' },
    AdminUnpublishArchive:  { method: 'post', url: '/api/Admin/AdminUnpublishArchive' },
    SendUserNotification:   { method: 'post', url: '/api/Admin/SendUserNotification' },
    GetAllFeedback:         { method: 'post', url: '/api/Admin/GetAllFeedback' },
    GetReportSummary:       { method: 'post', url: '/api/Admin/GetReportSummary' },
    GetAdminNotifications:  { method: 'post', url: '/api/Admin/GetAdminNotifications' },
    GetSentUserMailList:    { method: 'post', url: '/api/Admin/GetSentUserMailList' },  // 未使用
    UpdateUserBanStatus:    { method: 'post', url: '/api/Admin/UpdateUserBanStatus' },  // 未使用
    // Core
    GetCoreConfig:          { method: 'post', url: '/api/Core/GetCoreConfig' },     // 未使用
    UpdateCoreConfig:       { method: 'post', url: '/api/Core/UpdateCoreConfig' },  // 未使用
};
// APIメソッドの自動生成
const ApiModule = {};
Object.entries(API_ENDPOINTS).forEach(([methodName, config]) => {
    ApiModule[methodName] = async function(params = {}) {
        return await $Warn.CatchAsync(async () => await this._fetchData(config.method, config.url, params))();
    };
});
// データ管理（通信・保持）を統合したオブジェクト
window.$Data = {
    // 取得したデータを保持する（常に上書き）
    resData: null,
    // データの完全初期化
    Clear() {
        this.resData = null;
        this.Access._rawData.archive = null; 
        this.Access._rawData.details = [];
        this.Access._rawData.myReactions = [];
        this.Access._rawData.archiveList = [];
        this.Access._rawData.userProfile = null;
        this.Store.Restore(); 
    },
    // 通信関連のメソッド群
    Access: {
        _rawData: {
            archive: null,
            details: [],
            myReactions: [],
            archiveList:[],
            userProfile: null,
        },
        // サーバー通信の基礎
        async _fetchData(method, url, params, isDebug = false) {
            console.log("▼ Access:", BaseUrl + url, params);
            // オフラインチェック
            if (!$App.AppData.Context.IsOnline) {
                $Notice.Warn("オフライン中は、機能が制限されます。");
                return false;
            }
            // メイン処理
            const token = $App.AppData.Owner.Token;
            const options = {
                method: method.toUpperCase(),
                headers: {
                    "ngrok-skip-browser-warning": "69420", // ngrok対応
                    "X-App-Version": $Const.APP_INFO.VERSION // ★これを追加。すべてのリクエストに載せる
                }
            };
            // トークンがある場合のみヘッダーに追加（空文字を送らない）
            if (token) {
                options.headers["Authorization"] = `Bearer ${token}`;
            }
            if (options.method !== "GET" && params) {
                options.headers["Content-Type"] = "application/json";
                // paramsにプロパティがあるときだけ、全リクエストに login_user_id を自動で混ぜる
                if (params && Object.keys(params).length > 0 && $App.AppData.Owner.SystemInfo) {
                    params.login_user_id = $App.AppData.Owner.SystemInfo.login_user_id;
                }
                options.body = JSON.stringify(params);
            }
            // 接続準備
            $Notice.Loading.Show();
            let response;
            try {
                // サーバ接続
                response = await fetch(BaseUrl + url, options);
            } catch (err) {
                console.log("err:", err);
                // ネットワーク断（オフライン）などの物理エラー
                await $App.HandleServerFailure();
                return false;
            }
            if (!response.ok) {
                // 401, 500 などのステータスエラーを判定会議へ投げる
                await $App.HandleServerFailure(response);
                return false; // 以降の処理（json解析など）を中止
            }
            // 
            $Notice.Loading.Hide();
            const result = await response.json();
            console.log("■ Result:", url, result);
            const data = structuredClone(result.data);  // 値渡し
            // メイン処理
            $App.AppData.Context.IsLoggedIn = result.is_logged_in ?? false;
            $App.AppData.Owner.plan = result.plan;
            // 取得データを内部に保持
            this._setData(data);
            
            // ベース情報をStoreに保持
            $Data.Store.Restore();
            return true;
        },
        // 取得データを内部に保持
        _setData(data) {
            $Data.resData = data;
            if (data.archiveId) $App.AppData.Context.TargetArchiveId = data.archiveId;
            // アプリ基幹のデータ
            if (data.archive) this._rawData.archive = data.archive;
            if (data.myReactions) this._rawData.myReactions = data.myReactions;
            if (data.details) {
                // 各明細に「取得時点の自分の状態」を紐付けて、後の計算（差分抽出）に備える
                const myRes = data.myReactions || [];
                data.details.forEach(d => {
                    const my = myRes.find(r => r.seq === d.seq);
                    d.server_has_funny    = !!my?.has_funny;
                    d.server_has_love     = !!my?.has_love;
                    d.server_has_surprise = !!my?.has_surprise;
                    d.server_has_sad      = !!my?.has_sad;
                });
                this._rawData.details = data.details;
            }
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
        // 定形APIの展開（自動生成モジュールのマージ）
        ...ApiModule,
        // 個別実装（パスパラメータ等を含む特殊なAPI）
        async GetArchiveDetailsPub(params = {}) {
            const encodedId = $Util.EncodeId(params.archive_id);
            // // 引数 params.archive_id を使用して URL を構築
            // const url = `/api/Public/GetArchiveDetailsPub/${encodedId}`;
            // 共通定数リストから取得
            const { method, url } = API_ENDPOINTS["GetArchiveDetailsPub"];
            const finalUrl = url.replace('{encodedId}', encodedId);
            // GET リクエストとして実行 (_fetchData の method 引数を 'get' に)
            return await $Warn.CatchAsync(async () => {
                // return await this._fetchData('get', url, null); 
                return await this._fetchData(method, finalUrl, null); 
            })();
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
        // 詳細データを取得
        _getDetails(archiveId, seq) {
            const list = this._details;
            if (archiveId == null && seq == null) return list;
            const hit = list.find(x => {
                if (seq > 0) return x.archive_id === Number(archiveId) && x.seq === Number(seq);
                return x.dbid === Number(detail.dbid); // ※bug: detail is undefined
            });
            return hit ? [hit] :[];
        },
        GetArchive() {
            return this._archive;
        },
        GetArchiveList() {
            return this._archiveList;
        },
        // タイムライン用に最適化されたソート済みリストを取得
        GetDetailsSortByTimeline() {
            const list = [...this._details]; // 元データを壊さないようコピー
            list.sort((a, b) => {
                // 1. 日時文字列で比較 (YYYY-MM-DDHH:mm)
                const dtA = (a.memo_date || "") + (a.memo_time || "");
                const dtB = (b.memo_date || "") + (b.memo_time || "");
                if (dtA !== dtB) return dtA.localeCompare(dtB);
                // 2. 日時が同じなら seq (サーバーID) で比較
                const seqA = Number(a.seq || 0);
                const seqB = Number(b.seq || 0);
                if (seqA !== seqB) return seqA - seqB;
                // 3. seqも同じ（共に未同期など）なら dbid (ローカルID) で比較
                const dbidA = Number(a.dbid || 0);
                const dbidB = Number(b.dbid || 0);
                return dbidA - dbidB;
            });
            return list;
        },
        GetDetails() {
            return this._getDetails();
        },
        GetDetailByKey(archiveId, seq, dbid = null) {
            const list = this._details;
            const hit = list.find(x => {
                if (seq && Number(seq) > 0) return x.archive_id === Number(archiveId) && x.seq === Number(seq);
                if (dbid && Number(dbid) > 0) return x.dbid === Number(dbid);
                return false;
            });
            return hit || null;
        },
        GetMyReactions() {
            return this._myReactions;
        },
        UpdateDetail(detail) {
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
                    is_public: !!d.is_public,
                }))
            };
            // 3. 一括送信
            const isSuccess = await $Data.Access.BulkSyncDetails(payload);
            if (isSuccess) {
                for (const detail of list) {
                    await $LocalDb.Detail.DeleteById(detail.dbid);
                }
                return true;
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
            // ローカルDBの ParseAndSaveMyReactions を呼び出す
            await $Warn.CatchAsync(async () => {
                // --- 追加：保存前にゴミ掃除を実行 ---
                await $LocalDb.Reaction.Cleanup(archiveId);
                // 
                const details = $Data.Store.GetDetails();
                const rawReactions = $Data.Store.GetMyReactions(); // サーバーから取得した生リスト
                await $LocalDb.Reaction.ParseAndSaveMyReactions(archiveId, rawReactions, details);
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
                reactions: list.map(d => ({
                    seq: d.seq,
                    archive_id: d.archive_id,
                    has_funny: d.has_funny,
                    has_love: d.has_love,
                    has_surprise: d.has_surprise,
                    has_sad: d.has_sad
                }))
            };
            // 4. 一括送信
            const isSuccess = await $Data.Access.BulkSyncReactions(payload);
            if (isSuccess) {
                // 送信成功時：フラグ1のまま保持（同期済みデータとしてローカルDBに残す）
                return true;
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
            // 新着バッヂ更新
            $UI.UpdateNoticeBadge(unreadCount);
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
            // 新着バッヂ更新
            $UI.UpdateNoticeBadge(unreadCount);
        },
    },
};
