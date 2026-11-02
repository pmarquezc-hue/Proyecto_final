(function(){
var K='campus_red_db_v1', $=function(s){return document.querySelector(s)};
var mem=null;
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function seed(){
  var t=Date.now();
  return {me:null,
   users:[{id:'u1',nombre:'Lucía',apellido:'Méndez',carrera:'Ingeniería en Sistemas',semestre:'5',desc:'Me encanta la programación web.'},
          {id:'u2',nombre:'Andrés',apellido:'Rivera',carrera:'Medicina',semestre:'3',desc:'Estudio anatomía y comparto resúmenes.'},
          {id:'u3',nombre:'Pedro',apellido:'Castillo',carrera:'Arquitectura',semestre:'7',desc:'Diseño, maquetas y café.'}],
   groups:[{id:'g1',nombre:'Ingeniería en Sistemas',tipo:'Carrera',owner:'u1',members:['u1']},
           {id:'g2',nombre:'Cálculo I',tipo:'Curso',owner:'u2',members:['u2','u3']}],
   posts:[{id:'p1',uid:'u1',tipo:'info',texto:'Comparto la guía de estudio de Estructuras de Datos para el parcial. ¡Mucho éxito!',gid:null,ts:t-7200000},
          {id:'p2',uid:'u2',tipo:'duda',texto:'¿Alguien sabe cómo resolver límites con la regla de L’Hôpital? No entiendo cuándo aplicarla.',gid:null,ts:t-3600000},
          {id:'p3',uid:'u3',tipo:'texto',texto:'Hoy abrieron la exposición de maquetas en el edificio de Arquitectura. Pasen a verla.',gid:null,ts:t-1800000}],
   comments:[{id:'c1',pid:'p2',uid:'u1',texto:'Se aplica cuando el límite da una forma indeterminada como 0/0.',ts:t-1500000}],
   likes:[{pid:'p1',uid:'u2'},{pid:'p1',uid:'u3'},{pid:'p2',uid:'u1'}],
   log:[]};
}
function load(){try{var r=localStorage.getItem(K);if(r)return JSON.parse(r)}catch(e){}return mem}
var D=load()||seed();
function save(){mem=D;try{localStorage.setItem(K,JSON.stringify(D))}catch(e){}}
function log(tipo,detalle){D.log.push({id:uid(),ts:Date.now(),uid:D.me,tipo:tipo,detalle:detalle});save()}
function user(id){return D.users.filter(function(u){return u.id===id})[0]}
function me(){return user(D.me)}
function fmt(ts){return new Date(ts).toLocaleString('es-GT',{dateStyle:'medium',timeStyle:'short'})}
function show(n){['welcome','register','login','summary','app'].forEach(function(v){$('#v-'+v).classList.toggle('hidden',v!==n)});window.scrollTo(0,0)}

/* bienvenida / registro */
var sem=$('select[name=semestre]');for(var i=1;i<=12;i++){var o=document.createElement('option');o.value=i;o.textContent='Semestre '+i;sem.appendChild(o)}
function initWelcome(){var m=me();var b=$('#go-cont');if(m){b.textContent='Continuar como '+m.nombre;b.classList.remove('hidden')}else b.classList.add('hidden')}
$('#go-reg').onclick=function(){show('register')};
$('#reg-back').onclick=function(){show('welcome')};
$('#go-cont').onclick=function(){show('app');go('inicio')};
$('#f-reg').onsubmit=async function(e){
  e.preventDefault();var f=new FormData(e.target),u={id:'u'+uid()},err=$('#reg-err');
  ['nombre','apellido','correo','carrera','semestre','desc'].forEach(function(k){u[k]=String(f.get(k)).trim()});
  u.correo=u.correo.toLowerCase();
  if(String(f.get('pass'))!==String(f.get('pass2'))){err.textContent='Las contraseñas no coinciden.';return}
  if(D.users.some(function(x){return x.correo===u.correo})){err.textContent='Ese correo ya tiene una cuenta. Inicia sesión.';return}
  err.textContent='';u.salt=uid();u.alg=hasSubtle()?'s':'f';u.pass=await hp(String(f.get('pass')),u.salt,u.alg);
  D.users.push(u);D.me=u.id;
  var g=D.groups.filter(function(x){return x.tipo==='Carrera'&&x.nombre.toLowerCase()===u.carrera.toLowerCase()})[0];
  if(g)g.members.push(u.id);
  log('registro','Creó su perfil ('+u.carrera+')');
  e.target.reset();renderSummary();show('summary');
};
function renderSummary(){
  var u=me();if(!u)return;
  $('#sum-data').innerHTML=[['Nombre',u.nombre+' '+u.apellido],['Correo',u.correo||'—'],['Carrera',u.carrera],['Semestre',u.semestre],['Descripción',u.desc]].map(function(r){return '<dt>'+r[0]+'</dt><dd>'+esc(r[1])+'</dd>'}).join('');
}
$('#enter').onclick=function(){log('inicio de sesión','Entró a la red social');show('app');go('inicio')};
$('#exit').onclick=function(){log('cierre de sesión','Cerró su sesión');D.me=null;save();initWelcome();show('welcome')};

/* inicio de sesión */
function hasSubtle(){return !!(window.crypto&&crypto.subtle&&window.TextEncoder)}
async function hp(p,salt,alg){
  if(alg==='s'){var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+p));return Array.prototype.map.call(new Uint8Array(b),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
  var h=5381,s=salt+p;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'f'+h}
$('#go-login').onclick=function(){$('#login-err').textContent='';show('login')};
$('#login-back').onclick=function(){show('welcome')};
$('#to-reg').onclick=function(){show('register')};
$('#f-login').onsubmit=async function(e){
  e.preventDefault();var form=e.target,f=new FormData(form),c=String(f.get('correo')).trim().toLowerCase(),err=$('#login-err');
  var u=D.users.filter(function(x){return x.correo===c})[0];
  if(!u||!u.pass){err.textContent='No encontramos una cuenta con ese correo. Crea tu perfil para registrarte.';return}
  var h=await hp(String(f.get('pass')),u.salt,u.alg);
  if(h!==u.pass){err.textContent='Contraseña incorrecta. Inténtalo de nuevo.';return}
  err.textContent='';D.me=u.id;log('inicio de sesión','Inició sesión con su cuenta');form.reset();show('app');go('inicio')};

/* app */
var tab='inicio',grp=null,filt='todo',openC={},hist={filtro:'todos',gen:false};
var TIPOS={texto:'Texto',duda:'Duda',info:'Información académica'};
function go(t,g){tab=t;grp=g||null;filt='todo';hist.gen=false;
  document.querySelectorAll('.tab').forEach(function(b){b.setAttribute('aria-current',String(b.dataset.tab===t))});
  side();render()}
document.querySelectorAll('.tab').forEach(function(b){b.onclick=function(){go(b.dataset.tab)}});
function side(){var u=me();$('#side').innerHTML='<div class="post"><div class="meta"><span class="avatar">'+esc(u.nombre[0])+'</span><div><b>'+esc(u.nombre+' '+u.apellido)+'</b><small>'+esc(u.carrera)+' · Sem. '+esc(u.semestre)+'</small></div></div><p style="color:var(--mut)">'+esc(u.desc)+'</p></div>'}
function render(){
  if(tab==='inicio')$('#main').innerHTML=feed(null);
  else if(tab==='grupos')$('#main').innerHTML=grp?feed(grp):groups();
  else if(tab==='datos')$('#main').innerHTML=dbview();
  else $('#main').innerHTML=history();
}
function feed(gid){
  var u=me(),g=gid&&D.groups.filter(function(x){return x.id===gid})[0],canPost=!g||g.members.indexOf(u.id)>-1;
  var h='';
  if(g)h+='<p><button class="btn ghost sm" data-a="back">← Todos los grupos</button></p><h2 style="margin-bottom:4px">'+esc(g.nombre)+'</h2><p style="color:var(--mut);margin:0 0 12px">'+g.tipo+' · '+g.members.length+' miembro(s)</p>';
  if(canPost)h+='<form class="card" id="f-post" style="margin-bottom:14px;max-width:none"><label>¿Qué quieres compartir?<textarea name="texto" required maxlength="600" placeholder="Escribe tu publicación, duda o información académica"></textarea></label><div class="bar" style="margin:0"><select name="tipo" aria-label="Tipo de publicación"><option value="texto">Texto</option><option value="duda">Duda</option><option value="info">Información académica</option></select><button class="btn" type="submit">Publicar</button></div></form>';
  else h+='<div class="card" style="margin-bottom:14px">Únete al grupo para publicar.</div>';
  h+='<div class="chips" role="group" aria-label="Filtrar">'+['todo','texto','duda','info'].map(function(k){return '<button class="chip" data-a="filt" data-k="'+k+'" aria-pressed="'+(filt===k)+'">'+(k==='todo'?'Todo':TIPOS[k])+'</button>'}).join('')+'</div>';
  var ps=D.posts.filter(function(p){return (p.gid||null)===gid&&(filt==='todo'||p.tipo===filt)}).sort(function(a,b){return b.ts-a.ts});
  h+='<div class="feed">'+(ps.length?ps.map(postHTML).join(''):'<div class="empty">Aún no hay publicaciones. Sé el primero en escribir.</div>')+'</div>';
  return h;
}
function postHTML(p){
  var a=user(p.uid)||{nombre:'?',apellido:'',carrera:''},u=me();
  var likes=D.likes.filter(function(l){return l.pid===p.id}),liked=likes.some(function(l){return l.uid===u.id});
  var cs=D.comments.filter(function(c){return c.pid===p.id}).sort(function(x,y){return x.ts-y.ts});
  var h='<article class="card post" data-id="'+p.id+'"><div class="meta"><span class="avatar">'+esc(a.nombre[0])+'</span><div><b>'+esc(a.nombre+' '+a.apellido)+'</b><small>'+esc(a.carrera)+' · '+fmt(p.ts)+'</small></div><span class="tag '+p.tipo+'">'+TIPOS[p.tipo]+'</span></div><p>'+esc(p.texto)+'</p>';
  h+='<div class="acts"><button data-a="like" class="'+(liked?'on':'')+'" aria-pressed="'+liked+'">Me gusta · '+likes.length+'</button><button data-a="cm">Comentarios · '+cs.length+'</button>'+(p.uid===u.id?'<button class="del" data-a="del">Eliminar</button>':'')+'</div>';
  if(openC[p.id])h+='<div class="cms">'+cs.map(function(c){var w=user(c.uid)||{nombre:'?'};return '<div class="cm"><b>'+esc(w.nombre)+'</b> <small>'+fmt(c.ts)+'</small><br>'+esc(c.texto)+'</div>'}).join('')+'<div class="cmf"><input aria-label="Escribe un comentario" maxlength="300" placeholder="Escribe un comentario"><button class="btn sm" data-a="send">Comentar</button></div></div>';
  return h+'</article>';
}
function groups(){
  var u=me();
  var h='<h2 style="margin-bottom:12px">Grupos</h2><form class="card" id="f-grp" style="margin-bottom:14px;max-width:none"><div class="row"><label>Nombre del grupo<input name="nombre" required maxlength="50" placeholder="Ej. Física II"></label><label>Tipo<select name="tipo"><option>Curso</option><option>Carrera</option></select></label></div><div><button class="btn" type="submit">Crear grupo</button></div></form><div class="feed">';
  h+=D.groups.map(function(g){var m=g.members.indexOf(u.id)>-1;return '<div class="card grp" data-g="'+g.id+'"><div><b>'+esc(g.nombre)+'</b><br><small>'+g.tipo+' · '+g.members.length+' miembro(s)</small></div><div><button class="btn ghost sm" data-a="open">Abrir</button> <button class="btn sm" data-a="join">'+(m?'Salir del grupo':'Unirme')+'</button></div></div>'}).join('')+'</div>';
  return h;
}
function mine(){return D.log.filter(function(l){return l.uid===D.me}).sort(function(a,b){return b.ts-a.ts})}
function history(){
  var all=mine(),tipos=[];all.forEach(function(l){if(tipos.indexOf(l.tipo)<0)tipos.push(l.tipo)});
  var h='<h2 style="margin-bottom:12px">Historial de interacciones</h2><div class="bar noprint"><button class="btn" data-a="gen">Generar historial</button>';
  if(hist.gen)h+='<select id="hf" aria-label="Filtrar por tipo"><option value="todos">Todos los tipos</option>'+tipos.map(function(t){return '<option'+(hist.filtro===t?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select><button class="btn ghost sm" data-a="print">Imprimir</button>';
  h+='</div>';
  if(!hist.gen)return h+'<div class="card empty">Pulsa “Generar historial” para ver el resumen y el detalle de tus interacciones.</div>';
  var list=hist.filtro==='todos'?all:all.filter(function(l){return l.tipo===hist.filtro});
  var cnt={};all.forEach(function(l){cnt[l.tipo]=(cnt[l.tipo]||0)+1});
  var u=me();
  h+='<div class="card"><b>'+esc(u.nombre+' '+u.apellido)+'</b> <small style="color:var(--mut)">· generado el '+fmt(Date.now())+'</small><div class="stats"><div><b>'+all.length+'</b>interacciones</div>'+Object.keys(cnt).map(function(k){return '<div><b>'+cnt[k]+'</b>'+esc(k)+'</div>'}).join('')+'</div>';
  h+=list.length?'<div class="scroll"><table><thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>'+list.map(function(l){return '<tr><td>'+fmt(l.ts)+'</td><td>'+esc(l.tipo)+'</td><td>'+esc(l.detalle)+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">No hay interacciones de este tipo.</div>';
  var csv='fecha,accion,detalle\n'+list.map(function(l){return [new Date(l.ts).toISOString(),l.tipo,l.detalle].map(function(x){return '"'+String(x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  h+='<label class="noprint" style="margin-top:14px">Datos en formato CSV (copia y pega en una hoja de cálculo)<textarea readonly>'+esc(csv)+'</textarea></label></div>';
  return h;
}
function tbl(name,rows){
  var t='<h3 style="margin:18px 0 8px">'+name+' ('+rows.length+')</h3>';
  if(!rows.length)return t+'<div class="empty card">Sin registros</div>';
  var cols=[];rows.forEach(function(r){Object.keys(r).forEach(function(k){if(cols.indexOf(k)<0&&k!=='salt'&&k!=='alg')cols.push(k)})});
  return t+'<div class="card scroll"><table><thead><tr>'+cols.map(function(k){return '<th>'+esc(k)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+cols.map(function(k){var v=r[k];if(v===undefined||v===null)v='';else if(k==='ts')v=fmt(v);else if(k==='pass')v='(hash)';else if(Array.isArray(v))v=v.join(', ');return '<td>'+esc(v)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
}
function dbview(){
  var bytes=JSON.stringify(D).length;
  return '<h2 style="margin-bottom:8px">Base de datos</h2><p style="color:var(--mut);margin:0">Almacenamiento: localStorage del navegador · clave <b>'+K+'</b> · '+bytes+' caracteres</p>'
   +tbl('users',D.users)+tbl('groups',D.groups)+tbl('posts',D.posts)+tbl('comments',D.comments)+tbl('likes',D.likes)+tbl('log',D.log);
}
function snip(t){return t.length>60?t.slice(0,60)+'…':t}
document.addEventListener('submit',function(e){
  var u=me();
  if(e.target.id==='f-post'){e.preventDefault();var f=new FormData(e.target),g=grp&&tab==='grupos'?grp:null;
    var p={id:'p'+uid(),uid:u.id,tipo:f.get('tipo'),texto:String(f.get('texto')).trim(),gid:g,ts:Date.now()};
    D.posts.push(p);log('publicó '+TIPOS[p.tipo].toLowerCase(),'“'+snip(p.texto)+'”'+(g?' en un grupo':''));render()}
  if(e.target.id==='f-grp'){e.preventDefault();var f2=new FormData(e.target);
    var n={id:'g'+uid(),nombre:String(f2.get('nombre')).trim(),tipo:f2.get('tipo'),owner:u.id,members:[u.id]};
    D.groups.push(n);log('creó un grupo',n.nombre);render()}
});
document.addEventListener('change',function(e){if(e.target.id==='hf'){hist.filtro=e.target.value;render()}});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,u=me();
  var art=b.closest('.post[data-id]'),p=art&&D.posts.filter(function(x){return x.id===art.dataset.id})[0];
  if(a==='filt'){filt=b.dataset.k;render()}
  else if(a==='back'){go('grupos')}
  else if(a==='open'){go('grupos',b.closest('[data-g]').dataset.g)}
  else if(a==='join'){var g=D.groups.filter(function(x){return x.id===b.closest('[data-g]').dataset.g})[0],i=g.members.indexOf(u.id);
    if(i>-1){g.members.splice(i,1);log('salió de un grupo',g.nombre)}else{g.members.push(u.id);log('se unió a un grupo',g.nombre)}render()}
  else if(a==='like'&&p){var i2=-1;D.likes.forEach(function(l,k){if(l.pid===p.id&&l.uid===u.id)i2=k});
    if(i2>-1){D.likes.splice(i2,1);log('quitó Me gusta','“'+snip(p.texto)+'”')}else{D.likes.push({pid:p.id,uid:u.id});log('dio Me gusta','“'+snip(p.texto)+'”')}render()}
  else if(a==='cm'&&p){openC[p.id]=!openC[p.id];render()}
  else if(a==='send'&&p){var inp=art.querySelector('.cmf input'),t=inp.value.trim();if(!t)return;
    D.comments.push({id:'c'+uid(),pid:p.id,uid:u.id,texto:t,ts:Date.now()});log('comentó','“'+snip(t)+'” en “'+snip(p.texto)+'”');render()}
  else if(a==='del'&&p&&p.uid===u.id){if(!confirm('¿Eliminar esta publicación? No se puede deshacer.'))return;
    D.posts=D.posts.filter(function(x){return x.id!==p.id});D.comments=D.comments.filter(function(c){return c.pid!==p.id});D.likes=D.likes.filter(function(l){return l.pid!==p.id});
    log('eliminó una publicación','“'+snip(p.texto)+'”');render()}
  else if(a==='gen'){hist.gen=true;hist.filtro='todos';log('generó historial','Consultó su historial');render()}
  else if(a==='print'){try{window.print()}catch(x){}}
});
initWelcome();
})();
