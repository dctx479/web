<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// 基础目录
$baseDir = __DIR__ . '/../files';
$baseDir = realpath($baseDir);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '只支持POST请求']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['oldPath']) || !isset($input['newName'])) {
    echo json_encode(['error' => '缺少必要参数']);
    exit;
}

$oldPath = $input['oldPath'];
$newName = trim($input['newName']);

if (empty($newName)) {
    echo json_encode(['error' => '新文件名不能为空']);
    exit;
}

// 验证文件名
if (preg_match('/[<>:"|?*]/', $newName) || strpos($newName, '..') !== false) {
    echo json_encode(['error' => '文件名包含非法字符']);
    exit;
}

$oldFullPath = $baseDir . DIRECTORY_SEPARATOR . $oldPath;
$oldFullPath = realpath($oldFullPath);

if ($oldFullPath === false || !file_exists($oldFullPath)) {
    echo json_encode(['error' => '原文件不存在']);
    exit;
}

// 确保文件在基础目录内
if (strpos($oldFullPath, $baseDir) !== 0) {
    echo json_encode(['error' => '访问被拒绝']);
    exit;
}

// 构建新路径
$parentDir = dirname($oldFullPath);
$newFullPath = $parentDir . DIRECTORY_SEPARATOR . $newName;

if (file_exists($newFullPath)) {
    echo json_encode(['error' => '目标文件名已存在']);
    exit;
}

try {
    if (rename($oldFullPath, $newFullPath)) {
        echo json_encode(['success' => true, 'message' => '重命名成功']);
    } else {
        echo json_encode(['error' => '重命名失败']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => '重命名失败: ' . $e->getMessage()]);
}
?>