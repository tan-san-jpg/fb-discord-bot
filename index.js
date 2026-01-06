// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const schedule = require('node-schedule');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Discord環境変数にBOTトークンと通知チャンネルIDを設定しておく
// DISCORD_TOKEN, CHANNEL_ID

const channelId = process.env.CHANNEL_ID;

// 出現間隔（分単位）
const COIMBRA_INTERVAL = 10 * 60; // 10時間 → 600分
const ORCHE_INTERVAL = 21 * 60;   // 21時間 → 1260分

// 火曜10:00メンテ後リセットのためのスケジュール
function generateSchedules() {
    const schedules = { coimbra: [], orche: [] };
    
    // 水曜04:00起点
    const now = new Date();
    let start = new Date(now);
    start.setHours(4, 0, 0, 0); // 水曜04:00に設定
    while (start.getDay() !== 3) { // 水曜まで進める
        start.setDate(start.getDate() + 1);
    }

    // コインブラスケジュール作成（10時間間隔）
    let coimbraTime = new Date(start);
    while (coimbraTime.getDate() <= start.getDate() + 7) {
        schedules.coimbra.push(new Date(coimbraTime));
        coimbraTime = new Date(coimbraTime.getTime() + COIMBRA_INTERVAL * 60000);
    }

    // オーシュスケジュール作成（21時間間隔）
    let orcheTime = new Date(start);
    while (orcheTime.getDate() <= start.getDate() + 7) {
        schedules.orche.push(new Date(orcheTime));
        orcheTime = new Date(orcheTime.getTime() + ORCHE_INTERVAL * 60000);
    }

    return schedules;
}

// Discordチャンネルにメッセージ送信
async function sendMessage(message) {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
        console.log('指定チャンネルが見つかりません');
        return;
    }
    channel.send(message);
}

// 通知スケジューリング
function scheduleNotifications() {
    const schedules = generateSchedules();

    // 0時通知
    schedule.scheduleJob('0 0 * * *', async () => {
        const today = new Date();
        const coimbraToday = schedules.coimbra.filter(d => d.getDate() === today.getDate());
        const orcheToday = schedules.orche.filter(d => d.getDate() === today.getDate());

        let msg = `本日 ${today.getMonth()+1}月${today.getDate()}日のFB予定時刻:\n`;
        if (coimbraToday.length) msg += `コインブラ: ${coimbraToday.map(d => d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')).join(', ')}\n`;
        if (orcheToday.length) msg += `オーシュ: ${orcheToday.map(d => d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')).join(', ')}`;

        await sendMessage(msg);
    });

    // 出現5分前通知
    [...schedules.coimbra, ...schedules.orche].forEach(time => {
        const notifyTime = new Date(time.getTime() - 5 * 60000);
        schedule.scheduleJob(notifyTime, async () => {
            const loc = schedules.coimbra.includes(time) ? 'コインブラ' : 'オーシュ';
            await sendMessage(`${loc} FB出現 5分前のお知らせです。`);
        });
    });

    console.log('通知スケジュール完了');
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    scheduleNotifications();
});

client.login(process.env.DISCORD_TOKEN);
