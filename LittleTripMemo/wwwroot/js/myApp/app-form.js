


const bodyHtml = `
    <form id="createMemoForm" class="h-100 d-flex flex-column m-1">
        <!-- 日付（通常） -->
        <div id=" " class="mb-2 ">
            <div class="d-flex flex-nowrap " >
                <div id="dateBtn" class="btn border d-flex flex-nowrap flex-grow-1 align-items-center px- fw-bold text-md2">
                </div>
                <!-- 顔アイコン -->
                <div id="faceIcon" class="ms-2 form-control d-flex justify-content-center align-items-center px-0" style="width:50px;">
                    <div class="btn p-0">
                        <span id="selectedFaceIcon" class=" ">
                        </span>
                    </div>
                </div>
                <!-- 天気アイコン -->
                <div id="weatherIcon" class="ms-2 form-control d-flex justify-content-center align-items-center px-0" style="width:50px;">
                    <div class="btn p-0 m-0" >
                        <span id="selectedWeatherIcon" class=" ">
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <!-- タイトル -->
        <div class="input-group flex-nowrap " >
            <div class="flex-grow-1">
                <input type="text" class="form-control pe-4" id="inputTitle" name="title" maxlength="100"
                    placeholder="場所、もしくはタイトルを入力..." required="">
            </div>
            <button id="getAddress" class="btn btn-outline-secondary" type="button" id="button-addon1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-geo" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.619.619 0 0 0 .146-.15.148.148 0 0 0 .015-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                </svg>
            </button>
        </div>
        <!-- 本文 -->
        <div class="mt-2 flex-grow-1 ">
            <textarea id="inputBody" name="body" class="form-control h-100" rows="5" maxlength="500" 
                placeholder="本文を入力..." required ></textarea>
        </div>
        <!-- 数値入力フィールド -->
        <div class="mt-2">
            <div class="input-group">
                <span class="input-group-text p-2">
                    ￥
                </span>
                <input inert id="inputPrice" name="memoPrice" type="text" class="form-control py-2" 
                    placeholder="使用した金額を入力..." readonly>
                <button id="calcBtn" class="btn btn-outline-secondary p-2" type="button">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8""  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-calculator"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 3m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 7m0 1a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1z" /><path d="M8 14l0 .01" /><path d="M12 14l0 .01" /><path d="M16 14l0 .01" /><path d="M8 17l0 .01" /><path d="M12 17l0 .01" /><path d="M16 17l0 .01" />
                    </svg>
                </button>
            </div>
        </div>
        <!-- リンクURL入力 -->
        <div class="mt-2">
            <div class="input-group">
                <span class="input-group-text p-2 py-0">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-world"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" />
                    </svg>
                </span>
                <input id="inputLinkUrl" name="linkUrl" type="text" class="form-control pe-5 text-truncate" 
                    placeholder="SNSへのリンクを入力..." >
                <button id="clearLinkBtn" class="btn btn-outline-secondary p-2 py-0" type="button">
                    x
                </button>
            </div>
        </div>
        <!-- 非表示項目 -->
        <input type="hidden" id="seq" name="seq" value="0">
        <input type="hidden" id="archiveId" name="archiveId" value="0">
        <input type="hidden" id="latitude" name="latitude">
        <input type="hidden" id="longitude" name="longitude">
        <input type="hidden" id="FaceId" name="FaceId" value="0">
        <input type="hidden" id="WeatherId" name="WeatherId" value="0">
        <input type="hidden" id="memoDate" name="memoDate">
        <input type="hidden" id="memoTime" name="memoTime">
        <!-- インデックスDB -->
        <input type="hidden" id="dbid" name="dbid" value="0">
        <!-- 画面モード（0：登録  1：変更） -->
        <input type="hidden" id="mode" name="insertFlg" value="0">
        <hr>
        <!-- フォーム下部 -->
        <div class="d-flex justify-content-center align-items-center mt-2_ w-100" >
            <!-- 保存ボタン -->
            <button type="submit" class="btn btn bg-primary text-light " style="width: 65%;">
                この内容で保存する
            </button>
        </div>
    </form>
`;
const footerHtml = `
`;



