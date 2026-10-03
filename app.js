(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAR='<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"/></svg>';
const app=$('#app');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- estado ---------- */
let state={};
try{ state=JSON.parse($('#site-state').textContent)||{}; }catch(e){ state={}; }
state.profile=Object.assign({name:'Julia Ruth',whatsapp:'5542998692013',igMarketing:'juliadomkt_',igNails:''},state.profile||{});
state.images=state.images||{};
state.videos=state.videos||{};
state.fontKey=state.fontKey||'classico';
const FONT_PRESETS={
  classico:{n:'Clássico',display:"'Instrument Serif','Times New Roman',serif",body:"'Hanken Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif"},
  editorial:{n:'Editorial',display:"'Playfair Display',serif",body:"'Hanken Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif"},
  elegante:{n:'Elegante',display:"'Cormorant Garamond',serif",body:"'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif"},
  moderno:{n:'Moderno',display:"'Poppins',system-ui,-apple-system,'Segoe UI',sans-serif",body:"'Poppins',system-ui,-apple-system,'Segoe UI',sans-serif"},
  autoral:{n:'Autoral',display:"'Caveat',cursive",body:"'Hanken Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif"}
};
function applyFonts(){
  const p=FONT_PRESETS[state.fontKey]||FONT_PRESETS.classico;
  const r=document.documentElement.style;
  r.setProperty('--font-display',p.display);
  r.setProperty('--font-body',p.body);
}
applyFonts();
let mode='marketing', editing=false, dirty=0, ART=null;
const filters={mk:'Todos', nl:'Todos'};
const quiz={step:0,ans:[]};
const SB={photos:[],crops:[],hands:[{0:null,1:null,2:null,3:null,4:null},{0:null,1:null,2:null,3:null,4:null}],hand:0,selected:null,cropPhotoId:null,cropSrc:null,len:'media',shape:'oval',box:{x:20,y:20,w:120,h:170}};
let sbIdSeq=1, sbDrag=null;
const FINGER_NAMES=['Polegar','Indicador','Médio','Anelar','Mindinho'];
const HAND_F=[{x:35,top:198,w:58,r:-8},{x:106,top:150,w:62,r:-3},{x:179,top:127,w:64,r:0},{x:253,top:152,w:62,r:4},{x:327,top:244,w:64,r:26}];
const HAND_VBW=420;
function fingersFor(hand){ return hand===0?HAND_F:HAND_F.map(f=>({x:HAND_VBW-f.x-f.w,top:f.top,w:f.w,r:-f.r})); }
const LENGTHS={curta:['Curta',46],media:['Média',67],longa:['Longa',92],xlonga:['Extra longa',117]};
const SHAPES={quadrada:'Quadrada',oval:'Oval',amendoa:'Amêndoa',stiletto:'Stiletto'};
const NB={paper:'#FAF8FF',line:'rgba(51,27,128,.16)',nailLine:'rgba(51,27,128,.28)',empty:'#F2ECFF',emptyLine:'#C9B8F5',plus:'#9C86DA'};
let stepIdx=0;

const wa=msg=>'https://wa.me/'+String(state.profile.whatsapp).replace(/\D/g,'')+(msg?'?text='+encodeURIComponent(msg):'');
const igUrl=h=>'https://instagram.com/'+String(h).replace(/^@/,'');

/* ---------- conteúdo ---------- */
const MK_PORTFOLIO=[
 {id:'mk-p1',t:'Portfólio',c:'Marca',tone:4,d:'Um portfólio organizado, com a cara e os valores de quem cria.'},
 {id:'mk-p2',t:'Como você apresenta seu trabalho?',c:'Posts',tone:1,d:'Carrossel para ajudar profissionais a comunicar o que fazem.'},
 {id:'mk-p3',t:'Como eu criaria uma marca autêntica',c:'Marca',tone:3,d:'Passo a passo de identidade: propósito, paleta, tipografia e voz.'},
 {id:'mk-p4',t:'Eu não sou…',c:'Posts',tone:2,d:'Post de posicionamento, com colagem e personalidade.'},
 {id:'mk-p5',t:'Cópias no mundo do marketing',c:'Posts',tone:3,d:'Uma reflexão sobre originalidade e voz própria.'},
 {id:'mk-p6',t:'Eu não crio videozinhos!',c:'Vídeos',tone:1,d:'Capa e roteiro de vídeo com intenção, ritmo e narrativa.'},
 {id:'mk-p7',t:'Stories que conversam',c:'Stories',tone:2,d:'Sequências de stories para manter a audiência por perto.'},
 {id:'mk-p8',t:'Capas de destaque',c:'Stories',tone:4,d:'Ícones e capas de destaque alinhados à identidade do perfil.'}
];
const MK_CATS=['Todos','Posts','Vídeos','Marca','Stories'];
const NL_GALLERY=[
 {id:'nl-1',t:'',c:'Autênticas',tone:2,d:''},
 {id:'nl-2',t:'',c:'Básicas',tone:3,d:''},
 {id:'nl-3',t:'',c:'Delicadas',tone:1,d:'.'},
 {id:'nl-4',t:'',c:'Autênticas',tone:4,d:''},
 {id:'nl-5',t:'',c:'Nail art',tone:2,d:''},
 {id:'nl-6',t:'',c:'Básicas',tone:1,d:''},
 {id:'nl-7',t:'',c:'Delicadas',tone:3,d:''},
 {id:'nl-8',t:'',c:'Nail art',tone:4,d:''}
];
const NL_CATS=['Todos','Autênticas','Básicas','Delicadas','Nail art'];
const FLIPS=[
 {f:'Eu não crio videozinhos!',b:'Crio vídeos com roteiro, ritmo e intenção, para a sua marca ser lembrada.'},
 {f:'Eu não sou só quem posta.',b:'Eu penso o que, por que e quando a sua marca aparece.'},
 {f:'Eu não faço cópias.',b:'Cada marca tem voz própria. Eu ajudo a encontrar e sustentar a sua.'},
 {f:'Eu não faço post bonito por fazer.',b:'Todo layout nasce de um objetivo: atrair, explicar, convencer ou conectar.'}
];
const SERVICES=[
 {t:'Artes para redes sociais',p:'Posts, carrosséis, stories e capas de destaque com identidade consistente, para o seu perfil parecer uma marca de verdade.',tags:['Posts','Carrosséis','Stories','Capas de destaque']},
 {t:'Vídeos e Reels',p:'Roteiro, edição e ritmo para vídeos curtos que prendem a atenção e contam a sua história.',tags:['Roteiro','Edição','Reels','Legendas']},
 {t:'Identidade e linha visual',p:'Paleta, tipografia, tom de voz e um jeito próprio de aparecer. Uma marca autêntica, não uma cópia de outra.',tags:['Paleta','Tipografia','Tom de voz']},
 {t:'Portfólio e apresentação',p:'Organizo o seu trabalho e os seus valores em um portfólio claro, pronto para conquistar clientes.',tags:['Portfólio','Apresentação','Posicionamento']},
 {t:'Gestão de conteúdo',p:'Pauta, calendário e publicação organizados para você ter constância sem perder o fôlego.',tags:['Calendário','Pauta','Legendas','Constância']}
];
const STEPS=[
 {t:'Conversa',p:'A gente se conhece: sua marca, seu público e o que você quer que as pessoas sintam ao ver o seu perfil.'},
 {t:'Diagnóstico',p:'Olho seu perfil e o que já funciona no seu mercado. Saímos com um plano claro do que fazer primeiro.'},
 {t:'Criação',p:'Artes, vídeos e textos nascem do plano, com paleta, tipografia e tom de voz que são seus.'},
 {t:'Publicação',p:'Calendário organizado e tudo revisado por você antes de ir ao ar.'},
 {t:'Evolução',p:'Olhamos os resultados, ajustamos e seguimos crescendo com consistência.'}
];
const QUIZ=[
 {q:'O que você precisa agora?',o:['Sair do zero nas redes','Melhorar o que eu já tenho','Vídeos e Reels','Organizar minha marca']},
 {q:'Como está a sua presença hoje?',o:['Ainda não tenho perfil ativo','Posto, mas sem constância','Posto sempre, mas sem identidade']},
 {q:'Como você prefere trabalhar?',o:['Um projeto pontual','Acompanhamento mensal']}
];
const PACKS=[
 {n:'Kit de estreia',d:'Identidade visual básica e um kit de artes para você começar com cara de marca.'},
 {n:'Revisão de perfil e conteúdo',d:'Ajusto o que já existe: bio, destaques, linha visual e planejamento de conteúdo.'},
 {n:'Vídeos e Reels com roteiro',d:'Vídeos curtos com roteiro, edição e ritmo, pensados para o seu público.'},
 {n:'Identidade e linha visual',d:'Paleta, tipografia, tom de voz e um guia simples para manter tudo consistente.'}
];
const FAQ_MK=[
 {t:'Como funciona o primeiro contato?',p:'Você me chama no WhatsApp e conta sobre a sua marca. Eu respondo com os próximos passos e um caminho sob medida.'},
 {t:'Você faz só artes ou também vídeos?',p:'Os dois. Artes, carrosséis, stories, capas de destaque e vídeos curtos, tudo pensado para conversar entre si.'},
 {t:'Preciso ter uma identidade visual pronta?',p:'Não. Se você ainda não tem, começo por ela. Se já tem, eu organizo e evoluo o que existe.'},
 {t:'Posso contratar só um projeto?',p:'Pode. Existem projetos pontuais e acompanhamento mensal. O diagnóstico acima ajuda a escolher.'}
];
const FAQ_NL=[
 {t:'Como agendo meu horário?',p:'Pelo WhatsApp. Monte o seu set aqui no site e envie: já chega tudo certinho.'},
 {t:'Posso levar uma referência?',p:'Claro. Envie fotos de inspiração antes do atendimento para combinarmos a arte.'},
 {t:'Você faz temas personalizados?',p:'Sim! Copa do Mundo, séries, cores da sua marca, o que você imaginar.'},
 {t:'Qual a diferença entre os estilos?',p:'Natural é delicado e limpo. Autênticas são unhas que expressam sua personalidade. Nail art leva desenhos e detalhes'}
];

const PRICES=[
 {t:'Molde F1',d:'Unhas longas, resistentes e com acabamento natural. Dura até 30 dias, com manutenção a cada 15 dias.',dur:'2h',val:'Aplicação R$150,00 · Manutenção R$120,00'},
 {t:'Esmaltação em gel',d:'Unhas impecáveis por mais tempo, com brilho intenso, secagem rápida e maior durabilidade.',dur:'1h',val:'Aplicação R$80,00'},
 {t:'Banho de gel',d:'Mantém a unha natural mais resistente e protegida, evitando quebras e realçando o brilho.',dur:'1h30min',val:'Aplicação R$120,00'},
 {t:'Pedicure',d:'Pés bem cuidados, com acabamento limpo, sensação de leveza e mais durabilidade.',dur:'1h30min',val:'Aplicação R$80,00'}
];
const PRICE_EXTRA=['Reposição de unha + R$5,00 cada','Remoção de procedimento + R$30,00','Nail art complexa + (consultar a nail sobre o custo)'];
const PRICE_NOTE='Pedimos, por gentileza, que não haja desmarcações em cima da hora. Caso isso aconteça, o reagendamento será feito mediante pagamento de 30% de sinal antecipado. Toleramos até 20 minutos de atraso.';

function priceHTML(){
  return '<section class="wrap tight" id="precos"><div class="head"><div><h2 class="serif">Catálogo de <em>preços</em></h2><p class="sub">Duração e valores de cada procedimento.</p></div></div>'+
   '<div class="price-grid">'+PRICES.map(x=>'<div class="price-card"><span class="dur">'+esc(x.dur)+'</span><h3 class="serif">'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p><div class="val">'+esc(x.val)+'</div></div>').join('')+'</div>'+
   '<div class="price-extra"><div><h3>Adicionais</h3><ul>'+PRICE_EXTRA.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div><div><h3>Atenção</h3><p>'+esc(PRICE_NOTE)+'</p></div><div><h3>Pagamento</h3><p>Dinheiro ou Pix</p></div></div></section>';
}

const SETS={mk:MK_PORTFOLIO, nl:NL_GALLERY};

/* ---------- peças ---------- */
function slotInner(id,title,tone){
  const v=state.videos[id], s=state.images[id];
  if(v) return '<video src="'+v+'" controls muted playsinline preload="metadata" title="'+esc(title)+'"></video>';
  return s?'<img src="'+s+'" alt="'+esc(title)+'" decoding="async">':'<div class="ph t'+tone+'"><span>'+esc(title)+'</span><i>'+STAR+'</i></div>';
}

function slot(id,title,tone,cls){
  return '<div class="slot '+(cls||'')+'" data-slot="'+id+'" data-title="'+esc(title)+'" data-tone="'+tone+'">'+slotInner(id,title,tone)+'</div>';
}
const MARQUEE_FONTS=[
  "'Playfair Display',serif;font-style:italic",
  "'Bebas Neue',sans-serif;letter-spacing:.05em;font-size:1.2em",
  "'Caveat',cursive;font-weight:600;font-size:1.25em"
];

function marquee(words){
  const one=words.map((w,i)=>'<span style="font-family:'+MARQUEE_FONTS[i%MARQUEE_FONTS.length]+'">'+esc(w)+STAR+'</span>').join('');
  return '<div class="marquee" aria-hidden="true"><div class="track">'+one+one+'</div></div>';
}

function acc(items){
  return '<div class="acc">'+items.map((it,i)=>
    '<div class="acc-i'+(i===0?' open':'')+'"><button class="acc-h" data-act="acc" aria-expanded="'+(i===0)+'"><span class="serif">'+esc(it.t)+'</span><i class="plus"></i></button>'+
    '<div class="acc-p"><div><p>'+esc(it.p)+'</p>'+(it.tags?'<ul>'+it.tags.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+'</div></div></div>').join('')+'</div>';
}

function chips(set,cats){
  return '<div class="chips" role="group" aria-label="Filtrar">'+cats.map(c=>'<button class="chip" data-act="filter" data-set="'+set+'" data-c="'+esc(c)+'" aria-pressed="'+(filters[set]===c)+'">'+esc(c)+'</button>').join('')+'</div>';
}

function gridHTML(set){
  const list=SETS[set].filter(x=>filters[set]==='Todos'||x.c===filters[set]);
  if(!list.length) return '<p class="empty">Nada por aqui ainda.</p>';
  return list.map((x,i)=>'<button class="tile" style="animation-delay:'+(i*40)+'ms" data-act="open" data-set="'+set+'" data-i="'+i+'" aria-label="Abrir '+esc(x.t)+'">'+slot(x.id,x.t,x.tone)+'<span class="tile-cap">'+esc(x.t)+'</span></button>').join('');
}

function footer(){
  const p=state.profile;
  return '<section class="cta-foot"><div class="in"><h2 class="serif">Vamos criar algo com a <em>sua cara?</em></h2><a class="btn" href="'+wa('Olá, '+p.name+'! Vim pelo seu site e quero conversar.')+'" target="_blank" rel="noopener">Chamar no WhatsApp</a></div></section>'+
  '<footer class="foot"><div class="in"><div class="foot-grid">'+
   '<div><div class="logo">'+esc(p.name)+STAR+'</div><p>Criação de artes, vídeos e conteúdo para redes sociais. E unhas com assinatura.</p></div>'+
   '<div><h4>Marketing</h4><ul><li><a data-act="goto" data-mode="marketing" data-target="sobre">Sobre</a></li><li><a data-act="goto" data-mode="marketing" data-target="servicos">Serviços</a></li><li><a data-act="goto" data-mode="marketing" data-target="portfolio">Portfólio</a></li><li><a data-act="goto" data-mode="marketing" data-target="diagnostico">Diagnóstico</a></li></ul></div>'+
   '<div><h4>Unhas</h4><ul><li><a data-act="goto" data-mode="nails" data-target="estilos">Estilos</a></li><li><a data-act="goto" data-mode="nails" data-target="antes-depois">Antes e depois</a></li><li><a data-act="goto" data-mode="nails" data-target="monte">Monte seu set</a></li><li><a data-act="goto" data-mode="nails" data-target="precos">Preços</a></li><li><a data-act="goto" data-mode="nails" data-target="agendar">Agendar</a></li></ul></div>'+
   '<div><h4>Contato</h4><ul><li><a href="'+wa()+'" target="_blank" rel="noopener">WhatsApp</a></li>'+
   (p.igMarketing?'<li><a href="'+igUrl(p.igMarketing)+'" target="_blank" rel="noopener">Instagram de marketing: @'+esc(p.igMarketing.replace(/^@/,''))+'</a></li>':'')+
   (p.igNails?'<li><a href="'+igUrl(p.igNails)+'" target="_blank" rel="noopener">Instagram de unhas: @'+esc(p.igNails.replace(/^@/,''))+'</a></li>':'')+
   '</ul></div></div>'+
   '<div class="foot-bot"><span>© '+new Date().getFullYear()+' '+esc(p.name)+'. Todos os direitos reservados.</span><button data-act="top">Voltar ao topo</button></div></div></footer>';
}

/* ---------- mundo: marketing ---------- */
function marketingHTML(){
  const p=state.profile;
  return '<div class="world" data-w="marketing"><div class="nview" data-v="m-inicio">'+
  '<section class="hero" id="topo-mk"><div><h1 class="serif">Sua marca com mais <em>presença no digital.</em></h1>'+
   '<p class="lead">Criação de artes, vídeos e conteúdo para redes sociais, com identidade, intenção e o seu jeito em cada post.</p>'+
   '<div class="row"><button class="btn" data-act="go" data-target="diagnostico">Descobrir meu pacote</button><button class="btn ghost" data-act="go" data-target="portfolio">Ver portfólio</button></div></div>'+
   '<div class="hero-art"><div class="frame f1">'+slot('mk-hero-a','Portfólio',1)+'</div><div class="frame f2">'+slot('mk-hero-b','Marca autêntica',3)+'</div><div class="frame f3">'+slot('mk-hero-c','Eu não crio videozinhos!',4)+'</div>'+
   '<div class="badge" aria-hidden="true"><img src="img/jr-mkt.jpeg" alt="Julia Ruth Marketing" class="badge-logo"></div></div></section>'+
  marquee(['Artes','Vídeos','Conteúdo','Identidade visual','Reels','Stories','Portfólio'])+
  '<section class="wrap" id="sobre"><div class="about"><div class="portrait">'+slot('mk-about','Foto da '+p.name,1)+'</div><div>'+
   '<p class="big">'+esc(p.name)+', transformando ideias em estratégias que fazem sua marca crescer.</p>'+
   '<p class="txt">Meu trabalho é transformar o que você faz em conteúdo que as pessoas entendem, lembram e querem acompanhar. Sem fórmulas prontas e sem cópias.</p></div></div>'+
   '<div class="flips">'+FLIPS.map(f=>'<button class="flip" data-act="flip" aria-pressed="false"><span class="flip-in"><span class="face front"><span class="serif">'+esc(f.f)+'</span><small>Toque para virar</small></span><span class="face back">'+STAR+'<span>'+esc(f.b)+'</span></span></span></button>').join('')+'</div></section>'+
  X('m-inicio')+'</div><div class="nview" data-v="m-servicos">'+
  '<section class="wrap tight" id="servicos"><div class="split"><div class="stick"><h2 class="serif">O que eu <em>faço</em> por você</h2><p class="sub">Clique em cada serviço para ver o que está incluído.</p></div>'+acc(SERVICES)+'</div></section>'+
  X('m-servicos')+'</div><div class="nview" data-v="m-portfolio">'+
  '<section class="wrap" id="portfolio"><div class="head"><div><h2 class="serif">Portfólio</h2><p class="sub">Alguns trabalhos de artes, vídeos e marca. Toque para ver com calma.</p></div>'+chips('mk',MK_CATS)+'</div><div class="grid" id="grid-mk">'+gridHTML('mk')+'</div></section>'+
  X('m-portfolio')+'</div><div class="nview" data-v="m-processo">'+
  '<section class="wrap tight" id="processo"><div class="head"><div><h2 class="serif">Como o trabalho <em>acontece</em></h2><p class="sub">Cinco passos, sem surpresa no caminho.</p></div></div><div id="stepper">'+stepperHTML()+'</div></section>'+
  '<section class="wrap tight" id="diagnostico"><div class="quiz"><div><h2 class="serif">Qual é o <em>seu pacote</em> ideal?</h2><p class="sub">Três perguntas rápidas. No final, você já manda o resultado para mim no WhatsApp.</p></div><div class="qbox" id="quiz-box">'+quizHTML()+'</div></div></section>'+
  '<section class="wrap tight" id="duvidas-mk"><div class="split"><div class="stick"><h2 class="serif">Dúvidas <em>comuns</em></h2></div>'+acc(FAQ_MK)+'</div></section>'+
  X('m-processo')+'</div><div class="nview" data-v="m-contato">'+
  '<section class="wrap tight" id="contato"><div class="contact"><div><h2 class="serif">Vamos <em>conversar</em></h2><p class="sub">Conte o que você precisa. A mensagem abre direto no meu WhatsApp.</p><div class="links-col"><a href="'+wa()+'" target="_blank" rel="noopener">WhatsApp</a>'+(p.igMarketing?'<a href="'+igUrl(p.igMarketing)+'" target="_blank" rel="noopener">Instagram @'+esc(p.igMarketing.replace(/^@/,''))+'</a>':'')+'</div></div>'+
   '<div class="form"><div class="field"><label for="cf-name">Seu nome</label><input id="cf-name" autocomplete="name" placeholder="Como posso te chamar?"></div>'+
   '<div class="field"><label for="cf-need">O que você precisa?</label><select id="cf-need"><option>Artes para redes sociais</option><option>Vídeos e Reels</option><option>Identidade e linha visual</option><option>Portfólio e apresentação</option><option>Gestão de conteúdo</option><option>Ainda não sei, quero conversar</option></select></div>'+
   '<div class="field"><label for="cf-msg">Conte um pouco sobre a sua marca</label><textarea id="cf-msg" placeholder="Quem você é, o que vende e onde quer chegar."></textarea></div>'+
   '<button class="btn" data-act="send">Enviar pelo WhatsApp</button></div></div></section>'+
  '<section class="wrap tight"><div class="portal"><p>Também cuido das unhas. Vem conhecer?</p><button class="btn" data-act="mode" data-mode="nails">Ver unhas</button></div></section>'+
  X('m-contato')+'</div></div>';
}

function stepperHTML(){
  const s=STEPS[stepIdx];
  return '<div class="steps" style="--p:'+(stepIdx/(STEPS.length-1))+'">'+STEPS.map((x,i)=>'<button class="st'+(i<stepIdx?' done':'')+'" data-act="step" data-i="'+i+'"'+(i===stepIdx?' aria-current="step"':'')+'><b>'+(i+1)+'</b><span>'+esc(x.t)+'</span></button>').join('')+'</div>'+
  '<div class="step-panel"><div><h3>'+esc(s.t)+'</h3><p>'+esc(s.p)+'</p></div><button class="btn" data-act="step" data-i="'+((stepIdx+1)%STEPS.length)+'">'+(stepIdx===STEPS.length-1?'Recomeçar':'Próximo passo')+'</button></div>';
}

function quizHTML(){
  if(quiz.step>=QUIZ.length){
    const pk=PACKS[quiz.ans[0]], fmt=quiz.ans[2]===0?'projeto pontual':'acompanhamento mensal';
    const msg='Olá, '+state.profile.name+'! Fiz o diagnóstico no seu site. Resultado: '+pk.n+' ('+fmt+'). Minha presença hoje: '+QUIZ[1].o[quiz.ans[1]].toLowerCase()+'. Podemos conversar?';
    return '<div class="qres"><div class="qtop"><span>Resultado</span></div><p class="serif">'+esc(pk.n)+'</p><p style="margin-top:12px">'+esc(pk.d)+' Em formato de '+fmt+'.</p></div>'+
     '<a class="btn" href="'+wa(msg)+'" target="_blank" rel="noopener">Enviar meu resultado</a><button class="btn ghost" data-act="qreset">Refazer o diagnóstico</button>';
  }
  const q=QUIZ[quiz.step];
  return '<div class="qtop"><span>Pergunta '+(quiz.step+1)+' de '+QUIZ.length+'</span></div><div class="qbar"><i style="width:'+(quiz.step/QUIZ.length*100)+'%"></i></div>'+
   '<h3 class="qq">'+esc(q.q)+'</h3><div class="qopts">'+q.o.map((o,i)=>'<button class="qo" data-act="qz" data-v="'+i+'">'+esc(o)+'</button>').join('')+'</div>'+
   (quiz.step>0?'<button class="qback" data-act="qback">Voltar</button>':'');
}

/* ---------- mundo: unhas ---------- */
function fingerNailPath(nw,H,shape){
  if(shape==='quadrada') return 'M0 '+H+' L0 '+(H*.18)+' Q0 0 '+(nw*.16)+' 0 L'+(nw*.84)+' 0 Q'+nw+' 0 '+nw+' '+(H*.18)+' L'+nw+' '+H+' Q'+(nw/2)+' '+(H+8)+' 0 '+H+' Z';
  if(shape==='amendoa') return 'M0 '+H+' L0 '+(H*.32)+' C0 '+(H*.05)+' '+(nw*.36)+' 0 '+(nw/2)+' 0 C'+(nw*.64)+' 0 '+nw+' '+(H*.05)+' '+nw+' '+(H*.32)+' L'+nw+' '+H+' Q'+(nw/2)+' '+(H+8)+' 0 '+H+' Z';
  if(shape==='stiletto') return 'M0 '+H+' L0 '+(H*.48)+' L'+(nw/2)+' 0 L'+nw+' '+(H*.48)+' L'+nw+' '+H+' Q'+(nw/2)+' '+(H+8)+' 0 '+H+' Z';
  return 'M0 '+H+' L0 '+(H*.4)+' C0 '+(H*.1)+' '+(nw*.3)+' 0 '+(nw/2)+' 0 C'+(nw*.7)+' 0 '+nw+' '+(H*.1)+' '+nw+' '+(H*.4)+' L'+nw+' '+H+' Q'+(nw/2)+' '+(H+8)+' 0 '+H+' Z';
}

function sbCoverBox(nw,H,scale){
  const s=scale||1, cw=nw*1.7*s, ch=H*1.7*s;
  return {cw,ch,cx:(nw-cw)/2,cy:(H-ch)/2};
}

function imgTransform(icx,icy,as){
  return 'translate('+icx+' '+icy+') rotate('+(as.rot||0)+') scale('+(as.flip?-1:1)+',1) translate('+(-icx)+' '+(-icy)+')';
}

function sbHandSVG(hand){
  hand=hand===undefined?SB.hand:hand;
  const H=LENGTHS[SB.len][1], shape=SB.shape, fingers=fingersFor(hand), assign=SB.hands[hand]; let defs='', out='';
  fingers.forEach((f,i)=>{
    const nw=f.w-12, cx=f.x+f.w/2, cy=f.top+23, ny=f.top+39-H, clipId='sbclip'+hand+'-'+i, path=fingerNailPath(nw,H,shape);
    defs+='<clipPath id="'+clipId+'"><path d="'+path+'"/></clipPath>';
    const as=assign[i], crop=as?SB.crops.find(c=>c.id===as.cropId):null;
    let nailFill;
    if(crop){
      const cb=sbCoverBox(nw,H,as.scale), icx=cb.cx+cb.cw/2, icy=cb.cy+cb.ch/2;
      nailFill='<g clip-path="url(#'+clipId+')"><image href="'+crop.src+'" xlink:href="'+crop.src+'" x="'+cb.cx+'" y="'+cb.cy+'" width="'+cb.cw+'" height="'+cb.ch+'" preserveAspectRatio="xMidYMid slice" transform="'+imgTransform(icx,icy,as)+'"/></g>';
    } else {
      nailFill='<path d="'+path+'" fill="'+NB.empty+'" stroke="'+NB.emptyLine+'" stroke-width="1.5" stroke-dasharray="4 3"/><text x="'+(nw/2)+'" y="'+(H*.6)+'" text-anchor="middle" font-size="16" fill="'+NB.plus+'" font-family="sans-serif">+</text>';
    }
    out+='<g class="sb-finger" data-act="assign" data-i="'+i+'" data-assigned="'+(crop?1:0)+'" transform="rotate('+f.r+' '+cx+' '+cy+')">'+
     '<rect x="'+f.x+'" y="'+f.top+'" width="'+f.w+'" height="'+(350-f.top)+'" rx="'+(f.w/2)+'" fill="'+NB.paper+'" stroke="'+NB.line+'" stroke-width="2"/>'+
     '<g transform="translate('+(f.x+6)+' '+ny+')">'+nailFill+'<path d="'+path+'" fill="none" stroke="'+NB.nailLine+'" stroke-width="1.5"/></g></g>';
  });
  return '<svg viewBox="0 0 420 350" role="img" aria-label="Prévia da mão modelo com as unhas escolhidas"><defs>'+defs+'</defs>'+out+'</svg>';
}

function sbSingleNailSVG(i){
  const H=LENGTHS[SB.len][1], f=HAND_F[i], nw=f.w-12, shape=SB.shape, path=fingerNailPath(nw,H,shape);
  const as=SB.hands[SB.hand][i]||{scale:1,rot:0,flip:false}, crop=SB.crops.find(c=>c.id===as.cropId);
  let img='';
  if(crop){ const cb=sbCoverBox(nw,H,as.scale), icx=cb.cx+cb.cw/2, icy=cb.cy+cb.ch/2; img='<g clip-path="url(#sbprevclip)"><image href="'+crop.src+'" xlink:href="'+crop.src+'" x="'+cb.cx+'" y="'+cb.cy+'" width="'+cb.cw+'" height="'+cb.ch+'" preserveAspectRatio="xMidYMid slice" transform="'+imgTransform(icx,icy,as)+'"/></g>'; }
  return '<svg viewBox="'+(-nw*.15)+' '+(-H*.15)+' '+(nw*1.3)+' '+(H*1.3+10)+'" style="width:100%;height:100%"><defs><clipPath id="sbprevclip"><path d="'+path+'"/></clipPath></defs>'+img+'<path d="'+path+'" fill="none" stroke="'+NB.nailLine+'" stroke-width="2"/></svg>';
}

function sbPhotosHTML(){
  let out=SB.photos.map(p=>'<div class="sb-tile"><img src="'+p.src+'" data-act="sb-crop-open" data-id="'+p.id+'" alt="Foto de inspiração"><span class="sb-x" data-act="sb-photo-rm" data-id="'+p.id+'" aria-label="Remover foto">✕</span></div>').join('');
  if(SB.photos.length<5) out+='<button class="sb-add" data-act="sb-photo-add" aria-label="Adicionar foto de inspiração">+</button>';
  return out;
}

function sbStripHTML(){
  if(!SB.crops.length) return '<p class="sb-empty-note">Nenhuma unha recortada ainda. Envie uma foto e toque nela para recortar.</p>';
  return SB.crops.map(c=>'<div class="sb-nail" data-act="sb-nail-pick" data-id="'+c.id+'" aria-pressed="'+(SB.selected===c.id)+'"><img src="'+c.src+'" alt="Unha recortada"><span class="sb-x" data-act="sb-nail-rm" data-id="'+c.id+'" aria-label="Remover unha recortada">✕</span></div>').join('');
}

function sbShapeControlsHTML(){
  const pill=(g,k,label,active)=>'<button class="chip" data-act="'+g+'" data-v="'+k+'" aria-pressed="'+active+'">'+label+'</button>';
  return '<div class="sb-shape-controls"><div class="opt-group"><h4>Mão</h4><div class="chips">'+[0,1].map(h=>pill('sb-hand',h,'Mão '+(h+1),SB.hand===h)).join('')+'</div></div>'+
   '<div class="opt-group"><h4>Comprimento</h4><div class="chips">'+Object.keys(LENGTHS).map(k=>pill('sb-len',k,LENGTHS[k][0],SB.len===k)).join('')+'</div></div>'+
   '<div class="opt-group"><h4>Formato</h4><div class="chips">'+Object.keys(SHAPES).map(k=>pill('sb-shape',k,SHAPES[k],SB.shape===k)).join('')+'</div></div></div>';
}

function sbBuilderHTML(){
  return '<div class="setbuilder" id="setbuilder">'+
   '<div class="sb-col"><h3>1. Suas inspirações</h3><p class="sb-hint">Envie até 5 fotos e toque em cada uma para recortar a unha que você curtiu. Se a foto estiver de cabeça pra baixo, dá pra girar dentro do recorte.</p>'+
   '<div class="sb-photos" id="sb-photos">'+sbPhotosHTML()+'</div>'+
   '<h3>2. Unhas recortadas</h3><p class="sb-hint">Toque numa unha recortada e depois no dedo onde você quer colocá-la.</p>'+
   '<div class="sb-strip" id="sb-strip">'+sbStripHTML()+'</div></div>'+
   '<div class="sb-col"><h3>3. Sua mão modelo</h3><p class="sb-hint">Monte cada mão separadamente: escolha a mão, o comprimento e o formato das unhas.</p>'+
   sbShapeControlsHTML()+
   '<div class="hand-stage" id="hand-stage">'+sbHandSVG()+'</div>'+
   '<p class="sb-picktag" id="sb-picktag">'+(SB.selected?'Agora toque no dedo para colocar essa unha.':'Toque num dedo já preenchido para ajustar tamanho, giro e espelhamento.')+'</p>'+
   '<div class="row" style="margin-top:14px"><button class="btn" data-act="sb-finalize">Finalizar meu set (as duas mãos)</button></div>'+
   '<div id="sb-final"></div></div>'+
   '<input type="file" id="sb-file" accept="image/*" multiple style="display:none"></div>';
}

function sbRefreshAll(){
  const sb=$('#setbuilder'); if(sb) sb.outerHTML=sbBuilderHTML();
}

async function sbAddPhotos(files){
  const room=5-SB.photos.length;
  for(const f of Array.from(files).slice(0,room)){
    try{ const src=await fileToDataURL(f); SB.photos.push({id:'p'+(sbIdSeq++),src}); }
    catch(e){ toast('Não consegui ler uma das imagens.'); }
  }
  sbRefreshAll();
}

function sbAssignTap(i){
  const assign=SB.hands[SB.hand];
  if(SB.selected){ assign[i]={cropId:SB.selected,scale:1,rot:0,flip:false}; SB.selected=null; sbRefreshAll(); toast(FINGER_NAMES[i]+': unha aplicada!'); }
  else if(assign[i]){ sbOpenAdjust(i); }
  else{ toast('Toque primeiro numa unha recortada aí embaixo.'); }
}

function sbOpenAdjust(i){
  const as=SB.hands[SB.hand][i]; if(!as) return;
  if(as.rot===undefined) as.rot=0;
  if(as.flip===undefined) as.flip=false;
  const bg=document.createElement('div'); bg.className='dlg-bg'; bg.id='sb-adjust-bg';
  bg.innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>'+FINGER_NAMES[i]+'</h3>'+
   '<div class="adjust-prev" id="adjust-prev">'+sbSingleNailSVG(i)+'</div>'+
   '<div style="margin:6px 0 4px"><label for="adjust-zoom" style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">Tamanho da imagem</label><input id="adjust-zoom" type="range" min="0.5" max="2.4" step="0.05" value="'+as.scale+'" style="width:100%"></div>'+
   '<div style="margin:6px 0 4px"><label for="adjust-rot" style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">Girar</label><input id="adjust-rot" type="range" min="-180" max="180" step="1" value="'+as.rot+'" style="width:100%"></div>'+
   '<div class="row"><button class="btn ghost" data-act="sb-adjust-flip" data-i="'+i+'">⇋ Espelhar</button><button class="btn" data-act="sb-adjust-close">Pronto</button><button class="btn ghost" data-act="sb-adjust-remove" data-i="'+i+'">Remover unha</button></div></div>';
  bg.addEventListener('click',ev=>{ if(ev.target===bg) sbCloseAdjust(); });
  bg.addEventListener('input',ev=>{
    if(ev.target.id==='adjust-zoom') as.scale=parseFloat(ev.target.value);
    else if(ev.target.id==='adjust-rot') as.rot=parseFloat(ev.target.value);
    else return;
    const pv=$('#adjust-prev',bg); if(pv) pv.innerHTML=sbSingleNailSVG(i);
    const hs=$('#hand-stage'); if(hs) hs.innerHTML=sbHandSVG();
  });
  app.appendChild(bg);
}

function sbCloseAdjust(){ const bg=$('#sb-adjust-bg'); if(bg) bg.remove(); }

function sbPaintBox(){
  const box=$('#crop-box'); if(!box) return;
  box.style.left=SB.box.x+'px'; box.style.top=SB.box.y+'px'; box.style.width=SB.box.w+'px'; box.style.height=SB.box.h+'px';
}

function sbCenterBox(bg){
  const inner=$('#crop-inner',bg); if(!inner) return;
  const w=inner.clientWidth, h=inner.clientHeight, bw=Math.min(w*.42,140), bh=Math.min(h*.7,200);
  SB.box={x:(w-bw)/2,y:(h-bh)/2,w:bw,h:bh}; sbPaintBox();
}

function sbOpenCrop(photoId){
  const p=SB.photos.find(x=>x.id===photoId); if(!p) return;
  SB.cropPhotoId=photoId; SB.cropSrc=p.src;
  const bg=document.createElement('div'); bg.className='dlg-bg'; bg.id='sb-crop-bg';
  bg.innerHTML='<div class="dlg crop-dlg" role="dialog" aria-modal="true"><h3>Recorte a unha</h3>'+
   '<p style="color:var(--muted);font-size:14px">Arraste o quadro e os cantos até cobrir só a unha que você quer usar. Se a foto estiver invertida, gire antes de cortar.</p>'+
   '<div class="crop-stage" id="crop-stage"><div class="crop-inner" id="crop-inner"><img id="crop-img" src="'+p.src+'" alt="Foto de inspiração" draggable="false">'+
   '<div class="crop-box" id="crop-box"><span class="cb-handle tl" data-h="tl"></span><span class="cb-handle tr" data-h="tr"></span><span class="cb-handle bl" data-h="bl"></span><span class="cb-handle br" data-h="br"></span></div></div></div>'+
   '<div class="row"><button class="btn" data-act="sb-crop-confirm">Cortar esta unha</button><button class="btn ghost" data-act="sb-crop-rotate">↻ Girar foto</button><button class="btn ghost" data-act="sb-crop-close">Fechar</button></div></div>';
  bg.addEventListener('click',ev=>{ if(ev.target===bg) sbCloseCrop(); });
  app.appendChild(bg);
  const img=$('#crop-img',bg);
  const place=()=>sbCenterBox(bg);
  if(img.complete&&img.naturalWidth) place(); else img.onload=place;
}

function sbCloseCrop(){ const bg=$('#sb-crop-bg'); if(bg) bg.remove(); SB.cropPhotoId=null; SB.cropSrc=null; sbDrag=null; }

function sbRotateCrop(){
  const bg=$('#sb-crop-bg'); if(!bg) return;
  const img=$('#crop-img',bg); if(!img.naturalWidth) return;
  const w=img.naturalWidth, h=img.naturalHeight;
  const cv=document.createElement('canvas'); cv.width=h; cv.height=w;
  const cx=cv.getContext('2d'); cx.translate(h/2,w/2); cx.rotate(Math.PI/2); cx.drawImage(img,-w/2,-h/2);
  SB.cropSrc=cv.toDataURL('image/jpeg',.92);
  img.onload=()=>sbCenterBox(bg);
  img.src=SB.cropSrc;
}

function sbConfirmCrop(){
  const bg=$('#sb-crop-bg'); if(!bg) return;
  const img=$('#crop-img',bg);
  const scale=img.naturalWidth/img.clientWidth;
  const sx=Math.max(0,SB.box.x*scale), sy=Math.max(0,SB.box.y*scale);
  const sw=Math.min(img.naturalWidth-sx,SB.box.w*scale), sh=Math.min(img.naturalHeight-sy,SB.box.h*scale);
  if(sw<10||sh<10){ toast('Quadro muito pequeno. Ajuste e tente de novo.'); return; }
  const maxDim=480, sc=Math.min(1,maxDim/Math.max(sw,sh));
  const cv=document.createElement('canvas'); cv.width=Math.round(sw*sc); cv.height=Math.round(sh*sc);
  cv.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,cv.width,cv.height);
  const id='c'+(sbIdSeq++);
  SB.crops.push({id,src:cv.toDataURL('image/jpeg',.9)});
  SB.selected=id;
  sbRefreshAll();
  toast('Unha recortada! Agora toque num dedo pra usá-la.');
}

function sbShowFinal(src){
  const box=$('#sb-final'); if(!box) return;
  const fname='meu-set-'+String(state.profile.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
  box.innerHTML='<div class="sb-final"><h3 style="margin-top:18px">Pronto! Essa é a prévia do seu set</h3>'+
   '<img src="'+src+'" alt="Prévia final do set de unhas">'+
   '<p style="color:var(--muted);font-size:13px;margin-top:10px">Baixe a imagem e me envie ela aqui pelo WhatsApp junto com a sua mensagem.</p>'+
   '<div class="row"><a class="btn" href="'+src+'" download="'+fname+'.png">Baixar imagem</a><a class="btn ghost" href="'+wa('Olá, '+state.profile.name+'! Montei meu set no site e já baixei a prévia. Vou te enviar a foto aqui. Tem horário?')+'" target="_blank" rel="noopener">Chamar no WhatsApp</a></div></div>';
  box.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
}

function sbFinalize(){
  if(!SB.hands.some(h=>Object.values(h).some(Boolean))){ toast('Coloque pelo menos uma unha em um dedo antes de finalizar.'); return; }
  const w=420,h=350,gap=24,totalW=w*2+gap,totalH=h+40;
  const toB64=s=>'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)));
  const mk=hand=>sbHandSVG(hand).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+w+'" height="'+h+'" ');
  const im0=new Image(), im1=new Image();
  let loaded=0, failed=false;
  const done=()=>{
    loaded++;
    if(loaded<2||failed) return;
    const cv=document.createElement('canvas'); cv.width=totalW; cv.height=totalH;
    const cx=cv.getContext('2d'); cx.fillStyle='#FFFFFF'; cx.fillRect(0,0,cv.width,cv.height);
    cx.drawImage(im0,0,20,w,h); cx.drawImage(im1,w+gap,20,w,h);
    sbShowFinal(cv.toDataURL('image/png'));
  };
  const fail=()=>{ if(failed) return; failed=true; toast('Não consegui gerar a imagem. Tente novamente.'); };
  im0.onload=done; im1.onload=done; im0.onerror=fail; im1.onerror=fail;
  im0.src=toB64(mk(0)); im1.src=toB64(mk(1));
}

document.addEventListener('pointerdown',e=>{
  const bg=$('#sb-crop-bg'); if(!bg) return;
  const handle=e.target.closest('.cb-handle'), boxEl=e.target.closest('#crop-box');
  if(handle){ sbDrag={mode:handle.dataset.h,startX:e.clientX,startY:e.clientY,box:Object.assign({},SB.box)}; e.preventDefault(); }
  else if(boxEl){ sbDrag={mode:'move',startX:e.clientX,startY:e.clientY,box:Object.assign({},SB.box)}; e.preventDefault(); }
});
document.addEventListener('pointermove',e=>{
  if(!sbDrag) return;
  const inner=$('#crop-inner'); if(!inner) return;
  const rect=inner.getBoundingClientRect(), dx=e.clientX-sbDrag.startX, dy=e.clientY-sbDrag.startY, min=30;
  let {x,y,w,h}=sbDrag.box;
  if(sbDrag.mode==='move'){
    x=sbDrag.box.x+dx; y=sbDrag.box.y+dy;
    x=Math.max(0,Math.min(rect.width-w,x)); y=Math.max(0,Math.min(rect.height-h,y));
  } else {
    if(sbDrag.mode==='tl'){ x=sbDrag.box.x+dx; y=sbDrag.box.y+dy; w=sbDrag.box.w-dx; h=sbDrag.box.h-dy; }
    else if(sbDrag.mode==='tr'){ y=sbDrag.box.y+dy; w=sbDrag.box.w+dx; h=sbDrag.box.h-dy; }
    else if(sbDrag.mode==='bl'){ x=sbDrag.box.x+dx; w=sbDrag.box.w-dx; h=sbDrag.box.h+dy; }
    else if(sbDrag.mode==='br'){ w=sbDrag.box.w+dx; h=sbDrag.box.h+dy; }
    w=Math.max(min,w); h=Math.max(min,h);
    x=Math.max(0,Math.min(rect.width-w,x)); y=Math.max(0,Math.min(rect.height-h,y));
    w=Math.min(w,rect.width-x); h=Math.min(h,rect.height-y);
  }
  SB.box={x,y,w,h}; sbPaintBox();
},{passive:true});
['pointerup','pointercancel'].forEach(evt=>document.addEventListener(evt,()=>{ sbDrag=null; }));
app.addEventListener('change',e=>{
  if(e.target&&e.target.id==='sb-file'){ const files=e.target.files; if(files&&files.length) sbAddPhotos(files); e.target.value=''; }
});

function nailsHTML(){
  const p=state.profile;
  return '<div class="world" data-w="nails"><div class="nview" data-v="inicio">'+
  '<section class="hero" id="topo-nl"><div><h1 class="serif">Julia Ruth <em>Nails.</em></h1><p class="lead">Nail art autoral, do delicado ao temático. Cada set pensado para quem vai usar.</p>'+
   '<div class="row"><button class="btn" data-act="go" data-target="monte">Montar meu set</button><button class="btn ghost" data-act="go" data-target="estilos">Ver estilos</button></div></div>'+
   '<div class="hero-art"><div class="frame f2 arch-hero" style="width:62%;aspect-ratio:3/4.3;right:auto;left:19%;top:0">'+slot('nl-hero','Sua unha, sua história',2)+'</div>'+
   '<div class="badge" aria-hidden="true"><img src="img/jr-nd.jpeg" alt="Julia Ruth Marketing" class="badge-logo"></div></div></section>'+
  marquee(['Nail art','Básicas','Autênticas','Delicadas','Autorais'])+nlAboutHTML()+
  '<section class="wrap" id="estilos"><div class="head"><div><h2 class="serif">Estilos que <em>eu amo</em> fazer</h2><p class="sub">Toque em qualquer set para ver de perto.</p></div>'+chips('nl',NL_CATS)+'</div><div class="grid arches" id="grid-nl">'+gridHTML('nl')+'</div></section>'+
  '<section class="wrap tight" id="antes-depois"><div class="head"><div><h2 class="serif">Antes e <em>depois</em></h2><p class="sub">Arraste para comparar.</p></div></div>'+
   '<div class="ba"><div class="ba-a">'+slot('nl-after','Depois',2)+'</div><div class="ba-b">'+slot('nl-before','Antes',3)+'</div><span class="ba-line"></span><span class="ba-knob" aria-hidden="true">↔</span><input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"><span class="ba-tag l">Antes</span><span class="ba-tag r">Depois</span></div></section>'+
  X('inicio')+'</div><div class="nview" data-v="criar">'+
  '<section class="wrap tight" id="monte"><div class="head"><div><h2 class="serif">Monte o <em>seu set</em></h2><p class="sub">Envie fotos de inspiração, recorte a unha de cada dedo e veja tudo montado na mão modelo.</p></div></div>'+
   sbBuilderHTML()+'</section>'+
  nlExtrasHTML()+ '<section class="wrap tight" id="duvidas-nl"><div class="split"><div class="stick"><h2 class="serif">Dúvidas <em>comuns</em></h2></div>'+acc(FAQ_NL)+'</div></section>'+
  X('info')+'</div><div class="nview" data-v="agendar">'+
  '<section class="wrap tight" id="agendar"><div class="contact"><div><h2 class="serif">Bora <em>agendar?</em></h2><p class="sub">Me chame no WhatsApp com a sua referência e escolhemos o melhor horário.</p></div><div class="links-col" style="margin-top:0"><a href="'+wa('Olá, '+p.name+'! Quero agendar unhas.')+'" target="_blank" rel="noopener">Agendar pelo WhatsApp</a>'+(p.igNails?'<a href="'+igUrl(p.igNails)+'" target="_blank" rel="noopener">Instagram @'+esc(p.igNails.replace(/^@/,''))+'</a>':'')+'</div></div></section>'+
  '<section class="wrap tight"><div class="portal"><p>Tem um negócio? Vamos colocar a sua marca no digital.</p><button class="btn" data-act="mode" data-mode="marketing">Conhecer o marketing</button></div></section>'+
  X('agendar')+'</div></div>';
}

/* ---------- navegação ---------- */
function navHTML(){
  const MG=[
   {v:'m-inicio',t:'Início',i:[['topo-mk','Apresentação'],['sobre','Sobre mim'],['para-quem','Para quem é'],['depoimentos-mk','Depoimentos']]},
   {v:'m-servicos',t:'Serviços',i:[['servicos','O que eu faço'],['pacotes','Pacotes']]},
   {v:'m-portfolio',t:'Portfólio',i:[['portfolio','Trabalhos'],['redes-mk','Redes sociais']]},
   {v:'m-processo',t:'Processo',i:[['processo','Como funciona'],['diagnostico','Descubra seu pacote'],['duvidas-mk','Dúvidas'],['briefing','O que preciso de você']]},
   {v:'m-contato',t:'Contato',i:[['contato','Fale comigo'],['prazos','Prazos e pagamento']]}];
  const NG=[
   {v:'inicio',t:'Início',i:[['sobre-nl','Sobre mim'],['estilos','Estilos'],['antes-depois','Antes e depois'],['porque-nl','Por que escolher'],['depoimentos-nl','Depoimentos']]},
   {v:'criar',t:'Criar',i:[['monte','Monte seu set'],['match','Nail Match'],['calculadora','Calculadora'],['ocasioes','Unhas por ocasião']]},
   {v:'valores',t:'Valores',i:[['precos','Catálogo de preços'],['preco-nail-art','Preço da nail art'],['duvidas-valores','Dúvidas sobre valores']]},
   {v:'info',t:'Informações',i:[['primeira-vez','Primeira vez'],['cuidados','Cuidados'],['como-chegar','Como chegar'],['duvidas-nl','Dúvidas'],['atendimento','Como é o atendimento'],['biosseguranca','Higiene e cuidados']]},
   {v:'agendar',t:'Agendar',i:[['agendar','Agendar'],['agendar-passos','Como agendar']]}];
  const L=(arr,w)=>'<span data-w="'+w+'" style="display:contents">'+arr.map(a=>'<a data-act="go" data-target="'+a[0]+'">'+a[1]+'</a>').join('')+'</span>';
  const linksTop='<nav class="links" aria-label="Seções">'+'<span data-w="marketing" style="display:contents">'+ngTop(MG)+'</span>'+'<span data-w="nails" style="display:contents">'+ngTop(NG)+'</span>'+'</nav>';
  const sheet='<div class="sheet" id="sheet"><button class="x" data-act="menu" aria-label="Fechar menu">×</button><span data-w="marketing" style="display:contents">'+ngSheet(MG)+'</span><span data-w="nails" style="display:contents">'+ngSheet(NG)+'</span></div>';
  return '<div class="prog" id="prog"></div><header class="nav" id="nav"><button class="logo" data-act="top" aria-label="Voltar ao topo">'+esc(state.profile.name)+STAR+'</button>'+linksTop+
   '<div class="switch" role="tablist" aria-label="Escolha a área"><span class="thumb"></span><button role="tab" data-act="mode" data-mode="marketing">Marketing</button><button role="tab" data-act="mode" data-mode="nails">Unhas</button></div>'+
   '<button class="burger" data-act="menu" aria-label="Abrir menu" aria-expanded="false"><span></span></button></header>'+sheet;
}

function lightboxHTML(){
  return '<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Visualização"><button class="round lb-x" data-act="lbclose" aria-label="Fechar">×</button><div class="lb-card"><div class="lb-img" id="lb-img"></div><div class="lb-side"><h3 id="lb-t"></h3><p id="lb-d"></p><div class="lb-nav"><button class="round" data-act="lbprev" aria-label="Anterior">←</button><button class="round" data-act="lbnext" aria-label="Próximo">→</button></div></div></div></div>';
}

function render(){
  const y=window.scrollY;
  document.documentElement.dataset.mode=mode; document.documentElement.dataset.nv=nv;
  app.innerHTML=navHTML()+'<main>'+marketingHTML()+nailsHTML()+'</main>'+footer()+lightboxHTML()+'<div class="wipe" id="wipe" aria-hidden="true"></div><div class="toast" id="toast" role="status" aria-live="polite"></div>'+'<a class="wa-fab" href="'+wa()+'" target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.3-.7a11 11 0 0 1-4.5-3.9c-.4-.5-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.4.1.2.1.8-.1 1.4z"/></svg></a>';
  document.body.classList.toggle('editing',editing);
  if(ART) mountEditBar();
  window.scrollTo(0,y);
}

/* ---------- ações ---------- */

/* ---------- novidades Unhas (sem banco) ---------- */
const NL_LOC={addr:'[ENDEREÇO DO ATENDIMENTO]',ref:'[Ponto de referência]',hours:'[Dias e horários de atendimento]'};
const NL_PRIMEIRA=[
 {t:'Como é o primeiro atendimento?',p:'[Explique como funciona: conversa, escolha do set, tempo médio e o que a cliente pode esperar.]'},
 {t:'O que levar?',p:'[Fotos de referência, unhas sem esmalte se possível, e a vontade de contar o que você imagina.]'},
 {t:'Preciso pagar sinal?',p:'[Explique a política de sinal para novas clientes.]'}
];
const NL_CUIDADOS=[
 {t:'Nas primeiras 24 horas',p:'[Evite água muito quente, produtos de limpeza sem luvas e usar as unhas como ferramenta.]'},
 {t:'No dia a dia',p:'[Hidrate cutículas com óleo, use luvas para limpeza e não arranque nem puxe a unha.]'},
 {t:'Quando fazer a manutenção',p:'A cada 15 dias para o Molde F1, conforme a tabela de preços. [Ajuste para os outros procedimentos.]'},
 {t:'Algo deu errado?',p:'[Se descolar ou quebrar, fale comigo pelo WhatsApp. Não tente arrancar em casa.]'}
];
const NL_PRECO_ART=[
 {id:'nl-pr-1',t:'Detalhes simples',d:'[Ex.: francesinha, glitter, 1 ou 2 unhas decoradas. Explique o que pesa no valor.]'},
 {id:'nl-pr-2',t:'Arte média',d:'[Ex.: desenhos à mão livre, mais cores e adesivos em várias unhas.]'},
 {id:'nl-pr-3',t:'Arte complexa',d:'[Ex.: temas, personagens e pedrarias. O valor é combinado pelo WhatsApp com a sua referência.]'}
];
const MQ={
 nm:{tab:'Ruth Nail Match',title:'Qual estilo é a sua cara?',
  qs:[{q:'Como você descreveria o seu jeito?',o:['Delicada e discreta','Autêntica e ousada','Divertida e criativa','Elegante e clássica']},
      {q:'Para onde vão essas unhas?',o:['Dia a dia','Festa ou evento','Viagem ou tema especial','Trabalho']},
      {q:'Qual paleta chama você?',o:['Nude e rosé','Cores fortes e contraste','Tons vibrantes e temas','Neutros e vermelho clássico']}],
  res:[{n:'Delicadas',d:'Toques leves, cores suaves e acabamento limpo.'},{n:'Autênticas',d:'Unhas que expressam a sua personalidade, com a sua assinatura.'},{n:'Nail art',d:'Desenhos, temas e muitos detalhes. A sua unha vira uma pequena obra.'},{n:'Básicas',d:'Clássico bem feito: cor lisa, brilho e durabilidade.'}]},
 fit:{tab:'Unha que combina comigo',title:'Qual formato combina com você?',
  qs:[{q:'Como é a sua rotina?',o:['Digito e uso muito as mãos','Trabalho com as mãos','Escritório e vida social','Gosto de unhas que chamem atenção']},
      {q:'O que você quer valorizar?',o:['Dedos curtos e praticidade','Um visual natural','Alongar os dedos','Ousadia total']},
      {q:'Como você lida com manutenção?',o:['Quero algo resistente','Prefiro baixa manutenção','Faço manutenção em dia','Faço sem problema']}],
  res:[{n:'Curta e quadrada',d:'Resistente e prática para a rotina corrida.'},{n:'Oval, tamanho médio',d:'Visual natural, discreto e que combina com tudo.'},{n:'Amêndoa, média a longa',d:'Alonga os dedos e dá delicadeza.'},{n:'Stiletto, longa',d:'Impacto máximo. Pede cuidado e manutenção em dia.'}]}
};
const mq={k:'nm',step:0,ans:[]};
function mqHTML(){
 const Q=MQ[mq.k];
 const tabs='<div class="chips" style="margin-bottom:22px">'+Object.keys(MQ).map(k=>'<button class="chip" data-act="mq-tab" data-k="'+k+'" aria-pressed="'+(k===mq.k)+'">'+MQ[k].tab+'</button>').join('')+'</div>';
 if(mq.step>=Q.qs.length){
  const c=[0,0,0,0]; mq.ans.forEach(a=>c[a]++);
  const mx=Math.max.apply(null,c); let i=c.indexOf(mx); if(c[mq.ans[0]]===mx) i=mq.ans[0];
  const r=Q.res[i], msg='Olá, '+state.profile.name+'! Fiz o '+Q.tab+' no seu site e o resultado foi: '+r.n+'. Quero agendar!';
  return tabs+'<p class="sub">Seu resultado</p><h3 class="serif" style="font-size:clamp(32px,5vw,48px);margin:6px 0 10px">'+esc(r.n)+'</h3><p>'+esc(r.d)+'</p><div class="row" style="margin-top:20px"><a class="btn" href="'+wa(msg)+'" target="_blank" rel="noopener">Agendar com esse estilo</a><button class="btn ghost" data-act="mq-reset">Refazer</button></div>';
 }
 const q=Q.qs[mq.step];
 return tabs+'<p class="sub">Pergunta '+(mq.step+1)+' de '+Q.qs.length+'</p><h3 class="serif" style="font-size:clamp(26px,4vw,38px);margin:6px 0 18px">'+esc(q.q)+'</h3><div style="display:grid;gap:10px;max-width:460px">'+q.o.map((o,i)=>'<button class="btn ghost" data-act="mq-pick" data-v="'+i+'">'+esc(o)+'</button>').join('')+'</div>'+(mq.step?'<button class="btn ghost sm" style="margin-top:16px" data-act="mq-back">Voltar</button>':'');
}
const CALC_SV=[['Molde F1, aplicação',150,120],['Molde F1, manutenção',120,120],['Esmaltação em gel',80,60],['Banho de gel',120,90],['Pedicure',80,90],['Remoção de procedimento',30,30],['Nail art complexa (valor a consultar)',0,30]];
const brl=n=>'R$ '+n.toFixed(2).replace('.',',');
function calcHTML(){
 return '<section class="wrap tight" id="calculadora"><div class="head"><div><h2 class="serif">Calculadora de <em>procedimento</em></h2><p class="sub">Escolha o que você quer e veja o valor e o tempo estimados.</p></div></div><div class="price-card" id="calc">'+
  CALC_SV.map(s=>'<label class="calc-row"><input type="checkbox" data-t="'+esc(s[0])+'" data-v="'+s[1]+'" data-m="'+s[2]+'"><span>'+esc(s[0])+'</span><b>'+(s[1]?brl(s[1]):'consultar')+'</b></label>').join('')+
  '<label class="calc-row"><span>Reposição de unha (R$5,00 cada)</span><input id="calc-rep" type="number" min="0" max="20" value="0" style="width:70px"></label>'+
  '<div class="calc-tot"><div><small>Total estimado</small><div class="serif" id="calc-total">R$ 0,00</div><small id="calc-time">0 min</small></div><a class="btn" id="calc-wa" href="'+wa()+'" target="_blank" rel="noopener">Enviar para a Julia</a></div></div></section>';
}
function calcUpdate(){
 const c=$('#calc'); if(!c) return; let v=0,m=0,it=[];
 $$('input[type=checkbox]:checked',c).forEach(i=>{v+=+i.dataset.v; m+=+i.dataset.m; it.push(i.dataset.t);});
 const q=Math.max(0,Math.min(20,parseInt($('#calc-rep').value,10)||0)); if(q){v+=q*5; it.push('Reposição de unha x'+q);}
 $('#calc-total').textContent=brl(v); $('#calc-time').textContent=(m>=60?Math.floor(m/60)+'h':'')+(m%60?(m>=60?String(m%60).padStart(2,'0'):m+' min'):(m?'':'0 min'));
 $('#calc-wa').href=wa(it.length?'Olá, '+state.profile.name+'! Simulei no site: '+it.join(', ')+'. Total estimado: '+brl(v)+'.':'');
}
function nlAboutHTML(){
 return '<section class="wrap tight" id="sobre-nl"><div class="about"><div class="portrait">'+slot('nl-about','Foto da '+state.profile.name,1)+'</div><div><h2 class="serif">Oi, eu sou a <em>'+esc(state.profile.name.split(' ')[0])+'</em></h2><p class="sub">[Escreva aqui a sua história com as unhas, seu estilo de atendimento e o que a cliente pode esperar.]</p></div></div></section>';
}
function nlExtrasHTML(){
 const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(NL_LOC.addr);
 return '<section class="wrap tight" id="match"><div class="quiz"><div><h2 class="serif">Descubra o seu <em>match</em></h2><p class="sub">Responda três perguntas e veja o que combina com você.</p></div><div class="qbox" id="mq-box">'+mqHTML()+'</div></div></section>'+
  calcHTML()+
  X('criar')+'</div><div class="nview" data-v="valores">'+priceHTML()+
  '<section class="wrap tight" id="preco-nail-art"><div class="head"><div><h2 class="serif">Como escolho o preço da <em>nail art</em></h2><p class="sub">Entenda o que influencia o valor da sua arte.</p></div></div><div class="price-grid">'+NL_PRECO_ART.map(x=>'<div class="price-card">'+slot(x.id,x.t,2)+'<h3 class="serif" style="margin-top:14px">'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p></div>').join('')+'</div></section>'+
  X('valores')+'</div><div class="nview" data-v="info">'+
  '<section class="wrap tight" id="primeira-vez"><div class="split"><div class="stick"><h2 class="serif">Primeira <em>vez</em> aqui?</h2></div>'+acc(NL_PRIMEIRA)+'</div></section>'+
  '<section class="wrap tight" id="cuidados"><div class="split"><div class="stick"><h2 class="serif"><em>Cuidados</em> com as unhas</h2></div>'+acc(NL_CUIDADOS)+'</div></section>'+
  '<section class="wrap tight" id="como-chegar"><div class="contact"><div><h2 class="serif">Como <em>chegar</em></h2><p class="sub">'+esc(NL_LOC.addr)+'<br>'+esc(NL_LOC.ref)+'<br>'+esc(NL_LOC.hours)+'</p></div><div class="links-col" style="margin-top:0"><a href="'+maps+'" target="_blank" rel="noopener">Abrir no Google Maps</a><a href="https://waze.com/ul?q='+encodeURIComponent(NL_LOC.addr)+'" target="_blank" rel="noopener">Abrir no Waze</a></div></div></section>';
}
app.addEventListener('click',e=>{
 const a=e.target.closest('[data-act^="mq-"]'); if(!a) return; const act=a.dataset.act, n=MQ[mq.k].qs.length;
 if(act==='mq-tab'){ mq.k=a.dataset.k; mq.step=0; mq.ans=[]; }
 else if(act==='mq-pick'){ mq.ans[mq.step]=+a.dataset.v; mq.step++; }
 else if(act==='mq-back'){ mq.step=Math.max(0,mq.step-1); }
 else if(act==='mq-reset'){ mq.step=0; mq.ans=[]; }
 $('#mq-box').innerHTML=mqHTML();
});
app.addEventListener('input',e=>{ if(e.target.closest('#calc')) calcUpdate(); });
app.addEventListener('change',e=>{ if(e.target.closest('#calc')) calcUpdate(); });

/* ---------- páginas e menu das Unhas ---------- */
let nv='m-inicio'; const nvLast={marketing:'m-inicio',nails:'inicio'};
function setNV(v){ nv=v; nvLast[v.indexOf('m-')===0?'marketing':'nails']=v; document.documentElement.dataset.nv=v; }
const ngLinks=g=>g.i.map(a=>'<a data-act="go" data-target="'+a[0]+'">'+a[1]+'</a>').join('');
function ngTop(NG){ return NG.map(g=>'<div class="ng"><button class="ng-b'+(g.i.length>1?' has':'')+'" data-act="nv" data-v="'+g.v+'">'+g.t+'</button>'+(g.i.length>1?'<div class="ng-m">'+ngLinks(g)+'</div>':'')+'</div>').join(''); }
function ngSheet(NG){ return NG.map(g=>'<div class="sg"><button data-act="nv" data-v="'+g.v+'">'+g.t+'</button>'+(g.i.length>1?'<div class="sg-l">'+ngLinks(g)+'</div>':'')+'</div>').join(''); }
app.addEventListener('click',e=>{
 const a=e.target.closest('[data-act="nv"]'); if(!a) return;
 const s=$('#sheet'); if(s) s.classList.remove('open');
 setNV(a.dataset.v); window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
});

/* ---------- gaveta lateral ---------- */
function closeDrawer(){ const s=$('#sheet'); if(s) s.classList.remove('open'); const b=$('.burger'); if(b) b.setAttribute('aria-expanded','false'); }
document.addEventListener('click',e=>{ const s=$('#sheet'); if(!s||!s.classList.contains('open')) return; if(e.target.closest('#sheet')||e.target.closest('.burger')) return; closeDrawer(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDrawer(); });

/* ---------- seções extras (Marketing e Unhas) ---------- */
function cardsHTML(id,h,sub,arr){
 return '<section class="wrap tight" id="'+id+'"><div class="head"><div><h2 class="serif">'+h+'</h2>'+(sub?'<p class="sub">'+sub+'</p>':'')+'</div></div><div class="price-grid">'+arr.map(x=>'<div class="price-card"><h3 class="serif">'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p>'+(x.cta?'<a class="btn sm" style="margin-top:16px" href="'+wa(x.cta)+'" target="_blank" rel="noopener">'+esc(x.b||'Quero esse')+'</a>':'')+(x.href?'<a class="btn sm" style="margin-top:16px" href="'+x.href+'" target="_blank" rel="noopener">'+esc(x.b||'Abrir')+'</a>':'')+'</div>').join('')+'</div></section>';
}
function accSec(id,h,arr){ return '<section class="wrap tight" id="'+id+'"><div class="split"><div class="stick"><h2 class="serif">'+h+'</h2></div>'+acc(arr)+'</div></section>'; }
const XT=(a,b)=>[0,1,2].map(i=>({t:a+(i+1)+']',d:b}));
const EXTRA={
 'm-inicio':()=>cardsHTML('para-quem','Para quem é o <em>meu trabalho</em>','Se você se identifica com algum destes perfis, podemos conversar.',[
   {t:'Quem está começando',d:'Você tem um negócio ou serviço e quer aparecer nas redes com cara de marca, sem se perder.'},
   {t:'Quem já posta',d:'Seu perfil existe, mas falta constância, identidade ou clareza do que comunicar.'},
   {t:'Quem quer vender mais',d:'Você precisa que o conteúdo fale com o público certo e leve a pessoa até o seu contato.'}])+
  cardsHTML('depoimentos-mk','O que <em>dizem</em> por aí','',XT('[Nome da cliente ','[Escreva aqui o depoimento de uma cliente de marketing.]')),
 'm-servicos':()=>cardsHTML('pacotes','Pacotes e <em>formatos</em>','Escolha o caminho que combina com o momento da sua marca.',PACKS.map(p=>({t:p.n,d:p.d,cta:'Olá, '+state.profile.name+'! Tenho interesse em: '+p.n+'.',b:'Quero esse pacote'}))),
 'm-portfolio':()=>cardsHTML('redes-mk','Acompanhe nas <em>redes</em>','Mais trabalhos e bastidores no Instagram.',[
   {t:'Instagram',d:'Novos projetos, bastidores e dicas de conteúdo.',href:igUrl(state.profile.igMarketing),b:'Ver @'+state.profile.igMarketing.replace(/^@/,'')},
   {t:'Quer aparecer aqui?',d:'Conte sobre a sua marca e vamos criar o próximo case juntas.',cta:'Olá, '+state.profile.name+'! Quero conversar sobre a minha marca.',b:'Chamar no WhatsApp'}]),
 'm-processo':()=>cardsHTML('briefing','O que eu preciso <em>de você</em>','Para o trabalho andar bem, vale ter isto em mãos.',[
   {t:'Sobre a marca',d:'Nome, o que você vende, para quem e o que te diferencia.'},
   {t:'Referências',d:'Perfis, cores e estilos que você gosta (e os que não gosta).'},
   {t:'Materiais',d:'Logo, fotos, textos e links que já existem.'},
   {t:'Objetivo',d:'O que você quer alcançar nos próximos meses.'}]),
 'm-contato':()=>cardsHTML('prazos','Prazos, pagamento e <em>revisões</em>','',[
   {t:'Prazos',d:'[Informe o prazo médio de entrega para cada tipo de serviço.]'},
   {t:'Pagamento',d:'[Formas de pagamento, entrada e parcelamento.]'},
   {t:'Revisões',d:'[Quantas rodadas de ajuste estão incluídas.]'}]),
 'inicio':()=>cardsHTML('porque-nl','Por que <em>escolher</em> a Julia','',[
   {t:'Feito para você',d:'Cada set é pensado para o seu estilo, a sua rotina e a saúde da sua unha.'},
   {t:'Autoral de verdade',d:'Do delicado ao temático, a arte nasce da sua referência e ganha o meu toque.'},
   {t:'Acabamento e durabilidade',d:'Técnica e produtos escolhidos para o resultado durar, com manutenção combinada.'}])+
  cardsHTML('depoimentos-nl','Clientes <em>felizes</em>','',XT('[Nome da cliente ','[Escreva aqui o depoimento de uma cliente das unhas.]')),
 'criar':()=>cardsHTML('ocasioes','Unhas por <em>ocasião</em>','Conte para onde vão as suas unhas e eu monto o set ideal.',
   ['Noiva e madrinhas','Festas e eventos','Viagens e férias','Trabalho e dia a dia','Temas especiais'].map(o=>({t:o,d:'Me envie a sua referência e combinamos cores, formato e arte.',cta:'Olá, '+state.profile.name+'! Quero unhas para: '+o+'.',b:'Quero para isso'}))),
 'valores':()=>accSec('duvidas-valores','Dúvidas sobre <em>valores</em>',[
   {t:'O valor da nail art muda?',p:'Sim. Depende da quantidade de unhas decoradas e do nível de detalhe. Use a calculadora para ter uma estimativa.'},
   {t:'Como funciona o sinal?',p:'Em reagendamentos feitos em cima da hora, o sinal é de 30% antecipado.'},
   {t:'Quais as formas de pagamento?',p:'Dinheiro ou Pix.'},
   {t:'Qual a diferença entre aplicação e manutenção?',p:'A aplicação é o procedimento completo. A manutenção, feita a cada 15 dias no Molde F1, renova o acabamento por um valor menor.'}]),
 'info':()=>cardsHTML('atendimento','Como é o <em>atendimento</em>','Do primeiro oi até a saída com as unhas prontas.',[
   {t:'1. Conversa',d:'Você conta o que imagina e envia referências.'},
   {t:'2. Preparação',d:'Cuidado com cutículas e preparo da unha natural.'},
   {t:'3. Aplicação e arte',d:'Procedimento escolhido e a nail art combinada.'},
   {t:'4. Finalização',d:'Acabamento, orientações de cuidado e data da manutenção.'}])+
  cardsHTML('biosseguranca','Higiene e <em>cuidados</em>','',[
   {t:'Materiais higienizados',d:'[Descreva como os instrumentos são higienizados ou esterilizados.]'},
   {t:'Ambiente organizado',d:'[Descreva o ambiente e as medidas de higiene.]'},
   {t:'Cuidado com a sua unha',d:'[Descreva o cuidado com a saúde da unha natural.]'}]),
 'agendar':()=>cardsHTML('agendar-passos','Como <em>agendar</em> em 3 passos','',[
   {t:'1. Escolha o set',d:'Monte o seu set, use o Nail Match ou envie uma referência.'},
   {t:'2. Chame no WhatsApp',d:'Conte o procedimento e a data que prefere.',cta:'Olá, '+state.profile.name+'! Quero agendar unhas.',b:'Chamar agora'},
   {t:'3. Confirme o horário',d:'Eu confirmo o horário e envio as orientações.'}])
};
const X=k=>EXTRA[k]?EXTRA[k]():'';

let toastT;

function toast(m){ const t=$('#toast'); if(!t) return; t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),3200); }

function scrollToId(id){ const el=document.getElementById(id); if(!el) return; const nvw=el.closest('.nview'); if(nvw&&nvw.dataset.v!==nv) setNV(nvw.dataset.v); el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); }

function setMode(m,after){
  if(m===mode){ if(after) after(); return; }
  const w=$('#wipe'); const swap=()=>{ mode=m; document.documentElement.dataset.mode=m; setNV(nvLast[m]); document.title=m==='nails'?state.profile.name+' | Nail design':state.profile.name+' | Social media e nail design'; window.scrollTo(0,0); if(after) after(); };
  if(reduce||!w){ swap(); return; }
  w.textContent=m==='nails'?'unhas':'marketing'; w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
  setTimeout(swap,380); setTimeout(()=>w.classList.remove('go'),950);
}
let lb={set:'mk',list:[],i:0};

function openLB(set,i){
  lb.set=set; lb.list=SETS[set].filter(x=>filters[set]==='Todos'||x.c===filters[set]); lb.i=i; showLB(); $('#lb').classList.add('open'); document.body.style.overflow='hidden'; $('.lb-x').focus();
}

function showLB(){ const x=lb.list[lb.i]; if(!x) return; $('#lb-img').innerHTML='<div class="slot" data-slot="'+x.id+'">'+slotInner(x.id,x.t,x.tone)+'</div>'; $('#lb-t').textContent=x.t; $('#lb-d').textContent=x.d; }

function closeLB(){ const l=$('#lb'); if(l) l.classList.remove('open'); document.body.style.overflow=''; }

app.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]'); if(!a) return;
  const act=a.dataset.act;
  if(act==='mode'){ setMode(a.dataset.mode); }
  else if(act==='go'){ $('#sheet').classList.remove('open'); scrollToId(a.dataset.target); }
  else if(act==='goto'){ setMode(a.dataset.mode,()=>setTimeout(()=>scrollToId(a.dataset.target),60)); }
  else if(act==='top'){ window.scrollTo({top:0,behavior:reduce?'auto':'smooth'}); }
  else if(act==='menu'){ const s=$('#sheet'); const o=!s.classList.contains('open'); s.classList.toggle('open',o); $('.burger').setAttribute('aria-expanded',o); }
  else if(act==='flip'){ a.setAttribute('aria-pressed',a.getAttribute('aria-pressed')!=='true'); }
  else if(act==='acc'){ const it=a.closest('.acc-i'), open=!it.classList.contains('open'); $$('.acc-i',it.parentNode).forEach(x=>{x.classList.remove('open'); $('.acc-h',x).setAttribute('aria-expanded','false');}); if(open){ it.classList.add('open'); a.setAttribute('aria-expanded','true'); } }
  else if(act==='filter'){ filters[a.dataset.set]=a.dataset.c; $$('.chip',a.parentNode).forEach(c=>c.setAttribute('aria-pressed',c===a)); $('#grid-'+a.dataset.set).innerHTML=gridHTML(a.dataset.set); }
  else if(act==='open'){ openLB(a.dataset.set,+a.dataset.i); }
  else if(act==='lbclose'){ closeLB(); }
  else if(act==='lbprev'){ lb.i=(lb.i-1+lb.list.length)%lb.list.length; showLB(); }
  else if(act==='lbnext'){ lb.i=(lb.i+1)%lb.list.length; showLB(); }
  else if(act==='step'){ stepIdx=+a.dataset.i; $('#stepper').innerHTML=stepperHTML(); }
  else if(act==='qz'){ quiz.ans[quiz.step]=+a.dataset.v; quiz.step++; $('#quiz-box').innerHTML=quizHTML(); }
  else if(act==='qback'){ quiz.step=Math.max(0,quiz.step-1); $('#quiz-box').innerHTML=quizHTML(); }
  else if(act==='qreset'){ quiz.step=0; quiz.ans=[]; $('#quiz-box').innerHTML=quizHTML(); }
  else if(act==='sb-photo-add'){ $('#sb-file').click(); }
  else if(act==='sb-crop-open'){ sbOpenCrop(a.dataset.id); }
  else if(act==='sb-photo-rm'){ SB.photos=SB.photos.filter(p=>p.id!==a.dataset.id); sbRefreshAll(); }
  else if(act==='sb-nail-pick'){ SB.selected=SB.selected===a.dataset.id?null:a.dataset.id; sbRefreshAll(); }
  else if(act==='sb-nail-rm'){ const rid=a.dataset.id; SB.crops=SB.crops.filter(c=>c.id!==rid); SB.hands.forEach(h=>{ Object.keys(h).forEach(k=>{ if(h[k]&&h[k].cropId===rid) h[k]=null; }); }); if(SB.selected===rid) SB.selected=null; sbRefreshAll(); }
  else if(act==='assign'){ sbAssignTap(+a.dataset.i); }
  else if(act==='sb-crop-confirm'){ sbConfirmCrop(); }
  else if(act==='sb-crop-rotate'){ sbRotateCrop(); }
  else if(act==='sb-crop-close'){ sbCloseCrop(); }
  else if(act==='sb-hand'){ SB.hand=+a.dataset.v; SB.selected=null; sbRefreshAll(); }
  else if(act==='sb-len'){ SB.len=a.dataset.v; sbRefreshAll(); }
  else if(act==='sb-shape'){ SB.shape=a.dataset.v; sbRefreshAll(); }
  else if(act==='sb-adjust-close'){ sbCloseAdjust(); }
  else if(act==='sb-adjust-flip'){ const fi=+a.dataset.i; const as=SB.hands[SB.hand][fi]; if(as){ as.flip=!as.flip; const pv=$('#adjust-prev'); if(pv) pv.innerHTML=sbSingleNailSVG(fi); const hs=$('#hand-stage'); if(hs) hs.innerHTML=sbHandSVG(); } }
  else if(act==='sb-adjust-remove'){ const ri=+a.dataset.i; SB.hands[SB.hand][ri]=null; sbCloseAdjust(); sbRefreshAll(); }
  else if(act==='sb-finalize'){ sbFinalize(); }
  else if(act==='send'){
    const n=$('#cf-name').value.trim(), need=$('#cf-need').value, m=$('#cf-msg').value.trim();
    if(!n){ toast('Diga seu nome para eu saber com quem falo.'); $('#cf-name').focus(); return; }
    window.open(wa('Olá, '+state.profile.name+'! Meu nome é '+n+'. Preciso de: '+need+'.'+(m?' Sobre a minha marca: '+m:'')),'_blank','noopener');
  }
  else if(act==='edit-toggle'){ editing=!editing; document.body.classList.toggle('editing',editing); mountEditBar(); toast(editing?'Clique em qualquer imagem para trocar.':'Modo de edição desligado.'); }
  else if(act==='edit-settings'){ openSettings(); }
  else if(act==='edit-fonts'){ openFonts(); }
  else if(act==='edit-publish'){ publish(); }
});
document.addEventListener('keydown',e=>{
  const l=$('#lb'); if(!l||!l.classList.contains('open')) return;
  if(e.key==='Escape') closeLB(); else if(e.key==='ArrowRight'){ lb.i=(lb.i+1)%lb.list.length; showLB(); } else if(e.key==='ArrowLeft'){ lb.i=(lb.i-1+lb.list.length)%lb.list.length; showLB(); }
});
app.addEventListener('input',e=>{ if(e.target.classList.contains('ba-range')){ e.target.closest('.ba').style.setProperty('--pos',e.target.value+'%'); } });

