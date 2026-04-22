/* ============================================================
   GAME.JS — WaifuClicker полная версия
   Гача, лидеры, Stars, рефералы, задания/каналы
   ============================================================ */

const CONFIG = {
  API_URL: "https://ТВОЙ-СЕРВЕР.onrender.com",
  GACHA_COST_1: 10,
  GACHA_COST_10: 90,
  SAVE_INTERVAL: 15000,
  RATES: { SSR:0.05, SR:0.15, R:0.30, N:0.50 }
};

const STATE = {
  userId: null, userName: "Игрок",
  coins:0, gems:5, clicks:0, level:1, xp:0, xpNeeded:100,
  perClick:1, cps:0,
  equippedId:"sakura", ownedIds:["sakura"],
  pityCounter:0,
  upgrades:[
    {id:"u1",name:"Котик",      icon:"🐱",desc:"+1/сек",       baseCost:20,   owned:0,cpsBonus:1, clickBonus:0},
    {id:"u2",name:"Свиток",     icon:"🌸",desc:"+2 за клик",   baseCost:50,   owned:0,cpsBonus:0, clickBonus:2},
    {id:"u3",name:"Кристалл",   icon:"🌙",desc:"+5/сек",       baseCost:200,  owned:0,cpsBonus:5, clickBonus:0},
    {id:"u4",name:"Катана",     icon:"⚔️",desc:"+10 за клик", baseCost:400,  owned:0,cpsBonus:0, clickBonus:10},
    {id:"u5",name:"Фонарь",     icon:"🏮",desc:"+15/сек",      baseCost:800,  owned:0,cpsBonus:15,clickBonus:0},
    {id:"u6",name:"Синтез",     icon:"✨",desc:"+25 за клик",  baseCost:1500, owned:0,cpsBonus:0, clickBonus:25}
  ]
};

/* ── TELEGRAM ── */
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const tgUser = tg?.initDataUnsafe?.user;
if (tgUser) { STATE.userId = String(tgUser.id); STATE.userName = tgUser.first_name||"Игрок"; }
const REF_ID = tg?.initDataUnsafe?.start_param || new URLSearchParams(location.search).get("ref");

/* ── API ── */
async function apiCall(method, path, body) {
  try {
    const r = await fetch(CONFIG.API_URL+path, {
      method,
      headers:{"Content-Type":"application/json","x-telegram-init-data":tg?.initData||"","x-user-id":STATE.userId||"test"},
      body: body ? JSON.stringify(body) : undefined
    });
    return await r.json();
  } catch { return null; }
}

async function loadFromServer() {
  const ref = REF_ID ? `?ref=${REF_ID}` : "";
  const d = await apiCall("GET", `/api/player${ref}`);
  if (!d||d.error) return;
  STATE.coins=d.coins||0; STATE.gems=d.gems||5; STATE.clicks=d.clicks||0;
  STATE.level=d.level||1; STATE.ownedIds=d.ownedIds||["sakura"]; STATE.equippedId=d.equippedId||"sakura";
  if (d.name) STATE.userName=d.name;
  recalcStats(); updateHUD(); updateWaifuDisplay();
}

async function saveToServer() {
  await apiCall("POST","/api/player/save",{
    coins:Math.floor(STATE.coins), gems:Math.floor(STATE.gems),
    clicks:STATE.clicks, level:STATE.level,
    ownedIds:STATE.ownedIds, equippedId:STATE.equippedId
  });
}

