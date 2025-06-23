const videos = Array.from({ length: 91 }, (_, i) => {
    const slideNum = i + 1;
    return {
        normal: `stream.php?file=slide-${slideNum}.mp4`,
        reverse: `stream.php?file=slide_reverse-${slideNum}.mp4`
    };
});

let currentIndex = 0;
let showingA = true;
const videoA = document.getElementById('videoA');
const videoB = document.getElementById('videoB');
const videoContainer = document.getElementById('video-container');
const leftClickArea = document.querySelector('.left-click-area');
const rightClickArea = document.querySelector('.right-click-area');

// Tambahan proteksi
Object.defineProperty(document, 'oncontextmenu', {
    get() { return null; },
    set() { }
});

Object.defineProperty(document, 'onkeydown', {
    get() { return null; },
    set() { }
});

function loadVideo(index, isReverse = false) {
    const currentVideo = showingA ? videoA : videoB;
    const nextVideo = showingA ? videoB : videoA;

    nextVideo.src = isReverse ? videos[index].reverse : videos[index].normal;
    nextVideo.load();

    nextVideo.onloadeddata = () => {
        nextVideo.classList.remove('hidden');
        nextVideo.play();
        currentVideo.classList.add('hidden');
        showingA = !showingA;
    };
}

function goPrev() {
    if (currentIndex > 0) {
        loadVideo(currentIndex, true);
        currentIndex--;
    }
}

function goNext() {
    if (currentIndex < videos.length - 1) {
        currentIndex++;
        loadVideo(currentIndex, false);
    }
}

// Inisialisasi pertama
videoA.src = videos[currentIndex].normal;
videoA.onloadeddata = () => videoA.play();

// Variabel untuk swipe/drag
let startX = 0;
let isSwiping = false;
let isClick = true;
const SWIPE_THRESHOLD = 50;
const CLICK_THRESHOLD = 5;

// Fungsi untuk menangani akhir swipe/click
function handleEnd(x) {
    const deltaX = x - startX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        isClick = false;
        if (deltaX < 0) {
            goNext();
        } else {
            goPrev();
        }
    }

    // Reset status
    setTimeout(() => {
        isSwiping = false;
        isClick = true;
    }, 100);
}

// Event untuk touch devices
videoContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    isClick = true;
});

videoContainer.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    if (Math.abs(e.touches[0].clientX - startX) > CLICK_THRESHOLD) {
        isClick = false;
    }
    e.preventDefault();
});

videoContainer.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    handleEnd(e.changedTouches[0].clientX);
});

// Event untuk mouse
videoContainer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isSwiping = true;
    isClick = true;
});

videoContainer.addEventListener('mousemove', (e) => {
    if (!isSwiping) return;
    if (Math.abs(e.clientX - startX) > CLICK_THRESHOLD) {
        isClick = false;
    }
    e.preventDefault();
});

videoContainer.addEventListener('mouseup', (e) => {
    if (!isSwiping) return;
    handleEnd(e.clientX);
});

videoContainer.addEventListener('mouseleave', () => {
    isSwiping = false;
});

// Klik area untuk navigasi
leftClickArea.addEventListener('click', (e) => {
    if (isClick) goPrev();
});

rightClickArea.addEventListener('click', (e) => {
    if (isClick) goNext();
});

// Proteksi tambahan terhadap pengguna yang mencoba mengubah kode JavaScript
(function () {
    'use strict';

    // Cegah pengguna mengubah fungsi-fungsi penting
    Object.freeze(loadVideo);
    Object.freeze(goPrev);
    Object.freeze(goNext);

    // Cegah pengguna mengubah array videos
    Object.freeze(videos);
    for (let i = 0; i < videos.length; i++) {
        Object.freeze(videos[i]);
    }
})();


// Fungsi untuk masuk ke fullscreen
function enterFullscreen() {
    const element = document.documentElement;

    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }
}

// Masuk ke fullscreen saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    enterFullscreen();
});

// Juga coba masuk fullscreen saat ada interaksi pengguna (beberapa browser memblokir fullscreen otomatis)
videoContainer.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        enterFullscreen();
    }
});

// Tangani perubahan status fullscreen
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        enterFullscreen();
    }
});

// Cek dukungan fullscreen
function isFullscreenSupported() {
    return document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled;
}

if (!isFullscreenSupported()) {
    console.warn('Fullscreen tidak didukung oleh browser ini');
    // Atur ukuran video ke ukuran layar
    videoA.style.width = '100vw';
    videoA.style.height = '100vh';
    videoB.style.width = '100vw';
    videoB.style.height = '100vh';
}