
 

const EDIT_PASSPHRASE = "craftthriller2026";
let editMode = false;
let typed = "";

// ================================
// LOAD SAVED DATA
// ================================
let artworks = [
  // Example placeholder (replace via drag & drop)
  { title: "New Artwork", type: "image", src: "", story: "Write the story behind this artwork..." }
];

// Load saved artworks
const saved = localStorage.getItem("craftThrillerContent");
if(saved) artworks = JSON.parse(saved);

// Load saved logo
const savedLogo = localStorage.getItem("craftThrillerLogo");
if(savedLogo){
  const logoImg = document.getElementById("logo-img");
  if(logoImg) logoImg.src = savedLogo;
}

// Load saved banner
const savedBanner = localStorage.getItem("craftThrillerBanner");
if(savedBanner){
  const bannerImg = document.getElementById("banner-img");
  if(bannerImg) bannerImg.src = savedBanner;
}

// Load saved background
const savedBg = localStorage.getItem("craftThrillerBackground");
if(savedBg){
  document.body.style.backgroundImage = `url(${savedBg})`;
}

// ================================
// DISPLAY ARTWORKS
// ================================
const gallery = document.getElementById("gallery");

function displayArtworks() {
  gallery.innerHTML = "";
  artworks.forEach((art, index) => {
    const card = document.createElement("div");
    card.className = "art-card";

    let mediaHTML = "";
    if (art.type === "video") {
      mediaHTML = `
        <video
          src="${art.src}"
          poster="${art.poster || ''}"
          muted
          playsinline
          preload="metadata"
          data-index="${index}"
        ></video>
      `;
    } else {
      mediaHTML = `<img src="${art.src}" draggable="false" data-index="${index}">`;
    }

    card.innerHTML = `
      ${mediaHTML}
      <div class="art-content">
        <h3 contenteditable="${editMode}">${art.title}</h3>
        <p contenteditable="${editMode}">${art.story}</p>
      </div>
    `;

    gallery.appendChild(card);

    // Attach video observer
    const video = card.querySelector("video");
    if (video) videoObserver.observe(video);
  });
}

// Initial display
displayArtworks();

// ================================
// EDIT MODE UNLOCK (KEYBOARD)
// ================================
document.addEventListener("keydown", (e) => {
  typed += e.key.toLowerCase();
  if (typed.includes(EDIT_PASSPHRASE)) {
    enableEditMode();
    typed = "";
  }
  if (typed.length > 40) typed = "";
});

// ================================
// EDIT MODE UNLOCK (MOBILE GESTURE)
// ================================
let tapCount = 0;
let tapTimer = null;

document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  if (touch.clientX < 60 && touch.clientY < 60) {
    tapCount++;
    if (!tapTimer) tapTimer = setTimeout(() => { tapCount=0; tapTimer=null; }, 3000);
    if (tapCount===5) { enableEditMode(); tapCount=0; clearTimeout(tapTimer); tapTimer=null; }
  }
});

function enableEditMode() {
  editMode = true;
  document.body.classList.add("edit-mode");
  alert("Edit Mode Enabled — The Craft Thriller");
  displayArtworks();
}

// ================================
// VIDEO AUTOPLAY ON SCROLL
// ================================
const videoObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const video = entry.target;
    if(entry.isIntersecting && entry.intersectionRatio>0.6) video.play().catch(()=>{});
    else video.pause();
  });
},{threshold:[0.6]});

// ================================
// DRAG & DROP MEDIA / LOGO / BANNER / BACKGROUND
// ================================
document.addEventListener("dragover", e => { if(editMode) e.preventDefault(); });

document.addEventListener("drop", e => {
  if(!editMode) return;
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const target = e.target;

    // Logo replacement
    if(target.id === "logo-img") {
      target.src = reader.result;
      localStorage.setItem("craftThrillerLogo", reader.result);
      return;
    }

    // Banner replacement
    if(target.id === "banner-img") {
      target.src = reader.result;
      localStorage.setItem("craftThrillerBanner", reader.result);
      return;
    }

    // Background replacement
    if(target.id === "body-bg" || target === document.body) {
      document.body.style.backgroundImage = `url(${reader.result})`;
      localStorage.setItem("craftThrillerBackground", reader.result);
      return;
    }

    // Artwork replacement
    const media = target.closest("img, video");
    if(!media) return;

    const index = media.dataset.index;
    if(file.type.startsWith("video/")) {
      artworks[index].type = "video";
      artworks[index].src = reader.result;
      artworks[index].poster = "";
      media.replaceWith(createVideoElement(reader.result, index));
    } else if(file.type.startsWith("image/")) {
      artworks[index].type = "image";
      artworks[index].src = reader.result;
      media.src = reader.result;
    }

    localStorage.setItem("craftThrillerContent", JSON.stringify(artworks));
  };

  reader.readAsDataURL(file);
});

function createVideoElement(src, index){
  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.dataset.index = index;
  video.controls = true;
  video.preload = "metadata";
  videoObserver.observe(video);
  return video;
}

// ================================
// SAVE / VERSION HISTORY / EXPORT / NEW ARTWORK
// ================================
document.addEventListener("keydown", e => {
  if(!editMode) return;

  if(e.ctrlKey && e.key==="s"){ e.preventDefault(); saveEdits(); }
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="e"){ exportContent(); }
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="r"){ restoreLastVersion(); }
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==="n"){ createNewArtwork(); }
});

function saveEdits(){
  const snapshot = {timestamp: new Date().toISOString(), artworks: JSON.parse(JSON.stringify(artworks))};
  const history = JSON.parse(localStorage.getItem("craftThrillerHistory"))||[];
  history.push(snapshot);
  if(history.length>10) history.shift();
  localStorage.setItem("craftThrillerHistory", JSON.stringify(history));
  localStorage.setItem("craftThrillerContent", JSON.stringify(artworks));
  alert("Saved. Version snapshot created.");
}

function restoreLastVersion(){
  const history = JSON.parse(localStorage.getItem("craftThrillerHistory"))||[];
  if(history.length<2){ alert("No previous version available."); return; }
  history.pop(); const previous = history[history.length-1];
  artworks = previous.artworks;
  localStorage.setItem("craftThrillerHistory", JSON.stringify(history));
  localStorage.setItem("craftThrillerContent", JSON.stringify(artworks));
  displayArtworks();
  alert("Previous version restored.");
}

function createNewArtwork(){
  const newArt = {title:"New Artwork Title", type:"image", src:"", story:"Write the story behind this artwork..."};
  artworks.push(newArt);
  localStorage.setItem("craftThrillerContent", JSON.stringify(artworks));
  displayArtworks();
  alert("New artwork created. Edit text and drop an image/video.");
}

function exportContent(){
  const data = {brand:"The Craft Thriller", exportedAt: new Date().toISOString(), artworks};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="the-craft-thriller-content.json"; a.click();
  URL.revokeObjectURL(url);
}