/* ── LOCAL SAVE ── */
function saveLocal() {
  try { localStorage.setItem("wc2",JSON.stringify({
    coins:STATE.coins,gems:STATE.gems,clicks:STATE.clicks,level:STATE.level,
    xp:STATE.xp,xpNeeded:STATE.xpNeeded,equippedId:STATE.equippedId,
    ownedIds:STATE.ownedIds,pityCounter:STATE.pityCounter,
    upgrades:STATE.upgrades.map(u=>({id:u.id,owned:u.owned}))
  })); } catch{}
}
function loadLocal() {
  try {
    const d=JSON.parse(localStorage.getItem("wc2")||"null"); if(!d)return;
    STATE.coins=d.coins||0; STATE.gems=d.gems||5; STATE.clicks=d.clicks||0;
    STATE.level=d.level||1; STATE.xp=d.xp||0; STATE.xpNeeded=d.xpNeeded||100;
    STATE.equippedId=d.equippedId||"sakura"; STATE.ownedIds=d.ownedIds||["sakura"];
    STATE.pityCounter=d.pityCounter||0;
    if(d.upgrades) d.upgrades.forEach(s=>{const u=STATE.upgrades.find(x=>x.id===s.id);if(u)u.owned=s.owned||0;});
  } catch{}
}

/* ── STATS ── */
function recalcStats() {
  const c=CHARACTERS.find(x=>x.id===STATE.equippedId)||CHARACTERS[0];
  STATE.perClick=1+(c?.clickBonus||0)+STATE.upgrades.reduce((a,u)=>a+u.clickBonus*u.owned,0);
  STATE.cps=(c?.cpsBonus||0)+STATE.upgrades.reduce((a,u)=>a+u.cpsBonus*u.owned,0);
}

/* ── UTILS ── */
function fmt(n){n=Math.floor(n);if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return n.toString();}
function upgCost(u){return Math.floor(u.baseCost*Math.pow(1.4,u.owned));}
function equippedChar(){return CHARACTERS.find(c=>c.id===STATE.equippedId)||CHARACTERS[0];}

/* ── HUD ── */
function updateHUD() {
  document.getElementById("coinsDisplay").textContent=fmt(STATE.coins);
  document.getElementById("gemsDisplay").textContent=fmt(STATE.gems);
  document.getElementById("clicksDisplay").textContent=fmt(STATE.clicks);
  document.getElementById("perClickDisplay").textContent=STATE.perClick;
  document.getElementById("cpsDisplay").textContent=STATE.cps;
  document.getElementById("levelBadge").textContent="Ур. "+STATE.level;
  document.getElementById("xpBar").style.width=Math.min(100,Math.round(STATE.xp/STATE.xpNeeded*100))+"%";
}
function updateWaifuDisplay() {
  const c=equippedChar();
  document.getElementById("waifuImg").src=c.image;
  document.getElementById("waifuName").textContent=c.name;
  document.getElementById("waifuRarity").textContent=RARITY_STARS[c.rarity]||c.rarity;
  document.getElementById("waifuRarity").style.color={N:"#aaa",R:"#60cfff",SR:"#b76cff",SSR:"#FFD700"}[c.rarity]||"#FFD700";
}
function renderUpgrades() {
  const g=document.getElementById("upgradesGrid"); g.innerHTML="";
  STATE.upgrades.forEach(u=>{
    const cost=upgCost(u),can=STATE.coins>=cost;
    const btn=document.createElement("button");
    btn.className="upg-btn"+(can?"":" locked");
    btn.innerHTML=`<span class="upg-icon">${u.icon}</span><span class="upg-name">${u.name}</span><span class="upg-desc">${u.desc}</span><span class="upg-cost">★ ${fmt(cost)}</span><span class="upg-owned">×${u.owned}</span>`;
    if(can) btn.onclick=()=>{if(STATE.coins<upgCost(u))return;STATE.coins-=upgCost(u);u.owned++;recalcStats();updateHUD();renderUpgrades();saveLocal();};
    g.appendChild(btn);
  });
}

/* ── CLICK ── */
document.getElementById("waifuClickZone").addEventListener("click",e=>{
  STATE.coins+=STATE.perClick; STATE.clicks++; STATE.xp++;
  checkLevelUp();
  spawnFloat(STATE.perClick,e.clientX,e.clientY);
  const rp=document.getElementById("ripple");
  rp.classList.remove("animate"); void rp.offsetWidth; rp.classList.add("animate");
  updateHUD(); renderUpgrades(); saveLocal();
});

