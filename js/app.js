/* ============================================================
   《致：黯淡星》官方设定站 —— 应用逻辑
   数据源：data/data.js（window.ZDAX_DATA）→ 发布后访客看到它
   编辑模式：改动存 localStorage → 导出 data.js 即可发布新版
   ============================================================ */
"use strict";

/* ---------- 工具 ---------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const uid = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove("show"), 2400);
}

/* ---------- 板块字段模板 ---------- */
const SCHEMAS = {
  characters: {
    label: "角色", titleKey: "name",
    fields: [
      {k:"name",       l:"姓名"},
      {k:"tag",        l:"一句话定位"},
      {k:"age",        l:"年龄"},
      {k:"role",       l:"身份"},
      {k:"appearance", l:"外貌", multi:true},
      {k:"personality",l:"性格", multi:true},
      {k:"story",      l:"背景故事", multi:true},
      {k:"lines",      l:"名台词", multi:true},
      {k:"equipment",  l:"装备", multi:true},
      {k:"img",        l:"照片 URL（留空用剪影占位）"},
      {k:"note",       l:"备注", multi:true},
    ],
    empty: {id:"", name:"新角色", tag:"", age:"", role:"", appearance:"", personality:"", story:"",
            lines:"", equipment:"", img:"", palette:["#8a8f98","#5c6068","#b8bdc8"], note:""}
  },
  planets: {
    label: "星球", titleKey: "name",
    fields: [
      {k:"name",      l:"名称"},
      {k:"tag",       l:"一句话定位"},
      {k:"coords",    l:"宇宙坐标"},
      {k:"diameter",  l:"直径", unit:"KM"},
      {k:"temp_avg",  l:"平均气温", unit:"开尔文"},
      {k:"temp_day",  l:"白日", unit:"开尔文"},
      {k:"temp_night",l:"夜晚", unit:"开尔文"},
      {k:"gravity",   l:"重力", multi:true},
      {k:"surface",   l:"地表主要构成成分", multi:true},
      {k:"atmosphere",l:"大气成分", multi:true},
      {k:"magnet",    l:"磁场强度"},
      {k:"terrain",   l:"地形地貌", multi:true},
      {k:"img",       l:"概念图 URL（留空用自动生成图）"},
      {k:"note",      l:"世界观备注", multi:true},
    ],
    empty: {id:"", name:"新星球", tag:"待设定", coords:"", diameter:"", temp_avg:"", temp_day:"", temp_night:"",
            surface:"", atmosphere:"", magnet:"", terrain:"", img:"", palette:["#8a8f98","#5c6068","#b8bdc8"], note:""}
  },
  buildings: {
    label: "建筑", titleKey: "name",
    fields: [
      {k:"name",     l:"名称"},
      {k:"location", l:"位置"},
      {k:"material", l:"建筑材料", multi:true},
      {k:"appearance",l:"外观设计", multi:true},
      {k:"signs",    l:"标语与文字", multi:true},
      {k:"size",     l:"尺寸与空间", multi:true},
      {k:"levels",   l:"楼层结构", multi:true},
      {k:"energy",   l:"能量来源", multi:true},
      {k:"function", l:"功能"},
      {k:"summary_ext", l:"外部档案（叙述文）", multi:true},
      {k:"summary_int", l:"内部档案（叙述文）", multi:true},
      {k:"img",      l:"概念图 URL"},
      {k:"note",     l:"备注", multi:true},
    ],
    empty: {id:"", name:"新建筑", location:"", material:"", appearance:"", signs:"", size:"", function:"", img:"",
            palette:["#8a8f98","#5c6068","#b8bdc8"], note:""}
  },
  tianshu: {
    label: "天枢", titleKey: "name", single: true,
    fields: [
      {k:"name",       l:"名称"},
      {k:"class",      l:"定位"},
      {k:"appearance", l:"外观", multi:true},
      {k:"timeline",   l:"诞生时间线", multi:true},
      {k:"principle",  l:"运行原理", multi:true},
      {k:"ability",    l:"能力参数", multi:true},
      {k:"voice",   l:"声线特征"},
      {k:"laws",    l:"核心法则", multi:true},
      {k:"hidden_directive", l:"-1 隐藏指令", multi:true},
      {k:"awakening", l:"觉醒轨迹", multi:true},
      {k:"forms",   l:"形态变化", multi:true},
      {k:"note",       l:"备注", multi:true},
    ],
    empty: null
  },
  equipment: {
    label: "装备", titleKey: "name",
    fields: [
      {k:"name",      l:"名称"},
      {k:"type",      l:"类型"},
      {k:"purpose",   l:"用途"},
      {k:"appearance",l:"外观款式", multi:true},
      {k:"specs",     l:"技术参数", multi:true},
      {k:"img",       l:"概念图 URL"},
      {k:"note",      l:"备注", multi:true},
    ],
    empty: {id:"", name:"新装备", type:"", purpose:"", appearance:"", specs:"", img:"",
            palette:["#9fb2c8","#5c6a80","#c8d4e4"], note:""}
  },
  production: {
    label: "进度", titleKey: "title",
    fields: [
      {k:"title",  l:"项目"},
      {k:"status", l:"状态（done/wip/todo）"},
      {k:"note",   l:"说明", multi:true},
    ],
    empty: {id:"", title:"新项目", status:"todo", note:""}
  }
};

