<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// 只允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '只允许POST请求']);
    exit;
}

// 基础目录
$baseDir = '../files/';

// 获取JSON输入
$input = json_decode(file_get_contents('php://input'), true);
if ($input === null) {
    // 如果不是JSON，尝试POST数据
    $folderName = isset($_POST['name']) ? trim($_POST['name']) : '';
    $currentPath = isset($_POST['path']) ? $_POST['path'] : '';
} else {
    $folderName = isset($input['name']) ? trim($input['name']) : '';
    $currentPath = isset($input['path']) ? $input['path'] : '';
}

// 验证文件夹名称
if (empty($folderName)) {
    http_response_code(400);
    echo json_encode(['error' => '文件夹名称不能为空']);
    exit;
}

// 检查非法字符
if (preg_match('/[\/:*?"<>|]/', $folderName)) {
    http_response_code(400);
    echo json_encode(['error' => '文件夹名称包含非法字符']);
    exit;
}

// 构建路径
$parentDir = realpath($baseDir . $currentPath);
$newFolderPath = $parentDir . '/' . $folderName;

// 安全检查
if ($parentDir === false || strpos($parentDir, realpath($baseDir)) !== 0) {
    http_response_code(403);
    echo json_encode(["error" => "访问被拒绝"]);
    exit;
}

// 检查是否已存在
if (file_exists($newFolderPath)) {
    http_response_code(400);
    echo json_encode(['error' => '文件夹已存在']);
    exit;
}

// 创建文件夹
if (!mkdir($newFolderPath, 0755)) {
    http_response_code(500);
    echo json_encode(['error' => '无法创建文件夹，请检查权限']);
    exit;
}

// 返回成功响应
echo json_encode([
    'success' => true,
    'message' => '文件夹创建成功'
]);
?>
    