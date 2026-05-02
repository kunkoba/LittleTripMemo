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
            currency_unit: 'JPY',
            systemInfo: null,
        },
        Admin: {
            notifications: [],
            reportSummary: [],
            reports:[],
            feedbackList:[]
        }
    },
    // 設定を保存
    _saveSettings() {
        localStorage.setItem(this.AppSettingKey, JSON.stringify({
            theme: this.AppData.Owner.Theme,
            mapStyleKey: this.AppData.Owner.MapStyle?.key,
            isGpsTracking: this.AppData.Owner.IsGpsTracking,
            token: this.AppData.Owner.Token,
            currency_unit: this.AppData.Owner.currency_unit,
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
        if (saved.currency_unit) this.AppData.Owner.currency_unit = saved.currency_unit;
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
        // オンライン監視（秒）
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
        }, 30);
        // データ送信処理（秒）
        $Polling.Add($Polling.TASKS.DATA_SEND, async () => {
            if (await $LocalDb.Detail.GetCount() === 0) return;
            await $Warn.CatchAsync(async () => {
                // 全て $Data.LocalDb に任せる
                await $Data.LocalDb.BulkSendDetails();
                // 通知
                $Notice.Info("Saved successfully.");
            })();
        }, 60);
        // 現在地追従（秒）
        $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
            // 追従モードかつオンラインなら現在地を更新（フォーカスはしない）
            if ($App.AppData.Owner.IsGpsTracking && $App.AppData.System.IsOnline) {
                $Marker.RefreshCurrentLocation();
            }
        }, 10);
        // 定期タスク開始-----
        $Polling.Start($Polling.TASKS.OFFLINE_CHECK);
    },
    // ログインフロー内に追加
    async ExecuteLoginFlow() {
        return await $Warn.CatchAsync(async () => {
            $Notice.Info("Logging in...");
            const email = await $Auth.GetVerifiedEmailByGoogle();
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
    // アプリ起動時フロー内に追加
    async Init() {
        console.log("★App.Init");
        this._initViewport();
        await $LocalDb.Init();
        this._initPollingTasks();
        this._loadSettings(); 
        $UI.Init();
        this.ChangeTheme(this.AppData.Owner.Theme || $UI.UI_THEME.BLUE);
        this.ChangeMapStyle(this.AppData.Owner.MapStyle || $Map.MAP_STYLE.STANDARD);
        this.AppData.System.ScreenMode = new URLSearchParams(location.search).get("mode") ?? $Const.SCREEN_MODE.CREATE;
        this.AppData.System.ArchiveId = new URLSearchParams(location.search).get("archiveId");
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
        this.AppData.Owner.currency_unit = unit;
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
                // システム情報を取得
                $Data.Access.GetSystemInfo();
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