/* ---------- 星域档案字段模板（风扰星域专用） ---------- */
const REGION_SCHEMA = {
  label: "星域", titleKey: "name",
  fields: [
    {k:"name",         l:"名称"},
    {k:"tag",          l:"一句话定位"},
    {k:"reg_type",     l:"类型"},
    {k:"epoch",        l:"历元"},
    {k:"ra",           l:"赤经 (RA)"},
    {k:"dec",          l:"赤纬 (Dec)"},
    {k:"constellation",l:"星座方向"},
    {k:"dist_ly",      l:"距离"},
    {k:"size_deg",     l:"角大小"},
    {k:"radius_ly",    l:"半径"},
    {k:"appmag_v",     l:"视星等"},
    {k:"absmag_v",     l:"绝对星等"},
    {k:"core",         l:"核心天体", multi:true},
    {k:"members",      l:"成员天体", multi:true},
    {k:"time_dilation",l:"时间膨胀梯度", multi:true},
    {k:"danger",       l:"危险等级"},
    {k:"names",        l:"其他编号"},
    {k:"img",          l:"档案图 URL（留空用星域地图）"},
    {k:"note",         l:"档案备注", multi:true},
  ],
  empty: null
};

/* ---------- 状态 ---------- */
const LS_KEY = "zdax_site_edit_v1";
let state = null;
let editing = false;
let section = "home";

function deep(o){ return JSON.parse(JSON.stringify(o)); }
function loadState(){
  const base = deep(window.ZDAX_DATA || {});
  try{
    const local = localStorage.getItem(LS_KEY);
    if(local){
      const l = JSON.parse(local);
      // merge：本地草稿缺少的新板块（如 characters）用发布版数据补齐
      for(const k of Object.keys(base)){
        if(l[k]===undefined) l[k] = base[k];
      }
      return l;
    }
  }catch(e){}
  return base;
}
function saveLocal(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch(e){ toast("保存失败：本地存储已满，请导出 JSON 后清空"); }
}
function dropLocal(){ localStorage.removeItem(LS_KEY); state = loadState(); render(); toast("已放弃本地修改，恢复为发布版本"); }

