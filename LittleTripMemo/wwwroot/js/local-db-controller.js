// IndexedDBの低レイヤー操作を担当する現場作業員（Core）
const _LocalDbCore = {
    db: null,
    DB_NAME: "littleTripMemoDb",
    VERSION: 1,
    // トランザクションモード定義
    TRANSACTION_MODES: {
        READONLY: 'readonly',
        READWRITE: 'readwrite',
    },
    // ストア名称定義
    STORE_NAMES: {
        DETAIL: 'detailStore',
        // ARCHIVE: 'archiveStore',
        REACTION: 'reactionStore',
        NOTICE: 'noticeStore',
    },
    // 初期化
    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.VERSION);
            // 構造変更時のテーブル作成
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this._createStores(db);
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("IndexedDB Core: 準備完了");
                resolve(this.db);
            };
            request.onerror = (event) => {
                console.error("IndexedDB Core: 初期化エラー", event.target.error);
                reject(event.target.error);
            };
        });
    },
    // ※※※※ データベースを削除する関数 ※※※※
    __deleteAllDatabases() {
        console.log("◆__deleteAllDatabases");
        const request = indexedDB.deleteDatabase(this.DB_NAME);    // dbNameは削除したいデータベース名
        request.onsuccess = () => {
            console.log(`deleteAllDatabases >> データベース ${this.DB_NAME} は削除されました`);
        };
        request.onerror = (event) => {
            console.error("deleteAllDatabases >> データベース削除エラー:", event.target.error);
        };
        request.onblocked = () => {
            console.warn("deleteAllDatabases >> データベース削除がブロックされました　全てのブラウザを閉じて再試行してください");
        };
    },
    // 各ストア（テーブル）の作成とインデックス設定
    _createStores(db) {
        // 詳細データ
        if (!db.objectStoreNames.contains(this.STORE_NAMES.DETAIL)) {
            const store = db.createObjectStore(this.STORE_NAMES.DETAIL, { keyPath: "dbid", autoIncrement: true });
        }
        // リアクション（archive_id と seq の複合キー）
        if (!db.objectStoreNames.contains(this.STORE_NAMES.REACTION)) {
            const store = db.createObjectStore(this.STORE_NAMES.REACTION, { keyPath: ["archive_id", "seq"] });
        }
        // 通知既読履歴（seqをキーとする）
        if (!db.objectStoreNames.contains(this.STORE_NAMES.NOTICE)) {
            const store = db.createObjectStore(this.STORE_NAMES.NOTICE, { keyPath: "seq" });
        }
    },
    // トランザクションからオブジェクトストアを取得
    _getStore(storeName, mode = this.TRANSACTION_MODES.READONLY) {
        if (!this.db) throw new Error("データベースが初期化されていません");
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    },
    // 追加更新（新規登録時は「dbid」を採番）
    async upsertData(storeName, data) {
        return new Promise((resolve) => {
            try {
                const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
                const request = store.put(data);
                request.onsuccess = (event) => {
                    // 採番されたIDをデータ本体のdbidに書き戻す（参照渡しを利用）
                    data.dbid = event.target.result;
                    resolve(true);
                };
                request.onerror = (e) => {
                    console.error("Core Upsert Error:", e.target.error);
                    resolve(false);
                };
            } catch (err) {
                console.error("Core Transaction Error:", err);
                resolve(false);
            }
        });
    },
    // _LocalDbCore 内に追加（全件更新用ヘルパー）
    async updateAll(storeName, updateFn) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
            const request = store.openCursor();
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    const newValue = updateFn(cursor.value);
                    cursor.update(newValue);
                    cursor.continue();
                } else {
                    resolve(true);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },
    // キーによる取得
    async getDataByKey(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READONLY);
            const request = store.get(key);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    // 全件取得
    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READONLY);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    // 条件に合致するデータを削除
    async deleteByFilter(storeName, filterFn) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
            const request = store.openCursor();
            request.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (filterFn(cursor.value)) cursor.delete();
                    cursor.continue();
                } else {
                    resolve(true);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },
    // 全件削除
    async deleteAllData(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
                // IndexedDBのクリア命令を発行
                const request = store.clear();
                request.onsuccess = () => {
                    // 削除成功
                    resolve(true);
                };
                request.onerror = (e) => {
                    console.error(`Core Clear Error (${storeName}):`, e.target.error);
                    reject(e.target.error);
                };
            } catch (err) {
                console.error("Core Transaction Error (Clear):", err);
                reject(err);
            }
        });
    },
    // １件削除
    async deleteByKey(storeName, key) {
        return new Promise((resolve, reject) => {
            try {
                const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
                const request = store.delete(key);
                request.onsuccess = () => resolve(true);
                request.onerror = (e) => reject(e.target.error);
            } catch (err) {
                console.error("Core DeleteByKey Error:", err);
                reject(err);
            }
        });
    },
    // データ件数取得
    async getCount(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READONLY);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    // 指定件数を超えた古いデータを削除
    async trimStoreSize(storeName, maxCount, sortKey, sortOrder = "asc") {
        try {
            const count = await this.getCount(storeName);
            if (count <= maxCount) return;
            const store = this._getStore(storeName, this.TRANSACTION_MODES.READWRITE);
            const direction = sortOrder === "desc" ? "prev" : "next";
            let cursorRequest;
            if (store.indexNames.contains(sortKey)) {
                cursorRequest = store.index(sortKey).openCursor(null, direction);
            } else {
                cursorRequest = store.openCursor(null, direction);
            }
            let deleteCount = count - maxCount;
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && deleteCount > 0) {
                    cursor.delete(); 
                    deleteCount--;
                    cursor.continue();
                }
            };
        } catch (error) {
            console.error("Core Trim Error:", error);
        }
    }
};

