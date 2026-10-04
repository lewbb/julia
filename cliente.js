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
const U={sb:null,user:null,perfil:null,tab:'agenda',auth:'entrar',servicos:[],aval:[],ag:[],de:[],av:[],aAg:[],aAv:[],msg:'',link:'',cal:new Date(new Date().getFullYear(),new Date().getMonth(),1),dtSel:'',horaSel:'',ocup:[],sub:'ped',fil:'pendente',mes:'',bq:[],aCl:[],pt:'agenda',avf:{unhas:{n:0,nome:null,com:'',done:false,msg:''},marketing:{n:0,nome:null,com:'',done:false,msg:''}},sg:{nome:null,txt:'',link:'',done:false,msg:''},aSg:[]};
let root=null,proot=null,aroot=null,amroot=null,sroot=null;
const pad=n=>String(n).padStart(2,'0');
const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const br=d=>d.split('-').reverse().join('/');
const LBL={espera:'Lista de espera',pendente:'Aguardando confirmação',confirmado:'Confirmado',concluido:'Concluído',recusado:'Horário indisponível',cancelado:'Cancelado'};
const waUrl=m=>'https://wa.me/'+WA+(m?'?text='+encodeURIComponent(m):'');
const val=id=>{const e=$('#'+id);return e?e.value.trim():'';};

const css=document.createElement('style');
css.textContent='.cal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.cal-h button{width:38px;height:38px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:20px;cursor:pointer}.cal-h button:disabled{opacity:.35;cursor:default}.cal-w,.cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal-w span{font-size:12px;color:var(--muted)}.cal-g button,.cal-g i{aspect-ratio:1;border-radius:50%}.cal-g button{background:transparent;color:var(--ink);font:inherit;cursor:pointer}.cal-g button:hover:not(:disabled){background:var(--accent-soft)}.cal-g button.on{background:var(--accent);color:var(--on-accent)}.cal-g button.hj{box-shadow:inset 0 0 0 2px var(--accent)}.cal-g button:disabled{opacity:.3;cursor:default}#cl-slots{display:flex;gap:8px;flex-wrap:wrap}'+'.cl-box{margin-bottom:18px}.cl-box h3{margin:0 0 12px}.cl-row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--line)}.cl-row small{color:var(--muted);display:block}.cl-msg{padding:12px 16px;border-radius:14px;background:var(--accent-soft);margin-bottom:16px}.cl-grid{display:grid;gap:12px;max-width:520px}.cl-grid input,.cl-grid select,.cl-grid textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit}.cl-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}.cl-two{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:820px){.cl-two{grid-template-columns:1fr}}';
css.textContent+='html[data-nv="perfil"] .nview[data-v="perfil"]{display:block;animation:nvin .35s ease both}.nav-av{width:40px;height:40px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;overflow:hidden;font:700 17px var(--font-body);cursor:pointer;flex:none;margin-left:10px;padding:0}.nav-av img,.pf-av img{width:100%;height:100%;object-fit:cover}.pf-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.pf-av{width:84px;height:84px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font:400 38px var(--font-display);overflow:hidden;flex:none}.stars-pick{display:flex;gap:2px}.stars-pick button{font-size:34px;line-height:1;background:none;color:var(--muted);opacity:.35;cursor:pointer;padding:2px 3px}.stars-pick button.on{color:var(--accent);opacity:1}html[data-nv="perfil"] .sg-perfil>button{color:var(--accent);font-style:italic}.sg-perfil>button{display:flex;align-items:center;gap:12px}@media(max-width:560px){.nav{gap:5px;padding-left:10px;padding-right:10px}.nav .logo{font-size:19px;gap:3px;flex:0 1 auto;min-width:0;overflow:hidden;white-space:nowrap}.nav .logo .star{width:11px;height:11px;flex:none}.switch{margin-left:auto}.switch button{padding:7px 8px;font-size:12px}.nav-av{width:32px;height:32px;margin-left:0}.burger{width:36px;height:36px}}@media(max-width:380px){.nav .logo .star{display:none}}';
document.head.appendChild(css);

