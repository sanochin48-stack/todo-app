/* Credential is kept in memory only. Business functions keep using rpc(name,arg). */
window.EstheAPI=(()=>{
 let credential='',nonce='',profile=null;
 const cfg=()=>window.ESTHE_CONFIG||{};
 const reset=()=>{credential='';profile=null;};
 function configured(){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(cfg().apiUrl||'')&&/\.apps\.googleusercontent\.com$/.test(cfg().googleClientId||'');}
 async function call(action,data){
  if(!configured())throw Error('接続先が未設定です。管理者に確認してください。');
  if(!credential)throw Error('Googleアカウントでログインしてください。');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),cfg().timeoutMs||45000);
  try{
   const r=await fetch(cfg().apiUrl,{method:'POST',mode:'cors',credentials:'omit',redirect:'follow',cache:'no-store',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action,data,credential,nonce}),signal:controller.signal});
   if(!r.ok)throw Error('APIへ接続できません。設定と通信状態を確認してください。');
   let out;try{out=await r.json();}catch(_){throw Error('APIからJSONを受け取れませんでした。Googleの公開設定とAPI用URLを確認してください。');}
   if(out.success!==true){if(out.code==='UNAUTHENTICATED'){reset();window.dispatchEvent(new Event('esthe-auth-required'));}throw Error(out.error||'保存結果を確認できません。');}
   return out.data;
  }catch(e){
   if(e.name==='AbortError'||e instanceof TypeError)throw Error('通信を確認できませんでした。保存操作は反映済みの場合があります。入力を変更せず再試行してください。');
   throw e;
  }finally{clearTimeout(timer);}
 }
 function renderLogin(target,onSuccess,onError){
  if(!configured()){onError(Error('API URLとGoogleログイン設定の登録待ちです。'));return;}
  if(!window.google?.accounts?.id){onError(Error('Googleログインを読み込めませんでした。通信を確認して再試行してください。'));return;}
  nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  google.accounts.id.initialize({client_id:cfg().googleClientId,nonce,auto_select:false,callback:async response=>{
   credential=response.credential;
   try{profile=await call('getIdentity');onSuccess(profile);}catch(e){reset();onError(e);}
  }});
  google.accounts.id.renderButton(target,{theme:'outline',size:'large',text:'signin_with',locale:'ja'});
 }
 function logout(){reset();nonce='';if(window.google?.accounts?.id)google.accounts.id.disableAutoSelect();}
 return {call,renderLogin,logout,configured,get profile(){return profile;}};
})();
