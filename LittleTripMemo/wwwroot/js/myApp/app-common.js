// グルーバル定数
const DEF_STS_CHANGED = "changed";
const DEF_STS_COMPLETED = "completed";
const DEF_ICO_GOOD = "good";
const DEF_ICO_BAD = "bad";
// const DEF_ICO_ALERT = "alert";
const DEF_MODE_PRIMARY = 1;
const DEF_MODE_DANGER = 2;
const DEF_MODE_WARNING = 3;
const DEF_SCREEN_COMMON = 0;
const DEF_SCREEN_CREATE = 1;
const DEF_SCREEN_ARCHIVE = 2;
const DEF_SCREEN_SEARCH = 3;
const DEF_SCREEN_ANONYMOUS = 4;

// 共通変数
var _archiveTitleList;

// イメージファイルのパスを配列で指定（１件目がデフォルトのアイコンになる）
const _FaceIconList = [
    { faceId: 0,  imgUrl: 'img/memo/face/grin-alt.png' },
    { faceId: 1,  imgUrl: 'img/memo/face/grin-hearts.png' },
    { faceId: 2,  imgUrl: 'img/memo/face/laugh-squint.png' },
    { faceId: 3,  imgUrl: 'img/memo/face/face-drooling.png' },
    { faceId: 4,  imgUrl: 'img/memo/face/sad-tear.png' },
    { faceId: 5,  imgUrl: 'img/memo/face/dizzy.png' },
    { faceId: 6,  imgUrl: 'img/memo/face/flushed.png' },
    { faceId: 7,  imgUrl: 'img/memo/face/tired.png' },
    { faceId: 8,  imgUrl: 'img/memo/face/face-expressionless.png' },
    { faceId: 9,  imgUrl: 'img/memo/face/face-downcast-sweat.png' },
    { faceId: 10, imgUrl: 'img/memo/face/face-disappointed.png' },
    { faceId: 11, imgUrl: 'img/memo/face/face-confounded.png'},
    { faceId: 12, imgUrl: 'img/memo/face/face-anxious-sweat.png' },
    { faceId: 13, imgUrl: 'img/memo/face/face-angry-horns.png' },
];
// イメージファイルのパスを配列で指定（１件目がデフォルトのアイコンになる）
const _WeatherIconList = [
    { weatherId: 0,  imgUrl: 'img/memo/weather/sunny1.png' },
    { weatherId: 1,  imgUrl: 'img/memo/weather/sunny2.png' },
    { weatherId: 2,  imgUrl: 'img/memo/weather/cloud1.png'},
    { weatherId: 3,  imgUrl: 'img/memo/weather/cloud2.png'},
    { weatherId: 4,  imgUrl: 'img/memo/weather/cloud3.png'},
    { weatherId: 5,  imgUrl: 'img/memo/weather/rain1.png' },
    { weatherId: 6,  imgUrl: 'img/memo/weather/rain2.png' },
    { weatherId: 7,  imgUrl: 'img/memo/weather/rain3.png' },
    { weatherId: 8,  imgUrl: 'img/memo/weather/snow1.png'},
    { weatherId: 9,  imgUrl: 'img/memo/weather/snow2.png'},
];

// faceIdを指定して要素を取得する関数
function getImgDataByFaceId(faceId) {
    const icon = _FaceIconList.find(item => item.faceId == faceId);
    return icon ? icon : null; // 見つからなければ null を返す
}
// weatherIdを指定して要素を取得する関数
function getImgDataByWeatherId(weatherId) {
    const icon = _WeatherIconList.find(item => item.weatherId == weatherId);
    return icon ? icon : null; // 見つからなければ null を返す
}


// エラー処理
function errorProc(title, error){
    const outPutLog = `[${title}]\n${error}`;
    // 出力
    console.error(outPutLog);
    displayToastError(outPutLog);
}