/* parallax do hero, progresso e sombra do menu */
let raf=0;
window.addEventListener('pointermove',e=>{
  if(reduce||raf||window.scrollY>window.innerHeight) return;
  raf=requestAnimationFrame(()=>{ raf=0; const r=document.documentElement.style; r.setProperty('--mx',((e.clientX/window.innerWidth-.5)*2).toFixed(3)); r.setProperty('--my',((e.clientY/window.innerHeight-.5)*2).toFixed(3)); });
},{passive:true});
window.addEventListener('scroll',()=>{
  const h=document.documentElement.scrollHeight-window.innerHeight, p=$('#prog'), n=$('#nav');
  if(p) p.style.width=(h>0?window.scrollY/h*100:0)+'%';
  if(n) n.classList.toggle('scrolled',window.scrollY>10);
},{passive:true});

/* ---------- edição de imagens (só para quem pode editar) ---------- */

function fileToDataURL(file){
  return new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onerror=()=>rej(new Error('leitura'));
    fr.onload=()=>{
      const img=new Image();
      img.onerror=()=>rej(new Error('imagem'));
      img.onload=()=>{
        const max=1400, s=Math.min(1,max/Math.max(img.width,img.height));
        const w=Math.round(img.width*s), h=Math.round(img.height*s);
        const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        const cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,w,h); cx.drawImage(img,0,0,w,h);
        res(cv.toDataURL('image/jpeg',.86));
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function fileToVideoURL(file){
  return new Promise((res,rej)=>{
    if(file.size>20*1024*1024){ rej(new Error('grande')); return; }
    const fr=new FileReader();
    fr.onerror=()=>rej(new Error('leitura'));
    fr.onload=()=>res(fr.result);
    fr.readAsDataURL(file);
  });
}

function refreshSlot(id){
  $$('.slot[data-slot="'+id+'"]').forEach(el=>{ el.innerHTML=slotInner(id,el.dataset.title||'',el.dataset.tone||1); });
  if($('#lb')&&$('#lb').classList.contains('open')) showLB();
}

function slotFromClick(e){
  const ba=e.target.closest('.ba');
  if(ba&&!e.target.closest('.slot')){ return null; }
  const s=e.target.closest('.slot');
  if(ba&&s){
    const r=ba.getBoundingClientRect(), pos=parseFloat(ba.style.getPropertyValue('--pos'))||50;
    return ((e.clientX-r.left)/r.width*100<pos)?$('.ba-b .slot',ba):$('.ba-a .slot',ba);
  }
  return s;
}

function slotDialog(el){
  const id=el.dataset.slot, title=el.dataset.title||'Imagem', has=!!state.images[id]||!!state.videos[id];
  const bg=document.createElement('div'); bg.className='dlg-bg';
  bg.innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>'+esc(title)+'</h3><div class="thumb-prev"><div class="slot" style="position:relative">'+slotInner(id,title,el.dataset.tone||1)+'</div></div><p style="color:var(--muted);font-size:14px">A imagem é ajustada automaticamente; o vídeo é aceito até 20MB. Depois de trocar, toque em “Publicar alterações”.</p><div class="row"><button class="btn" data-d="pick">Escolher imagem</button>'+(state.images[id]?'<button class="btn" data-d="adjust">Editar enquadramento</button>':'')+'<button class="btn" data-d="pick-video">Escolher vídeo</button>'+(has?'<button class="btn ghost" data-d="rm">Remover</button>':'')+'<button class="btn ghost" data-d="x">Fechar</button></div></div>';
  bg.addEventListener('click',async ev=>{
    const d=ev.target.dataset.d;
    if(ev.target===bg||d==='x'){ bg.remove(); return; }
    if(d==='rm'){ delete state.images[id]; delete state.videos[id]; delete state.imageEdits[id]; dirty++; refreshSlot(id); mountEditBar(); bg.remove(); }
    if(d==='adjust'){ bg.remove(); imageEditor(el); }
    if(d==='pick'){
      const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
      inp.onchange=async()=>{
        const f=inp.files&&inp.files[0]; if(!f) return;
        try{ state.images[id]=await fileToDataURL(f); delete state.videos[id]; dirty++; refreshSlot(id); mountEditBar(); bg.remove(); toast('Imagem trocada. Publique para salvar.'); }
        catch(err){ toast('Não consegui ler essa imagem. Tente outro arquivo.'); }
      };
      inp.click();
    }
    if(d==='pick-video'){
      const inp=document.createElement('input'); inp.type='file'; inp.accept='video/*';
      inp.onchange=async()=>{
        const f=inp.files&&inp.files[0]; if(!f) return;
        try{ state.videos[id]=await fileToVideoURL(f); delete state.images[id]; dirty++; refreshSlot(id); mountEditBar(); bg.remove(); toast('Vídeo trocado. Publique para salvar.'); }
        catch(err){ toast('Esse vídeo é muito grande (máx. 20MB) ou não pude lê-lo. Tente outro arquivo.'); }
      };
      inp.click();
    }
  });
  app.appendChild(bg);
}
document.addEventListener('click',e=>{
  if(!editing) return;
  if(e.target.closest('.editbar,.dlg-bg,.nav,.sheet,.switch')) return;
  const el=slotFromClick(e);
  if(el){ e.preventDefault(); e.stopPropagation(); slotDialog(el); }
},true);

function openSettings(){
  const p=state.profile;
  const bg=document.createElement('div'); bg.className='dlg-bg';
  bg.innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>Contatos do site</h3>'+
   '<div class="field"><label for="s-name">Nome</label><input id="s-name" value="'+esc(p.name)+'"></div>'+
   '<div class="field"><label for="s-wa">WhatsApp (com código do país)</label><input id="s-wa" inputmode="numeric" value="'+esc(p.whatsapp)+'"></div>'+
   '<div class="field"><label for="s-igm">Instagram de marketing</label><input id="s-igm" value="'+esc(p.igMarketing)+'" placeholder="usuario"></div>'+
   '<div class="field"><label for="s-ign">Instagram de unhas</label><input id="s-ign" value="'+esc(p.igNails)+'" placeholder="usuario"></div>'+
   '<div class="row"><button class="btn" data-d="save">Salvar</button><button class="btn ghost" data-d="x">Cancelar</button></div></div>';
  bg.addEventListener('click',ev=>{
    const d=ev.target.dataset.d;
    if(ev.target===bg||d==='x'){ bg.remove(); return; }
    if(d==='save'){
      state.profile={name:$('#s-name',bg).value.trim()||'Julia',whatsapp:$('#s-wa',bg).value.replace(/\D/g,'')||p.whatsapp,igMarketing:$('#s-igm',bg).value.trim().replace(/^@/,''),igNails:$('#s-ign',bg).value.trim().replace(/^@/,'')};
      dirty++; bg.remove(); render(); toast('Contatos atualizados. Publique para salvar.');
    }
  });
  app.appendChild(bg);
}

function openFonts(){
  const bg=document.createElement('div'); bg.className='dlg-bg';
  bg.innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>Fontes do site</h3>'+
   '<p style="color:var(--muted);font-size:14px;margin:-6px 0 4px">Escolha a dupla de fontes (títulos + texto). O site inteiro muda na hora.</p>'+
   '<div class="font-list">'+Object.keys(FONT_PRESETS).map(k=>{
     const p=FONT_PRESETS[k];
     return '<button class="font-opt'+(state.fontKey===k?' on':'')+'" data-font="'+k+'"><span style="font-family:'+p.display+';font-size:22px">'+esc(p.n)+'</span><small style="font-family:'+p.body+'">Texto de exemplo do corpo do site</small></button>';
   }).join('')+'</div>'+
   '<div class="row"><button class="btn ghost" data-d="x">Fechar</button></div></div>';
  bg.addEventListener('click',ev=>{
    const d=ev.target.closest('[data-d]'), f=ev.target.closest('[data-font]');
    if(ev.target===bg||d){ bg.remove(); return; }
    if(f){ state.fontKey=f.dataset.font; dirty++; applyFonts(); mountEditBar(); bg.remove(); toast('Fonte trocada. '+(ART?'Publique':'Baixe o HTML')+' para salvar.'); }
  });
  app.appendChild(bg);
}

function mountEditBar(){
  let bar=$('#editbar');
  if(!bar){ bar=document.createElement('div'); bar.id='editbar'; bar.className='editbar'; app.appendChild(bar); }
  const saveLabel=(ART?'Publicar alterações':'Baixar HTML atualizado')+(dirty?' ('+dirty+')':'');
  bar.innerHTML='<button data-act="edit-toggle" class="'+(editing?'on':'')+'">'+(editing?'Sair da edição':'Editar imagens')+'</button><button data-act="edit-fonts">Fontes</button><button data-act="edit-settings">Contatos</button><button class="pub" data-act="edit-publish"'+(dirty?'':' disabled')+'>'+saveLabel+'</button>';
}

function buildDoc(){
  const c=document.documentElement.cloneNode(true);
  c.setAttribute('data-mode','marketing'); c.removeAttribute('style');
  Array.from(c.querySelector('head').children).forEach(n=>{ if(!n.hasAttribute('data-k')) n.remove(); });
  const b=c.querySelector('body'); b.removeAttribute('class'); b.removeAttribute('style');
  Array.from(b.children).forEach(n=>{ if(!n.hasAttribute('data-k')) n.remove(); });
  c.querySelector('#app').innerHTML='';
  c.querySelector('#site-state').textContent=JSON.stringify(state).replace(/</g,'\\u003c');
  return '<!doctype html>\n'+c.outerHTML;
}
async function publish(){
  if(!dirty) return;
  const html=buildDoc();
  if(html.length>15*1024*1024){ toast('As imagens ficaram pesadas demais. Remova algumas e tente de novo.'); return; }
  if(ART){
    toast('Publicando…');
    try{ await ART.publish(html); toast('Publicado!'); dirty=0; mountEditBar(); }
    catch(err){ const c=err&&err.code; toast(c==='conflict'?'Outra versão foi publicada. A página vai recarregar.':c==='not_writer'||c==='not_granted'?'Só o dono do site pode publicar.':'Não foi possível publicar agora. Tente de novo.'); }
    return;
  }
  try{
    const blob=new Blob([html],{type:'text/html'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='index.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast('Arquivo baixado! Substitua o index.html do projeto por esse.');
    dirty=0; mountEditBar();
  }catch(e){ toast('Não consegui gerar o arquivo. Tente de novo.'); }
}
async function initEdit(){
  const params=new URLSearchParams(location.search);
  const localEdit=params.get('edit')==='1'||params.get('editar')==='1';
  try{
    if(window.claude&&window.claude.use){
      const [user,art]=await Promise.all([window.claude.use('user'),window.claude.use('artifact')]);
      if(user&&art&&user.canEdit()){ ART=art; mountEditBar(); return; }
    }
  }catch(e){}
  if(localEdit) mountEditBar();
}

render();
initEdit();
})();