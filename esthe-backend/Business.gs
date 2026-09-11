const LOG_HEADERS = ['記録ID','No','店舗','電話日時','進捗','訪問予定日時','次回連絡日','最初の反応','美容商品の意見への反応','プラチナジュエリーへの反応','マイクロスコープへの反応','価格を聞かれたか','断られた理由','相手が使った言葉','反応が良かった言葉','反応が悪かった言葉','メモ','分岐履歴','スクリプト版','保存日時','処理状態','県別リスト','使用スクリプト','担当者','検証記録JSON'];
const EVAL_KEYS=['authSubject','authEmail','opinionReaction','opinionWords','soilReaction','soilWords','scopeReaction','scopeWords','hookWhere','hookWords','guardWhere','guardWords','refusalWords'];
function evalRead_(v){try{const p=JSON.parse(v||'{}');return Object.fromEntries(EVAL_KEYS.map(k=>[k,typeof p[k]==='string'?p[k]:'']));}catch(e){return {};}}
function book_() { return SpreadsheetApp.openById(settings_().sheetId); }
function list_(ss,name) {
 name=name||'リスト_山梨';if(name!=='リスト'&&!/^リスト_.+/.test(name))throw new Error('県別リストの名前が正しくありません。');
 const sh = ss.getSheetByName(name);
 if (!sh) throw new Error('「リスト」シートがありません。');
 const rows=sh.getDataRange().getDisplayValues(), heads=rows[0];
 ['No','店名','電話','TEL日','進捗'].forEach(h=>{if(heads.indexOf(h)<0)throw new Error('リストの見出し「'+h+'」がありません。');});
 const items=rows.slice(1).map((row,i)=>({row:i+2,record:Object.fromEntries(heads.map((h,j)=>[h,row[j]||'']))})).filter(x=>x.record['店名']);
 const ids=items.map(x=>x.record.No);
 if(ids.some(id=>!id)||new Set(ids).size!==ids.length)throw new Error('Noが空欄または重複しています。元のリストで確認してください。');
 return {sh,heads,items};
}

function hpLink_(display, rich, formula) {
 const valid=v=>/^https?:\/\//i.test(String(v||'').trim())?String(v).trim():'';
 if(rich){
  const whole=valid(rich.getLinkUrl());if(whole)return whole;
  const links=[...new Set(rich.getRuns().map(run=>valid(run.getLinkUrl())).filter(Boolean))];
  if(links.length===1)return links[0];
 }
 // Literal HYPERLINK URL fallback; never evaluate a formula or cell reference.
 const m=String(formula||'').match(/^=\s*HYPERLINK\s*\(\s*"((?:[^"]|"")*)"\s*[,;]/i);
 return (m&&valid(m[1].replace(/""/g,'"')))||String(display||'');
}
function addHomepageLinks_(list){
 const col=list.heads.indexOf('HP');if(col<0||!list.items.length)return;
 const count=Math.max(...list.items.map(x=>x.row))-1;
 const range=list.sh.getRange(2,col+1,count,1),rich=range.getRichTextValues(),formulas=range.getFormulas();
 list.items.forEach(item=>{const i=item.row-2;item.record.HP=hpLink_(item.record.HP,rich[i][0],formulas[i][0]);});
}

