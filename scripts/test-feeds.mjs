// 収集元の候補が生きているか、モンハン関連の記事がどれだけ取れるかを確かめる開発用スクリプト。
// 使い方: node scripts/test-feeds.mjs
import { fetchText } from "./lib/util.mjs";
import { parseFeed, decodeEntities } from "./lib/xml.mjs";

const CANDIDATES = [
  ["4Gamer", "https://www.4gamer.net/rss/index.xml"],
  ["Game*Spark", "https://www.gamespark.jp/rss20/index.rdf"],
  ["インサイド", "https://www.inside-games.jp/rss20/index.rdf"],
  ["電ファミニコゲーマー", "https://news.denfaminicogamer.jp/feed"],
  ["AUTOMATON", "https://automaton-media.com/feed/"],
  ["GAME Watch", "https://game.watch.impress.co.jp/data/rss/1.0/gmw/feed.rdf"],
  ["IGN Japan", "https://jp.ign.com/feed.xml"],
  ["ファミ通", "https://www.famitsu.com/rss/famitsu_all.rdf"],
  ["電撃オンライン", "https://dengekionline.com/feed/"],
  ["ゲームビズ", "https://gamebiz.jp/feed"],
  ["Gamer", "https://www.gamer.ne.jp/rss/news.rdf"],
  ["4Gamer PC", "https://www.4gamer.net/rss/pc/index.xml"],
];

const MH = /モンスターハンター|モンハン|Monster Hunter|MHWilds|ワイルズ|サンブレイク|アイスボーン|ライズ|MHNow/i;

for (const [name, url] of CANDIDATES) {
  try {
    const xml = await fetchText(url, { timeoutMs: 20000 });
    const entries = parseFeed(xml);
    const hit = entries.filter((e) => MH.test(decodeEntities(e.title || "")));
    console.log(`OK   ${name.padEnd(22)} ${String(entries.length).padStart(3)} 件 / モンハン ${hit.length} 件  ${hit[0] ? decodeEntities(hit[0].title).slice(0, 40) : ""}`);
  } catch (e) {
    console.log(`NG   ${name.padEnd(22)} ${e.message}`);
  }
}

// Steam のニュース（公式発表が流れる）
const STEAM = [
  ["MH Wilds", 2246340],
  ["MH Rise", 1446780],
  ["MH World", 582010],
];
for (const [name, appid] of STEAM) {
  try {
    const j = JSON.parse(
      await fetchText(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=5&maxlength=1&l=japanese`, { timeoutMs: 20000 })
    );
    const items = j.appnews?.newsitems || [];
    console.log(`OK   Steam ${name.padEnd(16)} ${items.length} 件  ${items[0] ? items[0].title.slice(0, 40) : ""}`);
  } catch (e) {
    console.log(`NG   Steam ${name.padEnd(16)} ${e.message}`);
  }
}

// Google ニュースの検索フィード（本命）
for (const q of ["モンスターハンター", "モンハン", "モンスターハンターワイルズ"]) {
  try {
    const xml = await fetchText(`https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:3d")}&hl=ja&gl=JP&ceid=JP:ja`, { timeoutMs: 20000 });
    const n = (xml.match(/<item>/g) || []).length;
    console.log(`OK   Google「${q}」 ${n} 件`);
  } catch (e) {
    console.log(`NG   Google「${q}」 ${e.message}`);
  }
}
