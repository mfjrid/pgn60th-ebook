const videos = [
    {
        normal: 'stream.php?file=slide1.mp4',
        reverse: 'stream.php?file=slide1.mp4'
    },
    {
        normal: 'stream.php?file=slide2.mp4',
        reverse: 'stream.php?file=slide2_reverse.mp4'
    },
    {
        normal: 'stream.php?file=slide3.mp4',
        reverse: 'stream.php?file=slide3_reverse.mp4'
    },
    {
        normal: 'stream.php?file=slide4.mp4',
        reverse: 'stream.php?file=slide4_reverse.mp4'
    }
];

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