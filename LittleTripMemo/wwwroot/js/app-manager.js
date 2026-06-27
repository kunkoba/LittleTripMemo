// アプリ基盤
const AppManager = {
    AppSettingKey: "little_trip_settings",
    AppData: {
        Context: {
            ScreenMode: $Const.SCREEN_MODE.CREATE,
            IsOnline: navigator.onLine,
            IsLoggedIn: false,
            TargetArchiveId: 0,
            TargetSeq: 0,
        },
        Owner: {
            Theme: null,
            MapStyle: null,
            GpsTrackingSec: 60,
            Token: null,
            Currency_unit: 'JPY',
            SystemInfo: null,
            FontSize: 'standard',
            LastLoginDate: null,
        },
        Admin: {
            notifications:[],
            reportSummary: [],
            feedbackList:[],
            userMailList: [],
        }
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
    // 設定を保存
    _saveSettings() {
        localStorage.setItem(this.AppSettingKey, JSON.stringify({
            theme: this.AppData.Owner.Theme,
            mapStyleKey: this.AppData.Owner.MapStyle?.key,
            gpsTrackingSec: this.AppData.Owner.GpsTrackingSec,
            token: this.AppData.Owner.Token,
            currency_unit: this.AppData.Owner.Currency_unit,
            fontSize: this.AppData.Owner.FontSize,
            lastLoginDate: this.AppData.Owner.LastLoginDate,
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
        if (saved.lastLoginDate) this.AppData.Owner.LastLoginDate = saved.lastLoginDate;
        // console.log("_loadSettings:", this.AppData.Owner);
    },
    // 定期タスクの定義と開始
    _initPollingTasks() {
        const checkSec = 10;
        const gpsTrackingSec = $App.AppData.Owner.GpsTrackingSec;
        const saveDetailSec = $Const.APP_CONFIG.SAVE_DETAIL_SEC;
        const saveReactionSec = $Const.APP_CONFIG.SAVE_REACTION_SEC;
        const activityCheckSec = 300;
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
                $Polling.Start($Polling.TASKS.SYNC_ACTIVITY);
            } else {
                // オフライン
                $Notice.Offline.Show();
                $Polling.Stop($Polling.TASKS.DATA_DETAIL);
                $Polling.Stop($Polling.TASKS.DATA_REACTION);
                $Polling.Stop($Polling.TASKS.SYNC_ACTIVITY);
            }
        }, checkSec);
        // オンライン監視
        if ($App.AppData.Context.IsOnline) {
            // GPSトラッキング
            if (gpsTrackingSec > 0) {
                // 現在地追従（保存された秒数で登録）
                $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
                    $Marker.RefreshCurrentLocation();
                }, gpsTrackingSec);
                $Polling.Start($Polling.TASKS.GPS_FOLLOW);
            }
            // データ送信処理
            $Polling.Add($Polling.TASKS.DATA_DETAIL, async () => {
                if (!$App.AppData.Context.IsLoggedIn) return;
                if (await $LocalDb.Detail.GetCount() === 0) return;
                // 全て $Data.LocalDb に任せる
                const isSuccess = await $Data.LocalDb.BulkSendDetails();
                if (isSuccess) {
                    // 最新データをサーバーから再取得し、マーカーを再描画する
                    await this.RefreshScreen(); 
                    // 通知
                    const msg = "バックグラウンド同期は成功しました：明細メモ"
                    $Notice.Info(msg);
                    console.log(msg);
                }
            }, saveDetailSec);
            // リアクションデータ送信処理
            $Polling.Add($Polling.TASKS.DATA_REACTION, async () => {
                if (!$App.AppData.Context.IsLoggedIn) return;
                const unsent = await $LocalDb.Reaction.GetUnsentAll();
                if (!unsent || unsent.length === 0) return;
                // 全て $Data.LocalDb に任せる
                const isSuccess = await $Data.LocalDb.BulkSendReactions();
                if (isSuccess) {
                    // 通知
                    const msg = "バックグラウンド同期は成功しました：リアクション"
                    $Notice.Info(msg);
                    console.log(msg);
                }
            }, saveReactionSec);
            // ログインチェック
            $Polling.Add($Polling.TASKS.SYNC_ACTIVITY, async () => {
                console.log("$Polling.TASKS.SYNC_ACTIVITY");
                // ユーザ存在チェック＆最終ログイン日時設定
                let isSuccess = await this.SyncActivityLog();
                if (!isSuccess) {
                    $Dialog.ShowLoginDialog();
                    return;
                }
            }, activityCheckSec);
        }
        // 定期タスク開始-----
        $Polling.Start($Polling.TASKS.OFFLINE_CHECK);
    },
    // アプリ起動時フロー
    async Init() {
        console.log("★App.Init");
        // --- 起動処理 ---
        {
            this._initViewport();
            this._loadSettings();
            await $LocalDb.Init();
            // 最初に設定をロードし、トークンがあればログイン状態にしておく
            if (this.AppData.Owner.Token) {
                this.AppData.Context.IsLoggedIn = true;
                // ユーザ存在チェック＆最終ログイン日時設定
                let isSuccess = await this.SyncActivityLog();
                if (!isSuccess) {
                    $Dialog.ShowLoginDialog();
                    return;
                }
                // システム情報取得
                $Data.Access.GetSystemInfo();
            }
        }
        // リクエストパラメータ取得
        {
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
        }
        // メイン処理
        {
            this._initPollingTasks();
            // ユーザ設定反映
            $UI.Init();
            this.ChangeTheme(this.AppData.Owner.Theme || $UI.UI_THEME.BLUE);
            this.ChangeMapStyle(this.AppData.Owner.MapStyle || $Map.MAP_STYLE.STANDARD);
            this.ChangeGpsTracking(this.AppData.Owner.GpsTrackingSec || 0)
            this.ChangeCurrency(this.AppData.Owner.Currency_unit || 'JPY')
            this.ChangeFontSize(this.AppData.Owner.FontSize || '');
        }
        // UI関連
        await this.RefreshScreen();
    },
    // 画面モード変更
    async RefreshScreen() {
        console.log("◆RefreshScreen");
        // データをクリア
        $Data.Clear();
        // アーカイブID
        const archiveId = this.AppData.Context.TargetArchiveId;
        let isSuccess = false;
        // モードごとにデータ取得
        switch (this.AppData.Context.ScreenMode) {
            case $Const.SCREEN_MODE.CREATE:
                if (this.AppData.Context.IsLoggedIn) {
                    // 地点データ取得
                    isSuccess = await $Data.Access.GetUnMergeDetails({});
                    // if (!isSuccess) {
                    //     return;
                    // };
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
                $Marker.Clear();
                break;
            default:
                // 不正か？
                $Dialog.ShowLoginDialog();
                return;
        }
        // ローカル㏈にデータがあれば吸い上げる
        if (this.AppData.Context.IsLoggedIn && this.AppData.Context.ScreenMode == $Const.SCREEN_MODE.CREATE) {
            await $Warn.CatchAsync(async () => {
                const localDetails = await $LocalDb.Detail.GetAll();
                if (localDetails && localDetails.length > 0) {
                    localDetails.forEach(d => {
                        $Data.Store.UpdateDetail(d);
                    });
                }
            })();
        }
        // UIを更新
        $UI.ChangeScreenMode();
        // マーカー更新
        $Marker.ChangeScreenMode();
    },
    // サーバエラー処理
    async HandleServerFailure(response) {
        console.log(">>HandleServerFailure");
        $Notice.Loading.Hide();
        if (response) {
            // ログインエラー (401)
            if (response.status === 401) {
                this.AppData.Owner.Token = null;
                this.AppData.Context.IsLoggedIn = false;
                $Dialog.ShowLoginDialog();
                return;
            } else {
                // それ以外のサーバエラー（業務エラー含む）
                const serverErr = await response.json();
                console.error("serverErr:", serverErr);
                const err = new Error(serverErr.message);
                throw err;
            }
        } else {
            // オフライン判定時のモード別コントロール
            if (!this.AppData.Context.IsOnline) {
                $Notice.Warn("オフライン中は、機能が制限されます。");
                return;
            } else {
                // サーバが稼働していない（おそらく）
                const err = new Error("サーバが稼働していません。しばらくお待ちください。");
                throw err;
            }
        }
    },
    // ログイン処理
    async ExecuteLoginFlow() {
        return await $Warn.CatchAsync(async () => {
            $Notice.Info("ログイン中...");
            const email = await $Auth.GetVerifiedEmailByGoogle();
            // const isSuccess = await $Data.Access.LoginFirebase(email);
            const isSuccess = await $Data.Access.LoginFirebase({Email: email});
            if (isSuccess) {
                this.AppData.Context.IsLoggedIn = true;
                this._saveSettings();
                $Notice.Info("ログインに成功しました！");
                return true;
            }
            return false;
        })();
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
    // 最終利用日をチェックし、必要があればサーバーへ通知する
    async SyncActivityLog() {
        // 未ログインまたはオフラインなら処理しない
        if (!this.AppData.Context.IsLoggedIn || !this.AppData.Context.IsOnline) return;
        //
        // 1. 今日の日付（時刻00:00:00）のミリ秒を取得
        const today = new Date().setHours(0, 0, 0, 0);
        // 2. 前回の保存日を取得し、Dateに変換（nullなら 0 = 1970年扱いにする）
        // これにより初回起動時も「今日 > 前回」が成立し、エラーにならず同期へ進む
        const lastStr = this.AppData.Context.LastLoginDate;
        const last = lastStr ? new Date(lastStr).setHours(0, 0, 0, 0) : 0;
        // 3. 今日が保存日より後でなければ同期不要（すでに今日実行済み）
        if (today <= last) return true;
        // サーバー更新（ユーザチェックとログイン処理を同時にする）
        const isSuccess = await $Data.Access.EnsureLoginUser();
        if (isSuccess) {
            // 成功時にローカルに保存することで、ローカルとサーバの最終更新日が一致する
            this.AppData.Context.LastLoginDate = $Util.FormatDate(today, 'YYYY-MM-DD');
            this._saveSettings(); // ローカルストレージへ永続化
            $Notice.Info("最終ログイン日時は更新されました。");
            return true;
        }
        return false;
    },
    // 【ユーザ設定】カラーテーマ変更
    ChangeTheme(theme){
        this.AppData.Owner.Theme = theme;
        this._saveSettings(); // 保存実行
        $UI.ChangeTheme(theme);
    },
    // 【ユーザ設定】カラーテーマ変更
    ChangeMapStyle(style){
        this.AppData.Owner.MapStyle = style;
        this._saveSettings(); // 保存実行
        $Map.SetMapStyle(style);
    },
    // 【ユーザ設定】追従設定の変更メソッド
    ChangeGpsTracking(sec) {
        const targetSec = parseInt(sec || 0);
        this.AppData.Owner.GpsTrackingSec = targetSec;
        // 一旦既存のタスクを停止
        $Polling.Stop($Polling.TASKS.GPS_FOLLOW);
        // 秒数が1以上かつオンラインなら新しくタスクを開始
        if (targetSec > 0 && this.AppData.Context.IsOnline) {
            $Polling.Add($Polling.TASKS.GPS_FOLLOW, () => {
                $Marker.RefreshCurrentLocation();
            }, targetSec);
            $Polling.Start($Polling.TASKS.GPS_FOLLOW);
        }
        this._saveSettings(); // ローカルストレージに永続化
    },
    // 【ユーザ設定】通貨単位の変更メソッド
    ChangeCurrency(unit) {
        this.AppData.Owner.Currency_unit = unit;
        this._saveSettings(); // 保存実行
    },
    // 【ユーザ設定】フォントサイズの変更メソッド
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