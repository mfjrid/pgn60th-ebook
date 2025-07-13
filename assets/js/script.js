// Anti Inspect Element
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('keydown', function (e) {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        alert('Akses dilarang');
    }
});

// Preloader functionality
window.addEventListener('load', function () {
    setTimeout(function () {
        const preloader = document.getElementById('preloader');
        preloader.style.opacity = '0';
        preloader.style.transition = 'opacity 0.5s ease';

        setTimeout(function () {
            preloader.style.display = 'none';
        }, 500);
    }, 2000);
});

// IndexedDB Cache Manager
class VideoCacheManager {
    constructor() {
        this.dbName = 'PGNFlipbookCache';
        this.dbVersion = 1;
        this.storeName = 'videos';
        this.db = null;
        this.cacheStatus = document.getElementById('cache-status');
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                this.updateCacheStatus('Cache: Error');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                this.updateCacheStatus('Cache: Ready');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('url', 'url', { unique: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async getCachedVideo(url) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(this.generateId(url));

            request.onsuccess = () => {
                if (request.result) {
                    // console.log('Video found in cache:', url);
                    resolve(request.result.blob);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Error getting cached slide:', request.error);
                resolve(null);
            };
        });
    }

    async cacheVideo(url, blob) {
        if (!this.db) return false;

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const videoData = {
                id: this.generateId(url),
                url: url,
                blob: blob,
                timestamp: Date.now(),
                size: blob.size
            };

            const request = store.put(videoData);

            request.onsuccess = () => {
                // console.log('Slide cached successfully:', url);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error caching video:', request.error);
                resolve(false);
            };
        });
    }

    async clearCache() {
        if (!this.db) return false;

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('Cache cleared successfully');
                this.updateCacheStatus('Cache: Cleared');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error clearing cache:', request.error);
                resolve(false);
            };
        });
    }

    async getCacheSize() {
        if (!this.db) return 0;

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const totalSize = request.result.reduce((size, item) => size + (item.size || 0), 0);
                resolve(totalSize);
            };

            request.onerror = () => {
                resolve(0);
            };
        });
    }

    generateId(url) {
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
    }

    updateCacheStatus(status, isCached = false, isDownloading = false) {
        this.cacheStatus.textContent = status;
        this.cacheStatus.className = 'cache-status';

        if (isCached) {
            this.cacheStatus.classList.add('cached');
        } else if (isDownloading) {
            this.cacheStatus.classList.add('downloading');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize cache manager
const cacheManager = new VideoCacheManager();

const videos = Array.from({ length: 91 }, (_, i) => {
    const slideNum = i + 1;
    return {
        normal: `stream.php?file=slide-${slideNum}.mp4`,
        reverse: `stream.php?file=slide_reverse-${slideNum}.mp4`
    };
});

let currentIndex = 0;
let showingA = true;
let zoomLevel = 1;
let controlsTimeout;
let isLoading = false;

const videoA = document.getElementById('videoA');
const videoB = document.getElementById('videoB');
const videoContainer = document.getElementById('video-container');
const leftClickArea = document.querySelector('.left-click-area');
const rightClickArea = document.querySelector('.right-click-area');
const controls = document.getElementById('controls');
const zoomControls = document.getElementById('zoom-controls');
const pageIndicator = document.getElementById('page-indicator');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// Buttons
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const resetPositionBtn = document.getElementById('reset-position');
const dragIndicator = document.getElementById('drag-indicator');

// Enhanced video loading with cache
async function loadVideoWithCache(url) {
    try {
        // First, try to get from cache
        const cachedBlob = await cacheManager.getCachedVideo(url);

        if (cachedBlob) {
            cacheManager.updateCacheStatus('From Cache', true);
            return URL.createObjectURL(cachedBlob);
        }

        // If not in cache, download and cache it
        cacheManager.updateCacheStatus('Downloading...', false, true);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();

        // Cache the video
        await cacheManager.cacheVideo(url, blob);
        cacheManager.updateCacheStatus('Downloaded & Cached', true);

        return URL.createObjectURL(blob);

    } catch (error) {
        console.error('Error loading video:', error);
        cacheManager.updateCacheStatus('Download Error');
        throw error;
    }
}

// Loading functions
function showLoading(direction = '') {
    if (isLoading) return;

    isLoading = true;
    // loadingOverlay.classList.add('show');
    // pageIndicator.classList.add('loading');

    // Update loading text based on direction
    if (direction === 'prev') {
        // loadingText.textContent = 'Memuat halaman sebelumnya...';
    } else if (direction === 'next') {
        // loadingText.textContent = 'Memuat halaman selanjutnya...';
    } else {
        // loadingText.textContent = 'Memuat ebook...';
    }

    // Disable all interactive elements
    disableControls();

    // Start progress animation
    animateProgress();
}

function hideLoading() {
    isLoading = false;
    loadingOverlay.classList.remove('show');
    pageIndicator.classList.remove('loading');
    loadingProgressBar.style.width = '0%';

    // Re-enable controls
    enableControls();
}

function disableControls() {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    prevBtn.classList.add('loading');
    nextBtn.classList.add('loading');
    leftClickArea.classList.add('disabled');
    rightClickArea.classList.add('disabled');
}

function enableControls() {
    prevBtn.classList.remove('loading');
    nextBtn.classList.remove('loading');
    leftClickArea.classList.remove('disabled');
    rightClickArea.classList.remove('disabled');
    updateButtons(); // This will properly set disabled state based on current index
}

function animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        if (!isLoading) {
            clearInterval(interval);
            return;
        }

        progress += Math.random() * 15;
        if (progress > 90) progress = 90;

        loadingProgressBar.style.width = progress + '%';

        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 100);
}

