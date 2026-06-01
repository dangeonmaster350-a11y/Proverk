// ─── Theme ────────────────────────────────────────────────────────────────────
const THEMES = {
  dark:  "dark",
  light: "light"
};

// ─── DB ───────────────────────────────────────────────────────────────────────
const OWNER_PHONE = "9995632";
const OWNER_PASSWORD = "908013";
const ANON_PREFIX = "888";
const REACTIONS_LIST = ["👍","❤️","😂","😮","😢","🔥"];
const COLORS = { u1:"#4f7cff", u2:"#ff6b9d", u3:"#43c59e", u4:"#f59e0b", me:"#7c4fff" };

const DB = {
  users: [
    { id:"u1", username:"alexey_k",  fullName:"Алексей Козлов",  avatar:null, phone:"79991112233", hidePhone:false, bio:"Люблю кофе и код ☕",     online:true,  lastSeen:null,              premium:true,  role:"user",  banned:false },
    { id:"u2", username:"marina_v",  fullName:"Марина Волкова",  avatar:null, phone:"79994445566", hidePhone:true,  bio:"Дизайнер 🎨",             online:false, lastSeen:Date.now()-7*60000,  premium:false, role:"user",  banned:false },
    { id:"u3", username:"dmitry_p",  fullName:"Дмитрий Петров",  avatar:null, phone:"79997778899", hidePhone:false, bio:"",                        online:false, lastSeen:Date.now()-2*3600000,premium:false, role:"user",  banned:false },
    { id:"u4", username:"anon_7777", fullName:"Аноним #7777",    avatar:null, phone:"8881234567",  hidePhone:true,  bio:"👤 Анонимный аккаунт",    online:true,  lastSeen:null,              premium:true,  role:"user",  banned:false },
    { id:"u5", username:"anon_9999", fullName:"Аноним #9999",    avatar:null, phone:"8889999888",  hidePhone:true,  bio:"👤 Анонимный аккаунт",    online:false, lastSeen:Date.now()-30*60000, premium:true,  role:"user",  banned:false },
  ],
  messages: {
    u1:[ {id:1,from:"u1",text:"Привет! Как дела?",time:"10:23",read:true,reactions:{},replyTo:null,edited:false,deleted:false}, {id:2,from:"me",text:"Всё отлично!",time:"10:24",read:true,reactions:{},replyTo:null,edited:false,deleted:false}, {id:3,from:"u1",text:"Встретимся сегодня?",time:"10:25",read:false,reactions:{},replyTo:null,edited:false,deleted:false} ],
    u2:[ {id:1,from:"u2",text:"Документы готовы",time:"09:10",read:true,reactions:{},replyTo:null,edited:false,deleted:false}, {id:2,from:"me",text:"Спасибо!",time:"09:12",read:true,reactions:{},replyTo:null,edited:false,deleted:false} ],
    u3:[], u4:[], u5:[],
  },
  favorites:["u1"], muted:[], blocked:[], archived:[],
  registeredPhones: {
    "79991112233":{ userId:"u1", password:"pass1" },
    "79994445566":{ userId:"u2", password:"pass2" },
    "79997778899":{ userId:"u3", password:"pass3" },
    "8881234567": { userId:"u4", password:"anon1" },
    "8889999888": { userId:"u5", password:"anon2" },
    [OWNER_PHONE]: { userId:"owner", password: OWNER_PASSWORD },
  },
};

const OWNER_USER = {
  id:"owner", username:"volt_owner", fullName:"Владелец Volt", avatar:null,
  phone:OWNER_PHONE, hidePhone:true,
  bio:"👑 Создатель Flow Messenger", online:true, lastSeen:null,
  premium:true, role:"owner", banned:false,
};

// ─── App State ────────────────────────────────────────────────────────────────
let AppState = {
  screen: "login",       // login | register | app | chat
  currentUser: null,
  tab: "chats",          // chats | favorites | settings | profile | admin
  openChat: null,
  theme: "dark",
  fontSize: 14,
};

