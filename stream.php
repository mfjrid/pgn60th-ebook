<?php
$allowed_videos = [
    'slide1.mp4',
    'slide2.mp4',
    'slide2_reverse.mp4',
    'slide3.mp4',
    'slide3_reverse.mp4',
    'slide4.mp4',
    'slide4_reverse.mp4'
];

if (!isset($_GET['file']) || !in_array($_GET['file'], $allowed_videos)) {
    http_response_code(403);
    exit('Access Denied');
}

$video = 'assets/videos/' . $_GET['file'];
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
