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
    // 尝试其他可能的路径
    $baseDir = realpath('./files');
    if ($baseDir === false) {
        $baseDir = realpath('../files');
        if ($baseDir === false) {
            echo json_encode(['success' => false, 'error' => '基础目录不存在']);
            exit;
        }
    }
}
$baseDir = $baseDir . DIRECTORY_SEPARATOR;

// 获取JSON输入
$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    // 如果不是JSON，尝试POST数据
    $fileName = trim($_POST['name'] ?? '');
    $currentPath = trim($_POST['path'] ?? '');
} else {
    // 从JSON中获取path参数，然后提取文件名
    $filePath = trim($input['path'] ?? '');
    $currentPath = dirname($filePath);
    $fileName = basename($filePath);
    
    // 如果路径就是文件名（根目录），则当前路径为空
    if ($currentPath === '.') {
        $currentPath = '';
    }
}

if (empty($fileName)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => '缺少文件名']);
    exit;
}

// 过滤危险路径字符（允许文件名中的空格、中文等合法字符）
$filteredFileName = preg_replace('#\.\./|\./|/|\\\\#', '', $fileName); // 仅过滤路径遍历字符
$filteredPath = preg_replace('#\.\./|\./|/|\\\\#', '', $currentPath);

// 构建目标路径 - 使用正确的路径分隔符
$targetPath = $baseDir;
if (!empty($filteredPath)) {
    $targetPath .= str_replace('/', DIRECTORY_SEPARATOR, $filteredPath) . DIRECTORY_SEPARATOR;
}
$targetPath .= $filteredFileName;

// 检查当前目录下的文件，验证文件名是否存在
$currentDir = $baseDir . ($filteredPath ? str_replace('/', DIRECTORY_SEPARATOR, $filteredPath) . DIRECTORY_SEPARATOR : '');
$dirItems = [];
if (is_dir($currentDir)) {
    $dirItems = scandir($currentDir);
    $dirItems = array_diff($dirItems, ['.', '..']);
}

// 验证文件名是否存在
if (!in_array($filteredFileName, $dirItems)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => '目标文件/文件夹不存在（文件名不匹配）',
        'debug' => [
            'searched_path' => $targetPath,
            'current_directory' => $currentDir,
            'existing_files' => $dirItems, // 显示当前目录下的实际文件名
            'provided_name' => $filteredFileName
        ]
    ]);
    exit;
}

// 验证路径存在性
if (!file_exists($targetPath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => '目标文件/文件夹不存在',
        'debug' => ['searched_path' => $targetPath]
    ]);
    exit;
}

// 解析绝对路径并验证范围
$fullPath = realpath($targetPath);
if ($fullPath === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => '路径无法解析']);
    exit;
}

// 标准化路径进行安全检查
$baseDirNormalized = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $baseDir), DIRECTORY_SEPARATOR);
$fullPathNormalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fullPath);
if (strpos($fullPathNormalized, $baseDirNormalized) !== 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => '访问被拒绝']);
    exit;
}

// 尝试删除
try {
    if (is_dir($fullPath)) {
        if (!deleteDirectory($fullPath)) {
            throw new Exception('无法删除目录，请检查权限');
        }
    } else {
        if (!unlink($fullPath)) {
            throw new Exception('无法删除文件，请检查权限');
        }
    }

    echo json_encode([
        'success' => true,
        'message' => '删除成功',
        'deleted_file' => $filteredFileName
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => ['is_writable' => is_writable($fullPath)]
    ]);
}

// 递归删除目录函数
function deleteDirectory($dir) {
    if (!is_dir($dir)) return false;
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        is_dir($path) ? deleteDirectory($path) : unlink($path);
    }
    return rmdir($dir);
}
?>
    