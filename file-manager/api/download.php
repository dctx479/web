<?php
// 基础目录 - 使用绝对路径
$baseDir = __DIR__ . '/../files';
$baseDir = realpath($baseDir);
if ($baseDir === false) {
    // 尝试其他可能的路径
    $baseDir = realpath('./files');
    if ($baseDir === false) {
        $baseDir = realpath('../files');
        if ($baseDir === false) {
            http_response_code(404);
            exit('基础目录不存在');
        }
    }
}
$baseDir = $baseDir . DIRECTORY_SEPARATOR;

// 获取文件路径
$path = isset($_GET['path']) ? $_GET['path'] : '';
$fullPath = realpath($baseDir . $path);

// 安全检查
if ($fullPath === false || strpos($fullPath, realpath($baseDir)) !== 0 || !file_exists($fullPath) || is_dir($fullPath)) {
    http_response_code(404);
    exit('文件不存在');
}

// 获取文件信息
$mimeType = mime_content_type($fullPath);
$fileSize = filesize($fullPath);
$fileName = basename($fullPath);

// 支持Range请求（用于视频进度条）
$range = '';
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];
}

// 处理Range请求
if ($range) {
    list($param, $range) = explode('=', $range);
    if (strtolower(trim($param)) !== 'bytes') {
        http_response_code(400);
        exit('Invalid range parameter');
    }
    
    $range = explode(',', $range);
    $range = explode('-', $range[0]);
    
    $start = isset($range[0]) && is_numeric($range[0]) ? intval($range[0]) : 0;
    $end = isset($range[1]) && is_numeric($range[1]) ? intval($range[1]) : $fileSize - 1;
    
    if ($start > $end || $start >= $fileSize) {
        http_response_code(416);
        header("Content-Range: bytes */$fileSize");
        exit();
    }
    
    $length = $end - $start + 1;
    http_response_code(206);
    header("Content-Range: bytes $start-$end/$fileSize");
} else {
    $start = 0;
    $end = $fileSize - 1;
    $length = $fileSize;
}

// 设置响应头
header("Content-Type: $mimeType");
header("Content-Length: $length");
header("Content-Disposition: inline; filename=\"$fileName\"");
header("Accept-Ranges: bytes");
header("Cache-Control: public, must-revalidate, max-age=0");
header("Pragma: public");

// 输出文件内容
$file = fopen($fullPath, 'rb');
fseek($file, $start);

while ($length > 0 && !feof($file)) {
    $read = min(1024 * 16, $length);
    echo fread($file, $read);
    $length -= $read;
}

fclose($file);
exit();
?>
    