function getData(options) {
 const ss=book_(), sheetName=options&&options.listSheet||'リスト_山梨', list=list_(ss,sheetName);
 addHomepageLinks_(list);
 const listSheets=ss.getSheets().map(s=>s.getName()).filter(n=>n==='リスト'||/^リスト_.+/.test(n));
 const scriptSets={};ss.getSheets().filter(s=>s.getName()==='スクリプト'||/^スクリプト_.+/.test(s.getName())).forEach(s=>{scriptSets[s.getName()]=s.getRange(1,1,Math.max(s.getLastRow(),1),Math.max(2,Math.min(s.getLastColumn(),4))).getDisplayValues();});
 if(!Object.keys(scriptSets).length)throw new Error('スクリプトのシートがありません。');
 const log=ss.getSheetByName('架電記録');let history=[];
 if(log&&log.getLastRow()>1){checkLog_(log);history=log.getRange(2,1,log.getLastRow()-1,LOG_HEADERS.length).getDisplayValues().filter(r=>r[20]==='完了'&&(r[21]===sheetName||(sheetName==='リスト_山梨'&&!ss.getSheetByName('リスト')&&r[21]==='リスト'))).map(r=>({requestId:r[0],id:r[1],name:r[2],date:r[3],status:r[4],appointment:r[5],next:r[6],first:r[7],beauty:r[8],jewelry:r[9],scope:r[10],price:r[11],reason:r[12],words:r[13],good:r[14],bad:r[15],note:r[16],path:r[17],version:r[18],listSheet:r[21],scriptSheet:r[22],operator:r[23],...evalRead_(r[24])}));}
 return {list:list.items.map(x=>x.record),scripts:scriptSets[Object.keys(scriptSets)[0]],scriptSets,listSheets,history};
}
function checkLog_(log,extend){const h=log.getRange(1,1,1,LOG_HEADERS.length).getDisplayValues()[0];if(!LOG_HEADERS.slice(0,24).every((v,i)=>h[i]===v)||(h[24]&&h[24]!==LOG_HEADERS[24]))throw new Error('「架電記録」の列構成が異なります。既存データを保護するため保存を停止しました。');if(extend&&!h[24])log.getRange(1,25).setValue(LOG_HEADERS[24]);}
function safe_(v){const s=String(v==null?'':v);return /^[=+\-@]/.test(s)?"'"+s:s;}
function validate_(p){
 if(!p||typeof p!=='object')throw new Error('記録内容がありません。');
 const keys=['id','name','date','status','appointment','next','first','beauty','jewelry','scope','price','reason','words','good','bad','note','path','version','requestId','expectedDate','expectedStatus','listSheet','scriptSheet','operator'];
 keys.push(...EVAL_KEYS);keys.forEach(k=>{if(p[k]!=null&&(typeof p[k]!=='string'||p[k].length>10000))throw new Error('入力内容が長すぎるか、形式が正しくありません。');});
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(p.requestId||''))throw new Error('保存IDが不正です。');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.date||'')||!isFinite(new Date(p.date+':00+09:00').getTime()))throw new Error('電話日時を入力してください。');
 if(!['アポ獲得','再電話','不在','資料送付','後日突撃','見送り','連絡不要','訪問済'].includes(p.status))throw new Error('結果を選択してください。');
 if(p.status==='アポ獲得'&&!p.appointment)throw new Error('訪問予定日時を入力してください。');
 if(p.appointment&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.appointment))throw new Error('訪問予定日時の形式が正しくありません。');
 if(p.next&&!/^\d{4}-\d{2}-\d{2}$/.test(p.next))throw new Error('次回連絡日の形式が正しくありません。');
}
function saveRecord(p) {
 validate_(p);const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
 const ss=book_(), list=list_(ss,p.listSheet), target=list.items.find(x=>x.record.No===p.id);
 if(!p.scriptSheet||(p.scriptSheet!=='スクリプト'&&!/^スクリプト_.+/.test(p.scriptSheet))||!ss.getSheetByName(p.scriptSheet))throw new Error('使用スクリプトが見つかりません。');
 if(!target||target.record['店名']!==p.name)throw new Error('店舗情報が変わっています。リストを更新して再度選択してください。');
 let log=ss.getSheetByName('架電記録'),oldRow=0,existing=null;
 if(log){checkLog_(log);if(log.getLastRow()>1){const rows=log.getRange(2,1,log.getLastRow()-1,LOG_HEADERS.length).getDisplayValues();const pos=rows.findIndex(r=>r[0]===p.requestId);if(pos>=0){oldRow=pos+2;existing=rows[pos];if(existing[1]!==p.id||existing[2]!==p.name||existing[21]!==p.listSheet)throw new Error('記録IDが一致しません。');if(existing[20]==='完了')return {date:existing[3],status:existing[4]};}}}
 const displayDate=p.date.replace('T',' '),nowDate=target.record['TEL日']||'',nowStatus=target.record['進捗']||'';
 const dateMatches=nowDate===(p.expectedDate||'')||(existing&&nowDate===displayDate);
 const statusMatches=nowStatus===(p.expectedStatus||'')||(existing&&nowStatus===p.status);
 if(!dateMatches||!statusMatches)throw new Error('別の画面からTEL日・進捗が更新されています。下書きを控えてリストを更新し、確認後に保存してください。');
 if(!log){log=ss.insertSheet('架電記録');log.getRange(1,1,1,LOG_HEADERS.length).setValues([LOG_HEADERS]);log.setFrozenRows(1);log.getRange(1,1,1,LOG_HEADERS.length).setBackground('#112c4b').setFontColor('#ffffff').setFontWeight('bold');}
 checkLog_(log,true);
 if(!oldRow){oldRow=log.getLastRow()+1;const values=[p.requestId,p.id,p.name,displayDate,p.status,p.appointment||'',p.next||'',p.first||'',p.beauty||'',p.jewelry||'',p.scope||'',p.price||'',p.reason||'',p.words||'',p.good||'',p.bad||'',p.note||'',p.path||'',p.version||'',Utilities.formatDate(new Date(),'Asia/Tokyo','yyyy-MM-dd HH:mm:ss'),'処理中',p.listSheet,p.scriptSheet,p.operator||'',JSON.stringify(Object.fromEntries(EVAL_KEYS.map(k=>[k,p[k]||''])))];log.getRange(oldRow,1,1,values.length).setNumberFormat('@').setValues([values.map(safe_)]);SpreadsheetApp.flush();}
 list.sh.getRange(target.row,list.heads.indexOf('TEL日')+1).setNumberFormat('@').setValue(displayDate);
 list.sh.getRange(target.row,list.heads.indexOf('進捗')+1).setValue(p.status);
 SpreadsheetApp.flush();log.getRange(oldRow,21).setValue('完了');SpreadsheetApp.flush();
 return {date:displayDate,status:p.status};
 } finally {lock.releaseLock();}
}
