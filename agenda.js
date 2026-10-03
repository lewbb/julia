/* Calendário de agendamento (página Agendar) */
(function(){
'use strict';
const AG={ini:8*60,fim:19*60,passo:30,fechados:[0],meses:3}; /* 0 = domingo fechado; ajuste aqui */
const MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const S={serv:[],ocup:[],bloq:[],d:'',h:'',sv:'',nome:'',tel:'',obs:'',cm:(function(){const d=new Date();d.setDate(1);return d;})(),err:'',done:false,link:''};
let root=null,loaded=false;
const J=()=>window.JR||{};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const z=n=>String(n).padStart(2,'0');
const hoje=()=>{const n=new Date();return n.getFullYear()+'-'+z(n.getMonth()+1)+'-'+z(n.getDate());};
const toMin=h=>{const p=String(h).split(':');return +p[0]*60+ +p[1];};
const fmtH=m=>z(Math.floor(m/60))+':'+z(m%60);
const br=d=>d.split('-').reverse().join('/');
const svc=()=>S.serv.find(x=>String(x.id)===S.sv)||{};
const dur=()=>svc().duracao_min||90;
const busy=(d,a,b)=>S.ocup.map(o=>[o.data,toMin(o.horario),toMin(o.horario)+(o.duracao_min||90)]).concat(S.bloq.map(o=>[o.data,toMin(o.inicio),toMin(o.fim)])).some(x=>x[0]===d&&a<x[2]&&x[1]<b);
function livres(){
  if(!S.d) return []; const du=dur(), n=new Date(), agora=n.getHours()*60+n.getMinutes(), hj=S.d===hoje(), l=[];
  for(let m=AG.ini;m+du<=AG.fim;m+=AG.passo) if(!busy(S.d,m,m+du)&&!(hj&&m<=agora)) l.push(fmtH(m));
  return l;
}
function cal(){
  const y=S.cm.getFullYear(),mo=S.cm.getMonth(),t=new Date(),dif=(y-t.getFullYear())*12+mo-t.getMonth(),n=new Date(y,mo+1,0).getDate(),hj=hoje(); let c='';
  for(let i=0;i<new Date(y,mo,1).getDay();i++) c+='<i></i>';
  for(let k=1;k<=n;k++){ const ds=y+'-'+z(mo+1)+'-'+z(k), off=ds<hj||AG.fechados.indexOf(new Date(y,mo,k).getDay())>=0;
    c+='<button type="button" data-ad="'+ds+'"'+(off?' disabled':'')+' class="'+(ds===S.d?'on ':'')+(ds===hj?'hj':'')+'">'+k+'</button>'; }
  return '<div class="ag-mh"><button type="button" data-am="-1"'+(dif<=0?' disabled':'')+' aria-label="Mês anterior">‹</button><b>'+MES[mo]+' '+y+'</b><button type="button" data-am="1"'+(dif>=AG.meses?' disabled':'')+' aria-label="Próximo mês">›</button></div><div class="ag-wd">'+['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="ag-dg">'+c+'</div>';
}
function paint(){
  if(!root) return; const j=J();
  if(!j.ready){ root.innerHTML='<div class="price-card"><h3 class="serif">Agenda online em breve</h3><p>Por enquanto, agende pelo WhatsApp.</p></div>'; return; }
  if(S.done){ const c=window.JR_CFG||{};
    root.innerHTML='<div class="price-card"><h3 class="serif">Pedido enviado! ✦</h3><p>A Julia vai confirmar o seu horário.</p>'+(c.pix?'<p>'+(c.sinal?'Para reservar, envie um sinal de R$ '+Number(c.sinal).toFixed(2).replace('.',',')+' por Pix.':'Para reservar, envie o sinal por Pix.')+'<br><b>Chave Pix: '+esc(c.pix)+'</b></p>':'')+'<p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" target="_blank" rel="noopener" href="'+S.link+'">Avisar a Julia no WhatsApp</a><button class="btn ghost" data-ar="novo">Fazer outro pedido</button></p></div>'; return; }
  const l=livres();
  root.innerHTML='<div class="price-card ag"><div class="ag-g"><div class="cl-grid">'+
   '<label>Serviço<select data-af="sv">'+S.serv.map(s=>'<option value="'+s.id+'"'+(String(s.id)===S.sv?' selected':'')+'>'+esc(s.nome)+(s.preco?' · R$ '+Number(s.preco).toFixed(2).replace('.',','):'')+'</option>').join('')+'</select></label>'+
   '<label>Seu nome<input data-af="nome" value="'+esc(S.nome)+'" autocomplete="name"></label><label>WhatsApp com DDD<input data-af="tel" value="'+esc(S.tel)+'" inputmode="tel" autocomplete="tel"></label>'+
   '<label>Observações ou referência<textarea data-af="obs" rows="2">'+esc(S.obs)+'</textarea></label></div>'+
   '<div><div class="ag-cal">'+cal()+'</div><div class="ag-sl">'+(S.d?(l.length?l.map(h=>'<button type="button" class="chip" data-ah="'+h+'" aria-pressed="'+(h===S.h)+'">'+h+'</button>').join(''):'<span class="sub">Sem horários livres neste dia.</span>'):'<span class="sub">Escolha a data para ver os horários livres.</span>')+'</div></div></div>'+
   '<p class="cl-msg" style="'+(S.err?'':'display:none')+'">'+esc(S.err)+'</p><p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" data-ar="enviar">Pedir horário</button><button class="btn ghost" data-ar="espera">Lista de espera</button></p></div>';
}
async function carregar(){
  const q=J().sb; try{
    const [a,b]=await Promise.all([q.rpc('horarios_ocupados'),q.rpc('horarios_bloqueados')]);
    S.ocup=a.data||[]; S.bloq=b.data||[];
  }catch(e){}
}
async function iniciar(){
  const q=J().sb; try{ const r=await q.from('servicos').select('*').eq('ativo',true).order('id'); S.serv=r.data||[]; if(!S.sv&&S.serv[0]) S.sv=String(S.serv[0].id); }catch(e){}
  await carregar(); paint();
}
function msg(titulo){
  return 'Olá! '+titulo+' '+svc().nome+'.\nNome: '+S.nome+'\nData: '+(S.d?br(S.d):'a combinar')+'\nHorário: '+(S.h||'a combinar')+(S.obs?'\nObs: '+S.obs:'')+'\nWhatsApp: '+S.tel;
}
async function enviar(espera){
  const t=S.tel.replace(/\D/g,'');
  const falha=m=>{S.err=m;paint();};
  if(S.nome.trim().length<2) return falha('Diga o seu nome.');
  if(t.length<10) return falha('Informe o WhatsApp com DDD.');
  if(!espera){
    if(!S.d) return falha('Escolha uma data no calendário.');
    if(!S.h) return falha('Escolha um horário livre.');
    await carregar();
    if(busy(S.d,toMin(S.h),toMin(S.h)+dur())){ S.h=''; return falha('Esse horário acabou de ser ocupado. Escolha outro.'); }
  }
  const u=J().user;
  const row={user_id:u?u.id:null,nome:S.nome.trim(),telefone:t,servico:svc().nome,data:S.d||hoje(),horario:espera?'':S.h,duracao_min:dur(),obs:S.obs||null,status:espera?'espera':'pendente'};
  const r=await J().sb.from('agendamentos').insert(row);
  if(r.error) return falha(r.error.code==='23505'?'Esse horário acabou de ser ocupado. Escolha outro.':'Não foi possível enviar agora. Tente de novo.');
  S.link=J().wa(msg(espera?'Quero entrar na lista de espera para':'Pedi um horário no site para')); S.done=true; paint();
  if(J().refresh) J().refresh();
}
document.addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.af; if(!k||!root||!root.contains(e.target)) return;
  S[k]=e.target.value; if(k==='sv'){ S.h=''; paint(); }
});
document.addEventListener('click',e=>{
  if(!root||!root.contains(e.target)) return;
  const b=e.target.closest('[data-ad],[data-am],[data-ah],[data-ar]'); if(!b) return;
  S.err='';
  if(b.dataset.ad){ S.d=b.dataset.ad; S.h=''; paint(); }
  else if(b.dataset.am){ S.cm.setMonth(S.cm.getMonth()+ +b.dataset.am); paint(); }
  else if(b.dataset.ah){ S.h=b.dataset.ah; paint(); }
  else if(b.dataset.ar==='enviar') enviar(false);
  else if(b.dataset.ar==='espera') enviar(true);
  else if(b.dataset.ar==='novo'){ S.done=false; S.d=''; S.h=''; S.obs=''; paint(); }
});
const css=document.createElement('style');
css.textContent='.ag-g{display:grid;grid-template-columns:1fr 1fr;gap:28px}@media(max-width:820px){.ag-g{grid-template-columns:1fr}}.ag label{display:grid;gap:6px;font-weight:600;font-size:14px}.ag-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.ag-mh button{width:38px;height:38px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:20px;cursor:pointer}.ag-mh button:disabled{opacity:.3;cursor:default}.ag-wd,.ag-dg{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.ag-wd span{font-size:11px;color:var(--muted);padding:4px 0}.ag-dg button{aspect-ratio:1;border-radius:50%;font:inherit;cursor:pointer;background:transparent;color:var(--ink)}.ag-dg button:hover:not(:disabled){background:var(--accent-soft)}.ag-dg button:disabled{opacity:.28;cursor:default}.ag-dg button.hj{border:1px solid var(--accent)}.ag-dg button.on{background:var(--accent);color:var(--on-accent)}.ag-sl{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}';
document.head.appendChild(css);
window.AgendaUI={mount(el){ root=el; if(!el) return; if(!J().ready){ paint(); return; } if(!loaded){ loaded=true; paint(); iniciar(); } else paint(); }};
})();