function checkLevelUp() {
  while(STATE.xp>=STATE.xpNeeded){
    STATE.xp-=STATE.xpNeeded; STATE.level++;
    STATE.xpNeeded=Math.floor(STATE.xpNeeded*1.7);
    STATE.gems+=10; showNotif("Уровень "+STATE.level+"! +10 💎");
  }
}

/* ── FLOAT / NOTIF ── */
function spawnFloat(val,x,y){
  const el=document.createElement("div"); el.className="float-txt";
  el.textContent="+"+val; el.style.left=(x-20)+"px"; el.style.top=(y-30)+"px";
  document.getElementById("floats").appendChild(el);
  setTimeout(()=>el.remove(),900);
}
function showNotif(text){
  const el=document.createElement("div");
  el.style.cssText="position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#b76cff;color:#fff;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;border-radius:20px;padding:8px 20px;z-index:300;animation:float-up 2.5s ease-out forwards;white-space:nowrap;pointer-events:none;";
  el.textContent=text; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2500);
}

/* ── PASSIVE ── */
setInterval(()=>{if(STATE.cps>0){STATE.coins+=STATE.cps/10;updateHUD();}},100);
setInterval(()=>{saveLocal();saveToServer();},CONFIG.SAVE_INTERVAL);

/* ══════════════════════════════════════════════
   ГАЧА
   ══════════════════════════════════════════════ */
let gachaAnimating=false;

document.getElementById("openGachaBtn").onclick=openGacha;
function openGacha(){renderGachaModal();document.getElementById("gachaModal").classList.add("open");}
function closeGacha(){document.getElementById("gachaModal").classList.remove("open");}
document.getElementById("gachaModalClose").onclick=closeGacha;
document.getElementById("gachaModal").onclick=e=>{if(e.target===e.currentTarget)closeGacha();};

function renderGachaModal(){
  document.getElementById("gachaPityLeft").textContent=90-STATE.pityCounter;
  document.getElementById("gachaGemsCount").textContent=Math.floor(STATE.gems);
  document.getElementById("gachaResultArea").innerHTML=`<div class="gacha-placeholder">Нажми крутить!</div>`;
}

window.doPull=function(count){
  if(gachaAnimating)return;
  const cost=count===1?CONFIG.GACHA_COST_1:CONFIG.GACHA_COST_10;
  if(STATE.gems<cost){showNotif("Недостаточно кристаллов! Купи в магазине");return;}
  STATE.gems-=cost; updateHUD(); gachaAnimating=true;

  const results=[];
  for(let i=0;i<count;i++){
    STATE.pityCounter++;
    let rarity;
    if(STATE.pityCounter>=90){rarity="SSR";STATE.pityCounter=0;}
    else{
      const r=Math.random();
      if(r<CONFIG.RATES.SSR) rarity="SSR";
      else if(r<CONFIG.RATES.SSR+CONFIG.RATES.SR) rarity="SR";
      else if(r<CONFIG.RATES.SSR+CONFIG.RATES.SR+CONFIG.RATES.R) rarity="R";
      else rarity="N";
    }
    const pool=CHARACTERS.filter(c=>c.rarity===rarity&&!c.isDefault);
    const char=pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
    const isNew=char&&!STATE.ownedIds.includes(char.id);
    if(char&&isNew) STATE.ownedIds.push(char.id);
    results.push({rarity,char,isNew});
  }
  saveLocal();
  document.getElementById("gachaPityLeft").textContent=90-STATE.pityCounter;
  document.getElementById("gachaGemsCount").textContent=Math.floor(STATE.gems);

  const area=document.getElementById("gachaResultArea");
  area.innerHTML="";
  const cols={N:"#aaa",R:"#60cfff",SR:"#b76cff",SSR:"#FFD700"};
  const glows={N:"none",R:"0 0 12px #60cfff",SR:"0 0 16px #b76cff",SSR:"0 0 24px #FFD700"};
  results.forEach((res,i)=>{
    const card=document.createElement("div");
    card.className="gacha-card"; card.style.animationDelay=(i*0.07)+"s";
    const img=res.char?`<img src="${res.char.image}" alt="${res.char.name}" class="gacha-card-img">`
      :`<div class="gacha-card-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--text2)">?</div>`;
    card.innerHTML=`${res.isNew?`<div class="gacha-new-badge">NEW!</div>`:""}
      ${img}
      <div class="gacha-card-rarity" style="color:${cols[res.rarity]};text-shadow:${glows[res.rarity]}">${RARITY_STARS[res.rarity]}</div>
      <div class="gacha-card-name">${res.char?res.char.name:res.rarity}</div>`;
    area.appendChild(card);
  });
  const ssr=results.filter(r=>r.rarity==="SSR").length;
  if(ssr) setTimeout(()=>showNotif("🌟 ×"+ssr+" SSR получен!"),400);
  gachaAnimating=false;
};

