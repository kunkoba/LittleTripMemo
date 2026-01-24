
// // ◆閉じても消えない
// localStorage.setItem("username", "正和");
// console.log(localStorage.getItem("username")); // "正和"
// localStorage.removeItem("username"); // 削除
// // ◆閉じると消える
// sessionStorage.setItem("nickname", "まさかず");
// console.log(sessionStorage.getItem("nickname")); // "まさかず"
// sessionStorage.clear(); // すべて削除


// 【システム】アプリ固有の設定（基本的に固定）
globalThis.AppContext = {
    // アプリ情報
    app_version: '20250428-0000',
    // システムデータ
    app_news: null,
    app_guides: null,
    // システム設定値
    max_read_count: 20,
    interval_upload_routeMemo: 100,  // ルートメモ＿アップロード（分）
    interval_upload_reAction: 5,  // リアクション＿アップロード（分）
    interval_update_reAction: 1,  // リアクション更新（分）
    interval_delete_reAction: 60 * 24,  // リアクション削除（分）
    // デバッグ
    dubug_mode: true,
};


// 【システム】ユーザ固有の設定
globalThis.UserContext = {
    userName: '',  // ニックネーム
    setAddress: 0,  // 入力フォーム住所
    watchLocation: 0    //現在地取得
};

// 【システム】アプリの状態管理
globalThis.AppStatus = {
    screenId: 1,
    archive: [],
    memos: [],
    archiveId: 0,
    seq: 0,
    isOnLine: true,
    isPublish: false,
    isAnonymous: false,
};

// firebase設定（google）
globalThis.FirebaseConfig = {
    apiKey: "AIzaSyBJ-OSK-D6-NboGQtb1zQiDK7gkwbpXjv8",
    authDomain: "kunkoba.firebaseapp.com",
    projectId: "kunkoba",
    storageBucket: "kunkoba.firebasestorage.app",
    messagingSenderId: "41251112393",
    appId: "1:41251112393:web:836d8f5b87ebfdb59c1418",
    measurementId: "G-6XTLC5G1EY"
};

// 【システム】設定を一括設定
function setAppContext(values) {
    // Object.assign(globalThis.AppContext, values);
    // globalThis.AppContext = { ...globalThis.AppContext, ...values }; // 上の方がパフォーマンスがいい
    globalThis.AppContext.max_read_count = values.maxReadCount; // 余計な設定値が含まれないように
}

// 【グローバル変数】初期化
function clearAppStatus(){
    globalThis.AppStatus.archive = [];
    globalThis.AppStatus.archiveId = 0;
    globalThis.AppStatus.seq = 0;
    globalThis.AppStatus.isPublish = false;
}
// 【グローバル変数】設定を一括設定
function setAppStatus(values) {
    // console.log("setAppStatus: ", values);
    Object.keys(globalThis.AppStatus).forEach(key => {
        if (values.hasOwnProperty(key)) {
            globalThis.AppStatus[key] = values[key];
        }
    });
}


// SNSログインを行う関数(Google)
async function snsLoginByGoogle() {
    waitingDisplay(true);  // 待機画面の開始
    try {
        // Firebase 設定（初期化済みであればスキップ）
        if (!firebase.apps.length) firebase.initializeApp(FirebaseConfig);
        // google認証
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        // ユーザ情報取得
        const user = result.user;
        return user;
    } catch (error) {
        console.error("Googleログイン失敗:", error);
        alert(error);
        return null;
    } finally {
        waitingDisplay(false);  // 待機画面の終了
    }
}





// ■■■■■　デバッグモード　■■■■■
function DebugProc(){
    $('#appMode').text("デバッグモードで動作中...");
    // headerタグのクリックイベントを設定
    document.getElementById('mainHeader').addEventListener('click', function() {
        AppStatus.isOnLine = !AppStatus.isOnLine;
        let str;
        if (AppStatus.isOnLine) {
            console.log("オンラインです(test)");
            OnlineProc();
        } else {
            console.log("オフラインです(test)");
            OfflineProc();
        }
    });
}