// 窓口
// ・ローカル㏈のデータ＝「未保存データ」
// ・サーバ更新はユーザ主導で行う（ボタンで更新）
// ・サーバ更新は完全同期処理（成功すればローカル㏈を削除する）
const LocalDbController = {
    // ※※※※ データベースを削除する ※※※※
    RemoveDB(){
        // 基本的にコメントアウト
        _LocalDbCore.__deleteAllDatabases();
    },
    // 初期化
    async Init() {
        await _LocalDbCore.init();
    },
    // 明細管理
    Detail: {
        storeName: _LocalDbCore.STORE_NAMES.DETAIL,
        // データ保存（成否が返却、「dbid」が付与される）
        async Save(detail) {
            detail.send_flag = 0;
            return await _LocalDbCore.upsertData(this.storeName, detail);
        },
        // 全データを送信対象（フラグ1）に更新
        async SetSendFlg() {
            return await _LocalDbCore.updateAll(this.storeName, (item) => {
                item.send_flag = 1;
                return item;
            });
        },
        // 送信完了済みデータ（フラグ1）のみ一括削除
        async DeleteSentAll() {
            return await _LocalDbCore.deleteByFilter(this.storeName, (item) => item.send_flag === 1);
        },
        // 全件削除
        async DeleteAll() { return await _LocalDbCore.deleteAllData(this.storeName); },
        // １件削除
        async DeleteById(dbid) { 
            return await _LocalDbCore.deleteByKey(this.storeName, dbid); 
        },
        // 件数取得
        async GetCount() { return await _LocalDbCore.getCount(this.storeName); },
        // 全件取得
        async GetAll() { return await _LocalDbCore.getAllData(this.storeName); },
        // 保存処理失敗時
        async RevertSendFlg() {
            return await _LocalDbCore.updateAll(this.storeName, (item) => {
                if (item.send_flag === 1) item.send_flag = 0;
                return item;
            });
        },
    },
    // リアクション管理
    Reaction: {
        storeName: _LocalDbCore.STORE_NAMES.REACTION,
        // 保存（1seq=1レコード形式をUpsert）
        async Save(reactionData) {
            // send_flag が未設定の場合は 0 (未送信) とする
            if (reactionData.send_flag === undefined) reactionData.send_flag = 0;
            return await _LocalDbCore.upsertData(this.storeName, reactionData);
        },
        // 特定の明細のリアクションを取得
        async Get(archiveId, seq) {
            return await _LocalDbCore.getDataByKey(this.storeName, [Number(archiveId), Number(seq)]);
        },
        // 未送信(send_flag = 0)のものを全取得
        async GetUnsentAll() {
            const all = await _LocalDbCore.getAllData(this.storeName);
            return all.filter(item => item.send_flag === 0);
        },
        // サーバーからの生データ（1リアクション＝1レコード）を受け取り、ローカルDBに同期する
        async ParseAndSaveMyReactions(archiveId, rawReactions, allDetails = []) {
            if (!archiveId) return;
            const targetArchiveId = Number(archiveId);
            // 1. ローカルの未送信(send_flag === 0)を保護（既存ロジック）
            const unsentList = await this.GetUnsentAll();
            const unsentSeqs = unsentList
                .filter(r => r.archive_id === targetArchiveId)
                .map(r => r.seq);
            // 2. サーバーからのリアクションを集約
            const aggregated = {};
            rawReactions.forEach(raw => {
                const seq = Number(raw.seq);
                if (!aggregated[seq]) {
                    aggregated[seq] = this._createEmptyReaction(targetArchiveId, seq, 1); // 1=同期済み
                }
                // 各フラグを反映
                if (raw.reaction_type === 1) aggregated[seq].is_funny = true;
                if (raw.reaction_type === 2) aggregated[seq].is_love = true;
                if (raw.reaction_type === 3) aggregated[seq].is_surprise = true;
                if (raw.reaction_type === 4) aggregated[seq].is_sad = true;
            });
            // 3. ★重要：明細(allDetails)をループして、不足しているseqに空のレコードを作る
            allDetails.forEach(detail => {
                const seq = Number(detail.seq);
                if (!aggregated[seq]) {
                    // サーバーにリアクションがなかった明細にも空枠を作成
                    aggregated[seq] = this._createEmptyReaction(targetArchiveId, seq, 1);
                }
            });
            // 4. 未送信(send_flag=0)以外のものを一括保存
            const promises = Object.values(aggregated).map(data => {
                if (unsentSeqs.includes(data.seq)) return Promise.resolve();
                return this.Save(data);
            });
            await Promise.all(promises);
        },
        // ヘルパー：空のリアクションオブジェクト生成
        _createEmptyReaction(archiveId, seq, sendFlag = 0) {
            return {
                archive_id: archiveId,
                seq: seq,
                is_funny: false,
                is_love: false,
                is_surprise: false,
                is_sad: false,
                send_flag: sendFlag
            };
        }
    },
    // 通知の既読履歴管理
    Notice: {
        storeName: _LocalDbCore.STORE_NAMES.NOTICE,
        // 既読履歴の保存（詳細を開いた時に呼ぶ）
        async Save(seq, update_tim, disp_to) {
            const data = {
                seq: Number(seq),
                update_tim: update_tim,
                disp_to: disp_to
            };
            return await _LocalDbCore.upsertData(this.storeName, data);
        },
        // 全件取得（一覧を開いた時の突合用）
        async GetAll() {
            return await _LocalDbCore.getAllData(this.storeName);
        },
        // 期限切れデータのクリーンアップ（一覧を開いた時などに呼ぶ）
        async Cleanup() {
            const now = new Date();
            return await _LocalDbCore.deleteByFilter(this.storeName, (item) => {
                if (!item.disp_to) return false;
                const toDate = new Date(item.disp_to);
                return now > toDate; // 現在時刻が disp_to を過ぎていれば削除対象
            });
        }
    },
};

// LocalDbController.RemoveDB();

// Public
export default LocalDbController;

