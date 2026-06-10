// アプリ基盤
const AppManager = {
    AppSettingKey: "little_trip_settings",
    AppData: {
        Context: {
            ScreenMode: $Const.SCREEN_MODE.CREATE,
            IsOnline: navigator.onLine,
            IsLoggedIn: false,
            TargetArchiveId: 0,
        },
        Owner: {
            Theme: null,
            MapStyle: null,
            GpsTrackingSec: 0,
            Token: null,
            Currency_unit: 'JPY',
            SystemInfo: null,
            FontSize: 'standard',
        },
        Admin: {
            notifications:[],
            reportSummary: [],
            feedbackList:[],
            userMailList: [],
        }
    },
    // 設定を保存
    _saveSettings() {
        localStorage.setItem(this.AppSettingKey, JSON.stringify({
            theme: this.AppData.Owner.Theme,
            mapStyleKey: this.AppData.Owner.MapStyle?.key,
            gpsTrackingSec: this.AppData.Owner.GpsTrackingSec,
            token: this.AppData.Owner.Token,
            currency_unit: this.AppData.Owner.Currency_unit,
            fontSize: this.AppData.Owner.FontSize,
        }));
        // console.log("_saveSettings:", this.AppData.Owner);
    },
    // 設定を読込
    _loadSettings() {
        const saved = JSON.parse(localStorage.getItem(this.AppSettingKey) || '{}');
        if (saved.theme) this.AppData.Owner.Theme = saved.theme;
        if (saved.mapStyleKey) this.AppData.Owner.MapStyle = $Map.MAP_STYLE[saved.mapStyleKey];
        if (saved.gpsTrackingSec !== undefined) this.AppData.Owner.GpsTrackingSec = saved.gpsTrackingSec;
        if (saved.token) this.AppData.Owner.Token = saved.token;
        if (saved.currency_unit) this.AppData.Owner.Currency_unit = saved.currency_unit;
        if (saved.fontSize) this.AppData.Owner.FontSize = saved.fontSize;
        // console.log("_loadSettings:", this.AppData.Owner);
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
        // オフライン監視
        $Polling.Add($Polling.TASKS.OFFLINE_CHECK, () => {
            const isOn = navigator.onLine;
            $App.AppData.Context.IsOnline = isOn;    // オフライン状態を保持
            if (isOn) {
                // オンライン
                $Notice.Offline.Hide();
                $Polling.Start($Polling.TASKS.DATA_DETAIL);
                $Polling.Start($Polling.TASKS.DATA_REACTION);
            } else {
                // オフライン
                $Notice.Offline.Show();
                $Polling.Stop($Polling.TASKS.DATA_DETAIL);
                $Polling.Stop($Polling.TASKS.DATA_REACTION);
                console.log("-- offline --");
            }
        }, 30);
        // オンライン監視
        if ($App.AppData.Context.IsOnline) {
            // GPSトラッキング
            const sec = $App.AppData.Owner.GpsTrackingSec; // ★変更
            if (sec > 0) {
                // 現在地追従（保存された秒数で登録）
                $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
                    $Marker.RefreshCurrentLocation();
                }, sec);
                $Polling.Start($Polling.TASKS.GPS_FOLLOW);
            }
            // データ送信処理（秒）
            $Polling.Add($Polling.TASKS.DATA_DETAIL, async () => {
                if (!$App.AppData.Context.IsLoggedIn) return;
                if (await $LocalDb.Detail.GetCount() === 0) return;
                await $Warn.CatchAsync(async () => {
                    // 全て $Data.LocalDb に任せる
                    await $Data.LocalDb.BulkSendDetails();
                    // 通知
                    $Notice.Info("バックグラウンド同期は成功しました。");
                })();
            }, 600);
            // リアクションデータ送信処理（秒）
            $Polling.Add($Polling.TASKS.DATA_REACTION, async () => {
                if (!$App.AppData.Context.IsLoggedIn) return;
                const unsent = await $LocalDb.Reaction.GetUnsentAll();
                if (!unsent || unsent.length === 0) return;
                await $Warn.CatchAsync(async () => {
                    await $Data.LocalDb.BulkSendReactions();
                    // 通知が必要な場合は以下をコメントイン
                    $Notice.Info("バックグラウンド同期は成功しました。");
                })();
            }, 60); // 60秒おきに実行
        }
        // 定期タスク開始-----
        $Polling.Start($Polling.TASKS.OFFLINE_CHECK);
    },
    // ログインフロー内に追加
    async ExecuteLoginFlow() {
        return await $Warn.CatchAsync(async () => {
            $Notice.Info("ログイン中...");
            const email = await $Auth.GetVerifiedEmailByGoogle();
            const ret = await $Data.Access.LoginToServer(email);
            if (ret) {
                this.AppData.Context.IsLoggedIn = true;
                this._saveSettings();
                $Notice.Info("ログインに成功しました！");
                return true;
            }
            return false;
        })();
    },
    // アプリ起動時フロー
    async Init() {
        this._loadSettings();
        await $LocalDb.Init();
        // 最初に設定をロードし、トークンがあればログイン状態にしておく
        if (this.AppData.Owner.Token) {
            this.AppData.Context.IsLoggedIn = true;
            // システム情報取得
            let isSuccess = await $Data.Access.GetSystemInfo();
            if (!isSuccess) {
                return;
            };
        }
        // リクエストパラメータ取得
        const params = new URLSearchParams(location.search);
        const urlMode = params.get("mode");
        const targetArchiveId = $Util.DecodeId(params.get("encodedId"));
        // URLパラメータの mode を優先、なければ TargetArchiveId の有無で分岐、それ以外は CREATE
        this.AppData.Context.TargetArchiveId = targetArchiveId;
        if (urlMode) {
            this.AppData.Context.ScreenMode = urlMode;
        } else {
            if (this.AppData.Context.TargetArchiveId) {
                this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.ARCHIVE_PUB;
            } else {
                this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
            }
        }
        // 処理前チェック：TargetArchiveIdが無く、未ログインならダイアログ表示（初期画面としてのCREATE用）
        if (!this.AppData.Context.TargetArchiveId && !this.AppData.Context.IsLoggedIn) {
            $Dialog.ShowLoginDialog();
        }
        // メイン処理
        console.log("★App.Init", this.AppData, params);
        this._initViewport();
        this._initPollingTasks();
        // ユーザ設定反映
        $UI.Init();
        this.ChangeTheme(this.AppData.Owner.Theme || $UI.UI_THEME.BLUE);
        this.ChangeMapStyle(this.AppData.Owner.MapStyle || $Map.MAP_STYLE.STANDARD);
        this.ChangeGpsTracking(this.AppData.Owner.GpsTrackingSec || 0)
        this.ChangeCurrency(this.AppData.Owner.Currency_unit || 'JPY')
        this.ChangeFontSize(this.AppData.Owner.FontSize || '');
        // UI関連
        await this.RefreshScreen();
    },
    // 画面モード変更
    async RefreshScreen() {
        console.log("App.RefreshScreen:", this.AppData.Context.ScreenMode)
        // アーカイブID
        const archiveId = this.AppData.Context.TargetArchiveId;
        let isSuccess = false;
        // モードごとにデータ取得
        switch (this.AppData.Context.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                if (this.AppData.Context.IsLoggedIn) {
                    // 地点データ取得
                    isSuccess = await $Data.Access.GetUnMergeDetails({});
                    if (!isSuccess) {
                        return;
                    };
                }
                break;
            case $Const.SCREEN_MODE.ARCHIVE:
                if (!archiveId) {
                    // 不正な場合はログインダイアログを出して待機
                    if (!this.AppData.Context.IsLoggedIn) $Dialog.ShowLoginDialog();
                    this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
                    window.history.replaceState(null, '', window.location.pathname); // URLをクリア
                    // return;
                }
                if (this.AppData.Context.IsLoggedIn) {
                    isSuccess = await $Data.Access.GetArchiveDetails({ archive_id: archiveId });
                    if (!isSuccess) {
                        this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
                    } else {
                        const archive = $Data.Store.GetArchive();
                        $TopBar.ChangeTitle(archive?.title || "");
                    };
                }
                break;
            case $Const.SCREEN_MODE.ARCHIVE_PUB:
                if (!archiveId) {
                    if (!this.AppData.Context.IsLoggedIn) $Dialog.ShowLoginDialog();
                    this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
                    window.history.replaceState(null, '', window.location.pathname); // URLをクリア
                    // this.RefreshScreen();
                    // return;
                }
                isSuccess = await $Data.Access.GetArchiveDetailsPub({ archive_id: archiveId });
                if (!isSuccess) {
                    if (!this.AppData.Context.IsLoggedIn) {
                        return;
                    }
                    this.AppData.Context.ScreenMode = $Const.SCREEN_MODE.CREATE;
                    window.history.replaceState(null, '', window.location.pathname); // エラー時にURLをクリア
                } else {
                    // 取得した直後にローカルDBへ同期
                    if (this.AppData.Context.IsLoggedIn) {
                        await $Data.LocalDb.SetReactionsToLocalDb();
                    }
                    const archivePub = $Data.Store.GetArchive();
                    $TopBar.ChangeTitle(archivePub?.title || "");
                };
                break;
            case $Const.SCREEN_MODE.SEARCH:
                $Data.Store.Clear();
                $Marker.Clear();
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
    // ログアウト処理
    async Logout() {
        if (firebase.apps.length) {
            await firebase.auth().signOut();
        }
        // 1. メモリ上の認証情報をクリア
        this.AppData.Context.IsLoggedIn = false;
        this.AppData.Owner.Token = null;
        // 2. ローカルストレージを更新（Tokenがnullの状態で上書き保存される）
        this._saveSettings();
        // 3. 必要であればIndexedDBのキャッシュ等も消すが、基本は上記2つで次回の自動ログインは防げます。
        console.log("Token destroyed and logged out.");
    },
    // カラーテーマ変更
    ChangeTheme(theme){
        this.AppData.Owner.Theme = theme;
        this._saveSettings(); // 保存実行
        $UI.ChangeTheme(theme);
    },
    // カラーテーマ変更
    ChangeMapStyle(style){
        this.AppData.Owner.MapStyle = style;
        this._saveSettings(); // 保存実行
        $Map.SetMapStyle(style);
    },
    // 追従設定の変更メソッド
    ChangeGpsTracking(sec) {
        const targetSec = parseInt(sec || 0);
        this.AppData.Owner.GpsTrackingSec = targetSec;
        // 一旦既存のタスクを停止
        $Polling.Stop($Polling.TASKS.GPS_FOLLOW);
        // 秒数が1以上かつオンラインなら新しくタスクを開始
        if (targetSec > 0 && this.AppData.Context.IsOnline) {
            $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
                $Marker.RefreshCurrentLocation();
                console.log("GPS Follow logic executed.", this.AppData.Owner.GpsTrackingSec);
            }, targetSec);
            $Polling.Start($Polling.TASKS.GPS_FOLLOW);
        }
        this._saveSettings(); // ローカルストレージに永続化
    },
    // 通貨単位の変更メソッド
    ChangeCurrency(unit) {
        this.AppData.Owner.Currency_unit = unit;
        this._saveSettings(); // 保存実行
    },
    // フォントサイズの変更メソッド
    ChangeFontSize(size) {
        this.AppData.Owner.FontSize = size;
        this._saveSettings(); // 保存実行
        $UI.ChangeFontSize(size);
    },
};

// DOM読み込み後にアプリ起動
document.addEventListener('DOMContentLoaded', () => AppManager.Init());

// Public
export default AppManager;