// 画面情報
function updateSizeInfo() {
    return `
        window.outerWidth  : ${window.outerWidth} px
        window.outerHeight : ${window.outerHeight} px

        window.innerWidth  : ${window.innerWidth} px
        window.innerHeight : ${window.innerHeight} px

        document.documentElement.clientWidth  : ${document.documentElement.clientWidth} px
        document.documentElement.clientHeight : ${document.documentElement.clientHeight} px

        screen.width  : ${screen.width} px
        screen.height : ${screen.height} px

        screen.availWidth  : ${screen.availWidth} px
        screen.availHeight : ${screen.availHeight} px
    `;
    // document.getElementById("sizeInfo").textContent = info;
}
// 画面幅の調整（ヨコ x タテ）
function adjustViewDimensions() {
    const screenInfo = [
        `inner: ${window.innerWidth} x ${window.innerHeight}`,
        `visualViewport: ${window.visualViewport?.width} x ${window.visualViewport?.height}`,
        `outer: ${window.outerWidth} x ${window.outerHeight}`,
        `screen: ${screen.width} x ${screen.height}`,
        `devicePixelRatio: ${window.devicePixelRatio}`
    ].join("\n");
    const viewportWidth = window.visualViewport?.width;
    const viewportHeight = window.visualViewport?.height;
    document.documentElement.style.setProperty('--view-width', `${viewportWidth}px`);
    document.documentElement.style.setProperty('--view-height', `${viewportHeight}px`);
    //
    console.log("screenInfo: ", screenInfo);
    // $toast.find('.toast-body').html(String(message).replace(/\n/g, '<br>'));
    // var text = String(screenInfo).replace(/\n/g, '<br>');
    var text = convertNewlinesTag(screenInfo);
    console.log("screenInfo: ", text);
    displayToast(text + text, DEF_MODE_PRIMARY, 5);
}
// 画面幅の調整
function updateSize() {
    let newWidth = window.innerWidth;   // innerWidth の方が実際の表示領域に近い
    let newHeight = window.innerHeight;
    // 横持ち（ランドスケープ）なら縦横を入れ替え
    if (newWidth > newHeight) {
        document.documentElement.style.setProperty('--vw', `${newHeight * 0.01}px`);
        document.documentElement.style.setProperty('--vh', `${newWidth * 0.01}px`);
    } else {
        document.documentElement.style.setProperty('--vw', `${newWidth * 0.01}px`);
        document.documentElement.style.setProperty('--vh', `${newHeight * 0.01}px`);
    }
}



// 待機画像表示（くるくる画像）
function waitingDisplay2(displayOn){
    const openModal = document.querySelector('.modal.show');
    if(displayOn){
        // **すでに開いているモーダルを取得して非表示にする**
        if (openModal) openModal.style.display = 'none'; // 非表示（暗さはそのまま）
        // モーダルを表示
        $("#loadingModal").modal("show");
    }else{
        // **閉じたモーダルを取得して表示する**
        if (openModal) openModal.style.display = 'block'; // 元に戻す
        // モーダルを非表示
        $("#loadingModal").modal("hide");
    }
}
// 待機画像表示（くるくる画像）
function waitingDisplay(displayOn){
    const openModals = document.querySelectorAll('.modal.show'); // すべての表示中のモーダルを取得
    if(displayOn){
    // **すでに開いているすべてのモーダルを非表示にする**
    openModals.forEach(modal => {
        modal.style.display = 'none'; // 非表示（暗さはそのまま）
    });
    // モーダルを表示
    $("#loadingModal").modal("show");
    } else {
    // **閉じた待機モーダル以外のモーダルを再表示する**
    openModals.forEach(modal => {
        if (modal.id !== 'loadingModal') { // 待機モーダル自身は除く
        modal.style.display = 'block'; // 元に戻す
        }
    });
    // モーダルを非表示
    $("#loadingModal").modal("hide");
    }
}



