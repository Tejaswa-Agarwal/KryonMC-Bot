(async function(){
  const box = document.getElementById('guilds');
  const totalBox = document.getElementById('stat-total');
  const connectedBox = document.getElementById('stat-connected');
  const pendingBox = document.getElementById('stat-pending');
  if(!box) return;

  try {
    const res = await fetch('/api/guilds');
    const data = await res.json();
    const guilds = data.guilds || [];

    const connected = guilds.filter(g => g.botPresent).length;
    const pending = guilds.length - connected;

    if (totalBox) totalBox.textContent = guilds.length;
    if (connectedBox) connectedBox.textContent = connected;
    if (pendingBox) pendingBox.textContent = pending;

    if(guilds.length===0){
      box.innerHTML='<div class="card"><h3>No servers found</h3><p class="muted">You do not have manageable servers yet.</p></div>';
      return;
    }

    box.className='grid cols-2 fade-in';
    box.innerHTML=guilds.map(g=>`
      <article class="card server-card ${g.botPresent?'connected':'pending'}">
        <div class="server-card-head">
          <h3>${g.name}</h3>
          <span class="pill ${g.botPresent?'ok':''}">${g.botPresent?'Connected':'Invite Needed'}</span>
        </div>
        <p class="muted">${g.botPresent?'Dashboard access is ready. Open settings to configure moderation, automod, and modules.':'Invite Axion first, then return here to configure your server.'}</p>
        <div class="server-card-actions">
          ${g.botPresent?`<a class="btn" href="/server/${g.id}">Open Panel</a>`:'<span class="pill">Not connected yet</span>'}
          <a class="btn ghost" target="_blank" rel="noopener" href="${g.inviteUrl || '#'}">Invite Axion</a>
        </div>
      </article>
    `).join('');
  } catch(e){
    box.innerHTML='<div class="card warning"><h3>Failed to load servers</h3><p class="muted">Try refreshing the page.</p></div>';
  }
})();
