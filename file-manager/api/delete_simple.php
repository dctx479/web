<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// 只允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => '只允许POST请求']);
    exit;
}

// 基础目录 - 使用绝对路径
$baseDir = __DIR__ . '/../files';
$baseDir = realpath($baseDir);
if ($baseDir === false) {
    echo json_encode(['success' => false, 'error' => '基础目录不存在']);
    exit;
}

// 获取参数
$fileName = trim($_POST['name'] ?? '');
$currentPath = trim($_POST['path'] ?? '');

if (empty($fileName)) {
    echo json_encode(['success' => false, 'error' => '缺少文件名']);
    exit;
}

// 构建完整路径
$fullPath = $baseDir;
if (!empty($currentPath)) {
    $fullPath .= DIRECTORY_SEPARATOR . $currentPath;
}
$fullPath .= DIRECTORY_SEPARATOR . $fileName;

// 标准化路径
$fullPath = realpath($fullPath);
if ($fullPath === false) {
    echo json_encode(['success' => false, 'error' => '文件不存在']);
    exit;
}

// 安全检查 - 确保在基础目录内
if (strpos($fullPath, $baseDir) !== 0) {
    echo json_encode(['success' => false, 'error' => '访问被拒绝']);
    exit;
}

// 执行删除
try {
    if (is_dir($fullPath)) {
        if (deleteDirectory($fullPath)) {
            echo json_encode(['success' => true, 'message' => '文件夹删除成功']);
        } else {
            echo json_encode(['success' => false, 'error' => '删除文件夹失败']);
        }
    } else {
        if (unlink($fullPath)) {
            echo json_encode(['success' => true, 'message' => '文件删除成功']);
        } else {
            echo json_encode(['success' => false, 'error' => '删除文件失败']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// 递归删除目录函数
function deleteDirectory($dir) {
    if (!is_dir($dir)) return false;
    
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        if (is_dir($path)) {
            deleteDirectory($path);
        } else {
            unlink($path);
        }
    }
    return rmdir($dir);
}
?>