// 新規入力画面を開く
function openInputForm(insert){
    // 入力フォームを開く
    openDialogInputForm();
    // 入力フォームの見た目
    changeformstyle(insert);
    // フォームデータセット
    setFormData(insert);
    // 現在地を追跡
    if (insert) {
        startTrackingLocation();
    }
}

// 【ダイアログ】メモ入力フォーム ***********************************
async function openDialogInputForm(){
    // ヘッダー
    const header = "入力フォーム";
    // ボディ
    let body = bodyHtml;
    // フッター
    const footer = footerHtml;
    // ガイドNo
    let screenId = 11;
    // 画面生成
    modal =  openDialogCreate(header, body, footer, 'XX', screenId);
    const dialogElement = $(modal._element);
    dialogElement.on('hidden.bs.modal', function() {
        if (UserContext.watchLocation != 1) {
            pauseTrackingLocation(); // ここで位置情報の監視を停止
        }
    });
    // 入力フォームの初期化処理
    $('#selectedFaceIcon').html(`<img src="${_FaceIconList[0].imgUrl}" class="icon-md ">`);
    $('#selectedWeatherIcon').html(`<img src="${_WeatherIconList[0].imgUrl}" class="icon-md ">`);
    // 日付ボタン
    $('#dateBtn').off('click').on('click', async function () {
        const date = $("#memoDate").val();
        const time = $("#memoTime").val();
        let ret = await openDialogGetDateTime(date, time);
        console.log(ret);
        // フォームの各フィールドに値を設定
        $("#memoDate").val(ret.date);
        $("#memoTime").val(ret.time);
        $("#dateBtn").text(`${ret.date}  ${ret.time}`);
    });
    // 顔アイコン
    $('#faceIcon').off('click').on('click', async function () {
        // アイコン選択ダイアログ
        var FaceId = await openDialogSelectingIconList(1);
        if (!FaceId) return;
        updateSelectedFaceIcon(FaceId); // 関数を呼び出してアイコンを更新
    });
    // 天気アイコン
    $('#weatherIcon').off('click').on('click', async function () {
        // アイコン選択ダイアログ
        var WeatherId = await openDialogSelectingIconList(2);
        if (!WeatherId) return;
        updateSelectedWeatherIcon(WeatherId); // 関数を呼び出してアイコンを更新
    });
    // 最大文字列制限
    addInputMaxCounter("#inputBody", 200);
    updateCounterAddress = addInputMaxCounter("#inputTitle", 40);
    const updateCounterLink = addInputMaxCounter("#inputLinkUrl", 2000);
    // 住所取得（フォーム）
    $('#getAddress').off('click').on('click', async function () {
        let address = await getAddressFromCoordinates();
        $("#inputTitle").val(address);
        updateCounterAddress();
    });
    // SNSリンク入力
    $('#clearLinkBtn').off('click').on('click', async function () {
        $("#inputLinkUrl").val('');
        updateCounterLink();
    });
    // 金額入力
    $('#calcBtn').off('click').on('click', async function () {
        let ret = await openDialogCalc($("#inputPrice").val());
        if (!ret) return;
        console.log(ret);
        $("#inputPrice").val(ret);

    });
    // 保存ボタン押下時（フォーム）
    $('#createMemoForm').off('submit').on('submit', async function (event) {
        event.preventDefault(); // フォームの通常の送信を防ぐ
        // 現在地へ移動
        moveMapToMainMarker();
        // フォームから取得してjson用配列へ
        let jsonArray = await getFormData(this);
        console.log("jsonArray: ", jsonArray);
        if(!jsonArray) return;
        // データ登録処理
        if(AppStatus.isOnLine){
            await UpsertMemoData(jsonArray);
        }else{
            // データ登録処理（ローカルDB）
            await UpsertMemoLocalDB(jsonArray);
        }
        // フォームをクリア
        this.reset();
        // モーダルを閉じる
        $(this).closest('.modal').modal('hide');
        // ルートマッピング
        renderRouteMapping();
        // 現在マーカーへ
        moveMarkerToCurrent(18);
    });
}



// 【共通】入力フォームの見た目変更
function changeformstyle(insert = true){
    let $inputHeader = $("#inputArea").find(".modal-content");
    if(insert){
        $inputHeader.addClass('border-primary').removeClass('border-danger');
    }else{
        $inputHeader.removeClass('border-primary').addClass('border-danger');
    }
}

