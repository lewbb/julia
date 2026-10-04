/* Área da cliente (Supabase): login, agenda, desejos, avaliações e painel da Julia */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S={}; try{S=JSON.parse($('#site-state').textContent)||{};}catch(e){}
const CFG=S.supabase||{}, P=S.profile||{}, WA=String(P.whatsapp||'').replace(/\D/g,'');
const AG={ini:9*60,fim:18*60,passo:30,fechados:[0],meses:3}; // atendimento 09h-18h, fechado aos domingos
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const ready=!!(CFG.url&&CFG.key&&window.supabase);
const U={sb:null,user:null,perfil:null,tab:'agenda',auth:'entrar',servicos:[],aval:[],ag:[],de:[],av:[],aAg:[],aAv:[],msg:'',link:'',cal:new Date(new Date().getFullYear(),new Date().getMonth(),1),dtSel:'',horaSel:'',ocup:[],sub:'ped',fil:'pendente',mes:'',bq:[],aCl:[]};
let root=null;
const pad=n=>String(n).padStart(2,'0');
const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const br=d=>d.split('-').reverse().join('/');
const LBL={espera:'Lista de espera',pendente:'Aguardando confirmação',confirmado:'Confirmado',concluido:'Concluído',recusado:'Horário indisponível',cancelado:'Cancelado'};
const waUrl=m=>'https://wa.me/'+WA+(m?'?text='+encodeURIComponent(m):'');
const val=id=>{const e=$('#'+id);return e?e.value.trim():'';};

const css=document.createElement('style');
css.textContent='.cal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.cal-h button{width:38px;height:38px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:20px;cursor:pointer}.cal-h button:disabled{opacity:.35;cursor:default}.cal-w,.cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal-w span{font-size:12px;color:var(--muted)}.cal-g button,.cal-g i{aspect-ratio:1;border-radius:50%}.cal-g button{background:transparent;color:var(--ink);font:inherit;cursor:pointer}.cal-g button:hover:not(:disabled){background:var(--accent-soft)}.cal-g button.on{background:var(--accent);color:var(--on-accent)}.cal-g button.hj{box-shadow:inset 0 0 0 2px var(--accent)}.cal-g button:disabled{opacity:.3;cursor:default}#cl-slots{display:flex;gap:8px;flex-wrap:wrap}'+'.cl-box{margin-bottom:18px}.cl-box h3{margin:0 0 12px}.cl-row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--line)}.cl-row small{color:var(--muted);display:block}.cl-msg{padding:12px 16px;border-radius:14px;background:var(--accent-soft);margin-bottom:16px}.cl-grid{display:grid;gap:12px;max-width:520px}.cl-grid input,.cl-grid select,.cl-grid textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit}.cl-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.cl-two{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:820px){.cl-two{grid-template-columns:1fr}}';
document.head.appendChild(css);

async function loadPublic(){
  const [s,a]=await Promise.all([
    U.sb.from('servicos').select('*').eq('ativo',true).order('id'),
    U.sb.from('avaliacoes').select('nome,nota,comentario').eq('aprovada',true).order('criado_em',{ascending:false}).limit(12)]);
  U.servicos=s.data||[]; U.aval=a.data||[];
}
async function loadMine(){
  if(!U.user){U.perfil=null;return;}
  const id=U.user.id, q=U.sb;
  const [p,ag,de,av]=await Promise.all([
    q.from('perfis').select('*').eq('id',id).single(),
    q.from('agendamentos').select('*').eq('user_id',id).order('data',{ascending:false}),
    q.from('desejos').select('*').eq('user_id',id).order('criado_em',{ascending:false}),
    q.from('avaliacoes').select('*').eq('user_id',id).order('criado_em',{ascending:false})]);
  U.perfil=p.data; U.ag=ag.data||[]; U.de=de.data||[]; U.av=av.data||[];
  if(U.perfil&&U.perfil.is_admin){
    const [a1,a2,a3,a4]=await Promise.all([
      q.from('agendamentos').select('*').order('data',{ascending:false}).order('horario').limit(600),
      q.from('avaliacoes').select('*').eq('aprovada',false).order('criado_em'),
      q.from('bloqueios').select('*').gte('data',hoje()).order('data').order('inicio'),
      q.from('perfis').select('*').order('criado_em',{ascending:false})]);
    U.aAg=a1.data||[]; U.aAv=a2.data||[]; U.bq=a3.data||[]; U.aCl=a4.data||[];
  }
}
async function refresh(m){ try{ await Promise.all([loadPublic(),loadMine()]); }catch(e){} if(m!==undefined) U.msg=m; paint(); }
function say(m){ U.msg=m; U.link=''; paint(); }

