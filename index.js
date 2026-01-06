// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// ---------- 環境変数 ----------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // 通知したいチャンネルID

// ---------- FB設定 ----------
const FBs = [
    { name: "コインブラ", intervalHours: 10, startDay: 3, startHour: 4 }, // 水曜4:00
    { name: "オーシュ", intervalHours: 21, startDay: 3, startHour: 4 }  // 水曜4:00
];

const MS_PER_MIN = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MIN;

// ---------- ヘルパー ----------
function getNextOccurrences(fb) {
    const now = new Date();
    // 基準日を今週水曜 4:00 に固定
    const base = new Date(now);
    base.setHours(fb.startHour, 0, 0, 0);
    const dayDiff = (fb.startDay - base.getDay() + 7) % 7;
    base.setDate(base.getDate() + dayDiff);

    let occurrences = [];
    let next = new Date(base);
    while (occurrences.length < 5) { // 未来5個分
        if (next > now) occurrences.push(new Date(next));
        next = new Date(next.getTime() + fb.intervalHours * MS_PER_HOUR);
    }
    return occurrences;
}

// ---------- Discord起動 ----------
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error("指定チャンネルが見つかりません");
        return;
    }

    // 0時通知
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            FBs.forEach(fb => {
                const next = getNextOccurrences(fb)[0];
                channel.send(`本日${next.getMonth()+1}月${next.getDate()}日の\n${fb.name} FB予定時刻は${next.getHours().toString().padStart(2,'0')}:${next.getMinutes().toString().padStart(2,'0')}です。`);
            });
        }
    }, 60 * 1000); // 1分ごとチェック

    // 出現5分前通知
    setInterval(() => {
        const now = new Date();
        FBs.forEach(fb => {
            const next = getNextOccurrences(fb)[0];
            const diffMin = (next - now) / MS_PER_MIN;
            if (diffMin > 4.9 && diffMin < 5.1) { // 5分前 ±0.1分
                channel.send(`オーシュFB出現\n5分前のお知らせです。`);
            }
        });
    }, 30 * 1000); // 30秒ごとチェック
});

// ---------- ログイン ----------
client.login(DISCORD_TOKEN);