// ─── Utils ────────────────────────────────────────────────────────────────────
function getInitials(n=""){return n.split(" ").map(c=>c[0]||"").join("").toUpperCase().slice(0,2)||"?";}
function nowTime(){return new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"});}
function lastSeenText(ts){
  if(!ts)return"давно"; const d=Date.now()-ts,m=Math.floor(d/60000),h=Math.floor(d/3600000);
  if(m<1)return"только что"; if(m<60)return`${m} мин назад`; if(h<24)return`${h} ч назад`; return"вчера";
}
function isAnonPhone(p){return String(p).replace(/\D/g,"").startsWith(ANON_PREFIX);}
function isOwnerPhone(p){return String(p).replace(/\D/g,"")===OWNER_PHONE;}
function formatPhone(raw){
  const d=raw.replace(/\D/g,"");
  if(!d)return"";
  if(d.startsWith(ANON_PREFIX))return"+"+d;
  if(d===OWNER_PHONE)return"+"+d;
  if(d.length>7)return"+"+d.slice(0,1)+" "+d.slice(1,4)+" "+d.slice(4,7)+" "+d.slice(7,9)+(d.length>9?" "+d.slice(9,11):"");
  return"+"+d;
}
function genSmsCode(){return String(Math.floor(10000+Math.random()*90000));}
function applyFontSize(){document.getElementById("app").style.fontSize = AppState.fontSize+"px";}
function applyTheme(){document.body.className = AppState.theme === "light" ? "light" : "";}

// ─── Render helpers ───────────────────────────────────────────────────────────
function avatarHtml(user, size=44, showOnline=false){
  const bg = user?.avatar ? "transparent" : (COLORS[user?.id]||"#4f7cff");
  const initials = user?.avatar ? "" : getInitials(user?.fullName||user?.username);
  const bgStyle = user?.avatar ? `background-image:url(${user.avatar});background-size:cover;background-position:center;` : `background:${bg};`;
  const onlineIndicator = showOnline && user?.online
    ? `<div class="avatar-online" style="width:${size*0.28}px;height:${size*0.28}px;"></div>`
    : "";
  return `<div class="avatar-wrap">
    <div class="avatar" style="width:${size}px;height:${size}px;font-size:${size*0.36}px;${bgStyle}">${!user?.avatar?initials:""}</div>
    ${onlineIndicator}
  </div>`;
}
function badgesHtml(user){
  let b="";
  if(user.premium)b+=`<span class="badge-premium" title="Volt Premium">⭐</span>`;
  if(isAnonPhone(user.phone))b+=`<span class="badge-anon">👤 anon</span>`;
  if(user.role==="owner")b+=`<span class="badge-owner">👑 owner</span>`;
  return b;
}
function premiumBlockHtml(){
  return `<div class="premium-block" style="margin:0 16px;"><span style="font-size:20px;">⭐</span><div><div style="font-weight:700;margin-bottom:2px;">Volt Premium</div><div style="font-size:11px;color:rgba(245,158,11,0.7);">Цветной ник · Реакции · Анонимные номера · Без лимитов</div></div></div>`;
}

// ─── Render: Auth Screens ─────────────────────────────────────────────────────
function renderLoginScreen(){
  return `
  <div class="auth-screen">
    <div class="auth-card" id="auth-card">
      <div class="auth-logo">💬 <span>Volt</span></div>
      <div class="auth-subtitle">Защищённый мессенджер</div>
      <div class="auth-title">Войти</div>
      <div class="tab-switcher">
        <button class="tab-btn active" id="login-tab-phone" onclick="setLoginTab('phone')">📱 По номеру</button>
        <button class="tab-btn" id="login-tab-username" onclick="setLoginTab('username')">👤 По нику</button>
      </div>
      <div id="login-form-area">${renderPhoneLoginForm()}</div>
      <button class="btn-link" onclick="AppState.screen='register';render()">Нет аккаунта? <span>Регистрация</span></button>
    </div>
  </div>`;
}

let loginTab = "phone";
function setLoginTab(t){
  loginTab = t;
  document.getElementById("login-tab-phone").className = "tab-btn"+(t==="phone"?" active":"");
  document.getElementById("login-tab-username").className = "tab-btn"+(t==="username"?" active":"");
  document.getElementById("login-form-area").innerHTML = t==="phone" ? renderPhoneLoginForm() : renderUsernameLoginForm();
  initPhoneLogin();
}

function renderUsernameLoginForm(){
  return `
  <div style="display:flex;flex-direction:column;gap:12px;">
    <input class="inp" id="ul-username" placeholder="@username">
    <input class="inp" id="ul-password" type="password" placeholder="Пароль" onkeydown="if(event.key==='Enter')doUsernameLogin()">
    <div id="ul-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary" onclick="doUsernameLogin()">Войти</button>
    <div style="padding:8px 12px;background:rgba(79,124,255,0.07);border-radius:8px;font-size:11px;color:var(--sub);">
      <b style="color:var(--text);">Тест:</b> alexey_k / marina_v / dmitry_p / anon_7777 (любой пароль)
    </div>
  </div>`;
}
function doUsernameLogin(){
  const u = document.getElementById("ul-username")?.value||"";
  const p = document.getElementById("ul-password")?.value||"";
  const errEl = document.getElementById("ul-err");
  if(!u||!p){errEl.textContent="Заполните все поля";errEl.style.display="";return;}
  const found = DB.users.find(x=>x.username===u.replace("@",""));
  if(!found){errEl.textContent="Пользователь не найден";errEl.style.display="";return;}
  if(found.banned){errEl.textContent="Аккаунт заблокирован";errEl.style.display="";return;}
  errEl.style.display="none";
  doLogin({...found});
}

function renderRegisterScreen(){
  return `
  <div class="auth-screen">
    <div class="auth-card" id="auth-card">
      <div class="auth-logo">💬 <span>Volt</span></div>
      <div class="auth-title">Регистрация</div>
      <div class="tab-switcher">
        <button class="tab-btn active" id="reg-tab-phone" onclick="setRegTab('phone')">📱 По номеру</button>
        <button class="tab-btn" id="reg-tab-username" onclick="setRegTab('username')">👤 По нику</button>
      </div>
      <div id="reg-form-area">${renderPhoneLoginForm()}</div>
      <button class="btn-link" onclick="AppState.screen='login';loginTab='phone';render()">Уже есть аккаунт? <span>Войти</span></button>
    </div>
  </div>`;
}
let regTab = "phone";
function setRegTab(t){
  regTab = t;
  document.getElementById("reg-tab-phone").className = "tab-btn"+(t==="phone"?" active":"");
  document.getElementById("reg-tab-username").className = "tab-btn"+(t==="username"?" active":"");
  document.getElementById("reg-form-area").innerHTML = t==="phone" ? renderPhoneLoginForm() : renderUsernameRegForm();
  initPhoneLogin();
}
function renderUsernameRegForm(){
  return `
  <div style="display:flex;flex-direction:column;gap:12px;" id="ureg-form">
    <input class="inp" id="ureg-name" placeholder="Иванов Иван или @nickname">
    <div id="ureg-err-name" class="err-msg" style="display:none;"></div>
    <input class="inp" id="ureg-pass" type="password" placeholder="Пароль">
    <div id="ureg-err-pass" class="err-msg" style="display:none;"></div>
    <input class="inp" id="ureg-confirm" type="password" placeholder="Повторите пароль">
    <div id="ureg-err-confirm" class="err-msg" style="display:none;"></div>
    <div class="captcha-box" id="captcha-box" onclick="doCaptcha()">
      <div class="captcha-check" id="captcha-check"></div>
      <span class="captcha-label" id="captcha-label">Я не робот</span>
      <span class="captcha-icon">🛡️</span>
    </div>
    <div id="ureg-err-captcha" class="err-msg" style="display:none;"></div>
    <button class="btn-primary" onclick="doUsernameRegister()">Зарегистрироваться</button>
  </div>`;
}
let captchaDone=false, captchaLoading=false;
function doCaptcha(){
  if(captchaDone||captchaLoading)return;
  captchaLoading=true;
  const check=document.getElementById("captcha-check");
  const label=document.getElementById("captcha-label");
  if(check)check.innerHTML=`<span class="captcha-spin">⟳</span>`;
  if(label)label.textContent="Проверка...";
  setTimeout(()=>{
    captchaLoading=false; captchaDone=true;
    if(check){check.className="captcha-check checked";check.innerHTML="<span style='color:#fff;font-size:13px;'>✓</span>";}
    if(label)label.textContent="Вы не робот ✓";
    const box=document.getElementById("captcha-box");
    if(box)box.className="captcha-box done";
  },1200);
}
function doUsernameRegister(){
  const name=document.getElementById("ureg-name")?.value.trim()||"";
  const pass=document.getElementById("ureg-pass")?.value||"";
  const conf=document.getElementById("ureg-confirm")?.value||"";
  let ok=true;
  ["ureg-err-name","ureg-err-pass","ureg-err-confirm","ureg-err-captcha"].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display="none";
  });
  if(!name){document.getElementById("ureg-err-name").textContent="Введите ФИО или никнейм";document.getElementById("ureg-err-name").style.display="";ok=false;}
  if(pass.length<6){document.getElementById("ureg-err-pass").textContent="Минимум 6 символов";document.getElementById("ureg-err-pass").style.display="";ok=false;}
  if(pass!==conf){document.getElementById("ureg-err-confirm").textContent="Пароли не совпадают";document.getElementById("ureg-err-confirm").style.display="";ok=false;}
  if(!captchaDone){document.getElementById("ureg-err-captcha").textContent="Подтвердите, что вы не робот";document.getElementById("ureg-err-captcha").style.display="";ok=false;}
  if(!ok){const card=document.getElementById("auth-card");if(card){card.style.animation="shake 0.4s";setTimeout(()=>card.style.animation="",500);}return;}
  const isNick=name.startsWith("@")||!name.includes(" ");
  const username=isNick?name.replace("@",""):name.split(" ").join("_").toLowerCase();
  const fullName=isNick?name.replace("@",""):name;
  captchaDone=false;
  doLogin({id:"me",username,fullName,avatar:null,phone:"",hidePhone:false,bio:"",online:true,lastSeen:null,premium:false,role:"user",banned:false});
}

// ─── Phone Login State Machine ────────────────────────────────────────────────
let phoneStep = "phone";
let phoneValue = "";
let phoneRealCode = "";

function renderPhoneLoginForm(){
  phoneStep="phone"; phoneValue=""; phoneRealCode="";
  return `<div class="phone-login" id="phone-login-form">
    ${renderPhoneStep()}
  </div>`;
}
function initPhoneLogin(){
  // re-init listeners after DOM insert
}

function renderPhoneStep(){
  return `
    <div style="font-size:13px;color:var(--sub);margin-bottom:2px;">Введите номер телефона для входа или регистрации</div>
    <div class="inp-row">
      <span style="font-size:20px;">📱</span>
      <input class="inp" id="phone-inp" placeholder="+7 999 123 45 67" oninput="onPhoneInput()" onkeydown="if(event.key==='Enter')sendSms()">
    </div>
    <div id="phone-type-hint"></div>
    <div id="phone-basic-hint" style="background:rgba(79,124,255,0.06);border-radius:8px;padding:10px 12px;font-size:11px;color:var(--sub);line-height:1.8;">
      <div>👑 <b style="color:#f59e0b;">+9995632</b> — <span style="color:#f59e0b;">Номер владельца</span> · без SMS · пароль: <code style="background:rgba(245,158,11,0.1);padding:0 4px;border-radius:4px;color:#f59e0b;">owner123</code></div>
      <div>👤 <b style="color:#a78bfa;">+888XXXXXXX</b> — Анонимный номер · Premium автоматически</div>
      <div>📱 <b style="color:var(--text);">Любой другой</b> — обычная регистрация</div>
    </div>
    <div id="phone-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary" id="phone-submit-btn" onclick="sendSms()">Получить SMS-код →</button>`;
}

