
// ■■■■■　データベースの初期化　■■■■■
(async function initDatabase() {
    // 一度だけ、初回に非同期処理を実行したい場合に、即時実行関数を使用する
    // console.log("initDatabase()");
    await initializeDB();
})();



// ◆ルートメモを登録する処理
async function UpsertMemoLocalDB(jsonArray) {
    console.log('upsertDataMemo');
    if(jsonArray.dbid){
        jsonArray.dbid = Number(jsonArray.dbid);
        if(jsonArray.dbid == 0){
            delete jsonArray.dbid; // dbidを削除して自動採番を使う
        }
    }
    return await upsertData(STORE_NAMES.ROUTE_MEMO, jsonArray);
}
// localDBからデータを取得する
async function getAllRouteMemo(){
    console.log("getAllRouteMemo");
    const allData = await getAllData(STORE_NAMES.ROUTE_MEMO);
    allData.sort((a, b) => b.dbid - a.dbid); // 降順にソート
    return allData;
}
// ローカルのメモデータを更新（バルク処理）★未検証
async function UploadRouteMemo() {
    const mapData = await getAllData(STORE_NAMES.ROUTE_MEMO);
    if (mapData.length == 0) return;
    console.log('UploadRouteMemo');
    // サーバーに一括アップロード
    const isSuccess = await UpsertMemoData(mapData);
    if (isSuccess) {
        console.log(`データが正常に処理されました`);
        await deleteData(STORE_NAMES.ROUTE_MEMO, jsonArrayDb.dbid);
        console.log(`データが削除されました`);
        // ルート作成
        AppStatus.archiveId = 0;
        // ルートマッピング
        renderRouteMapping();
    } else {
        displayToastWaning(`更新処理に失敗しました`);
    }
}



// ◆リアクションを登録する処理
async function UpsertReactionLocalDB(param, onInit = false) {
    // console.log('UpsertReactionLocalDB_1', param);
    // archiveId_seq を生成
    param.archiveId_seq = `${param.archiveId}-${param.seq}`;
    const existingData = await getDataByKey(STORE_NAMES.REACTION, param.archiveId_seq);
    // 既存の未変更データを上書きしない
    if (existingData && existingData.status == DEF_STS_CHANGED && onInit) return;
    // console.log('UpsertReactionLocalDB_2', param);
    // 既存データと新しいデータをマージ
    param = { ...existingData, ...param };
    // 更新日時を設定
    param.updatedAt = new Date(Date.now());
    // 初期読み込み判定
    if (!onInit) {
        // statusプロパティを追加
        param = { ...param, status: 'changed' };
    }
    // console.log('UpsertReactionLocalDB_3', param);
    // データ更新（新規登録または更新）
    await upsertData(STORE_NAMES.REACTION, param);
}
// archiveId と seq の組み合わせでデータを検索
async function getDataByArchiveSeq(archiveId, seq) {
    const archiveId_seq = `${archiveId}-${seq}`;
    return await getDataByKey(STORE_NAMES.REACTION, archiveId_seq);
}
// ローカルのリアクションデータを更新（バルク処理）
async function UploadReAction() {
    // すべてのデータ取得
    const allData = await getAllData(STORE_NAMES.REACTION);
    const currentTime = new Date();
    // ■更新処理
    const dataToSend = allData.filter(item => {
        const updatedAt = new Date(item.updatedAt);
        return (currentTime - updatedAt) >= (AppContext.interval_update_reAction * 1000 * 60)
            && item.status == DEF_STS_CHANGED;
    });
    // console.log("UploadReAction >> dataToSend: ", dataToSend);
    if (dataToSend.length > 0) {
        console.log("◆リアクション更新: ", dataToSend);
        // サーバーに一括送信
        const isSuccess = await UpsertReAction(dataToSend); // 一括送信（成否は不問）
        // 成否に関わらず status を DEF_STS_COMPLETED に更新
        for (const item of dataToSend) {
            item.status = DEF_STS_COMPLETED;
            await upsertData(STORE_NAMES.REACTION, item); // データを更新
        }
    }
    // ■削除処理
    const dataToDelete = allData.filter(item => {
        const deletedAt = new Date(item.deletedAt);
        return (currentTime - deletedAt) >= (AppContext.interval_delete_reAction * 1000 * 60)
        && item.status == DEF_STS_COMPLETED;
    });
    if (dataToDelete.length > 0) {
        console.log("◆リアクション削除: ", dataToDelete);
        for (const item of dataToDelete) {
            const archiveId_seq = `${item.archiveId}-${item.seq}`;
            console.log("dataToDelete >> archiveId_seq: ", archiveId_seq);
            await deleteData(STORE_NAMES.REACTION, archiveId_seq); // 削除処理
        }
    }
}



