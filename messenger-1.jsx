import { useState, useEffect, useRef } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEMES = {
  dark:  { bg:"#0a0a0f", card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.09)", text:"#fff", sub:"rgba(255,255,255,0.4)", input:"rgba(255,255,255,0.06)", accent:"#4f7cff", bubble:"rgba(255,255,255,0.07)", tabBar:"rgba(10,10,15,0.97)", section:"rgba(255,255,255,0.03)", divider:"rgba(255,255,255,0.06)" },
  light: { bg:"#f0f2f8", card:"#fff", border:"rgba(0,0,0,0.08)", text:"#111", sub:"rgba(0,0,0,0.45)", input:"rgba(0,0,0,0.05)", accent:"#4f7cff", bubble:"rgba(0,0,0,0.06)", tabBar:"rgba(240,242,248,0.97)", section:"rgba(0,0,0,0.02)", divider:"rgba(0,0,0,0.07)" },
};

// ─── DB ───────────────────────────────────────────────────────────────────────
const OWNER_PHONE = "9995632";
const OWNER_PASSWORD = "owner123";
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
  // phone → { userId, password }
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
  bio:"👑 Создатель Volt Messenger", online:true, lastSeen:null,
  premium:true, role:"owner", banned:false,
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
  if(d.length>7) return"+"+d.slice(0,1)+" "+d.slice(1,4)+" "+d.slice(4,7)+" "+d.slice(7,9)+(d.length>9?" "+d.slice(9,11):"");
  return"+"+d;
}
function genSmsCode(){return String(Math.floor(10000+Math.random()*90000));}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({user,size=44,showOnline=false}){
  const bg=user?.avatar?"transparent":COLORS[user?.id]||"#4f7cff";
  const initials=user?.avatar?"":getInitials(user?.fullName||user?.username);
  return (
    <div style={{position:"relative",flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:"50%",background:user?.avatar?`url(${user.avatar}) center/cover`:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*0.36,fontFamily:"'Unbounded',sans-serif",border:"2px solid rgba(128,128,128,0.15)"}}>
        {!user?.avatar&&initials}
      </div>
      {showOnline&&user?.online&&<div style={{position:"absolute",bottom:1,right:1,width:size*0.28,height:size*0.28,borderRadius:"50%",background:"#22c55e",border:"2.5px solid #0a0a0f"}}/>}
    </div>
  );
}