function onPhoneInput(){
  const inp = document.getElementById("phone-inp");
  const hint = document.getElementById("phone-type-hint");
  const basicHint = document.getElementById("phone-basic-hint");
  const submitBtn = document.getElementById("phone-submit-btn");
  if(!inp)return;
  const d = inp.value.replace(/\D/g,"");
  const isOwner = isOwnerPhone(d);
  const isAnon = isAnonPhone(d);
  if(d.length>=6){
    basicHint.style.display="none";
    let bg,bc,col,msg;
    if(isOwner){bg="rgba(245,158,11,0.08)";bc="rgba(245,158,11,0.25)";col="#f59e0b";msg="👑 <b>Номер владельца</b> — вход без SMS, сразу пароль";}
    else if(isAnon){bg="rgba(139,92,246,0.08)";bc="rgba(139,92,246,0.25)";col="#a78bfa";msg="👤 <b>Анонимный номер</b> — без привязки к оператору, Premium автоматически";}
    else{bg="rgba(79,124,255,0.06)";bc="rgba(79,124,255,0.15)";col="var(--sub)";msg="📞 Обычный номер — отправим SMS-код";}
    hint.innerHTML=`<div style="border-radius:8px;padding:8px 12px;font-size:12px;background:${bg};border:1px solid ${bc};color:${col};">${msg}</div>`;
    if(submitBtn)submitBtn.textContent=isOwner?"Войти как владелец →":"Получить SMS-код →";
  } else {
    hint.innerHTML="";
    basicHint.style.display="";
  }
}

function sendSms(){
  const inp = document.getElementById("phone-inp");
  const errEl = document.getElementById("phone-err");
  const btn = document.getElementById("phone-submit-btn");
  if(!inp)return;
  const d = inp.value.replace(/\D/g,"");
  if(d.length<6){errEl.textContent="Введите корректный номер";errEl.style.display="";return;}
  errEl.style.display="none";
  phoneValue = d;
  btn.textContent="Проверка...";btn.disabled=true;
  setTimeout(()=>{
    btn.disabled=false;
    if(isOwnerPhone(d)){
      const rec=DB.registeredPhones[d];
      const pForm=document.getElementById("phone-login-form");
      if(pForm)pForm.innerHTML=rec?renderPasswordStep(false,false,true):renderNewPassStep(false,true);
      return;
    }
    const code=genSmsCode(); phoneRealCode=code;
    const pForm=document.getElementById("phone-login-form");
    if(pForm)pForm.innerHTML=renderSmsStep(d);
    setTimeout(()=>alert(`📱 SMS-код для ${formatPhone(d)}: ${code}\n(симуляция — в реальном приложении придёт SMS)`),100);
  },600);
}

function renderSmsStep(d){
  return `
    <div style="font-size:13px;color:var(--sub);">Введите 5-значный код из SMS на <b style="color:var(--text);">${formatPhone(d)}</b></div>
    <input class="sms-input" id="sms-inp" maxlength="5" placeholder="_ _ _ _ _" onkeydown="if(event.key==='Enter')verifySms()">
    <div id="sms-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary" onclick="verifySms()">Подтвердить</button>
    <div onclick="resetToPhoneStep()" style="text-align:center;color:var(--sub);font-size:13px;cursor:pointer;">← Изменить номер</div>`;
}

function verifySms(){
  const inp=document.getElementById("sms-inp");
  const errEl=document.getElementById("sms-err");
  if(!inp)return;
  if(inp.value!==phoneRealCode){errEl.textContent="Неверный код";errEl.style.display="";return;}
  errEl.style.display="none";
  const rec=DB.registeredPhones[phoneValue];
  const pForm=document.getElementById("phone-login-form");
  if(pForm)pForm.innerHTML=rec?renderPasswordStep(false,isAnonPhone(phoneValue),false):renderNewPassStep(isAnonPhone(phoneValue),false);
}

function renderPasswordStep(isNew,isAnon,isOwner){
  const bannerHtml = isOwner
    ? `<div class="owner-banner"><span style="font-size:22px;">👑</span><div><div style="font-size:13px;font-weight:700;color:#f59e0b;">Вход как Владелец</div><div style="font-size:11px;color:rgba(245,158,11,0.6);">Полный доступ · Админ-панель</div></div></div>`
    : isAnon
    ? `<div class="anon-banner"><span style="font-size:22px;">👤</span><div><div style="font-size:13px;font-weight:700;color:#a78bfa;">Анонимный вход</div><div style="font-size:11px;color:rgba(167,139,250,0.6);">${formatPhone(phoneValue)} · Premium аккаунт</div></div></div>`
    : "";
  return `
    ${bannerHtml}
    <div style="font-size:13px;color:var(--sub);">Введите пароль для <b style="color:var(--text);">${formatPhone(phoneValue)}</b></div>
    <div class="inp-wrap">
      <input class="inp" id="pwd-inp" type="password" placeholder="Пароль" onkeydown="if(event.key==='Enter')doPhoneLogin()">
      <button class="eye-btn" id="eye-btn" onclick="toggleEye()">👁</button>
    </div>
    <div id="pwd-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary ${isOwner?'btn-owner':''}" onclick="doPhoneLogin()">${isOwner?"👑 Войти как Владелец":"Войти"}</button>
    <div onclick="resetToPhoneStep()" style="text-align:center;color:var(--sub);font-size:13px;cursor:pointer;">← Изменить номер</div>`;
}

function renderNewPassStep(isAnon,isOwner){
  return `
    <div style="font-size:13px;color:var(--sub);">Новый аккаунт! Придумайте пароль для <b style="color:var(--text);">${formatPhone(phoneValue)}</b></div>
    ${isAnon?`<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:8px 12px;font-size:12px;color:#a78bfa;">👤 Анонимный номер — <b>Premium активируется автоматически</b></div>`:""}
    <input class="inp" id="npwd-inp" type="password" placeholder="Придумайте пароль (мин. 6 символов)">
    <input class="inp" id="npwd-confirm" type="password" placeholder="Повторите пароль" onkeydown="if(event.key==='Enter')doPhoneRegister()">
    <div id="npwd-show" onclick="toggleNewPassEye()" style="font-size:12px;color:var(--sub);cursor:pointer;text-align:right;">👁 Показать пароль</div>
    <div id="npwd-err" class="err-msg" style="display:none;"></div>
    <button class="btn-primary ${isAnon?'btn-anon':''}" onclick="doPhoneRegister()">${isAnon?"👤 Создать анонимный аккаунт":"Зарегистрироваться"}</button>
    <div onclick="resetToPhoneStep()" style="text-align:center;color:var(--sub);font-size:13px;cursor:pointer;">← Изменить номер</div>`;
}

let showEye=false, showNewEye=false;
function toggleEye(){
  showEye=!showEye;
  const inp=document.getElementById("pwd-inp");
  const btn=document.getElementById("eye-btn");
  if(inp)inp.type=showEye?"text":"password";
  if(btn)btn.textContent=showEye?"🙈":"👁";
}
function toggleNewPassEye(){
  showNewEye=!showNewEye;
  ["npwd-inp","npwd-confirm"].forEach(id=>{const el=document.getElementById(id);if(el)el.type=showNewEye?"text":"password";});
  const btn=document.getElementById("npwd-show");
  if(btn)btn.textContent=showNewEye?"🙈 Скрыть пароль":"👁 Показать пароль";
}

function resetToPhoneStep(){
  const pForm=document.getElementById("phone-login-form");
  if(pForm){pForm.innerHTML=renderPhoneStep();}
}

function doPhoneLogin(){
  const pwd=document.getElementById("pwd-inp")?.value||"";
  const errEl=document.getElementById("pwd-err");
  const rec=DB.registeredPhones[phoneValue];
  if(!rec){errEl.textContent="Аккаунт не найден";errEl.style.display="";return;}
  if(pwd!==rec.password){errEl.textContent="Неверный пароль";errEl.style.display="";return;}
  if(isOwnerPhone(phoneValue)){doLogin({...OWNER_USER});return;}
  const user=DB.users.find(u=>u.id===rec.userId);
  if(!user){errEl.textContent="Пользователь не найден";errEl.style.display="";return;}
  if(user.banned){errEl.textContent="Аккаунт заблокирован";errEl.style.display="";return;}
  errEl.style.display="none";
  doLogin({...user});
}

function doPhoneRegister(){
  const pwd=document.getElementById("npwd-inp")?.value||"";
  const conf=document.getElementById("npwd-confirm")?.value||"";
  const errEl=document.getElementById("npwd-err");
  if(pwd.length<6){errEl.textContent="Минимум 6 символов";errEl.style.display="";return;}
  if(pwd!==conf){errEl.textContent="Пароли не совпадают";errEl.style.display="";return;}
  const d=phoneValue;
  const isAnon=isAnonPhone(d);
  const isOwner=isOwnerPhone(d);
  const newId="u"+Date.now();
  const anonNum=d.slice(-4);
  const newUser={
    id:newId,username:(isAnon?"anon_":"user_")+d.slice(-4),
    fullName:isAnon?`Аноним #${anonNum}`:isOwner?"Владелец Volt":"Пользователь",
    avatar:null,phone:d,hidePhone:isAnon||isOwner,
    bio:isAnon?"👤 Анонимный аккаунт":isOwner?"👑 Создатель":"",
    online:true,lastSeen:null,premium:isAnon||isOwner,role:isOwner?"owner":"user",banned:false,
  };
  DB.users.push(newUser);
  DB.messages[newId]=[];
  DB.registeredPhones[d]={userId:newId,password:pwd};
  errEl.style.display="none";
  doLogin({...newUser});
}