function completeProgress() {
    loadingProgressBar.style.width = '100%';
    setTimeout(() => {
        hideLoading();
    }, 300);
}

async function loadVideo(index, isReverse = false) {
    if (isLoading) return; // Prevent multiple loading requests

    const direction = isReverse ? 'prev' : 'next';
    showLoading(direction);

    try {
        const currentVideo = showingA ? videoA : videoB;
        const nextVideo = showingA ? videoB : videoA;

        const videoUrl = isReverse ? videos[index].reverse : videos[index].normal;
        const videoSrc = await loadVideoWithCache(videoUrl);

        nextVideo.src = videoSrc;

        // Add error handling
        nextVideo.onerror = () => {
            console.error('Error playing video:', nextVideo.src);
            loadingText.textContent = 'Error memuat ebook. Mencoba lagi...';
            cacheManager.updateCacheStatus('Playback Error');
            hideLoading();
        };

        nextVideo.onloadstart = () => {
            loadingProgressBar.style.width = '60%';
        };

        nextVideo.oncanplaythrough = () => {
            completeProgress();

            setTimeout(() => {
                nextVideo.classList.remove('hidden');
                nextVideo.play().then(() => {
                    currentVideo.classList.add('hidden');
                    // Clean up old object URL
                    if (currentVideo.src.startsWith('blob:')) {
                        URL.revokeObjectURL(currentVideo.src);
                    }
                    showingA = !showingA;
                    updatePageIndicator();
                    applyZoom();
                }).catch(error => {
                    console.error('Error playing ebook:', error);
                    hideLoading();
                });
            }, 100);
        };

        nextVideo.load();

    } catch (error) {
        console.error('Error loading ebook:', error);
        loadingText.textContent = 'Error memuat ebook';
        hideLoading();
    }
}

function goPrev() {
    if (currentIndex > 0 && !isLoading) {
        loadVideo(currentIndex, true);
        currentIndex--;
    }
}

function goNext() {
    if (currentIndex < videos.length - 1 && !isLoading) {
        currentIndex++;
        loadVideo(currentIndex, false);
    }
}

function updatePageIndicator() {
    pageIndicator.textContent = `${currentIndex + 1} / ${videos.length}`;
}

function updateButtons() {
    if (!isLoading) {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === videos.length - 1;
    }
}

// Clear cache function
async function clearCache() {
    if (confirm('Hapus semua cache ebook? Ini akan memerlukan download ulang ebook.')) {
        const success = await cacheManager.clearCache();
        if (success) {
            alert('Cache berhasil dihapus');
        } else {
            alert('Gagal menghapus cache');
        }
    }
}

// Zoom functions
function zoomIn() {
    zoomLevel = Math.min(zoomLevel * 1.2, 3);
    applyZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.5);
    applyZoom();
}

function resetZoom() {
    zoomLevel = 1;
    videoOffsetX = 0;
    videoOffsetY = 0;
    lastOffsetX = 0;
    lastOffsetY = 0;
    applyZoom();
}

