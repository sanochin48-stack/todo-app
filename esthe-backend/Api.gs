/* Separate API project. Do not replace the existing HTML web app deployment. */
function doGet() { return json_({success:true,data:{service:'esthe-api',version:1}}); }
function doPost(e) {
 try {
  if(!e || !e.postData || e.postData.contents.length>150000)throw apiError_('BAD_REQUEST','リクエストを確認してください。');
  let p;try{p=JSON.parse(e.postData.contents);}catch(_){throw apiError_('BAD_REQUEST','JSON形式が不正です。');}
  if(!p || typeof p!=='object' || Array.isArray(p))throw apiError_('BAD_REQUEST','リクエストを確認してください。');
  if(!['getData','saveRecord','getIdentity'].includes(p.action))throw apiError_('BAD_ACTION','対応していない操作です。');
  const user=verifyUser_(p.credential,p.nonce);
  let result;
  if(p.action==='getIdentity')result={sub:user.sub,email:user.email};
  else if(p.action==='getData')result=getData(p.data);
  else {
   if(!p.data||typeof p.data!=='object'||Array.isArray(p.data))throw apiError_('BAD_REQUEST','記録内容がありません。');
   // Verified identity supplements the manually entered operator (shared account use).
   p.data.authSubject=user.sub;p.data.authEmail=user.email;
   result=saveRecord(p.data);
  }
  return json_({success:true,data:result});
 }catch(e){return json_({success:false,error:e.apiCode?e.message:'処理できませんでした。入力を残したまま再試行してください。保存時は店舗の更新競合・シートの列構成も確認してください。',code:e.apiCode||'OPERATION_FAILED'});}
}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function apiError_(code,message){const e=new Error(message);e.apiCode=code;return e;}
function settings_(){
 const p=PropertiesService.getScriptProperties();
 const c={clientId:p.getProperty('GOOGLE_CLIENT_ID'),sheetId:p.getProperty('SPREADSHEET_ID'),emails:[],subjects:[]};
 try{c.emails=JSON.parse(p.getProperty('ALLOWED_EMAILS')||'[]');c.subjects=JSON.parse(p.getProperty('ALLOWED_SUBJECTS')||'[]');}catch(_){throw apiError_('CONFIGURATION','管理者がAPI設定を確認してください。');}
 if(!c.clientId||!c.sheetId||!Array.isArray(c.emails)||!Array.isArray(c.subjects)||!c.emails.length)throw apiError_('CONFIGURATION','管理者がAPI設定を確認してください。');
 c.emails=c.emails.map(x=>String(x).trim().toLowerCase());return c;
}
function googleKeys_(refresh){
 const cache=CacheService.getScriptCache(),key='google-jwks-v1';
 if(!refresh){const v=cache.get(key);if(v){try{return JSON.parse(v);}catch(_){}}}
 const r=UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/certs',{muteHttpExceptions:true});
 if(r.getResponseCode()!==200)throw apiError_('AUTH_UNAVAILABLE','Googleの認証確認に接続できません。しばらくして再試行してください。');
 const data=JSON.parse(r.getContentText());if(!Array.isArray(data.keys))throw apiError_('AUTH_UNAVAILABLE','認証キーを取得できません。');
 const h=r.getHeaders(),cc=String(h['Cache-Control']||h['cache-control']||''),m=cc.match(/max-age=(\d+)/);
 cache.put(key,JSON.stringify(data.keys),Math.max(1,Math.min(21600,m?Number(m[1]):300)));return data.keys;
}
function verifyUser_(token,nonce){
 const c=settings_();
 if(typeof token!=='string'||token.length>12000||typeof nonce!=='string'||nonce.length<32||nonce.length>200)throw apiError_('UNAUTHENTICATED','Googleアカウントでログインしてください。');
 let parsed;try{parsed=KJUR.jws.JWS.parse(token);}catch(_){throw apiError_('UNAUTHENTICATED','認証情報を確認できません。再ログインしてください。');}
 const head=parsed.headerObj;
 if(head.alg!=='RS256'||typeof head.kid!=='string')throw apiError_('UNAUTHENTICATED','認証方式が不正です。');
 let key=googleKeys_(false).find(k=>k.kid===head.kid&&k.kty==='RSA');
 if(!key)key=googleKeys_(true).find(k=>k.kid===head.kid&&k.kty==='RSA');
 if(!key)throw apiError_('UNAUTHENTICATED','認証キーが見つかりません。再ログインしてください。');
 let valid=false;try{valid=KJUR.jws.JWS.verifyJWT(token,KEYUTIL.getKey(key),{alg:['RS256'],iss:['accounts.google.com','https://accounts.google.com'],aud:[c.clientId],gracePeriod:0});}catch(_){}
 const b=parsed.payloadObj,now=Math.floor(Date.now()/1000);
 if(!valid||b.aud!==c.clientId||!Number.isFinite(b.exp)||b.exp<=now||!Number.isFinite(b.iat)||b.iat>now+60||b.nonce!==nonce||typeof b.sub!=='string'||!b.sub||b.email_verified!==true||(b.azp&&b.azp!==c.clientId))throw apiError_('UNAUTHENTICATED','認証の期限切れ、または不正な認証情報です。再ログインしてください。');
 const email=String(b.email||'').toLowerCase();
 const pinned=c.subjects.includes(b.sub);
 if(!c.emails.includes(email)||(c.subjects.length&&!pinned))throw apiError_('FORBIDDEN','このGoogleアカウントには利用許可がありません。');
 // Google is authoritative for Gmail and managed Workspace addresses. Pin sub otherwise.
 if(!email.endsWith('@gmail.com')&&!b.hd&&!pinned)throw apiError_('FORBIDDEN','このアカウントは管理者によるGoogleアカウントIDの登録が必要です。');
 return {sub:b.sub,email};
}