/* ══════════════════════════════════════════════
   ТАБЛИЦА ЛИДЕРОВ
   ══════════════════════════════════════════════ */
document.getElementById("openLeaderboardBtn").onclick=openLeaderboard;
async function openLeaderboard(){
  document.getElementById("leaderboardModal").classList.add("open");
  document.getElementById("leaderboardContent").innerHTML=`<div style="text-align:center;padding:40px;color:var(--text2)">Загружаем...</div>`;
  const data=await apiCall("GET","/api/leaderboard");
  if(data&&Array.isArray(data)) renderLeaderboard(data);
  else document.getElementById("leaderboardContent").innerHTML=`<div style="text-align:center;padding:40px;color:var(--text2)">Запусти бэкенд-сервер для таблицы лидеров</div>`;
}
function closeLeaderboard(){document.getElementById("leaderboardModal").classList.remove("open");}
document.getElementById("leaderboardModalClose").onclick=closeLeaderboard;
document.getElementById("leaderboardModal").onclick=e=>{if(e.target===e.currentTarget)closeLeaderboard();};

function renderLeaderboard(data){
  const medals=["🥇","🥈","🥉"];
  document.getElementById("leaderboardContent").innerHTML=`
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="padding:8px 10px;font-size:11px;color:var(--text2);text-align:center">Место</th>
        <th style="padding:8px 10px;font-size:11px;color:var(--text2);text-align:left">Игрок</th>
        <th style="padding:8px 10px;font-size:11px;color:var(--text2);text-align:right">Клики</th>
      </tr></thead>
      <tbody>${data.map((p,i)=>`<tr style="${p.userId===STATE.userId?"background:rgba(183,108,255,0.1);":""};border-bottom:1px solid rgba(183,108,255,0.06)">
        <td style="text-align:center;padding:10px;font-size:${i<3?18:13}px">${medals[i]||"#"+p.rank}</td>
        <td style="padding:10px;font-size:13px;font-weight:700;color:var(--text)">${p.name}${p.userId===STATE.userId?" <span style='color:var(--accent);font-size:10px'>(ты)</span>":""}</td>
        <td style="padding:10px;text-align:right;font-weight:700;color:var(--gold)">${fmt(p.clicks)} ★</td>
      </tr>`).join("")}</tbody>
    </table>`;
}

/* ══════════════════════════════════════════════
   TELEGRAM STARS МАГАЗИН
   ══════════════════════════════════════════════ */
document.getElementById("openStarsBtn").onclick=openStarsShop;
function openStarsShop(){document.getElementById("starsModal").classList.add("open");}
function closeStarsShop(){document.getElementById("starsModal").classList.remove("open");}
document.getElementById("starsModalClose").onclick=closeStarsShop;
document.getElementById("starsModal").onclick=e=>{if(e.target===e.currentTarget)closeStarsShop();};

window.buyGems=async function(pkg){
  if(!tg){showNotif("Stars работают только в Telegram");return;}
  showNotif("Открываем оплату...");
  const data=await apiCall("POST","/api/stars/invoice",{package:pkg});
  if(data?.url){
    tg.openInvoice(data.url,status=>{
      if(status==="paid"){showNotif("Оплата прошла! Кристаллы начислятся через пару секунд");setTimeout(loadFromServer,3000);}
    });
  } else showNotif("Запусти бэкенд для оплаты");
};

