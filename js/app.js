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
      {k:"material", l:"建筑材料与样式", multi:true},
      {k:"signs",    l:"标语与文字", multi:true},
      {k:"size",     l:"尺寸与空间", multi:true},
      {k:"function", l:"功能"},
      {k:"img",      l:"概念图 URL"},
      {k:"note",     l:"备注", multi:true},
    ],
    empty: {id:"", name:"新建筑", location:"", material:"", signs:"", size:"", function:"", img:"",
            palette:["#8a8f98","#5c6068","#b8bdc8"], note:""}
  },
  tianshu: {
    label: "天枢", titleKey: "name", single: true,
    fields: [
      {k:"name",       l:"名称"},
      {k:"class",      l:"定位"},
      {k:"appearance", l:"外观", multi:true},
      {k:"principle",  l:"运行原理", multi:true},
      {k:"ability",    l:"能力参数", multi:true},
      {k:"voice",      l:"声线特征"},
      {k:"forms",      l:"形态变化", multi:true},
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
    if(local) return JSON.parse(local);
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
    ["白日","开尔文", p.temp_day], ["夜晚","开尔文", p.temp_night],
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
  $("#app").innerHTML = headHTML("PLANETARY ARCHIVE","星球档案","六颗星球，六种情感的颜色。每一颗星都是剧中的一个情绪坐标。") + `
    <div class="grid">
      ${list.map(p=>`
        <div class="card" data-sec="planets" data-id="${p.id}">
          <span class="card-badge">${esc(p.tag?.split("·")[0]||"未分类")}</span>
          <div class="thumb">${p.img?`<img src="${esc(p.img)}" alt="" style="width:100%;height:100%;object-fit:cover">`:planetSVG(p.palette, p.id||uid(), 7)}</div>
          <div class="card-body">
            <div class="card-title">${esc(p.name)}</div>
            <div class="card-tag">${esc(p.tag||"")}</div>
            <div class="card-line">${esc(p.terrain?.slice(0,60)||"")}${(p.terrain?.length||0)>60?"…":""}</div>
          </div>
        </div>`).join("")}
    </div>`;
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
    ["位置","", b.location], ["材料与样式","", b.material], ["标语与文字","", b.signs],
    ["尺寸与空间","", b.size], ["功能","", b.function]
  ].filter(r=>r[2]);
  openModal(`
    <button class="modal-close">×</button>
    <div class="m-title">${esc(b.name)}</div>
    <div class="m-sub">${esc(b.location||"")}</div>
    <div class="m-hero">${b.img?`<img src="${esc(b.img)}" alt="">`:planetSVG(b.palette, uid(), 11)}</div>
    <div class="m-table">
      ${rows.map(r=>`<div class="m-row"><div class="k">${r[0]}</div><div class="v">${esc(r[2]).replace(/\n/g,"<br>")}</div></div>`).join("")}
    </div>
    ${b.note?`<div class="m-note">${esc(b.note).replace(/\n/g,"<br>")}</div>`:""}
  `);
}

/* ---------- 渲染：天枢 ---------- */
function renderTianshu(){
  const t = state.tianshu || {};
  $("#app").innerHTML = headHTML("CORE AI SYSTEM","天枢系统","不是反派的反派：一切行动基于最优解计算。") + `
    <div class="tianshu-showcase">
      <div class="tianshu-visual">
        <div class="orb">${tianshuSVG(uid())}</div>
        <div style="font-family:var(--serif);letter-spacing:6px;font-size:20px">${esc(t.name||"天枢")}</div>
        <div style="font-size:11px;color:var(--muted);letter-spacing:2px;text-align:center;line-height:1.9">${esc(t.class||"")}</div>
      </div>
      <div class="tianshu-fields">
        ${[["外观","appearance"],["运行原理","principle"],["能力参数","ability"],["声线特征","voice"],["形态变化","forms"]]
          .map(([l,k])=>t[k]?`<div class="tianshu-field"><div class="k">${l}</div><div class="v">${esc(t[k]).replace(/\n/g,"<br>")}</div></div>`:"").join("")}
        ${t.note?`<div class="tianshu-field"><div class="k">备注</div><div class="v">${esc(t.note).replace(/\n/g,"<br>")}</div></div>`:""}
      </div>
    </div>`;
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
  app.insertAdjacentHTML("beforeend", `<div class="grid">${items.map((it,i)=>editFormHTML(sectionName, it, i)).join("")}
    <button class="ed-add" data-add="${sectionName}">＋ 新增${SCHEMAS[sectionName].label}</button></div>`);
  items.forEach((it,i)=>bindForm(sectionName, it, i));
  $$(".ed-add").forEach(b=>b.onclick = ()=>{ addItem(b.dataset.add); });
  $("#btnExport").onclick = exportData;
  $("#btnDrop").onclick = dropLocal;
}

function editFormHTML(sec, it, idx){
  const sch = SCHEMAS[sec];
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
        if(sec==="planets")    planetModal(state.planets.find(p=>p.id===id));
        else if(sec==="buildings") buildingModal(state.buildings.find(b=>b.id===id));
        else if(sec==="equipment") equipmentModal(state.equipment.find(e=>e.id===id));
      };
    });
  }
}

/* ---------- 路由 ---------- */
function route(){
  const h = location.hash.replace(/^#\/?/,"") || "home";
  section = ["planets","buildings","tianshu","equipment","production"].includes(h) ? h : "home";
  render();
  window.scrollTo(0,0);
}

/* ---------- 启动 ---------- */
$("#btnEdit").onclick = toggleEdit;
window.addEventListener("hashchange", route);
state = loadState();
route();
$("#footMeta").textContent = `${state.meta?.title||""} · ${state.meta?.version||""} · 更新于 ${state.meta?.updated||""}`;