// 【フォーム】フォームにデータセット
let test = '';
async function setFormData(insert){
    try {
        if(insert){
            $('#mode').val(0);
            // 新規登録時
            $('#dbid').val(0);
            $('#archiveId').val(0);
            $('#seq').val(0);
            $("#inputTitle").val(test);
            $('#inputBody').val(test);
            // メモ日付、メモ時刻
            setCurrentDateTime();
            // リンクを非表示
            $("#groupLink").hide();
            // 住所自動設定
            if (UserContext.setAddress == 1) {
                $("#inputTitle").val(await getAddressFromCoordinates());
            }
        }else{
            $('#mode').val(1);
            // 変更時
            const data = _PointList[_CurrentIndex];
            // フォームの各フィールドに値を設定
            $('#dbid').val(data.dbid);
            $('#archiveId').val(data.archiveId);
            $('#seq').val(data.seq);
            $('#memoDate').val(data.memoDate);
            $('#memoTime').val(data.memoTime);
            $("#dateBtn").text(`${data.memoDate}  ${data.memoTime}`);   // 日付ボタン
            $('#inputTitle').val(data.title);
            $('#inputBody').val(data.body);
            $('#inputLinkUrl').val(data.linkUrl);
            $('#inputPrice').val(Number(data.memoPrice).toLocaleString());
            // リンクを表示
            $("#groupLink").show();
            // マーカーから設定
            const marker = _PointList[_CurrentIndex].marker;
            $("#latitude").val(marker.getLatLng().lat);
            $("#longitude").val(marker.getLatLng().lng);
            // マーカー更新
            updateSelectedFaceIcon(data.faceId);
            updateSelectedWeatherIcon(data.weatherId);
        }
    } catch (error) {
        errorProc("setFormData", error);
    }
}
// 【フォーム】メモ日付、メモ入力
function setCurrentDateTime() {
    let now = new Date();
    // console.log("new Date(): ", now);
    let year = now.getFullYear();
    let month = ("0" + (now.getMonth() + 1)).slice(-2); // 月は0から始まるため +1
    let day = ("0" + now.getDate()).slice(-2);
    let currentDate = `${year}-${month}-${day}`;
    let currentTime = now.toTimeString().slice(0, 5); // "HH:MM"形式にする
    // フォームの各フィールドに値を設定
    $("#memoDate").val(currentDate);
    $("#memoTime").val(currentTime);
    $("#dateBtn").text(`${currentDate}  ${currentTime}`);
}
// 【フォーム】現在地セット
function setFormLocation(){
    if ($("#seq").val() == 0) {
        // 新規登録時のみセット
        console.log("setFormLocation: ", _MainMarker.getLatLng());
        $("#latitude").val(_MainMarker.getLatLng().lat);
        $("#longitude").val(_MainMarker.getLatLng().lng);
    }
}