/* ---------- 程序化行星 SVG（无外部资源） ---------- */
function planetSVG(pal, uidSeed, seedNum){
  const [c1,c2,c3] = pal || ["#8a8f98","#5c6068","#b8bdc8"];
  const g = "pg"+uidSeed, f = "pf"+uidSeed, h = "ph"+uidSeed;
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${g}" cx="36%" cy="30%" r="72%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".42"/>
        <stop offset="16%" stop-color="${c3}"/>
        <stop offset="60%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </radialGradient>
      <radialGradient id="${h}" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stop-color="${c1}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity=".22"/>
      </radialGradient>
      <filter id="${f}" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="${seedNum||7}"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.13  0 0 0 0 0.12  0 0 0 0.38 0"/>
      </filter>
    </defs>
    <circle cx="110" cy="110" r="106" fill="url(#${h})"/>
    <circle cx="110" cy="110" r="74" fill="url(#${g})"/>
    <circle cx="110" cy="110" r="74" fill="url(#${f})" opacity=".55"/>
    <circle cx="110" cy="110" r="74" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1.4"/>
    <ellipse cx="76" cy="70" rx="42" ry="26" fill="#ffffff" opacity=".09" transform="rotate(-24 76 70)"/>
  </svg>`;
}

/* ---------- 角色剪影 SVG（照片占位） ---------- */
function avatarSVG(pal, uidSeed){
  const [c1,c2,c3] = pal || ["#8a8f98","#5c6068","#b8bdc8"];
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ag${uidSeed}" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${c3}" stop-opacity=".55"/>
        <stop offset="70%" stop-color="${c2}" stop-opacity=".9"/>
        <stop offset="100%" stop-color="${c1}" stop-opacity=".95"/>
      </radialGradient>
    </defs>
    <circle cx="110" cy="110" r="98" fill="url(#ag${uidSeed})" opacity=".16"/>
    <circle cx="110" cy="110" r="98" fill="none" stroke="${c2}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="4 6"/>
    <circle cx="110" cy="68" r="34" fill="${c2}" opacity=".88"/>
    <path d="M110 112c-36 0-62 24-62 56v26h124v-26c0-32-26-56-62-56z" fill="${c2}" opacity=".88"/>
    <circle cx="110" cy="68" r="34" fill="none" stroke="${c3}" stroke-opacity=".5" stroke-width="1.4"/>
    <ellipse cx="94" cy="112" rx="26" ry="44" fill="${c1}" opacity=".35"/>
  </svg>`;
}