/* ══════════════════════════════════════════════
   РЕФЕРАЛЫ
   ══════════════════════════════════════════════ */
document.getElementById("openReferralBtn").onclick=openReferral;
function openReferral(){
  const uid=STATE.userId||"test";
  const bot="waifu_clicker_bot"; // ← замени на своего бота
  document.getElementById("referralLink").value=`https://t.me/${bot}?start=${uid}`;
  document.getElementById("referralModal").classList.add("open");
}
function closeReferral(){document.getElementById("referralModal").classList.remove("open");}
document.getElementById("referralModalClose").onclick=closeReferral;
document.getElementById("referralModal").onclick=e=>{if(e.target===e.currentTarget)closeReferral();};

window.copyReferralLink=function(){
  const v=document.getElementById("referralLink").value;
  navigator.clipboard.writeText(v).then(()=>showNotif("Ссылка скопирована!")).catch(()=>{
    document.getElementById("referralLink").select();document.execCommand("copy");showNotif("Ссылка скопирована!");
  });
};
window.shareReferral=function(){
  const v=document.getElementById("referralLink").value;
  const text="🎮 Играю в WaifuClicker — собираю аниме! Присоединяйся и получи бонусные 💎";
  if(tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(v)}&text=${encodeURIComponent(text)}`);
  else window.open(`https://t.me/share/url?url=${encodeURIComponent(v)}&text=${encodeURIComponent(text)}`,"_blank");
};

/* ══════════════════════════════════════════════
   ЗАДАНИЯ (ПОДПИСКИ НА КАНАЛЫ)
   ══════════════════════════════════════════════ */
let channelStatuses={};

document.getElementById("openTasksBtn").onclick=openTasks;
async function openTasks(){
  document.getElementById("tasksModal").classList.add("open");
  await loadChannelStatuses();
  renderTasks();
}
function closeTasks(){document.getElementById("tasksModal").classList.remove("open");}
document.getElementById("tasksModalClose").onclick=closeTasks;
document.getElementById("tasksModal").onclick=e=>{if(e.target===e.currentTarget)closeTasks();};

async function loadChannelStatuses(){
  const ids=(typeof CHANNELS!=="undefined"?CHANNELS:[]).filter(c=>c.active).map(c=>c.channelId);
  if(!ids.length)return;
  const data=await apiCall("POST","/api/channels/status",{channelIds:ids});
  if(data&&!data.error) channelStatuses=data;
  else { try{channelStatuses=JSON.parse(localStorage.getItem("wc_ch")||"{}");}catch{} }
}

function calcReward(ch){
  if(ch.rewardType==="clicks_percent") return Math.max(Math.floor(STATE.clicks*ch.rewardValue/100),ch.minReward||0);
  return ch.rewardValue||0;
}
function rewardLabel(ch){
  const v=calcReward(ch);
  if(ch.rewardType==="clicks_percent") return `★ ${fmt(v)} монет (${ch.rewardValue}% от твоих кликов)`;
  if(ch.rewardType==="gems") return `◆ ${v} кристаллов`;
  return `★ ${fmt(v)} монет`;
}

function renderTasks(){
  const list=(typeof CHANNELS!=="undefined"?CHANNELS:[]).filter(c=>c.active);
  const container=document.getElementById("tasksContent");
  if(!list.length){container.innerHTML=`<div style="text-align:center;padding:30px;color:var(--text2)">Заданий пока нет.<br>Добавь каналы в admin/index.html</div>`;return;}
  container.innerHTML=list.map(ch=>{
    const done=channelStatuses[ch.channelId];
    return `<div class="task-card${done?" task-done":""}">
      <div class="task-icon">${ch.icon}</div>
      <div class="task-body">
        <div class="task-title">${ch.title}</div>
        ${ch.description?`<div class="task-desc">${ch.description}</div>`:""}
        <div class="task-reward">🎁 ${rewardLabel(ch)}</div>
      </div>
      <div class="task-action">
        ${done?`<div class="task-check">✓ Готово</div>`
          :`<a href="${ch.url}" target="_blank" class="task-sub-btn" onclick="handleSubClick('${ch.id}')">Подписаться</a>`}
      </div>
    </div>`;
  }).join("");
}