// 【共通】IDをBase64ベースで暗号化
function encodeId(id) {
    // 1. Base64エンコード
    let newId = btoa(id);     // btoa()で文字列をBase64に変換
    // 2. 文字列を逆順に並び替え
    let newId2 = newId.split('').reverse().join('');    // 文字列を逆順に並び替え
    // 3. パディング（`=`）を削除
    newId2 = newId2.replace(/=/g, '');    // `=`（パディング）を削除
    // console.log("encodeId:", `${id} -> ${newId2}`);
    // 4. 複合化をテストする（デコード関数を使う）
    decodeId(newId2);
    return newId2;
}
// 【共通】IDをBase64ベースで複合化
function decodeId(encodedId) {
    // 1. 逆順に並び替えを元に戻す
    let newId = encodedId.split('').reverse().join('');    // 逆順に並び替えを元に戻す
    // 2. パディング（`=`）を補完する
    while (newId.length % 4 !== 0) {
        newId += '=';    // パディングを補完
    }
    // 3. Base64デコード
    let newId2 = atob(newId);    // atob()でBase64デコード
    // console.log("decodeId:", `${encodedId} -> ${newId2}`);
    return newId2;
}


// 【共通】日本時間に変換する
function convertToJapanTime(isoDateString) {
    const date = new Date(isoDateString); // ISO 8601の日時をパース
    date.setHours(date.getHours() + 9); // UTC → JST に変換
    return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}
// 【共通】改行タグ変換
function convertNewlinesTag(text) {
    // もし text が文字列であれば、改行を <br> に置き換え
    if (typeof text === 'string') {
        return text.replace(/\n/g, '<br>');
    }
    // text が文字列でない場合、オブジェクトを JSON 文字列に変換
    if (typeof text === 'object') {
        const jsonString = JSON.stringify(text, null, 2);  // 第3引数でインデントを指定
        return jsonString;
    }
    return text;
}
// 【共通】文字列を数値に
function convertStringToNumber(str){
    let numStr = str.replace(/,/g, "");
    numStr = numStr.trim();
    return Number(numStr);
}

// 【共通】年月日をフォーム用形式（yyyy-mm-dd hh:mm:ss）に変換する関数
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
// 【共通】日付数値変換(yyyymmddhhmm桁文字列)
function getDateTimeToDigitString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
// 【共通】日付数値変換(yyyy-mm-dd文字列)
function formatDateToDigitString(date) {
    const year = date.getFullYear(); // 年を取得
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // 月を2桁に
    const day = ('0' + date.getDate()).slice(-2); // 日を2桁に
    return `${year}-${month}-${day}`; // 連結して10桁の文字列にする
}
// 【共通】時間数値変換(hh:mm文字列)
function formatTimeToDigitString(date) {
    if(date){
        let hours = ('0' + date.getHours()).slice(-2); // 時間を2桁に
        let minutes = ('0' + date.getMinutes()).slice(-2); // 分を2桁に
        let ret = `${hours}:${minutes}`; // 連結して5桁の文字列にする
        return ret
    }
}
// 【共通】遅延処理（ミリ秒）
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    // プロミスを返却する場合は「async」は不要（asyncは戻り値をプロミスに変換するためのもの）
}


