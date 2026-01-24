


// // SNSログイン
// async function RegisterBySns(email, nickName) {
//     try {
//         console.log("LoginBySns: ", email);
//         const params = {
//             Email: email,
//             Password: "aaa",
//             ConfirmPassword: "aaa",
//             NickName: nickName,
//         };
//         // サーバにメールアドレスを送信してSNSログイン処理を実行
//         const url = `/Account/Register`;
//         const data = await fetchData('post', url, params);
//         if (!data) return false;
//         location.href = data.redirectUrl;
//         return true;
//     } catch (error) {
//         console.error("Googleログイン失敗:", error);
//         // displayToastWaning("Googleログインに失敗しました");
//         return false;
//     }
// }

// SNSログイン
async function LoginBySns(email) {
    try {
        console.log("LoginBySns: ", email);
        const params = {
            Email: email,
        };
        // サーバにメールアドレスを送信してSNSログイン処理を実行
        const url = `/Account/SnsLogin`;
        const data = await fetchData('post', url, params);
        if (!data) return false;
        location.href = data.redirectUrl;
        return true;
    } catch (error) {
        console.error("Googleログイン失敗:", error);
        // displayToastWaning("Googleログインに失敗しました");
        return false;
    }
}

// 【システム】ログアウト
async function Logout(){
    // オフラインチェック
    if (!OfflineCheck()) return false;
    const url = '/Account/logout'; // ログアウト用のエンドポイントURL
    const data = await fetchData('post', url);
    if (!data) return;
    // 成功時にリダイレクト先のURLを取得
    window.location.replace(data.url);
}

// 【取得】アプリシステム情報★
async function GetAppSysInfo(){
    // サーバ処理
    const url = `/AppSys/GetAppSysInfo/`;
    const data = await fetchData('get', url, null, false);
    if(!data) return;
    // アプリ情報
    AppContext.app_news = data.appNews;
    AppContext.app_guides = data.appGuides;
    console.log("◇GetAppSysInfo: ", AppContext);
    return true;
}



// 【取得】当日データ
async function GetMemoByToday(){
    // サーバ処理
    const url = `/RouteMemo/GetMemoByToday/`;
    const data = await fetchData('get', url);
    if(!data) return;
    return data.resMemos;
}

// 【取得】メモ全データ
async function GetMemoAll(){
    // サーバ処理
    const url = `/RouteMemo/GetMemoAll/`;
    const data = await fetchData('get', url);
    if(!data) return;
    return data.resMemos;
}

// 【取得】まとめ親＆まとめ子
async function GetArchivesData(){
    // サーバ処理
    const isPublish = AppStatus.isPublish;
    const archiveId = AppStatus.archiveId;
    const archiveIdEncoded = encodeId(archiveId);    //暗号化
    let url;
    if (isPublish) url = `/Publish/GetPublishByArchiveId/${archiveIdEncoded}`;
    else url = `/RouteMemo/GetArchiveByArchiveId/${archiveIdEncoded}`;
    const data = await fetchData('get', url);
    if(!data) return;
    AppStatus.archive = data.resArchive;
    // 画面遷移のための設定
    AppStatus.archiveId = data.resArchive.archiveId;
    return data.resMemos;
}

// 【取得】地点データ
async function searchByPointData(sortId = 1, orderBy = 2) {
    // サーバ処理
    const isPublish = AppStatus.isPublish;
    const params = {
        searchRange: getRangeForSearch(),
        limit: AppContext.max_read_count, // 一度に読み込むデータ件数,
        sortId: sortId,
        isDescending: (orderBy == 2),
    };
    // 結果はどうあれマーカーはクリア
    clearRouteMarker();
    // 取得するURLを設定
    const url = isPublish ? `Publish/GetPublishByPoint` : `RouteMemo/GetArchiveByPoint`;
    // データ取得
    const data = await fetchData('post', url, params);
    if (!data) return;
    const mapData = data.resMemos;
    // 取得したデータでマーカーをレンダリング
    if (!mapData || mapData.length == 0) {
        displayToast("地点データは見つかりませんでした", DEF_MODE_WARNING);
        return false;
    }
    // マーカー描画
    createPointMarker(mapData); // 矢印は描画しない
    // ローカルDBに保存
    if (isPublish) mapDataToLocalDB(mapData);
}