window.handleSubClick=function(chId){
  setTimeout(()=>claimChannelReward(chId),3500);
};

async function claimChannelReward(chId){
  const ch=(typeof CHANNELS!=="undefined"?CHANNELS:[]).find(c=>c.id===chId);
  if(!ch)return;
  if(channelStatuses[ch.channelId]){showNotif("Уже получено!");return;}
  const data=await apiCall("POST","/api/channels/claim",{channelId:ch.channelId});
  const ok=data?.ok||data?.subscribed||!STATE.userId; // в тестовом режиме всегда ok
  if(ok){
    channelStatuses[ch.channelId]=true;
    try{const s=JSON.parse(localStorage.getItem("wc_ch")||"{}");s[ch.channelId]=true;localStorage.setItem("wc_ch",JSON.stringify(s));}catch{}
    const v=calcReward(ch);
    if(ch.rewardType==="gems"){STATE.gems+=v;showNotif(`◆ +${v} кристаллов!`);}
    else{STATE.coins+=v;showNotif(`★ +${fmt(v)} монет!`);}
    updateHUD();saveLocal();saveToServer();renderTasks();
  } else {
    showNotif("Ты не подписан! Подпишись и нажми снова");
    if(tg)tg.openTelegramLink(ch.url);else window.open(ch.url,"_blank");
  }
}

/* ── SHOP / COLLECTION ── */
let shopFilter="all",collFilter="all";
function renderShop(){
  const g=document.getElementById("shopGrid");g.innerHTML="";
  CHARACTERS.filter(c=>!c.isDefault).filter(c=>shopFilter==="all"||c.category===shopFilter)
    .sort((a,b)=>RARITY_ORDER[b.rarity]-RARITY_ORDER[a.rarity]).forEach(c=>g.appendChild(buildCharCard(c)));
}
function renderCollection(){
  const g=document.getElementById("collectionGrid");g.innerHTML="";
  const list=CHARACTERS.filter(c=>STATE.ownedIds.includes(c.id)).filter(c=>collFilter==="all"||c.category===collFilter).sort((a,b)=>RARITY_ORDER[b.rarity]-RARITY_ORDER[a.rarity]);
  if(!list.length){g.innerHTML=`<p style="color:var(--text2);font-size:13px;grid-column:1/-1;padding:20px 0">Коллекция пуста. Купи в магазине!</p>`;return;}
  list.forEach(c=>g.appendChild(buildCharCard(c)));
}
function buildCharCard(c){
  const isOwned=STATE.ownedIds.includes(c.id),isEquipped=STATE.equippedId===c.id;
  const cols={N:"#aaa",R:"#60cfff",SR:"#b76cff",SSR:"#FFD700"};
  const div=document.createElement("div");
  div.className="char-card"+(isOwned?" owned":"")+(isEquipped?" equipped":"");
  const badge=isEquipped?`<div class="badge-equipped">В игре</div>`:isOwned?`<div class="badge-owned">Есть</div>`:"";
  const price=c.gemPrice>0&&!isOwned?`<div class="char-card-price gem-price">◆ ${c.gemPrice}</div>`
    :!isOwned&&c.price>0?`<div class="char-card-price">★ ${fmt(c.price)}</div>`
    :isOwned?`<div class="char-card-price" style="background:rgba(183,108,255,.1);border-color:rgba(183,108,255,.3);color:var(--accent)">Куплен</div>`:"";
  div.innerHTML=`${badge}<div class="badge-cat ${c.category}">${c.category==="anime"?"Аниме":"Игровой"}</div>
    <img class="char-card-img" src="${c.image}" alt="${c.name}" loading="lazy">
    <div class="char-card-body"><div class="char-card-name">${c.name}</div>
    <div class="char-card-rarity" style="color:${cols[c.rarity]||'#FFD700'}">${RARITY_STARS[c.rarity]||c.rarity}</div>${price}</div>`;
  div.onclick=()=>openModal(c);
  return div;
}

