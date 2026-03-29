(async function(){
  const box=document.getElementById('guilds');
  if(!box) return;
  try {
    const res=await fetch('/api/guilds');
    const data=await res.json();
    if(!data.guilds||data.guilds.length===0){box.innerHTML='<p>No manageable servers found.</p>';return;}
    box.innerHTML=data.guilds.map(g=>`<div class="card"><h3>${g.name}</h3><p>${g.botPresent?'Bot is in server':'Bot not in server'}</p>${g.botPresent?`<a class="btn" href="/server/${g.id}">Manage</a>`:'<span>Invite bot to this server first.</span>'}</div>`).join('');
  } catch(e){
    box.innerHTML='<p>Failed to load servers.</p>';
  }
})();
