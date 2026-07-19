// アプリ基盤
const AppManager = {
AppSettingKey: "little_trip_settings",
    AppData: {
        Context: {
            ScreenMode: $Const.SCREEN_MODE.CREATE,
            MarkerMode: $Const.MARKER_MODE.EMOJI,
            IsOnline: navigator.onLine,
            IsLoggedIn: false,
            TargetArchiveId: 0,
            TargetSeq: 0,
        },
        Owner: {
            Plan: "Free",
            Theme: null,
            MapStyle: null,
            GpsTrackingSec: 60,
            Currency_unit: '円',
            FontSize: 'standard',
            LastLoginDate: null,
            SystemInfo: null,
            Token: null,
        },
        Admin: {
            Notifications:[],
            ReportSummary: [],
            FeedbackList:[],
            UserMailList: [],
        },
        Legal: {
            TermsOfService: { body: "TermsOfService", update_tim: null },
            PrivacyPolicy:  { body: "PrivacyPolicy",  update_tim: null },
            License:        { body: "License",        update_tim: null },
        },
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
            isMapGrayscale: this.AppData.Owner.IsMapGrayscale,
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
        if (saved.isMapGrayscale) this.AppData.Owner.IsMapGrayscale = saved.isMapGrayscale;
        if (saved.gpsTrackingSec !== undefined) this.AppData.Owner.GpsTrackingSec = saved.gpsTrackingSec;
        if (saved.token) this.AppData.Owner.Token = saved.token;
        if (saved.currency_unit) this.AppData.Owner.Currency_unit = saved.currency_unit;
        if (saved.fontSize) this.AppData.Owner.FontSize = saved.fontSize;
        if (saved.lastLoginDate) this.AppData.Owner.LastLoginDate = saved.lastLoginDate;
        console.log("_loadSettings:", this.AppData.Owner);
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
                // console.log("$Polling.TASKS.SYNC_ACTIVITY");
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
    // 戦略：バックグラウンドでの自動更新（ユーザーへの確認なし）
    _initServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        // バージョンをURLに付与することで、app-const.jsの更新時にブラウザへ新SWを検知させる
        const swUrl = `./sw.js?v=${$Const.APP_INFO.VERSION}`;
        navigator.serviceWorker.register(swUrl)
            .then(reg => {
                console.log('[SW] 登録完了:', reg.scope);
                // 新しいSWが見つかった際、古いSWを待たずに即座に有効化させるための
                // updatefoundイベント（sw.js側のskipWaitingと連動して速やかに更新を完了させる）
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('[SW] 新しいバージョンをダウンロードしました。次回の起動で反映されます。');
                            }
                        }
                    };
                };
            })
            .catch(err => {
                console.error('[SW] 登録失敗:', err);
            });
        // 使用中に勝手に画面が変わって入力データが消えるのを防ぐため、
        // controllerchange（自動リロード）の監視は行いません。
    },
    // 更新確認ダイアログの共通処理
    async _confirmUpdate(worker) {
        const isOk = await $Dialog.ShowConfirm({
            title: "UPDATE",
            message: "新しいバージョンが利用可能です。\n最新版に更新しますか？",
            label: "UPDATE"
        });
        if (isOk) {
            // sw.js側で作った窓口（message）に合図を送る
            worker.postMessage({ type: 'SKIP_WAITING' });
        }
    },
    // アプリ起動時フロー
    async Init() {
        console.log("★★★ App.Init ★★★");
        // 1. UI基盤の準備（エラー画面を出せるように最初に行う）
        this._initViewport();
        $UI.Init();
        // テンプレート待機（部品が届くまでメイン処理を待つ）
        await new Promise(resolve => {
            const check = () => document.getElementById('tpl-dialog-error') ? resolve() : setTimeout(check, 30);
            check();
        });
        // 2. メインロジック
        try {
            // --- 起動処理（Token復元とDB初期化） ---
            {
                this._loadSettings();
                await $LocalDb.Init();
                this.RefreshLegalConfigs();     // 規約類の同期を開始（awaitせずバックグラウンドで実行）
                if (this.AppData.Owner.Token) {
                    this.AppData.Context.IsLoggedIn = true;
                    // 【修正点】失敗しても return せず、オフラインとして続行する
                    try {
                        await this.SyncActivityLog();
                        $Data.Access.GetSystemInfo();
                    } catch (e) {
                        console.warn("同期スキップ:", e.message);
                    }
                }
            }
            // --- リクエストパラメータ取得（元のロジックそのまま） ---
            {
                const params = new URLSearchParams(location.search);
                const urlMode = params.get("mode");
                const targetArchiveId = $Util.DecodeId(params.get("encodedId"));
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
                // Token復元済みなので、ここで勝手にログイン画面が出ることはありません
                if (!this.AppData.Context.TargetArchiveId && !this.AppData.Context.IsLoggedIn) {
                    $Dialog.ShowLoginDialog();
                }
            }
            // --- メイン処理（元の設定反映ロジックそのまま） ---
            {
                this._initPollingTasks();
                this.ChangeTheme(this.AppData.Owner.Theme || $UI.UI_THEME.BLUE);
                this.ChangeMapStyle(this.AppData.Owner.MapStyle || $Map.MAP_STYLE.STANDARD, this.AppData.Owner.IsMapGrayscale || false);
                this.ChangeGpsTracking(this.AppData.Owner.GpsTrackingSec || 0)
                this.ChangeCurrency(this.AppData.Owner.Currency_unit || '円')
                this.ChangeFontSize(this.AppData.Owner.FontSize || 'standard');
            }
            // --- 最終描画（通信エラーで死なないように保護） ---
            try {
                await this.RefreshScreen();
            } catch (e) {
                console.warn("描画データ取得失敗:", e.message);
            }
            this._initServiceWorker();
            $Marker.FocusToLocationMarker();
        } catch (fatalErr) {
            // 本当に致命的なエラー（プログラムのバグ等）のみ、エラー画面へ
            console.error("Fatal Error:", fatalErr);
            $Err.Handle(fatalErr);
        }
    },
    // 画面モード変更
    async RefreshScreen() {
        console.log("- RefreshScreen");
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
        //
        console.log("- $App.RefreshScreen -> ", this.AppData.Context.ScreenMode);
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
    // 規約・ポリシー類の差分チェックと同期（1日1回などの定期実行を想定）
    async RefreshLegalConfigs() {
        const MIN_DATE = "1900-01-01T00:00:00";
        // 1. ローカルDBから現在の状態（日時のみ）を取得
        const localData = await $LocalDb.Legal.GetAll();
        // 2. リクエスト作成（データがなければ最小値をセット）
        const targetKeys = Object.values($Const.LEGAL_TYPE);
        const items = targetKeys.map(key => {
            const local = localData.find(d => d.id === key);
            return {
                key: key,
                last_sync_tim: local ? local.update_tim : MIN_DATE
            };
        });
        // 3. サーバー照会
        const isSuccess = await $Data.Access.GetLegalConfigs({ items });
        if (!isSuccess) return;
        // 4. 更新があった項目のみDB保存
        const results = $Data.resData.results || [];
        let hasUpdate = false;
        for (const res of results) {
            if (res.value !== null) {
                // 本文がある＝更新あり。未読フラグ付きで保存
                await $LocalDb.Legal.Save(res.key, res.value, res.update_tim, true);
                hasUpdate = true;
            }
        }
        // 5. 更新があればUIに通知（バッジ表示用フラグの更新など）
        if (hasUpdate) {
            // 自分でループしてフラグをチェック（_updateLegalUnreadStatus）するのではなく、
            // 作法通り、データ管理側の判定ロジックを呼ぶだけにする
            await $Data.LocalDb.CheckLegalUnread();
        }
    },
    // 【ユーザ設定】カラーテーマ変更
    ChangeTheme(theme){
        this.AppData.Owner.Theme = theme;
        this._saveSettings(); // 保存実行
        $UI.ChangeTheme(theme);
    },
    // 【ユーザ設定】カラーテーマ変更
    ChangeMapStyle(style, isGray){
        this.AppData.Owner.MapStyle = style;
        this.AppData.Owner.IsMapGrayscale = isGray;
        this._saveSettings(); // 保存実行
        $Map.SetMapStyle(style, isGray);
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
    // 【GPS】GPS追従の一時停止
    PauseGpsTracking() {
        $Polling.Stop($Polling.TASKS.GPS_FOLLOW);
        console.log("GPS追従 >> 一時停止.");
    },
    // 【GPS】GPS追従の再開（設定が0より大きい場合のみ）
    ResumeGpsTracking() {
        if (this.AppData.Owner.GpsTrackingSec > 0 && this.AppData.Context.IsOnline) {
            $Polling.Start($Polling.TASKS.GPS_FOLLOW);
            console.log("GPS追従 >> 再開");
        }
    }
};

// DOM読み込み後にアプリ起動
document.addEventListener('DOMContentLoaded', () => AppManager.Init());

// Public
export default AppManager;