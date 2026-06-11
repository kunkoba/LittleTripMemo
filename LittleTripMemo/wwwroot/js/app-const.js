// 定数
window.$Const = {
    // アプリ情報
    APP_INFO: {
        NAME: "Little Trip Memoあああ",
        DEVELOPER: "kunkoba",
        VERSION: "1.0.0",
        OFFICIAL_SITE: "https://hinekulemonstudio.web.app/",
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
        SAD:      { id: 4, emoji: '😭' }, //悲しい
    },
    // 全体通知種別
    NOTICE_KIND: {
        OTHER:     { id: 0, emoji: '💬', label: 'Other' },
        IMPORTANT: { id: 1, emoji: '📢', label: 'Important' },
        NOTICE:    { id: 2, emoji: '🔔', label: 'Notice' },
    },
    // 個別通知（メール）種別
    USER_NOTICE_KIND: {
        INFO:    { id: 1, emoji: '✉️', label: 'Info' },
        CAUTION: { id: 8, emoji: '⚠️', label: 'Caution' },
        WARNING: { id: 9, emoji: '🚫', label: 'Warning' },
    },
};

// window.$Const の中、あるいは直後に配置
window.$Const.GetMockData = function(key, count = 10) {
    const list = [];
    const now = new Date();
    for (let i = 1; i <= count; i++) {
        switch (key) {
            case 'REPORT_SUMMARY': // 管理者：通報集計
                list.push({
                    target_user_name: `User_${i}`,
                    target_user_id: `c7c2583e-e389-4f7c-b6b5-e28541507791`,
                    archive_id: 3,
                    archive_title: `通報されたまとめ案 #${i} の長いタイトル`,
                    report_count: Math.floor(Math.random() * 50) + 1
                });
                break;
            case 'REPORT_DETAIL': // 管理者：通報詳細
                list.push({
                    reporter_user_id: `reporter-guid-${i}`,
                    report_tim: new Date(now.getTime() - i * 600000).toISOString(),
                    body: `${i}番目の通報理由：\n不適切なコンテンツが含まれています。\n規約違反の疑いがあります。\nあああああ\nああああ\nあああ\nあああああ\nああああああ\nあああああ\nあああああ`
                });
                break;
            case 'FEEDBACK': // フィードバック
                list.push({
                    create_tim: new Date(now.getTime() - i * 1800000).toISOString(),
                    score: (i % 5) + 1,
                    body: `フィードバック #${i}: \nアプリのデザインがとても使いやすいです！${'あああ\n'.repeat(i % 50)}`
                });
                break;
        }
    }
    return list;
};
