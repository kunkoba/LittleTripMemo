// 定数
window.$Const = {
    // アプリ情報
    APP_INFO: {
        NAME: "Little Trip Memoあああ",
        DEVELOPER: "kunkoba",
        VERSION: "1.0.0",
        OFFICIAL_SITE: "http://127.0.0.1:5501/index.html",
        LICENSE: "?????????????",
    },
    // 画面モード
    SCREEN_MODE: {
        CREATE:      'create',       // 新規登録モード
        ARCHIVE:     'archive',      // まとめ参照モード
        ARCHIVE_PUB: 'archive_pub',  // まとめ参照（Public）モード
        SEARCH:      'search',       // 地図検索モード
    },
    // FACE絵文字リスト（共通定数）
    FACE_EMOJIS: ['😀', '🤣', '😍', '🤔', '😋', '😭', '😵‍💫', '😱', '😡', '😮'],
    // 地点検索並び替え
    SORT_FIELD: {
        CREATED: 1, // 登録順
        UPDATED: 2, // 登録順
        REACTION: 3, // 登録順
    },
    // リアクション種別
    REACTION_TYPE: {
        FUNNY:    { id: 1, emoji: '🤣' }, //笑える
        LOVE:     { id: 2, emoji: '😍' }, //好き
        SURPRISE: { id: 3, emoji: '😮' }, //びっくり
        SAD:      { id: 4, emoji: '😢' }, //悲しい
        REPORT:   { id: 5, emoji: '😡' }, //通報
    },
    // 通知種別アイコン
    NOTICE_ICONS: {
        0: '🤔', // その他
        1: '⚠️', // 重要
        2: '📢', // 周知
    },
};
