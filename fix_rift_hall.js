#!/usr/bin/env node
// 修复：把 rift_hall 从顶层错误位置移到 buildings 数组内（institute 之后）
const fs = require("fs");
const path = "data/data.js";
let src = fs.readFileSync(path, "utf8");

// 1. 删除顶层错误插入的对象（从 tianshu 结束后的 "{  "id": "rift_hall"" 到 "},\n  "equipment": ["）
const badStart = src.indexOf('{\n  "id": "rift_hall"');
if (badStart < 0) { console.error("未找到错误插入点"); process.exit(1); }
const badEnd = src.indexOf('  "equipment": [', badStart);
if (badEnd < 0) { console.error("未找到 equipment 锚点"); process.exit(1); }
// badEnd 指向 '  "equipment": ['，badStart 指向 '{'——删除 [badStart, badEnd) 段
src = src.slice(0, badStart) + src.slice(badEnd);
console.log("已删除顶层错误对象");

// 2. 在 buildings 数组内 institute 之后插入（找 institute 的 note 结束 + "    }," + 数组尾）
// buildings 数组：institute 是唯一成员，找 institute note 的结尾（"双气闸细节..."）——用 size/levels 前的锚点不可靠，
// 改为：找 buildings 数组的 "  ],"（buildings 结束）——在它之前插入
// 但 "  ]," 会出现多次（planets 等数组结尾）。用 buildings 段内定位：从 buildings 起点找第一个 "\n  ],"
const bStart = src.indexOf('"buildings": [');
if (bStart < 0) { console.error("未找到 buildings"); process.exit(1); }
const arrEnd = src.indexOf('\n  ],', bStart);
if (arrEnd < 0) { console.error("未找到 buildings 数组结尾"); process.exit(1); }

const rift = {
  id: "rift_hall",
  name: "量子裂隙发生器大厅",
  name_en: "Quantum Rift Generator Hall (QRGH)",
  location: "荧惑星分站 B1 地下最深处 · 独立密封舱室（与主楼隔离）",
  material: "风化层混凝土（同主楼，C200+316L 不锈钢纤维）+ 对撞环金属构件（钛合金 / 超导磁体 / 液氦冷却管路）",
  appearance: "环形粒子对撞隧道（直径约 60 m，超导磁体+液氦管路密布）→ 对撞聚焦于中央裂隙生成腔（竖立椭圆张开的空间）；走廊与穹顶的条状红色警示灯明暗交替——像监狱的铁栏，也像通往另一个世界的门",
  signs: "入口红色警示：「高能区域 · 非授权禁止入内」+ 电离辐射标志；裂隙腔周边「保持距离」警示线",
  size: "对撞环直径约 60 m · 中央裂隙腔挑高（裂隙竖立椭圆张开的空间）· 冷却管路密布如血管",
  levels: "位于 B1 地下独立舱室（不与主楼其他区域直通，需经过安全气闸）",
  energy: "EAST 主堆专线供电（对撞瞬时功率巨大，独立于生活母线；也不占用天枢的 FRC 专线——三路能源各自独立）",
  function: "高能粒子对撞在局部区域制造时空裂隙——理论用途：跨维度信息传输。2267 年启动，2277 年仍在验证阶段；从未做过人体实验——直到程屿",
  img: "",
  palette: ["#c0392b", "#8e2418", "#e8c56a"],
  note: "全剧关键场景：序章（红灯条纹+天枢干预模式）与第四章（程屿跃入）。启动时混凝土墙出现发丝般裂纹并发光——不是物理冲击，是时空曲率改变导致的物质结构局部应力异常；空气电离（臭氧味），头发竖起。裂隙=竖立的金色椭圆，光像水像火像熔化的黄金，声音是低沉回响像宇宙的呼吸。程屿跃入=人类首次穿越。裂隙出口精准命中『当下』的时间坐标锁定机制尚未交代（待设计）。与天枢脊柱同处 B1 但相互独立。"
};

// institute 结束是 "    }"（4空格缩进，数组内条目），arrEnd 前最后一个 "    }" 是 institute 的结尾
const lastClose = src.lastIndexOf('\n    }', arrEnd);
if (lastClose < 0) { console.error("未找到 institute 结尾"); process.exit(1); }
// 在 institute 的 "}" 后插入 ",\n" + rift（JSON.stringify 用 4 空格缩进对齐）
const riftStr = JSON.stringify(rift, null, 4);
src = src.slice(0, lastClose + 1) + ",\n" + riftStr + src.slice(lastClose + 1);

fs.writeFileSync(path, src);
console.log("裂隙大厅已移入 buildings 数组 ✓");
