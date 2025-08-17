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

// 获取当前路径
$currentPath = isset($_POST['path']) ? $_POST['path'] : '';
$uploadDir = $baseDir . $currentPath;

// 确保上传目录存在
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["error" => "无法创建上传目录"]);
        exit;
    }
}

// 安全检查
$fullUploadDir = realpath($uploadDir);
$fullBaseDir = realpath($baseDir);

if ($fullUploadDir === false || strpos($fullUploadDir, $fullBaseDir) !== 0) {
    http_response_code(403);
    echo json_encode(["error" => "上传路径不合法"]);
    exit;
}

// 检查是否有文件上传
if (!isset($_FILES['files']) && !isset($_FILES['files[]'])) {
    http_response_code(400);
    echo json_encode(["error" => "未上传任何文件"]);
    exit;
}

// 处理文件参数
$files = isset($_FILES['files']) ? $_FILES['files'] : $_FILES['files[]'];
$uploadedFiles = [];
$errors = [];

// 处理多个文件上传
if (is_array($files['name'])) {
    for ($i = 0; $i < count($files['name']); $i++) {
        $filename = $files['name'][$i];
        $tmpName = $files['tmp_name'][$i];
        $error = $files['error'][$i];
        
        // 检查单个文件错误
        if ($error !== UPLOAD_ERR_OK) {
            $errors[] = [
                'file' => $filename,
                'error' => getUploadErrorText($error)
            ];
            continue;
        }
        
        // 处理文件上传
        $result = handleSingleFileUpload($filename, $tmpName, $uploadDir);
        if ($result['success']) {
            $uploadedFiles[] = $result['file'];
        } else {
            $errors[] = [
                'file' => $filename,
                'error' => $result['error']
            ];
        }
    }
} else {
    // 处理单个文件上传
    $filename = $files['name'];
    $tmpName = $files['tmp_name'];
    $error = $files['error'];
    
    if ($error !== UPLOAD_ERR_OK) {
        $errors[] = [
            'file' => $filename,
            'error' => getUploadErrorText($error)
        ];
    } else {
        $result = handleSingleFileUpload($filename, $tmpName, $uploadDir);
        if ($result['success']) {
            $uploadedFiles[] = $result['file'];
        } else {
            $errors[] = [
                'file' => $filename,
                'error' => $result['error']
            ];
        }
    }
}

// 返回结果
echo json_encode([
    'success' => count($errors) === 0,
    'uploaded' => count($uploadedFiles),
    'failed' => count($errors),
    'uploadedFiles' => $uploadedFiles,
    'errors' => $errors
]);

/**
 * 处理单个文件上传
 */
function handleSingleFileUpload($filename, $tmpName, $uploadDir) {
    // 清理文件名
    $cleanFilename = preg_replace('/[^a-zA-Z0-9_.-]/', '', $filename);
    
    // 检查文件名是否有效
    if (empty($cleanFilename)) {
        return [
            'success' => false,
            'error' => '无效的文件名'
        ];
    }
    
    // 检查文件是否已存在，如果存在则添加后缀
    $targetPath = $uploadDir . '/' . $cleanFilename;
    $fileInfo = pathinfo($targetPath);
    $counter = 1;
    
    while (file_exists($targetPath)) {
        $targetPath = $fileInfo['dirname'] . '/' . $fileInfo['filename'] . '(' . $counter . ').' . $fileInfo['extension'];
        $counter++;
    }
    
    // 移动上传文件
    if (move_uploaded_file($tmpName, $targetPath)) {
        // 设置适当的文件权限
        chmod($targetPath, 0644);
        
        return [
            'success' => true,
            'file' => basename($targetPath)
        ];
    } else {
        return [
            'success' => false,
            'error' => '无法移动上传的文件'
        ];
    }
}

/**
 * 获取上传错误的文本描述
 */
function getUploadErrorText($errorCode) {
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            return '文件超过了php.ini限制的大小';
        case UPLOAD_ERR_FORM_SIZE:
            return '文件超过了表单限制的大小';
        case UPLOAD_ERR_PARTIAL:
            return '文件只有部分被上传';
        case UPLOAD_ERR_NO_FILE:
            return '没有文件被上传';
        case UPLOAD_ERR_NO_TMP_DIR:
            return '找不到临时文件夹';
        case UPLOAD_ERR_CANT_WRITE:
            return '文件写入失败';
        case UPLOAD_ERR_EXTENSION:
            return '文件上传被PHP扩展阻止';
        default:
            return '未知上传错误';
    }
}
?>
    