function PBadge({size=14}){
  return <span title="Volt Premium" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f59e0b,#f97316)",borderRadius:4,padding:"1px 4px",fontSize:size-2,marginLeft:4,verticalAlign:"middle"}}>⭐</span>;
}
function AnonBadge(){
  return <span title="Анонимный номер" style={{display:"inline-flex",alignItems:"center",background:"rgba(139,92,246,0.2)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:4,padding:"1px 5px",fontSize:10,color:"#a78bfa",marginLeft:4}}>👤 anon</span>;
}
function OwnerBadge(){
  return <span title="Владелец" style={{display:"inline-flex",alignItems:"center",background:"linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.2))",border:"1px solid rgba(245,158,11,0.4)",borderRadius:4,padding:"1px 5px",fontSize:10,color:"#f59e0b",marginLeft:4}}>👑 owner</span>;
}
function PremiumBadgeFull(){
  return (
    <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.08))",border:"1px solid rgba(245,158,11,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#f59e0b",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:20}}>⭐</span>
      <div>
        <div style={{fontWeight:700,marginBottom:2}}>Volt Premium</div>
        <div style={{fontSize:11,color:"rgba(245,158,11,0.7)"}}>Цветной ник · Реакции · Анонимные номера · Без лимитов</div>
      </div>
    </div>
  );
}

// ─── Phone Login ──────────────────────────────────────────────────────────────
function PhoneLogin({onLogin, T}){
  const [step,setStep]=useState("phone");
  const [phone,setPhone]=useState("");
  const [smsCode,setSmsCode]=useState("");
  const [realCode,setRealCode]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [isNew,setIsNew]=useState(false);
  const [showPwd,setShowPwd]=useState(false);

  const digits=phone.replace(/\D/g,"");
  const isOwner=isOwnerPhone(digits);
  const isAnon=isAnonPhone(digits);

  function sendSms(){
    if(digits.length<6){setError("Введите корректный номер");return;}
    setLoading(true); setError("");
    setTimeout(()=>{
      const code=genSmsCode();
      setRealCode(code);
      setLoading(false);
      // For owner: skip SMS, go straight to password
      if(isOwnerPhone(digits)){
        const rec=DB.registeredPhones[digits];
        if(rec){ setIsNew(false); setStep("password"); }
        else { setIsNew(true); setStep("newpass"); }
        return;
      }
      setStep("sms");
      setTimeout(()=>alert(`📱 SMS-код для ${formatPhone(digits)}: ${code}\n(симуляция — в реальном приложении придёт SMS)`),100);
    },600);
  }

  function verifySms(){
    if(smsCode!==realCode){setError("Неверный код");return;}
    const rec=DB.registeredPhones[digits];
    if(rec){ setIsNew(false); setStep("password"); }
    else { setIsNew(true); setStep("newpass"); }
    setError("");
  }

  function doLogin(){
    const rec=DB.registeredPhones[digits];
    if(!rec){setError("Аккаунт не найден");return;}
    if(password!==rec.password){setError("Неверный пароль");return;}
    if(isOwnerPhone(digits)){onLogin({...OWNER_USER});return;}
    const user=DB.users.find(u=>u.id===rec.userId);
    if(!user){setError("Пользователь не найден");return;}
    if(user.banned){setError("Аккаунт заблокирован");return;}
    onLogin({...user});
  }

  function doRegister(){
    if(password.length<6){setError("Минимум 6 символов");return;}
    if(password!==confirm){setError("Пароли не совпадают");return;}
    const newId="u"+Date.now();
    const anonNum=digits.slice(-4);
    const newUser={
      id:newId,
      username:(isAnon?"anon_":"user_")+digits.slice(-4),
      fullName:isAnon?`Аноним #${anonNum}`:isOwner?"Владелец Volt":"Пользователь",
      avatar:null, phone:digits, hidePhone:isAnon||isOwner,
      bio:isAnon?"👤 Анонимный аккаунт":isOwner?"👑 Создатель":"",
      online:true, lastSeen:null,
      premium:isAnon||isOwner, role:isOwner?"owner":"user", banned:false,
    };
    DB.users.push(newUser);
    DB.messages[newId]=[];
    DB.registeredPhones[digits]={userId:newId,password};
    onLogin({...newUser});
  }

  const IStyle=(err)=>({
    flex:1,padding:"12px 14px",borderRadius:10,
    background:T.input,border:`1px solid ${err?"#ff6b6b":T.border}`,
    color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none"
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>

      {/* ── STEP: phone ── */}
      {step==="phone"&&<>
        <div style={{fontSize:13,color:T.sub,marginBottom:2}}>
          Введите номер телефона для входа или регистрации
        </div>

        {/* Phone input */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>📱</span>
          <input
            value={phone} onChange={e=>{setPhone(e.target.value);setError("");}}
            placeholder="+7 999 123 45 67"
            style={IStyle(error)}
            onKeyDown={e=>e.key==="Enter"&&sendSms()}
          />
        </div>

        {/* Live preview of phone type */}
        {digits.length>=6&&(
          <div style={{borderRadius:8,padding:"8px 12px",fontSize:12,
            background:isOwner?"rgba(245,158,11,0.08)":isAnon?"rgba(139,92,246,0.08)":"rgba(79,124,255,0.06)",
            border:`1px solid ${isOwner?"rgba(245,158,11,0.25)":isAnon?"rgba(139,92,246,0.25)":"rgba(79,124,255,0.15)"}`,
            color:isOwner?"#f59e0b":isAnon?"#a78bfa":T.sub
          }}>
            {isOwner&&<>👑 <b>Номер владельца</b> — вход без SMS, сразу пароль</>}
            {isAnon&&!isOwner&&<>👤 <b>Анонимный номер</b> — без привязки к оператору, Premium автоматически</>}
            {!isOwner&&!isAnon&&<>📞 Обычный номер — отправим SMS-код</>}
          </div>
        )}

        {/* Hints */}
        {digits.length<6&&(
          <div style={{background:"rgba(79,124,255,0.06)",borderRadius:8,padding:"10px 12px",fontSize:11,color:T.sub,lineHeight:1.8}}>
            <div>👑 <b style={{color:"#f59e0b"}}>+9995632</b> — <span style={{color:"#f59e0b"}}>Номер владельца</span> · без SMS · пароль: <code style={{background:"rgba(245,158,11,0.1)",padding:"0 4px",borderRadius:4,color:"#f59e0b"}}>owner123</code></div>
            <div>👤 <b style={{color:"#a78bfa"}}>+888XXXXXXX</b> — Анонимный номер · Premium автоматически</div>
            <div>📱 <b style={{color:T.text}}>Любой другой</b> — обычная регистрация</div>
          </div>
        )}

        {error&&<div style={{color:"#ff6b6b",fontSize:12}}>{error}</div>}
        <button onClick={sendSms} disabled={loading} style={{padding:"12px",background:T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"Проверка...":isOwner?"Войти как владелец →":"Получить SMS-код →"}
        </button>
      </>}

      {/* ── STEP: sms ── */}
      {step==="sms"&&<>
        <div style={{fontSize:13,color:T.sub}}>
          Введите 5-значный код из SMS на <b style={{color:T.text}}>{formatPhone(digits)}</b>
        </div>
        <input
          value={smsCode} onChange={e=>{setSmsCode(e.target.value);setError("");}}
          placeholder="_ _ _ _ _" maxLength={5}
          style={{padding:"14px",borderRadius:10,background:T.input,border:`1px solid ${error?"#ff6b6b":T.border}`,color:T.text,fontSize:24,textAlign:"center",letterSpacing:10,fontFamily:"monospace",outline:"none"}}
          onKeyDown={e=>e.key==="Enter"&&verifySms()}
        />
        {error&&<div style={{color:"#ff6b6b",fontSize:12}}>{error}</div>}
        <button onClick={verifySms} style={{padding:"12px",background:T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Подтвердить</button>
        <div onClick={()=>{setStep("phone");setError("");setSmsCode("");}} style={{textAlign:"center",color:T.sub,fontSize:13,cursor:"pointer"}}>← Изменить номер</div>
      </>}

      {/* ── STEP: password (existing user) ── */}
      {step==="password"&&<>
        {isOwner&&(
          <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(249,115,22,0.06))",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>👑</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>Вход как Владелец</div>
              <div style={{fontSize:11,color:"rgba(245,158,11,0.6)"}}>Полный доступ · Админ-панель</div>
            </div>
          </div>
        )}
        {isAnon&&!isOwner&&(
          <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>👤</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>Анонимный вход</div>
              <div style={{fontSize:11,color:"rgba(167,139,250,0.6)"}}>{formatPhone(digits)} · Premium аккаунт</div>
            </div>
          </div>
        )}
        <div style={{fontSize:13,color:T.sub}}>Введите пароль для <b style={{color:T.text}}>{formatPhone(digits)}</b></div>
        <div style={{position:"relative"}}>
          <input
            type={showPwd?"text":"password"} value={password}
            onChange={e=>{setPassword(e.target.value);setError("");}}
            placeholder="Пароль"
            style={{...IStyle(error),width:"100%",boxSizing:"border-box",paddingRight:44}}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}
          />
          <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:T.sub,fontSize:16}}>{showPwd?"🙈":"👁"}</button>
        </div>
        {error&&<div style={{color:"#ff6b6b",fontSize:12}}>{error}</div>}
        <button onClick={doLogin} style={{padding:"12px",background:isOwner?"linear-gradient(135deg,#f59e0b,#f97316)":T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>
          {isOwner?"👑 Войти как Владелец":"Войти"}
        </button>
        <div onClick={()=>{setStep("phone");setError("");setPassword("");}} style={{textAlign:"center",color:T.sub,fontSize:13,cursor:"pointer"}}>← Изменить номер</div>
      </>}

      {/* ── STEP: newpass (new registration) ── */}
      {step==="newpass"&&<>
        <div style={{fontSize:13,color:T.sub}}>
          Новый аккаунт! Придумайте пароль для <b style={{color:T.text}}>{formatPhone(digits)}</b>
        </div>
        {isAnon&&(
          <div style={{background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#a78bfa"}}>
            👤 Анонимный номер — <b>Premium активируется автоматически</b>
          </div>
        )}
        <div style={{position:"relative"}}>
          <input
            type={showPwd?"text":"password"} value={password}
            onChange={e=>{setPassword(e.target.value);setError("");}}
            placeholder="Придумайте пароль (мин. 6 символов)"
            style={{...IStyle(error),width:"100%",boxSizing:"border-box"}}
          />
        </div>
        <input
          type={showPwd?"text":"password"} value={confirm}
          onChange={e=>{setConfirm(e.target.value);setError("");}}
          placeholder="Повторите пароль"
          style={{...IStyle(error),width:"100%",boxSizing:"border-box"}}
          onKeyDown={e=>e.key==="Enter"&&doRegister()}
        />
        <div onClick={()=>setShowPwd(p=>!p)} style={{fontSize:12,color:T.sub,cursor:"pointer",textAlign:"right"}}>
          {showPwd?"🙈 Скрыть пароль":"👁 Показать пароль"}
        </div>
        {error&&<div style={{color:"#ff6b6b",fontSize:12}}>{error}</div>}
        <button onClick={doRegister} style={{padding:"12px",background:isAnon?"linear-gradient(135deg,#7c3aed,#a78bfa)":T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>
          {isAnon?"👤 Создать анонимный аккаунт":"Зарегистрироваться"}
        </button>
        <div onClick={()=>{setStep("phone");setError("");}} style={{textAlign:"center",color:T.sub,fontSize:13,cursor:"pointer"}}>← Изменить номер</div>
      </>}
    </div>
  );
}

// ─── Captcha ──────────────────────────────────────────────────────────────────
function Captcha({onVerify,T}){
  const [checked,setChecked]=useState(false);
  const [loading,setLoading]=useState(false);
  function handle(){setLoading(true);setTimeout(()=>{setLoading(false);setChecked(true);onVerify();},1200);}
  return (
    <div onClick={!checked&&!loading?handle:undefined} style={{border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,background:T.input,cursor:checked?"default":"pointer"}}>
      <div style={{width:22,height:22,borderRadius:4,flexShrink:0,transition:"all 0.3s",border:checked?"none":`2px solid ${T.sub}`,background:checked?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {loading&&<span style={{fontSize:10,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>}
        {checked&&<span style={{color:"#fff",fontSize:13}}>✓</span>}
      </div>
      <span style={{color:T.sub,fontSize:13}}>{checked?"Вы не робот ✓":loading?"Проверка...":"Я не робот"}</span>
      <span style={{marginLeft:"auto",fontSize:20}}>🛡️</span>
    </div>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({onRegister,onLogin,T}){
  const [tab,setTab]=useState("phone");
  const [form,setForm]=useState({nameOrNick:"",password:"",confirm:""});
  const [errors,setErrors]=useState({});
  const [captchaDone,setCaptchaDone]=useState(false);
  const [shake,setShake]=useState(false);

  function submitUsername(){
    const e={};
    if(!form.nameOrNick.trim())e.nameOrNick="Введите ФИО или никнейм";
    if(form.password.length<6)e.password="Минимум 6 символов";
    if(form.password!==form.confirm)e.confirm="Пароли не совпадают";
    if(!captchaDone)e.captcha="Подтвердите, что вы не робот";
    if(Object.keys(e).length){setErrors(e);setShake(true);setTimeout(()=>setShake(false),500);return;}
    const isNick=form.nameOrNick.startsWith("@")||!form.nameOrNick.includes(" ");
    const username=isNick?form.nameOrNick.replace("@",""):form.nameOrNick.split(" ").join("_").toLowerCase();
    const fullName=isNick?form.nameOrNick.replace("@",""):form.nameOrNick;
    onRegister({id:"me",username,fullName,avatar:null,phone:"",hidePhone:false,bio:"",online:true,lastSeen:null,premium:false,role:"user",banned:false});
  }

  const f=k=>({value:form[k],onChange:e=>{setForm(p=>({...p,[k]:e.target.value}));setErrors(p=>({...p,[k]:""}));}});
  const IStyle=(err)=>({width:"100%",padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${err?"#ff6b6b":T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none"});

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Golos Text',sans-serif"}}>
      <div style={{width:"100%",maxWidth:380,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32,color:T.text,animation:shake?"shake 0.4s":"fadeUp 0.5s both"}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:22,fontWeight:700,marginBottom:24,textAlign:"center"}}>💬 <span style={{color:T.accent}}>Volt</span></div>
        <div style={{fontSize:20,fontWeight:700,fontFamily:"'Unbounded',sans-serif",marginBottom:20}}>Регистрация</div>
        <div style={{display:"flex",background:T.input,borderRadius:10,padding:3,marginBottom:20}}>
          {[["phone","📱 По номеру"],["username","👤 По нику"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Golos Text',sans-serif",fontSize:13,background:tab===id?T.accent:"transparent",color:tab===id?"#fff":T.sub,transition:"all 0.2s"}}>
              {label}
            </button>
          ))}
        </div>
        {tab==="phone"&&<PhoneLogin onLogin={onRegister} T={T}/>}
        {tab==="username"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <input style={IStyle(errors.nameOrNick)} placeholder="Иванов Иван или @nickname" {...f("nameOrNick")}/>
            {errors.nameOrNick&&<div style={{color:"#ff6b6b",fontSize:11,marginTop:-8}}>{errors.nameOrNick}</div>}
            <input type="password" style={IStyle(errors.password)} placeholder="Пароль" {...f("password")}/>
            {errors.password&&<div style={{color:"#ff6b6b",fontSize:11,marginTop:-8}}>{errors.password}</div>}
            <input type="password" style={IStyle(errors.confirm)} placeholder="Повторите пароль" {...f("confirm")}/>
            {errors.confirm&&<div style={{color:"#ff6b6b",fontSize:11,marginTop:-8}}>{errors.confirm}</div>}
            <Captcha onVerify={()=>setCaptchaDone(true)} T={T}/>
            {errors.captcha&&<div style={{color:"#ff6b6b",fontSize:11}}>{errors.captcha}</div>}
            <button onClick={submitUsername} style={{padding:"13px",background:T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Зарегистрироваться</button>
          </div>
        )}
        <div onClick={onLogin} style={{textAlign:"center",marginTop:16,color:T.sub,fontSize:13,cursor:"pointer"}}>
          Уже есть аккаунт? <span style={{color:T.accent}}>Войти</span>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({onLogin,onRegister,T}){
  const [tab,setTab]=useState("phone");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");

  function loginByUsername(){
    if(!username||!password){setError("Заполните все поля");return;}
    const found=DB.users.find(u=>u.username===username.replace("@",""));
    if(!found){setError("Пользователь не найден");return;}
    if(found.banned){setError("Аккаунт заблокирован");return;}
    onLogin({...found});
  }

  const IStyle={padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none",width:"100%"};

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Golos Text',sans-serif"}}>
      <div style={{width:"100%",maxWidth:380,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:32,color:T.text,animation:"fadeUp 0.5s both"}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:24,fontWeight:700,marginBottom:6,textAlign:"center"}}>
          💬 <span style={{color:T.accent}}>Volt</span>
        </div>
        <div style={{textAlign:"center",color:T.sub,fontSize:12,marginBottom:24}}>Защищённый мессенджер</div>
        <div style={{fontSize:20,fontWeight:700,fontFamily:"'Unbounded',sans-serif",marginBottom:20}}>Войти</div>

        <div style={{display:"flex",background:T.input,borderRadius:10,padding:3,marginBottom:20}}>
          {[["phone","📱 По номеру"],["username","👤 По нику"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Golos Text',sans-serif",fontSize:13,background:tab===id?T.accent:"transparent",color:tab===id?"#fff":T.sub,transition:"all 0.2s"}}>
              {label}
            </button>
          ))}
        </div>

        {tab==="phone"&&<PhoneLogin onLogin={onLogin} T={T}/>}

        {tab==="username"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <input style={IStyle} placeholder="@username" value={username} onChange={e=>{setUsername(e.target.value);setError("");}}/>
            <input type="password" style={IStyle} placeholder="Пароль" value={password} onChange={e=>{setPassword(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&loginByUsername()}/>
            {error&&<div style={{color:"#ff6b6b",fontSize:12}}>{error}</div>}
            <button onClick={loginByUsername} style={{padding:"13px",background:T.accent,borderRadius:12,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>Войти</button>
            <div style={{padding:"8px 12px",background:`${T.accent}12`,borderRadius:8,fontSize:11,color:T.sub}}>
              <b style={{color:T.text}}>Тест:</b> alexey_k / marina_v / dmitry_p / anon_7777 (любой пароль)
            </div>
          </div>
        )}

        <div onClick={onRegister} style={{textAlign:"center",marginTop:16,color:T.sub,fontSize:13,cursor:"pointer"}}>
          Нет аккаунта? <span style={{color:T.accent}}>Регистрация</span>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({onBack,T}){
  const [users,setUsers]=useState([...DB.users]);
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("users");
  const [editUser,setEditUser]=useState(null);
  const [newPhone,setNewPhone]=useState("");
  const [newPwd,setNewPwd]=useState("");
  const [broadcastMsg,setBroadcastMsg]=useState("");
  const [broadcastSent,setBroadcastSent]=useState(false);
  const [logs,setLogs]=useState([
    {time:"10:23",action:"Вход",user:"alexey_k",ip:"192.168.1.1"},
    {time:"09:15",action:"Регистрация",user:"anon_7777",ip:"10.0.0.5"},
    {time:"08:44",action:"Смена пароля",user:"marina_v",ip:"172.16.0.3"},
  ]);

  function toggleBan(id){
    DB.users.forEach(u=>{if(u.id===id)u.banned=!u.banned;});
    setUsers([...DB.users]);
    addLog(DB.users.find(u=>u.id===id)?.banned?"Бан":"Разбан",DB.users.find(u=>u.id===id)?.username||id);
  }
  function togglePremium(id){
    DB.users.forEach(u=>{if(u.id===id)u.premium=!u.premium;});
    setUsers([...DB.users]);
    addLog("Premium toggle",DB.users.find(u=>u.id===id)?.username||id);
  }
  function deleteUser(id){
    const idx=DB.users.findIndex(u=>u.id===id);
    if(idx>=0){addLog("Удалён",DB.users[idx].username);DB.users.splice(idx,1);}
    setUsers([...DB.users]);
    setEditUser(null);
  }
  function addAnonUser(){
    if(!newPhone||!newPwd){return;}
    const d=newPhone.replace(/\D/g,"");
    if(DB.registeredPhones[d]){alert("Номер уже существует");return;}
    const newId="u"+Date.now();
    const anonNum=d.slice(-4);
    const nu={id:newId,username:"anon_"+anonNum,fullName:"Аноним #"+anonNum,avatar:null,phone:d,hidePhone:true,bio:"👤 Анонимный аккаунт",online:false,lastSeen:null,premium:true,role:"user",banned:false};
    DB.users.push(nu);
    DB.messages[newId]=[];
    DB.registeredPhones[d]={userId:newId,password:newPwd};
    setUsers([...DB.users]);
    setNewPhone(""); setNewPwd("");
    addLog("Создан анонимный","anon_"+anonNum);
  }
  function addLog(action,user){
    setLogs(prev=>[{time:new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"}),action,user,ip:"127.0.0.1"},...prev].slice(0,20));
  }
  function sendBroadcast(){
    if(!broadcastMsg.trim())return;
    DB.users.forEach(u=>{
      if(!DB.messages[u.id])DB.messages[u.id]=[];
      DB.messages[u.id].push({id:Date.now()+Math.random(),from:"owner",text:"📢 "+broadcastMsg,time:new Date().toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"}),read:false,reactions:{},replyTo:null,edited:false,deleted:false});
    });
    setBroadcastSent(true);
    addLog("Рассылка",broadcastMsg.slice(0,20)+"...");
    setTimeout(()=>setBroadcastSent(false),2000);
    setBroadcastMsg("");
  }

  const filtered=users.filter(u=>
    u.fullName.toLowerCase().includes(search.toLowerCase())||
    u.username.toLowerCase().includes(search.toLowerCase())||
    u.phone.includes(search.replace(/\D/g,""))
  );

  const totalMsgs=Object.values(DB.messages).flat().length;
  const onlineCount=DB.users.filter(u=>u.online).length;
  const premiumCount=DB.users.filter(u=>u.premium).length;
  const bannedCount=DB.users.filter(u=>u.banned).length;
  const anonCount=DB.users.filter(u=>isAnonPhone(u.phone)).length;

  const adminTabs=[["users","👥"],["stats","📊"],["add","➕"],["broadcast","📢"],["logs","📋"]];

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Golos Text',sans-serif"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.12))",borderBottom:`1px solid rgba(245,158,11,0.25)`}}>
        <button onClick={onBack} style={{background:"transparent",color:"#f59e0b",fontSize:22,border:"none",cursor:"pointer"}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:15,fontWeight:700,color:"#f59e0b"}}>👑 Админ-панель</div>
          <div style={{fontSize:11,color:T.sub}}>Volt Messenger · Владелец · +{OWNER_PHONE}</div>
        </div>
        <div style={{fontSize:11,padding:"3px 8px",background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:6,color:"#22c55e"}}>● Онлайн</div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.divider}`,overflowX:"auto"}}>
        {adminTabs.map(([id,icon])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,minWidth:52,padding:"10px 6px",background:"transparent",border:"none",cursor:"pointer",color:tab===id?"#f59e0b":T.sub,fontFamily:"'Golos Text',sans-serif",fontSize:18,borderBottom:tab===id?"2px solid #f59e0b":"2px solid transparent",transition:"color 0.2s"}}>
            {icon}
          </button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:12,padding:"4px 0",borderBottom:`1px solid ${T.divider}`}}>
        {adminTabs.map(([id,,label])=>(
          <span key={id} style={{fontSize:9,color:tab===id?"#f59e0b":T.sub,minWidth:52,textAlign:"center"}}>
            {id==="users"?"Юзеры":id==="stats"?"Статистика":id==="add"?"Добавить":id==="broadcast"?"Рассылка":"Логи"}
          </span>
        ))}
      </div>

      {/* ── STATS ── */}
      {tab==="stats"&&(
        <div style={{padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {icon:"👥",label:"Всего юзеров",val:DB.users.length,color:"#4f7cff"},
              {icon:"🟢",label:"Онлайн",val:onlineCount,color:"#22c55e"},
              {icon:"⭐",label:"Premium",val:premiumCount,color:"#f59e0b"},
              {icon:"🚫",label:"Забанено",val:bannedCount,color:"#ef4444"},
              {icon:"👤",label:"Анонимных",val:anonCount,color:"#a78bfa"},
              {icon:"💬",label:"Сообщений",val:totalMsgs,color:"#06b6d4"},
            ].map(s=>(
              <div key={s.label} style={{background:T.section,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 14px",textAlign:"center"}}>
                <div style={{fontSize:26}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:700,color:s.color,marginTop:4,fontFamily:"'Unbounded',sans-serif"}}>{s.val}</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:T.section,border:`1px solid ${T.border}`,borderRadius:14,padding:16}}>
            <div style={{fontSize:12,color:T.sub,marginBottom:10,fontWeight:600}}>АКТИВНОСТЬ ПО ЧАСАМ</div>
            <div style={{display:"flex",gap:3,alignItems:"flex-end",height:60}}>
              {[20,40,80,60,30,70,100,90,50,45,65,80].map((h,i)=>(
                <div key={i} style={{flex:1,background:`rgba(79,124,255,${0.3+h/200})`,borderRadius:"3px 3px 0 0",height:`${h}%`,minHeight:4}}/>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.sub,marginTop:4}}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {tab==="users"&&(
        <div>
          <div style={{padding:"10px 16px"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Поиск по имени, нику, номеру..."
              style={{width:"100%",padding:"10px 14px",borderRadius:20,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:13,outline:"none",fontFamily:"'Golos Text',sans-serif",boxSizing:"border-box"}}/>
          </div>
          {filtered.map(u=>(
            <div key={u.id} style={{padding:"12px 16px",borderBottom:`1px solid ${T.divider}`,opacity:u.banned?0.55:1,background:editUser?.id===u.id?`${T.accent}08`:"transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar user={u} size={42} showOnline/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,display:"flex",alignItems:"center",flexWrap:"wrap",gap:2}}>
                    {u.fullName}
                    {u.premium&&<PBadge/>}
                    {isAnonPhone(u.phone)&&<AnonBadge/>}
                    {u.role==="owner"&&<OwnerBadge/>}
                    {u.banned&&<span style={{fontSize:10,color:"#ef4444",marginLeft:4}}>🚫</span>}
                  </div>
                  <div style={{fontSize:11,color:T.sub}}>@{u.username} · {u.hidePhone?"скрыт":"+"+u.phone}</div>
                </div>
                <button onClick={()=>setEditUser(editUser?.id===u.id?null:u)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:T.sub,cursor:"pointer"}}>
                  {editUser?.id===u.id?"✕":"···"}
                </button>
              </div>
              {editUser?.id===u.id&&(
                <div style={{display:"flex",gap:6,marginTop:10,paddingLeft:52,flexWrap:"wrap"}}>
                  <button onClick={()=>togglePremium(u.id)} style={{padding:"5px 11px",borderRadius:8,fontSize:11,border:`1px solid ${u.premium?"rgba(245,158,11,0.4)":"rgba(128,128,128,0.2)"}`,background:u.premium?"rgba(245,158,11,0.12)":T.bubble,color:u.premium?"#f59e0b":T.sub,cursor:"pointer"}}>
                    {u.premium?"⭐ Снять":"⭐ Дать Premium"}
                  </button>
                  <button onClick={()=>toggleBan(u.id)} style={{padding:"5px 11px",borderRadius:8,fontSize:11,border:`1px solid ${u.banned?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.3)"}`,background:u.banned?"rgba(34,197,94,0.08)":"rgba(239,68,68,0.08)",color:u.banned?"#22c55e":"#ef4444",cursor:"pointer"}}>
                    {u.banned?"✓ Разбанить":"🚫 Забанить"}
                  </button>
                  {u.role!=="owner"&&(
                    <button onClick={()=>{if(confirm(`Удалить ${u.fullName}?`))deleteUser(u.id);}} style={{padding:"5px 11px",borderRadius:8,fontSize:11,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.06)",color:"#ef4444",cursor:"pointer"}}>
                      🗑 Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length===0&&<div style={{textAlign:"center",color:T.sub,padding:40,fontSize:13}}>Ничего не найдено</div>}
        </div>
      )}

      {/* ── ADD ANON ── */}
      {tab==="add"&&(
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#a78bfa"}}>
            👤 Создать анонимный аккаунт (+888XXXXXXX)<br/>
            <span style={{fontSize:11,color:T.sub}}>Номер должен начинаться с 888. Premium активируется автоматически.</span>
          </div>
          <input
            value={newPhone} onChange={e=>setNewPhone(e.target.value)}
            placeholder="+888 1234567"
            style={{padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none"}}
          />
          <input
            value={newPwd} onChange={e=>setNewPwd(e.target.value)}
            type="password" placeholder="Пароль для аккаунта"
            style={{padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none"}}
          />
          <button onClick={addAnonUser} style={{padding:"12px",background:"linear-gradient(135deg,#7c3aed,#a78bfa)",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>
            👤 Создать анонимный аккаунт
          </button>

          <div style={{marginTop:8,borderTop:`1px solid ${T.divider}`,paddingTop:12}}>
            <div style={{fontSize:12,color:T.sub,marginBottom:8}}>Существующие анонимные номера:</div>
            {DB.users.filter(u=>isAnonPhone(u.phone)).map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.divider}`}}>
                <Avatar user={u} size={32}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:T.text,fontWeight:600}}>@{u.username}</div>
                  <div style={{fontSize:11,color:T.sub}}>+{u.phone}</div>
                </div>
                <AnonBadge/>{u.premium&&<PBadge/>}
              </div>
            ))}
            {DB.users.filter(u=>isAnonPhone(u.phone)).length===0&&<div style={{color:T.sub,fontSize:12}}>Нет анонимных аккаунтов</div>}
          </div>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {tab==="broadcast"&&(
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#06b6d4"}}>
            📢 Отправить сообщение всем пользователям сразу
          </div>
          <textarea
            value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)}
            placeholder="Текст рассылки..."
            rows={4}
            style={{padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none",resize:"vertical"}}
          />
          <button onClick={sendBroadcast} style={{padding:"12px",background:broadcastSent?"#22c55e":"linear-gradient(135deg,#0891b2,#06b6d4)",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer",transition:"background 0.3s"}}>
            {broadcastSent?"✓ Отправлено всем!":"📢 Отправить всем ("+DB.users.length+" чел.)"}
          </button>
        </div>
      )}

      {/* ── LOGS ── */}
      {tab==="logs"&&(
        <div style={{padding:16}}>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>Последние действия в системе</div>
          {logs.map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.divider}`}}>
              <div style={{fontSize:10,color:T.sub,fontFamily:"monospace",minWidth:40}}>{l.time}</div>
              <div style={{flex:1}}>
                <span style={{fontSize:13,color:T.text,fontWeight:600}}>{l.action}</span>
                <span style={{fontSize:12,color:T.accent,marginLeft:6}}>@{l.user}</span>
              </div>
              <div style={{fontSize:10,color:T.sub,fontFamily:"monospace"}}>{l.ip}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({msg,isMe,allMsgs,onReact,onReply,onEdit,onDelete,T}){
  const [menu,setMenu]=useState(false);
  const [emojiPick,setEmojiPick]=useState(false);
  const replyMsg=msg.replyTo?allMsgs.find(m=>m.id===msg.replyTo):null;
  const reactionEntries=Object.entries(msg.reactions||{}).filter(([,v])=>v>0);
  if(msg.deleted)return(
    <div style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:6}}>
      <div style={{padding:"6px 12px",borderRadius:12,background:T.bubble,color:T.sub,fontSize:13,fontStyle:"italic"}}>Сообщение удалено</div>
    </div>
  );
  return(
    <div style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:6}} onContextMenu={e=>{e.preventDefault();setMenu(true);}}>
      <div style={{maxWidth:"74%"}}>
        {replyMsg&&<div style={{background:isMe?"rgba(255,255,255,0.15)":T.bubble,borderLeft:`3px solid ${T.accent}`,borderRadius:"8px 8px 0 0",padding:"4px 10px",fontSize:12,color:T.sub,marginBottom:-2}}>{replyMsg.deleted?"Удалённое":replyMsg.text.slice(0,60)}</div>}
        <div style={{padding:"8px 12px",borderRadius:16,wordBreak:"break-word",background:isMe?T.accent:T.bubble,color:isMe?"#fff":T.text,borderBottomRightRadius:isMe?4:16,borderBottomLeftRadius:!isMe?4:16}} onDoubleClick={()=>setEmojiPick(p=>!p)}>
          <div style={{fontSize:14}}>{msg.text}</div>
          <div style={{fontSize:10,color:isMe?"rgba(255,255,255,0.55)":T.sub,marginTop:2,textAlign:"right",display:"flex",gap:4,justifyContent:"flex-end"}}>
            {msg.edited&&<span>ред.</span>}<span>{msg.time}</span>{isMe&&<span>{msg.read?"✓✓":"✓"}</span>}
          </div>
        </div>
        {reactionEntries.length>0&&<div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap",justifyContent:isMe?"flex-end":"flex-start"}}>{reactionEntries.map(([e,c])=><span key={e} onClick={()=>onReact(msg.id,e)} style={{background:T.bubble,borderRadius:10,padding:"2px 7px",fontSize:13,cursor:"pointer",border:`1px solid ${T.border}`}}>{e} {c}</span>)}</div>}
        {emojiPick&&<div style={{display:"flex",gap:6,marginTop:4,background:T.card,borderRadius:20,padding:"6px 10px",border:`1px solid ${T.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{REACTIONS_LIST.map(e=><span key={e} onClick={()=>{onReact(msg.id,e);setEmojiPick(false);}} style={{fontSize:20,cursor:"pointer"}}>{e}</span>)}</div>}
      </div>
      {menu&&<div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)"}} onClick={()=>setMenu(false)}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",minWidth:180}} onClick={e=>e.stopPropagation()}>
          {[{icon:"↩️",label:"Ответить",a:()=>{onReply(msg);setMenu(false);}},{icon:"😊",label:"Реакция",a:()=>{setEmojiPick(true);setMenu(false);}},
            ...(isMe?[{icon:"✏️",label:"Редактировать",a:()=>{onEdit(msg);setMenu(false);}},{icon:"🗑️",label:"Удалить",a:()=>{onDelete(msg.id);setMenu(false);},danger:true}]:[])
          ].map(item=><div key={item.label} onClick={item.a} style={{padding:"13px 18px",cursor:"pointer",fontSize:14,color:item.danger?"#ff6b6b":T.text,borderBottom:`1px solid ${T.divider}`,display:"flex",gap:10}}>{item.icon} {item.label}</div>)}
        </div>
      </div>}
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({user,currentUser,onBack,T,fontSize}){
  const [msgs,setMsgs]=useState(()=>{if(!DB.messages[user.id])DB.messages[user.id]=[];return DB.messages[user.id];});
  const [text,setText]=useState("");
  const [replyTo,setReplyTo]=useState(null);
  const [editMsg,setEditMsg]=useState(null);
  const [typing,setTyping]=useState(false);
  const [searchQ,setSearchQ]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  const endRef=useRef(null);
  const inputRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,typing]);
  useEffect(()=>{const u=msgs.map(m=>m.from!=="me"?{...m,read:true}:m);setMsgs(u);DB.messages[user.id]=u;},[]);

  function send(){
    if(!text.trim())return;
    if(editMsg){const u=msgs.map(m=>m.id===editMsg.id?{...m,text:text.trim(),edited:true}:m);setMsgs(u);DB.messages[user.id]=u;setEditMsg(null);setText("");return;}
    const m={id:Date.now(),from:"me",text:text.trim(),time:nowTime(),read:false,reactions:{},replyTo:replyTo?.id||null,edited:false,deleted:false};
    const u=[...msgs,m];setMsgs(u);DB.messages[user.id]=u;setText("");setReplyTo(null);
    setTyping(true);
    setTimeout(()=>{setTyping(false);
      const replies=["Понял 👍","Окей!","Хорошо!","Договорились 🤝","👌","Сейчас посмотрю","Ок!","👍","Понял тебя"];
      const r={id:Date.now()+1,from:user.id,text:replies[Math.floor(Math.random()*replies.length)],time:nowTime(),read:false,reactions:{},replyTo:null,edited:false,deleted:false};
      const u2=[...u,r];setMsgs(u2);DB.messages[user.id]=u2;
    },1500);
  }
  function handleReact(id,emoji){const u=msgs.map(m=>{if(m.id!==id)return m;const r={...m.reactions};r[emoji]=(r[emoji]||0)+1;return{...m,reactions:r};});setMsgs(u);DB.messages[user.id]=u;}
  function handleDelete(id){const u=msgs.map(m=>m.id===id?{...m,deleted:true}:m);setMsgs(u);DB.messages[user.id]=u;}
  function startEdit(msg){setEditMsg(msg);setText(msg.text);inputRef.current?.focus();}
  const displayed=showSearch&&searchQ.trim()?msgs.filter(m=>!m.deleted&&m.text.toLowerCase().includes(searchQ.toLowerCase())):msgs;
  const isBlocked=DB.blocked.includes(user.id);

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.bg,color:T.text,fontFamily:"'Golos Text',sans-serif",maxWidth:480,margin:"0 auto",fontSize}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:`1px solid ${T.divider}`,background:T.tabBar,backdropFilter:"blur(12px)"}}>
        <button onClick={onBack} style={{background:"transparent",color:T.accent,fontSize:22,border:"none",cursor:"pointer",padding:"0 6px 0 0"}}>←</button>
        <Avatar user={user} size={38} showOnline/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center"}}>
            {user.fullName}{user.premium&&<PBadge/>}{isAnonPhone(user.phone)&&<AnonBadge/>}{user.role==="owner"&&<OwnerBadge/>}
          </div>
          <div style={{fontSize:11,color:user.online?"#22c55e":T.sub}}>{user.online?"онлайн":`был(а) ${lastSeenText(user.lastSeen)}`}</div>
        </div>
        <button onClick={()=>setShowSearch(p=>!p)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.sub,fontSize:18}}>🔍</button>
      </div>
      {showSearch&&<div style={{padding:"8px 12px",borderBottom:`1px solid ${T.divider}`}}><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Поиск по переписке..." style={{width:"100%",padding:"8px 12px",borderRadius:20,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:13,outline:"none",fontFamily:"'Golos Text',sans-serif",boxSizing:"border-box"}}/></div>}
      {isBlocked&&<div style={{padding:"8px",background:"rgba(255,80,80,0.08)",color:"#ff6b6b",fontSize:12,textAlign:"center"}}>Пользователь заблокирован</div>}
      <div style={{flex:1,overflow:"auto",padding:"12px 10px"}}>
        {displayed.length===0&&!typing&&<div style={{textAlign:"center",color:T.sub,marginTop:60,fontSize:14}}>Начните переписку 👋</div>}
        {displayed.map(m=><Bubble key={m.id} msg={m} isMe={m.from==="me"} allMsgs={msgs} onReact={handleReact} onReply={setReplyTo} onEdit={startEdit} onDelete={handleDelete} T={T}/>)}
        {typing&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Avatar user={user} size={28}/><div style={{padding:"8px 14px",background:T.bubble,borderRadius:16,display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.sub,animation:`bounce 1s ${i*0.15}s infinite`}}/>)}</div></div>}
        <div ref={endRef}/>
      </div>
      {(replyTo||editMsg)&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:T.section,borderTop:`1px solid ${T.divider}`}}>
        <div style={{flex:1}}><div style={{fontSize:11,color:T.accent,fontWeight:600}}>{editMsg?"Редактирование":"Ответ:"}</div><div style={{fontSize:12,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(editMsg||replyTo)?.text}</div></div>
        <button onClick={()=>{setReplyTo(null);setEditMsg(null);setText("");}} style={{background:"transparent",border:"none",cursor:"pointer",color:T.sub,fontSize:18}}>✕</button>
      </div>}
      {!isBlocked&&<div style={{display:"flex",gap:8,padding:"10px 12px",borderTop:`1px solid ${T.divider}`,background:T.tabBar}}>
        <input ref={inputRef} style={{flex:1,padding:"10px 14px",background:T.input,border:`1px solid ${T.border}`,borderRadius:20,color:T.text,fontSize,fontFamily:"'Golos Text',sans-serif",outline:"none"}} placeholder={editMsg?"Редактировать...":"Сообщение..."} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
        <button onClick={send} style={{background:T.accent,borderRadius:"50%",width:40,height:40,color:"#fff",fontSize:15,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{editMsg?"✓":"➤"}</button>
      </div>}
    </div>
  );
}

// ─── Search User ──────────────────────────────────────────────────────────────
function SearchUser({currentUser,onOpenChat,T}){
  const [q,setQ]=useState("");
  const results=q.length>1?DB.users.filter(u=>u.id!==currentUser.id&&u.username.includes(q.replace("@",""))&&!DB.blocked.includes(u.id)):[];
  return(
    <div style={{padding:"12px 16px 0"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Найти по @username..." style={{width:"100%",padding:"10px 14px",borderRadius:20,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,outline:"none",fontFamily:"'Golos Text',sans-serif",boxSizing:"border-box"}}/>
      {results.map(u=>(
        <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.divider}`,cursor:"pointer"}} onClick={()=>onOpenChat(u)}>
          <Avatar user={u} size={42} showOnline/>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:T.text,display:"flex",alignItems:"center"}}>{u.fullName}{u.premium&&<PBadge/>}{isAnonPhone(u.phone)&&<AnonBadge/>}</div>
            <div style={{fontSize:12,color:T.sub}}>@{u.username}</div>
          </div>
          <button style={{padding:"6px 14px",background:`${T.accent}20`,borderRadius:8,color:T.accent,fontSize:12,border:`1px solid ${T.accent}40`,cursor:"pointer"}}>Написать</button>
        </div>
      ))}
      {q.length>1&&results.length===0&&<div style={{color:T.sub,textAlign:"center",marginTop:20,fontSize:13}}>Не найдено</div>}
    </div>
  );
}

// ─── Chats Tab ────────────────────────────────────────────────────────────────
function ChatsTab({currentUser,onOpenChat,T,fontSize}){
  const [showSearch,setShowSearch]=useState(false);
  const [,tick]=useState(0);
  useEffect(()=>{const id=setInterval(()=>tick(n=>n+1),5000);return()=>clearInterval(id);},[]);
  const chatUsers=DB.users.filter(u=>u.id!==currentUser.id&&!DB.archived.includes(u.id));
  const totalUnread=chatUsers.reduce((acc,u)=>acc+(DB.messages[u.id]||[]).filter(m=>m.from!=="me"&&!m.read).length,0);
  return(
    <div style={{paddingBottom:20,fontSize}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 10px",borderBottom:`1px solid ${T.divider}`}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:18,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:8}}>
          Чаты{totalUnread>0&&<span style={{background:T.accent,borderRadius:10,minWidth:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,padding:"0 5px",color:"#fff"}}>{totalUnread}</span>}
        </div>
        <button onClick={()=>setShowSearch(p=>!p)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.sub,fontSize:20}}>✏️</button>
      </div>
      {showSearch&&<SearchUser currentUser={currentUser} onOpenChat={u=>{setShowSearch(false);onOpenChat(u);}} T={T}/>}
      {chatUsers.map(u=>{
        const msgs=DB.messages[u.id]||[];
        const last=msgs.filter(m=>!m.deleted)[msgs.filter(m=>!m.deleted).length-1];
        const unread=msgs.filter(m=>m.from!=="me"&&!m.read).length;
        const muted=DB.muted.includes(u.id);
        return(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",cursor:"pointer",borderBottom:`1px solid ${T.divider}`}} onClick={()=>onOpenChat(u)}>
            <Avatar user={u} size={48} showOnline/>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontWeight:600,fontSize:15,color:T.text,display:"flex",alignItems:"center"}}>{u.fullName}{u.premium&&<PBadge size={13}/>}{isAnonPhone(u.phone)&&<AnonBadge/>}</span>
                <span style={{fontSize:11,color:T.sub}}>{last?.time||""}</span>
              </div>
              <div style={{fontSize:13,color:T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {muted&&"🔕 "}{last?(last.deleted?"Сообщение удалено":((last.from==="me"?"Вы: ":"")+last.text)):"Нет сообщений"}
              </div>
            </div>
            {unread>0&&!muted&&<div style={{background:T.accent,borderRadius:10,minWidth:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,padding:"0 5px",color:"#fff"}}>{unread}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Favorites Tab ────────────────────────────────────────────────────────────
function FavoritesTab({currentUser,onOpenChat,T,fontSize}){
  const [,fu]=useState(0);
  function toggleFav(id){const i=DB.favorites.indexOf(id);if(i>=0)DB.favorites.splice(i,1);else DB.favorites.push(id);fu(n=>n+1);}
  return(
    <div style={{paddingBottom:20,fontSize}}>
      <div style={{padding:"16px 20px 10px",borderBottom:`1px solid ${T.divider}`}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>Избранное ⭐</div>
      </div>
      {DB.favorites.length===0&&<div style={{textAlign:"center",color:T.sub,marginTop:50}}><div style={{fontSize:44}}>⭐</div><div style={{marginTop:10,fontSize:14}}>Нет избранных</div></div>}
      {DB.users.filter(u=>DB.favorites.includes(u.id)).map(u=>(
        <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:`1px solid ${T.divider}`,cursor:"pointer"}} onClick={()=>onOpenChat(u)}>
          <Avatar user={u} size={48} showOnline/><div style={{flex:1}}><div style={{fontWeight:600,color:T.text,display:"flex",alignItems:"center"}}>{u.fullName}{u.premium&&<PBadge/>}</div><div style={{fontSize:12,color:T.sub}}>@{u.username}</div></div>
          <button onClick={e=>{e.stopPropagation();toggleFav(u.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:"#f59e0b",fontSize:20}}>★</button>
        </div>
      ))}
      {DB.users.filter(u=>u.id!==currentUser.id&&!DB.favorites.includes(u.id)).length>0&&(
        <>
          <div style={{padding:"12px 16px 6px",fontSize:11,color:T.sub,textTransform:"uppercase",letterSpacing:1}}>Все контакты</div>
          {DB.users.filter(u=>u.id!==currentUser.id&&!DB.favorites.includes(u.id)).map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 16px",borderBottom:`1px solid ${T.divider}`}}>
              <Avatar user={u} size={40}/><div style={{flex:1,color:T.text,fontSize:14,display:"flex",alignItems:"center"}}>{u.fullName}{u.premium&&<PBadge/>}{isAnonPhone(u.phone)&&<AnonBadge/>}</div>
              <button onClick={()=>toggleFav(u.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.sub,fontSize:20}}>☆</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({currentUser,onUpdateUser,T,fontSize}){
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(currentUser.fullName);
  const [username,setUsername]=useState(currentUser.username);
  const [bio,setBio]=useState(currentUser.bio||"");
  const fileRef=useRef(null);
  function save(){onUpdateUser({...currentUser,fullName:name,username,bio});setEditing(false);}
  function handleAvatar(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>onUpdateUser({...currentUser,avatar:ev.target.result});r.readAsDataURL(file);}
  const IStyle={width:"100%",padding:"12px 14px",borderRadius:10,background:T.input,border:`1px solid ${T.border}`,color:T.text,fontSize:14,fontFamily:"'Golos Text',sans-serif",outline:"none",boxSizing:"border-box"};
  return(
    <div style={{paddingBottom:24,fontSize}}>
      <div style={{padding:"16px 20px 10px",borderBottom:`1px solid ${T.divider}`}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>Профиль</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 20px 16px"}}>
        <div style={{position:"relative",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
          <Avatar user={currentUser} size={90}/>
          <div style={{position:"absolute",bottom:0,right:0,background:T.accent,borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📷</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatar}/>
        <div style={{fontSize:11,color:T.sub,marginTop:6}}>Нажмите для смены фото</div>
        {editing?(
          <div style={{width:"100%",marginTop:20,display:"flex",flexDirection:"column",gap:10}}>
            <input style={IStyle} placeholder="Имя и фамилия" value={name} onChange={e=>setName(e.target.value)}/>
            <input style={IStyle} placeholder="@username" value={username} onChange={e=>setUsername(e.target.value)}/>
            <textarea placeholder="О себе..." value={bio} onChange={e=>setBio(e.target.value)} style={{...IStyle,resize:"vertical",minHeight:70}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={save} style={{flex:1,padding:"10px",background:T.accent,borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer"}}>Сохранить</button>
              <button onClick={()=>setEditing(false)} style={{flex:1,padding:"10px",background:T.bubble,borderRadius:12,color:T.text,fontSize:14,border:`1px solid ${T.border}`,cursor:"pointer"}}>Отмена</button>
            </div>
          </div>
        ):(
          <div style={{textAlign:"center",marginTop:16,width:"100%"}}>
            <div style={{fontSize:20,fontWeight:700,color:T.text,display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:2}}>
              {currentUser.fullName}{currentUser.premium&&<PBadge/>}{isAnonPhone(currentUser.phone)&&<AnonBadge/>}{currentUser.role==="owner"&&<OwnerBadge/>}
            </div>
            <div style={{color:T.accent,fontSize:14,marginTop:4}}>@{currentUser.username}</div>
            {!currentUser.hidePhone&&currentUser.phone&&<div style={{color:T.sub,fontSize:12,marginTop:2}}>+{currentUser.phone}</div>}
            {currentUser.bio&&<div style={{color:T.sub,fontSize:13,marginTop:8,lineHeight:1.5,padding:"0 20px"}}>{currentUser.bio}</div>}
            {currentUser.premium&&<div style={{marginTop:12,padding:"0 16px"}}><PremiumBadgeFull/></div>}
            <button onClick={()=>setEditing(true)} style={{marginTop:14,padding:"8px 24px",background:T.bubble,borderRadius:10,color:T.text,fontSize:13,border:`1px solid ${T.border}`,cursor:"pointer"}}>✏️ Редактировать</button>
          </div>
        )}
      </div>
      <div style={{display:"flex",margin:"0 16px",background:T.section,borderRadius:14,overflow:"hidden",border:`1px solid ${T.border}`}}>
        {[["Чатов",DB.users.length-1],["Избранных",DB.favorites.length],["Сообщений",Object.values(DB.messages).flat().filter(m=>m.from==="me").length]].map(([label,val])=>(
          <div key={label} style={{flex:1,padding:"14px 10px",textAlign:"center",borderRight:`1px solid ${T.border}`}}>
            <div style={{fontSize:20,fontWeight:700,color:T.text}}>{val}</div>
            <div style={{fontSize:11,color:T.sub,marginTop:2}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({currentUser,onUpdateUser,onLogout,theme,setTheme,fontSize,setFontSize,T}){
  const [hidePhone,setHidePhone]=useState(currentUser.hidePhone||false);
  const [,fu]=useState(0);
  function toggleHide(v){setHidePhone(v);onUpdateUser({...currentUser,hidePhone:v});}
  function toggleMute(id){const i=DB.muted.indexOf(id);if(i>=0)DB.muted.splice(i,1);else DB.muted.push(id);fu(n=>n+1);}
  function toggleBlock(id){const i=DB.blocked.indexOf(id);if(i>=0)DB.blocked.splice(i,1);else DB.blocked.push(id);fu(n=>n+1);}
  function toggleArchive(id){const i=DB.archived.indexOf(id);if(i>=0)DB.archived.splice(i,1);else DB.archived.push(id);fu(n=>n+1);}
  const SR=({label,children})=><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.divider}`,fontSize:14,color:T.text}}><span>{label}</span>{children}</div>;
  const Tog=({label,value,onChange})=><div onClick={()=>onChange(!value)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${T.divider}`,fontSize:14,color:T.text,cursor:"pointer"}}><span>{label}</span><div style={{width:44,height:24,borderRadius:12,background:value?T.accent:T.bubble,position:"relative",transition:"background 0.3s",border:`1px solid ${T.border}`}}><div style={{position:"absolute",top:2,left:value?22:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.3s"}}/></div></div>;
  const Sec=({title,icon,children})=><div style={{marginBottom:8}}><div style={{padding:"12px 16px 6px",fontSize:11,color:T.sub,textTransform:"uppercase",letterSpacing:1}}>{icon} {title}</div><div style={{background:T.section,borderTop:`1px solid ${T.divider}`,borderBottom:`1px solid ${T.divider}`}}>{children}</div></div>;
  return(
    <div style={{paddingBottom:24,fontSize}}>
      <div style={{padding:"16px 20px 10px",borderBottom:`1px solid ${T.divider}`}}>
        <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>Настройки</div>
      </div>
      <Sec title="Внешний вид" icon="🎨">
        <SR label="Тема"><div style={{display:"flex",gap:6}}>{["dark","light"].map(t=><button key={t} onClick={()=>setTheme(t)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${T.border}`,background:theme===t?T.accent:T.bubble,color:theme===t?"#fff":T.sub}}>{t==="dark"?"🌙 Тёмная":"☀️ Светлая"}</button>)}</div></SR>
        <SR label="Шрифт"><div style={{display:"flex",gap:6}}>{[{v:13,l:"A",s:11},{v:15,l:"A",s:13},{v:17,l:"A",s:15}].map(({v,l,s})=><button key={v} onClick={()=>setFontSize(v)} style={{padding:"5px 12px",borderRadius:20,fontSize:s,cursor:"pointer",border:`1px solid ${T.border}`,background:fontSize===v?T.accent:T.bubble,color:fontSize===v?"#fff":T.sub}}>{l}</button>)}</div></SR>
      </Sec>
      <Sec title="Конфиденциальность" icon="🔒">
        <Tog label="Скрыть номер телефона" value={hidePhone} onChange={toggleHide}/>
        <SR label="Поиск по username"><span style={{color:T.accent,fontSize:12}}>Включён</span></SR>
      </Sec>
      <Sec title="Управление чатами" icon="💬">
        {DB.users.filter(u=>u.id!==currentUser.id).map(u=>(
          <div key={u.id} style={{padding:"10px 16px",borderBottom:`1px solid ${T.divider}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><Avatar user={u} size={32}/><span style={{fontWeight:600,color:T.text,fontSize:14}}>{u.fullName}</span></div>
            <div style={{display:"flex",gap:6,paddingLeft:42}}>
              {[{label:DB.muted.includes(u.id)?"🔔 Звук":"🔕 Мут",fn:()=>toggleMute(u.id)},{label:DB.archived.includes(u.id)?"📤 Из архива":"📦 Архив",fn:()=>toggleArchive(u.id)},{label:DB.blocked.includes(u.id)?"✓ Разблок":"🚫 Блок",fn:()=>toggleBlock(u.id),danger:!DB.blocked.includes(u.id)}].map(btn=><button key={btn.label} onClick={btn.fn} style={{padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer",border:`1px solid ${btn.danger?"rgba(255,80,80,0.3)":T.border}`,background:btn.danger?"rgba(255,80,80,0.08)":T.bubble,color:btn.danger?"#ff6b6b":T.sub}}>{btn.label}</button>)}
            </div>
          </div>
        ))}
      </Sec>
      <Sec title="О приложении" icon="💬">
        <SR label="Версия"><span style={{color:T.sub,fontSize:13}}>2.2.0</span></SR>
        <SR label="Название"><span style={{color:T.sub,fontSize:13}}>Volt Messenger</span></SR>
        <div style={{padding:"10px 16px 6px",fontSize:12,color:T.sub,lineHeight:1.7}}>Volt — защищённый мессенджер с анонимными номерами и Premium-подпиской.</div>
      </Sec>
      <Sec title="Аккаунт" icon="👤">
        <SR label="Имя"><span style={{color:T.sub,fontSize:13}}>{currentUser.fullName}</span></SR>
        <SR label="Username"><span style={{color:T.accent,fontSize:13}}>@{currentUser.username}</span></SR>
        {currentUser.phone&&<SR label="Номер"><span style={{color:T.sub,fontSize:13}}>{currentUser.hidePhone?"скрыт":"+"+currentUser.phone}</span></SR>}
        {currentUser.role&&<SR label="Роль"><span style={{color:currentUser.role==="owner"?"#f59e0b":T.sub,fontSize:13}}>{currentUser.role==="owner"?"👑 Владелец":"Пользователь"}</span></SR>}
      </Sec>
      <div style={{padding:"0 16px"}}>
        <button onClick={onLogout} style={{width:"100%",padding:"12px",background:"rgba(255,80,80,0.1)",borderRadius:12,color:"#ff6b6b",fontSize:14,fontFamily:"'Golos Text',sans-serif",border:"1px solid rgba(255,80,80,0.2)",cursor:"pointer"}}>Выйти из аккаунта</button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("login");
  const [currentUser,setCurrentUser]=useState(null);
  const [tab,setTab]=useState("chats");
  const [openChat,setOpenChat]=useState(null);
  const [theme,setTheme]=useState("dark");
  const [fontSize,setFontSize]=useState(14);
  const T=THEMES[theme];

  function handleLogin(user){ setCurrentUser(user); if(!DB.messages[user.id])DB.messages[user.id]=[]; setScreen("app"); }
  function handleLogout(){ setCurrentUser(null); setScreen("login"); setTab("chats"); }

  const totalUnread=currentUser?DB.users.filter(u=>u.id!==currentUser.id).reduce((acc,u)=>acc+(DB.messages[u.id]||[]).filter(m=>m.from!=="me"&&!m.read).length,0):0;

  if(screen==="register")return <RegisterScreen onRegister={handleLogin} onLogin={()=>setScreen("login")} T={T}/>;
  if(screen==="login")return <LoginScreen onLogin={handleLogin} onRegister={()=>setScreen("register")} T={T}/>;
  if(openChat)return <ChatWindow user={openChat} currentUser={currentUser} onBack={()=>setOpenChat(null)} T={T} fontSize={fontSize}/>;

  const isOwner=currentUser?.role==="owner";
  const tabs=[
    {id:"chats",icon:"💬",label:"Чаты",badge:totalUnread},
    {id:"favorites",icon:"⭐",label:"Избранное"},
    ...(isOwner?[{id:"admin",icon:"👑",label:"Админ"}]:[]),
    {id:"settings",icon:"⚙️",label:"Настройки"},
    {id:"profile",icon:"👤",label:"Профиль"},
  ];

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:T.bg,color:T.text,fontFamily:"'Golos Text',sans-serif",maxWidth:480,margin:"0 auto",fontSize}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&family=Golos+Text:wght@400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        input,textarea{outline:none;}button{cursor:pointer;border:none;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.2);border-radius:2px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
        input::placeholder,textarea::placeholder{color:${T.sub};}
      `}</style>

      {/* Owner banner */}
      {isOwner&&tab!=="admin"&&(
        <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(249,115,22,0.1))",borderBottom:"1px solid rgba(245,158,11,0.2)",padding:"6px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#f59e0b"}}>👑 Режим владельца · +{OWNER_PHONE}</span>
          <button onClick={()=>setTab("admin")} style={{background:"rgba(245,158,11,0.2)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:8,padding:"3px 10px",fontSize:11,color:"#f59e0b",cursor:"pointer"}}>Админ-панель →</button>
        </div>
      )}

      <div style={{flex:1,overflow:"auto"}}>
        {tab==="chats"&&<ChatsTab currentUser={currentUser} onOpenChat={setOpenChat} T={T} fontSize={fontSize}/>}
        {tab==="favorites"&&<FavoritesTab currentUser={currentUser} onOpenChat={setOpenChat} T={T} fontSize={fontSize}/>}
        {tab==="settings"&&<SettingsTab currentUser={currentUser} onUpdateUser={setCurrentUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} T={T}/>}
        {tab==="profile"&&<ProfileTab currentUser={currentUser} onUpdateUser={setCurrentUser} T={T} fontSize={fontSize}/>}
        {tab==="admin"&&isOwner&&<AdminPanel onBack={()=>setTab("chats")} T={T}/>}
      </div>

      <div style={{display:"flex",borderTop:`1px solid ${T.divider}`,background:T.tabBar,backdropFilter:"blur(12px)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",color:tab===t.id?(t.id==="admin"?"#f59e0b":T.accent):T.sub,fontFamily:"'Golos Text',sans-serif",fontSize:10,transition:"color 0.2s",position:"relative"}}>
            <span style={{fontSize:20,position:"relative"}}>
              {t.icon}
              {t.badge>0&&<span style={{position:"absolute",top:-4,right:-8,background:T.accent,borderRadius:10,minWidth:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,padding:"0 3px",color:"#fff"}}>{t.badge}</span>}
            </span>
            <span style={{marginTop:2}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
