// 農場小屋解鎖節奏模擬（1 小時／天的玩家）：小屋越多 → 育兒籃越多 → 體質寶寶越多。目標：每月新增體質寶寶 ≈ 6 隻，不要一下子暴增。
// 用法：node pettest/sim/farm_hut_sim.js [玩家數] [種子]
// 參數取自 design/pet_system_zh.md 4.1（每天 05:00 每間符合條件的小屋擲懷孕，上限 70%；一胎 1～3 隻）與 mutation_sim.js ①②（出生帶體質約 2.1%；一方有體質 12%、雙方 30% 遺傳）。
const N = +process.argv[2] || 3000; let seed = +process.argv[3] || 20261103;
const R = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
const BORN = 0.021, INH1 = 0.12, INH2 = 0.30, PREG = 0.55;   // 1 小時／天：多數小屋 ♡、默契沒衝滿，平均懷孕率取 55%（上限 70%）
// 收容所 2 間（一館 1～2、二館 +2 → 共 4 間時已在農場前），農場自己的 5 個小屋位按這個時程開：[開農場後第幾天, 條件說明]
const PLANS = {
  '一次全開（對照）': [0, 0, 0, 0, 0],
  '建議：0／7／21／42／70 天': [0, 7, 21, 42, 70],
  '太慢：0／30／60／90／120 天': [0, 30, 60, 90, 120],
};
const BASE_HUTS = 2;   // 收容所原本的小屋（1 小時／天的玩家，開農場時通常只蓋了 2 間）
for (const [name, plan] of Object.entries(PLANS)) {
  const month = Array(6).fill(0);
  for (let i = 0; i < N; i++) {
    let breeders = 0;   // 住在小屋裡、身上有體質的種畜數
    for (let d = 0; d < 180; d++) {
      const huts = BASE_HUTS + plan.filter(x => d >= x).length;
      for (let h = 0; h < huts; h++) {
        if (R() >= PREG) continue;
        const n = (r => r < .4 ? 1 : r < .8 ? 2 : 3)(R());
        const par = Math.min(2, Math.max(0, breeders - h * 2));   // 種畜優先放進前面的小屋
        const p = par === 2 ? INH2 : par === 1 ? INH1 : 0;
        for (let j = 0; j < n; j++) if (R() < BORN || R() < p) { month[Math.floor(d / 30)]++; if (breeders < huts * 2 && R() < .5) breeders++ }   // 一半的體質寶寶被留下來當種畜
      }
    }
  }
  console.log(`${name}：每月新增體質寶寶 ${month.map((v, k) => `第${k + 1}月 ${(v / N).toFixed(1)}`).join('｜')}`);
}