// ◆既読履歴（ニュース）を登録する処理
async function RegistNewsReadLocalDB(no) {
    console.log('RegistNewsReadLocalDB', no);
    // まず、データが既に存在するかどうかチェックする
    const existingData = await getDataByKey(STORE_NAMES.NEWS_READ, no);
    if (existingData) return;   // 登録済みならスキップ
    // データ更新（新規登録または更新）
    await upsertData(STORE_NAMES.NEWS_READ, { no: no });
}
// localDBからデータを取得する
async function getAllReadNews(){
    const allData = await getAllData(STORE_NAMES.NEWS_READ);
    return allData;
}



// ◆既読履歴（メニュー―）を登録する処理
async function RegistGuideReadLocalDB(no) {
    console.log('RegistGuideReadLocalDB', no);
    // まず、データが既に存在するかどうかチェックする
    const existingData = await getDataByKey(STORE_NAMES.GUIDE_READ, no);
    if (existingData) return;   // 登録済みならスキップ
    // データ更新（新規登録または更新）
    await upsertData(STORE_NAMES.GUIDE_READ, { no: no });
}
// localDBからデータを取得する
async function getAllReadGuide(){
    const allData = await getAllData(STORE_NAMES.GUIDE_READ);
    return allData;
}



// ◆閲覧履歴を登録する処理
async function RegistBrowsHistoryLocalDB(archive) {
    console.log("RegistBrowsHistoryLocalDB");
    const maxCount = 20;
    archive.timestamp = `${formatDateToDigitString(new Date())} ${formatTimeToDigitString(new Date())}`;
    if (await upsertData(STORE_NAMES.BROWS_HISTORY, archive)) {
        await trimStoreSize(STORE_NAMES.BROWS_HISTORY, maxCount, "timestamp", "desc"); // 古いデータを削除
    } else {
        console.error("登録エラー");
    }
}
// localDBからデータを取得する
async function getAllBrowsHistory(){
    const allData = await getAllData(STORE_NAMES.BROWS_HISTORY);
    return allData;
}



// ◆お気に入り履歴を登録する処理
async function RegistFavoriteHistoryLocalDB(archive) {
    console.log("RegistFavoriteHistoryLocalDB");
    const maxCount = 20;
    archive.timestamp = `${formatDateToDigitString(new Date())} ${formatTimeToDigitString(new Date())}`;
    if (await upsertData(STORE_NAMES.FAVORITE_HISTORY, archive)) {
        await trimStoreSize(STORE_NAMES.FAVORITE_HISTORY, maxCount, "timestamp", "desc"); // 古いデータを削除
    } else {
        console.error("登録エラー");
    }
}
async function DeleteFavoriteHistoryLocalDB(archive) {
    await deleteData(STORE_NAMES.FAVORITE_HISTORY, archive.archiveId);
}
// localDBからデータを取得する
async function getAllFavoriteHistory(){
    const allData = await getAllData(STORE_NAMES.FAVORITE_HISTORY);
    return allData;
}
// localDBからデータを取得する（１件）
async function getFavoriteHistoryByArchiveId(archiveId){
    const data = await getDataByKey(STORE_NAMES.FAVORITE_HISTORY, archiveId);
    return data;
}
