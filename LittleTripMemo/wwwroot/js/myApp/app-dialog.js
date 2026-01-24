
// トースト表示関数
function displayToast(message, mode = DEF_MODE_PRIMARY, delaySec = 2) {
    let $toast = $('#liveToast');
    let toast;
    // 現在表示されているトーストをクリア
    if ($toast.hasClass('show')) {
        const currentToast = bootstrap.Toast.getInstance($toast[0]);
        if (currentToast) {
            currentToast.dispose(); // トーストを破棄して状態をリセット
        }
    }
    // トーストの表示設定
    if (delaySec > 0) {
        toast = new bootstrap.Toast($toast[0], { autohide: true, delay: delaySec * 1000 });
    } else {
        toast = new bootstrap.Toast($toast[0], { autohide: false });
    }

    // // モードによるトーストの背景色設定
    // let currentClass;
    // switch (mode) {
    //     case DEF_MODE_PRIMARY:
    //         currentClass = 'bg-primary-subtle';
    //         break;
    //     case DEF_MODE_DANGER:
    //         currentClass = 'bg-danger-subtle';
    //         break;
    //     case DEF_MODE_WARNING:
    //         currentClass = 'bg-warning-subtle';
    //         break;
    //     default:
    //         currentClass = 'bg-primary';
    // }
    // // bg-で始まるクラスを削除
    // $toast[0].classList.forEach(className => {
    //     if (className.startsWith('bg-')) {
    //         $toast.removeClass(className);
    //     }
    // });
    // // 新しいクラスを追加
    // $toast.addClass(currentClass);

    // メッセージ設定
    var text = convertNewlinesTag(String(message));
    $toast.find('.toast-body').html(text);
    // トースト表示
    toast.show();
}
// 警告用トースト
function displayToastWaning(message) {
    displayToast(message, DEF_MODE_WARNING, 0);
    // displayToast(message, DEF_MODE_WARNING, 5);
}
// エラー用トースト
function displayToastError(message, errInfo) {
    displayToast(message + '<br>' + errInfo, DEF_MODE_DANGER, 0);
}