// 【取得】まとめタイトルリスト
async function GetArchivesTitleList(){
    // サーバ処理
    // 非公開を取得
    let url1 = `/RouteMemo/GetArchivesTitleList`;
    let data1 = await fetchData('get', url1, null, false);
    if(!data1) return;
    const list1 = data1.archiveTitleList;
    // 公開分を取得
    let url2 = `/Publish/GetArchivesTitleList`;
    let data2 = await fetchData('get', url2, null, false);
    if(!data2) return;
    const list2 = data2.archiveTitleList;
    // 取得した配列をマージ
    const archiveTitleList = list1.concat(list2);
    // console.log("archiveTitleList: ", archiveTitleList);
    // return archiveTitleList;
    _archiveTitleList = archiveTitleList;
}



// 【更新】ルートメモ更新
async function UpsertMemoData(params){
    // サーバ処理
    const isPublish = AppStatus.isPublish;
    const url = isPublish ? `Publish/UpdateMemoPublish` : `RouteMemo/UpsertMemo`;
    // サーバ更新
    const data = await fetchData('post', url, params);
	if (!data) return;
    // 画面遷移のための設定
    AppStatus.seq = data.resMemo.seq;
    return true;
}

// 【更新】まとめ子　作成（メモ＞まとめ）
async function CreateArchive(params) {
    // サーバ処理
    const url = '/RouteMemo/CreateArchive';
    const data = await fetchData('post', url, params);
    if(!data) return;
    AppStatus.archive = data.resArchive;
    // 画面遷移のための設定
    AppStatus.archiveId = data.resArchive.archiveId;
    AppStatus.isPublish = false;    // 戻してやる
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】まとめ子　追加
async function AddArchive(params) {
    // サーバ処理
    const url = '/RouteMemo/AddArchive';
    const data = await fetchData('post', url, params);
    if(!data) return;
    AppStatus.archive = data.resArchive;
    // 画面遷移のための設定
    AppStatus.archiveId = data.resArchive.archiveId;
    AppStatus.isPublish = false;    // 戻してやる
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】まとめ子　除外
async function RemoveFromArchive(archiveId, seq) {
    const params = {
        archiveId: archiveId,
        seq: seq,
    }
    AppStatus.seq = params.seq;
    // サーバ処理
    const url = '/RouteMemo/RemoveFromArchive';
    const data = await fetchData('post', url, params);
    if (!data) return;
    // 画面遷移のための設定
    AppStatus.archiveId = data.archiveId;
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】まとめ子　削除
async function DeleteMemo(seq){
    const params = {
        archiveId: 0,
        seq: seq,
    }
    // サーバ処理
    const url = `/RouteMemo/DeleteMemo`;
    const data = await fetchData('post', url, params);
	if (!data) return;
    // // 画面遷移のための設定
    // AppStatus.archiveId = data.archiveId;
    // // まとめタイトルリスト取得（共通変数）
    // GetArchivesTitleList();
    return true;
}

// 【更新】まとめ子（公開）　削除
async function DeleteMemoPublish(archiveId, seq){
    const params = {
        archiveId: archiveId,
        seq: seq,
    }
    // サーバ処理
    // const isPublish = AppStatus.isPublish;
    const url = `/Publish/DeleteMemoPublish`;
    const data = await fetchData('post', url, params);
	if (!data) return;
    // 画面遷移のための設定
    AppStatus.archiveId = data.archiveId;
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】まとめ親　登録（非公開＞公開）
async function CreateArchivePublish(){
    // サーバ処理
    const url = "/publish/CreateArchivePublish";
    let param = {archiveId: AppStatus.archive.archiveId};
    const data = await fetchData('post', url, param);
    if(!data) return;
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】まとめ親　タイトル更新
async function UpdateArchiveInfo() {
    // サーバ処理
    const isPublish = AppStatus.isPublish;
    console.log(`AppStatus: ${AppStatus}`);
    let params = {
        ArchiveId: AppStatus.archive.archiveId,
        Title: sanitizeInput(AppStatus.archive.title),
        Memo: sanitizeInput(AppStatus.archive.memo),
        LinkUrl: sanitizeInput(AppStatus.archive.linkUrl),
        ClosedFlg: AppStatus.archive.isClosed,
    }
    const url = isPublish ? `/Publish/UpdateArchiveInfo` : `/RouteMemo/UpdateArchiveInfo`;
    const data = await fetchData('post', url, params);
    if(!data) return;
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return true;
}

// 【更新】リアクション更新
async function UpsertReAction(params){
    // サーバ処理
	// console.log("DelInsReAction: ", params);
    const url = '/Publish/UpsertReAction';
    const data = await fetchData('post', url, params, false);
	if (!data) return;
    return true;
}

// 【更新】まとめ親　削除
async function DeleteArchive(){
    // サーバ処理
    const isPublish = AppStatus.isPublish;
    const archiveId = AppStatus.archive.archiveId;
    const url = isPublish ? `/Publish/DeleteArchivePublish` : `/RouteMemo/DeleteArchive`;
    const data = await fetchData('post', url, archiveId);
	if (!data) return;
    // まとめタイトルリスト取得（共通変数）
    GetArchivesTitleList();
    return data;
}


// 【更新】フィードバック登録★
async function SendFeedback(params) {
    // サーバ処理
    const url = '/AppSys/InsertAppFeedback';
    const data = await fetchData('post', url, params);
    if(!data) return;
    return true;
}




// fetchAPIによるデータ取得
async function fetchData(method, url, requestData = null, waitScreen = true) {
    console.log("リクエスト：", url, requestData);
    // オフラインチェック
    if (!OfflineCheck()) return null;
    if (waitScreen) {
        waitingDisplay(true);  // 待機画面の開始
        // await delay(2000);
    }
    // リクエスト送信
    try {
        let response;
        const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
        const token = tokenInput ? tokenInput.value : '';
        switch (method.toLowerCase()) {
            case 'post':
                response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'RequestVerificationToken': token,
						'Content-Type': 'application/json; charset=utf-8',  // 明示的にUTF-8を指定
                        'Cache-Control': 'no-cache'
                    },
                    body: JSON.stringify(requestData) // POST時はリクエストデータを設定
                });
                break;
            case 'get':
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'RequestVerificationToken': token,
                        'Cache-Control': 'no-cache'
                    }
                });
                break;
            default:
                return;
        }
        // HTTPステータスエラーの処理
        if (!response.ok) {
            // console.error("response >> ", response.json());
            const errorData = await response.json(); // エラー情報を取得
            console.error("response >> ", errorData);
            displayToastWaning(`エラー発生！: \n申し訳ございません\n復旧するまでしばらくお待ちください`)
            return null;
        }
        // レスポンスデータの処理
        const res = await response.json();
        console.log(">> レスポンス：", url, res);
        if (res.status.result == "OK") {
            if(!res.data) res.data = "OK";
            return res.data; // 必要に応じてData部分だけを返す
        } else {
            displayToastWaning(`エラー発生！: \n${res.status.errType}`)
            console.error(`${res.status.errType}\n${res.status.errInfo}`);
            return null; // 業務エラー時はnullを返す
        }
    } catch (error) {
        errorProc("fetchData", error);
        return null;
    } finally {
        waitingDisplay(false); // 待機画面の解除
    }
}

