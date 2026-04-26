// アプリ基盤
const AppManager = {
    AppSettingKey: "little_trip_settings",
    AppData: {
        System: {
            ScreenMode: null,
            IsOnline: navigator.onLine,
            IsLoggedIn: false,
            TargetArchiveId: 0,
        },
        Owner: {
            Theme: null,
            MapStyle: null,
            IsGpsTracking: false,
            Token: null,
            Currency: 'JPY',
        },
    },
    // 設定を保存
    _saveSettings() {
        localStorage.setItem(this.AppSettingKey, JSON.stringify({
            theme: this.AppData.Owner.Theme,
            mapStyleKey: this.AppData.Owner.MapStyle?.key,
            isGpsTracking: this.AppData.Owner.IsGpsTracking,
            token: this.AppData.Owner.Token,
            currency: this.AppData.Owner.Currency,
        }));
    },
    // 設定を読込
    _loadSettings() {
        const saved = JSON.parse(localStorage.getItem(this.AppSettingKey) || '{}');
        // console.log("saved:", saved);
        if (saved.theme) this.AppData.Owner.Theme = saved.theme;
        if (saved.mapStyleKey) this.AppData.Owner.MapStyle = $Map.MAP_STYLE[saved.mapStyleKey];
        if (saved.isGpsTracking !== undefined) this.AppData.Owner.IsGpsTracking = saved.isGpsTracking;
        if (saved.token) this.AppData.Owner.Token = saved.token;
        if (saved.currency) this.AppData.Owner.Currency = saved.currency;
    },
    // iPhoneのキーボード対策（入力中を考慮）
    _initViewport() {
        if (!window.visualViewport) return;
        const root = document.getElementById('app-root');
        const adjust = () => {
            // 入力中（inputやtextareaにフォーカスがある）なら制御をスキップ
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            if (isTyping) return;
            // キーボードが閉じていれば高さを固定し、ズレを戻す
            root.style.height = `${window.visualViewport.height}px`;
            window.scrollTo(0, 0);
        };
        // 各種イベントに紐付け
        window.visualViewport.addEventListener('resize', adjust);
        window.visualViewport.addEventListener('scroll', adjust);
        // 入力終了（フォーカス外れ）の瞬間に再計算をかける
        document.addEventListener('focusout', () => setTimeout(adjust, 100));
        adjust();
    },
    // 定期タスクの定義と開始
    _initPollingTasks() {
        $Polling.Init();
        const online_check_ms = 5000;
        const data_send_check_ms = 10000;
        // ネットワーク監視
        $Polling.Add($Polling.TASKS.OFFLINE_CHECK, () => {
            const isOn = navigator.onLine;
            $App.AppData.System.IsOnline = isOn;    // オフライン状態を保持
            if (isOn) {
                // オンライン
                $Notice.Offline.Hide();
                $Polling.Start($Polling.TASKS.DATA_SEND);   // データ送信監視開始
            } else {
                // オフライン
                $Notice.Offline.Show();
                $Polling.Stop($Polling.TASKS.DATA_SEND);
                console.log("-- offline --");
            }
        }, online_check_ms);
        // データ送信処理
        $Polling.Add($Polling.TASKS.DATA_SEND, async () => {
            if (await $LocalDb.Detail.GetCount() === 0) return;
            await $Warn.CatchAsync(async () => {
                // 全て $Data.LocalDb に任せる
                await $Data.LocalDb.RunBackgroundSync();
                // 画面再描画
                $Marker.RefreshPointMarker();
            })();
        }, data_send_check_ms);
        // 現在地追従
        $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
            // 追従モードかつオンラインなら現在地を更新（フォーカスはしない）
            if ($App.AppData.Owner.IsGpsTracking && $App.AppData.System.IsOnline) {
                $Marker.RefreshCurrentLocation();
            }
        }, 10000); // 10秒おき
        // ネットワーク監視開始
        $Polling.Start($Polling.TASKS.OFFLINE_CHECK);
    },
    // 戻り値として、ログインに成功したか（true/false）を返す
    async ExecuteLoginFlow() {
        // 共通エラー処理でラップし、成否を受け取る（直前に直した仕様が大活躍します！）
        return await $Warn.CatchAsync(async () => {
            $Notice.Info("Logging in...");
            // 1. 認証専門家($Auth)から身分証明をもらう
            const email = await $Auth.GetVerifiedEmailByGoogle();
            // 2. 通信専門家($Data.Access)にログインさせ、JWTをもらう
            const ret = await $Data.Access.LoginToServer(email);
            if (ret) {
                this.AppData.System.IsLoggedIn = true;
                this._saveSettings();
                $Notice.Info("Login successful！");
                return true;
            }
            return false;
        })();
    },
    // アプリの起動（初期化の入口）
    async Init() {
        console.log("★App.Init");
        this._initViewport(); // ビューポートの初期化
        await $LocalDb.Init();   // ローカル㏈初期化
        this._initPollingTasks();   // 定期監視
        this._loadSettings(); // 起動時に読み込み
        // $Notice.Loading.Hide();
        $UI.Init();     // UI初期化
        //
        this.ChangeTheme(this.AppData.Owner.Theme || $UI.UI_THEME.BLUE);
        this.ChangeMapStyle(this.AppData.Owner.MapStyle || $Map.MAP_STYLE.STANDARD);
        // クエリパラメータ取得してAppDataにセット
        this.AppData.System.ScreenMode = new URLSearchParams(location.search).get("mode") ?? $Const.SCREEN_MODE.CREATE;
        this.AppData.System.ArchiveId = new URLSearchParams(location.search).get("archiveId");
        console.log("ScreenMode:", this.AppData.System.ScreenMode);
        // マーカー再構築
        this.RefreshScreen();
    },
    // カラーテーマ変更
    ChangeTheme(theme){
        this.AppData.Owner.Theme = theme;
        $UI.ChangeTheme(theme);
        this._saveSettings(); // 保存実行
    },
    // カラーテーマ変更
    ChangeMapStyle(style){
        this.AppData.Owner.MapStyle = style;
        this._saveSettings(); // 保存実行
        $Map.SetMapStyle(style);
    },
    // 追従設定の変更メソッド
    ChangeGpsTracking(isOn) {
        this.AppData.Owner.IsGpsTracking = isOn;
        if (isOn && this.AppData.System.IsOnline) $Polling.Start($Polling.TASKS.GPS_FOLLOW);
        else $Polling.Stop($Polling.TASKS.GPS_FOLLOW);
        this._saveSettings();
    },
    // 通貨単位の変更メソッド
    ChangeCurrency(unit) {
        this.AppData.Owner.Currency = unit;
        this._saveSettings();
    },
    // 画面モード変更
    async RefreshScreen() {
        // アーカイブID
        const archiveId = this.AppData.System.TargetArchiveId;
        let isSuccess = false
        // モードごとにデータ取得
        switch (this.AppData.System.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                isSuccess = await $Data.Access.GetUnMergeDetails({});
                if (!isSuccess) return;
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
                if (!archiveId) {
                    // 不正か？
                    $Dialog.ShowLoginDialog();
                    return;
                }
                isSuccess = await $Data.Access.GetArchiveDetails({ archive_id: archiveId });
                if (!isSuccess) return;
                const archive = $Data.Store.GetArchive();
                $TopBar.ChangeTitle(archive.title);
                break;
            case $Const.SCREEN_MODE.ARCHIVE_PUB:
                if (!archiveId) {
                    $Dialog.ShowLoginDialog();
                    return;
                }
                isSuccess = await $Data.Access.GetArchiveDetailsPub({ archive_id: archiveId });
                if (!isSuccess) return;
                const archivePub = $Data.Store.GetArchive();
                $TopBar.ChangeTitle(archivePub.title);
                break;
            case $Const.SCREEN_MODE.SEARCH:
                $Data.Store.Clear();
                $Marker.Clear()
                break;
            default:
                // 不正か？
                $Dialog.ShowLoginDialog();
                return;
        }
        // UIを更新
        $UI.ChangeScreenMode();
        // マーカー更新
        $Marker.ChangeScreenMode();
    },
};

// DOM読み込み後にアプリ起動
document.addEventListener('DOMContentLoaded', () => AppManager.Init());

// Public
export default AppManager;