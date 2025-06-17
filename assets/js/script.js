const videos = [
    {
        normal: 'assets/videos/slide1.mp4',
        reverse: 'assets/videos/slide1.mp4'
    },
    {
        normal: 'assets/videos/slide2.mp4',
        reverse: 'assets/videos/slide2_reverse.mp4'
    },
    {
        normal: 'assets/videos/slide3.mp4',
        reverse: 'assets/videos/slide3_reverse.mp4'
    },
    {
        normal: 'assets/videos/slide4.mp4',
        reverse: 'assets/videos/slide4_reverse.mp4'
    }
];

let currentIndex = 0;
let showingA = true;
const videoA = document.getElementById('videoA');
const videoB = document.getElementById('videoB');
const videoContainer = document.getElementById('video-container');

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
        loadVideo(currentIndex, false); // Putar normal video berikutnya
    }
}

// Inisialisasi pertama
videoA.src = videos[currentIndex].normal;
videoA.onloadeddata = () => videoA.play();

// Swipe gesture
let startX = 0;
let isSwiping = false;

videoContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
});

videoContainer.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    e.preventDefault();
});

videoContainer.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
            goNext();
        } else {
            goPrev();
        }
    }
});