// 【共通】入力データ取得
function getFormData(formElement){
    // 現在位置の取得（position.coords.latitude, position.coords.longitude）
    setFormLocation();
    // フォームから値取得
    let jsonArray = formDataToJsonArray(formElement);
    // 日付変換
    jsonArray.memoDate = formatDateToDigitString(new Date(jsonArray.memoDate));
    jsonArray.memoTime = formatTimeToDigitString(new Date('1970-01-01T' + jsonArray.memoTime));
    // 金額
    jsonArray.memoPrice = convertStringToNumber(jsonArray.memoPrice);
    // 入力検証
    let ret = validateForm(jsonArray);
    if (!ret) return;
    return ret;
}
// 【共通】フォーム要素から配列生成（json変換前準備）
function formDataToJsonArray(formElement) {
    let formData = new FormData(formElement);
    let jsonArray = {};
    // 配列化
    formData.forEach(function(value, key) {
        jsonArray[key] = value;
    });
    return jsonArray;
}
// 【共通】フォームチェック
function validateForm(jsonArray){
    // 入力年度チェック
    const currentYear = new Date().getFullYear();     // 現在年
    const memoYear = parseInt(jsonArray.memoDate.split("-")[0], 10); // 年だけ抽出
    if (Math.abs(currentYear - memoYear) > 1) {
        // 現在の年から前後1年以上でエラー
        displayToastWaning("入力年度を確認してください");
        return null; // エラーがあれば終了
    }
    return jsonArray;
}
// アイコン選択を更新する関数（顔アイコン）
function updateSelectedFaceIcon(faceId) {
    const $selectedFaceIcon = document.getElementById('selectedFaceIcon');
    if(!$selectedFaceIcon) return;
    const $FaceId = document.getElementById('FaceId');
    // PathListから画像データを取得
    let image = getImgDataByFaceId(faceId);
    if(!image) {
        image = _FaceIconList[0].imgUrl;
    }
    // selectedFaceIconを更新
    $selectedFaceIcon.innerHTML = `<img src="${image.imgUrl}" class="icon-md ">`;
    // FaceIdの値を更新
    $FaceId.value = image.faceId; // アイコンIDを表示
}
// アイコン選択を更新する関数（天気アイコン）
function updateSelectedWeatherIcon(weatherId) {
    const $selectedWeatherIcon = document.getElementById('selectedWeatherIcon');
    if(!$selectedWeatherIcon) return;
    const $WeatherId = document.getElementById('WeatherId');
    // PathListから画像データを取得
    let image = getImgDataByWeatherId(weatherId);
    console.log("updateSelectedWeatherIcon: ", image);
    if(!image) {
        image = _WeatherIconList[0];
    }
    // selectedWeatherIconを更新
    $selectedWeatherIcon.innerHTML = `<img src="${image.imgUrl}" class="icon-md ">`;
    // WeatherIdの値を更新
    $WeatherId.value = image.weatherId; // アイコンIDを表示
}
// 住所を取得してフォームに反映(要素名を渡す)
async function getAddressFromCoordinates() {
    if(!AppStatus.isOnLine){
        return "オフライン中...";
    }
    // 画面モード取得（0：登録　1：変更）
    let mode = $('#mode').val();
    try {
        const zoom = 18;    //10～18
        if(mode == 0){
            center = _MainMarker.getLatLng();
        }else{
            // let marker = _routeMarkerList[_CurrentIndex];
            let marker = _PointList[_CurrentIndex].marker;
            center = marker.getLatLng();
        }
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json&zoom=${zoom}&addressdetails=1`;
        const response = await fetch(url);
        const data = await response.json();
        // console.log("data.display_name: ", data);
        const parts = data.display_name.split(',').map(part => part.trim());
        // 1番目と3番目を抜き出し
        const address1 = parts[0] || ''; // 1番目（空チェック）
        const address3 = parts[2] ? `（${parts[2]}）` : ''; // 3番目を括弧で囲む（空チェック）
        return `${address1}${address3}`;
    } catch (error) {
        errorProc("getAddressFromCoordinates", error);
        return "住所取得エラー...";
    }
}



// 共通変数（計画用）///////////////////////////////////////////////////
let interval;
const holdDelay = 150;
// 【計画用】時間調整
function adjustTime(minutes) {
    const $timeInput = $('#memoTime');
    let timeValue = $timeInput.val();
    if (!timeValue) {
        timeValue = "12:00";
    }
    let [hours, mins] = timeValue.split(":").map(Number);
    let totalMinutes = hours * 60 + mins + minutes;
    // Day counter
    const $dayCounterElement = $('#dayCounter');
    let dayCount = parseInt($dayCounterElement.attr('data-day'));
    if (totalMinutes >= 24 * 60) {
        totalMinutes -= 24 * 60;
        dayCount++;
    } else if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
        if (dayCount > 1) dayCount--;
    }
    let newHours = Math.floor(totalMinutes / 60);
    let newMinutes = totalMinutes % 60;
    $timeInput.val(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
    $dayCounterElement.text(`${dayCount}日目`);
    $dayCounterElement.attr('data-day', dayCount);
}
// 【計画用】時間変化開始
function startAdjustingTime(minutes) {
    adjustTime(minutes);
    interval = setInterval(() => adjustTime(minutes), holdDelay);
}
// 【計画用】時間変化終了
function stopAdjustingTime() {
    clearInterval(interval);
}
// 【計画用】時間調整イベント
function addEventListeners($button, minutes) {
    $button.on('mousedown', () => startAdjustingTime(minutes));
    $button.on('mouseup mouseleave', stopAdjustingTime);
    $button.on('touchstart', (e) => { e.preventDefault(); startAdjustingTime(minutes); });
    $button.on('touchend', stopAdjustingTime);
}