function applyZoom() {
    // Terapkan zoom dan posisi ke kedua video
    const transform = `scale(${zoomLevel}) translate(${videoOffsetX}px, ${videoOffsetY}px)`;
    videoA.style.transform = transform;
    videoB.style.transform = transform;

    // Update cursor berdasarkan zoom level
    const currentVideo = showingA ? videoA : videoB;
    if (zoomLevel > 1) {
        currentVideo.style.cursor = isDragging ? 'grabbing' : 'grab';
    } else {
        currentVideo.style.cursor = 'default';
        // Reset posisi jika zoom = 1
        if (zoomLevel === 1) {
            videoOffsetX = 0;
            videoOffsetY = 0;
            lastOffsetX = 0;
            lastOffsetY = 0;
        }
    }

    updateResetPositionButton();
    updateDragIndicator();
}

// Fullscreen function
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Controls auto-hide
function showControls() {
    controls.classList.add('show');
    zoomControls.classList.add('show');

    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        controls.classList.remove('show');
        zoomControls.classList.remove('show');
    }, 3000);
}

// Initialize application
async function initializeApp() {
    try {
        // Initialize IndexedDB
        await cacheManager.init();

        // Show cache size
        const cacheSize = await cacheManager.getCacheSize();
        if (cacheSize > 0) {
            cacheManager.updateCacheStatus(`Cache: ${cacheManager.formatBytes(cacheSize)}`, true);
        }

        // Load initial video
        showLoading('init');
        const initialVideoSrc = await loadVideoWithCache(videos[currentIndex].normal);
        videoA.src = initialVideoSrc;

        videoA.oncanplaythrough = () => {
            completeProgress();
            setTimeout(() => {
                videoA.play().then(() => {
                    updatePageIndicator();
                    updateButtons();
                    applyZoom();
                }).catch(error => {
                    console.error('Error playing initial ebook:', error);
                    hideLoading();
                });
            }, 100);
        };

        videoA.onerror = () => {
            console.error('Error loading initial ebook');
            loadingText.textContent = 'Error memuat ebook awal';
            cacheManager.updateCacheStatus('Initial Load Error');
            setTimeout(() => {
                hideLoading();
            }, 2000);
        };

        videoA.load();

    } catch (error) {
        console.error('Failed to initialize app:', error);
        cacheManager.updateCacheStatus('Initialization Error');
        hideLoading();
    }
}

// Preload adjacent videos in background
async function preloadAdjacentVideos() {
    const preloadList = [];

    // Preload next video
    if (currentIndex < videos.length - 1) {
        preloadList.push(videos[currentIndex + 1].normal);
        preloadList.push(videos[currentIndex + 1].reverse);
    }

    // Preload previous video
    if (currentIndex > 0) {
        preloadList.push(videos[currentIndex - 1].normal);
        preloadList.push(videos[currentIndex - 1].reverse);
    }

    // Preload in background without showing loading
    for (const url of preloadList) {
        try {
            const cached = await cacheManager.getCachedVideo(url);
            if (!cached) {
                // Download and cache in background
                fetch(url).then(response => response.blob()).then(blob => {
                    cacheManager.cacheVideo(url, blob);
                }).catch(error => {
                    console.log('Background preload failed for:', url);
                });
            }
        } catch (error) {
            console.log('Background preload error:', error);
        }
    }
}

// Event listeners
prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);
fullscreenBtn.addEventListener('click', toggleFullscreen);
clearCacheBtn.addEventListener('click', clearCache);
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
zoomResetBtn.addEventListener('click', resetZoom);

// Tambahkan event listener untuk reset position button
resetPositionBtn.addEventListener('click', () => {
    if (zoomLevel > 1) {
        videoOffsetX = 0;
        videoOffsetY = 0;
        lastOffsetX = 0;
        lastOffsetY = 0;
        applyZoom();
        showControls();
    }
});

// Enhanced keyboard navigation
document.addEventListener('keydown', (e) => {
    if (isLoading) return; // Ignore keyboard input during loading

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            goPrev();
            showControls();
            break;
        case 'ArrowRight':
            e.preventDefault();
            goNext();
            showControls();
            break;
        case 'F11':
            e.preventDefault();
            toggleFullscreen();
            break;
        case '+':
        case '=':
            e.preventDefault();
            zoomIn();
            showControls();
            break;
        case '-':
            e.preventDefault();
            zoomOut();
            showControls();
            break;
        case '0':
            e.preventDefault();
            resetZoom();
            showControls();
            break;
        case 'm':
        case 'M':
            e.preventDefault();
            showControls();
            break;
        case 'c':
        case 'C':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                clearCache();
                showControls();
            }
            break;
        case 'r':
        case 'R':
            // Reset posisi drag tanpa mengubah zoom
            if (zoomLevel > 1) {
                e.preventDefault();
                videoOffsetX = 0;
                videoOffsetY = 0;
                lastOffsetX = 0;
                lastOffsetY = 0;
                applyZoom();
                showControls();
            }
            break;
        case 'Escape':
            // Reset zoom dan posisi
            e.preventDefault();
            resetZoom();
            showControls();
            break;
    }
});

