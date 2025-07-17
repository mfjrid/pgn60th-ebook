<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>60th PGN Flipbook</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="stylesheet" href="assets/css/style.css?<?= time(); ?>">
</head>

<body>
    <div id="preloader">
        <img id="preloader-logo" src="assets/img/logo.png" alt="Loading...">
    </div>

    <div id="video-container">
        <div class="click-area left-click-area"></div>
        <video id="videoA" autoplay muted playsinline class="video-fixed-size"></video>
        <video id="videoB" autoplay muted playsinline class="hidden video-fixed-size"></video>
        <div class="click-area right-click-area"></div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loading-overlay">
            <div style="text-align: center;">
                <div class="loading-spinner d-none"></div>
                <div class="loading-text d-none" id="loading-text">Memuat ebook...</div>
                <div class="loading-progress d-none">
                    <div class="loading-progress-bar" id="loading-progress-bar"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Page Indicator -->
    <div class="page-indicator d-none" id="page-indicator">1 / 91</div>

    <!-- Cache Status -->
    <div class="cache-status" id="cache-status">Cache: Loading...</div>

    <div class="drag-indicator" id="drag-indicator">Drag Mode</div>

    <!-- Zoom Controls -->
    <div class="zoom-controls auto-hide" id="zoom-controls">
        <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
        <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
        <button class="zoom-btn" id="zoom-reset" title="Reset Zoom">⌂</button>
        <button class="zoom-btn reset-position-btn" id="reset-position" title="Reset Position (R)">⌖</button>
    </div>

    <!-- Main Controls -->
    <div class="controls auto-hide" id="controls">
        <button class="control-btn" id="prev-btn" title="Previous (←)">
            ← Prev
        </button>
        <button class="control-btn" id="next-btn" title="Next (→)">
            Next →
        </button>
        <button class="control-btn" id="fullscreen-btn" title="Fullscreen (F11)">
            ⛶ Fullscreen
        </button>
        <button class="control-btn" id="clear-cache-btn" title="Clear Cache">
            🗑️ Clear Cache
        </button>
    </div>

    <script src="assets/js/script.js"></script>
</body>

</html>