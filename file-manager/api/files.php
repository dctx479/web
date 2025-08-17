<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// 基础目录 - 使用绝对路径
$baseDir = __DIR__ . '/../files';
$baseDir = realpath($baseDir);
if ($baseDir === false) {
    // 尝试其他可能的路径
    $baseDir = realpath('./files');
    if ($baseDir === false) {
        $baseDir = realpath('../files');
        if ($baseDir === false) {
            // 创建files目录如果不存在
            $filesDir = __DIR__ . '/../files';
            if (!is_dir($filesDir)) {
                mkdir($filesDir, 0755, true);
            }
            $baseDir = realpath($filesDir);
            if ($baseDir === false) {
                echo json_encode([
                    "success" => false,
                    "error" => "基础目录不存在且无法创建",
                    "debug" => [
                        "current_dir" => __DIR__,
                        "tried_paths" => [
                            __DIR__ . '/../files',
                            './files',
                            '../files'
                        ]
                    ]
                ]);
                exit;
            }
        }
    }
}
$baseDir = $baseDir . DIRECTORY_SEPARATOR;

// 获取当前路径
$currentPath = isset($_GET['path']) ? $_GET['path'] : '';
$targetPath = $baseDir . str_replace(['../', './'], '', $currentPath);
$fullPath = realpath($targetPath);

// 安全检查
if ($fullPath === false) {
    // 如果是空路径，直接使用基础目录
    if (empty($currentPath)) {
        $fullPath = rtrim($baseDir, DIRECTORY_SEPARATOR);
    } else {
        echo json_encode([
            "error" => "路径不存在",
            "debug" => [
                "baseDir" => $baseDir,
                "currentPath" => $currentPath,
                "targetPath" => $targetPath
            ]
        ]);
        exit;
    }
}

// 确保路径在基础目录范围内
if (strpos($fullPath, rtrim($baseDir, DIRECTORY_SEPARATOR)) !== 0) {
    echo json_encode(["error" => "访问被拒绝"]);
    exit;
}

// 验证路径是否为目录
if (!is_dir($fullPath)) {
    echo json_encode(["error" => "路径不是有效的目录"]);
    exit;
}

// 生成面包屑导航
$breadcrumbs = generateBreadcrumbs($currentPath, $baseDir);

// 获取目录中的项目
$items = [];
$dir = new DirectoryIterator($fullPath);

foreach ($dir as $item) {
    if ($item->isDot()) continue;
    
    $itemName = $item->getFilename();
    $itemPath = $currentPath ? $currentPath . '/' . $itemName : $itemName;
    $fullItemPath = $fullPath . '/' . $itemName;
    
    // 计算相对路径（用于生成ID）
    $relativePath = str_replace(realpath($baseDir) . '/', '', $fullItemPath);
    
    // 基本信息
    $itemInfo = [
        'id' => md5($relativePath), // 使用相对路径的MD5作为唯一ID
        'name' => $itemName,
        'path' => $itemPath,
        'modified' => date('Y-m-d H:i:s', $item->getMTime()),
        'type' => $item->isDir() ? 'folder' : getFileType($itemName)
    ];
    
    // 如果是文件，添加更多信息
    if (!$item->isDir()) {
        $itemInfo['size'] = $item->getSize();
        $itemInfo['extension'] = strtoupper($item->getExtension());
        $itemInfo['mimeType'] = mime_content_type($fullItemPath);
    }
    
    $items[] = $itemInfo;
}

// 按类型和名称排序（文件夹在前，按名称排序）
usort($items, function($a, $b) {
    if ($a['type'] === $b['type']) {
        return strnatcasecmp($a['name'], $b['name']);
    }
    return $a['type'] === 'folder' ? -1 : 1;
});

// 返回结果
echo json_encode([
    'success' => true,
    'currentPath' => $currentPath,
    'breadcrumbs' => $breadcrumbs,
    'items' => $items
]);

/**
 * 生成面包屑导航
 */
function generateBreadcrumbs($currentPath, $baseDir) {
    $breadcrumbs = [
        ['name' => '根目录', 'path' => '']
    ];
    
    if (empty($currentPath)) {
        return $breadcrumbs;
    }
    
    $pathParts = explode('/', $currentPath);
    $currentBuildPath = '';
    
    foreach ($pathParts as $part) {
        if (empty($part)) continue;
        
        $currentBuildPath = $currentBuildPath ? $currentBuildPath . '/' . $part : $part;
        $breadcrumbs[] = [
            'name' => $part,
            'path' => $currentBuildPath
        ];
    }
    
    return $breadcrumbs;
}

/**
 * 确定文件类型
 */
function getFileType($filename) {
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    $videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
    $audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
    $documentExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'rtf'];
    $archiveExtensions = ['zip', 'rar', 'tar', 'gz', '7z'];
    $codeExtensions = ['html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'js', 'json', 'xml'];
    
    if (in_array($extension, $imageExtensions)) return 'image';
    if (in_array($extension, $videoExtensions)) return 'video';
    if (in_array($extension, $audioExtensions)) return 'audio';
    if (in_array($extension, $documentExtensions)) return 'document';
    if (in_array($extension, $archiveExtensions)) return 'archive';
    if (in_array($extension, $codeExtensions)) return 'code';
    
    return 'other';
}
?>
    