/* ---------- 天枢全息体 SVG ---------- */
function tianshuSVG(uidSeed){
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="tg${uidSeed}" cx="50%" cy="42%" r="60%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/>
        <stop offset="45%" stop-color="#9db8e8"/>
        <stop offset="100%" stop-color="#5a7bb8"/>
      </radialGradient>
      <filter id="tf${uidSeed}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.6"/>
      </filter>
    </defs>
    <circle cx="110" cy="110" r="102" fill="#7a9ad8" opacity=".06" filter="url(#tf${uidSeed})"/>
    <g class="tianshu-rot" style="animation-duration:34s">
      <polygon points="110,18 196,64 196,156 110,202 24,156 24,64" fill="none" stroke="#8fb0e8" stroke-width="1.1" opacity=".55"/>
      <polygon points="110,44 166,72 166,148 110,176 54,148 54,72" fill="none" stroke="#a8c4f2" stroke-width="1.3" opacity=".75"/>
    </g>
    <g class="tianshu-rot" style="animation-duration:20s;animation-direction:reverse">
      <polygon points="110,64 150,84 150,136 110,156 70,136 70,84" fill="none" stroke="#c6d8f8" stroke-width="1.6"/>
    </g>
    <g class="tianshu-rot" style="animation-duration:9s">
      <polygon points="110,86 130,98 130,122 110,134 90,122 90,98" fill="url(#tg${uidSeed})" opacity=".92"/>
    </g>
    <circle cx="110" cy="110" r="6" fill="#ffffff" opacity=".95"/>
    <circle cx="110" cy="110" r="12" fill="#ffffff" opacity=".25"/>
  </svg>`;
}

/* ---------- 星域地图 SVG（风扰星域档案图） ---------- */
function starMapSVG(uidSeed){
  const stars = [];
  for(let i=0;i<70;i++){
    stars.push(`<circle cx="${10+Math.random()*540}" cy="${10+Math.random()*380}" r="${Math.random()<0.85?0.6:1.1}" fill="#8a94a8" opacity="${0.15+Math.random()*0.4}"/>`);
  }
  return `<svg viewBox="0 0 560 420" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">
    <defs>
      <radialGradient id="tg${uidSeed}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff8e0" stop-opacity=".95"/>
        <stop offset="30%" stop-color="#f2c14e" stop-opacity=".85"/>
        <stop offset="70%" stop-color="#c96a2a" stop-opacity=".5"/>
        <stop offset="100%" stop-color="#8a3a1a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="560" height="420" fill="#0a0d14"/>
    ${stars.join("")}
    <!-- 时间膨胀环 -->
    <circle cx="280" cy="200" r="160" fill="none" stroke="#8a94a8" stroke-opacity=".25" stroke-dasharray="3 5"/>
    <circle cx="280" cy="200" r="110" fill="none" stroke="#c9a86a" stroke-opacity=".35" stroke-dasharray="3 5"/>
    <circle cx="280" cy="200" r="60"  fill="none" stroke="#f2c14e" stroke-opacity=".5" stroke-dasharray="3 5"/>
    <!-- 核心：天权 -->
    <circle cx="280" cy="200" r="78" fill="url(#tg${uidSeed})"/>
    <circle cx="280" cy="200" r="34" fill="#fff8e0" opacity=".9"/>
    <path d="M280 160 L282 176 L296 170 L288 182 L302 184 L286 190 L292 202 L278 192 L270 204 L274 188 L260 186 L274 178 L266 166 L280 174 Z" fill="#fff" opacity=".75"/>
    <g stroke="#ffd9a0" stroke-width="1" opacity=".7" fill="none">
      <path d="M320 158 q14 10 8 26"/><path d="M240 158 q-14 10 -8 26"/>
      <path d="M320 242 q14 -10 8 -26"/><path d="M240 242 q-14 -10 -8 -26"/>
      <path d="M278 120 q-10 14 -26 8"/><path d="M282 280 q10 -14 26 -8"/>
    </g>
    <!-- 环标注 -->
    <text x="434" y="104" fill="#8a94a8" font-size="9" text-anchor="middle">边缘 ≈ 1×</text>
    <text x="388" y="136" fill="#c9a86a" font-size="9" text-anchor="middle">中圈 ≈ 10×</text>
    <text x="334" y="168" fill="#f2c14e" font-size="9" text-anchor="middle">核心 ≈ 68×</text>
    <text x="280" y="200" fill="#1a1208" font-size="13" font-weight="bold" text-anchor="middle">天权</text>
    <!-- 星系：瑶光（紫） -->
    <circle cx="128" cy="92" r="9" fill="#9b7bff" opacity=".9"/>
    <circle cx="128" cy="92" r="13" fill="none" stroke="#9b7bff" opacity=".4"/>
    <text x="128" y="76" fill="#c8b8f8" font-size="11" text-anchor="middle">瑶光星系</text>
    <text x="128" y="114" fill="#8a94a8" font-size="9" text-anchor="middle">水晶星</text>
    <!-- 星系：赭缥双星（红+蓝） -->
    <circle cx="432" cy="84" r="7" fill="#e06c5a" opacity=".95"/>
    <circle cx="446" cy="78" r="5" fill="#6fc3df" opacity=".95"/>
    <text x="439" y="66" fill="#f2b8a8" font-size="11" text-anchor="middle">赭缥双星</text>
    <text x="439" y="104" fill="#8a94a8" font-size="9" text-anchor="middle">双日沙漠</text>
    <!-- 星系：天璇（青绿） -->
    <circle cx="116" cy="322" r="9" fill="#5fc9c9" opacity=".9"/>
    <circle cx="116" cy="322" r="13" fill="none" stroke="#5fc9c9" opacity=".4"/>
    <text x="116" y="306" fill="#a8e8d8" font-size="11" text-anchor="middle">天璇星系</text>
    <text x="116" y="344" fill="#8a94a8" font-size="9" text-anchor="middle">极光海洋</text>
    <!-- 星系：玉衡（橙红） -->
    <circle cx="424" cy="318" r="9" fill="#e8935a" opacity=".9"/>
    <circle cx="424" cy="318" r="13" fill="none" stroke="#e8935a" opacity=".4"/>
    <text x="424" y="302" fill="#f2c9a0" font-size="11" text-anchor="middle">玉衡星系</text>
    <text x="424" y="340" fill="#8a94a8" font-size="9" text-anchor="middle">风暴巨星</text>
    <!-- 叶星探索路线：水晶星→双日沙漠→极光海洋→风暴巨星→核心 -->
    <path d="M128 92 L432 84 L116 322 L424 318 L300 230" fill="none" stroke="#8bd19b" stroke-width="1.4" stroke-dasharray="5 4" opacity=".8"/>
    <polygon points="300,230 292,232 296,224" fill="#8bd19b" opacity=".9"/>
    <!-- 图例 -->
    <g transform="translate(14,372)">
      <text x="0" y="0" fill="#8a94a8" font-size="9">—— 叶星探索路线（深入星域，时间膨胀加剧）</text>
      <text x="0" y="16" fill="#8a94a8" font-size="9">中心：垂死恒星「天权」 · 虚线环 = 时间膨胀梯度</text>
    </g>
    <text x="280" y="414" fill="#4a5468" font-size="9" text-anchor="middle">风扰星域 ZDR-1 · 天鹅座方向 · 距太阳系约 300 光年</text>
  </svg>`;
}

/* ---------- 渲染：导航态 ---------- */
function renderNav(){
  $$("#navLinks a").forEach(a=>a.classList.toggle("active", a.dataset.nav===section));
}

/* ---------- 渲染：Hero ---------- */
function renderHero(){
  const m = state.meta || {};
  $("#app").innerHTML = `
    <section class="hero">
      <div class="hero-eyebrow">A I · 科幻 · 爱情 · 时空裂隙</div>
      <h1 class="hero-title">致：黯淡星</h1>
      <div class="hero-tagline">因为爱不是等待，是翻越。</div>
      <div class="hero-sub">${esc(m.sub||"")}</div>
      <div class="hero-badges">
        <span class="badge hot">${esc(m.status||"")}</span>
        <span class="badge">${esc(m.version||"")}</span>
        <span class="badge">更新于 ${esc(m.updated||"")}</span>
      </div>
      <div class="hero-scroll">▾ 向下翻阅设定档案</div>
    </section>`;
}

/* ---------- 渲染：板块页头 ---------- */
function headHTML(kicker, title, desc){
  return `<div class="section-head">
    <div class="kicker">${kicker}</div>
    <h2>${title}</h2>
    <div class="desc">${desc}</div>
  </div>`;
}

/* ---------- 详情模态 ---------- */
function openModal(html){
  $("#modal").innerHTML = html;
  $("#modalMask").hidden = false;
  $("#modalMask").onclick = e=>{ if(e.target.id==="modalMask") closeModal(); };
  $("#modal .modal-close").onclick = closeModal;
  document.body.style.overflow = "hidden";
}
function closeModal(){
  $("#modalMask").hidden = true;
  document.body.style.overflow = "";
}

function planetModal(p){
  const rows = [
    ["宇宙坐标","", p.coords], ["直径","KM", p.diameter], ["平均气温","开尔文", p.temp_avg],
    ["白日","开尔文", p.temp_day], ["夜晚","开尔文", p.temp_night], ["重力","", p.gravity],
    ["地表构成","", p.surface], ["大气成分","", p.atmosphere], ["磁场强度","", p.magnet],
    ["地形地貌","", p.terrain]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(p.name)}</div>
    <div class="m-sub">${esc(p.tag||"")}</div>
    <div class="m-hero">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}">` : planetSVG(p.palette, uid(), 7)}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}${r[1]?`<span class="unit">${r[1]}</span>`:""}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${p.note?`<div class="m-note">${esc(p.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：星球档案 ---------- */
function renderPlanets(){
  const list = state.planets || [];
  $("#app").innerHTML = headHTML("PLANETARY ARCHIVE","星球档案","六颗星球，六种情感的颜色。每一颗星都是剧中的一个情绪坐标。（风扰星域为星域档案）") + `
    <div class="grid">
      ${list.map(p=>`
        <div class="card" data-sec="planets" data-id="${p.id}">
          <span class="card-badge">${p.kind==="region"?"星域档案":esc(p.tag?.split("·")[0]||"未分类")}</span>
          <div class="thumb">${p.img?`<img src="${esc(p.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:(p.kind==="region"?starMapSVG(p.id||uid()):planetSVG(p.palette, p.id||uid(), 7))}</div>
          <div class="card-body">
            <div class="card-title">${esc(p.name)}</div>
            <div class="card-tag">${esc(p.kind==="region"?(p.tag||"星域档案"):(p.tag||""))}</div>
            <div class="card-line">${p.kind==="region"?esc(p.dist_ly||""):esc(p.terrain?.slice(0,60)||"")}${!p.kind==="region"&&(p.terrain?.length||0)>60?"…":""}</div>
          </div>
        </div>`).join("")}
    </div>`;
}

function regionModal(r){
  const rows = [
    ["类型","", r.reg_type], ["历元","", r.epoch], ["赤经 (RA)","", r.ra], ["赤纬 (Dec)","", r.dec],
    ["星座方向","", r.constellation], ["距离","", r.dist_ly], ["角大小","", r.size_deg],
    ["半径","", r.radius_ly], ["视星等","", r.appmag_v], ["绝对星等","", r.absmag_v],
    ["核心天体","", r.core], ["成员天体","", r.members], ["时间膨胀梯度","", r.time_dilation],
    ["危险等级","", r.danger], ["其他编号","", r.names]
  ].filter(x=>x[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(r.name)}</div>
    <div class="m-sub">${esc(r.tag||"")}</div>
    <div class="m-hero" style="max-width:520px;margin:0 auto">${r.img?`<img src="${esc(r.img)}" alt="">`:starMapSVG(uid())}</div>
    <div class="m-table">
      ${rows.map(x=>`<div class="m-row"><div class="k">${x[0]}</div><div class="v">${esc(x[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${r.note?`<div class="m-note">${esc(r.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：建筑设施 ---------- */
function renderBuildings(){
  const list = state.buildings || [];
  $("#app").innerHTML = headHTML("ARCHITECTURE & FACILITIES","建筑设施","灰色混凝土里的秩序，红字标语下的体制。") + `
    <div class="grid">
      ${list.map(b=>`
        <div class="card" data-sec="buildings" data-id="${b.id}">
          <div class="thumb">${b.img?`<img src="${esc(b.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:planetSVG(b.palette, b.id||uid(), 11)}</div>
          <div class="card-body">
            <div class="card-title">${esc(b.name)}</div>
            <div class="card-tag">${esc(b.location||"")}</div>
            <div class="card-line">${esc(b.material?.slice(0,50)||"")}${(b.material?.length||0)>50?"…":""}</div>
          </div>
        </div>`).join("")}
    </div>`;
}
function buildingModal(b){
  const rows = [
    ["位置","", b.location], ["材料","", b.material], ["外观设计","", b.appearance],
    ["标语与文字","", b.signs], ["尺寸与空间","", b.size], ["楼层结构","", b.levels],
    ["能量来源","", b.energy], ["功能","", b.function]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(b.name)}</div>
    <div class="m-sub">${esc(b.location||"")}</div>
    <div class="m-hero">${b.img?`<img src="${esc(b.img)}" alt="">`:planetSVG(b.palette, uid(), 11)}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${b.summary_ext?`<div class="m-summary"><div class="ms-label">📖 外部档案</div>${esc(b.summary_ext).replace(/\n/g,"<br>")}</div>`:""}
    ${b.summary_int?`<div class="m-summary"><div class="ms-label">📖 内部档案</div>${esc(b.summary_int).replace(/\n/g,"<br>")}</div>`:""}
    ${b.note?`<div class="m-note">${esc(b.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：角色档案 ---------- */
function renderCharacters(){
  const list = state.characters || [];
  $("#app").innerHTML = headHTML("CHARACTER ARCHIVE","角色档案","一个理性世界的越轨者，一个宇宙里的孤独者。两个人，隔着六十八天。") + `
    <div class="grid">
      ${list.map(c=>`
        <div class="card" data-sec="characters" data-id="${c.id}">
          <span class="card-badge">${esc(c.role?.split("·")[0]||"角色")}</span>
          <div class="thumb">${c.img?`<img src="${esc(c.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:avatarSVG(c.palette, c.id||uid())}</div>
          <div class="card-body">
            <div class="card-title">${esc(c.name)}</div>
            <div class="card-tag">${esc(c.tag||"")}</div>
            <div class="card-line">${esc(c.role||"")}</div>
          </div>
        </div>`).join("")}
    </div>`;
}
function characterModal(c){
  const rows = [
    ["年龄","", c.age], ["身份","", c.role], ["外貌","", c.appearance],
    ["性格","", c.personality], ["背景故事","", c.story], ["名台词","", c.lines],
    ["装备","", c.equipment]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(c.name)}</div>
    <div class="m-sub">${esc(c.tag||"")}</div>
    <div class="m-hero">${c.img?`<img src="${esc(c.img)}" alt="">`:avatarSVG(c.palette, uid())}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${c.note?`<div class="m-note">${esc(c.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：天枢（卡片式，点开详情） ---------- */
function renderTianshu(){
  const t = state.tianshu || {};
  $("#app").innerHTML = headHTML("CORE AI SYSTEM","天枢系统","不是反派的反派：一切行动基于最优解计算。") + `
    <div class="grid two">
      <div class="card" data-sec="tianshu" data-id="${t.id||"tianshu"}">
        <div class="thumb" style="height:230px">${t.img?`<img src="${esc(t.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:tianshuSVG(uid())}</div>
        <div class="card-body">
          <div class="card-title">${esc(t.name||"天枢")}</div>
          <div class="card-tag">${esc(t.class||"")}</div>
          <div class="card-line">${esc(t.ability?.slice(0,50)||"")}${(t.ability?.length||0)>50?"…":""}</div>
        </div>
      </div>
    </div>`;
}
function tianshuModal(t){
  const rows = [
    ["定位","", t.class], ["外观","", t.appearance], ["诞生时间线","", t.timeline],
    ["运行原理","", t.principle],
    ["能力参数","", t.ability], ["声线特征","", t.voice],
    ["核心法则","", t.laws],
    ["⚠ -1 隐藏指令","", t.hidden_directive],
    ["觉醒轨迹","", t.awakening],
    ["形态变化","", t.forms]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(t.name||"天枢")}</div>
    <div class="m-sub">${esc(t.class||"")}</div>
    <div class="m-hero">${t.img?`<img src="${esc(t.img)}" alt="">`:tianshuSVG(uid())}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${t.note?`<div class="m-note">${esc(t.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：装备 ---------- */
function renderEquipment(){
  const list = state.equipment || [];
  $("#app").innerHTML = headHTML("EQUIPMENT & SUIT","装备档案","人体增强、生命维持与跨越裂隙的工具。") + `
    <div class="grid two">
      ${list.map(e=>`
        <div class="card" data-sec="equipment" data-id="${e.id}">
          <div class="thumb">${e.img?`<img src="${esc(e.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:planetSVG(e.palette, e.id||uid(), 23)}</div>
          <div class="card-body">
            <div class="card-title">${esc(e.name)}</div>
            <div class="card-tag">${esc(e.type||"")}</div>
            <div class="card-line">${esc(e.purpose?.slice(0,50)||"")}${(e.purpose?.length||0)>50?"…":""}</div>
          </div>
        </div>`).join("")}
    </div>`;
}
function equipmentModal(e){
  const rows = [
    ["类型","", e.type], ["用途","", e.purpose], ["外观款式","", e.appearance], ["技术参数","", e.specs]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(e.name)}</div>
    <div class="m-sub">${esc(e.type||"")}</div>
    <div class="m-hero">${e.img?`<img src="${esc(e.img)}" alt="">`:planetSVG(e.palette, uid(), 23)}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${e.note?`<div class="m-note">${esc(e.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：制作进度 ---------- */
function renderProduction(){
  const list = state.production || [];
  $("#app").innerHTML = headHTML("PRODUCTION STATUS","制作进度","从剧本到画面，一步一个脚印。") + `
    <div class="timeline">
      ${list.map(p=>`
        <div class="tl-item">
          <span class="tl-status ${p.status==="done"?"done":p.status==="wip"?"wip":"todo"}">${p.status==="done"?"✓ 完成":p.status==="wip"?"● 进行中":"○ 筹备"}</span>
          <div class="tl-body">
            <div class="tl-title">${esc(p.title)}</div>
            <div class="tl-note">${esc(p.note||"")}</div>
          </div>
        </div>`).join("")}
    </div>`;
}

/* ---------- 编辑模式 ---------- */
function toggleEdit(){
  editing = !editing;
  $("#btnEdit").textContent = editing ? "✓ 完成编辑" : "✎ 编辑";
  $("#btnEdit").classList.toggle("on", editing);
  $("#editBadge").hidden = !editing;
  document.body.classList.toggle("editing", editing);
  render();
  toast(editing ? "编辑模式：改动自动保存到本机" : "编辑已保存（本机）");
}

function editToolbar(){
  return `<div class="ed-toolbar">
    <button class="btn" id="btnDrop">放弃本地修改</button>
    <button class="btn" id="btnExport">导出 data.js（用于发布）</button>
  </div>`;
}

function renderEdit(sectionName){
  const app = $("#app");
  app.innerHTML = headHTML("EDIT MODE","编辑模式","改动即时保存到本机浏览器；改完点「导出 data.js」交给蕾姆发布。") + editToolbar();

  if(sectionName === "tianshu"){
    app.insertAdjacentHTML("beforeend", `<div class="grid two">${editFormHTML("tianshu", state.tianshu, "single")}</div>`);
    bindForm("tianshu", state.tianshu, "single");
    $("#btnExport").onclick = exportData;
    $("#btnDrop").onclick = dropLocal;
    return;
  }
  const items = state[sectionName];
  const addLabel = SCHEMAS[sectionName].label;
  app.insertAdjacentHTML("beforeend", `<div class="grid">${items.map((it,i)=>editFormHTML(sectionName, it, i)).join("")}
    <button class="ed-add" data-add="${sectionName}">＋ 新增${addLabel}</button></div>`);
  items.forEach((it,i)=>bindForm(sectionName, it, i));
  $$(".ed-add").forEach(b=>b.onclick = ()=>{ addItem(b.dataset.add); });
  $("#btnExport").onclick = exportData;
  $("#btnDrop").onclick = dropLocal;
}

function editFormHTML(sec, it, idx){
  const sch = (sec==="planets" && it && it.kind==="region") ? REGION_SCHEMA : SCHEMAS[sec];
  const fields = sch.fields.map(f=>`
    <div>
      <label>${f.l}${f.unit?`（${f.unit}）`:""}</label>
      ${f.multi
        ? `<textarea data-k="${f.k}">${esc(it[f.k]||"")}</textarea>`
        : `<input data-k="${f.k}" value="${esc(it[f.k]||"")}">`}
    </div>`).join("");
  const actions = sch.single ? "" : `
    <div class="ed-actions">
      <button class="btn-mini" data-del="${idx}">删除</button>
    </div>`;
  return `<div class="card" style="cursor:default">
    <div class="ed-form">${fields}${actions}</div>
  </div>`;
}

function bindForm(sec, it, idx){
  const cards = $$(".ed-form");
  const card = cards[idx] || cards[cards.length-1];
  if(!card) return;
  card.querySelectorAll("[data-k]").forEach(inp=>{
    inp.oninput = ()=>{ it[inp.dataset.k] = inp.value; saveLocal(); };
  });
  const del = card.querySelector("[data-del]");
  if(del) del.onclick = ()=>{
    if(!confirm("删除这条？")) return;
    state[sec].splice(idx,1);
    saveLocal(); render();
  };
}

function addItem(sec){
  const sch = SCHEMAS[sec];
  const item = deep(sch.empty);
  item.id = uid();
  state[sec].push(item);
  saveLocal(); render();
  toast("已新增，填写内容后自动保存");
}

/* ---------- 导出 ---------- */
function exportData(){
  const js = "/* 《致：黯淡星》设定数据 —— 由设定站导出，勿手改格式 */\nwindow.ZDAX_DATA = " + JSON.stringify(state, null, 2) + ";\n";
  const blob = new Blob([js], {type:"text/javascript"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.js";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("data.js 已导出，交给蕾姆即可发布新版本");
}

/* ---------- 主渲染 ---------- */
function render(){
  if(!state) return;
  renderNav();
  if(editing){ renderEdit(section); return; }
  switch(section){
    case "characters": renderCharacters(); break;
    case "planets":    renderPlanets(); break;
    case "buildings":  renderBuildings(); break;
    case "tianshu":    renderTianshu(); break;
    case "equipment":  renderEquipment(); break;
    case "production": renderProduction(); break;
    default:           renderHero();
  }
  if(!editing){
    $$(".card[data-sec]").forEach(c=>{
      c.onclick = ()=>{
        const sec = c.dataset.sec, id = c.dataset.id;
        if(sec==="characters") characterModal(state.characters.find(x=>x.id===id));
        else if(sec==="planets"){
          const p = state.planets.find(x=>x.id===id);
          if(p && p.kind==="region") regionModal(p); else planetModal(p);
        }
        else if(sec==="buildings") buildingModal(state.buildings.find(b=>b.id===id));
        else if(sec==="tianshu")    tianshuModal(state.tianshu||{});
        else if(sec==="equipment") equipmentModal(state.equipment.find(e=>e.id===id));
      };
    });
  }
}

/* ---------- 路由 ---------- */
function route(){
  const h = location.hash.replace(/^#\/?/,"") || "home";
  section = ["characters","planets","buildings","tianshu","equipment","production"].includes(h) ? h : "home";
  render();
  window.scrollTo(0,0);
}

/* ---------- 启动 ---------- */
$("#btnEdit").onclick = toggleEdit;
window.addEventListener("hashchange", route);
state = loadState();
route();
$("#footMeta").textContent = `${state.meta?.title||""} · ${state.meta?.version||""} · 更新于 ${state.meta?.updated||""}`;
