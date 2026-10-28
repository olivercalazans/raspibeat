const libEl = document.getElementById('library');

async function loadLibrary() {
  const res = await fetch('/api/library');
  const tracks = await res.json();

  libEl.innerHTML = '';

  if (tracks.length === 0) {
    libEl.innerHTML = '<li class="empty">No music found in ./music/</li>';
    return;
  }

  tracks.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.name;
    libEl.appendChild(li);
  });
}

loadLibrary();