// 【ダイアログ】表示用（プロミス） ***********************************
async function openDialogOKOnly(content, textOK = "はい") {
    return new Promise((resolve) => {
        // **すでに開いているモーダルを取得して非表示にする**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示（暗さはそのまま）
        // ヘッダー
        const header = `システム`;
        // ボディ
        const body = `
            <div class="ms-2 mt-3 mb-5">
                ${content}
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-center">
                <button id="dialog-ok" class="btn btn-primary" style="min-width:100px;">${textOK}</button>
            </div>
        `;
        const modal = openDialogCreate(header, body, footer, 'XX');
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function() {
            // **閉じたモーダルを取得して表示する**
            if (openModal) openModal.style.display = 'block'; // 元に戻す
            resolve(false); // モーダルが閉じたらfalseを返す
        });
        $("#dialog-ok").off("click").on("click", function () {
            resolve(true);
            dialogElement.modal('hide');
        });
    });
}
// 【ダイアログ】確認用（プロミス） ***********************************
async function openDialogOKCancel(content, textOK = "はい") {
    return new Promise((resolve) => {
        // **すでに開いているモーダルを取得して非表示にする**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示（暗さはそのまま）
        // ヘッダー
        const header = `確認`;
        // ボディ
        const body = `
            <div class="ms-2 mt-3 mb-5">
                ${content}
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-between">
                <button id="dialog-cancel" class="btn btn-outline-secondary" style="min-width:100px;">やめとく</button>
                <button id="dialog-ok" class="btn btn-primary" style="min-width:100px;">${textOK}</button>
            </div>
        `;
        const modal = openDialogCreate(header, body, footer, 'XX');
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function() {
            // **閉じたモーダルを取得して表示する**
            if (openModal) openModal.style.display = 'block'; // 元に戻す
            resolve(false); // モーダルが閉じたらfalseを返す
        });
        $("#dialog-ok").off("click").on("click", function () {
            dialogElement.modal('hide');
            resolve(true);
        });
        $("#dialog-cancel").off("click").on("click", function () {
            dialogElement.modal('hide');
            resolve(false);
        });
    });
}
// 【ダイアログ】文字入力用（プロミス） ***********************************
async function openDialogInputBox(content, maxLength = 100, placeholder = "ここに入力") {
    return new Promise((resolve) => {
        // **すでに開いているモーダルを取得して非表示にする**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示（暗さはそのまま）
        // ヘッダー
        const header = `
            <div class=" ">
                入力フォーム
            </div>
        `;
        // ボディ
        const body = `
            <div class="mt-3 mb-5">
                <div class="mb-2">${content}</div>
                <input type="text" class="form-control pe-4 " id="inputDialog" 
                            name="title" maxlength="50" placeholder="${placeholder}..." required>
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-between">
                <button id="dialog-cancel" class="btn btn-outline-secondary" style="min-width:100px;">やめる</button>
                <button id="dialog-ok" class="btn btn-primary" style="min-width:100px;">決定！</button>
            </div>
        `;
        const modal = openDialogCreate(header, body, footer, 'XX');
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function() {
            // **閉じたモーダルを取得して表示する**
            if (openModal) openModal.style.display = 'block'; // 元に戻す
            resolve(null); // モーダルが閉じたらfalseを返す
        });
        $("#dialog-ok").off("click").on("click", function () {
            const inputText = $("#inputDialog").val();
            resolve(inputText);
            dialogElement.modal('hide');
        });
        $("#dialog-cancel").off("click").on("click", function () {
            resolve(null);
            dialogElement.modal('hide');
        });
        // 最大文字列制限
        addInputMaxCounter('#inputDialog', maxLength);
    });
}
// 【ダイアログ】日時入力用アイコン（プロミス）
async function openDialogGetDateTime(date, time) {
    // ガイドNo
    let screenId = 0;
    // 
    return new Promise((resolve) => {
        // **既存モーダルを非表示**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示にする
        // ヘッダー
        const header = `日時入力フォーム`;
        // ボディ
        let bodyHtml = `
            <div class="my-3">
                <!-- 日付 -->
                <div class="d-flex text-nowrap mb-3">
                    <!-- 日付入力 -->
                    <div class="input-group w-75">
                        <span class="input-group-text">日</span>
                        <input id="memoDate1" type="date" value=${date} class="fw-bold fs-5 form-control " name="memoDate" required >
                    </div>
                    <!-- 当日取得ボタン -->
                    <button id="btnToday" type="button" class="btn border text-primary ms-2 w-25">
                        Now
                    </button>
                </div>
                <!-- 時刻 -->
                <div class="d-flex text-nowrap ">
                    <!-- 時刻入力 -->
                    <div class="input-group d-flex text-nowrap w-50">
                        <span class="input-group-text">時</span>
                        <input id="memoTime1" type="time" value=${time} class="px-0 text-center fw-bold fs-5 form-control w-auto" name="memoTime" required>
                    </div>
                    <!-- 時刻調整ボタン -->
                    <div class="input-group ms-2 w-50">
                        <button id="btn10down" type="button" class="form-control text-primary p-1">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7l5 5l5 -5" /><path d="M7 13l5 5l5 -5" />
                            </svg>
                        </button>
                        <button  id="btn1down"type="button" class="form-control text-primary p-1">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" />
                            </svg>
                        </button>
                        <button  id="btn1up"type="button" class="form-control text-primary p-1">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 15l6 -6l6 6" />
                            </svg>
                        </button>
                        <button  id="btn10up"type="button" class="form-control text-primary p-1">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-up"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 11l5 -5l5 5" /><path d="M7 17l5 -5l5 5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-end">
                <button id="dialog-ok" class="btn btn-primary" style="min-width:100px;">決定</button>
            </div>
        `;
        // ダイアログ作成
        const modal = openDialogCreate(header, bodyHtml, footer, 'XX', screenId);
        // **モーダル閉じた後の処理**
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function () {
            if (openModal) openModal.style.display = 'block'; // 元のモーダルを表示
            resolve(null); // モーダル閉じた場合はnullを返す
        });
        $("#dialog-ok").off("click").on("click", function () {
            dialogElement.modal('hide');
            const result = {
                date: $("#memoDate1").val(),
                time: $("#memoTime1").val(),
            }
            resolve(result);
        });
        // 
        let interval;
        const holdDelay = 150; // 連続実行の間隔（ミリ秒）
        // 時刻を調整する関数（minutes 分増減
        function adjustTime(minutes) {
            const $timeInput = $('#memoTime1');
            let timeValue = $timeInput.val() || "12:00";
            let [hours, mins] = timeValue.split(":").map(Number);
            let totalMinutes = hours * 60 + mins + minutes;
            // 時間調整（24時間制）
            totalMinutes = (totalMinutes + 1440) % 1440; // 0:00〜23:59 の範囲内で調整
            let newHours = Math.floor(totalMinutes / 60);
            let newMinutes = totalMinutes % 60;
            $timeInput.val(`${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
        }
        // 長押し開始（連続処理を実行）
        function startAdjustingTime(minutes) {
            adjustTime(minutes);
            interval = setInterval(() => adjustTime(minutes), holdDelay);
        }
        // 長押し解除（連続処理を停止）
        function stopAdjustingTime() {
            clearInterval(interval);
        }
        // 各ボタンにイベントを設定
        function addEventListeners($button, minutes) {
            $button.on('mousedown touchstart', (e) => { 
                e.preventDefault();
                startAdjustingTime(minutes);
            });
            $button.on('mouseup mouseleave touchend', stopAdjustingTime);
        }
        // ボタンにイベントを追加
        addEventListeners($("#btn10down"), -10);
        addEventListeners($("#btn1down"), -1);
        addEventListeners($("#btn1up"), 1);
        addEventListeners($("#btn10up"), 10);
        // 今日の日付をセットする関数
        // function setToday() {
        //     const today = new Date().toISOString().split('T')[0]; // 今日の日付（YYYY-MM-DD）
        //     $("#memoDate1").val(today); // 入力フィールドにセット
        // }
        // // 「今日」ボタンにイベントを追加
        // $("#btnToday").click(setToday);
        // 今日の日付をセットする
        $("#btnToday").off("click").on("click", function () {
            // const today = new Date().toISOString().split('T')[0]; // 今日の日付（YYYY-MM-DD）
            // $("#memoDate1").val(today); 
            // $("#memoTime1").val(today); 
            let now = new Date();
            now.setHours(now.getHours() + 9); // UTC+9 に変換
            let today = now.toISOString().split('T')[0]; // YYYY-MM-DD（日本時間）
            let time = now.toISOString().split('T')[1].substring(0, 5); // HH:MM（日本時間）
            $("#memoDate1").val(today);  // 日付をセット
            $("#memoTime1").val(time);   // 時刻をセット
        });
    });
}
// 【ダイアログ】数値入力用（プロミス） ***********************************
async function openDialogCalc(value = 0) {
    const screenId = 0;
    // 
    return new Promise((resolve) => {
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none';
        // ヘッダー
        const header = `数値入力`;
        // ボタンフィールドを先に生成
        let buttonField = `<div class="container mb-3">`;
        const buttons = [[7, 8, 9], [4, 5, 6], [1, 2, 3], ["-", 0, "+"]];
        buttons.forEach(row => {
            buttonField += `<div class="row">`;
            row.forEach(num => {
                let className = "fs-5 btn bg-secondary-subtle num-btn";
                if (num === "-") className = "fs-5 btn btn-danger sub-btn";
                if (num === "+") className = "fs-5 btn btn-primary add-btn";
                buttonField += `
                    <div class="col-4 g-3 mt-0 mb-2">
                        <button type="button" class="${className} w-100 py-1">${num}</button>
                    </div>
                `;
            });
            buttonField += `</div>`;
        });
        buttonField += `</div>`;
        // ボディ
        const body = `
            <div class="container text-center">
                <!-- 合計値表示フィールド -->
                <div class="m-2 mb-3">
                    <div class="input-group">
                        <span class="fs-2 input-group-text">¥</span>
                        <input type="text" id="sumInput" class="fs-2 form-control text-end" placeholder="0" readonly>
                        <button id="clearSumBtn" class="fs-2 btn btn-outline-secondary" type="button">C</button>
                    </div>
                </div>
                <hr>
                <!-- 数値入力フィールド -->
                <div class="d-flex justify-content-center">
                    <div class="input-group mt-0 mx-5 mb-3">
                        <span class="fs-5_ input-group-text">¥</span>
                        <input type="text" id="numInput" class="fs-5_ form-control text-end" placeholder="0" readonly>
                        <button id="clearSumBtn2" class="fs-5_ btn btn-outline-secondary" type="button">C</button>
                    </div>
                </div>
                <!-- ボタンフィールド -->
                ${buttonField}
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-between">
                <button id="dialog-cancel" class="btn btn-outline-secondary" style="min-width:100px;">閉じる</button>
                <button id="dialog-ok" class="btn btn-primary" style="min-width:100px;">決定</button>
            </div>
        `;
        const modal = openDialogCreate(header, body, footer, 'XX', screenId);
        const dialogElement = $(modal._element);
        // 閉じるイベント
        dialogElement.on("hidden.bs.modal", function () {
            if (openModal) openModal.style.display = "block";
            resolve(null);
        });
        // 初期値設定
        let $sumElement = $("#sumInput");
        let $numElement = $("#numInput");
        $sumElement.val(value);
        // OKボタン
        dialogElement.on("click", "#dialog-ok", function () {
            const price = $sumElement.val();
            resolve(price);
            dialogElement.modal("hide");
        });
        // キャンセルボタン
        dialogElement.on("click", "#dialog-cancel", function () {
            resolve(null);
            dialogElement.modal("hide");
        });
        // 番号ボタン
        $(".num-btn").off("click").on("click", function () {
            // let currentValue = $numElement.val().replace(/,/g, "");
            let currentValue = convertStringToNumber($numElement.val());
            let newValue = currentValue + $(this).text().trim();
            $numElement.val(Number(newValue).toLocaleString());
        });
        // 追加ボタン
        $(".add-btn").off("click").on("click", function () {
            let sumValue = convertStringToNumber($sumElement.val());
            let numValue = convertStringToNumber($numElement.val());
            let total = sumValue + numValue;
            $sumElement.val(Number(total).toLocaleString());
            $numElement.val(0);
        });
        // クリアボタン（追加）
        $(".sub-btn").off("click").on("click", function () {
            let sumValue = convertStringToNumber($sumElement.val());
            let numValue = convertStringToNumber($numElement.val());
            let total = sumValue - numValue;
            $sumElement.val(Number(total).toLocaleString());
            $numElement.val(0);
        });
        // クリアボタン（合計）
        $("#clearSumBtn").off("click").on("click", function () {
            $sumElement.val(0);
        });
        // クリアボタン（合計）
        $("#clearSumBtn2").off("click").on("click", function () {
            $numElement.val(0);
        });
    });
}




// 【ダイアログ】選択用まとめタイトルリスト（プロミス） ***********************************
async function openDialogSelectingArchiveTitleList() {
    // ガイドNo
    let screenId = 0;
    // 
    return new Promise((resolve) => {
        // ヘッダー
        const header = `選択用まとめ一覧`;
        // 生成
        let bodyHtml;
        // フィルタリング
        const filterData = _archiveTitleList.filter(item => item.isPublish == false);
        if (filterData.length > 0 ) {
            bodyHtml = `
                ${filterData.map(item => {
                    return `
                        <button type="button" class="list-group-item list-group-item-action text-truncate p-2 select-button" 
                            data-archive-id="${item.archiveId}">
                            <div class="d-flex justify-content-between">
                                <div class="text-truncate fw-bold">${item.title}</div>
                            </div>
                            <div class="text-secondary d-flex justify-content-between">
                                <div class="text-sm3 mt-1 ms-2">登録日時：${item.createTim}</div>
                                <div>
                                    <span class="badge text-bg-secondary text-light ms-3 mt-2">${item.detailCount}</span>
                                </div>
                            </div>
                        </button>
                    `;
                }).join('')}
            `;
        } else {
            bodyHtml =`<div class="list-group-item text-center text-muted py-3">データがありません</div>`;
        }
        // ボディ
        const body = `<div id="selectingArchiveListContainer" class="list-group">${bodyHtml}</div>`;
        // フッター
        const footer = ``;
        const modal = openDialogCreate(header, body, footer, 'lg', screenId);
        // モーダルをプログラムで閉じるタイミングで非同期処理を解決する
        const dialogElement = $(modal._element); // モーダルDOM要素取得
        // モーダルが閉じたタイミングでresolveを呼び出す
        dialogElement.on('hidden.bs.modal', function() {
            resolve(); // モーダルが閉じた後にresolve
        });
        // ボタンのイベントを動的に設定
        $(".select-button").off("click").on("click", function () {
            const archiveId = $(this).data("archive-id");
            resolve(archiveId);
            $(this).closest('.modal').modal('hide');
        });
    });
}
// 【ダイアログ】選択用顔アイコン（プロミス）
async function openDialogSelectingIconList(iconKind) {
    // ガイドNo
    let screenId = 0;
    // 
    return new Promise((resolve) => {
        // **既存モーダルを非表示**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示にする
        // ヘッダー
        let header;
        // ボディ
        let bodyHtml = `<div class="row ">`; // 縦スクロール設定
        switch (iconKind) {
            case 1:
                header = `顔アイコンリスト`;
                _FaceIconList.forEach((image) => {
                    bodyHtml += `
                        <div class="col-3 btn">
                            <img src="${image.imgUrl}" class="icon-md" data-marker-id="${image.faceId}" alt="Icon">
                        </div>
                    `;
                });
                break;
            case 2:
                header = `天気アイコンリスト`;
                _WeatherIconList.forEach((image) => {
                    bodyHtml += `
                        <div class="col-3 btn">
                            <img src="${image.imgUrl}" class="icon-md" data-marker-id="${image.weatherId}" alt="Icon">
                        </div>
                    `;
                });
                break;
            default:
                return;
        }
        bodyHtml += `</div>`;
        // フッター
        const footer = ``;
        // ダイアログ作成
        const modal = openDialogCreate(header, bodyHtml, footer, 'XX', screenId);
        // モーダル要素を取得
        const dialogElement = $(modal._element);
        // **モーダル閉じた後の処理**
        dialogElement.on('hidden.bs.modal', function () {
            if (openModal) openModal.style.display = 'block'; // 元のモーダルを表示
            resolve(null); // モーダル閉じた場合はnullを返す
        });
        // アイコン選択イベント
        dialogElement.find('.icon-md').off('click').on('click', function (event) {
            const id = $(event.target).data('marker-id');
            resolve(id); // プロミスを解決して選択されたアイコンのidを返す
            dialogElement.modal('hide'); // モーダルを閉じる
        });
    });
}
// 【ダイアログ】共有用画面（プロミス） ***********************************
async function openDialogShare() {
    return new Promise((resolve) => {
        // **すでに開いているモーダルを取得して非表示にする**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示（暗さはそのまま）
        // ヘッダー
        const header = `みんなと共有しよう！`;
        // ボディ
        const body = `
            <div class="d-flex flex-column">
                <div class="m-2 mt-0">共有用URL、もしくはQRコードで他の方と共有できます</div>
                <div class="d-flex justify-content-center m-1">
                    <div id="qrcode" >
                    </div>
                </div>
                <div id="shareUrlBtn" class="btn m-2 px-2 bg-primary-subtle text-truncate"></div>
            </div>
        `;
        // フッター
        const footer = `
            <div class="w-100 d-flex justify-content-center">
                <button id="dialog-cancel" class="btn btn-outline-secondary" style="min-width:100px;">閉じる</button>
            </div>
        `;
        const modal = openDialogCreate(header, body, footer, 'XX');
        // ＱＲコード反映
        var baseUrl = window.location.origin;
        const archiveIdEncoded = encodeId(AppStatus.archiveId);    //暗号化
        var shareUrl = `Publish/ArchiveRoutePublish/${archiveIdEncoded}`;
        // var currentUrl = window.location.href;
        var currentUrl = baseUrl + "/" + shareUrl;
        document.getElementById("qrcode").innerHTML = ""; // 既存のQRコードをクリア
        new QRCode(document.getElementById("qrcode"), currentUrl);
        document.getElementById("shareUrlBtn").textContent = currentUrl; // 既存のQRコードをクリア
        // クリックイベント
        $("#shareUrlBtn").off("click").on("click", async function() {
            copyToClipboard(currentUrl);
            // await openDialogOKOnly(currentUrl);
        });
        // 
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function() {
            // **閉じたモーダルを取得して表示する**
            if (openModal) openModal.style.display = 'block'; // 元に戻す
            resolve(false); // モーダルが閉じたらfalseを返す
        });
        $("#dialog-ok").off("click").on("click", function () {
            dialogElement.modal('hide');
            resolve(true);
        });
        $("#dialog-cancel").off("click").on("click", function () {
            dialogElement.modal('hide');
            resolve(false);
        });
    });
}



// 【ダイアログ】アクションリスト ***********************************
async function openDialogActionList() {
    // ガイドNo
    let screenId = 11;
    // 
    const header = `アクション一覧`;
    const body = `
        <!-- ルートメモ -->
        <div class="list-group m-2 ">
            <div id="createRouteBtn" type="button" class="list-group-item list-group-item-action border ">
                <div class="row g-0 ">
                    <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-person-walking" viewBox="0 0 16 16">
                            <path d="M9.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M6.44 3.752A.75.75 0 0 1 7 3.5h1.445c.742 0 1.32.643 1.243 1.38l-.43 4.083a1.8 1.8 0 0 1-.088.395l-.318.906.213.242a.8.8 0 0 1 .114.175l2 4.25a.75.75 0 1 1-1.357.638l-1.956-4.154-1.68-1.921A.75.75 0 0 1 6 8.96l.138-2.613-.435.489-.464 2.786a.75.75 0 1 1-1.48-.246l.5-3a.75.75 0 0 1 .18-.375l2-2.25Z"></path>
                            <path d="M6.25 11.745v-1.418l1.204 1.375.261.524a.8.8 0 0 1-.12.231l-2.5 3.25a.75.75 0 1 1-1.19-.914zm4.22-4.215-.494-.494.205-1.843.006-.067 1.124 1.124h1.44a.75.75 0 0 1 0 1.5H11a.75.75 0 0 1-.531-.22Z"></path>
                        </svg>
                    </div>
                    <div class="col-10 ">
                        <div class="text-truncate fw-bold">ルートメモ作成</div>
                        <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                            <div>現在地に対してメモを作成します</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- メモ履歴一覧 -->
        <div class="list-group m-2 ">
            <div id="historyListBtn" type="button" class="list-group-item list-group-item-action ">
                <div class="row g-0 ">
                    <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-list-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3.5 5.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 11.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 17.5l1.5 1.5l2.5 -2.5" /><path d="M11 6l9 0" /><path d="M11 12l9 0" /><path d="M11 18l9 0" />
                        </svg>
                    </div>
                    <div class="col-10 ">
                        <div class="text-truncate fw-bold">メモ履歴一覧</div>
                        <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                            <div>まとめられていないメモの一覧です</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- まとめ一覧 -->
        <div class="list-group m-2 ">
            <div id="archiveListBtn" type="button" class="list-group-item list-group-item-action " >
                <div class="row g-0 ">
                    <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-archive"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" /><path d="M10 12l4 0" />
                        </svg>
                    </div>
                    <div class="col-10 ">
                        <div class="text-truncate fw-bold">まとめ一覧</div>
                        <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                            <div>まとめたメモを一覧から選択します</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 地点検索 -->
        <div class="list-group m-2 ">
            <div id="SearchByPointBtn" type="button" class="list-group-item list-group-item-action ">
                <div class="row g-0 ">
                    <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" />
                        </svg>
                    </div>
                    <div class="col-10 ">
                        <div class="text-truncate fw-bold">地点検索</div>
                        <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                            <div>まとめたメモに対して地点から検索します</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    const footer = ``;
    // 画面を開く
    openDialogCreate(header, body, footer, "XX", screenId);

    // ルートメモ作成（アクションリスト）
    $(document).off("click", "#createRouteBtn").on("click", "#createRouteBtn", function() {
        initCreateMemo();
        $(this).closest('.modal').modal('hide');
    });

    // メモ履歴一覧ボタン（アクションリスト）
    $(document).off("click", "#historyListBtn").on("click", "#historyListBtn", async function() {
        // オフラインチェック
        if (!OfflineCheck()) return false;
        let ret = await openDialogHistoryList();
        if (ret) $(this).closest('.modal').modal('hide');
    });

    // 地点検索（アクションリスト）
    $(document).off("click", "#SearchByPointBtn").on("click", "#SearchByPointBtn", function() {
        // オフラインチェック
        if (!OfflineCheck()) return false;
        initSearchPoint();
        $(this).closest('.modal').modal('hide');
    });

    // まとめ一覧（アクションリスト）
    $(document).off("click", "#archiveListBtn").on("click", "#archiveListBtn", function() {
        // オフラインチェック
        if (!OfflineCheck()) return false;
        let ret = openDialogArchiveTitleList();
        if (ret) $(this).closest('.modal').modal('hide');
    });
}



// 【ダイアログ】メモ履歴一覧 ***********************************
async function openDialogHistoryList() {
    // ガイドNo
    let screenId = 0;
    //メモ履歴一覧取得
    const mapData = await GetMemoAll();
    if (!mapData || mapData.length == 0) {
        displayToastWaning("まとめられていないメモが存在しません")
        return false;
    }
    // ヘッダー
    const header = `メモ履歴一覧`;
    // ボディ
    let body = '<div id="historyMemoContainer" class="overflow-auto-y mb-3 ">';
    body += generateMemoList(mapData);
    body += '</div>';
    // フッター
    const footer = `
        <div id="groupPrivate" class="w-100 my-2">
            <!-- メモをまとめる -->
            <div class="row g-0 w-100 " id=" ">
                <div id="createArchiveBtn" type="button" class="btn btn-success col-4 opacity-75 align-items-center">
                    まとめる
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    チェックされたメモを ひとつにまとめることができます
                </div>
            </div>
            <!-- 既存まとめに追加 -->
            <div class="row g-0 w-100 mt-2">
                <div id="AddArchiveBtn" type="button" class="btn btn-danger col-4 opacity-75 align-items-center">
                    追加する
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    チェックされたメモを 既存のまとめに追加します
                </div>
            </div>
        </div>
    `;
    // ダイアログ作成
    openDialogCreate(header, body, footer, 'lg', screenId);
    // チェックボックスのイベント追加
    $("#historyMemoContainer").on("change", ".header-checkbox", function () {
        var isChecked = $(this).prop("checked");
        var group = $(this).closest("[data-group]").attr("data-group");
        // 同じdata-groupを持つdata-checkboxをすべて変更
        $("[data-group='" + group + "']").find(".data-checkbox").prop("checked", isChecked);
    });
    // まとめ親　作成
    $('#createArchiveBtn').off("click").on('click', async function () {
        // 処理前チェック
        const params = getCheckedDataSeq();
        if(!params) return;
        // タイトル入力
        const title = await openDialogInputBox("まとめにタイトルをつけてください", 50);
        if (!title) {
            displayToastWaning("入力されたタイトルが確認できませんでした");
            return;
        }
        params.title = sanitizeInput(title);
        // サーバ更新
        await CreateArchive(params);
        $(this).closest('.modal').modal('hide');
        initArchiveMemo()
    });
    // まとめ子　親へ追加
    $('#AddArchiveBtn').off("click").on('click', async function () {
        // 処理前チェック
        const params = getCheckedDataSeq();
        if(!params) return;
        // 既存まとめ選択（非同期）
        const archiveId = await openDialogSelectingArchiveTitleList();
        if (!archiveId) return;
        params.archiveId = archiveId;
        // サーバ更新
        await AddArchive(params);
        $(this).closest('.modal').modal('hide');
        initArchiveMemo();
    });
    // まとめ子　削除
    $(document).off("click", "[id^=deleteBtn-]").on("click", "[id^=deleteBtn-]", async function(event) {
        event.preventDefault(); // デフォルト動作を防ぐ
        event.stopPropagation(); // イベントが親要素に伝播しないようにする
        let seq = $(this).attr("id").split("-")[1]; // IDから seq を取得
        // displayToast(`削除ボタンがクリックされました: seq=${seq}`);
        // 必要な削除処理をここに実装
        // $(`[data-seq=${seq}]`).remove(); // 画面上から該当要素を削除
        
        // 処理前確認
        let ret = await openDialogOKCancel("このメモだけ 削除しますか？<br>（元には戻せません）");
        if (!ret) return;
        // サーバ更新
        await DeleteMemo(seq);
        $(this).closest('.modal').modal('hide');
        openDialogHistoryList();    // 再表示
    });
    //
    return true;
}
// メモ履歴作成
function generateMemoList(mapData) {
    let html = "";
    let lastDate = null;
    let i = 0;
    mapData.forEach(item => {
        // ヘッダー
        if (item.memoDate !== lastDate) {
            i += 1;
            html += `
                <div class="py-1 bg-primary-subtle mt-2 " data-group="group-${i}">
                    <label class="p-2 d-flex align-items-center row g-0">
                        <div class="col-1 text-center">
                            <input type="checkbox" class="form-check-input header-checkbox">
                        </div>
                        <div class="col-11 fw-bold ps-2 text-md2 ">
                            ${item.memoDate}
                        </div>
                    </label>
                </div>
            `;
            lastDate = item.memoDate;
        }
        let despDelete = " d-none ";
        let anyDaysAgo = new Date(); // 現在の日付を取得
        const days = 7;
        anyDaysAgo.setDate(anyDaysAgo.getDate() - days); // 7日前の日付に変更
        let memoDate = new Date(item.memoDate); // item.memoTime を Date オブジェクトに変換
        if (memoDate <= anyDaysAgo) despDelete = ""; // 7日前以前なら処理を実行
        // 子要素
        html += `
            <div class="px-2 " data-group="group-${i}" data-seq=${item.seq}>
                <label class="d-flex align-items-center row g-0 w-100 ">
                    <div class="col-1 text-center">
                        <input type="checkbox" class="form-check-input data-checkbox">
                    </div>
                    <div class="col-2 text-center fw-bold">
                        ${item.memoTime}
                    </div>
                    <div class="col-8 p-2">
                        <div class="text-truncate fw-bold text-sm3 ">
                            ${item.title}
                        </div>
                        <div class="text-truncate text-secondary ms-2 text-sm2 ">
                            ${item.body}
                        </div>
                    </div>
                    <div id="deleteBtn-${item.seq}" class="col-1 ${despDelete}">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                        </svg>
                    </div>
                </label>
            </div>
        `;
    });
    //
    return html;
}
// チェックされたデータをまとめる
function getCheckedDataSeq() {
    // データが存在するか
    if ($('.data-checkbox').length == 0) {
        displayToastWaning("まとめられていないメモが存在しません");
        return null;
    }
    // チェックされているすべてのチェックボックスのdata-seqを取得
    let dataSeqs = $(".data-checkbox:checked").map(function () {
        return $(this).closest("[data-seq]").data("seq");
    }).get(); // `.get()` で jQuery オブジェクトを配列に変換
    // チェックされたデータが存在するか
    if (dataSeqs.length == 0) {
        displayToastWaning("チェックされた項目がありません");
        return null;
    }
    const data = {
        seqArray: dataSeqs,
    };
    return data;
}



// 【ダイアログ】まとめタイトルリスト ***********************************
function openDialogArchiveTitleList() {
    // ガイドNo
    let screenId = 0;
    //まとめ一覧
    if (!_archiveTitleList || _archiveTitleList.length == 0) {
        displayToastWaning("まとめられているデータが存在しません")
        return false;
    }
    // ヘッダー
    const header = `まとめタイトル一覧`;
    // ボディ
    const body = '<div id="archiveListContainer" class="list-group"></div>';
    // フッター
    const footer = `
        <div class="d-flex w-100">
            <div class="col input-group flex-nowrap">
                <div class="flex-grow-1">
                    <input id="searchWord" type="text" class="form-control pe-4" placeholder="検索ワード...">
                </div>
                <button id="searchArchiveBtn" type="button" class="btn btn-outline-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"></path>
                    </svg>
                </button>
            </div>
            <div id="btnGroup1" class="btn-group ms-3 " data-value="0" >
                <button id="btn1" type="button" data-value="1" class="btn btn-outline-success text-sm3 active" >非公開</button>
                <button id="btn2" type="button" data-value="2" class="btn btn-outline-success text-sm3 " >公開中</button>
            </div>
        </div>
    `;
    openDialogCreate(header, body, footer, 'lg', screenId);
    // ボディ置き換え
    filterArchiveTitleBody(_archiveTitleList, true, false);
    // 切替えフィルタ
    $('#btnGroup1 .btn').off("click").on('click', function() {
        let $parent = $('#btnGroup1');
        let $this = $(this);
        $('#btnGroup1 .btn').removeClass('active');
        $this.addClass('active');
        // クリックされたボタンの data-value を取得
        let value = $this.data('value');
        // jQuery の .data() でセット
        $parent.data('value', value);
        // ボディ置き換え
        filterArchiveTitleBody(_archiveTitleList);
    });
    // 文字フィルタ
    $('#searchArchiveBtn').off("click").on('click', function() {
        // ボディ置き換え
        filterArchiveTitleBody(_archiveTitleList);
    });
    // 最大文字列制限
    addInputMaxCounter('#searchWord', 20);
    //
    return true;
}
// フィルタリング（まとめタイトル）
function filterArchiveTitleBody(data) {
    if (!data || data.length == 0) return;
    let $parent1 = $('#btnGroup1'); 
    let value1 = $parent1.data('value');
    let isPublish = value1 == 2;
    let searchWord = $('#searchWord').val(); 
    // フィルタリング
    const filterData = data.filter(item => item.isPublish == isPublish && item.title.includes(searchWord));
    // ボディ置き換え
    createArchiveTitleRow(filterData, isPublish);
}
// ボディ置き換え（まとめタイトルbody）
function createArchiveTitleRow(_archiveTitleList, isPublish){
    const existingModal = document.getElementById('archiveListContainer');
    if (existingModal) existingModal.innerHTML = "";
    // 生成
    let bodyHtml = `
        ${_archiveTitleList.map(item => {
            // 非公開アイコン取得
            let closedIcon = getClosedIcon(item.isPublish, item.isClosed);
            return `
                <button type="button" class="list-group-item list-group-item-action text-truncate p-2 archive-button" 
                    data-archive-id="${item.archiveId}">
                    <div class="d-flex justify-content-between">
                        <div class="text-truncate fw-bold">${item.title}</div>
                        <span class="badge bg-secondary-subtle text-dark rounded-pill_ d-flex align-items-center">${item.detailCount}</span>
                    </div>
                    <div class="text-secondary d-flex justify-content-start">
                        <div class="mx-3">
                            ${closedIcon}
                        </div>
                        <div class="text-sm3 mt-1 ">登録日時： ${convertToJapanTime(item.createTim)}</div>
                    </div>
                </button>
            `;
        }).join('')}
    `;
    existingModal.innerHTML = bodyHtml;
    // まとめタイトルボタン
    $(".archive-button").on("click", function () {
        const archiveId = $(this).data("archive-id");
        AppStatus.isPublish = isPublish;
        AppStatus.archiveId = archiveId;
        initArchiveMemo();
        $(this).closest('.modal').modal('hide');
    });
}
// 非公開アイコン取得
function getClosedIcon(isPublish, isClosed){
    let closedIcon = "";
    if (isPublish) {
        if (!isClosed) {
            closedIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                </svg>
            `;
        } else {
            closedIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                    <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                </svg>
            `;
        }
    }
    return closedIcon;
}



// 【ダイアログ】まとめ情報（参照用） ***********************************
async function openDialogArchiveShow() {
    // ガイドNo
    let screenId = 0;
    // 
    const isPublish = AppStatus.isPublish;
    const isOwnData = AppStatus.archive.isOwnData;
    const archiveId = AppStatus.archive.archiveId;
    // test
    AppStatus.archive.count_Good = AppStatus.archive.count_Good;
    AppStatus.archive.count_Bad = AppStatus.archive.count_Bad;
    // AppStatus.archive.count_Alert = AppStatus.archive.count_Alert;
    //
    const dispEdit = isOwnData ? "" : " d-none ";
    const dispShare = isPublish ? "" : " d-none ";
    const dispFavorite = isPublish ? "" : " d-none ";
    // ヘッダー
    const header = `まとめ情報（参照）`;
    // SNSリンク
    const url = AppStatus.archive.linkUrl;
    const iconKind = getSocialMediaIcon(url);
    // ボディ
    let body = `
        <div class="m-2">
            <!-- タイトル表示 -->
            <div id="archiveTitleShow" class="fw-bold border-bottom text-truncate p-1">
                ${AppStatus.archive.title}
            </div>
            <!-- メモ表示 -->
            <div id="archiveMemoShow" class="p-2 overflow-auto-y " style="height: 150px; max-height: 250px;">
                ${convertNewlinesTag(AppStatus.archive.memo)}
            </div>
            <!-- 金額表示 -->
            <div class="d-flex justify-content-center my-2">
                <div class="border-bottom d-flex justify-content-between w-50 px-2" >
                    <span class="fs-5">￥</span>
                    <span class="fs-5 text-end">${Number(AppStatus.archive.sumPrice).toLocaleString()}</span>
                </div>
            </div>
            <!-- リンク表示 -->
            <div class="mb-3_ w-100 ${url ? "" : " d-none "}">
                <div id="archiveInfoLinkBtn" class="btn p-2 px-3 rounded-pill bg-danger-subtle d-flex align-items-between">
                    <!-- アイコン -->
                    <div id="archiveLinkIcon" class=" ">
                        ${getSocialMediaIconHtml(iconKind)}
                    </div>
                    <!-- テキスト -->
                    <div id="archiveLinkShow" class="text-start text-truncate px-2 flex-grow-1">
                        ${url}
                    </div>
                </div>
            </div>
        </div>
    `;
    // フッター
    const footer = `
        <div class="d-flex justify-content-between w-100 ">
            <!-- 評価 -->
            <div>
                <div class="h-100 d-flex align-items-center text-gray ${isPublish ? "" : " d-none "} ">
                    <div class="mx-2 py-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span id="goodCount-${archiveId}">${AppStatus.archive.count_Good}</span>
                    </div>
                    <div class="mx-2 py-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                        </svg>
                        <span id="badCount-${archiveId}">${AppStatus.archive.count_Bad}</span>
                    </div>
                </div>
            </div>
            <div>
                <!-- お気に入りＯＮ -->
                <div id="heartOnBtn" class="btn ${dispFavorite} py-1 text-red">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="red"  class="icon icon-tabler icons-tabler-filled icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z" />
                    </svg>
                </div>
                <!-- お気に入りＯＦＦ -->
                <div id="heartOffBtn" class="btn ${dispFavorite} py-1 text-red">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="lightGray"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                    </svg>
                </div>
                <!-- 共有 -->
                <div id="shareBtn" class="btn ${dispShare} py-1">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-share"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M8.7 10.7l6.6 -3.4" /><path d="M8.7 13.3l6.6 3.4" />
                    </svg>
                </div>
                <!-- 編集 -->
                <div id="archiveInfoEditBtn" class="btn ${dispEdit} py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon><line x1="3" y1="22" x2="21" y2="22"></line>
                    </svg>
                </div>
            </div>
        </div>
    `;
    // 開く
    openDialogCreate(header, body, footer, "XX", screenId);
    // リンクボタン
    $('#archiveInfoLinkBtn').off('click').on('click', async function () {
        var ret = await openDialogOKCancel(`リンクを開きますか？（${iconKind}）<br><br>${url}`);
        if (ret) {
            window.open(url, '_blank');    // 新しいタブでリンクを開く
        } else {
            copyToClipboard(url);
            displayToast("URLをクリップボードに転送しました");
        }
    });
    // まとめ編集ボタン
    $('#archiveInfoEditBtn').off('click').on('click', function () {
        openDialogArchiveEdit();
        $(this).closest('.modal').modal('hide');
    });
    // 共有ボタン
    $('#shareBtn').off('click').on('click', async function () {
        // var currentUrl = window.location.href;
        // await openDialogOKOnly(`${currentUrl}`);
        await openDialogShare();
        $(this).closest('.modal').modal('hide');
    });
    // お気に入り初期状態
    let favoriteData = await getFavoriteHistoryByArchiveId(AppStatus.archive.archiveId);
    // console.log("favoriteData: ", favoriteData);
    if (favoriteData) {
        $("#heartOnBtn").show();  // ハートON表示
        $("#heartOffBtn").hide(); // ハートOFF非表示
    } else {
        $("#heartOnBtn").hide();  // ハートON表示
        $("#heartOffBtn").show(); // ハートOFF非表示
    }
    // クリック時に切り替え
    $("#heartOnBtn").off('click').on('click', function() {
        $("#heartOnBtn").hide();
        $("#heartOffBtn").show();
        // ローカ㏈削除
        DeleteFavoriteHistoryLocalDB(AppStatus.archive);
    });
    $("#heartOffBtn").off('click').on('click', function() {
        $("#heartOffBtn").hide();
        $("#heartOnBtn").show();
        // ローカル㏈登録
        RegistFavoriteHistoryLocalDB(AppStatus.archive);
    });
    // まとめ情報を設定
    setArchiveViewInfo();
}
// 【ダイアログ】まとめ情報（編集） ***********************************
function openDialogArchiveEdit() {
    // ガイドNo
    let screenId = 0;
    // 
    const isPublish = AppStatus.isPublish;
    let dispClosed = isPublish ? "": " d-none ";
    let activeClosedOFF = AppStatus.archive.isClosed ? "" : " active ";
    let activeClosedON = AppStatus.archive.isClosed ? " active " : "";
    // ヘッダー
    const header = `まとめ情報（編集）`;
    // ボディ
    let body = `
        <div class=" ">
            <!-- 一時非公開 -->
            <div class="d-flex justify-content-start w-100 py-2 ${dispClosed}" >
                <div id="btnClosedGroup1" class="btn-group " data-value="${AppStatus.archive.isClosed ? 1 : 0}" >
                    <button id="btn1" type="button" data-value="0" class="btn btn-outline-success text-sm3 ${activeClosedOFF}" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                        </svg>
                        <span class="mx-1">
                            公開中
                        </span>
                    </button>
                    <button id="btn2" type="button" data-value="1" class="btn btn-outline-success text-sm3 ${activeClosedON}" >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                            <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                        </svg>
                        <span class="mx-1">
                            一時的に非公開
                        </span>
                    </button>
                </div>
            </div>
            <!-- タイトル入力 -->
            <input id="archiveInfoTitle" class="form-control mt-2" type="text" placeholder="タイトルを入力..." >
            <!-- メモ入力 -->
            <textarea id="archiveInfoMemo" class="form-control mt-2 " rows="4" style="height: 150px;" 
                placeholder="一言メモを入力..." ></textarea>
            <!-- リンクURL入力 -->
            <div class="mt-2">
                <div class="input-group">
                    <span class="input-group-text p-2 py-0">
                        <svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-world"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" />
                        </svg>
                    </span>
                    <input type="text" class="form-control pe-5 text-truncate" id="archiveInfoLinkUrl" name="archiveInfoLinkUrl"
                        placeholder="リンクを入力..." required="">
                    <button id="clearLinkBtn" class="btn btn-outline-secondary p-2 py-0" type="button">
                        x
                    </button>
                </div>
            </div>
            <hr>
            <!-- 更新ボタン -->
            <div class="d-flex justify-content-end mt-2 mb-1">
                <div id="UpdateArchiveInfoBtn" class="btn btn-primary ">
                    変更する
                </div>
            </div>
        </div>
    `;
    // フッター
    const footer = `
        <!-- 非公開グループ -->
        <div id="groupPrivate" class="w-100 ">
            <!-- 公開（非公開） -->
            <div class="row g-0 w-100 " id="groupCreatePublish">
                <div id="CreatePublishBtn" type="button" class="btn btn-success col-3 opacity-75 align-items-center px-0">
                    公開する
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    コピーして公開用データにします<br>
                    （お互いの変更は反映されません）
                </div>
            </div>
            <!-- 削除（非公開） -->
            <div class="row g-0 w-100 mt-2">
                <div id="deleteArchiveBtn" type="button" class="btn btn-danger col-3 opacity-75 align-items-center">
                    戻す
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    メモ履歴へ戻ります<br>
                    （まとめられていない状態に戻ります）
                </div>
            </div>
        </div>
        <!-- 公開グループ -->
        <div id="groupPublish" class="w-100 ">
            <!-- 削除（公開中） -->
            <div class="row g-0 w-100 ">
                <div id="deleteArchivePubBtn" type="button" class="btn btn-danger col-3 opacity-75 ">
                    削除
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    完全に削除します<br>
                    （元には戻せませんので注意！）
                </div>
            </div>
        </div>
    `;
    // 開く
    openDialogCreate(header, body, footer, "XX", screenId);
    // 非公開切替え
    $('#btnClosedGroup1 .btn').off("click").on('click', function() {
        let $this = $(this);
        $('#btnClosedGroup1 .btn').removeClass('active');
        $this.addClass('active');
        $('#btnClosedGroup1').data('value', $this.data('value'));
    });
    // 表示切替
    $('#groupPrivate').toggleClass('d-none', isPublish);
    $('#groupPublish').toggleClass('d-none', !isPublish);
    // 公開済みチェック
    const isExists = AppStatus.archive.isExists;
    toggleElementDisabled('#groupCreatePublish', !isExists);
    if (isExists) $('#CreatePublishBtn').text("公開済");
    // まとめ情報更新★
    $('#UpdateArchiveInfoBtn').off("click").on('click', async function () {
        let ret = await openDialogOKCancel("まとめ情報を変更しますか？");
        if (!ret) return;
        // パラメータ生成
        AppStatus.archive.title = $("#archiveInfoTitle").val();
        AppStatus.archive.memo = $("#archiveInfoMemo").val();
        // console.log("◆AppStatus.archive.memo: ", AppStatus.archive.memo);
        AppStatus.archive.linkUrl = $("#archiveInfoLinkUrl").val();
        let isClosed = $('#btnClosedGroup1').data('value');
        // console.log("isClosed2 >> ", isClosed);
        AppStatus.archive.isClosed = isClosed == 1;
        // サーバ更新
        $(this).closest('.modal').modal('hide');
        let result = await UpdateArchiveInfo();
        if (result) {
            await displayToast("正常に変更されました");
            // まとめ情報を設定
            setArchiveViewInfo();
            // タイトルを設定
            setArchiveTitle();  // データ取得後
            //
            openDialogArchiveShow();
        }
    });
    // まとめ公開（非公開＞公開）
    $('#CreatePublishBtn').off("click").on('click', async function () {
        let ret = await openDialogOKCancel(`
            ・個人用データを複製し公開用データを作成します　公開用データは、作成直後は「一時非公開状態」となっています<br>
            ・公開用データは個人情報が含まれていないか必ず確認し、記載されている場合は内容を変更したり位置をずらす等の対処をしてください<br>
            ・上記、問題ないことを確認してから「公開」に変更してください<br>
            <br>
            <strong>公開用データを作成してもよろしいですか？</strong>
            `, "公開する");
        if (!ret) return;
        // サーバ更新
        AppStatus.isPublish = true;
        await CreateArchivePublish();
        initArchiveMemo();
        $(this).closest('.modal').modal('hide');
    });
    // まとめ戻す（まとめ＞メモ）
    $('#deleteArchiveBtn').off("click").on('click', async function () {
        let ret = await openDialogOKCancel("元のまとめられていないメモに戻しますが<br>戻してもよろしいですか？");
        if (!ret) return;
        // サーバ更新
        const data = await DeleteArchive();
        if(!data) return;
        // $(this).closest('.modal').modal('hide');
        $(this).closest('.modal').modal('hide');
        // 画面遷移
        initCreateMemo();
    });
    // まとめ削除（公開＞削除）
    $('#deleteArchivePubBtn').off("click").on('click', async function () {
        // if (!window.confirm("完全に削除してもよろしいですか？")) return;
        let ret = await openDialogOKCancel("完全に削除してもよろしいですか？<br>（元には戻せません）", "削除します");
        if (!ret) return;
        // サーバ更新
        const data = await DeleteArchive();
        if(!data) return;
        // $(this).closest('.modal').modal('hide');
        $(this).closest('.modal').modal('hide');
        // 画面遷移
        initCreateMemo();
    });
    // まとめ情報を設定
    setArchiveViewInfo();
    // 最大文字列制限
    addInputMaxCounter('#archiveInfoTitle', 40);
    addInputMaxCounter('#archiveInfoMemo', 200);
    const updateCounter = addInputMaxCounter('#archiveInfoLinkUrl', 2000);
    // リンク文字クリア
    $('#clearLinkBtn').off("click").on('click', function () {
        $('#archiveInfoLinkUrl').val("");
        updateCounter();
    });
}
// // まとめ情報を設定
function setArchiveViewInfo(){
    const title = AppStatus.archive.title;
    const memo = AppStatus.archive.memo;
    const url = AppStatus.archive.linkUrl;
    // 入力項目
    $("#archiveInfoTitle").val(title);
    $("#archiveInfoMemo").val(memo);
    $("#archiveInfoLinkUrl").val(url);
    // 表示項目
    $("#archiveTitleShow").text(title);
    $("#archiveMemoShow").val(memo);
    $("#archiveLinkShow").text(url);
    // $("#archiveTitleLabel").text(title);
}
// まとめタイトルボタンを設定
function setArchiveTitle(){
    // まとめタイトル設定
    const title = AppStatus.archive.title;
    $("#archiveTitleLabel").text(title);
    // 非公開アイコン設定
    let closedIcon = getClosedIcon(AppStatus.archive.isPublish, AppStatus.archive.isClosed);
    $("#archiveTitleIcon").empty();
    $("#archiveTitleIcon").append(closedIcon);
}



// 【ダイアログ】ポイント移動 ***********************************
function openPointMoveForm(){
    // ガイドNo
    let screenId = 0;
    // 
    const header = `「緯度・経度」を指定して移動`;
    const body = `
        <div class=" ">
            <div class=" my-1">
                <strong>＜緯度経度 取得方法＞</strong><br>
            </div>
            <div class="text-sm3 px-2">
                <strong>【スマホ版】：</strong>　googleMap地図上(建物ではない場所)で長押しすると位置情報が表示されるので それをコピーする<br>
                <strong>【ブラウザ版】：</strong>　googleMap地図上で右クリックすると「緯度・経度」が表示されるので それをコピーする
            </div>
            <div class="m-1 ">
                <a href="https://www.google.co.jp/maps/" target="_blank">
                    GoogleMapsを開く
                </a>
            </div>
            <div class="text-sm3 px-2 mb-2">
                上記で取得した「緯度・経度」を、下部のテキストボックスにペースト（貼り付け）して横のアイコンをクリック！<br>
                直接入力する場合はカンマ区切りで
            </div>
        </div>
    `;
    const footer = `
        <div class="d-flex w-100 m-1">
            <div class="input-group flex-nowrap">
                <input type="text" id="inputPointValue" class="form-control text-truncate text-dark px-2" 
                    placeholder="例）35.7[緯度], 139.8[経度]">
                <button id="pointMoveBtn" class="btn btn-outline-secondary" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24" fill="currentColor" class="bi bi-crosshair2" viewBox="0 0 16 16">
                        <path d="M8 0a.5.5 0 0 1 .5.5v.518A7 7 0 0 1 14.982 7.5h.518a.5.5 0 0 1 0 1h-.518A7 7 0 0 1 8.5 14.982v.518a.5.5 0 0 1-1 0v-.518A7 7 0 0 1 1.018 8.5H.5a.5.5 0 0 1 0-1h.518A7 7 0 0 1 7.5 1.018V.5A.5.5 0 0 1 8 0m-.5 2.02A6 6 0 0 0 2.02 7.5h1.005A5 5 0 0 1 7.5 3.025zm1 1.005A5 5 0 0 1 12.975 7.5h1.005A6 6 0 0 0 8.5 2.02zM12.975 8.5A5 5 0 0 1 8.5 12.975v1.005a6 6 0 0 0 5.48-5.48zM7.5 12.975A5 5 0 0 1 3.025 8.5H2.02a6 6 0 0 0 5.48 5.48zM10 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0"/>
                    </svg>
                </button>
            </div>

        </div>
    `;
    // 画面を開く
    openDialogCreate(header, body, footer, 'XX', screenId);

    // 経度緯度を取得してマップを移動する
    $('#pointMoveBtn').off("click").on('click', async function () {
        // 入力値を取得
        let input = $('#inputPointValue').val().trim();
        input = input.replace(/\(/g, "");
        input = input.replace(/\)/g, "");
        input = input.replace(/ /g, "");
        // カンマで区切る
        const coordinates = input.split(',');
        console.log("coordinates: ", coordinates);
        // 入力値の形式をチェック（緯度・経度が正しいか）
        if (coordinates.length == 2) {
            const lat = parseFloat(coordinates[0].trim());
            const lng = parseFloat(coordinates[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                // 閉じる
                // $(this).closest('.modal').modal('hide');
                $(this).closest('.modal').modal('hide');
                // 緯度・経度を使用してマップを移動
                await moveMapTo(lat, lng, 18);
            } else {
                displayToastWaning('緯度・経度が無効です正しい形式で入力してください');
            }
        } else {
            displayToastWaning('緯度・経度をカンマ区切りで入力してください');
        }
        $('#inputPointValue').val("");
        $('#pointMoveForm').addClass('d-none');
        $('#pointMoveIcon').removeClass('d-none');
    });
}



// 【ダイアログ】タイムライン ***********************************
async function openDialogTimeLine(mapData) {
    // ガイドNo
    let screenId = 0;
    // 
    if (!mapData || mapData.length == 0) {
        displayToastWaning("画面上にルートメモが存在しません")
        return false;
    }
    // ヘッダー
    const header = `時系列（タイムライン）`;
    // ソート
    const sortData = [...mapData];    // mapDataのコピーを作成
    // sortMapDateAsc(sortData);
    sortMapDateDesc(sortData);
    // ボディ
    let body = sortTimeLineBody(sortData);
    // フッター
    const footer = `
        <div class="d-flex justify-content-end w-100 ">
            <div id="btnSortGroup1" class="btn-group " data-value="0" >
                <button id="btn1" type="button" data-value="1" class="btn btn-outline-success text-sm3 " >
                    昇順
                </button>
                <button id="btn2" type="button" data-value="2" class="btn btn-outline-success text-sm3 active" >
                    降順
                </button>
            </div>
        </div>
    `;
    // 画面遷移
    openDialogCreate(header, body, footer, 'lg', screenId);
    // 各タイムラインアイテムのクリックイベントを設定
    sortData.forEach(item => {
        $(document).on('click', `#timelineitemBtn-${item.archiveId}-${item.seq}`, function (event) {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            moveMarkerToSeq(item.archiveId, item.seq);
            // $(this).closest('.modal').modal('hide');
            $(this).closest('.modal').modal('hide');
        });
    });
    // リスト内の全要素を取得
    const timelineItems = document.querySelectorAll('[id^="timelineitemBtn-"]');
    // リストの最後のアイテムに対してクラスを操作
    timelineItems.forEach((item, index) => {
        // 最後のアイテムかチェック
        if (index == timelineItems.length - 1) {
            const borderElement = item.querySelector('.border-start');
            if (borderElement) {
                borderElement.classList.remove('border-start', 'border-2'); // クラスを削除して非表示に
            }
        }
    });
    // 切替えフィルタ
    $('#btnSortGroup1 .btn').off("click").on('click', function() {
        // let $parent = $('#btnSortGroup1');
        let $this = $(this);
        $('#btnSortGroup1 .btn').removeClass('active');
        $this.addClass('active');
        // クリックされたボタンの data-value を取得
        let sortId = $this.data('value');
        const sortData = [...mapData];    // mapDataのコピーを作成
        // ソート
        if (sortId == 1) sortMapDateAsc(sortData);
        else sortMapDateDesc(sortData);
        // ボディ置き換え
        const newBody = sortTimeLineBody(sortData);
        const existingModal = document.getElementById('tileLineContainer');
        if (existingModal) existingModal.innerHTML = newBody;
    });
}
// 【データ】マップデータの並び替え１（日付とseqで昇順に並び替え）
function sortMapDateAsc(mapData){
    // const sortedData = [...mapData];  // mapDataのコピーを作成
    mapData.sort((a, b) => {
        // memoDateで比較
        if (a.memoDate !== b.memoDate) {
            return new Date(a.memoDate) - new Date(b.memoDate);
        }
        // memoDateが同じ場合、memoTimeで比較
        if (a.memoTime !== b.memoTime) {
            return a.memoTime.localeCompare(b.memoTime);
        }
        // memoDateもmemoTimeも同じ場合、seqで比較
        return a.seq - b.seq;
    });
}
// 【データ】マップデータの並び替え２（日付とseqで降順に並び替え）
function sortMapDateDesc(mapData){
    // const sortedData = [...mapData];  // mapDataのコピーを作成
    mapData.sort((b, a) => {
        // memoDateで比較
        if (a.memoDate !== b.memoDate) {
            return new Date(a.memoDate) - new Date(b.memoDate);
        }
        // memoDateが同じ場合、memoTimeで比較
        if (a.memoTime !== b.memoTime) {
            return a.memoTime.localeCompare(b.memoTime);
        }
        // memoDateもmemoTimeも同じ場合、seqで比較
        return a.seq - b.seq;
    });
}
// タイムラインのボディ動的生成
function sortTimeLineBody(sortData){
    return `
        <div id="tileLineContainer" class=" ">
            ${sortData.map(item => {
                return `
                    <div id="timelineitemBtn-${item.archiveId}-${item.seq}" class="btn text-start w-100 p-0 ">
                        <!-- 1段目 時間 -->
                        <div class="d-flex align-items-center bg-success-subtle text-dark py-1 px-3 rounded-pill justify-content-between">
                            <div class="fw-bold_ me-2">${item.memoDate} ${item.memoTime}</div>
                            <div>
                                <img src="${getImgDataByFaceId(item.faceId).imgUrl}" class="icon-sm ">
                                <img src="${getImgDataByWeatherId(item.weatherId).imgUrl}" class="icon-md">
                            </div>
                        </div>
                        <!-- 2段目 詳細 -->
                        <div class="d-flex flex-column border-start border-2 ms-3">
                            <div class="p-1">
                                <h6 class="text-truncate text-sm3 fw-bold mx-2 mb-1">${item.title}</h6>
                                <div class="text-sm2 ms-3 mb-3 pe-3">
                                    <div class="text-wrap text-break">
                                        ${convertNewlinesTag(item.body)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}



// 【ダイアログ】検索結果一覧（地点ポイント） ***********************************
async function openDialogPointList(mapData) {
    // ガイドNo
    let screenId = 0;
    // チェック
    if (!mapData || mapData.length == 0) {
        displayToastWaning("画面上にルートメモが存在しません")
        return false;
    }
    // ヘッダー
    const header = `検索結果一覧`;
    // ボディ
    const sortData = [...mapData];    // mapDataのコピーを作成
    let body = `
        <div id=" " class=" ">
            ${sortData.map(item => {
                let dispBadgeOwn = `<span class="badge bg-info text-light rounded-pill me-1 ">My</span>`;
                if (!item.isOwnData) dispBadgeOwn = '';
                return `
                    <div id="timelineitemBtn-${item.archiveId}-${item.seq}">
                        <div class="card mb-3 shadow-sm btn p-0 ">
                            <!-- 1段目 時間とアイコン -->
                            <div class="card-header bg-light text-dark py-2 px-3 d-flex align-items-center justify-content-between">
                                <div class="fw-bold pe-3">${item.memoDate} ${item.memoTime}</div>
                                <div>
                                    ${dispBadgeOwn}
                                    <img src="${getImgDataByFaceId(item.faceId).imgUrl}" class="icon-sm">
                                    <img src="${getImgDataByWeatherId(item.weatherId).imgUrl}" class="icon-md">
                                </div>
                            </div>
                            <!-- 2段目 詳細 -->
                            <div class="card-body py-2 text-start">
                                <h6 class="text-truncate text-sm3 fw-bold mb-1">${item.title}</h6>
                                <div class="text-sm2 pe-3 mb-2">
                                    <div class="text-wrap text-break overflow-auto" style="max-height:60px;">
                                        ${convertNewlinesTag(item.body)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    // フッター
    const footer = ``;
    // 画面遷移
    openDialogCreate(header, body, footer, 'lg', screenId);
    // 各タイムラインアイテムのクリックイベントを設定
    sortData.forEach(item => {
        $(document).on('click', `#timelineitemBtn-${item.archiveId}-${item.seq}`, function () {
            event.stopPropagation(); // イベントが親要素に伝播しないようにする
            moveMarkerToSeq(item.archiveId, item.seq);
            // $(this).closest('.modal').modal('hide');
            $(this).closest('.modal').modal('hide');
        });
    });
}



// 【ダイアログ】ガイド（使い方） ***********************************
async function openDialogAppGuide(screenId = DEF_SCREEN_CREATE) {
    console.log("openDialogAppGuide: ", screenId);
    // ヘッダー
    const header = `ガイド（使い方）`;
    // local㏈から既読No取得
    const reads = await getAllReadGuide();
    // ボディ
    const sortData = sortAppGuide(AppContext.app_guides, screenId);
    if (!sortData || sortData.length == 0) return;
    let body = `
        <div id=" " class=" ">
            ${sortData.map(item => {
                // 存在チェック
                let disp_new = '';
                if (reads.some(m => m.no == item.no)) disp_new = ' d-none ';
                return `
                    <div id="guide">
                        <div class="card mb-2 shadow-sm p-0 ">
                            <!-- 1段目 タイトル -->
                            <div id="guide-header" class="card-header bg-primary-subtle text-dark d-flex align-items-center justify-content-between py-2 px-4"
                                data-val="${item.no}" data-bs-toggle="collapse" data-bs-target="#collapseBody-${item.no}" >
                                <div class="fw-bold me-2">${item.title}</div>
                                <span id="guide-badge-${item.no}" class="${disp_new} badge bg-danger text-light rounded-pill me-1 ">New</span>
                            </div>
                            <!-- 2段目 本文 -->
                            <div id="collapseBody-${item.no}" class="collapse">
                                <div class="card-body py-2 text-start">
                                    <div class="text-wrap text-break">
                                        ${convertNewlinesTag(item.body)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    // フッター
    const footer = ``;
    // 画面遷移
    openDialogCreate(header, body, footer, 'md', 0);
    // クリックイベント
    $(document).off("click", "#guide-header").on("click", "#guide-header", function() {
        const no = $(this).data("val"); // `data-val` の値を取得
        $(`#guide-badge-${no}`).hide();
        // local㏈へ既読登録
        RegistGuideReadLocalDB(no);
    });
}
// 【データ】ガイドデータを画面IDでフィルタリング
function sortAppGuide(guideData, screenId) {
    console.log("guideData: ", guideData);
    // 指定された screenId または 0 のデータを抽出
    const filteredData = guideData.filter(item => item.screenId == screenId || item.screenId == 0);
    // ソートを適用
    filteredData.sort((a, b) => {
        if (a.screenId !== b.screenId) {
            return b.screenId - a.screenId; // screenId 昇順
        }
        if (Number(a.sortNo) !== Number(b.sortNo)) {
            return Number(a.sortNo) - Number(b.sortNo); // sortNo を数値比較
        }
        return a.seq - b.seq; // seq 数値比較
    });
    return filteredData;
}



// 【ダイアログ】ニュース（お知らせ） ***********************************
async function openDialogAppNews() {
    // ガイドNo
    let screenId = 0;
    // ヘッダー
    const header = `ニュース（お知らせ）`;
    // 昇順ソート
    const sortData = AppContext.app_news;
    sortAppNews(sortData);
    // local㏈から既読No取得
    const reads = await getAllReadNews();
    console.log("reads: ", reads);
    // ボディ
    let body = `
        <div id=" " class=" ">
            ${sortData.map(item => {
                // 存在チェック
                let disp_new = '';
                if (reads.some(m => m.no == item.no)) disp_new = ' d-none ';
                return `
                    <div id="news">
                        <div class="card mb-2 shadow-sm p-0 ">
                            <!-- 1段目 タイトル -->
                            <div id="news-header" class="card-header bg-primary-subtle text-dark d-flex align-items-center justify-content-between py-2 px-4"
                                data-val="${item.no}" data-bs-toggle="collapse" data-bs-target="#collapseBody-${item.no}" >
                                <div class="fw-bold me-2">${item.title}</div>
                                <span id="news-badge-${item.no}" class="${disp_new} badge bg-danger text-light rounded-pill me-1 ">New</span>
                            </div>
                            <!-- 2段目 本文 -->
                            <div id="collapseBody-${item.no}" class="collapse">
                                <div class="card-body py-2 text-start">
                                    <div class="text-wrap text-break">
                                        ${convertNewlinesTag(item.body)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    // フッター
    const footer = ``;
    // 画面遷移
    const modal = openDialogCreate(header, body, footer, 'lg', screenId);
    const dialogElement = $(modal._element);
    dialogElement.on('hidden.bs.modal', function() {
        checkNewsRead();
    });
    // クリックイベント
    $(document).off("click", "#news-header").on("click", "#news-header", function() {
        const no = $(this).data("val"); // `data-val` の値を取得
        $(`#news-badge-${no}`).hide();
        // local㏈へ既読登録
        RegistNewsReadLocalDB(no);
    });
}
// 【データ】ニュースデータを画面IDでフィルタリング
function sortAppNews(newsData) {
    // ソートを適用
    newsData.sort((a, b) => {
        if (Number(a.expiryTime) !== Number(b.expiryTime)) {
            return Number(a.expiryTime) - Number(b.expiryTime); // sortNo を数値比較
        }
        if (a.newsCategoryId !== b.newsCategoryId) {
            return a.newsCategoryId - b.newsCategoryId; // screenId 昇順
        }
        // if (a.expiryTime.getTime() !== b.expiryTime.getTime()) {
        //     return a.expiryTime.getTime() - b.expiryTime.getTime();
        // }
        return a.seq - b.seq; // seq 数値比較
    });
}



// 【ダイアログ】フィードバック ***********************************
async function openDialogFeedback(isAlert = false, pointData = null) {
    // ガイドNo
    let screenId = 0;
    // isAlert = true;
    const DEF_SEND_REVIEW = 0;
    const DEF_SEND_REQUEST = 1;
    const DEF_SEND_REPORT = 2;
    const DEF_SEND_ALERT = 9;
    // ヘッダー
    const header = `フィードバック（問合せ）`;
    // ボディ
    let body = `
        <div id=" " class="p-2 py-3">
            <div class="mb-3 ">
                <!-- ５段階評価 -->
                <div class="btn-group w-100" id="ratingContainer">
                    <button type="button" class="btn btn-outline-info" data-value="1">★１</button>
                    <button type="button" class="btn btn-outline-info" data-value="2">★２</button>
                    <button type="button" class="btn btn-outline-info" data-value="3">★３</button>
                    <button type="button" class="btn btn-outline-info" data-value="4">★４</button>
                    <button type="button" class="btn btn-outline-info active" data-value="5">★５</button>
                </div>
            </div>
            <div class="mb-3 ">
                <!-- カテゴリ -->
                <div class="btn-group w-100" id="categoryContainer">
                    <button id="cate0" type="button" class="btn btn-outline-primary active" data-value="${DEF_SEND_REVIEW}">感想</button>
                    <button id="cate1" type="button" class="btn btn-outline-primary" data-value="${DEF_SEND_REQUEST}">要望</button>
                    <button id="cate2" type="button" class="btn btn-outline-primary" data-value="${DEF_SEND_REPORT}">不具合</button>
                    <button id="cate3" type="button" class="btn btn-outline-danger" data-value="${DEF_SEND_ALERT}">通報</button>
                </div>
            </div>
            <div class=" ">
                <!-- 送信内容入力 -->
                <textarea id="submitMemo" class="form-control mt-2 " rows="5" style="max-height: 180px;" 
                    placeholder="不具合や問題の報告は、できるだけ詳細に記載していただけると、開発者がスムーズに対応できます！" required ></textarea>
            </div>
        </div>
    `;
    // フッター
    const footer = `
        <!-- 送信 -->
        <div class="row g-0 w-100 " id=" ">
            <div id="SendFeedback" type="button" class="btn btn-success col-3 opacity-75 align-items-center">
                送信
            </div>
            <div class="col text-sm2 ms-2 d-flex align-items-center">
                送信内容がサーバへ送られます<br>
                可能な限り対応させていただきます
            </div>
        </div>
    `;
    // 画面生成
    openDialogCreate(header, body, footer, 'XX', screenId);
    // クリックイベント
    $("#ratingContainer button").off("click").on("click", function() {
        $("#ratingContainer button").removeClass("active"); // 他の選択を解除
        $(this).addClass("active"); // クリックされたボタンを選択状態にする
    });
    $("#categoryContainer button").off("click").on("click", function() {
        $("#categoryContainer button").removeClass("active"); // 他の選択を解除
        $(this).addClass("active"); // クリックされたボタンを選択状態にする
    });
    $("#SendFeedback").off("click").on("click", async function() {
        const rating = $("#ratingContainer .active").data("value");
        const sendCategoryId = $("#categoryContainer .active").data("value");
        const body = $("#submitMemo").val().trim();
        // 入力チェック
        if (!body) {
            displayToastWaning("送信内容を入力してください");
            return;
        }
        // 処理前確認
        let ret0 = await openDialogOKCancel("この内容で送信しますか？<br>（取り消しはできません）");
        if (!ret0) return;
        $(this).closest('.modal').modal('hide');
        // パラメータ生成
        let params = {
            feedback: {
                rating: rating,
                sendCategoryId: Number(sendCategoryId),
                body: body,
                archiveId: 0,
                seq: 0,
            },
        };
        if (isAlert) {
            params.feedback.archiveId = pointData.archiveId;
            params.feedback.seq = pointData.seq;
            params.memoTitle = pointData.title;
            params.MemoBody = pointData.body;
        }
        console.log("params: ", params);
        // サーバ更新
        let ret = await SendFeedback(params);
        if (ret) {
            // $(this).closest('.modal').modal('hide');
            openDialogOKOnly("ご協力ありがとうございます！");
        }
    });
    addInputMaxCounter('#submitMemo', 200);
    // 
    if (isAlert) {
        toggleElementDisabled("#cate0", false);
        toggleElementDisabled("#cate1", false);
        toggleElementDisabled("#cate2", false);
        toggleElementDisabled("#cate3", true);
        $("#categoryContainer button").removeClass("active"); // 他の選択を解除
        $("#cate3").addClass("active"); // クリックされたボタンを選択状態にする
    } else {
        toggleElementDisabled("#cate0", true);
        toggleElementDisabled("#cate1", true);
        toggleElementDisabled("#cate2", true);
        toggleElementDisabled("#cate3", false);
    }
}



// 【ダイアログ】ユーザ設定 ***********************************
function openDialogUserSetting(){
    // ガイドNo
    let screenId = 0;
    // ヘッダー
    const header = `ユーザ設定`;
    // 設定取得
    const active1_ON = UserContext.setAddress == 1 ? "active" : "";
    const active1_OFF = UserContext.setAddress == 0 ? "active" : "";
    const active2_ON = UserContext.watchLocation == 1 ? " active " : "";
    const active2_OFF = UserContext.watchLocation == 0 ? " active " : "";
    // ボディ
    let body = `
        <div class="mx-2">
            <!-- 住所入力 -->
            <div class="mb-3 ">
                <span class="text-sm3_">新規入力時にデフォルトで住所をセット</span><br>
                <div class="d-flex justify-content-end">
                    <div class="btn-group" id="setAddressContainer" >
                        <button type="button" class="col btn btn-outline-primary ${active1_ON}" data-value="1">ON</button>
                        <button type="button" class="col btn btn-outline-primary ${active1_OFF}" data-value="0">OFF</button>
                    </div>
                </div>
            </div>
            <!-- 現在地取得 -->
            <div class="mb-3 ">
                <span class="text-sm3_">現在地表示を常に取得する</span><br>
                <div class="d-flex justify-content-end">
                    <div class="btn-group" id="watchLocationContainer">
                        <button type="button" class="col btn btn-outline-primary ${active2_ON}" data-value="1">ON</button>
                        <button type="button" class="col btn btn-outline-primary ${active2_OFF}" data-value="0">OFF</button>
                    </div>
                </div>
            </div>
            <hr>
            <!-- 更新ボタン -->
            <div class="d-flex justify-content-end mt-3 mb-2">
                <div id="UpdateSettingBtn" class="btn btn-primary">
                    変更する
                </div>
            </div>
        </div>
    `;
    // フッター
    const footer = `
        <div id="groupPublish" class="w-100 my-2">
            <div class="row g-0 w-100 ">
                <div id="LogoutBtn" type="button" class="btn btn-danger col-4 opacity-75 ">
                    ログアウト
                </div>
                <div class="col text-sm2 ms-2 d-flex align-items-center">
                    別のユーザでログインする場合は<br>ログアウトしてください
                </div>
            </div>
        </div>
    `;
    // 画面生成
    openDialogCreate(header, body, footer, 'XX', screenId);
    // クリックイベント
    $("#LogoutBtn").off("click").on("click", async function() {
        let ret = await openDialogOKCancel("ログアウトしますか？");
        if (ret) Logout();
    });
    $("#setAddressContainer button").off("click").on("click", function() {
        $("#setAddressContainer button").removeClass("active"); // 他の選択を解除
        $(this).addClass("active"); // クリックされたボタンを選択状態にする
    });
    $("#watchLocationContainer button").off("click").on("click", function() {
        $("#watchLocationContainer button").removeClass("active"); // 他の選択を解除
        $(this).addClass("active"); // クリックされたボタンを選択状態にする
    });
    // 変更する
    $("#UpdateSettingBtn").off("click").on("click", async function() {
        try {
            const valSetAddress = $("#setAddressContainer .active").data("value");
            const valWatchLocation = $("#watchLocationContainer .active").data("value");
            UserContext.setAddress = valSetAddress;
            UserContext.watchLocation = valWatchLocation;
            // localに保存
            localStorage.setItem("setAddress", valSetAddress);
            localStorage.setItem("watchLocation", valWatchLocation);
            // 現在地取得ロジック
            if (UserContext.watchLocation == 1) startTrackingLocation();
            else pauseTrackingLocation();
            // 閉じる
            $(this).closest('.modal').modal('hide');
            // 
            displayToast("設定は保存されました");
        } catch (error) {
            errorProc("initArchiveMemo", error);
        }
    });
}



// 【ダイアログ】ユーザ情報リスト ***********************************
async function openDialogUserInfoList() {
    // ガイドNo
    let screenId = 0;
    // 
    const header = `ユーザ情報一覧`;
    const body = `
        <!-- 閲覧履歴 -->
        <div class="list-group m-2 ">
            <div id="browsHistoryBtn" type="button" class="list-group-item list-group-item-action border ">
            <div class="row g-0 ">
                <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-history"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                    </svg>
                </div>
                <div class="col-10 ">
                    <div class="text-truncate fw-bold">閲覧履歴</div>
                    <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                        <div>自分以外の閲覧記録を見ることができます</div>
                    </div>
                </div>
            </div>
            </div>
        </div>

        <!-- お気に入り履歴 -->
        <div class="list-group m-2 ">
            <div id="favoriteHistoryBtn" type="button" class="list-group-item list-group-item-action border ">
            <div class="row g-0 ">
                <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                    </svg>
                </div>
                <div class="col-10 ">
                    <div class="text-truncate fw-bold">お気に入り履歴</div>
                    <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                        <div>過去のお気に入りを見ることができます</div>
                    </div>
                </div>
            </div>
            </div>
        </div>

        <!-- 設定 -->
        <div class="list-group m-2 ">
            <div id="userSettingBtn" type="button" class="list-group-item list-group-item-action ">
            <div class="row g-0 ">
                <div class="col-2 d-flex justify-content-center flex-column flex-grow-1 ">
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                    </svg>
                </div>
                <div class="col-10 ">
                    <div class="text-truncate fw-bold">アプリ個別設定</div>
                    <div class="text-secondary ms-2 d-flex justify-content-between text-sm2 ">
                        <div>各種の設定を変更します</div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    `;
    const footer = ``;
    // 画面を開く
    openDialogCreate(header, body, footer, "XX", screenId);
    // クリックイベント
    $("#browsHistoryBtn").off("click").on("click", async function() {
        openDialogBrowsHistoryList();
        $(this).closest('.modal').modal('hide');
    });
    $("#favoriteHistoryBtn").off("click").on("click", async function() {
        openDialogFavoriteHistoryList();
        $(this).closest('.modal').modal('hide');
    });
    $("#userSettingBtn").off("click").on("click", async function() {
        openDialogUserSetting();
        $(this).closest('.modal').modal('hide');
    });
}



// 【ダイアログ】閲覧履歴一覧 ***********************************
async function openDialogBrowsHistoryList() {
    // ガイドNo
    let screenId = 0;
    // 
    const data = await getAllBrowsHistory();
    console.log("getAllBrowsHistory: ", data);
    if (!data || data.length == 0) {
        displayToastWaning("閲覧履歴が存在しません")
        return false;
    }
    // ヘッダー
    const header = `閲覧履歴一覧`;
    // ボディ
    const sortData = [...data];    // mapDataのコピーを作成
    sortData.sort((a, b) => b.timestamp - a.timestamp);
    let body = `
        <div id=" " class=" ">
            ${sortData.map(item => {
                return `
                    <div id="BrowsHistoryBtn-${item.archiveId}-${item.seq}" data-archive-id="${item.archiveId}">
                        <div class="card mb-2 shadow-sm btn p-0 ">
                            <div class="card-body py-2 text-start">
                                <div class="text-truncate fw-bold mb-1">${item.title}</div>
                                <div class="text-sm3 ms-2">最終閲覧日時：${item.timestamp}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    // フッター
    const footer = ``;
    // 画面遷移
    openDialogCreate(header, body, footer, 'md', screenId);
    // 各タイムラインアイテムのクリックイベントを設定
    sortData.forEach(item => {
        $(`#BrowsHistoryBtn-${item.archiveId}-${item.seq}`).off('click').on('click', function () {
            const archiveId = $(this).data("archive-id");
            AppStatus.isPublish = true;
            AppStatus.archiveId = archiveId;
            initArchiveMemo();
            $(this).closest('.modal').modal('hide');
        });
    });
}


// 【ダイアログ】お気に入り履歴一覧 ***********************************
async function openDialogFavoriteHistoryList() {
    // ガイドNo
    let screenId = 0;
    // 
    const data = await getAllFavoriteHistory();
    console.log("getAllFavoriteHistory: ", data);
    if (!data || data.length == 0) {
        displayToastWaning("お気に入り履歴が存在しません")
        return false;
    }
    // ヘッダー
    const header = `お気に入り履歴一覧`;
    // ボディ
    const sortData = [...data];    // mapDataのコピーを作成
    sortData.sort((a, b) => b.timestamp - a.timestamp);
    let body = `
        <div id=" " class=" ">
            ${sortData.map(item => {
                return `
                    <div id="BrowsHistoryBtn-${item.archiveId}-${item.seq}" data-archive-id="${item.archiveId}">
                        <div class="card mb-2 shadow-sm btn p-0 ">
                            <div class="card-body py-2 text-start">
                                <div class="text-truncate fw-bold mb-1">${item.title}</div>
                                <div class="text-sm3 ms-2">お気に入り登録日時：${item.timestamp}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    // フッター
    const footer = ``;
    // 画面遷移
    openDialogCreate(header, body, footer, 'md', screenId);
    // 各タイムラインアイテムのクリックイベントを設定
    sortData.forEach(item => {
        $(`#BrowsHistoryBtn-${item.archiveId}-${item.seq}`).off('click').on('click', function () {
            const archiveId = $(this).data("archive-id");
            AppStatus.isPublish = true;
            AppStatus.archiveId = archiveId;
            initArchiveMemo();
            $(this).closest('.modal').modal('hide');
        });
    });
}

