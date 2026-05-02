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
    // リアクション種別
    REACTION_TYPE: {
        FUNNY:    1, // 笑える🤣
        HELPFUL:  2, // 参考になる😍
        SURPRISE: 3, // びっくり😮
        EMPATHY:  4, // 共感する😉
    },
    // 地点検索並び替え
    SORT_FIELD: {
        CREATED: 1,
        UPDATED: 2,
        REACTION: 3,
    },
    // 通知種別アイコン
    NOTICE_ICONS: {
        0: '📢', // その他
        1: '⚠️', // 重要
    },
};