async function loadPublic(){
  const [s,a]=await Promise.all([
    U.sb.from('servicos').select('*').eq('ativo',true).order('id'),
    U.sb.from('avaliacoes').select('nome,nota,comentario,area').eq('aprovada',true).order('criado_em',{ascending:false}).limit(12)]);
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
  U.perfil=p.data;
  if(!U.perfil){ const nm=(U.user.user_metadata&&U.user.user_metadata.nome)||(U.user.email||'').split('@')[0]||'Cliente'; await q.from('perfis').insert({id,nome:nm}); const p2=await q.from('perfis').select('*').eq('id',id).single(); U.perfil=p2.data; }
  U.ag=ag.data||[]; U.de=de.data||[]; U.av=av.data||[];
  if(U.perfil&&U.perfil.is_admin){
    const [a1,a2,a3,a4,a5]=await Promise.all([
      q.from('agendamentos').select('*').order('data',{ascending:false}).order('horario').limit(600),
      q.from('avaliacoes').select('*').eq('aprovada',false).order('criado_em'),
      q.from('bloqueios').select('*').gte('data',hoje()).order('data').order('inicio'),
      q.from('perfis').select('*').order('criado_em',{ascending:false}),
      q.from('sugestoes').select('*').order('criado_em',{ascending:false}).limit(300)]);
    U.aAg=a1.data||[]; U.aAv=a2.data||[]; U.bq=a3.data||[]; U.aCl=a4.data||[]; U.aSg=a5.data||[];
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
  return '<div class="cl-two"><div class="price-card"><h3 class="serif">Avaliar o atendimento</h3><p>Escolha a área que você quer avaliar. Como você está com a conta ativa, a avaliação também fica salva aqui.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="goto" data-mode="nails" data-target="depoimentos-nl">Avaliar as unhas</button><button class="btn ghost" data-act="goto" data-mode="marketing" data-target="depoimentos-mk">Avaliar o marketing</button></div></div>'+
   '<div class="price-card"><h3 class="serif">Minhas avaliações</h3>'+(U.av.map(a=>'<div class="cl-row"><div><b>'+stars(a.nota)+'</b><small>'+esc(a.comentario||'')+' · '+(a.aprovada?'Publicada':'Em análise')+'</small></div><button class="btn ghost sm" data-cl="av-rm" data-id="'+a.id+'">Apagar</button></div>').join('')||'<p class="sub">Nenhuma ainda.</p>')+'</div></div>';
}
const tel=a=>String(a.telefone||'').replace(/\D/g,''), waNum=t=>(t.length<=11?'55':'')+t;
function msgWa(a){ const n=String(a.nome||'').split(' ')[0], h=String(a.horario||'').slice(0,5); if(a.status==='espera') return 'Oi, '+n+'! Abriu uma vaga para '+a.servico+'. Quer aproveitar? Me diga o melhor dia e horário ✦'; return 'Oi, '+n+'! Seu horário '+(a.status==='pendente'?'foi recebido':'está confirmado')+': '+a.servico+', '+br(a.data)+(h?' às '+h:'')+'. Se tiver algum imprevisto, me avise com 24h de antecedência. Te espero! ✦ '+(P.name||'Julia Ruth'); }
const btn=(k,id,v,t,g)=>'<button class="btn'+(g?' ghost':'')+' sm" data-cl="'+k+'" data-id="'+id+'" data-v="'+v+'">'+t+'</button>';
function tabAdmin(){
  const T=[['ped','Pedidos'],['img','Imagens'],['av','Avaliações ('+U.aAv.length+')'],['sug','Sugestões ('+U.aSg.filter(x=>x.status!=='comprada').length+')'],['val','Valores'],['blq','Bloqueios'],['res','Resumo'],['cli','Clientes']];
  const nav='<div class="cl-tabs">'+T.map(x=>'<button class="chip" data-cl="sub" data-v="'+x[0]+'" aria-pressed="'+(U.sub===x[0])+'">'+x[1]+'</button>').join('')+'</div>';
  let b='';
  if(U.sub==='ped'){
    const F=[['pendente','Pendentes'],['confirmado','Confirmados'],['espera','Lista de espera'],['concluido','Concluídos'],['cancelado','Cancelados']];
    let l=U.aAg.filter(a=>U.fil==='cancelado'?(a.status==='cancelado'||a.status==='recusado'):a.status===U.fil);
    if(U.fil==='pendente'||U.fil==='confirmado') l=l.slice().reverse();
    b='<div class="cl-tabs">'+F.map(x=>'<button class="chip" data-cl="fil" data-v="'+x[0]+'" aria-pressed="'+(U.fil===x[0])+'">'+x[1]+' ('+U.aAg.filter(a=>x[0]==='cancelado'?(a.status==='cancelado'||a.status==='recusado'):a.status===x[0]).length+')</button>').join('')+'</div>'+
     (l.map(a=>{const t=tel(a),h=String(a.horario||'').slice(0,5),st=a.status;return '<div class="cl-row"><div><b>'+br(a.data)+(h?' às '+h:'')+' · '+esc(a.nome)+'</b><small>'+esc(a.servico)+(a.telefone?' · '+esc(a.telefone):'')+' · '+LBL[st]+(st==='concluido'&&a.valor!=null?' · R$ '+Number(a.valor).toFixed(2).replace('.',','):'')+(a.obs?' · '+esc(a.obs):'')+'</small></div><div style="display:flex;gap:8px;flex-wrap:wrap">'+(t?'<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/'+waNum(t)+'?text='+encodeURIComponent(msgWa(a))+'">WhatsApp</a>':'')+(st==='pendente'?btn('adm-ag',a.id,'confirmado','Confirmar')+btn('adm-ag',a.id,'recusado','Recusar',1):'')+(st==='confirmado'?btn('adm-ag',a.id,'concluido','Concluir')+btn('adm-ag',a.id,'cancelado','Cancelar',1):'')+(st==='espera'?btn('adm-ag',a.id,'pendente','Chamar para agendar')+btn('adm-ag',a.id,'cancelado','Remover',1):'')+'</div></div>';}).join('')||'<p class="sub">Nada por aqui.</p>');
  }else if(U.sub==='sug'){
    b=U.aSg.map(x=>{const ok=x.status==='comprada',dt=String(x.criado_em||'').slice(0,10);return '<div class="cl-row"'+(ok?' style="opacity:.6"':'')+'><div><b>'+esc(x.texto)+'</b><small>'+esc(x.nome)+(dt?' · '+br(dt):'')+(ok?' · Comprada':'')+(x.link&&/^https?:\/\//i.test(x.link)?' · <a href="'+esc(x.link)+'" target="_blank" rel="noopener noreferrer">abrir link</a>':'')+'</small></div><div style="display:flex;gap:8px;flex-wrap:wrap">'+(ok?btn('adm-sg',x.id,'nova','Voltar para novas',1):btn('adm-sg',x.id,'ok','Marcar como comprada'))+btn('adm-sg',x.id,'rm','Remover',1)+'</div></div>';}).join('')||'<p class="sub">Nenhuma sugestão ainda.</p>';
  }else if(U.sub==='av'){
    b=U.aAv.map(a=>'<div class="cl-row"><div><b>'+stars(a.nota)+' · '+esc(a.nome)+' · '+(a.area==='marketing'?'Marketing':'Unhas')+'</b><small>'+esc(a.comentario||'')+'</small></div><div style="display:flex;gap:8px">'+btn('adm-av',a.id,'ok','Aprovar')+btn('adm-av',a.id,'rm','Remover',1)+'</div></div>').join('')||'<p class="sub">Nenhuma avaliação para aprovar.</p>';
  }else if(U.sub==='val'){
    b=U.servicos.map(s=>'<div class="cl-row"><b style="flex:1;min-width:150px">'+esc(s.nome)+'</b><input id="sp-'+s.id+'" type="number" step="0.01" value="'+(s.preco||0)+'" style="width:100px" aria-label="Preço"><input id="sd-'+s.id+'" type="number" step="5" value="'+(s.duracao_min||90)+'" style="width:80px" aria-label="Minutos"><button class="btn sm" data-cl="srv-save" data-id="'+s.id+'">Salvar</button></div>').join('')+'<small>Preço em R$ e duração em minutos. A duração define os horários livres no calendário.</small>';
  }else if(U.sub==='img'){
    const L=(window.JRImg?window.JRImg.slots():[]);
    b='<p class="sub" style="margin-bottom:14px">Escolha uma foto para trocar. Ela aparece no site na hora, para todo mundo.</p>'+L.map(x=>'<div class="cl-row"><div style="display:flex;gap:12px;align-items:center">'+(x.url?'<img src="'+esc(x.url)+'" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:12px">':'<div style="width:56px;height:56px;border-radius:12px;background:var(--accent-soft)"></div>')+'<b>'+esc(x.title)+'</b></div><div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn ghost sm" style="cursor:pointer">'+(x.url?'Trocar':'Enviar foto')+'<input type="file" accept="image/*" data-img="'+esc(x.id)+'" hidden></label>'+(x.url?btn('img-rm',x.id,'','Remover',1):'')+'</div></div>').join('');
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
function starPick(ar){ const n=U.avf[ar].n; return '<div class="stars-pick" role="radiogroup" aria-label="Sua nota">'+[1,2,3,4,5].map(i=>'<button type="button" role="radio" aria-checked="'+(n===i)+'" aria-label="'+i+(i>1?' estrelas':' estrela')+'" data-cl="star" data-area="'+ar+'" data-v="'+i+'" class="'+(i<=n?'on':'')+'">★</button>').join('')+'</div>'; }
function inicial(){ const p=U.perfil||{}; return esc(((p.nome||(U.user&&U.user.email)||'?').trim().charAt(0)||'?').toUpperCase()); }
function authBox(){
  const cr=U.auth==='criar';
  return '<div class="price-card cl-box"><div class="cl-tabs"><button class="chip" data-cl="auth" data-v="entrar" aria-pressed="'+!cr+'">Entrar</button><button class="chip" data-cl="auth" data-v="criar" aria-pressed="'+cr+'">Criar conta</button></div><div class="cl-grid">'+
   (cr?'<input id="pf-nome" placeholder="Seu nome" autocomplete="name" maxlength="60">':'')+
   '<input id="pf-email" type="email" placeholder="E-mail" autocomplete="username"><input id="pf-senha" type="password" placeholder="Senha'+(cr?' (mínimo 6 caracteres)':'')+'" autocomplete="'+(cr?'new-password':'current-password')+'"><button class="btn" data-cl="'+(cr?'pf-signup':'pf-login')+'">'+(cr?'Criar minha conta':'Entrar')+'</button></div>'+
   '<p class="sub" style="margin-top:12px">Com a conta você acompanha seus horários, guarda desejos e vê suas avaliações. Para só avaliar, não precisa de conta.</p></div>';
}
function viewPerfil(){
  if(!ready) return '<div class="price-card"><h3 class="serif">Em breve</h3><p>O perfil será ativado assim que o banco de dados for conectado.</p></div>';
  const msg=U.msg?'<div class="cl-msg">'+esc(U.msg)+(U.link?' <a href="'+U.link+'" target="_blank" rel="noopener"><b>Avisar a Julia no WhatsApp</b></a>':'')+'</div>':'';
  if(!U.user) return msg+authBox();
  const p=U.perfil; if(!p) return msg+'<div class="price-card"><p>Carregando…</p></div>';
  const T=[['agenda','Meus horários'],['desejos','Desejos'],['avaliar','Avaliações']];
  const body=U.pt==='desejos'?tabDesejos():U.pt==='avaliar'?tabAvaliar():tabAgenda();
  return msg+'<div class="price-card cl-box"><div class="pf-head"><div class="pf-av">'+(p.foto_url?'<img src="'+esc(p.foto_url)+'" alt="">':inicial())+'</div><div style="flex:1;min-width:180px"><h3 class="serif" style="margin:0">Olá, <em>'+esc((p.nome||'').split(' ')[0]||'cliente')+'</em></h3><small>'+esc(U.user.email||'')+'</small></div>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn ghost sm" style="cursor:pointer">Trocar foto<input type="file" accept="image/*" data-avatar hidden></label>'+(p.is_admin?'<button class="btn sm" data-act="adm">Painel da Julia</button>':'')+'<button class="btn ghost sm" data-cl="logout">Sair</button></div></div>'+
   '<div class="cl-grid" style="margin-top:16px;grid-template-columns:1fr auto;align-items:center"><input id="pf-nome" value="'+esc(p.nome||'')+'" maxlength="60" placeholder="Seu nome" aria-label="Seu nome"><button class="btn sm" data-cl="pf-save">Salvar nome</button></div></div>'+
   '<div class="cl-tabs">'+T.map(x=>'<button class="chip" data-cl="ptab" data-v="'+x[0]+'" aria-pressed="'+(U.pt===x[0])+'">'+x[1]+'</button>').join('')+'</div>'+body;
}
function viewAval(ar){
  if(!ready) return '<p class="sub">As avaliações aparecem aqui em breve.</p>';
  const f=U.avf[ar], L=U.aval.filter(a=>(a.area||'unhas')===ar);
  const lista=L.length?'<div class="price-grid">'+L.map(a=>'<div class="price-card"><div style="color:var(--accent);font-size:20px">'+stars(a.nota)+'</div><p>'+esc(a.comentario||'')+'</p><b>'+esc(a.nome)+'</b></div>').join('')+'</div>':'<p class="sub">As primeiras avaliações aparecem aqui.</p>';
  const nome=f.nome==null?(((U.perfil&&U.perfil.nome)||'').split(' ')[0]):f.nome;
  const quem=ar==='marketing'?'o trabalho de marketing':'o atendimento';
  const form=f.done
   ?'<div class="price-card cl-box"><h3 class="serif">Obrigada! ✦</h3><p>Sua avaliação foi enviada e aparece aqui depois de aprovada pela Julia.</p><button class="btn ghost" data-cl="av-novo" data-area="'+ar+'">Enviar outra</button></div>'
   :'<div class="price-card cl-box" data-avbox="'+ar+'"><h3 class="serif">Deixe a sua avaliação</h3><div class="cl-grid"><input data-avf="nome" maxlength="40" placeholder="Como você quer aparecer? (ex.: Ana)" autocomplete="given-name" value="'+esc(nome)+'">'+starPick(ar)+
     '<textarea data-avf="com" rows="3" maxlength="500" placeholder="Conte como foi '+quem+'">'+esc(f.com)+'</textarea><input data-avf="site" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'+
     '<p class="cl-msg" style="'+(f.msg?'':'display:none')+'">'+esc(f.msg)+'</p><button class="btn" data-cl="av-pub" data-area="'+ar+'">Enviar avaliação</button><small>Não precisa de cadastro. Ela aparece no site depois de aprovada pela Julia.</small></div></div>';
  return lista+'<div style="margin-top:22px"></div>'+form;
}
function viewSug(){
  if(!ready) return '<p class="sub">Em breve.</p>';
  const s=U.sg, nome=s.nome==null?(((U.perfil&&U.perfil.nome)||'').split(' ')[0]):s.nome;
  if(s.done) return '<div class="price-card cl-box"><h3 class="serif">Anotado! ✦</h3><p>A Julia vai ver a sua sugestão. Obrigada por ajudar a deixar as próximas unhas ainda mais incríveis.</p><button class="btn ghost" data-cl="sg-novo">Sugerir outra coisa</button></div>';
  return '<div class="price-card cl-box" data-sgbox="1"><h3 class="serif">O que a Julia pode comprar?</h3><div class="cl-grid"><input data-sgf="nome" maxlength="40" placeholder="Seu nome" autocomplete="given-name" value="'+esc(nome)+'">'+
   '<textarea data-sgf="txt" rows="3" maxlength="300" placeholder="Ex.: esmalte em gel rosa nude, glitter dourado, pedrarias, adesivos de borboleta...">'+esc(s.txt)+'</textarea>'+
   '<input data-sgf="link" maxlength="300" inputmode="url" placeholder="Link ou referência (opcional)" value="'+esc(s.link)+'"><input data-sgf="site" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'+
   '<p class="cl-msg" style="'+(s.msg?'':'display:none')+'">'+esc(s.msg)+'</p><button class="btn" data-cl="sg-send">Enviar sugestão</button><small>Só a Julia vê as sugestões. Não precisa de cadastro.</small></div></div>';
}
function paintNav(){
  const b=$('#nav-perfil'); if(!b) return; b.style.display=ready?'':'none';
  b.innerHTML=U.user?((U.perfil&&U.perfil.foto_url)?'<img src="'+esc(U.perfil.foto_url)+'" alt="">':inicial()):'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4 0-7.5 2-7.5 5v1.5h15V19c0-3-3.5-5-7.5-5z"/></svg>';
  b.setAttribute('aria-label',U.user?'Meu perfil':'Entrar ou criar conta');
}
function paint(){
  if(root){ root.innerHTML=view(); drawCal(); drawSlots(); }
  if(proot) proot.innerHTML=viewPerfil();
  if(aroot) aroot.innerHTML=viewAval('unhas');
  if(amroot) amroot.innerHTML=viewAval('marketing');
  if(sroot) sroot.innerHTML=viewSug();
  paintNav();
}

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
  if(k==='ptab'){ U.pt=v; U.msg=''; paint(); return; }
  if(k==='pf-login'){ const r=await q.auth.signInWithPassword({email:val('pf-email').toLowerCase(),password:document.getElementById('pf-senha').value}); if(r.error) return erro(r.error); return; }
  if(k==='pf-signup'){ const nome=val('pf-nome'), em=val('pf-email').toLowerCase(), se=document.getElementById('pf-senha').value;
    if(nome.length<2) return say('Diga o seu nome.'); if(!em) return say('Digite o seu e-mail.'); if(se.length<6) return say('A senha precisa ter pelo menos 6 caracteres.');
    const r=await q.auth.signUp({email:em,password:se,options:{data:{nome}}}); if(r.error) return erro(r.error);
    if(!r.data.session) return say('Conta criada! Confirme seu e-mail pelo link que enviamos e depois entre.'); return; }
  if(k==='pf-save'){ const nome=val('pf-nome'); if(nome.length<2) return say('Diga o seu nome.'); const r=await q.from('perfis').update({nome}).eq('id',U.user.id); if(r.error) return erro(r.error); return refresh('Nome atualizado.'); }
  if(k==='star'){ const ar=a.dataset.area, f=U.avf[ar]; f.n=+v; f.msg=''; const g=a.closest('.stars-pick'); g.querySelectorAll('button').forEach((b,n)=>{ b.classList.toggle('on',n<f.n); b.setAttribute('aria-checked',String(n+1===f.n)); }); return; }
  if(k==='av-novo'){ U.avf[a.dataset.area].done=false; paint(); return; }
  if(k==='av-pub'){
    const ar=a.dataset.area, f=U.avf[ar], box=a.closest('[data-avbox]'), g=n=>{const e=box.querySelector('[data-avf="'+n+'"]');return e?e.value.trim():'';};
    if(g('site')) return;
    const nome=g('nome'), com=g('com'), fa=m=>{ f.msg=m; paint(); };
    if(nome.length<2) return fa('Escolha um nome para aparecer na avaliação.');
    if(!f.n) return fa('Toque nas estrelas para dar a sua nota.');
    if(com.length<5) return fa('Escreva um pequeno texto.');
    let ult=0; try{ ult=+localStorage.getItem('jr_av_ts')||0; }catch(_){}
    if(Date.now()-ult<60000) return fa('Aguarde um minutinho antes de enviar outra avaliação.');
    const r=await q.from('avaliacoes').insert({user_id:U.user?U.user.id:null,nome:nome.slice(0,40),nota:f.n,comentario:com.slice(0,500),area:ar});
    if(r.error) return fa('Não foi possível enviar agora. Tente de novo.');
    try{ localStorage.setItem('jr_av_ts',String(Date.now())); }catch(_){}
    f.n=0; f.nome=null; f.com=''; f.msg=''; f.done=true; return refresh('');
  }
  if(k==='sg-novo'){ U.sg.done=false; U.sg.txt=''; U.sg.link=''; paint(); return; }
  if(k==='sg-send'){
    const box=a.closest('[data-sgbox]'), g=n=>{const e=box.querySelector('[data-sgf="'+n+'"]');return e?e.value.trim():'';}, s=U.sg;
    if(g('site')) return;
    const nome=g('nome'), txt=g('txt'); let link=g('link'), fa=m=>{ s.msg=m; paint(); };
    if(nome.length<2) return fa('Diga o seu nome.');
    if(txt.length<3) return fa('Conte o que a Julia poderia comprar.');
    if(link&&!/^https?:\/\//i.test(link)){ if(/^[\w-]+(\.[\w-]+)+(\/|$)/.test(link)) link='https://'+link; else link=''; }
    let ult=0; try{ ult=+localStorage.getItem('jr_sg_ts')||0; }catch(_){}
    if(Date.now()-ult<30000) return fa('Aguarde alguns segundos antes de enviar outra sugestão.');
    const r=await q.from('sugestoes').insert({user_id:U.user?U.user.id:null,nome:nome.slice(0,40),texto:txt.slice(0,300),link:link?link.slice(0,300):null});
    if(r.error) return fa('Não foi possível enviar agora. Tente de novo.');
    try{ localStorage.setItem('jr_sg_ts',String(Date.now())); }catch(_){}
    s.txt=''; s.link=''; s.msg=''; s.done=true; return refresh('');
  }
  if(k==='adm-sg'){ const r=v==='ok'?await q.from('sugestoes').update({status:'comprada'}).eq('id',id):v==='nova'?await q.from('sugestoes').update({status:'nova'}).eq('id',id):await q.from('sugestoes').delete().eq('id',id); if(r.error) return erro(r.error); return refresh(v==='rm'?'Sugestão removida.':v==='ok'?'Marcada como comprada.':'Voltou para novas.'); }
  if(k==='srv-save'){ const r=await q.from('servicos').update({preco:+val('sp-'+id)||0,duracao_min:+val('sd-'+id)||90}).eq('id',id); if(r.error) return erro(r.error); return refresh('Valores salvos.'); }
  if(k==='blq-add'){ const d=val('bq-d'),i=val('bq-i'),f=val('bq-f'); if(!d||!i||!f||i>=f) return say('Informe a data e um intervalo válido.'); const r=await q.from('bloqueios').insert({data:d,inicio:i,fim:f,motivo:val('bq-m')||null}); if(r.error) return erro(r.error); return refresh('Horário bloqueado.'); }
  if(k==='blq-rm'){ await q.from('bloqueios').delete().eq('id',id); return refresh('Bloqueio removido.'); }
  if(k==='cancelar'){ const r=await q.from('agendamentos').update({status:'cancelado'}).eq('id',id); if(r.error) return erro(r.error); return refresh('Horário cancelado.'); }
  if(k==='des-add'){ const t=val('cl-dtit'); if(!t) return say('Escreva o que você deseja.'); const r=await q.from('desejos').insert({user_id:U.user.id,titulo:t,nota:val('cl-dnota')||null}); if(r.error) return erro(r.error); return refresh('Salvo na sua lista!'); }
  if(k==='des-rm'){ await q.from('desejos').delete().eq('id',id); return refresh(''); }
  if(k==='av-add'){ const r=await q.from('avaliacoes').insert({user_id:U.user.id,nome:((U.perfil.nome||'Cliente').split(' ')[0]),nota:+val('cl-nota'),comentario:val('cl-com')||null}); if(r.error) return erro(r.error); return refresh('Obrigada! Sua avaliação foi enviada para aprovação.'); }
  if(k==='av-rm'){ await q.from('avaliacoes').delete().eq('id',id); return refresh(''); }
  if(k==='adm-ag'){ const up={status:v}; if(v==='concluido'){ const a0=U.aAg.find(x=>String(x.id)===id)||{}, x=prompt('Valor cobrado (R$):',((U.servicos.find(s=>s.nome===a0.servico)||{}).preco||'')); if(x===null) return; up.valor=Number(String(x).replace(',','.'))||0; } const r=await q.from('agendamentos').update(up).eq('id',id); if(r.error) return erro(r.error); return refresh(v==='confirmado'?'Horário confirmado.':'Horário recusado.'); }
  if(k==='img-rm'){ const m=Object.assign({},(U.site||{}).img||{}); delete m[id]; const r=await saveSite(m); if(r.error) return erro(r.error); window.JRImg.set(id,''); U.msg='Foto removida.'; paint(); return; }
  if(k==='adm-av'){ const r=v==='ok'?await q.from('avaliacoes').update({aprovada:true}).eq('id',id):await q.from('avaliacoes').delete().eq('id',id); if(r.error) return erro(r.error); return refresh(v==='ok'?'Avaliação publicada.':'Avaliação removida.'); }
  }catch(e){ erro(e); }
}
document.addEventListener('click',e=>{ const a=e.target.closest('[data-cl]'); if(a&&ready&&[root,proot,aroot,amroot,sroot].some(r=>r&&r.contains(a))) act(a); });
document.addEventListener('change',e=>{ if(!ready) return; if(e.target.id==='cl-serv') drawSlots(); if(e.target.id==='cl-mes'){ U.mes=e.target.value; paint(); } });


const encolher=(f,max)=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>{const k=Math.min(1,(max||1400)/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);c.toBlob(b=>b?ok(b):no(new Error('Imagem inválida')),'image/jpeg',.85);};im.onerror=()=>no(new Error('Imagem inválida'));im.src=URL.createObjectURL(f);});
async function saveSite(img){ U.site=Object.assign({},U.site||{},{img}); return U.sb.from('site_config').upsert({id:1,data:U.site}); }
async function loadSite(){ try{ const r=await U.sb.from('site_config').select('data').eq('id',1).maybeSingle(); U.site=(r.data&&r.data.data)||{img:{}}; if(window.JRImg) window.JRImg.load(U.site.img); }catch(e){} }
document.addEventListener('change',async e=>{
  const id=e.target&&e.target.dataset&&e.target.dataset.img, f=e.target.files&&e.target.files[0]; if(!id||!f||!U.sb) return;
  U.msg='Enviando a foto…'; paint();
  try{
    const b=await encolher(f), n=id.replace(/[^a-z0-9_-]/gi,'_')+'-'+Date.now()+'.jpg';
    const up=await U.sb.storage.from('site').upload(n,b,{contentType:'image/jpeg'}); if(up.error) throw up.error;
    const url=U.sb.storage.from('site').getPublicUrl(n).data.publicUrl, m=Object.assign({},(U.site||{}).img||{}); m[id]=url;
    const r=await saveSite(m); if(r.error) throw r.error;
    window.JRImg.set(id,url); U.msg='Foto trocada!'; paint();
  }catch(x){ U.msg='Não foi possível enviar a foto: '+((x&&x.message)||'tente de novo'); paint(); }
});
document.addEventListener('input',e=>{ const t=e.target, d=t&&t.dataset; if(!d) return;
  if(d.avf){ const b=t.closest('[data-avbox]'); if(b&&(d.avf==='nome'||d.avf==='com')) U.avf[b.dataset.avbox][d.avf==='nome'?'nome':'com']=t.value; }
  else if(d.sgf&&(d.sgf==='nome'||d.sgf==='txt'||d.sgf==='link')) U.sg[d.sgf==='nome'?'nome':d.sgf]=t.value; });
document.addEventListener('change',async e=>{
  const t=e.target, f=t&&t.files&&t.files[0]; if(!t||!t.hasAttribute||!t.hasAttribute('data-avatar')||!f||!U.sb||!U.user) return;
  U.msg='Enviando a foto…'; paint();
  try{
    const b=await encolher(f,400), n=U.user.id+'/avatar-'+Date.now()+'.jpg';
    const up=await U.sb.storage.from('avatares').upload(n,b,{contentType:'image/jpeg'}); if(up.error) throw up.error;
    const url=U.sb.storage.from('avatares').getPublicUrl(n).data.publicUrl;
    const r=await U.sb.from('perfis').update({foto_url:url}).eq('id',U.user.id); if(r.error) throw r.error;
    await refresh('Foto atualizada!');
  }catch(x){ erro(x); }
});
window.ClienteUI={mount(el){
  root=el; proot=$('#perfil-root'); aroot=$('#avaliar-root'); amroot=$('#avaliar-root-mk'); sroot=$('#sugestao-root'); if(!el) return; paint();
  if(!ready||U.sb) return;
  U.sb=window.supabase.createClient(CFG.url,CFG.key); loadSite(); window.JR={ready:true,sb:U.sb,user:null,wa:waUrl,refresh:()=>refresh()}; window.JR_CFG={pix:P.pix||'',sinal:P.sinal||0};
  U.sb.auth.onAuthStateChange((ev,s)=>{ U.user=s?s.user:null; if(window.JR) window.JR.user=U.user; if(!U.user) U.tab='agenda'; setTimeout(()=>refresh(ev==='SIGNED_IN'?'':undefined),0); });
  U.sb.auth.getSession().then(r=>{ U.user=r.data.session?r.data.session.user:null; if(window.JR) window.JR.user=U.user; refresh(); });
}};
})();