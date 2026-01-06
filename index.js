const { Client, GatewayIntentBits } = require('discord.js');

// ===== 設定 =====
client.login(process.env.DISCORD_TOKEN);
const CHANNEL_ID = '1458098844343603373';

// 起点：水曜 04:00（JST）
const BASE_TIME = new Date('2024-01-03T04:00:00+09:00');

// FB設定
const FB_LIST = [
  { name: 'コインブラ', interval: 10 },
  { name: 'オーシュ', interval: 21 }
];
// =================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 次回以降の出現時刻をn個取得
function getTimesInDay(base, interval, dayStart, dayEnd) {
  let times = [];
  let t = new Date(base);

  while (t < dayStart) {
    t.setHours(t.getHours() + interval);
  }

  while (t <= dayEnd) {
    times.push(new Date(t));
    t.setHours(t.getHours() + interval);
  }

  return times;
}

// フォーマット
const timeFmt = d =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

let notified = {};
let midnightSent = '';

client.once('ready', () => {
  console.log('Bot起動完了');

  setInterval(async () => {
    const now = new Date();
    const channel = await client.channels.fetch(CHANNEL_ID);

    // ===== 5分前通知 =====
    FB_LIST.forEach(async fb => {
      let t = new Date(BASE_TIME);
      while (t <= now) t.setHours(t.getHours() + fb.interval);

      const diffMin = Math.floor((t - now) / 60000);
      const key = fb.name + t.toISOString();

      if (diffMin === 5 && !notified[key]) {
        await channel.send(
          `🔔 **${fb.name}FB出現**\n5分前のお知らせです。`
        );
        notified[key] = true;
      }
    });

    // ===== 0時通知（当日分すべて） =====
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (now.getHours() === 0 && now.getMinutes() === 0 && midnightSent !== todayKey) {

      const dayStart = new Date(now);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(now);
      dayEnd.setHours(23,59,59,999);

      let msg = `📢 **本日のFB予定（${dayStart.getMonth()+1}/${dayStart.getDate()}）**\n\n`;

      FB_LIST.forEach(fb => {
        const times = getTimesInDay(BASE_TIME, fb.interval, dayStart, dayEnd);
        msg += `【${fb.name}】\n`;
        if (times.length === 0) {
          msg += `・出現なし\n\n`;
        } else {
          times.forEach(t => {
            msg += `・${timeFmt(t)}\n`;
          });
          msg += '\n';
        }
      });

      await channel.send(msg);
      midnightSent = todayKey;
    }

  }, 60 * 1000);
});

client.login(TOKEN);
