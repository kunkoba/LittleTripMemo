// 中心座標
const baseLat = 34.833672;
const baseLng = 135.499622;
// ランダムオフセット
function randomOffset(base, range = 0.003) {
    return base + (Math.random() * range * 2 - range);
}

// まとめ親
export const testArchive = [
    {
        archive_id: 1,
        user_id: 1,
        title: "テストアーカイブ",
        memo_count: 10,
        create_tim: "2026-02-01T10:00:00",
        update_tim: "2026-02-01T10:00:00"
    }
];

// 詳細データ（ランダム位置）
// 詳細データ（3日間でランダムに振り分け）
// 詳細データ（絵文字対応版）
export function generateTestDetails() {
    const fEmojis = $Const.FACE_EMOJIS;
    const wEmojis = $Const.WEATHER_EMOJIS;
    return Array.from({ length: 10 }, (_, i) => {
        const day = 1 + Math.floor(Math.random() * 3);
        const dateStr = `2026-02-${String(day).padStart(2, "0")}`;
        return {
            archive_id: 1, seq: i + 1, latitude: randomOffset(baseLat), longitude: randomOffset(baseLng),
            title: `ポイント${i + 1}`,
            body: `テストメモテストメモテストメモテストメモテストメモテストメモテストメモテストメモテストメモテストメモテストメモテストメモ${i + 1}`,
            memo_date: dateStr, memo_time: `10:${String(i + 1).padStart(2, "0")}`,
            face_emoji: fEmojis[Math.floor(Math.random() * fEmojis.length)],
            weather_emoji: wEmojis[Math.floor(Math.random() * wEmojis.length)],
            link_url: "http://127.0.0.1:5500/index.html", memo_price: i * 100
        };
    });
}
