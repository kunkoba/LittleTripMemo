// データ管理（通信・保持）を統合したオブジェクト
window.$Data = {
    // データの完全初期化
    Clear() {
        this.Access._rawData.archives = [];
        this.Access._rawData.details = [];
        this.Store.Restore();
    },
    // ★追加：同期処理の専門部署
    LocalDb: {
        // バックグラウンドでローカルDBのデータを確実にサーバーへ同期する
        async RunBackgroundSync() {
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
        }
    },
    // 通信関連のメソッド群
    Access: {
        baseUrl: "https://localhost:7292",   // ASPエントリポイント
        // baseUrl: "https://2cd8-112-71-71-140.ngrok-free.app",   // ASPエントリポイント
        _rawData: { archive: null, details: [], archiveList: [], userProfile: null},
        // サーバー通信の基礎（エラーはスローし、同期と復元まで行う）
        async _fetchData(method, url, params, isDebug = false) {
            if (isDebug) {
                // =============================================================
                // テスト用★★
                // =============================================================
                const { testArchive, generateTestDetails } = await import("./test-data.js");
                this._rawData.archive = testArchive;
                this._rawData.details = generateTestDetails();
                $Data.Store.Restore();
                return;
            }
            console.log("▼ Access:", this.baseUrl + url, params);
            const token = $App.AppData.Owner.Token;
            // console.log("token:", token);
            const options = {
                method: method.toUpperCase(),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token ? `Bearer ${token}` : ""
                }
            };
            if (options.method !== "GET" && params) options.body = JSON.stringify(params);
            const response = await fetch(this.baseUrl + url, options);
            // レスポンス処理
            if (!response.ok) {
                // 401の場合はログイン画面へ
                if (response.status === 401) {
                    $App.AppData.Owner.Token = null;
                    $App.AppData.System.IsLoggedIn = false;
                    $Dialog.ShowLoginDialog();
                    return false;
                }
                const errData = await response.json();
                console.log("errData:", errData);  // 追加して確認
                // ※プロパティ名は先頭小文字じゃないとダメみたい
                const errMsg = errData.Message || errData.message || "同期失敗";
                const err = new Error(errMsg);
                err.debugInfo = errData.debugInfo;
                throw err;
            }
            const result = await response.json();
            console.log("■ Result:", url, result);
            const data = result.data;  // dataの中身を取り出す
            // token取得
            if (data.token) $App.AppData.Owner.Token = data.token;
            // archives, details
            if (data.archive) this._rawData.archive = data.archive;
            if (data.details) this._rawData.details = data.details;
            if (data.archiveId) $App.AppData.System.TargetArchiveId = data.archiveId; // 新規ID
            if (data.archiveList) this._rawData.archiveList = data.archiveList;
            if (data.userProfile) this._rawData.userProfile = data.userProfile;
            // オーナー情報セット
            if (data.ownerProfile) $App.AppData.Owner.Profile = data.ownerProfile;
            // ベース情報をAppDataに保持
            $App.AppData.System.IsLoggedIn = result.is_logged_in ?? false;
            $Data.Store.Restore();
            return true;
        },
        // 自サーバー(C#)へログイン要求し、JWTトークンをもらう
        async LoginToServer(email) {
            const url = '/api/Account/LoginFirebase';
            const params = { Email: email };
            // (※ まだトークンが無い状態での通信なので、_fetchData 側で token が空でも通るようになっている前提です)
            return await $Warn.CatchAsync(async () => {
                // C#が返してくる token を取り出して返す
                return await this._fetchData('post', url, params);
            })();
        },
        // ユーザ情報取得
        async GetProfile(params = {}) {
            const url = '/api/Account/GetProfile';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // ユーザ情報更新
        async UpdateProfile(params) {
            const url = '/api/Account/UpdateProfile';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 明細の登録・更新（seq=0でINSERT、seq>0でUPDATE）
        async UpsertDetail(params) {
            const url = '/api/UpsertDetail';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 明細の登録・更新（seq=0でINSERT、seq>0でUPDATE）
        async UpdateDetailPub(params) {
            const url = '/api/UpdateDetailPub';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 日々のデータをまとめる
        async MergeDetails(params) {
            const url = '/api/MergeDetails';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 明細を指定した親に追加する
        async AddDetails(params) {
            const url = '/api/AddDetails';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // まとめ親一覧取得
        async GetArchiveList(params = {}) {
            const url = '/api/GetArchiveList';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 未まとめ明細一覧取得
        async GetUnMergeDetails(params = {}) {
            const url = '/api/GetUnMergeDetails';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 指定したまとめに紐づく明細取得
        async GetArchiveDetails(params = { archive_id: 0 }, isPublic = false) {
            const url = isPublic ? "/api/GetArchiveDetails_pub" : "/api/GetArchiveDetails";
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // まとめ親（アーカイブ）の削除（解除）
        async DeleteArchive(params) {
            const url = '/api/DeleteArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // まとめ親（アーカイブ）更新
        async UpdateArchive(params = {}) {
            const url = '/api/UpdateArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // まとめ親（アーカイブ）更新
        async UpdateArchivePub(params = {}) {
            const url = '/api/UpdateArchivePub';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // Public化
        async PublishArchive(params = {}) {
            console.log("this", this);
            const url = '/api/PublishArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // Private戻し
        async UnpublishArchive(params = {}) {
            const url = '/api/UnpublishArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 地点検索（Private）
        async SearchByLocation(params = {}) {
            const url = '/api/SearchByLocation';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // 地点検索（Public）
        async SearchByLocationPub(params = {}) {
            const url = '/api/SearchByLocationPub';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // Publicアーカイブ明細取得
        async GetArchiveDetailsPub(params = {}) {
            const url = '/api/GetArchiveDetailsPub';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // リアクション更新
        async UpsertReaction(params = {}) {
            const url = '/api/UpsertReaction';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // Publicデータを「Public中 (closed_flg=false)」にする
        async OpenArchive(params = {}) {
            const url = '/api/OpenArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
        // Publicデータを「Private中 (closed_flg=true)」にする
        async CloseArchive(params = {}) {
            const url = '/api/CloseArchive';
            return await $Warn.CatchAsync(async () => {
                return await this._fetchData('post', url, params);
            })();
        },
    },
    // データ操作・取得のメソッド群
    Store: {
        // アプリで使う最新データを保持
        _archive: null,
        _details: [],
        _archiveList: null,
        _userProfile: null,
        // 生データからクローンを作成
        Restore() {
            this._archive = structuredClone($Data.Access._rawData.archive);
            this._details = structuredClone($Data.Access._rawData.details);
            this._archiveList = structuredClone($Data.Access._rawData.archiveList);
            this._userProfile = structuredClone($Data.Access._rawData.userProfile);
        },
        Clear(){
            this._archive = null;
            this._details = null;
            this._archiveList = null;
        },
        // 詳細データを取得
        _getDetails(archiveId, seq) {
            const list = this._details;
            if (archiveId == null && seq == null) return list; // 全件（配列）
            const hit = list.find(x => x.archive_id === Number(archiveId) && x.seq === Number(seq));
            return hit ? [hit] : []; // 見つかれば [obj]、なければ[] （常に配列）
        },
        // ソート処理
        SortDetails(field = "date", order = "asc") {
            if (!this._details || this._details.length === 0) return;
            const isAsc = order.toLowerCase() === "asc";
            this._details.sort((a, b) => {
                let valA, valB;
                switch (field) {
                    case "date":
                        // メモ日付と時間を結合して比較 (例: "2026-03-10 06:37")
                        valA = (a.memo_date || "") + " " + (a.memo_time || "");
                        valB = (b.memo_date || "") + " " + (b.memo_time || "");
                        break;
                    case "update":
                        // 更新日時（ISO文字列）
                        valA = a.update_tim || "";
                        valB = b.update_tim || "";
                        break;
                }
                // --- 実際の比較処理 ---
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        },
        // 【ラッパー】アーカイブ取得
        GetArchive() {
            return this._archive;
        },
        // 【ラッパー】アーカイブリスト取得
        GetArchiveList() {
            return this._archiveList;
        },
        // 【ラッパー】明細全件取得
        GetAllDetails() {
            this.SortDetails('date');
            return this._getDetails();
        },
        // 【ラッパー】明細１件取得
        GetDetailByKey(archiveId, seq) {
            const res = this._getDetails(archiveId, seq);
            return res[0] || null;
        },
        // 生データの更新または追加（反映にはRefreshが必要）
        UpsertDetail(detail) {
            if (!detail) return;
            console.log("UpsertDetail:", detail);
            const list = $Data.Access._rawData.details;
            // const idx = list.findIndex(x => x.seq === Number(detail.seq));
            const idx = list.findIndex(x => x.dbid === Number(detail.dbid));
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...detail };
            } else {
                list.push(detail);
            }
            // 最新化
            this.Restore();
        },
        // まとめ親の情報を部分的に上書き更新する
        UpdateArchive(updatedFields) {
            if (!this._archive) return;
            // 現在開いているまとめ親を更新
            Object.assign(this._archive, updatedFields);
            // リスト側のデータも更新しておく（アーカイブリストを開き直した時のため）
            if (this._archiveList) {
                const target = this._archiveList.find(a => a.archive_id === this._archive.archive_id);
                if (target) {
                    Object.assign(target, updatedFields);
                }
            }
        },
        // ユーザ情報取得
        GetUserProfile() {
            return this._userProfile;
        },
        // ユーザ情報更新
        UpdateProfile(updatedFields) {
            if (this._userProfile) {
                Object.assign(this._userProfile, updatedFields);
            }
        },
    },
};