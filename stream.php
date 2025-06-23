<?php

// Generate allowed videos list dynamically
$allowed_videos = [];
for ($i = 0; $i <= 91; $i++) {
    $allowed_videos[] = "slide-{$i}.mp4";
    $allowed_videos[] = "slide_reverse-{$i}.mp4";
}

if (!isset($_GET['file']) || !in_array($_GET['file'], $allowed_videos)) {
    http_response_code(403);
    exit('Access Denied');
}

// Determine folder based on filename
$folder = strpos($_GET['file'], '_reverse') !== false
    ? 'assets/videos/slide-reverse/'
    : 'assets/videos/slide/';

// Pastikan path benar dengan menyesuaikan struktur folder
$video = __DIR__ . '/' . $folder . $_GET['file'];
$mime = 'video/mp4';

if (file_exists($video)) {
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($video));
    readfile($video);
    exit;
} else {
    http_response_code(404);
    exit('File not found');
}

error_log("Mencoba mengakses file: " . $video); // Ini akan mencatat path lengkap
if (!file_exists($video)) {
    error_log("File tidak ditemukan: " . $video);
}
