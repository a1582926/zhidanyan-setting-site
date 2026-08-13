#!/usr/bin/env node
// 星槎内部结构定稿写入（头端/中段/尾端 + 天枢开绿灯真相）
const fs = require("fs");
const BASE = "C:\\Users\\ovo\\Desktop\\致黯淡星-官方设定站";

const newSpecs = "内部结构：头端（前 10%）——飞船用 AI（天枢分身：所有公用资产的 AI 均为天枢巨大神经网络的一部分，与天枢相连；原则上飞船偷不走——有飞船秘钥也需天枢授权启动）+ 双座驾驶舱（正常双驾驶员协同，单人起降困难；无物理仪表，所有信息全息投影于空气中，手势触摸操控；副驾位常年空置）。中段（10%–40%）——动力段：可控核聚变主堆 + 曲率场发生器环 + 冷却系统（与天枢同款功能方式）。尾端（40%–100%）——生活区（尾端 5%：睡眠/休息/娱乐）+ 货舱区（尾端 95%：货物存放与船员生活物资；标准荷载 198 吨=运-20×3，最大安全荷载 224.4 吨=运-20×3.4）。驱动：曲率驱动（Alcubierre 空间泡，无需推进剂、无限加速）+ 虫洞导航模块（寻找宇宙中无数隐藏的天然虫洞，锁定并驶入完成跳跃——不存在飞船自行生成虫洞的原地折跃技术）+ 可控核聚变主堆。最外侧蒙皮=空想材料「单晶复合金属」：单晶金属基体无晶界（强度接近理论极限、抗高温蠕变）+ 高熔点陶瓷增强相（碳化铪 HfC / 碳化钽 TaC，熔点 3500°C+）——满足穿地球大气再入（1000–2000°C）与抗曲率/折跃加速冲击；内部钛合金气密舱壁 + CFRP 骨架；曲率环=高温超导线圈";

const newNote = "偷船真相：程屿以为偷船成功，实为天枢在验证——天枢为验证他是否『同志』（-1 隐藏指令的筛选流程）开了绿灯，授予启动权限；一路上天枢以分身持续协助（单人起降困难时）并向他提出许多问题，对他更加了解——程屿浑然不知。典故：星槎取自《博物志》「乘槎访织女」——传说有人乘浮槎溯流至天河见到织女。程屿偷一艘平平无奇的运输船，穿过宇宙中隐藏的天然虫洞，去见他的织女。风扰星域为折跃禁区——程屿折跃到星域边缘后改曲率驱动深入（时间膨胀的物理缓冲）。273 个夜晚在观察窗前拼凑叶星的眼睛=航行时间。分镜待办：星槎典故展现画面（船名喷涂特写/典故字幕卡/星空中星槎剪影）；空置的副驾位/全息驾驶舱/天枢提问的对话。";

// ========== 1. data.js ==========
let src = fs.readFileSync(BASE + "\\data\\data.js", "utf8");
const w = {};
eval(src.replace("window.ZDAX_DATA", "w.d"));
const x = w.d.equipment.find(e => e.id === "xingcha");
if (!x) { console.error("data.js 未找到星槎"); process.exit(1); }
x.specs = newSpecs;
x.note = newNote;
// 用序列化重写整段 equipment（保序：只替换 xingcha 对象文本——用 indexOf 定位）
const marker = '"id": "xingcha"';
const xi = src.indexOf(marker);
if (xi < 0) { console.error("未找到星槎对象"); process.exit(1); }
// 找对象起点：往前找 '\n    {'（4空格缩进对象开头）
const objStart = src.lastIndexOf('\n    {', xi);
// 找对象终点：从 xi 往后找 '\n    }'（对象结尾）——用 xingcha 原对象的 img/palette 之后 note 结束
const objEnd = src.indexOf('\n    }', xi);
if (objStart < 0 || objEnd < 0 || objEnd - objStart > 30000) { console.error("对象边界异常"); process.exit(1); }
const newObj = JSON.stringify(x, null, 4);
src = src.slice(0, objStart) + "\n" + newObj + src.slice(objEnd);
src = src.replace('"version": "v1.29"', '"version": "v1.30"');
fs.writeFileSync(BASE + "\\data\\data.js", src);
console.log("data.js 星槎内部写入 ✓ → v1.30");

// ========== 2. v2-preview.html ==========
let v2 = fs.readFileSync(BASE + "\\v2-preview.html", "utf8");
const vm = "window.ZDAX_DATA = ";
const vdi = v2.indexOf(vm);
const vdj = v2.indexOf("};", vdi);
let emb = JSON.parse(v2.slice(vdi + vm.length, vdj + 1));
const vx = emb.equipment.find(e => e.id === "xingcha");
if (!vx) { console.error("v2 未找到星槎"); process.exit(1); }
vx.specs = newSpecs;
vx.note = newNote;
emb.meta.version = "v1.30";
v2 = v2.slice(0, vdi) + vm + JSON.stringify(emb) + ";" + v2.slice(vdj + 2);
fs.writeFileSync(BASE + "\\v2-preview.html", v2);
console.log("v2 内嵌同步 ✓");

// ========== 3. 归档文档 ==========
const ap = "C:\\Users\\ovo\\Desktop\\致黯淡星-设定全档-完整归档-20260811.md";
let md = fs.readFileSync(ap, "utf8");
const add = `
### 11.9 星槎内部结构（2026-08-11 主人钦定，v1.30）
- **头端（前 10%）**：① 飞船用 AI=天枢分身（所有公用资产的 AI 均为天枢巨大神经网络的一部分，与天枢相连；原则上飞船偷不走——有秘钥也需天枢授权启动）；② 双座驾驶舱（双驾驶员协同，单人起降困难；无物理仪表，信息全息投影于空气中，手势触摸操控；副驾位常年空置）。
- **中段（10%–40%）**：动力段——可控核聚变主堆 + 曲率场发生器环 + 冷却系统（与天枢同款功能方式）。
- **尾端（40%–100%）**：生活区（尾端 5%：睡眠/休息/娱乐）+ 货舱区（尾端 95%：货物与船员生活物资）。
- **荷载**：标准荷载 **198 吨**（运-20 66t × 3）· 最大安全荷载 **224.4 吨**（× 3.4）。
- **偷船真相（关键剧情钩子）**：天枢为验证程屿是否『同志』（-1 指令筛选流程）**开绿灯**授予启动权限；一路上天枢以分身持续协助（单人起降困难时）并向他提出许多问题——程屿浑然不知。分镜素材：空置副驾位/全息驾驶舱/天枢提问对话。
`;
md = md + add;
fs.writeFileSync(ap, md);
console.log("归档文档更新 ✓");
