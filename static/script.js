const libraryEl = document.getElementById('library');
const audioPlayer = document.getElementById('player');

let tracks = [];
let currentIndex = -1;


// Fetch the track list from the backend
async function loadLibrary() {
  try {
    const response = await fetch('/api/library');
    tracks = await response.json();
    renderLibrary();
  } catch (error) {
    console.error("Failed to load library:", error);
    libraryEl.innerHTML = '<li class="empty">Error loading library.</li>';
  }
}


// Render the track list in the DOM
function renderLibrary() {
  libraryEl.innerHTML = '';
  
  if (tracks.length === 0) {
    libraryEl.innerHTML = '<li class="empty">No tracks found.</li>';
    return;
  }
  
  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track.name;
    
    // Pass the track index to the play function
    li.addEventListener('click', () => playTrack(index));
    
    libraryEl.appendChild(li);
  });
}



// Play a track by its index in the array
function playTrack(index) {
  // Validate the index bounds
  if (index < 0 || index >= tracks.length) {
    return; 
  }

  currentIndex = index;
  const track = tracks[index];

  // Update UI highlighting
  const items = libraryEl.querySelectorAll('li');
  items.forEach((el, i) => {
    el.classList.toggle('playing', i === index);
  });

  // Load and play the audio
  audioPlayer.src = '/stream?file=' + encodeURIComponent(track.file);
  audioPlayer.play().catch(error => {
    console.error("Playback error:", error);
  });

  // Update the Media Session API metadata and state
  updateMediaSession(track);
}


// Listen for the 'ended' event to automatically play the next track
audioPlayer.addEventListener('ended', () => {
  const nextIndex = currentIndex + 1;
  
  if (nextIndex < tracks.length) {
    playTrack(nextIndex);
  } else {
    // If it was the last track, clear the visual state
    console.log("End of playlist.");
    libraryEl.querySelectorAll('li').forEach(el => el.classList.remove('playing'));
    currentIndex = -1;
    
    // Update Media Session state to none
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }
});



// Setup Media Session API for background play and lock screen controls
function updateMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: 'RaspiBeat',
      album: 'Local Library'
    });

    navigator.mediaSession.playbackState = 'playing';

    // Connect lock screen buttons to player actions
    navigator.mediaSession.setActionHandler('play', () => {
      audioPlayer.play();
      navigator.mediaSession.playbackState = 'playing';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioPlayer.pause();
      navigator.mediaSession.playbackState = 'paused';
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < tracks.length) {
        playTrack(nextIndex);
      }
    });
    
    // Optional: Add previous track handler
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        playTrack(prevIndex);
      } else {
        // If it's the first track, just restart it
        audioPlayer.currentTime = 0;
      }
    });
  }
}


// Initialize the app
loadLibrary();