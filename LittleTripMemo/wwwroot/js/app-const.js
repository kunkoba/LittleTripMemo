// 定数
window.$Const = {
    // 画面モード
    SCREEN_MODE: {
        CREATE:      'create',       // 新規登録モード
        ARCHIVE:     'archive',      // まとめ参照モード
        ARCHIVE_PUB: 'archive_pub',  // まとめ参照（Public）モード
        SEARCH:      'search',       // 地図検索モード
    },
    // FACEアイコンリスト（0番目がデフォルト）
    FACE_ICONS: [
        { faceId: 0,  imgUrl: 'img/face/grin-alt.png' },
        { faceId: 1,  imgUrl: 'img/face/grin-hearts.png' },
        { faceId: 2,  imgUrl: 'img/face/laugh-squint.png' },
        { faceId: 3,  imgUrl: 'img/face/face-drooling.png' },
        { faceId: 4,  imgUrl: 'img/face/sad-tear.png' },
        { faceId: 5,  imgUrl: 'img/face/dizzy.png' },
        { faceId: 6,  imgUrl: 'img/face/flushed.png' },
        { faceId: 7,  imgUrl: 'img/face/tired.png' },
        { faceId: 8,  imgUrl: 'img/face/face-expressionless.png' },
        { faceId: 9,  imgUrl: 'img/face/face-downcast-sweat.png' },
        { faceId: 10, imgUrl: 'img/face/face-disappointed.png' },
        { faceId: 11, imgUrl: 'img/face/face-confounded.png'},
        { faceId: 12, imgUrl: 'img/face/face-anxious-sweat.png' },
        { faceId: 13, imgUrl: 'img/face/face-angry-horns.png' }
    ],
    // WEATHERアイコンリスト（0番目がデフォルト）
    WEATHER_ICONS: [
    { weatherId: 0,  imgUrl: 'img/weather/sunny1.png' },
    { weatherId: 1,  imgUrl: 'img/weather/sunny2.png' },
    { weatherId: 2,  imgUrl: 'img/weather/cloud1.png'},
    { weatherId: 3,  imgUrl: 'img/weather/cloud2.png'},
    { weatherId: 4,  imgUrl: 'img/weather/cloud3.png'},
    { weatherId: 5,  imgUrl: 'img/weather/rain1.png' },
    { weatherId: 6,  imgUrl: 'img/weather/rain2.png' },
    { weatherId: 7,  imgUrl: 'img/weather/rain3.png' },
    { weatherId: 8,  imgUrl: 'img/weather/snow1.png'},
    { weatherId: 9,  imgUrl: 'img/weather/snow2.png'},
    ],
    // FACE絵文字リスト（共通定数）
    FACE_EMOJIS: ['😀', '🤣', '😍', '🤔', '😋', '😭', '😵‍💫', '😱', '😡', '😮'],
    // // WEATHER絵文字リスト
    // WEATHER_EMOJIS: ['☼', '☁', '☂', '⛈', '☃'],
    // WEATHER_EMOJIS2: ['☀️', '⛅', '☁️', '☔', '⛄'],
    // WEATHER_TEXTS:['はれ', 'はれときどきくもり', 'くもり', 'くもりときどきあめ', 'あめ', 'ゆき', 'かみなり', 'きり', 'たいふう'],
    // リアクション種別
    REACTION_TYPE: {
        FUNNY:    1, // 笑える🤣
        HELPFUL:  2, // 参考になる😍
        SURPRISE: 3, // びっくり😮
        EMPATHY:  4, // 共感する😉
    },
    SORT_FIELD: {
        CREATED: 1,
        UPDATED: 2,
        REACTION: 3,
    },
};