// Enhanced touch events for navigation
let startX = 0;
let isSwiping = false;
let isClick = true;
const SWIPE_THRESHOLD = 50;
const CLICK_THRESHOLD = 5;

// function handleTouchEnd(x) {
//     if (isLoading) return; // Ignore touch during loading

//     const deltaX = x - startX;
//     if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
//         isClick = false;
//         if (deltaX < 0) {
//             goNext();
//         } else {
//             goPrev();
//         }
//     }

//     setTimeout(() => {
//         isSwiping = false;
//         isClick = true;
//     }, 100);
// }

videoContainer.removeEventListener('touchstart', (e) => {
    if (isLoading) return;
    startX = e.touches[0].clientX;
    isSwiping = true;
    isClick = true;
    showControls();
});

videoContainer.addEventListener('touchstart', (e) => {
    if (isLoading) return;

    // Jika zoom aktif, prioritaskan drag
    if (zoomLevel > 1) {
        handleTouchStart(e);
        return;
    }

    // Navigation normal jika tidak zoom
    startX = e.touches[0].clientX;
    isSwiping = true;
    isClick = true;
    showControls();
}, { passive: false });

videoContainer.addEventListener('touchmove', (e) => {
    if (!isSwiping || isLoading) return;
    if (Math.abs(e.touches[0].clientX - startX) > CLICK_THRESHOLD) {
        isClick = false;
    }
    e.preventDefault();
});

videoContainer.addEventListener('touchmove', (e) => {
    // Jika sedang drag, handle drag
    if (isDragging && zoomLevel > 1) {
        handleTouchMove(e);
        return;
    }

    // Navigation swipe normal
    if (!isSwiping || isLoading) return;
    if (Math.abs(e.touches[0].clientX - startX) > CLICK_THRESHOLD) {
        isClick = false;
    }
    e.preventDefault();
}, { passive: false });

// videoContainer.addEventListener('touchend', (e) => {
//     if (!isSwiping || isLoading) return;
//     handleTouchEnd(e.changedTouches[0].clientX);
// });

// Tambahkan event listeners ke video container
videoContainer.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mouseup', handleMouseUp);

// Event listeners untuk touch
videoContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
videoContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
videoContainer.addEventListener('touchend', handleTouchEnd);

// Click areas
leftClickArea.addEventListener('click', (e) => {
    if (isClick && !isLoading) {
        goPrev();
        showControls();
    }
});

rightClickArea.addEventListener('click', (e) => {
    if (isClick && !isLoading) {
        goNext();
        showControls();
    }
});

// Show controls on mouse move
document.addEventListener('mousemove', showControls);
document.addEventListener('click', showControls);

// Page change event for preloading
function onPageChange() {
    updatePageIndicator();
    updateButtons();
    // Preload adjacent videos after a short delay
    setTimeout(() => {
        if (!isLoading) {
            preloadAdjacentVideos();
        }
    }, 1000);
}

// Override the original page change functions
const originalGoNext = goNext;
const originalGoPrev = goPrev;

goNext = function () {
    originalGoNext();
    onPageChange();
};

goPrev = function () {
    originalGoPrev();
    onPageChange();
};

// Initialize the application
initializeApp();

// Initial controls show
showControls();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Revoke any object URLs to prevent memory leaks
    if (videoA.src.startsWith('blob:')) {
        URL.revokeObjectURL(videoA.src);
    }
    if (videoB.src.startsWith('blob:')) {
        URL.revokeObjectURL(videoB.src);
    }
});

// Storage quota management
async function checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentage = quota > 0 ? (usage / quota * 100).toFixed(1) : 0;

            console.log(`Storage used: ${cacheManager.formatBytes(usage)} (${percentage}%)`);

            // Warn if storage is getting full
            if (percentage > 80) {
                console.warn('Storage quota is getting full. Consider clearing cache.');
                cacheManager.updateCacheStatus(`Storage: ${percentage}% full`);
            }
        } catch (error) {
            console.log('Storage quota check failed:', error);
        }
    }
}