// 【共通】サニタイジング処理
function sanitizeInput(input) {
    if (!input) return '';
    // スペース（全角・半角）を削除
    let sanitized = input.replace(/[\s　]/g, '');
    // タグを削除（XSS対策）
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // SQLインジェクション対策（危険な文字列の除去）
    sanitized = sanitized.replace(/['";]|--|\/\*|\*\//g, '');
    return sanitized;
}
// 【共通】クリップボードに転送
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            // console.log('クリップボードにコピーしました:', text);
            displayToast('クリップボードにコピーしました');
        })
        .catch(err => {
            console.error('クリップボードへのコピーに失敗しました:', err);
        });
}
// 【共通】大手メディア判別（URL）
function getSocialMediaIcon(url) {
    const socialMediaDomains = [
        { domains: ['linkedin.com', 'www.linkedin.com', 'jp.linkedin.com'], name: 'linkedin' },
        { domains: ['twitter.com', 'www.twitter.com'], name: 'twitter' },
        { domains: ['x.com', 'www.x.com'], name: 'x' },
        { domains: ['facebook.com', 'www.facebook.com'], name: 'facebook' },
        { domains: ['instagram.com', 'www.instagram.com'], name: 'instagram' },
        { domains: ['youtube.com', 'www.youtube.com'], name: 'youtube' },
        { domains: ['tiktok.com', 'www.tiktok.com'], name: 'tiktok' },
        { domains: ['pinterest.com', 'www.pinterest.com', 'jp.pinterest.com'], name: 'pinterest' },
    ];
    try {
        const parsedUrl = new URL(url); // URLオブジェクトでパース
        const hostname = parsedUrl.hostname; // ホスト名を取得
        // リストを走査して一致するSNSを探す
        for (const { domains, name } of socialMediaDomains) {
            if (domains.includes(hostname)) {
                return name; // SNS名を返す
            }
        }
        return 'unknown'; // 一致しない場合
    } catch (error) {
        return 'unknown'; // 無効なURLの場合
    }
}
// 【共通】大手メディアアイコン
function getSocialMediaIconHtml(socialMedia) {
    // SNS名と対応するアイコンのクラス名をマッピング
    const iconHtmls = {
        twitter: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-twitter"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c0 -.249 1.51 -2.772 1.818 -4.013z" /></svg>
        `,
        x: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
        `,
        facebook: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" /></svg>
        `,
        instagram: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16.5 7.5v.01" /></svg>
        `,
        linkedin: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 11v5" /><path d="M8 8v.01" /><path d="M12 16v-5" /><path d="M16 16v-3a2 2 0 1 0 -4 0" /><path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" /></svg>
        `,
        youtube: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" /><path d="M10 9l5 3l-5 3z" /></svg>
        `,
        tiktok: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-brand-tiktok"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" /></svg>
        `,
        pinterest: `
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24"  height="24" viewBox="0 0 50 50"><path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609825 4 46 13.390175 46 25 C 46 36.609825 36.609825 46 25 46 C 22.876355 46 20.82771 45.682142 18.896484 45.097656 C 19.75673 43.659418 20.867347 41.60359 21.308594 39.90625 C 21.570728 38.899887 22.648438 34.794922 22.648438 34.794922 C 23.348841 36.132057 25.395277 37.263672 27.574219 37.263672 C 34.058123 37.263672 38.732422 31.300682 38.732422 23.890625 C 38.732422 16.78653 32.935409 11.472656 25.476562 11.472656 C 16.196831 11.472656 11.271484 17.700825 11.271484 24.482422 C 11.271484 27.636307 12.94892 31.562193 15.634766 32.8125 C 16.041611 33.001865 16.260073 32.919834 16.353516 32.525391 C 16.425459 32.226044 16.788267 30.766792 16.951172 30.087891 C 17.003269 29.871239 16.978043 29.68405 16.802734 29.470703 C 15.913793 28.392399 15.201172 26.4118 15.201172 24.564453 C 15.201172 19.822048 18.791452 15.232422 24.908203 15.232422 C 30.18976 15.232422 33.888672 18.832872 33.888672 23.980469 C 33.888672 29.796219 30.95207 33.826172 27.130859 33.826172 C 25.020554 33.826172 23.440361 32.080359 23.947266 29.939453 C 24.555054 27.38426 25.728516 24.626944 25.728516 22.78125 C 25.728516 21.130713 24.842754 19.753906 23.007812 19.753906 C 20.850369 19.753906 19.117188 21.984457 19.117188 24.974609 C 19.117187 26.877359 19.761719 28.166016 19.761719 28.166016 C 19.761719 28.166016 17.630543 37.176514 17.240234 38.853516 C 16.849091 40.52931 16.953851 42.786365 17.115234 44.466797 C 9.421139 41.352465 4 33.819328 4 25 C 4 13.390175 13.390175 4 25 4 z"></path></svg>
        `,
        unknown: `
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-world"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a17 17 0 0 1 0 18" />
            </svg>
        `,
    };
    // 対応するクラス名を返す
    return iconHtmls[socialMedia] || iconHtmls['unknown'];
}


// 【共通】入力用要素に入力最大文字数をセット（カウンタ更新関数を返却）
function addInputMaxCounter(inputSelector, maxLength, optionalClass = "") {
    const input = $(inputSelector); // 入力要素を取得
    // 最大文字数を設定
    input.attr('maxlength', maxLength);
    // 最大文字数が無効の場合、処理を終了
    if (!maxLength) return;
    // Bootstrap の `position-relative d-inline-block` を持つ div で input をラップ
    input.wrap(`<div class="position-relative flex-grow-1 h-100 ${optionalClass}"></div>`);
    // カウンター要素を作成し、追加
    const counter = $('<span>')
        .addClass('text-sm2 text-gray')
        .css({
            position: 'absolute',
            right: '5px',
            bottom: '5px' // 入力欄の右下に表示
        })
        .appendTo(input.parent());
    // カウンターを更新する関数
    function updateCounter() {
        // console.log(`input.val(): ${input.val()}`); // デバッグ用
        counter.text(maxLength - input.val().length); // 残り文字数を表示
    }
    // 入力イベントでカウンターを更新
    input.on('input', updateCounter);
    // 初期表示
    updateCounter();
    // 
    return updateCounter;   // 外から更新させられるように
}



// 【ダイアログ】ひな型 ***********************************
function openDialogXXXXXXXXXXXXXXX(){
    // ヘッダー
    const header = ``;
    // ボディ
    let body = ``;
    // フッター
    const footer = ``;
    // ガイドNo
    let screenId = 0;
    // 画面生成
    openDialogCreate(header, body, footer, 'XX', screenId);
}
// 【ダイアログ】ひな型 （プロミス）***********************************
async function openDialogZZZZZZZZZZZZZZZZZZZ() {
    return new Promise((resolve) => {
        // **既存モーダルを非表示**
        const openModal = document.querySelector('.modal.show');
        if (openModal) openModal.style.display = 'none'; // 非表示にする
        // ヘッダー
        const header = ``;
        // ボディ
        let bodyHtml = ``;
        // フッター
        const footer = ``;
        // ガイドNo
        let screenId = 0;
        // ダイアログ作成
        const modal = openDialogCreate(header, bodyHtml, footer, 'XX', screenId);
        // **モーダル閉じた後の処理**
        const dialogElement = $(modal._element);
        dialogElement.on('hidden.bs.modal', function () {
            if (openModal) openModal.style.display = 'block'; // 元のモーダルを表示
            resolve(null); // モーダル閉じた場合はnullを返す
        });
    });
}
// 【ダイアログ】ダイアログを非同期で開く
function openDialogCreate(headerHtml, bodyHtml, footerHtml, size, screenId) {
    // ダイアログを生成する
    const modal = createDynamicDialog(headerHtml, bodyHtml, footerHtml, size, screenId);
    if (modal) modal.show();
    return modal;  // modalインスタンスを返す
}
// 【ダイアログ】指定された要素でダイアログを生成する（複数対応）
function createDynamicDialog(headerHtml, bodyHtml, footerHtml, size = 'md', screenId = null) {
    // ユニークなIDを生成
    const dialogId = `dynamicDialog-${getDateTimeToDigitString(new Date(Date.now()))}`;
    // ガイド表示
    let despGuide = ' d-none ';
    if (screenId && screenId != 0) {
        despGuide = ''
        // 【共通】ガイド開く
        $(document).off("click", `#dialogAppGuideBtn-${screenId}`)
            .on("click", `#dialogAppGuideBtn-${screenId}`, function() {
            console.log("createDynamicDialog2: ", screenId);
            openDialogAppGuide(screenId);
        });
    }
    // モーダルHTMLを動的に作成
    const modalHtml = `
        <div class="modal fade" id="${dialogId}">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-0 myDialog-${size} mx-auto">
                    <div class="card shadow-lg h-100">
                        <!-- ヘッダー -->
                        <div class="card-header d-flex align-items-center p-2 ps-3 fw-bold ">
                            <div class="modal-title fs-5 d-flex justify-content-between w-100">
                                <div>
                                    ${headerHtml}
                                </div>
                                <div>
                                    <!-- ガイド -->
                                    <div id="dialogAppGuideBtn-${screenId}" type="button" class="map-group ${despGuide}">
                                        <div class="icon-circle-sm bg-secondary-subtle text-dark ">
                                            <svg  xmlns="http://www.w3.org/2000/svg"  width="16"  height="16"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="1.8"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-question-mark"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4" /><path d="M12 19l0 .01" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- ボディ -->
                        <div class="card-body overflow-auto-y p-2">
                            ${bodyHtml}
                        </div>
                        <!-- フッター -->
                        <div class="card-footer d-flex align-items-center p-2">
                            ${footerHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    // HTMLをDOMに追加
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    // モーダルが閉じられたら自動的に削除
    const dialogElement = document.getElementById(dialogId);
    // Bootstrapモーダルを作成・返却
    const modal = new bootstrap.Modal(dialogElement);
    dialogElement.addEventListener('hidden.bs.modal', () => {
        dialogElement.remove();
    });
    return modal;
}



// 【画面表示】画面描画
function screenRender(){
    const isPublish = AppStatus.isPublish;
    // マーカークリア
    clearRouteMarker();
    // すべて非表示にする
    displayElementBulk(false);
    // 画面ごと切り替える
    let viewTitle;
    switch (AppStatus.screenId) {
    case DEF_SCREEN_CREATE:     // 入力
        viewTitle = "ルートメモ作成";
        toggleElementDisplay("#inputBtn", true);
        toggleElementDisplay("#recenterBtn", true);
        break;
    case DEF_SCREEN_ARCHIVE:     // まとめ
        viewTitle = "まとめ" + (isPublish ? "（公開）" : "（非公開）") + "を閲覧";
        toggleElementDisplay("#archiveTitleBtn", true);
        toggleElementDisplay("#moveGroup", true);
        break;
    case DEF_SCREEN_SEARCH:     // 地点検索
        viewTitle = "地点から検索";
        toggleElementDisplay("#sortGroup", true);
        toggleElementDisplay("#pointMoveIcon", true);
        toggleElementDisplay("#searchPointBtn", true);
        break;
    case DEF_SCREEN_ANONYMOUS:     // 匿名まとめ
        viewTitle = "匿名まとめ" + (isPublish ? "（公開）" : "（非公開）") + "を閲覧";
        toggleElementDisplay("#archiveTitleBtn", true);
        toggleElementDisplay("#moveGroup", true);
        toggleElementDisplay(".optionGroup", false);
        toggleElementDisplay(".optionGroup2", false);
        break;
    }
    // 画面タイトル
    $("#viewTitle").text(viewTitle);
    // まとめタイトル（編集ボタン）
    $("header").removeClass("bg-dark bg-info").addClass(isPublish ? "bg-info" : "bg-dark");
}
// 【画面表示】要素をまとめて表示する
function displayElementBulk(isDisplay) {
    var elementList = [
        "#archiveTitleBtn",
        "#sortGroup",
        "#pointMoveIcon",
        "#moveGroup",
        "#inputBtn",
        "#searchPointBtn",
    ];
    // 配列内の各IDに対して非表示を適用
    elementList.forEach(function(elementId) {
        toggleElementDisplay(elementId, isDisplay);
    });
}
// 【画面表示】要素を指定して表示非表示の切替え（d-noneの付け替え）
function toggleElementDisplay(selector, isDisplay) {
    if (isDisplay) {
        $(selector).removeClass("d-none"); // d-none クラスを削除して表示
    } else {
        $(selector).addClass("d-none"); // d-none クラスを追加して非表示
    }
}
// 【画面表示】要素を指定して活性非活性の切替え
function toggleElementDisabled(selector, isDisabled) {
    $(selector)
        .prop("disabled", !isDisabled) // ボタンの非活性化
        .css({
            "opacity": !isDisabled ? 0.3 : 1, 
            "pointer-events": !isDisabled ? "none" : "" // 非活性化（ボタン以外にも対応）
        });
}



// 【画面表示】初回読み込み時（オンライン復帰時）
async function initLoad(){
    // console.log("◆iniLoad()");
    if (AppStatus.isAnonymous) {
        // 匿名まとめ画面
        initArchiveAnonymous();
    } else {
        // 保存してあるURLを取得
        const currentUrl = localStorage.getItem("currentUrl");
        if (currentUrl) {
            // 保存していたURLをリセット
            localStorage.setItem("currentUrl", "");
            // 保存していたURLにリダイレクト
            window.location.replace(currentUrl);
            return;
        }
        // local設定
        UserContext.setAddress = localStorage.getItem("setAddress") ?? 0;
        UserContext.watchLocation = localStorage.getItem("watchLocation") ?? 0;
        if (UserContext.watchLocation == 1) startTrackingLocation();
        // アプリシステム情報
        await GetAppSysInfo();
        // ニュース未読チェック（バッヂ付与）
        checkNewsRead();
        // まとめタイトルリスト取得（共通処理）
        GetArchivesTitleList();

        // 初期画面
        if (AppStatus.archive && AppStatus.archive.archiveId > 0) {
            AppStatus.archiveId = AppStatus.archive.archiveId;
            AppStatus.isPublish = true;
            console.log("◆initArchiveMemo", AppStatus);
            initArchiveMemo();
        } else {
            console.log("◆initCreateMemo", AppStatus);
            initCreateMemo();
        }
    }
}
// 新規ニュースのチェック
async function checkNewsRead(){
    const dataA = AppContext.app_news;
    if (!dataA || dataA.lenght == 0) return true;   // ニュースがない場合はTRUE
    // local㏈から取得
    const dataB = await getAllReadNews();
    if (!dataB || dataB.lenght == 0) return false;  // 既読がない場合はFALSE
    // Aの中にBが含まれているかチェック
    const hasDifference = dataA.some(item => !dataB.some(el => el.no === item.no));
    // console.log("checkNewsRead: ", hasDifference);
    // return hasDifference;
    if (hasDifference) $("#badgeNews").show();
    else $("#badgeNews").hide();
}


// 【画面読み込み時】ルートメモ画面 生成
async function initCreateMemo(){
    console.log("■■■■■ CreateRouteMemo >> start", AppStatus);
    clearAppStatus();
    AppStatus.screenId = DEF_SCREEN_CREATE;
    // 【画面表示】画面描画
    screenRender();
    // 地図作成
    await initMap();
    // 現在位置取得（GPS）
    await getLocation();
    // データ取得
    const mapData = await getMapData();
    // ルート作成
    if (mapData) await renderMap(mapData);
    // await renderRouteMapping();
    console.log("■■■■■ CreateRouteMemo >> end", AppStatus);
}
// 【画面読み込み時】ルートまとめ画面 生成
async function initArchiveMemo(){
    console.log("■■■■■ ArchiveRoute >> start", AppStatus);
    try {
        // clearAppStatus();    // クリアはしない
        if (AppStatus.archiveId == 0) {
            initCreateMemo();
            return;
        }
        AppStatus.screenId = DEF_SCREEN_ARCHIVE;
        // 現在地の追跡をやめる
        pauseTrackingLocation();
        // 【画面表示】画面描画
        screenRender();
        await delay(500);  // 何かやってます感を出す
        // データ取得
        const mapData = await getMapData();
        // ルート作成
        if (mapData) await renderMap(mapData);
        else initCreateMemo();
        // タイトルを設定
        setArchiveTitle();  // データ取得後
        // 現在位置取得（移動なし）
        getLocation(false);
        // 閲覧履歴を登録（local㏈）
        if (AppStatus.isPublish && !AppStatus.archive.isOwnData) {
            RegistBrowsHistoryLocalDB(AppStatus.archive);
        }
    } catch (error) {
        errorProc("initArchiveMemo", error);
        initCreateMemo();
    }
    // 
    console.log("■■■■■ ArchiveRoute >> end", AppStatus);
}
// 【画面読み込み時】地点検索画面 生成
async function initSearchPoint(){
    console.log("■■■■■ SearchByPoint >> start", AppStatus);
    try {
        clearAppStatus();
        AppStatus.screenId = DEF_SCREEN_SEARCH;
        // 現在地の追跡をやめる
        pauseTrackingLocation();
        // 【画面表示】画面描画
        screenRender();
        // 現在位置取得（移動なし
        await getLocation(false);
    } catch (error) {
        errorProc("initSearchPoint", error);
        initCreateMemo();
    }
    console.log("■■■■■ SearchByPoint >> end", AppStatus);
}
// 【画面読み込み時】匿名まとめ画面 生成
async function initArchiveAnonymous(){
    console.log("■■■■■ ArchiveAnonymous >> start", AppStatus);
    try {
        // clearAppStatus();    // クリアはしない
        if (AppStatus.archiveId == 0) {
            Logout();
            return;
        }
        AppStatus.screenId = DEF_SCREEN_ANONYMOUS;
        // 現在地の追跡をやめる
        pauseTrackingLocation();
        // 【画面表示】画面描画
        screenRender();
        await delay(500);  // 何かやってます感を出す
        // ルート作成
        await renderRouteMapping();
        // タイトルを設定
        setArchiveTitle();  // データ取得後
        // 現在位置取得（移動なし）
        getLocation(false);
    } catch (error) {
        errorProc("initArchiveAnonymous", error);
        Logout();
    }
    console.log("■■■■■ ArchiveAnonymous >> end", AppStatus);
}


// 画面再読み込み
function RefreshScreen(){
    console.log("◆RefreshScreen: ", AppStatus.memos);
    switch (AppStatus.screenId) {
        case DEF_SCREEN_CREATE:     // 入力
            initCreateMemo();
            break;
        case DEF_SCREEN_ARCHIVE:     // まとめ
            initArchiveMemo();
            break;
        case DEF_SCREEN_SEARCH:     // 地点検索
            initSearchPoint();
            break;
        case DEF_SCREEN_ANONYMOUS:     // 匿名まとめ
            initArchiveAnonymous();
            break;
    }
}

// オフライン時処理
function OfflineCheck(msg){
    if (AppStatus.isOnLine) return true;
    if (!AppStatus.isAnonymous) return true;
    if (!msg) msg = "現在、操作は制限されています";
    displayToastWaning(msg);
    return false;
}
// オンライン処理
function OnlineProc(){
    console.log("<<<<<< OnlineProc >>>>>>");
    AppStatus.isOnLine = true;
    displayToast('ネットワークは復帰しました');
    $("#textInfoMsg").text("");
    // 画面リフレッシュ
    RefreshScreen();
}
// オフライン処理
function OfflineProc(){
    console.log("<<<<<< OfflineProc >>>>>>");
    AppStatus.isOnLine = false;
    displayToastWaning('ネットワークは切断されました\nオフラインモードで動作します');
    $("#textInfoMsg").text("オフライン中...");
    // ルートマーカー作成画面へ
    initCreateMemo();
}

// ようそこ画面
async function ShowWelcomeScreen(){
    if (!AppStatus.isAnonymous) return;
    // ログインを促す
    const mes = `
    ようこそ！<br>
    このサービスは登録なしでも利用できますが、<br>
    ログインするとさらに便利な機能が使えます！<br>
    まだ登録していない方は、今すぐアカウントを作成しましょう！
    `;
    let ret = await openDialogOKCancel(mes, "ログイン画面へ");
    var currentUrl = window.location.href;
    // AppStatus.currentUrl = currentUrl;
    // console.log("現在のURL: " + AppStatus.currentUrl);
    localStorage.setItem("currentUrl", currentUrl);
    if (ret) Logout();  // ログイン画面にジャンプする
}