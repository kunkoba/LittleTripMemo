// グローバル変数としてdbを管理
let db; // ローカルDBの変数を宣言

// トランザクションモードリスト
const TRANSACTION_MODES = {
    READONLY: 'readonly',
    READWRITE: 'readwrite',
};

// ストアのリスト
const STORE_NAMES = {
    ROUTE_MEMO: 'routeMemoStore',
    REACTION: 'reActionStore',
    NEWS_READ: 'newsReadStore',
    GUIDE_READ: 'guideReadStore',
    BROWS_HISTORY: 'browsHistoryStore',
    FAVORITE_HISTORY: 'favoriteHistoryStore',
};

// データベース名
const DB_NAME = "routeMemoDb";
// バージョン（※サービス提供中に構造を改修したら、必ずバージョンをあげること！）
const version = 2;


// ※※※※ データベースを削除する関数 ※※※※
function deleteAllDatabases(dbName) {
    const request = indexedDB.deleteDatabase(dbName);    // dbNameは削除したいデータベース名
    request.onsuccess = () => {
        console.log(`deleteAllDatabases >> データベース ${dbName} は削除されました`);
    };
    request.onerror = (event) => {
        console.error("deleteAllDatabases >> データベース削除エラー:", event.target.error);
    };
    request.onblocked = () => {
        console.warn("deleteAllDatabases >> データベース削除がブロックされました　全てのタブを閉じて再試行してください");
    };
}



// ■■■■■　IndexedDB を操作する汎用的な関数群　■■■■■

// 初期化処理でdbをグローバルに管理
async function initializeDB() {
    // ※※※※　dbの構造を変えたときに発動（一度きりな）
    // deleteAllDatabases(DB_NAME);
    if (db) return db; // すでに初期化されている場合は再初期化しない
    // DBの初期化
    db = await openDatabase(DB_NAME, version, (db) => {
        // ストア１
        if (!db.objectStoreNames.contains(STORE_NAMES.ROUTE_MEMO)) {
            db.createObjectStore(STORE_NAMES.ROUTE_MEMO, { keyPath: "dbid", autoIncrement: true });
        }
        // ストア２
        if (!db.objectStoreNames.contains(STORE_NAMES.REACTION)) {
            db.createObjectStore(STORE_NAMES.REACTION, { keyPath: "archiveId_seq" });
        }
        // ストア３
        if (!db.objectStoreNames.contains(STORE_NAMES.NEWS_READ)) {
            db.createObjectStore(STORE_NAMES.NEWS_READ, { keyPath: "no" });
        }
        // ストア４
        if (!db.objectStoreNames.contains(STORE_NAMES.GUIDE_READ)) {
            db.createObjectStore(STORE_NAMES.GUIDE_READ, { keyPath: "no" });
        }
        // ストア５
        if (!db.objectStoreNames.contains(STORE_NAMES.BROWS_HISTORY)) {
            let store = db.createObjectStore(STORE_NAMES.BROWS_HISTORY, { keyPath: "archiveId" });
            store.createIndex("timestamp", "timestamp", { unique: true }); // ソート用
        }
        // ストア６
        if (!db.objectStoreNames.contains(STORE_NAMES.FAVORITE_HISTORY)) {
            let store = db.createObjectStore(STORE_NAMES.FAVORITE_HISTORY, { keyPath: "archiveId" });
            store.createIndex("timestamp", "timestamp", { unique: true }); // ソート用
        }
    });
    console.log("indexedDBの準備はできました");
    return db;
}

// データベースを開く関数
function openDatabase(dbName, version, onUpgradeNeeded) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (onUpgradeNeeded) {
                onUpgradeNeeded(db); // 必要に応じてオブジェクトストア作成
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// トランザクションを取得する関数
function getTransaction(storeName, mode = TRANSACTION_MODES.READONLY) {
    // console.log("storeName: ", storeName);
    if (!db) {
        throw new Error("データベースが初期化されていませんinitializeDB()を先に実行してください");
    }
    return db.transaction(storeName, mode).objectStore(storeName);
}

// 指定されたストアを取得する関数
function getStore(storeName, mode = TRANSACTION_MODES.READONLY) {
    if (!db) {
        throw new Error("データベースが初期化されていません　initializeDB() を先に実行してください");
    }
    let tran = db.transaction(storeName, mode); // 指定されたモードでトランザクションを開始
    return tran.objectStore(storeName); // オブジェクトストアを返す
}

// データを取得する関数
function getDataByKey(storeName, key) {
    return new Promise((resolve, reject) => {
        const store = getTransaction(storeName, TRANSACTION_MODES.READONLY);
        const request = store.get(key);
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}


// データを追加・更新する関数
function upsertData(storeName, data) {
    return new Promise((resolve) => {
        try {
            const store = getTransaction(storeName, TRANSACTION_MODES.READWRITE);
            // console.log("リクエスト（DB）:", storeName, data);
            const request = store.put(data); // `put` は新規作成または更新
            // 正常処理
            request.onsuccess = () => {
                // console.log("レスポンス（正常）");
                resolve(true);
            };
            // 例外処理
            request.onerror = (event) => {
                console.error("レスポンス（異常）:", event.target.error);
                displayToast("データの保存に失敗しました");
                resolve(false); // 失敗時は `false`
            };
        } catch (err) {
            console.error("例外発生:", err);
            displayToastError("データ処理中にエラーが発生しました");
            resolve(false); // 例外発生時も `false`
        }
    });
}


// データを削除する関数
function deleteData(storeName, key) {
    return new Promise((resolve, reject) => {
        const store = getTransaction(storeName, TRANSACTION_MODES.READWRITE);
        const request = store.delete(key);
        request.onsuccess = () => {
            console.log(`削除されました ${key}`);
            resolve();
        };
        request.onerror = (event) => {
            console.log(`削除に失敗しました ${key}`);
            reject(event.target.error);
        };
    });
}

// 全データを取得する関数
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const store = getTransaction(storeName, TRANSACTION_MODES.READONLY);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// ストアの件数を返却する関数
async function getCount(storeName) {
    return new Promise((resolve, reject) => {
        const store = getTransaction(storeName, TRANSACTION_MODES.READONLY);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
            resolve(countRequest.result);
        };

        countRequest.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// ストアを指定した件数に維持する関数
async function trimStoreSize(storeName, maxCount, sortKey, sortOrder = "asc") {
    try {
        let count = await getCount(storeName); // ストア内の現在の件数を取得
        if (count > maxCount) {
            let store = getTransaction(storeName, TRANSACTION_MODES.READWRITE);
            let cursorRequest;
            if (store.indexNames.contains(sortKey)) {
                // 指定されたソートキーのインデックスを利用してカーソルを開く（昇順 or 降順）
                cursorRequest = store.index(sortKey).openCursor(null, sortOrder === "desc" ? "prev" : "next");
            } else {
                // インデックスがない場合は主キーを基準にカーソルを開く
                cursorRequest = store.openCursor(null, sortOrder === "desc" ? "prev" : "next");
            }
            let deleteCount = count - maxCount; // 削除する件数を計算
            cursorRequest.onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor && deleteCount > 0) {
                    let keyToDelete = cursor.primaryKey; // 削除対象のキーを取得
                    store.delete(keyToDelete); // データを削除
                    deleteCount--; // 削除件数を減らす
                    cursor.continue(); // 次のデータへ移動
                }
            };
            cursorRequest.onerror = function(event) {
                console.error("カーソルエラー:", event.target.error); // エラー処理
            };
        }
    } catch (error) {
        console.error("エラー:", error); // 例外処理
    }
}


