(function(){
'use strict';
var APP='The Story of How We Recovered';
var K={cur:'bbd:current',done:'bbd:done',j:'bbd:journal',fs:'bbd:fs',th:'bbd:theme'};
var DATA=null, DAYS=[], READ=[], STEPS=[];
var main=document.getElementById('main'), bar=document.getElementById('bar');

function ls(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function el(tag,attrs,kids){var n=document.createElement(tag);if(attrs)for(var a in attrs){if(a==='class')n.className=attrs[a];else if(a==='text')n.textContent=attrs[a];else if(a==='html')n.innerHTML=attrs[a];else if(a.slice(0,2)==='on')n.addEventListener(a.slice(2),attrs[a]);else if(attrs[a]!==null&&attrs[a]!==undefined)n.setAttribute(a,attrs[a]);}
  (kids||[]).forEach(function(c){if(c===null||c===undefined)return;n.appendChild(typeof c==='string'?document.createTextNode(c):c);});return n;}
function svg(markup){var t=document.createElement('template');t.innerHTML=markup.trim();return t.content.firstChild;}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show');},2200);}

var EMBLEM='<svg class="emblem" viewBox="0 0 220 220" role="img" aria-label="A circle with a triangle inscribed in it"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d98f"/><stop offset="1" stop-color="#b8892b"/></linearGradient>'+
 '<path id="sL" d="M58.6 133.1 L104.3 53.9"/><path id="sR" d="M115.7 53.9 L161.4 133.1"/><path id="sB" d="M50 167 L170 167"/></defs>'+
 '<circle cx="110" cy="110" r="96" fill="none" stroke="url(#eg)" stroke-width="3.2"/>'+
 '<polygon points="110,20 187.9,155 32.1,155" fill="none" stroke="url(#eg)" stroke-width="3.2" stroke-linejoin="round"/>'+
 '<text class="lbl"><textPath href="#sL" startOffset="50%" text-anchor="middle">Recovery</textPath></text>'+
 '<text class="lbl"><textPath href="#sR" startOffset="50%" text-anchor="middle">Unity</textPath></text>'+
 '<text class="lbl"><textPath href="#sB" startOffset="50%" text-anchor="middle">Service</textPath></text></svg>';
var MINI='<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="86" fill="none" stroke="#c9a24a" stroke-width="5"/><polygon points="100,20 169.28,140 30.72,140" fill="none" stroke="#c9a24a" stroke-width="5" stroke-linejoin="round"/></svg>';
var I={prev:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
 share:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 list:'<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>'};

/* ---------- state ---------- */
function total(){return DAYS.length;}
function cur(){var c=ls(K.cur,1);return Math.min(Math.max(1,c|0),total());}
function done(){return ls(K.done,[]);}
function isDone(n){return done().indexOf(n)>=0;}
function setDone(n,v){var d=done().filter(function(x){return x!==n;});if(v)d.push(n);d.sort(function(a,b){return a-b;});ss(K.done,d);}
function journal(){return ls(K.j,{});}
function saveJ(id,text){var j=journal();if(text&&text.trim()){j[id]={t:text,ts:Date.now()};}else{delete j[id];}ss(K.j,j);}

/* ---------- rendering of content items ---------- */
function linkify(text){
  var frag=document.createDocumentFragment();var re=/(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;var last=0,m;
  while((m=re.exec(text))){frag.appendChild(document.createTextNode(text.slice(last,m.index)));var u=m[0].replace(/[.,;]$/,'');var href=/^http/.test(u)?u:'http://'+u;
    frag.appendChild(el('a',{href:href,target:'_blank',rel:'noopener',class:'link',text:u}));last=m.index+u.length;}
  frag.appendChild(document.createTextNode(text.slice(last)));return frag;}
function para(text){var p=el('p');String(text).split(/\*\*(.+?)\*\*/).forEach(function(s,i){if(!s)return;if(i%2)p.appendChild(el('strong',{text:s}));else p.appendChild(linkify(s));});return p;}
function renderItems(items,ctx){
  var box=el('div',{class:'post'});var list=null;var qn=0;
  items.forEach(function(it){
    if(it.t!=='li'&&list){box.appendChild(list);list=null;}
    switch(it.t){
      case 'titlepage':
        box.appendChild(el('div',{class:'titlepage'},[svg(MINI),el('div',{class:'t1',text:it.lines[0]}),el('div',{class:'t2'},[it.lines[1],el('br'),it.lines[2],el('br'),it.lines[3]])]));break;
      case 'symbol':
        var s=svg(EMBLEM);s.style.width='200px';s.style.display='block';s.style.margin='6px auto 18px';s.querySelectorAll('.lbl').forEach(function(t){t.style.fill='var(--accent)';});box.appendChild(s);break;
      case 'h': box.appendChild(el('h3',{text:it.x}));break;
      case 'ref': box.appendChild(el('span',{class:'ref',text:it.x}));break;
      case 'quote':
        var bq=el('blockquote',{class:it.poem?'poem':null});if(it.poem){bq.appendChild(el('p',{text:it.x}));}else{it.x.split('\n').forEach(function(l){bq.appendChild(para(l));});}box.appendChild(bq);break;
      case 'prayer': if(it.poem){var pd=el('div',{class:'prayer poem'});it.x.split('\n').forEach(function(l){pd.appendChild(el('span',{class:'pl',text:l}));});box.appendChild(pd);}else box.appendChild(el('div',{class:'prayer',text:it.x}));break;
      case 'note': box.appendChild(el('p',{class:'note',text:it.x}));break;
      case 'grid': var gt=el('table',{class:'grid'});it.rows.forEach(function(r){gt.appendChild(el('tr',null,r.map(function(c,ci){return el(ci?'td':'th',{scope:ci?null:'row',text:c});})));});box.appendChild(gt);break;
      case 'label': box.appendChild(el('p',{class:'reflabel',text:it.x}));break;
      case 'link': var p=el('p');p.appendChild(linkify(it.x));box.appendChild(p);break;
      case 'table':
        var tb=el('table',{class:'ex'});var tr=el('tr');[0,1,2].forEach(function(){tr.appendChild(el('th',{text:it.head}));});tb.appendChild(el('thead',null,[tr]));
        var r1=el('tr'),r2=el('tr');it.rows.forEach(function(r){r1.appendChild(el('td',null,[el('strong',{text:r[0]})]));r2.appendChild(el('td',{text:r[1]}));});
        tb.appendChild(el('tbody',null,[r1,r2]));box.appendChild(tb);break;
      case 'li':
        if(!list)list=el('ul',{class:'list'});
        list.appendChild(el('li',{class:'li'},[el('span',{class:'n',text:it.n==='•'?'•':it.n+'.'}),el('span',{class:'t'},[linkify(it.x)])]));break;
      case 'q':
        qn++;box.appendChild(question(it,qn,ctx));break;
      default: box.appendChild(para(it.x));
    }
  });
  if(list)box.appendChild(list);
  return box;
}
function question(it,n,ctx){
  var wrap=el('div',{class:'q'});
  var body=el('div',{class:'body'});
  body.appendChild(el('p',{class:'qt'},[linkify(it.x)]));
  if(it.id){
    var j=journal()[it.id];
    var ta=null,saved=el('div',{class:'saved','aria-live':'polite'});
    var btn=el('button',{class:'jbtn',type:'button','aria-expanded':'false'});
    function label(){var has=journal()[it.id];btn.innerHTML='';if(has)btn.appendChild(el('span',{class:'dot'}));btn.appendChild(document.createTextNode(has?'Read or edit my reflection':'Write my reflection'));}
    label();
    function open(){
      if(ta){return;}
      ta=el('textarea',{'aria-label':'My reflection on question '+n,placeholder:'Sit with the question. Write what comes to you\u2026'});
      ta.value=(journal()[it.id]||{}).t||'';
      var tmr;ta.addEventListener('input',function(){clearTimeout(tmr);saved.textContent='Saving\u2026';tmr=setTimeout(function(){saveJ(it.id,ta.value);saved.textContent=ta.value.trim()?'Saved on this phone':'';label();btn.setAttribute('aria-expanded','true');},400);});
      ta.addEventListener('blur',function(){saveJ(it.id,ta.value);label();});
      body.insertBefore(ta,saved);btn.setAttribute('aria-expanded','true');
      if(journal()[it.id])saved.textContent='Saved on this phone';
    }
    btn.addEventListener('click',function(){if(ta){saveJ(it.id,ta.value);ta.remove();ta=null;saved.textContent='';btn.setAttribute('aria-expanded','false');label();}else{open();ta.focus();}});
    body.appendChild(btn);body.appendChild(saved);
    if(j&&ctx&&ctx.expandSaved)open();
  }
  wrap.appendChild(el('span',{class:'num','aria-hidden':'true',text:String(n)}));
  wrap.appendChild(body);
  return wrap;
}

/* ---------- views ---------- */
function setTab(t){document.querySelectorAll('.tabs a').forEach(function(a){if(a.dataset.tab===t)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});}
function shell(tab){bar.hidden=false;setTab(tab);document.body.classList.remove('on-cover');var w=el('div',{class:'wrap'});main.innerHTML='';main.appendChild(w);return w;}

function viewCover(){
  bar.hidden=true;document.getElementById('settings').hidden=true;main.innerHTML='';
  var c=cur(),d=done().length,started=d>0||ls(K.cur,null)!==null;
  var cv=el('section',{class:'cover','aria-label':'Cover'},[
    el('p',{class:'kicker',text:'A daily study of the Big Book'}),
    svg(EMBLEM),
    el('h1',{text:APP}),
    el('p',{class:'sub',text:'One reading a day \u00b7 Questions to sit with \u00b7 A private journal'}),
    el('hr',{class:'rule'}),
    el('div',{class:'actions'},[
      el('a',{class:'btn btn-gold',href:'#/today',text:started?('Continue \u00b7 Day '+c+' of '+total()):'Begin with Day 1'}),
      el('a',{class:'btn btn-ghost',href:'#/reading/about',text:'How to use this study'}),
      el('a',{class:'btn btn-ghost',href:'#/contents',text:'Contents'}),
      el('a',{class:'btn btn-ghost',href:'#/steps',text:'Work the Steps'}),
      el('a',{class:'btn btn-ghost',href:'#/readings',text:'Readings & prayers'})
    ]),
    started?el('p',{class:'progress-note',text:d+' of '+total()+' days completed'}):null,
    el('p',{class:'foot',text:'An independent study guide; not affiliated with Alcoholics Anonymous World Services.'})
  ]);
  main.appendChild(cv);document.title=APP;
}

function viewDay(n){
  n=Math.min(Math.max(1,n|0),total());var d=DAYS[n-1];
  var w=shell(n===cur()?'today':'contents');
  document.title='Day '+n+' \u00b7 '+d.title+' \u00b7 '+APP;
  w.appendChild(el('p',{class:'kicker',text:d.section}));
  var h=el('h1',{class:'day-title',text:d.title});w.appendChild(h);
  var pct=Math.round(done().length/total()*100);
  w.appendChild(el('div',{class:'meter'},[el('span',null,['Day '+n+' of '+total(),isDone(n)?el('span',{class:'done-badge',text:'\u2713 Complete'}):null]),el('div',{class:'track',role:'progressbar','aria-label':'Days completed','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(pct)},[el('div',{class:'fill',style:'width:'+pct+'%'})])]));
  w.appendChild(renderItems(d.items,{day:n}));
  w.appendChild(el('div',{class:'endmark','aria-hidden':'true',text:'\u25b3'}));
  var row=el('div',{class:'row-btns'},[
    el('button',{class:'btn btn-line',type:'button',onclick:function(){share(n);}},[svg(I.share.replace('<svg ','<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ')),'Share this day']),
    isDone(n)?el('button',{class:'btn btn-line',type:'button',onclick:function(){setDone(n,false);toast('Marked as not complete');viewDay(n);}},['Mark not complete']):null
  ]);
  w.appendChild(row);
  w.appendChild(el('p',{class:'disclaimer',text:'An independent study guide; not affiliated with Alcoholics Anonymous World Services.'}));
  // bottom nav
  var last=n===total();
  var mainBtn=el('button',{class:'btn btn-navy main',type:'button',onclick:function(){
      setDone(n,true);
      if(n>=cur()){ss(K.cur,Math.min(n+1,total()));}
      if(last){toast('You have completed the whole study. God bless.');viewDay(n);}
      else{toast('Day '+n+' complete');location.hash='#/day/'+(n+1);}
    }},[isDone(n)?(last?'Completed':'Next day \u2192'):(last?'Mark complete':'Mark complete \u2192')]);
  if(isDone(n)&&!last){mainBtn.onclick=function(){location.hash='#/day/'+(n+1);};}
  var nav=el('nav',{class:'daynav','aria-label':'Day navigation'},[el('div',{class:'in'},[
    el('button',{class:'sq',type:'button','aria-label':'Previous day',disabled:n===1?'':null,onclick:function(){location.hash='#/day/'+(n-1);}},[svg(I.prev)]),
    el('button',{class:'sq',type:'button','aria-label':'Next day',disabled:last?'':null,onclick:function(){location.hash='#/day/'+(n+1);}},[svg(I.next)]),
    mainBtn,
    el('button',{class:'sq',type:'button','aria-label':'Share this day',onclick:function(){share(n);}},[svg(I.share)])
  ])]);
  main.appendChild(nav);
}

function plain(items){
  var out=[],qn=0;
  items.forEach(function(it){
    if(it.t==='titlepage')out.push(it.lines.join('\n'));
    else if(it.t==='q'){qn++;out.push(qn+'. '+it.x);}
    else if(it.t==='li')out.push((it.n==='•'?'\u2022':it.n+'.')+' '+it.x);
    else if(it.t==='h')out.push('\n'+it.x.toUpperCase());
    else if(it.t==='ref')out.push('   ('+it.x+')');
    else if(it.t==='grid')out.push(it.rows.map(function(r){return '   '+r[0]+': '+r.slice(1).join(', ');}).join('\n'));
    else if(it.t==='table')out.push(it.rows.map(function(r){return it.head+': '+r[0]+' \u2013 '+r[1];}).join('\n'));
    else if(it.x)out.push(it.x);
  });
  return out.join('\n\n').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\n{3,}/g,'\n\n');
}
function share(n){
  var d=DAYS[n-1];var url=location.href.split('#')[0]+'#/day/'+n;
  var text='Day '+n+' \u2013 '+d.section+' \u00b7 '+d.title+'\n\n'+plain(d.items)+'\n\n\u2014 '+APP;
  if(navigator.share){navigator.share({title:'Day '+n+' \u00b7 '+d.title,text:text+'\n'+url}).catch(function(){});}
  else copy(text+'\n'+url);
}
function copy(text){
  function ok(){toast('Copied. Paste it into a text or email.');}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(ok,function(){fallback();});}else fallback();
  function fallback(){var t=el('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');ok();}catch(e){toast('Could not copy');}t.remove();}
}

function viewContents(){
  var w=shell('contents');document.title='Contents \u00b7 '+APP;
  w.appendChild(el('h1',{class:'page-h',text:'Contents'}));
  var dn=done().length;
  w.appendChild(el('p',{class:'lead',text:total()+' daily readings \u00b7 '+dn+' completed \u00b7 You are on Day '+cur()+'.'}));
  var form=el('form',{class:'search',role:'search',onsubmit:function(e){e.preventDefault();location.hash='#/search/'+encodeURIComponent(inp.value.trim());}});
  var inp=el('input',{type:'search',placeholder:'Search all readings\u2026','aria-label':'Search all readings',enterkeyhint:'search'});
  form.appendChild(inp);form.appendChild(el('button',{class:'btn btn-navy',type:'submit',text:'Search'}));w.appendChild(form);
  var c=cur(),ds=done(),secName=null,ul=null;
  DAYS.forEach(function(d){
    if(d.section!==secName){secName=d.section;w.appendChild(el('h2',{class:'sec',text:secName}));ul=el('ul',{class:'items'});w.appendChild(ul);}
    var on=ds.indexOf(d.day)>=0;
    ul.appendChild(el('li',{class:d.day===c?'cur':null},[el('a',{href:'#/day/'+d.day,'aria-label':'Day '+d.day+': '+d.title+(on?' (complete)':'')+(d.day===c?' (current day)':'')},[
      el('span',{class:'dn',text:'Day '+d.day}),el('span',{class:'tt'},[d.title,d.day===c?el('small',{text:'\u2190 You are here'}):null]),el('span',{class:'ck'+(on?' on':''),'aria-hidden':'true'})])]));
  });
  var curEl=w.querySelector('.cur');if(curEl&&sessionStorage.getItem('bbd:scrollcur')!=='0'){setTimeout(function(){curEl.scrollIntoView({block:'center'});},30);}
}

function norm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');}
function viewSearch(q){
  var w=shell('contents');document.title='Search \u00b7 '+APP;
  w.appendChild(el('h1',{class:'page-h',text:'Search'}));
  var form=el('form',{class:'search',role:'search',onsubmit:function(e){e.preventDefault();location.hash='#/search/'+encodeURIComponent(inp.value.trim());}});
  var inp=el('input',{type:'search',value:q,'aria-label':'Search all readings',enterkeyhint:'search'});
  form.appendChild(inp);form.appendChild(el('button',{class:'btn btn-navy',type:'submit',text:'Search'}));w.appendChild(form);
  if(!q){inp.focus();return;}
  var nq=norm(q),res=[];
  DAYS.forEach(function(d){var txt=d.title+'\n'+plain(d.items);var nt=norm(txt);var i=nt.indexOf(nq);if(i>=0){res.push({href:'#/day/'+d.day,lab:'Day '+d.day,title:d.title,sub:d.section,txt:txt,i:i});}});
  STEPS.forEach(function(s){var txt='Step '+s.n+' \u00b7 '+s.name+'\n'+plain(s.items);var nt=norm(txt);var i=nt.indexOf(nq);if(i>=0)res.push({href:'#/step/'+s.n,lab:'Step '+s.n,title:s.name,sub:'Work the Steps',txt:txt,i:i});});
  READ.forEach(function(r){var txt=r.title+'\n'+plain(r.items);var nt=norm(txt);var i=nt.indexOf(nq);if(i>=0)res.push({href:'#/reading/'+r.id,lab:'Reading',title:r.title,sub:r.group,txt:txt,i:i});});
  w.appendChild(el('p',{class:'lead',text:res.length+(res.length===1?' match':' matches')+' for \u201c'+q+'\u201d'}));
  if(!res.length){w.appendChild(el('p',{class:'empty',text:'Nothing found. Try a shorter word.'}));return;}
  var ul=el('ul',{class:'items'});
  res.slice(0,150).forEach(function(r){
    var s=Math.max(0,r.i-60),e=Math.min(r.txt.length,r.i+q.length+80);
    var snip=el('span',{class:'snip'},[(s>0?'\u2026':'')+r.txt.slice(s,r.i).replace(/\s+/g,' '),el('mark',{text:r.txt.substr(r.i,q.length)}),r.txt.slice(r.i+q.length,e).replace(/\s+/g,' ')+(e<r.txt.length?'\u2026':'')]);
    ul.appendChild(el('li',null,[el('a',{href:r.href},[el('span',{class:'dn',text:r.lab}),el('span',{class:'tt'},[r.title,el('small',{text:r.sub}),snip])])]));
  });
  w.appendChild(ul);
}


var WORDS=['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];
function viewSteps(){
  var w=shell('steps');document.title='Work the Steps \u00b7 '+APP;
  w.appendChild(el('h1',{class:'page-h',text:'Work the Steps'}));
  var intro=DATA.stepsIntro||{};
  if(intro.lead){var lp=el('p',{class:'lead'});intro.lead.split(/(\u201c[^\u201d]*\u201d)/).forEach(function(s){if(!s)return;lp.appendChild(/^\u201c/.test(s)?el('em',{class:'inline-prayer',text:s}):document.createTextNode(s));});w.appendChild(lp);}
  if(intro.items)w.appendChild(renderItems(intro.items,{}));
  w.appendChild(el('h2',{class:'sec',text:'The Twelve Steps'}));
  var ul=el('ul',{class:'items steps-list'});
  STEPS.forEach(function(s){
    ul.appendChild(el('li',null,[el('a',{href:'#/step/'+s.n,'aria-label':'Step '+s.n+': '+s.name},[
      el('span',{class:'stepno','aria-hidden':'true',text:String(s.n)}),
      el('span',{class:'tt'},['Step '+WORDS[s.n-1]+' \u00b7 '+s.name,el('small',{text:s.wording})])])]));
  });
  w.appendChild(ul);
  w.appendChild(el('p',{class:'disclaimer',text:'An independent study guide; not affiliated with Alcoholics Anonymous World Services.'}));
}
function viewStep(n){
  n=Math.min(Math.max(1,n|0),STEPS.length);var s=STEPS[n-1];if(!s){location.hash='#/steps';return;}
  var w=shell('steps');document.title='Step '+n+' \u00b7 '+s.name+' \u00b7 '+APP;
  w.appendChild(el('p',{class:'kicker',text:'Work the Steps \u00b7 Step '+n+' of '+STEPS.length}));
  w.appendChild(el('h1',{class:'day-title',text:'Step '+WORDS[n-1]+': '+s.name}));
  w.appendChild(renderItems(s.items,{}));
  w.appendChild(el('div',{class:'endmark','aria-hidden':'true',text:'\u25b3'}));
  var btns=el('div',{class:'row-btns'},[el('a',{class:'btn btn-line',href:'#/steps',text:'\u2190 All steps'})]);
  btns.appendChild(el('button',{class:'btn btn-line',type:'button',onclick:function(){var t='Step '+n+' \u00b7 '+s.name+'\n\n'+plain(s.items)+'\n\n\u2014 '+APP;var u=location.href;if(navigator.share)navigator.share({title:'Step '+n+' \u00b7 '+s.name,text:t+'\n'+u}).catch(function(){});else copy(t+'\n'+u);}},['Share']));
  w.appendChild(btns);
  w.appendChild(el('p',{class:'disclaimer',text:'An independent study guide; not affiliated with Alcoholics Anonymous World Services.'}));
  var nav=el('nav',{class:'daynav','aria-label':'Step navigation'},[el('div',{class:'in three'},[
    el('button',{class:'sq',type:'button','aria-label':'Previous step',disabled:n===1?'':null,onclick:function(){location.hash='#/step/'+(n-1);}},[svg(I.prev)]),
    el('button',{class:'btn btn-navy main',type:'button',onclick:function(){location.hash=n<STEPS.length?'#/step/'+(n+1):'#/steps';}},[n<STEPS.length?'Step '+(n+1)+' \u2192':'All steps']),
    el('button',{class:'sq',type:'button','aria-label':'Next step',disabled:n===STEPS.length?'':null,onclick:function(){location.hash='#/step/'+(n+1);}},[svg(I.next)])
  ])]);
  main.appendChild(nav);
}

function viewReadings(){
  var w=shell('readings');document.title='Readings \u00b7 '+APP;
  w.appendChild(el('h1',{class:'page-h',text:'Readings'}));
  w.appendChild(el('p',{class:'lead',text:'How to use this study, the prayers from the daily readings, and other helpful pieces, all in one place.'}));
  var g=null,ul=null;
  READ.forEach(function(r){
    if(r.group!==g){g=r.group;w.appendChild(el('h2',{class:'sec',text:g}));ul=el('ul',{class:'items'});w.appendChild(ul);}
    ul.appendChild(el('li',null,[el('a',{href:'#/reading/'+r.id},[el('span',{class:'tt'},[r.title,r.day?el('small',{text:'Also in Day '+r.day+' \u00b7 '+DAYS[r.day-1].title}):null])])]));
  });
}
function viewReading(id){
  var r=READ.filter(function(x){return x.id===id;})[0];if(!r){location.hash='#/readings';return;}
  var w=shell('readings');document.title=r.title+' \u00b7 '+APP;
  w.appendChild(el('p',{class:'kicker',text:r.group}));
  w.appendChild(el('h1',{class:'day-title',text:r.title}));
  w.appendChild(renderItems(r.items,{}));
  var btns=el('div',{class:'row-btns'},[el('a',{class:'btn btn-line',href:'#/readings',text:'\u2190 All readings'})]);
  if(r.day)btns.appendChild(el('a',{class:'btn btn-line',href:'#/day/'+r.day,text:'Read it in Day '+r.day}));
  if(id==='about')btns.appendChild(el('a',{class:'btn btn-navy',href:'#/today',text:'Go to today\u2019s reading'}));
  btns.appendChild(el('button',{class:'btn btn-line',type:'button',onclick:function(){var t=r.title+'\n\n'+plain(r.items)+'\n\n\u2014 '+APP;var u=location.href;if(navigator.share)navigator.share({title:r.title,text:t+'\n'+u}).catch(function(){});else copy(t+'\n'+u);}},['Share']));
  w.appendChild(btns);
}

function qIndex(){var m={};DAYS.forEach(function(d){d.items.forEach(function(it){if(it.id)m[it.id]={day:d.day,q:it.x,title:d.title};});});return m;}
function viewJournal(){
  var w=shell('journal');document.title='My Journal \u00b7 '+APP;
  w.appendChild(el('h1',{class:'page-h',text:'My Journal'}));
  w.appendChild(el('p',{class:'lead',text:'Your reflections stay private on this phone. Nothing is sent anywhere. Use Export to keep a copy.'}));
  var j=journal(),idx=qIndex();
  var keys=Object.keys(j).filter(function(k){return idx[k];}).sort(function(a,b){var A=a.split('-').map(Number),B=b.split('-').map(Number);return A[0]-B[0]||A[1]-B[1];});
  w.appendChild(el('div',{class:'row-btns'},[el('button',{class:'btn btn-navy',type:'button',disabled:keys.length?null:'',onclick:function(){exportJ(keys,j,idx);}},['Export journal (.txt)'])]));
  if(!keys.length){w.appendChild(el('p',{class:'empty',text:'No reflections yet. Under each question in a daily reading, tap \u201cWrite my reflection\u201d.'}));return;}
  var byDay={};keys.forEach(function(k){var d=idx[k].day;(byDay[d]=byDay[d]||[]).push(k);});
  Object.keys(byDay).map(Number).sort(function(a,b){return a-b;}).forEach(function(d){
    var card=el('article',{class:'jentry'},[el('h3',null,[el('a',{href:'#/day/'+d,text:'Day '+d+' \u00b7 '+DAYS[d-1].title})])]);
    byDay[d].forEach(function(k){var qn=k.split('-')[1];card.appendChild(el('p',{class:'qq',text:qn+'. '+idx[k].q}));card.appendChild(el('p',{class:'aa',text:j[k].t}));card.appendChild(el('time',{text:new Date(j[k].ts).toLocaleString()}));});
    w.appendChild(card);
  });
}
function exportJ(keys,j,idx){
  var lines=[APP+' \u2014 My Journal','Exported '+new Date().toLocaleString(),''];var last=null;
  keys.forEach(function(k){var d=idx[k].day;if(d!==last){last=d;lines.push('','==== Day '+d+' \u00b7 '+DAYS[d-1].section+' \u00b7 '+DAYS[d-1].title+' ====');}
    lines.push('','Q'+k.split('-')[1]+'. '+idx[k].q,'',j[k].t,'('+new Date(j[k].ts).toLocaleString()+')');});
  var blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
  var a=el('a',{href:URL.createObjectURL(blob),download:'my-big-book-journal-'+new Date().toISOString().slice(0,10)+'.txt'});document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);toast('Journal exported');
}

/* ---------- router ---------- */
function route(){
  var h=location.hash.replace(/^#\/?/,'');var p=h.split('/');
  window.scrollTo(0,0);
  if(!DATA)return;
  if(p[0]==='today')viewDay(cur());
  else if(p[0]==='day')viewDay(parseInt(p[1],10)||1);
  else if(p[0]==='contents')viewContents();
  else if(p[0]==='search')viewSearch(decodeURIComponent(p.slice(1).join('/')||''));
  else if(p[0]==='steps')viewSteps();
  else if(p[0]==='step')viewStep(parseInt(p[1],10)||1);
  else if(p[0]==='readings')viewReadings();
  else if(p[0]==='reading')viewReading(p[1]);
  else if(p[0]==='journal')viewJournal();
  else viewCover();
  if(p[0]&&p[0]!=='')main.focus({preventScroll:true});
}
window.addEventListener('hashchange',route);

/* ---------- settings ---------- */
var setBtn=document.getElementById('btnSettings'),setPanel=document.getElementById('settings');
setBtn.addEventListener('click',function(){setPanel.hidden=!setPanel.hidden;setBtn.setAttribute('aria-expanded',String(!setPanel.hidden));});
document.getElementById('btnHome').addEventListener('click',function(){location.hash='#/';});
function applyFs(v){v=Math.min(1.6,Math.max(0.85,Math.round(v*100)/100));document.documentElement.style.setProperty('--fs',v);try{localStorage.setItem(K.fs,String(v));}catch(e){}document.getElementById('fsVal').textContent=Math.round(v*100)+'%';}
function getFs(){return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs'))||1;}
document.getElementById('fsUp').addEventListener('click',function(){applyFs(getFs()+0.1);});
document.getElementById('fsDown').addEventListener('click',function(){applyFs(getFs()-0.1);});
function applyTh(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem(K.th,t);}catch(e){}
  document.querySelectorAll('[data-th]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.th===t));});
  var m=document.querySelector('meta[name=theme-color]');if(m)m.content='#0f1b30';}
document.querySelectorAll('[data-th]').forEach(function(b){b.addEventListener('click',function(){applyTh(b.dataset.th);});});
(function(){var t=localStorage.getItem(K.th)||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');applyTh(t);document.getElementById('fsVal').textContent=Math.round(getFs()*100)+'%';})();

/* ---------- boot ---------- */
main.appendChild(el('div',{class:'wrap'},[el('p',{class:'empty',text:'Loading\u2026'})]));
fetch('data.json').then(function(r){return r.json();}).then(function(d){DATA=d;DAYS=d.days;READ=d.readings;STEPS=d.steps||[];route();})
 .catch(function(){main.innerHTML='';main.appendChild(el('div',{class:'wrap'},[el('p',{class:'empty',text:'Could not load the readings. Please check your connection and try again.'})]));});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
})();