/* ── MODAL ── */
function openModal(c){
  const isOwned=STATE.ownedIds.includes(c.id),isEquipped=STATE.equippedId===c.id;
  const cols={N:"#aaa",R:"#60cfff",SR:"#b76cff",SSR:"#FFD700"};
  document.getElementById("modalImg").src=c.image;
  document.getElementById("modalName").textContent=c.name;
  document.getElementById("modalRarity").textContent=RARITY_STARS[c.rarity]||c.rarity;
  document.getElementById("modalRarity").style.color=cols[c.rarity]||"#FFD700";
  document.getElementById("modalCategory").textContent=c.category==="anime"?"Аниме":"Игровой";
  document.getElementById("modalDesc").textContent=c.desc;
  document.getElementById("modalStats").innerHTML=`<div class="modal-stat">За клик: <span>+${c.clickBonus}</span></div><div class="modal-stat">В сек: <span>+${c.cpsBonus}</span></div>`;
  const a=document.getElementById("modalActions"); a.innerHTML="";
  if(isEquipped){const b=document.createElement("button");b.className="btn-secondary";b.disabled=true;b.textContent="Сейчас в игре";a.appendChild(b);}
  else if(isOwned){const b=document.createElement("button");b.className="btn-primary";b.textContent="Поставить в игру";b.onclick=()=>{STATE.equippedId=c.id;recalcStats();updateWaifuDisplay();updateHUD();saveLocal();closeModal();renderCollection();renderShop();};a.appendChild(b);}
  else{
    if(c.gemPrice>0){const can=STATE.gems>=c.gemPrice;const b=document.createElement("button");b.className="btn-primary";b.disabled=!can;b.textContent=can?`Купить ◆ ${c.gemPrice}`:`Нужно ◆ ${c.gemPrice}`;b.onclick=()=>{if(STATE.gems<c.gemPrice)return;STATE.gems-=c.gemPrice;STATE.ownedIds.push(c.id);saveLocal();saveToServer();closeModal();renderShop();renderCollection();updateHUD();showNotif(c.name+" разблокирован!");};a.appendChild(b);}
    else if(c.price>0){const can=STATE.coins>=c.price;const b=document.createElement("button");b.className="btn-primary";b.disabled=!can;b.textContent=can?`Купить ★ ${fmt(c.price)}`:`Нужно ★ ${fmt(c.price)}`;b.onclick=()=>{if(STATE.coins<c.price)return;STATE.coins-=c.price;STATE.ownedIds.push(c.id);saveLocal();saveToServer();closeModal();renderShop();renderCollection();updateHUD();showNotif(c.name+" разблокирован!");};a.appendChild(b);}
    const x=document.createElement("button");x.className="btn-secondary";x.textContent="Закрыть";x.onclick=closeModal;a.appendChild(x);
  }
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal(){document.getElementById("modalOverlay").classList.remove("open");}
document.getElementById("modalClose").onclick=closeModal;
document.getElementById("modalOverlay").onclick=e=>{if(e.target===e.currentTarget)closeModal();};

/* ── TABS ── */
document.querySelectorAll(".tab").forEach(tab=>{
  tab.onclick=()=>{
    const t=tab.dataset.tab;
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    tab.classList.add("active"); document.getElementById("tab-"+t).classList.add("active");
    if(t==="shop")renderShop(); if(t==="collection")renderCollection();
  };
});
document.querySelectorAll("#tab-shop .filter-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll("#tab-shop .filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");shopFilter=b.dataset.cat;renderShop();});
document.querySelectorAll("#tab-collection .filter-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll("#tab-collection .filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");collFilter=b.dataset.cat;renderCollection();});

/* ── INIT ── */
async function init(){
  loadLocal(); recalcStats(); updateHUD(); updateWaifuDisplay(); renderUpgrades();
  if(STATE.userId) await loadFromServer();
}
init();
