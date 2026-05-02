// データ管理（通信・保持）を統合したオブジェクト
window.$Data = {
    // データの完全初期化
    Clear() {
        this.Access._rawData.archives =[];
        this.Access._rawData.details =[];
        this.Store.Restore();
    },
    // 同期処理の専門部署
    LocalDb: {
        // バックグラウンドで一括送信、一括処理
        async BulkSendDetails2() {
            const list = await $LocalDb.Detail.GetAll();
            if (!list || list.length === 0) return;
            for (const detail of list) {
                detail.send_flag = 1;
                await $LocalDb.Detail.Save(detail);
                const isSuccess = (detail && detail.is_public === true)
                    ? await $Data.Access.UpdateDetailPub(detail)
                    : await $Data.Access.UpsertDetail(detail);
                if (isSuccess) {
                    await $LocalDb.Detail.DeleteById(detail.dbid);
                } else {
                    console.error(`dbid:${detail.dbid} の通信に失敗。環境が回復するまで待機します。`);
                    detail.send_flag = 0;
                    await $LocalDb.Detail.Save(detail);
                    break;
                }
            }
        },
        // バックグラウンドで一括送信、一括処理
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
        }
    },
    // 通信関連のメソッド群
    Access: {
        baseUrl: "https://localhost:7292",
        _rawData: {
            archive: null, details: [], archiveList:[], userProfile: null
        },
        // サーバー通信の基礎
        async _fetchData(method, url, params, isDebug = false) {
            console.log("▼ Access:", this.baseUrl + url, params);
            const token = $App.AppData.Owner.Token;
            const options = {
                method: method.toUpperCase(),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                }
            };
            if (options.method !== "GET" && params) options.body = JSON.stringify(params);
            const response = await fetch(this.baseUrl + url, options);
            if (!response.ok) {
                if (response.status === 401) {
                    $App.AppData.Owner.Token = null;
                    $App.AppData.System.IsLoggedIn = false;
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
            const data = result.data;
            // アプリ基幹のデータ
            if (data.token) $App.AppData.Owner.Token = data.token;
            $App.AppData.System.IsLoggedIn = result.is_logged_in ?? false;
            if (data.archive) this._rawData.archive = data.archive;
            if (data.details) this._rawData.details = data.details;
            if (data.archiveId) $App.AppData.System.TargetArchiveId = data.archiveId;
            if (data.archiveList) this._rawData.archiveList = data.archiveList;
            if (data.userProfile) this._rawData.userProfile = data.userProfile;
            if (data.ownerProfile) $App.AppData.Owner.Profile = data.ownerProfile;
            // 管理者用：各取得APIのレスポンスを Admin に格納
            if (data.notifications) $App.AppData.Admin.notifications = data.notifications;
            if (data.reportSummary) $App.AppData.Admin.reportSummary = data.reportSummary;
            if (data.reports) $App.AppData.Admin.reports = data.reports;
            if (data.feedbackList) $App.AppData.Admin.feedbackList = data.feedbackList;
            // システム通知関連
            if (data.systemInfo) $App.AppData.Owner.systemInfo = data.systemInfo;
            // ユーザ用システムデータ
            if (data.myFeedback) $App.AppData.Owner.myFeedback = data.myFeedback;
            if (data.myReport) $App.AppData.Owner.myReport = data.myReport;
            console.log(">>$App.AppData:", $App.AppData);
            // ベース情報をStoreに保持
            $Data.Store.Restore();
            return true;
        },
        // --- (既存のアプリアクセスメソッド群省略なし) ---
        async LoginToServer(email) {
            const url = '/api/Account/LoginFirebase';
            const params = { Email: email };
            return await $Warn.CatchAsync(async () => await this._fetchData('post', url, params))();
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
        async GetArchiveDetails(params = { archive_id: 0 }, isPublic = false) {
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
        async SearchByLocation(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/SearchByLocation', params))();
        },
        async SearchByLocationPub(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/SearchByLocationPub', params))();
        },
        async GetArchiveDetailsPub(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/GetArchiveDetailsPub', params))();
        },
        async UpsertReaction(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/UpsertReaction', params))();
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

        // --- システム系API ---
        async UpsertFeedback(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertFeedback', params))();
        },
        async UpsertReport(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertReport', params))();
        },
        async UpsertNotification(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/UpsertNotification', params))();
        },
        async GetReportSummary(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetReportSummary', params))();
        },
        async GetReportDetails(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetReportDetails', params))();
        },
        async GetAllFeedback(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetAllFeedback', params))();
        },
        async GetAllNotifications(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetAllNotifications', params))();
        },
        async GetMyFeedback(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetMyFeedback', params))();
        },
        async GetMyReport(params) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetMyReport', params))();
        },
        async GetSystemInfo(params = {}) {
            return await $Warn.CatchAsync(async () => await this._fetchData('post', '/api/Sys/GetSystemInfo', params))();
        },
    },
    // データ操作・取得のメソッド群
    Store: {
        _archive: null, _details:[], _archiveList: null, _userProfile: null,
        // 生データからクローンを作成
        Restore() {
            this._archive = structuredClone($Data.Access._rawData.archive || null);
            this._details = structuredClone($Data.Access._rawData.details ||[]);
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
        // 【ラッパー】アーカイブ取得
        GetArchive() { return this._archive; },
        // 【ラッパー】アーカイブリスト取得
        GetArchiveList() { return this._archiveList; },
        // ソート処理
        SortDetails(field = "date", order = "asc") {
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
        GetAllDetails() {
            return this._getDetails();
        },
        GetDetailByKey(archiveId, seq) {
            const res = this._getDetails(archiveId, seq);
            return res[0] || null;
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
            Object.assign(this._archive, updatedFields);
            if (this._archiveList) {
                const target = this._archiveList.find(a => a.archive_id === this._archive.archive_id);
                if (target) {
                    Object.assign(target, updatedFields);
                }
            }
        },
        GetUserProfile() { return this._userProfile; },
        UpdateProfile(updatedFields) {
            if (this._userProfile) {
                Object.assign(this._userProfile, updatedFields);
            }
        },
    },
};