const ERR_PT=[[/invalid login credentials/i,'E-mail ou senha incorretos, ou esta conta ainda não existe neste site. Confira os dados ou use a aba "Criar conta".'],[/email not confirmed/i,'Confirme seu e-mail pelo link que enviamos antes de entrar.'],[/already registered|already been registered/i,'Este e-mail já tem conta. Use a aba "Entrar".'],[/password should be at least|weak password/i,'A senha precisa ter pelo menos 6 caracteres.'],[/invalid.*email|unable to validate email/i,'Digite um e-mail válido.'],[/rate limit|too many requests/i,'Muitas tentativas. Aguarde um minuto e tente de novo.']];
function erro(e){ const m=(e&&e.message)||'', t=(ERR_PT.find(x=>x[0].test(m))||[])[1]; U.msg=(e&&e.code==='23505')?'Esse horário acabou de ser reservado. Escolha outro.':(t||'Não deu certo: '+(m||'tente de novo')); U.link=''; paint(); }

function stars(n){ return '★'.repeat(n)+'☆'.repeat(5-n); }
function avalPub(){
  return '<div id="avaliacoes-pub" class="cl-box"><h3 class="serif">O que as clientes <em>dizem</em></h3>'+(U.aval.length?'<div class="price-grid">'+U.aval.map(a=>'<div class="price-card"><div style="color:var(--accent);font-size:20px">'+stars(a.nota)+'</div><p>'+esc(a.comentario||'')+'</p><b>'+esc(a.nome)+'</b></div>').join('')+'</div>':'<p class="sub">As primeiras avaliações aparecem aqui.</p>')+'</div>';
}
function viewOut(){
  return '<div class="price-card cl-box"><h3 class="serif">Entrar no painel</h3><div class="cl-grid"><input id="cl-email" type="email" placeholder="E-mail" autocomplete="username"><input id="cl-senha" type="password" placeholder="Senha" autocomplete="current-password"><button class="btn" data-cl="login">Entrar</button></div></div>';
}
function tabs(){ return ''; }
function gcal(a){ const i=toMin(String(a.horario||'').slice(0,5)), f=i+(a.duracao_min||90), dd=a.data.replace(/-/g,''), t=m=>pad(Math.floor(m/60))+pad(m%60)+'00';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent((P.name||'Julia Ruth')+' · '+(a.servico))+'&dates='+dd+'T'+t(i)+'/'+dd+'T'+t(f); }
function tabAgenda(){
  const meus=U.ag.map(a=>{const vivo=(a.status==='pendente'||a.status==='confirmado')&&a.data>=hoje();return '<div class="cl-row"><div><b>'+br(a.data)+' às '+esc(String(a.horario||'').slice(0,5))+'</b><small>'+esc(a.servico)+' · '+LBL[a.status]+'</small></div><div style="display:flex;gap:8px;flex-wrap:wrap">'+(a.status==='confirmado'&&vivo?'<a class="btn ghost sm" target="_blank" rel="noopener" href="'+gcal(a)+'">+ Agenda</a>':'')+(vivo?'<button class="btn ghost sm" data-cl="cancelar" data-id="'+a.id+'">Cancelar</button>':'')+'</div></div>';}).join('')||'<p class="sub">Você ainda não tem horários.</p>';
  return '<div class="cl-two"><div class="price-card"><h3 class="serif">Pedir um horário</h3><p>Use a página <b>Agendar</b> no menu. Se você estiver logada, o pedido também aparece aqui em "Meus horários".</p></div><div class="price-card"><h3 class="serif">Meus horários</h3>'+meus+'</div></div>';
}
function tabDesejos(){
  return '<div class="cl-two"><div class="price-card"><h3 class="serif">Salvar um desejo</h3><div class="cl-grid"><input id="cl-dtit" placeholder="Ex.: francesinha com glitter dourado"><textarea id="cl-dnota" rows="2" placeholder="Detalhes ou link de referência (opcional)"></textarea><button class="btn" data-cl="des-add">Salvar na lista</button></div></div>'+
   '<div class="price-card"><h3 class="serif">Minha lista</h3>'+(U.de.map(d=>'<div class="cl-row"><div><b>'+esc(d.titulo)+'</b>'+(d.nota?'<small>'+esc(d.nota)+'</small>':'')+'</div><button class="btn ghost sm" data-cl="des-rm" data-id="'+d.id+'">Remover</button></div>').join('')||'<p class="sub">Sua lista está vazia.</p>')+'</div></div>';
}
function tabAvaliar(){
  return '<div class="cl-two"><div class="price-card"><h3 class="serif">Avaliar o atendimento</h3><div class="cl-grid"><select id="cl-nota"><option value="5">★★★★★ Amei</option><option value="4">★★★★☆ Muito bom</option><option value="3">★★★☆☆ Bom</option><option value="2">★★☆☆☆ Pode melhorar</option><option value="1">★☆☆☆☆ Não gostei</option></select><textarea id="cl-com" rows="3" placeholder="Conte como foi"></textarea><button class="btn" data-cl="av-add">Enviar avaliação</button><small>Ela aparece no site depois de aprovada pela Julia.</small></div></div>'+
   '<div class="price-card"><h3 class="serif">Minhas avaliações</h3>'+(U.av.map(a=>'<div class="cl-row"><div><b>'+stars(a.nota)+'</b><small>'+esc(a.comentario||'')+' · '+(a.aprovada?'Publicada':'Em análise')+'</small></div><button class="btn ghost sm" data-cl="av-rm" data-id="'+a.id+'">Apagar</button></div>').join('')||'<p class="sub">Nenhuma ainda.</p>')+'</div></div>';
}
const tel=a=>String(a.telefone||'').replace(/\D/g,''), waNum=t=>(t.length<=11?'55':'')+t;
function msgWa(a){ const n=String(a.nome||'').split(' ')[0], h=String(a.horario||'').slice(0,5); if(a.status==='espera') return 'Oi, '+n+'! Abriu uma vaga para '+a.servico+'. Quer aproveitar? Me diga o melhor dia e horário ✦'; return 'Oi, '+n+'! Seu horário '+(a.status==='pendente'?'foi recebido':'está confirmado')+': '+a.servico+', '+br(a.data)+(h?' às '+h:'')+'. Se tiver algum imprevisto, me avise com 24h de antecedência. Te espero! ✦ '+(P.name||'Julia Ruth'); }
const btn=(k,id,v,t,g)=>'<button class="btn'+(g?' ghost':'')+' sm" data-cl="'+k+'" data-id="'+id+'" data-v="'+v+'">'+t+'</button>';
function tabAdmin(){
  const T=[['ped','Pedidos'],['av','Avaliações ('+U.aAv.length+')'],['val','Valores'],['blq','Bloqueios'],['res','Resumo'],['cli','Clientes']];
  const nav='<div class="cl-tabs">'+T.map(x=>'<button class="chip" data-cl="sub" data-v="'+x[0]+'" aria-pressed="'+(U.sub===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  let b='';
  if(U.sub==='ped'){
    const F=[['pendente','Pendentes'],['confirmado','Confirmados'],['espera','Lista de espera'],['concluido','Concluídos'],['cancelado','Cancelados']];
    let l=U.aAg.filter(a=>U.fil==='cancelado'?(a.status==='cancelado'||a.status==='recusado'):a.status===U.fil);
    if(U.fil==='pendente'||U.fil==='confirmado') l=l.slice().reverse();
    b='<div class="cl-tabs">'+F.map(x=>'<button class="chip" data-cl="fil" data-v="'+x[0]+'" aria-pressed="'+(U.fil===x[0])+'">'+x[1]+' ('+U.aAg.filter(a=>x[0]==='cancelado'?(a.status==='cancelado'||a.status==='recusado'):a.status===x[0]).length+')</button>').join('')+'</div>'+
     (l.map(a=>{const t=tel(a),h=String(a.horario||'').slice(0,5),st=a.status;return '<div class="cl-row"><div><b>'+br(a.data)+(h?' às '+h:'')+' · '+esc(a.nome)+'</b><small>'+esc(a.servico)+' · '+LBL[st]+(st==='concluido'&&a.valor!=null?' · R$ '+Number(a.valor).toFixed(2).replace('.',','):'')+(a.obs?' · '+esc(a.obs):'')+'</small></div><div style="display:flex;gap:8px;flex-wrap:wrap">'+(t?'<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/'+waNum(t)+'?text='+encodeURIComponent(msgWa(a))+'">WhatsApp</a>':'')+(st==='pendente'?btn('adm-ag',a.id,'confirmado','Confirmar')+btn('adm-ag',a.id,'recusado','Recusar',1):'')+(st==='confirmado'?btn('adm-ag',a.id,'concluido','Concluir')+btn('adm-ag',a.id,'cancelado','Cancelar',1):'')+(st==='espera'?btn('adm-ag',a.id,'pendente','Chamar para agendar')+btn('adm-ag',a.id,'cancelado','Remover',1):'')+'</div></div>';}).join('')||'<p class="sub">Nada por aqui.</p>');
  }else if(U.sub==='av'){
    b=U.aAv.map(a=>'<div class="cl-row"><div><b>'+stars(a.nota)+' · '+esc(a.nome)+'</b><small>'+esc(a.comentario||'')+'</small></div><div style="display:flex;gap:8px">'+btn('adm-av',a.id,'ok','Aprovar')+btn('adm-av',a.id,'rm','Remover',1)+'</div></div>').join('')||'<p class="sub">Nenhuma avaliação para aprovar.</p>';
  }else if(U.sub==='val'){
    b=U.servicos.map(s=>'<div class="cl-row"><b style="flex:1;min-width:150px">'+esc(s.nome)+'</b><input id="sp-'+s.id+'" type="number" step="0.01" value="'+(s.preco||0)+'" style="width:100px" aria-label="Preço"><input id="sd-'+s.id+'" type="number" step="5" value="'+(s.duracao_min||90)+'" style="width:80px" aria-label="Minutos"><button class="btn sm" data-cl="srv-save" data-id="'+s.id+'">Salvar</button></div>').join('')+'<small>Preço em R$ e duração em minutos. A duração define os horários livres no calendário.</small>';
  }else if(U.sub==='blq'){
    b='<div class="cl-grid" style="margin-bottom:18px"><input id="bq-d" type="date" min="'+hoje()+'"><div style="display:flex;gap:8px"><input id="bq-i" type="time" value="09:00"><input id="bq-f" type="time" value="18:00"></div><input id="bq-m" placeholder="Motivo (só você vê)"><button class="btn" data-cl="blq-add">Bloquear horário</button></div>'+
     (U.bq.map(x=>'<div class="cl-row"><div><b>'+br(x.data)+' · '+esc(String(x.inicio).slice(0,5))+' às '+esc(String(x.fim).slice(0,5))+'</b><small>'+esc(x.motivo||'')+'</small></div>'+btn('blq-rm',x.id,'','Remover',1)+'</div>').join('')||'<p class="sub">Nenhum bloqueio.</p>');
  }else if(U.sub==='res'){
    const mes=U.mes||hoje().slice(0,7), r=U.aAg.filter(a=>a.data.slice(0,7)===mes), n=st=>r.filter(a=>a.status===st).length;
    const fat=r.filter(a=>a.status==='concluido').reduce((t,a)=>t+Number(a.valor||0),0), c={};
    r.forEach(a=>{const k=a.servico;if(k)c[k]=(c[k]||0)+1;}); const top=Object.keys(c).sort((x,y)=>c[y]-c[x])[0];
    b='<div class="cl-grid" style="margin-bottom:18px"><input id="cl-mes" type="month" value="'+mes+'"></div><div class="price-grid"><div class="price-card"><small>Pedidos no mês</small><h3 class="serif">'+r.length+'</h3></div><div class="price-card"><small>Confirmados / concluídos</small><h3 class="serif">'+(n('confirmado')+n('concluido'))+'</h3></div><div class="price-card"><small>Faturamento (concluídos)</small><h3 class="serif">R$ '+fat.toFixed(2).replace('.',',')+'</h3></div></div><p class="sub" style="margin-top:14px">Pendentes: '+n('pendente')+' · Cancelados/recusados: '+(n('cancelado')+n('recusado'))+(top?' · Mais pedido: '+esc(top):'')+'</p>';
  }else{
    const m=new Map(); U.aAg.forEach(a=>{const k=tel(a)||String(a.nome||'').toLowerCase(); if(!m.has(k)) m.set(k,{nome:a.nome,t:tel(a),h:[]}); m.get(k).h.push(a);});
    b=[...m.values()].map(x=>{const ok=x.h.filter(a=>a.status==='concluido'),f=ok.reduce((s,a)=>s+Number(a.valor||0),0);return '<div class="cl-row"><div><b>'+esc(x.nome)+'</b><small>'+ok.length+' atendimento(s) · R$ '+f.toFixed(2).replace('.',',')+'</small></div>'+(x.t?'<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/'+waNum(x.t)+'">WhatsApp</a>':'')+'</div>';}).join('')||'<p class="sub">Nenhuma cliente ainda.</p>';
  }
  return nav+'<div class="price-card cl-box">'+b+'</div>';
}
function view(){
  if(!ready) return '<div class="price-card"><h3 class="serif">Em breve</h3><p>A área da cliente será ativada assim que o banco de dados for conectado.</p></div>';
  const msg=U.msg?'<div class="cl-msg">'+esc(U.msg)+(U.link?' <a href="'+U.link+'" target="_blank" rel="noopener"><b>Avisar a Julia no WhatsApp</b></a>':'')+'</div>':'';
  if(!U.user) return msg+viewOut();
  if(!U.perfil) return msg+'<div class="price-card"><p>Carregando…</p></div>';
  if(!U.perfil.is_admin) return msg+'<div class="price-card cl-box"><h3 class="serif">Acesso restrito</h3><p>Esta área é só para a Julia.</p><button class="btn ghost sm" data-cl="logout">Sair</button></div>';
  U.tab='admin';
  return msg+'<div class="cl-row" style="border:0"><h3 class="serif" style="margin:0">Olá, <em>Julia</em></h3><button class="btn ghost sm" data-cl="logout">Sair</button></div>'+tabAdmin();
}
function paint(){ if(!root) return; root.innerHTML=view(); drawCal(); drawSlots(); }

const toMin=h=>{const p=String(h).split(':');return +p[0]*60+ +p[1];};
const fmtH=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const durSel=()=>{const e=$('#cl-serv'),s=U.servicos.find(x=>e&&String(x.id)===e.value)||U.servicos[0]||{};return s.duracao_min||90;};
async function loadOcup(d){ const r=await U.sb.rpc('horarios_ocupados',{d}); U.ocup=r.data||[]; }
function drawCal(){
  const box=$('#cl-cal'); if(!box) return; const c=U.cal,y=c.getFullYear(),mo=c.getMonth(),t=new Date(),dif=(y-t.getFullYear())*12+mo-t.getMonth(),n=new Date(y,mo+1,0).getDate(),h=hoje(); let g='';
  for(let i=0;i<new Date(y,mo,1).getDay();i++) g+='<i></i>';
  for(let k=1;k<=n;k++){ const ds=y+'-'+pad(mo+1)+'-'+pad(k), off=ds<h||AG.fechados.indexOf(new Date(y,mo,k).getDay())>=0; g+='<button type="button" data-cl="cal-d" data-v="'+ds+'"'+(off?' disabled':'')+' class="'+(ds===U.dtSel?'on ':'')+(ds===h?'hj':'')+'">'+k+'</button>'; }
  box.innerHTML='<div class="cal-h"><button type="button" data-cl="cal-m" data-v="-1"'+(dif<=0?' disabled':'')+' aria-label="Mês anterior">‹</button><b>'+MESES[mo]+' '+y+'</b><button type="button" data-cl="cal-m" data-v="1"'+(dif>=AG.meses?' disabled':'')+' aria-label="Próximo mês">›</button></div><div class="cal-w">'+['D','S','T','Q','Q','S','S'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="cal-g">'+g+'</div>';
}
function drawSlots(){
  const box=$('#cl-slots'); if(!box) return;
  if(!U.dtSel){ box.innerHTML='<small>Escolha a data no calendário.</small>'; return; }
  const du=durSel(), n=new Date(), agora=n.getHours()*60+n.getMinutes(), hj=U.dtSel===hoje(), l=[];
  for(let m=AG.ini;m+du<=AG.fim;m+=AG.passo){ const f=m+du, oc=U.ocup.some(o=>m<toMin(o.inicio)+o.dur&&toMin(o.inicio)<f); if(!oc&&!(hj&&m<=agora)) l.push(fmtH(m)); }
  if(l.indexOf(U.horaSel)<0) U.horaSel='';
  box.innerHTML=l.length?l.map(h=>'<button type="button" class="chip" data-cl="slot" data-v="'+h+'" aria-pressed="'+(h===U.horaSel)+'">'+h+'</button>').join(''):'<small>Sem horários livres neste dia. Tente outra data.</small>';
}
async function act(a){
  const q=U.sb, k=a.dataset.cl, id=a.dataset.id, v=a.dataset.v; U.link='';
  try{
  if(k==='auth'){ U.auth=v; U.msg=''; paint(); return; }
  if(k==='tab'){ U.tab=v; U.msg=''; paint(); return; }
  if(k==='login'){ const r=await q.auth.signInWithPassword({email:val('cl-email').toLowerCase(),password:document.getElementById('cl-senha').value}); if(r.error) return erro(r.error); return; }
  if(k==='logout'){ await q.auth.signOut(); return; }
  if(k==='cal-m'){ U.cal=new Date(U.cal.getFullYear(),U.cal.getMonth()+ +v,1); drawCal(); return; }
  if(k==='cal-d'){ U.dtSel=v; U.horaSel=''; await loadOcup(v); drawCal(); drawSlots(); return; }
  if(k==='slot'){ U.horaSel=v; drawSlots(); return; }
  if(k==='sub'){ U.sub=v; paint(); return; }
  if(k==='fil'){ U.fil=v; paint(); return; }
  if(k==='agendar'){
    const dt=U.dtSel, hora=U.horaSel, sv=val('cl-serv'); if(!dt||!hora) return say('Escolha a data e o horário.');
    const r=await q.from('agendamentos').insert({user_id:U.user.id,servico_id:+sv,dt,hora,duracao_min:durSel(),obs:val('cl-obs')||null,status:'pendente'}); if(r.error){ await loadOcup(dt); return erro(r.error); }
    const nm=(U.servicos.find(s=>String(s.id)===sv)||{}).nome||''; U.dtSel=''; U.horaSel='';
    await refresh('Pedido enviado! A Julia vai confirmar o seu horário.'); U.link=waUrl('Olá! Pedi um horário no site: '+nm+', dia '+br(dt)+' às '+hora+'.'); paint(); return;
  }
  if(k==='srv-save'){ const r=await q.from('servicos').update({preco:+val('sp-'+id)||0,duracao_min:+val('sd-'+id)||90}).eq('id',id); if(r.error) return erro(r.error); return refresh('Valores salvos.'); }
  if(k==='blq-add'){ const d=val('bq-d'),i=val('bq-i'),f=val('bq-f'); if(!d||!i||!f||i>=f) return say('Informe a data e um intervalo válido.'); const r=await q.from('bloqueios').insert({data:d,inicio:i,fim:f,motivo:val('bq-m')||null}); if(r.error) return erro(r.error); return refresh('Horário bloqueado.'); }
  if(k==='blq-rm'){ await q.from('bloqueios').delete().eq('id',id); return refresh('Bloqueio removido.'); }
  if(k==='cancelar'){ const r=await q.from('agendamentos').update({status:'cancelado'}).eq('id',id); if(r.error) return erro(r.error); return refresh('Horário cancelado.'); }
  if(k==='des-add'){ const t=val('cl-dtit'); if(!t) return say('Escreva o que você deseja.'); const r=await q.from('desejos').insert({user_id:U.user.id,titulo:t,nota:val('cl-dnota')||null}); if(r.error) return erro(r.error); return refresh('Salvo na sua lista!'); }
  if(k==='des-rm'){ await q.from('desejos').delete().eq('id',id); return refresh(''); }
  if(k==='av-add'){ const r=await q.from('avaliacoes').insert({user_id:U.user.id,nome:((U.perfil.nome||'Cliente').split(' ')[0]),nota:+val('cl-nota'),comentario:val('cl-com')||null}); if(r.error) return erro(r.error); return refresh('Obrigada! Sua avaliação foi enviada para aprovação.'); }
  if(k==='av-rm'){ await q.from('avaliacoes').delete().eq('id',id); return refresh(''); }
  if(k==='adm-ag'){ const up={status:v}; if(v==='concluido'){ const a0=U.aAg.find(x=>String(x.id)===id)||{}, x=prompt('Valor cobrado (R$):',((U.servicos.find(s=>s.nome===a0.servico)||{}).preco||'')); if(x===null) return; up.valor=Number(String(x).replace(',','.'))||0; } const r=await q.from('agendamentos').update(up).eq('id',id); if(r.error) return erro(r.error); return refresh(v==='confirmado'?'Horário confirmado.':'Horário recusado.'); }
  if(k==='adm-av'){ const r=v==='ok'?await q.from('avaliacoes').update({aprovada:true}).eq('id',id):await q.from('avaliacoes').delete().eq('id',id); if(r.error) return erro(r.error); return refresh(v==='ok'?'Avaliação publicada.':'Avaliação removida.'); }
  }catch(e){ erro(e); }
}
document.addEventListener('click',e=>{ const a=e.target.closest('[data-cl]'); if(a&&ready&&root&&root.contains(a)) act(a); });
document.addEventListener('change',e=>{ if(!ready) return; if(e.target.id==='cl-serv') drawSlots(); if(e.target.id==='cl-mes'){ U.mes=e.target.value; paint(); } });

window.ClienteUI={mount(el){
  root=el; if(!el) return; paint();
  if(!ready||U.sb) return;
  U.sb=window.supabase.createClient(CFG.url,CFG.key); window.JR={ready:true,sb:U.sb,user:null,wa:waUrl,refresh:()=>refresh()}; window.JR_CFG={pix:P.pix||'',sinal:P.sinal||0};
  U.sb.auth.onAuthStateChange((ev,s)=>{ U.user=s?s.user:null; if(window.JR) window.JR.user=U.user; if(!U.user) U.tab='agenda'; setTimeout(()=>refresh(ev==='SIGNED_IN'?'':undefined),0); });
  U.sb.auth.getSession().then(r=>{ U.user=r.data.session?r.data.session.user:null; if(window.JR) window.JR.user=U.user; refresh(); });
}};
})();