function doLogin(user){
  AppState.currentUser=user;
  if(!DB.messages[user.id])DB.messages[user.id]=[];
  AppState.screen="app";
  AppState.tab="chats";
  render();
}

function handleLogout(){
  AppState.currentUser=null;
  AppState.screen="login";
  AppState.tab="chats";
  loginTab="phone";
  render();
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function renderApp(){
  const u = AppState.currentUser;
  const isOwner = u?.role==="owner";
  const tabs=[
    {id:"chats",icon:"💬",label:"Чаты"},
    {id:"favorites",icon:"⭐",label:"Избранное"},
    ...(isOwner?[{id:"admin",icon:"👑",label:"Админ"}]:[]),
    {id:"settings",icon:"⚙️",label:"Настройки"},
    {id:"profile",icon:"👤",label:"Профиль"},
  ];
  const totalUnread = DB.users.filter(x=>x.id!==u.id)
    .reduce((acc,x)=>acc+(DB.messages[x.id]||[]).filter(m=>m.from!=="me"&&!m.read).length,0);

  const tabBar = tabs.map(t=>{
    const isActive = AppState.tab===t.id;
    const cls = `tab-item${isActive?(t.id==="admin"?" admin-active":" active"):""}`;
    const badge = t.id==="chats"&&totalUnread>0
      ? `<span class="tab-badge">${totalUnread}</span>` : "";
    return `<button class="${cls}" onclick="setTab('${t.id}')">
      <span class="tab-icon">${t.icon}${badge}</span>
      <span style="margin-top:2px;">${t.label}</span>
    </button>`;
  }).join("");

  const ownerBar = isOwner && AppState.tab!=="admin"
    ? `<div class="owner-topbar"><span>👑 Режим владельца · +${OWNER_PHONE}</span><button class="admin-link-btn" onclick="setTab('admin')">Админ-панель →</button></div>` : "";

  let content="";
  if(AppState.tab==="chats")content=renderChatsTab();
  else if(AppState.tab==="favorites")content=renderFavoritesTab();
  else if(AppState.tab==="settings")content=renderSettingsTab();
  else if(AppState.tab==="profile")content=renderProfileTab();
  else if(AppState.tab==="admin"&&isOwner)content=renderAdminPanel();

  return `${ownerBar}<div class="main-content">${content}</div><div class="tab-bar">${tabBar}</div>`;
}

function setTab(t){AppState.tab=t;render();}

// ─── Chats Tab ────────────────────────────────────────────────────────────────
let showChatSearch=false;
function renderChatsTab(){
  const u=AppState.currentUser;
  const chatUsers=DB.users.filter(x=>x.id!==u.id&&!DB.archived.includes(x.id));
  const totalUnread=chatUsers.reduce((acc,x)=>acc+(DB.messages[x.id]||[]).filter(m=>m.from!=="me"&&!m.read).length,0);
  const searchSection=showChatSearch?`<div class="search-inp-wrap"><input class="search-inp" id="chat-search-q" placeholder="🔍 Найти по @username..." oninput="renderChatSearchResults()"></div><div id="chat-search-results"></div>`:"";
  const chatList=chatUsers.map(x=>{
    const msgs=DB.messages[x.id]||[];
    const last=msgs.filter(m=>!m.deleted)[msgs.filter(m=>!m.deleted).length-1];
    const unread=msgs.filter(m=>m.from!=="me"&&!m.read).length;
    const muted=DB.muted.includes(x.id);
    const preview=last?(last.deleted?"Сообщение удалено":((last.from==="me"?"Вы: ":"")+last.text)):"Нет сообщений";
    const badge=unread>0&&!muted?`<div class="unread-badge">${unread}</div>`:"";
    return `<div class="chat-item" onclick="openChat('${x.id}')">
      ${avatarHtml(x,48,true)}
      <div class="chat-info">
        <div class="chat-name-row">
          <span class="chat-name">${x.fullName}${badgesHtml(x)}</span>
          <span class="chat-time">${last?.time||""}</span>
        </div>
        <div class="chat-preview">${muted?"🔕 ":""}${preview}</div>
      </div>
      ${badge}
    </div>`;
  }).join("");
  return `<div style="padding-bottom:20px;">
    <div class="page-header">
      <div class="page-title">Чаты${totalUnread>0?`<span class="unread-badge">${totalUnread}</span>`:""}</div>
      <button class="icon-btn" style="font-size:20px;" onclick="showChatSearch=!showChatSearch;render()">✏️</button>
    </div>
    ${searchSection}
    ${chatList}
  </div>`;
}
function renderChatSearchResults(){
  const q=document.getElementById("chat-search-q")?.value||"";
  const container=document.getElementById("chat-search-results");
  if(!container)return;
  if(q.length<2){container.innerHTML="";return;}
  const u=AppState.currentUser;
  const results=DB.users.filter(x=>x.id!==u.id&&x.username.includes(q.replace("@",""))&&!DB.blocked.includes(x.id));
  container.innerHTML=results.map(x=>`
    <div class="user-row clickable" onclick="openChat('${x.id}');showChatSearch=false;">
      ${avatarHtml(x,42,true)}
      <div style="flex:1;"><div style="font-weight:600;color:var(--text);display:flex;align-items:center;">${x.fullName}${badgesHtml(x)}</div><div style="font-size:12px;color:var(--sub);">@${x.username}</div></div>
      <button class="write-btn">Написать</button>
    </div>`).join("")+(results.length===0?`<div class="no-results">Не найдено</div>`:"");
}

function openChat(userId){
  const user=DB.users.find(u=>u.id===userId);
  if(!user)return;
  // mark read
  const msgs=DB.messages[userId]||[];
  DB.messages[userId]=msgs.map(m=>m.from!=="me"?{...m,read:true}:m);
  AppState.openChat=userId;
  AppState.screen="chat";
  chatState={text:"",replyTo:null,editMsg:null,typing:false,showSearch:false,searchQ:"",menuMsgId:null,emojiMsgId:null};
  render();
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
let chatState={text:"",replyTo:null,editMsg:null,typing:false,showSearch:false,searchQ:"",menuMsgId:null,emojiMsgId:null};
let typingTimeout=null;

function renderChatWindow(){
  const uid=AppState.openChat;
  const user=DB.users.find(u=>u.id===uid);
  const msgs=DB.messages[uid]||[];
  const cs=chatState;
  const isBlocked=DB.blocked.includes(uid);

  const displayed=cs.showSearch&&cs.searchQ.trim()
    ? msgs.filter(m=>!m.deleted&&m.text.toLowerCase().includes(cs.searchQ.toLowerCase()))
    : msgs;

  const messagesHtml=displayed.map(m=>renderBubble(m,msgs)).join("");
  const typingHtml=cs.typing
    ? `<div class="typing-row">${avatarHtml(user,28)}<div class="typing-bubble">${[0,1,2].map(i=>`<div class="typing-dot" style="animation:bounce 1s ${i*0.15}s infinite;"></div>`).join("")}</div></div>`
    : "";

  const replyBar = (cs.replyTo||cs.editMsg)
    ? `<div class="reply-bar"><div class="reply-bar-info"><div class="reply-bar-label">${cs.editMsg?"Редактирование":"Ответ:"}</div><div class="reply-bar-text">${(cs.editMsg||cs.replyTo)?.text}</div></div><button class="reply-close" onclick="clearReply()">✕</button></div>`
    : "";

  const inputRow = !isBlocked
    ? `<div class="msg-input-row">
        <input class="msg-input" id="msg-inp" placeholder="${cs.editMsg?"Редактировать...":"Сообщение..."}" value="${escHtml(cs.text)}" oninput="cs_text(this.value)" onkeydown="if(event.key==='Enter')sendMessage()" style="font-size:${AppState.fontSize}px;">
        <button class="send-btn" onclick="sendMessage()">${cs.editMsg?"✓":"➤"}</button>
      </div>`
    : "";

  const overlay = cs.menuMsgId ? renderCtxMenu(cs.menuMsgId,msgs,uid) : "";
  const emojiOverlay = cs.emojiMsgId ? renderEmojiOverlay(cs.emojiMsgId) : "";

  return `<div class="chat-window">
    <div class="chat-header">
      <button class="back-btn" onclick="closeChat()">←</button>
      ${avatarHtml(user,38,true)}
      <div class="chat-header-info">
        <div class="chat-header-name">${user.fullName}${badgesHtml(user)}</div>
        <div class="chat-header-status ${user.online?"online":"offline"}">${user.online?"онлайн":`был(а) ${lastSeenText(user.lastSeen)}`}</div>
      </div>
      <button class="icon-btn" onclick="toggleChatSearch()">🔍</button>
    </div>
    ${cs.showSearch?`<div class="chat-search-bar"><input class="chat-search-inp" id="chat-srch" placeholder="Поиск по переписке..." value="${escHtml(cs.searchQ)}" oninput="cs_searchQ(this.value)"></div>`:""}
    ${isBlocked?`<div class="blocked-bar">Пользователь заблокирован</div>`:""}
    <div class="messages-area" id="messages-area">
      ${displayed.length===0&&!cs.typing?`<div class="empty-chat">Начните переписку 👋</div>`:""}
      ${messagesHtml}
      ${typingHtml}
      <div id="msg-end"></div>
    </div>
    ${replyBar}
    ${inputRow}
    ${overlay}
    ${emojiOverlay}
  </div>`;
}

function renderBubble(m, allMsgs){
  const isMe=m.from==="me";
  const replyMsg=m.replyTo?allMsgs.find(x=>x.id===m.replyTo):null;
  const reactionEntries=Object.entries(m.reactions||{}).filter(([,v])=>v>0);
  if(m.deleted){
    return `<div class="bubble-row ${isMe?"me":"them"}"><div class="bubble-deleted">Сообщение удалено</div></div>`;
  }
  const replyHtml=replyMsg?`<div class="reply-preview" style="background:${isMe?"rgba(255,255,255,0.15)":"var(--bubble)"}">${replyMsg.deleted?"Удалённое":replyMsg.text.slice(0,60)}</div>`:"";
  const reactionsHtml=reactionEntries.length>0
    ?`<div class="reactions-row" style="justify-content:${isMe?"flex-end":"flex-start"}">${reactionEntries.map(([e,c])=>`<span class="reaction-chip" onclick="reactMsg('${m.id}','${e}')">${e} ${c}</span>`).join("")}</div>`:"";
  const metaHtml=`<div class="bubble-meta ${isMe?"me":"them"}">${m.edited?`<span>ред.</span>`:""}<span>${m.time}</span>${isMe?`<span>${m.read?"✓✓":"✓"}</span>`:""}</div>`;
  return `<div class="bubble-row ${isMe?"me":"them"}" oncontextmenu="event.preventDefault();openCtxMenu('${m.id}')">
    <div class="bubble-wrap">
      ${replyHtml}
      <div class="bubble-body ${isMe?"me":"them"}" ondblclick="openEmojiOverlay('${m.id}')">
        <div style="font-size:14px;">${escHtml(m.text)}</div>
        ${metaHtml}
      </div>
      ${reactionsHtml}
    </div>
  </div>`;
}

function renderCtxMenu(msgId, msgs, uid){
  const m=msgs.find(x=>x.id==msgId);
  const isMe=m?.from==="me";
  const items=[
    {icon:"↩️",label:"Ответить",fn:`replyMsg_action('${msgId}')`},
    {icon:"😊",label:"Реакция",fn:`openEmojiOverlay('${msgId}')`},
    ...(isMe?[
      {icon:"✏️",label:"Редактировать",fn:`editMsg_action('${msgId}')`},
      {icon:"🗑️",label:"Удалить",fn:`deleteMsg('${msgId}')`,danger:true},
    ]:[]),
  ];
  return `<div class="ctx-overlay" onclick="closeCtxMenu()"><div class="ctx-menu" onclick="event.stopPropagation()">${items.map(item=>`<div class="ctx-item${item.danger?" danger":""}" onclick="${item.fn};closeCtxMenu()">${item.icon} ${item.label}</div>`).join("")}</div></div>`;
}
function renderEmojiOverlay(msgId){
  return `<div class="ctx-overlay" onclick="closeEmojiOverlay()"><div style="background:var(--card);border:1px solid var(--border);border-radius:20px;padding:6px 10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);" onclick="event.stopPropagation()"><div style="display:flex;gap:6px;">${REACTIONS_LIST.map(e=>`<button class="emoji-btn" onclick="reactMsg('${msgId}','${e}');closeEmojiOverlay()">${e}</button>`).join("")}</div></div></div>`;
}

function escHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cs_text(v){chatState.text=v;}
function cs_searchQ(v){chatState.searchQ=v;rerenderMessages();}
function clearReply(){chatState.replyTo=null;chatState.editMsg=null;chatState.text="";rerenderChatInputArea();}
function toggleChatSearch(){chatState.showSearch=!chatState.showSearch;chatState.searchQ="";render();}
function openCtxMenu(id){chatState.menuMsgId=id;rerenderOverlay();}
function closeCtxMenu(){chatState.menuMsgId=null;rerenderOverlay();}
function openEmojiOverlay(id){chatState.emojiMsgId=id;rerenderOverlay();}
function closeEmojiOverlay(){chatState.emojiMsgId=null;rerenderOverlay();}

function sendMessage(){
  const uid=AppState.openChat;
  const t=document.getElementById("msg-inp")?.value.trim()||chatState.text.trim();
  if(!t)return;
  const msgs=DB.messages[uid]||[];
  if(chatState.editMsg){
    DB.messages[uid]=msgs.map(m=>m.id===chatState.editMsg.id?{...m,text:t,edited:true}:m);
    chatState.editMsg=null;chatState.text="";
    rerenderMessages(); rerenderChatInputArea();
    return;
  }
  const newMsg={id:Date.now(),from:"me",text:t,time:nowTime(),read:false,reactions:{},replyTo:chatState.replyTo?.id||null,edited:false,deleted:false};
  DB.messages[uid]=[...msgs,newMsg];
  chatState.text="";chatState.replyTo=null;chatState.typing=true;
  rerenderMessages(); rerenderChatInputArea();
  if(typingTimeout)clearTimeout(typingTimeout);
  typingTimeout=setTimeout(()=>{
    chatState.typing=false;
    const replies=["Понял 👍","Окей!","Хорошо!","Договорились 🤝","👌","Сейчас посмотрю","Ок!","👍","Понял тебя"];
    const r={id:Date.now()+1,from:uid,text:replies[Math.floor(Math.random()*replies.length)],time:nowTime(),read:false,reactions:{},replyTo:null,edited:false,deleted:false};
    DB.messages[uid]=[...DB.messages[uid],r];
    rerenderMessages();
  },1500);
}

function replyMsg_action(id){
  const uid=AppState.openChat;
  const msgs=DB.messages[uid]||[];
  chatState.replyTo=msgs.find(m=>m.id==id)||null;
  chatState.editMsg=null;
  rerenderChatInputArea();
  document.getElementById("msg-inp")?.focus();
}
function editMsg_action(id){
  const uid=AppState.openChat;
  const msgs=DB.messages[uid]||[];
  const m=msgs.find(x=>x.id==id);
  if(!m)return;
  chatState.editMsg=m;chatState.replyTo=null;chatState.text=m.text;
  rerenderChatInputArea();
  const inp=document.getElementById("msg-inp");
  if(inp){inp.value=m.text;inp.focus();}
}
function deleteMsg(id){
  const uid=AppState.openChat;
  DB.messages[uid]=(DB.messages[uid]||[]).map(m=>m.id==id?{...m,deleted:true}:m);
  rerenderMessages();
}
function reactMsg(id,emoji){
  const uid=AppState.openChat;
  DB.messages[uid]=(DB.messages[uid]||[]).map(m=>{
    if(m.id!=id)return m;
    const r={...m.reactions};r[emoji]=(r[emoji]||0)+1;return{...m,reactions:r};
  });
  rerenderMessages();
}
function rerenderMessages(){
  const uid=AppState.openChat;
  const msgs=DB.messages[uid]||[];
  const cs=chatState;
  const displayed=cs.showSearch&&cs.searchQ.trim()
    ?msgs.filter(m=>!m.deleted&&m.text.toLowerCase().includes(cs.searchQ.toLowerCase()))
    :msgs;
  const area=document.getElementById("messages-area");
  if(!area)return;
  const typingHtml=cs.typing?`<div class="typing-row">${avatarHtml(DB.users.find(u=>u.id===uid),28)}<div class="typing-bubble">${[0,1,2].map(i=>`<div class="typing-dot" style="animation:bounce 1s ${i*0.15}s infinite;"></div>`).join("")}</div></div>`:"";
  area.innerHTML=(displayed.length===0&&!cs.typing?`<div class="empty-chat">Начните переписку 👋</div>`:"")+displayed.map(m=>renderBubble(m,msgs)).join("")+typingHtml+`<div id="msg-end"></div>`;
  document.getElementById("msg-end")?.scrollIntoView({behavior:"smooth"});
}
function rerenderChatInputArea(){
  // Full re-render is cheap here
  render();
  setTimeout(()=>{const inp=document.getElementById("msg-inp");if(inp)inp.focus();},50);
}
function rerenderOverlay(){
  const uid=AppState.openChat;
  const msgs=DB.messages[uid]||[];
  const existing=document.querySelector(".ctx-overlay");
  if(existing)existing.remove();
  const cs=chatState;
  if(cs.menuMsgId){
    const el=document.createElement("div");
    el.innerHTML=renderCtxMenu(cs.menuMsgId,msgs,uid);
    document.getElementById("app").appendChild(el.firstChild);
  } else if(cs.emojiMsgId){
    const el=document.createElement("div");
    el.innerHTML=renderEmojiOverlay(cs.emojiMsgId);
    document.getElementById("app").appendChild(el.firstChild);
  }
}
function closeChat(){
  AppState.screen="app";AppState.openChat=null;
  if(typingTimeout)clearTimeout(typingTimeout);
  chatState={text:"",replyTo:null,editMsg:null,typing:false,showSearch:false,searchQ:"",menuMsgId:null,emojiMsgId:null};
  render();
}

// ─── Favorites Tab ────────────────────────────────────────────────────────────
function renderFavoritesTab(){
  const u=AppState.currentUser;
  const favs=DB.users.filter(x=>DB.favorites.includes(x.id));
  const others=DB.users.filter(x=>x.id!==u.id&&!DB.favorites.includes(x.id));
  const favHtml=favs.length===0
    ?`<div style="text-align:center;color:var(--sub);margin-top:50px;"><div style="font-size:44px;">⭐</div><div style="margin-top:10px;font-size:14px;">Нет избранных</div></div>`
    :favs.map(x=>`<div class="user-row clickable" onclick="openChat('${x.id}')">${avatarHtml(x,48,true)}<div style="flex:1;"><div style="font-weight:600;color:var(--text);display:flex;align-items:center;">${x.fullName}${badgesHtml(x)}</div><div style="font-size:12px;color:var(--sub);">@${x.username}</div></div><button onclick="event.stopPropagation();toggleFav('${x.id}')" style="background:transparent;border:none;cursor:pointer;color:#f59e0b;font-size:20px;">★</button></div>`).join("");
  const othersHtml=others.length>0?`<div style="padding:12px 16px 6px;font-size:11px;color:var(--sub);text-transform:uppercase;letter-spacing:1px;">Все контакты</div>`+others.map(x=>`<div class="user-row">${avatarHtml(x,40)}<div style="flex:1;color:var(--text);font-size:14px;display:flex;align-items:center;">${x.fullName}${badgesHtml(x)}</div><button onclick="toggleFav('${x.id}')" style="background:transparent;border:none;cursor:pointer;color:var(--sub);font-size:20px;">☆</button></div>`).join(""):"";
  return `<div style="padding-bottom:20px;">
    <div class="page-header"><div class="page-title">Избранное ⭐</div></div>
    ${favHtml}${othersHtml}
  </div>`;
}
function toggleFav(id){const i=DB.favorites.indexOf(id);if(i>=0)DB.favorites.splice(i,1);else DB.favorites.push(id);render();}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
let editingProfile=false;
function renderProfileTab(){
  const u=AppState.currentUser;
  const totalMsgs=Object.values(DB.messages).flat().filter(m=>m.from==="me").length;
  if(editingProfile){
    return `<div style="padding-bottom:24px;">
      <div class="page-header"><div class="page-title">Профиль</div></div>
      <div class="profile-center">
        <div class="profile-avatar-wrap" onclick="triggerAvatarUpload()">
          ${avatarHtml(u,90)}
          <div class="profile-camera">📷</div>
        </div>
        <input type="file" accept="image/*" id="avatar-inp" style="display:none;" onchange="handleAvatarChange(event)">
        <div style="font-size:11px;color:var(--sub);margin-top:6px;">Нажмите для смены фото</div>
        <div class="edit-form">
          <input class="inp" id="edit-name" placeholder="Имя и фамилия" value="${escHtml(u.fullName)}">
          <input class="inp" id="edit-username" placeholder="@username" value="${escHtml(u.username)}">
          <textarea class="inp" id="edit-bio" placeholder="О себе..." style="resize:vertical;min-height:70px;">${escHtml(u.bio||"")}</textarea>
          <div class="edit-form-btns">
            <button class="save-btn" onclick="saveProfile()">Сохранить</button>
            <button class="cancel-btn" onclick="editingProfile=false;render()">Отмена</button>
          </div>
        </div>
      </div>
    </div>`;
  }
  return `<div style="padding-bottom:24px;">
    <div class="page-header"><div class="page-title">Профиль</div></div>
    <div class="profile-center">
      <div class="profile-avatar-wrap" onclick="triggerAvatarUpload()">
        ${avatarHtml(u,90)}
        <div class="profile-camera">📷</div>
      </div>
      <input type="file" accept="image/*" id="avatar-inp" style="display:none;" onchange="handleAvatarChange(event)">
      <div style="font-size:11px;color:var(--sub);margin-top:6px;">Нажмите для смены фото</div>
      <div style="text-align:center;margin-top:16px;width:100%;">
        <div class="profile-name">${escHtml(u.fullName)}${badgesHtml(u)}</div>
        <div class="profile-username">@${escHtml(u.username)}</div>
        ${!u.hidePhone&&u.phone?`<div class="profile-phone">+${u.phone}</div>`:""}
        ${u.bio?`<div class="profile-bio">${escHtml(u.bio)}</div>`:""}
        ${u.premium?`<div style="margin-top:12px;padding:0 16px;">${premiumBlockHtml()}</div>`:""}
        <button class="edit-btn" onclick="editingProfile=true;render()">✏️ Редактировать</button>
      </div>
    </div>
    <div class="stats-row">
      ${[["Чатов",DB.users.length-1],["Избранных",DB.favorites.length],["Сообщений",totalMsgs]].map(([label,val])=>`<div class="stat-cell"><div class="stat-val">${val}</div><div class="stat-label">${label}</div></div>`).join("")}
    </div>
  </div>`;
}
function triggerAvatarUpload(){document.getElementById("avatar-inp")?.click();}
function handleAvatarChange(e){
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=ev=>{AppState.currentUser={...AppState.currentUser,avatar:ev.target.result};render();};
  r.readAsDataURL(file);
}
function saveProfile(){
  const name=document.getElementById("edit-name")?.value.trim()||AppState.currentUser.fullName;
  const username=document.getElementById("edit-username")?.value.trim()||AppState.currentUser.username;
  const bio=document.getElementById("edit-bio")?.value||"";
  AppState.currentUser={...AppState.currentUser,fullName:name,username,bio};
  editingProfile=false;render();
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function renderSettingsTab(){
  const u=AppState.currentUser;
  const rows=(label,children)=>`<div class="settings-row"><span>${label}</span>${children}</div>`;
  const toggle=(label,val,fn)=>`<div class="settings-row toggle-row" onclick="${fn}"><span>${label}</span><div class="toggle-track ${val?"on":""}"><div class="toggle-thumb"></div></div></div>`;
  const section=(title,icon,content)=>`<div class="settings-section"><div class="settings-section-title">${icon} ${title}</div><div class="settings-section-body">${content}</div></div>`;

  return `<div style="padding-bottom:24px;">
    <div class="page-header"><div class="page-title">Настройки</div></div>
    ${section("Внешний вид","🎨",
      rows("Тема",`<div style="display:flex;gap:6px;">${["dark","light"].map(t=>`<button onclick="setTheme('${t}')" style="padding:5px 14px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid var(--border);background:${AppState.theme===t?"var(--accent)":"var(--bubble)"};color:${AppState.theme===t?"#fff":"var(--sub)"};">${t==="dark"?"🌙 Тёмная":"☀️ Светлая"}</button>`).join("")}</div>`)+
      rows("Шрифт",`<div style="display:flex;gap:6px;">${[{v:13,l:"A",s:11},{v:15,l:"A",s:13},{v:17,l:"A",s:15}].map(({v,l,s})=>`<button onclick="setFontSz(${v})" style="padding:5px 12px;border-radius:20px;font-size:${s}px;cursor:pointer;border:1px solid var(--border);background:${AppState.fontSize===v?"var(--accent)":"var(--bubble)"};color:${AppState.fontSize===v?"#fff":"var(--sub)"};">${l}</button>`).join("")}</div>`)
    )}
    ${section("Конфиденциальность","🔒",
      toggle("Скрыть номер телефона",u.hidePhone||false,"toggleHidePhone()")+
      rows("Поиск по username",`<span style="color:var(--accent);font-size:12px;">Включён</span>`)
    )}
    ${section("Управление чатами","💬",DB.users.filter(x=>x.id!==u.id).map(x=>`
      <div style="padding:10px 16px;border-bottom:1px solid var(--divider);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">${avatarHtml(x,32)}<span style="font-weight:600;color:var(--text);font-size:14px;">${escHtml(x.fullName)}</span></div>
        <div class="action-btns" style="padding-left:0!important;">
          <button class="action-btn" onclick="toggleMute('${x.id}')">${DB.muted.includes(x.id)?"🔔 Звук":"🔕 Мут"}</button>
          <button class="action-btn" onclick="toggleArchive('${x.id}')">${DB.archived.includes(x.id)?"📤 Из архива":"📦 Архив"}</button>
          <button class="action-btn ${DB.blocked.includes(x.id)?"":"ban"}" onclick="toggleBlock('${x.id}')">${DB.blocked.includes(x.id)?"✓ Разблок":"🚫 Блок"}</button>
        </div>
      </div>`).join("")
    )}
    ${section("О приложении","💬",
      rows("Версия",`<span style="color:var(--sub);font-size:13px;">2.2.0</span>`)+
      rows("Название",`<span style="color:var(--sub);font-size:13px;">Volt Messenger</span>`)
    )}
    ${section("Аккаунт","👤",
      rows("Имя",`<span style="color:var(--sub);font-size:13px;">${escHtml(u.fullName)}</span>`)+
      rows("Username",`<span style="color:var(--accent);font-size:13px;">@${escHtml(u.username)}</span>`)+
      (u.phone?rows("Номер",`<span style="color:var(--sub);font-size:13px;">${u.hidePhone?"скрыт":"+"+u.phone}</span>`):"")
    )}
    <div style="padding:0 16px;"><button class="logout-btn" onclick="handleLogout()">Выйти из аккаунта</button></div>
  </div>`;
}
function setTheme(t){AppState.theme=t;applyTheme();render();}
function setFontSz(v){AppState.fontSize=v;applyFontSize();render();}
function toggleHidePhone(){AppState.currentUser={...AppState.currentUser,hidePhone:!AppState.currentUser.hidePhone};render();}
function toggleMute(id){const i=DB.muted.indexOf(id);if(i>=0)DB.muted.splice(i,1);else DB.muted.push(id);render();}
function toggleBlock(id){const i=DB.blocked.indexOf(id);if(i>=0)DB.blocked.splice(i,1);else DB.blocked.push(id);render();}
function toggleArchive(id){const i=DB.archived.indexOf(id);if(i>=0)DB.archived.splice(i,1);else DB.archived.push(id);render();}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
let adminTab="users", adminSearch="", adminEditUser=null, adminBroadcastMsg="", adminBroadcastSent=false;
let adminNewPhone="", adminNewPwd="";
let adminLogs=[
  {time:"10:23",action:"Вход",user:"alexey_k",ip:"192.168.1.1"},
  {time:"09:15",action:"Регистрация",user:"anon_7777",ip:"10.0.0.5"},
  {time:"08:44",action:"Смена пароля",user:"marina_v",ip:"172.16.0.3"},
];
function addAdminLog(action,user){adminLogs=[{time:nowTime(),action,user,ip:"127.0.0.1"},...adminLogs].slice(0,20);}

function renderAdminPanel(){
  const tabs=[["users","👥","Юзеры"],["stats","📊","Статистика"],["add","➕","Добавить"],["broadcast","📢","Рассылка"],["logs","📋","Логи"]];
  const tabBar=tabs.map(([id,icon,label])=>`<button class="admin-tab${adminTab===id?" active":""}" onclick="setAdminTab('${id}')">${icon}</button>`).join("");
  const labelBar=tabs.map(([id,,label])=>`<span class="admin-tab-label${adminTab===id?" active":""}">${label}</span>`).join("");

  let content="";
  if(adminTab==="users")content=renderAdminUsers();
  else if(adminTab==="stats")content=renderAdminStats();
  else if(adminTab==="add")content=renderAdminAdd();
  else if(adminTab==="broadcast")content=renderAdminBroadcast();
  else if(adminTab==="logs")content=renderAdminLogs();

  return `<div style="min-height:100vh;">
    <div class="admin-header">
      <button class="back-btn" style="color:#f59e0b;" onclick="setTab('chats')">←</button>
      <div style="flex:1;"><div class="admin-title">👑 Админ-панель</div><div class="admin-sub">Volt Messenger · Владелец · +${OWNER_PHONE}</div></div>
      <div class="online-pill">● Онлайн</div>
    </div>
    <div class="admin-tabs">${tabBar}</div>
    <div class="admin-tab-labels">${labelBar}</div>
    ${content}
  </div>`;
}
function setAdminTab(t){adminTab=t;render();}

function renderAdminStats(){
  const totalMsgs=Object.values(DB.messages).flat().length;
  const stats=[
    {icon:"👥",label:"Всего юзеров",val:DB.users.length,color:"#4f7cff"},
    {icon:"🟢",label:"Онлайн",val:DB.users.filter(u=>u.online).length,color:"#22c55e"},
    {icon:"⭐",label:"Premium",val:DB.users.filter(u=>u.premium).length,color:"#f59e0b"},
    {icon:"🚫",label:"Забанено",val:DB.users.filter(u=>u.banned).length,color:"#ef4444"},
    {icon:"👤",label:"Анонимных",val:DB.users.filter(u=>isAnonPhone(u.phone)).length,color:"#a78bfa"},
    {icon:"💬",label:"Сообщений",val:totalMsgs,color:"#06b6d4"},
  ];
  const bars=[20,40,80,60,30,70,100,90,50,45,65,80];
  return `<div style="padding:16px;">
    <div class="stat-grid">${stats.map(s=>`<div class="stat-card"><div class="stat-card-icon">${s.icon}</div><div class="stat-card-val" style="color:${s.color};">${s.val}</div><div class="stat-card-label">${s.label}</div></div>`).join("")}</div>
    <div class="activity-chart">
      <div class="activity-title">АКТИВНОСТЬ ПО ЧАСАМ</div>
      <div class="bars-row">${bars.map(h=>`<div class="bar" style="background:rgba(79,124,255,${0.3+h/200});height:${h}%;"></div>`).join("")}</div>
      <div class="bar-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
    </div>
  </div>`;
}

function renderAdminUsers(){
  const q=adminSearch.toLowerCase();
  const filtered=DB.users.filter(u=>u.fullName.toLowerCase().includes(q)||u.username.toLowerCase().includes(q)||u.phone.includes(adminSearch.replace(/\D/g,"")));
  return `<div>
    <div style="padding:10px 16px;"><input class="search-inp" id="admin-search-inp" value="${escHtml(adminSearch)}" placeholder="🔍 Поиск по имени, нику, номеру..." oninput="adminSearch=this.value;renderAdminUsersInPlace()"></div>
    <div id="admin-users-list">${renderAdminUsersList(filtered)}</div>
  </div>`;
}
function renderAdminUsersList(filtered){
  return filtered.map(u=>`
    <div class="user-card${u.banned?" banned":""}${adminEditUser?.id===u.id?" editing":""}">
      <div class="user-card-main">
        ${avatarHtml(u,42,true)}
        <div style="flex:1;min-width:0;">
          <div class="user-card-name">${escHtml(u.fullName)}${badgesHtml(u)}${u.banned?`<span style="font-size:10px;color:#ef4444;margin-left:4px;">🚫</span>`:""}</div>
          <div class="user-card-sub">@${escHtml(u.username)} · ${u.hidePhone?"скрыт":"+"+u.phone}</div>
        </div>
        <button class="expand-btn" onclick="toggleAdminEdit('${u.id}')">${adminEditUser?.id===u.id?"✕":"···"}</button>
      </div>
      ${adminEditUser?.id===u.id?`<div class="action-btns">
        <button class="action-btn${u.premium?" premium":""}" onclick="adminTogglePremium('${u.id}')">${u.premium?"⭐ Снять":"⭐ Дать Premium"}</button>
        <button class="action-btn${u.banned?" unban":" ban"}" onclick="adminToggleBan('${u.id}')">${u.banned?"✓ Разбанить":"🚫 Забанить"}</button>
        ${u.role!=="owner"?`<button class="action-btn del" onclick="adminDeleteUser('${u.id}')">🗑 Удалить</button>`:""}
      </div>`:""}
    </div>`).join("")+(filtered.length===0?`<div style="text-align:center;color:var(--sub);padding:40px;font-size:13px;">Ничего не найдено</div>`:"");
}
function renderAdminUsersInPlace(){
  const q=adminSearch.toLowerCase();
  const filtered=DB.users.filter(u=>u.fullName.toLowerCase().includes(q)||u.username.toLowerCase().includes(q)||u.phone.includes(adminSearch.replace(/\D/g,"")));
  const el=document.getElementById("admin-users-list");
  if(el)el.innerHTML=renderAdminUsersList(filtered);
}
function toggleAdminEdit(id){adminEditUser=adminEditUser?.id===id?null:DB.users.find(u=>u.id===id)||null;renderAdminUsersInPlace();}
function adminTogglePremium(id){DB.users.forEach(u=>{if(u.id===id)u.premium=!u.premium;});addAdminLog("Premium toggle",DB.users.find(u=>u.id===id)?.username||id);renderAdminUsersInPlace();}
function adminToggleBan(id){DB.users.forEach(u=>{if(u.id===id)u.banned=!u.banned;});addAdminLog(DB.users.find(u=>u.id===id)?.banned?"Бан":"Разбан",DB.users.find(u=>u.id===id)?.username||id);renderAdminUsersInPlace();}
function adminDeleteUser(id){if(!confirm("Удалить пользователя?"))return;const idx=DB.users.findIndex(u=>u.id===id);if(idx>=0){addAdminLog("Удалён",DB.users[idx].username);DB.users.splice(idx,1);}adminEditUser=null;renderAdminUsersInPlace();}

function renderAdminAdd(){
  return `<div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
    <div class="add-anon-hint">👤 Создать анонимный аккаунт (+888XXXXXXX)<br><span style="font-size:11px;color:var(--sub);">Номер должен начинаться с 888. Premium активируется автоматически.</span></div>
    <input class="inp" id="anon-phone-inp" value="${escHtml(adminNewPhone)}" placeholder="+888 1234567" oninput="adminNewPhone=this.value">
    <input class="inp" id="anon-pwd-inp" type="password" value="${escHtml(adminNewPwd)}" placeholder="Пароль для аккаунта" oninput="adminNewPwd=this.value">
    <button style="padding:12px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:12px;color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;" onclick="adminAddAnon()">👤 Создать анонимный аккаунт</button>
    <div style="margin-top:8px;border-top:1px solid var(--divider);padding-top:12px;">
      <div class="anon-list-header">Существующие анонимные номера:</div>
      ${DB.users.filter(u=>isAnonPhone(u.phone)).map(u=>`<div class="anon-item">${avatarHtml(u,32)}<div style="flex:1;"><div style="font-size:13px;color:var(--text);font-weight:600;">@${escHtml(u.username)}</div><div style="font-size:11px;color:var(--sub);">+${u.phone}</div></div></div>`).join("")}
      ${DB.users.filter(u=>isAnonPhone(u.phone)).length===0?`<div style="color:var(--sub);font-size:12px;">Нет анонимных аккаунтов</div>`:""}
    </div>
  </div>`;
}
function adminAddAnon(){
  const phone=document.getElementById("anon-phone-inp")?.value||adminNewPhone;
  const pwd=document.getElementById("anon-pwd-inp")?.value||adminNewPwd;
  if(!phone||!pwd)return;
  const d=phone.replace(/\D/g,"");
  if(DB.registeredPhones[d]){alert("Номер уже существует");return;}
  const newId="u"+Date.now();
  const anonNum=d.slice(-4);
  const nu={id:newId,username:"anon_"+anonNum,fullName:"Аноним #"+anonNum,avatar:null,phone:d,hidePhone:true,bio:"👤 Анонимный аккаунт",online:false,lastSeen:null,premium:true,role:"user",banned:false};
  DB.users.push(nu);DB.messages[newId]=[];DB.registeredPhones[d]={userId:newId,password:pwd};
  addAdminLog("Создан анонимный","anon_"+anonNum);
  adminNewPhone="";adminNewPwd="";render();
}

function renderAdminBroadcast(){
  return `<div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
    <div class="broadcast-hint">📢 Отправить сообщение всем пользователям сразу</div>
    <textarea class="broadcast-area" id="broadcast-inp" rows="4" placeholder="Текст рассылки..." oninput="adminBroadcastMsg=this.value">${escHtml(adminBroadcastMsg)}</textarea>
    <button class="broadcast-btn${adminBroadcastSent?" sent":""}" onclick="sendAdminBroadcast()">${adminBroadcastSent?"✓ Отправлено всем!":"📢 Отправить всем ("+DB.users.length+" чел.)"}</button>
  </div>`;
}
function sendAdminBroadcast(){
  const msg=document.getElementById("broadcast-inp")?.value.trim()||adminBroadcastMsg.trim();
  if(!msg)return;
  DB.users.forEach(u=>{if(!DB.messages[u.id])DB.messages[u.id]=[];DB.messages[u.id].push({id:Date.now()+Math.random(),from:"owner",text:"📢 "+msg,time:nowTime(),read:false,reactions:{},replyTo:null,edited:false,deleted:false});});
  addAdminLog("Рассылка",msg.slice(0,20)+"...");
  adminBroadcastSent=true;adminBroadcastMsg="";
  render();
  setTimeout(()=>{adminBroadcastSent=false;},2000);
}

function renderAdminLogs(){
  return `<div style="padding:16px;">
    <div style="font-size:12px;color:var(--sub);margin-bottom:10px;">Последние действия в системе</div>
    ${adminLogs.map(l=>`<div class="log-row"><div class="log-time">${l.time}</div><div style="flex:1;"><span class="log-action">${escHtml(l.action)}</span><span class="log-user">@${escHtml(l.user)}</span></div><div class="log-ip">${l.ip}</div></div>`).join("")}
  </div>`;
}

// ─── Main Render ──────────────────────────────────────────────────────────────
function render(){
  const app=document.getElementById("app");
  applyTheme(); applyFontSize();
  if(AppState.screen==="login")   app.innerHTML=renderLoginScreen();
  else if(AppState.screen==="register") app.innerHTML=renderRegisterScreen();
  else if(AppState.screen==="chat")     app.innerHTML=renderChatWindow();
  else if(AppState.screen==="app")      app.innerHTML=renderApp();

  // scroll chat to bottom
  if(AppState.screen==="chat"){
    setTimeout(()=>document.getElementById("msg-end")?.scrollIntoView({behavior:"smooth"}),50);
  }
}

document.addEventListener("DOMContentLoaded",()=>render());