// Check storage quota periodically
setInterval(checkStorageQuota, 30000); // Every 30 seconds

// Variabel untuk drag functionality
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let videoOffsetX = 0;
let videoOffsetY = 0;
let lastOffsetX = 0;
let lastOffsetY = 0;

// Fungsi untuk menghitung batas drag
function calculateDragLimits() {
    const currentVideo = showingA ? videoA : videoB;
    const videoRect = currentVideo.getBoundingClientRect();
    const containerRect = videoContainer.getBoundingClientRect();

    // Hitung ukuran video yang dizoom
    const scaledWidth = videoRect.width * zoomLevel;
    const scaledHeight = videoRect.height * zoomLevel;

    // Hitung batas maksimum drag
    const maxDragX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxDragY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    return { maxDragX, maxDragY };
}

// Fungsi untuk membatasi posisi drag
function constrainDragPosition(x, y) {
    const { maxDragX, maxDragY } = calculateDragLimits();

    return {
        x: Math.max(-maxDragX, Math.min(maxDragX, x)),
        y: Math.max(-maxDragY, Math.min(maxDragY, y))
    };
}

// Event listeners untuk mouse drag
function handleMouseDown(e) {
    if (zoomLevel <= 1) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastOffsetX = videoOffsetX;
    lastOffsetY = videoOffsetY;

    applyZoom();
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging || zoomLevel <= 1) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const newPosition = constrainDragPosition(
        lastOffsetX + deltaX,
        lastOffsetY + deltaY
    );

    videoOffsetX = newPosition.x;
    videoOffsetY = newPosition.y;

    applyZoom();
    e.preventDefault();
}

function handleMouseUp(e) {
    if (isDragging) {
        isDragging = false;
        applyZoom();
    }
}

// Event listeners untuk touch drag (mobile)
function handleTouchStart(e) {
    if (zoomLevel <= 1) return;

    // Jika ada lebih dari 1 touch, abaikan (untuk pinch zoom di masa depan)
    if (e.touches.length !== 1) return;

    isDragging = true;
    const touch = e.touches[0];
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    lastOffsetX = videoOffsetX;
    lastOffsetY = videoOffsetY;

    applyZoom();

    // Cegah navigasi slide saat dragging
    isSwiping = false;
    isClick = false;
}

function handleTouchMove(e) {
    if (!isDragging || zoomLevel <= 1) return;

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - dragStartY;

    const newPosition = constrainDragPosition(
        lastOffsetX + deltaX,
        lastOffsetY + deltaY
    );

    videoOffsetX = newPosition.x;
    videoOffsetY = newPosition.y;

    applyZoom();

    // Cegah scroll dan navigasi slide
    e.preventDefault();
    e.stopPropagation();
}

function handleTouchEnd(e) {
    if (isDragging) {
        isDragging = false;
        applyZoom();

        // Reset flag untuk navigasi slide setelah delay singkat
        setTimeout(() => {
            isSwiping = false;
            isClick = true;
        }, 100);
    }
}

// Cegah context menu saat drag
videoContainer.addEventListener('contextmenu', (e) => {
    if (isDragging || zoomLevel > 1) {
        e.preventDefault();
    }
});

// Tambahkan indikator visual untuk drag mode
function updateDragIndicator() {
    const currentVideo = showingA ? videoA : videoB;

    if (zoomLevel > 1) {
        currentVideo.style.cursor = isDragging ? 'grabbing' : 'grab';
        currentVideo.classList.add('draggable');
        dragIndicator.classList.add('show');
    } else {
        currentVideo.style.cursor = 'default';
        currentVideo.classList.remove('draggable');
        dragIndicator.classList.remove('show');
    }
}

// Tambahkan juga fungsi untuk update visibility button reset position
function updateResetPositionButton() {
    if (zoomLevel > 1 && (videoOffsetX !== 0 || videoOffsetY !== 0)) {
        resetPositionBtn.style.opacity = '1';
        resetPositionBtn.disabled = false;
    } else {
        resetPositionBtn.style.opacity = '0.5';
        resetPositionBtn.disabled = true;
    }
}

// Proteksi tambahan
(function () {
    'use strict';
    Object.freeze(loadVideo);
    Object.freeze(goPrev);
    Object.freeze(goNext);
    Object.freeze(videos);
    for (let i = 0; i < videos.length; i++) {
        Object.freeze(videos[i]);
    }
})();