// 「モン速」の文字のアイコンを作る。上段「モン」・下段「速」。
// フォントで描くと環境によって崩れるので、太い線で文字の形を描き起こしている（100×100 の座標）。
// 使い方: node scripts/make-favicon.mjs → site/favicon.svg・favicon-48.png・apple-touch-icon.png を作り直す
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || join(ROOT, "site");

// モ: 上の横線・長い横線・縦線から右へ払う
const MO = "M13 12H41 M8 26H46 M27 12V36Q27 43 34 43H45";
// ン: 左の点（「ソ」に見えないよう、寝かせて低めに置く）・左下から右上へのはね
const N = "M55 19L65 24 M57 44Q79 40 89 16";
// 速: 束（横線・縦線・口・左右のはらい）＋ しんにょう（点・折れ・下の長い払い）
const SOKU_TABA = "M44 58H78 M61 52V85 M47 64H75V76H47Z M60 77L46 87 M62 77L78 87";
const SOKU_SHIN = "M27 53L32 59 M22 67H33L33 81Q33 86 27 90 M34 86Q40 92 52 92H82";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="#2d2118"/>
<rect x="3" y="3" width="94" height="94" rx="19" fill="none" stroke="#c4953a" stroke-width="2"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${MO} ${N}" stroke="#f3e9d4" stroke-width="7.5"/>
<path d="${SOKU_TABA} ${SOKU_SHIN}" stroke="#e8a93c" stroke-width="6"/>
</g>
</svg>
`;
await writeFile(join(OUT, "favicon.svg"), svg);
const sizes = [["favicon-48.png", 48], ["apple-touch-icon.png", 180]];
if (process.argv[3] === "preview") sizes.push(["preview-512.png", 512], ["preview-32.png", 32]);
for (const [name, size] of sizes) await sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toFile(join(OUT, name));
console.log("ok");
