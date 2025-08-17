/**
 * 文件管理器类 - 优化版本
 * 提供完整的文件管理功能，包括预览、上传、删除、重命名等
 */
class FileManager {
    constructor() {
        this.currentPath = '';
        this.files = [];
        this.isLoading = false;
        this.searchTerm = '';
        this.sortBy = 'name';
        
        this.init();
    }

    /**
     * 初始化文件管理器
     */
    init() {
        this.bindEvents();
        this.loadFiles();
        this.initTheme();
    }

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderFiles();
            });
        }

        // 排序功能
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderFiles();
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadFiles();
            });
        }

        // 上传按钮
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // 新建文件夹按钮
        const newFolderBtn = document.getElementById('newFolderBtn');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => {
                this.createFolder();
            });
        }

        // 返回上级目录
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBack();
            });
        }

        // 主题切换
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // 键盘快捷键
        this.initKeyboardShortcuts();

        // 拖拽上传
        this.initDragAndDrop();
    }

    /**
     * 初始化拖拽上传
     */
    initDragAndDrop() {
        const dropZone = document.body;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });
    }

    /**
     * 初始化键盘快捷键
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F 搜索
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // F5 刷新
            if (e.key === 'F5') {
                e.preventDefault();
                this.loadFiles();
            }
            
            // Escape 关闭模态框
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.fixed.inset-0');
                modals.forEach(modal => {
                    if (modal.parentNode) {
                        document.body.removeChild(modal);
                    }
                });
            }
        });
    }

    /**
     * 加载文件列表
     */
    async loadFiles(path = '') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            const response = await fetch(`api/files.php?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            console.log('API返回数据:', data);
            
            if (data.success) {
                this.currentPath = path;
                this.files = data.items || [];
                console.log('文件列表:', this.files);
                this.renderFiles();
                this.updateBreadcrumb();
            } else {
                this.showError(data.message || '加载文件失败');
            }
        } catch (error) {
            console.error('加载文件错误:', error);
            this.showError(`网络错误: ${error.message}`);
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * 显示/隐藏加载状态
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        const fileListElement = document.getElementById('fileList');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        if (fileListElement) {
            fileListElement.style.display = show ? 'none' : 'grid';
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }
    }

    /**
     * 渲染文件列表
     */
    renderFiles() {
        const fileListElement = document.getElementById('fileList');
        if (!fileListElement) return;

        // 清空现有内容
        fileListElement.innerHTML = '';

        // 确保 files 是数组
        if (!this.files || !Array.isArray(this.files)) {
            this.files = [];
        }

        // 过滤文件
        let filteredFiles = this.filterFiles(this.files);

        if (filteredFiles.length === 0) {
            this.showEmptyState();
            return;
        }

        // 排序文件
        filteredFiles = this.sortFiles(filteredFiles);

        // 渲染文件项
        filteredFiles.forEach((file, index) => {
            const fileElement = this.createFileElement(file, index);
            fileListElement.appendChild(fileElement);
        });

        // 添加动画效果
        this.animateFileItems();
    }

    /**
     * 过滤文件
     */
    filterFiles(files) {
        if (!this.searchTerm) return files;
        
        return files.filter(file => 
            file.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    /**
     * 排序文件
     */
    sortFiles(files) {
        return files.sort((a, b) => {
            // 文件夹优先
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            // 按名称排序
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }

    /**
     * 显示空状态
     */
    showEmptyState() {
        const fileListElement = document.getElementById('fileList');
        const emptyState = document.getElementById('emptyState');
        
        if (fileListElement) {
            fileListElement.style.display = 'none';
        }
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    /**
     * 添加文件项动画效果
     */
    animateFileItems() {
        const fileItems = document.querySelectorAll('#fileList .file-item');
        fileItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    /**
     * 创建文件元素
     */
    createFileElement(file, index) {
        const div = document.createElement('div');
        div.className = 'file-item bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group';
        div.setAttribute('data-name', file.name.toLowerCase());
        div.setAttribute('data-type', file.type);

        const icon = this.getFileIcon(file);
        const size = file.type === 'folder' ? '' : this.formatFileSize(file.size);
        const date = this.formatDate(file.modified);

        div.innerHTML = `
            <div class="flex flex-col items-center text-center space-y-3">
                <!-- 文件图标 -->
                <div class="relative">
                    ${icon}
                    ${file.type === 'folder' ? '' : `
                        <div class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button class="preview-btn w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110" title="预览">
                                <i class="fas fa-eye text-xs"></i>
                            </button>
                        </div>
                    `}
                </div>

                <!-- 文件信息 -->
                <div class="flex-1 min-w-0 w-full">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate mb-1" title="${file.name}">
                        ${file.name}
                    </h3>
                    <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div>${date}</div>
                        ${size ? `<div class="font-medium text-blue-600 dark:text-blue-400">${size}</div>` : ''}
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex items-center justify-center space-x-2 mt-2">
                    ${file.type !== 'folder' ? `
                        <button class="download-btn px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md transition-all duration-200 flex items-center space-x-1" title="下载">
                            <i class="fas fa-download"></i>
                            <span>下载</span>
                        </button>
                    ` : ''}
                    <button class="rename-btn px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-md transition-all duration-200 flex items-center space-x-1" title="重命名">
                        <i class="fas fa-edit"></i>
                        <span>重命名</span>
                    </button>
                    <button class="delete-btn px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-all duration-200 flex items-center space-x-1" title="删除">
                        <i class="fas fa-trash"></i>
                        <span>删除</span>
                    </button>
                </div>
            </div>
        `;

        // 绑定事件
        this.bindFileEvents(div, file);

        return div;
    }

    /**
     * 绑定文件事件
     */
    bindFileEvents(element, file) {
        // 双击进入文件夹或预览文件
        element.addEventListener('dblclick', () => {
            if (file.type === 'folder') {
                this.loadFiles(this.joinPath(this.currentPath, file.name));
            } else {
                this.previewFile(file);
            }
        });

        // 预览按钮
        const previewBtn = element.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previewFile(file);
            });
        }

        // 下载按钮
        const downloadBtn = element.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadFile(file);
            });
        }

        // 重命名按钮
        const renameBtn = element.querySelector('.rename-btn');
        if (renameBtn) {
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameFile(file);
            });
        }

        // 删除按钮
        const deleteBtn = element.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFile(file);
            });
        }
    }

    /**
     * 获取文件图标
     */
    getFileIcon(file) {
        if (file.type === 'folder') {
            return `
                <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i class="fas fa-folder text-white text-xl"></i>
                </div>
            `;
        }

        const ext = file.extension ? file.extension.toLowerCase() : file.name.split('.').pop().toLowerCase();
        const iconConfig = this.getFileIconConfig(ext);

        return `
            <div class="w-12 h-12 bg-gradient-to-br ${iconConfig.gradient} rounded-lg flex items-center justify-center shadow-lg">
                <i class="fas ${iconConfig.icon} text-white text-lg"></i>
            </div>
        `;
    }

    /**
     * 获取文件图标配置
     */
    getFileIconConfig(ext) {
        const iconMap = {
            // 图片 - 绿色
            'jpg': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'jpeg': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'png': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'gif': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'bmp': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'webp': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            'svg': { gradient: 'from-emerald-400 to-emerald-600', icon: 'fa-image' },
            
            // 视频 - 红色
            'mp4': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'avi': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'mov': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'wmv': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'flv': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'mkv': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            'webm': { gradient: 'from-rose-400 to-rose-600', icon: 'fa-video' },
            
            // 音频 - 紫色
            'mp3': { gradient: 'from-violet-400 to-violet-600', icon: 'fa-music' },
            'wav': { gradient: 'from-violet-400 to-violet-600', icon: 'fa-music' },
            'flac': { gradient: 'from-violet-400 to-violet-600', icon: 'fa-music' },
            'aac': { gradient: 'from-violet-400 to-violet-600', icon: 'fa-music' },
            'ogg': { gradient: 'from-violet-400 to-violet-600', icon: 'fa-music' },
            
            // PDF - 深红色
            'pdf': { gradient: 'from-red-500 to-red-700', icon: 'fa-file-pdf' },
            
            // Office文档 - 不同颜色
            'doc': { gradient: 'from-sky-500 to-sky-700', icon: 'fa-file-word' },
            'docx': { gradient: 'from-sky-500 to-sky-700', icon: 'fa-file-word' },
            'xls': { gradient: 'from-green-500 to-green-700', icon: 'fa-file-excel' },
            'xlsx': { gradient: 'from-green-500 to-green-700', icon: 'fa-file-excel' },
            'ppt': { gradient: 'from-orange-500 to-orange-700', icon: 'fa-file-powerpoint' },
            'pptx': { gradient: 'from-orange-500 to-orange-700', icon: 'fa-file-powerpoint' },
            
            // 代码文件 - 不同颜色
            'js': { gradient: 'from-yellow-400 to-yellow-600', icon: 'fa-file-code' },
            'ts': { gradient: 'from-blue-400 to-blue-600', icon: 'fa-file-code' },
            'html': { gradient: 'from-orange-400 to-orange-600', icon: 'fa-file-code' },
            'css': { gradient: 'from-cyan-400 to-cyan-600', icon: 'fa-file-code' },
            'php': { gradient: 'from-indigo-500 to-indigo-700', icon: 'fa-file-code' },
            'py': { gradient: 'from-teal-400 to-teal-600', icon: 'fa-file-code' },
            'java': { gradient: 'from-amber-400 to-amber-600', icon: 'fa-file-code' },
            'cpp': { gradient: 'from-slate-400 to-slate-600', icon: 'fa-file-code' },
            'c': { gradient: 'from-slate-400 to-slate-600', icon: 'fa-file-code' },
            
            // 文本文件 - 灰色系
            'txt': { gradient: 'from-gray-400 to-gray-600', icon: 'fa-file-alt' },
            'md': { gradient: 'from-slate-500 to-slate-700', icon: 'fa-file-alt' },
            'json': { gradient: 'from-lime-500 to-lime-700', icon: 'fa-file-code' },
            'xml': { gradient: 'from-teal-400 to-teal-600', icon: 'fa-file-code' },
            'csv': { gradient: 'from-emerald-500 to-emerald-700', icon: 'fa-file-csv' },
            
            // 压缩包 - 黄色系
            'zip': { gradient: 'from-amber-500 to-amber-700', icon: 'fa-file-archive' },
            'rar': { gradient: 'from-amber-500 to-amber-700', icon: 'fa-file-archive' },
            '7z': { gradient: 'from-amber-500 to-amber-700', icon: 'fa-file-archive' },
            'tar': { gradient: 'from-amber-500 to-amber-700', icon: 'fa-file-archive' },
            'gz': { gradient: 'from-amber-500 to-amber-700', icon: 'fa-file-archive' },
            
            // 链接文件 - 蓝色
            'lnk': { gradient: 'from-blue-400 to-blue-600', icon: 'fa-link' },
            'url': { gradient: 'from-blue-400 to-blue-600', icon: 'fa-link' },
        };

        return iconMap[ext] || { 
            gradient: 'from-slate-400 to-slate-600', 
            icon: 'fa-file'
        };
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (typeof dateString === 'string') {
            return dateString;
        }
        const date = new Date(dateString * 1000);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {hour12: false});
    }

    /**
     * 预览文件
     */
    async previewFile(file) {
        const filePath = this.joinPath(this.currentPath, file.name);
        const ext = file.extension ? file.extension.toLowerCase() : file.name.split('.').pop().toLowerCase();
        
        // 创建预览模态框
        const modal = this.createPreviewModal();
        const modalContent = modal.querySelector('.modal-content');
        
        try {
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                // 图片预览
                modalContent.innerHTML = `
                    <div class="text-center">
                        <img src="files/${filePath}" alt="${file.name}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">${file.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                `;
            } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
                // 视频预览
                modalContent.innerHTML = `
                    <div class="text-center">
                        <video controls class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg">
                            <source src="files/${filePath}" type="video/${ext}">
                            您的浏览器不支持视频播放。
                        </video>
                        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">${file.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                `;
            } else if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) {
                // 音频预览
                modalContent.innerHTML = `
                    <div class="text-center">
                        <div class="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg p-8 mb-4">
                            <i class="fas fa-music text-4xl text-purple-500 mb-4"></i>
                            <audio controls class="w-full">
                                <source src="files/${filePath}" type="audio/${ext}">
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${file.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                `;
            } else if (ext === 'pdf') {
                // PDF预览
                modalContent.innerHTML = `
                    <div class="text-center">
                        <iframe src="files/${filePath}" class="w-full h-96 border rounded-lg"></iframe>
                        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">${file.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                `;
            } else if (['txt', 'md', 'js', 'html', 'css', 'php', 'py', 'json', 'xml'].includes(ext)) {
                // 文本文件预览
                const response = await fetch(`files/${filePath}`);
                const text = await response.text();
                modalContent.innerHTML = `
                    <div>
                        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">${file.name}</h3>
                        <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-96 text-gray-800 dark:text-gray-200"><code>${this.escapeHtml(text)}</code></pre>
                        <p class="mt-4 text-xs text-gray-500 dark:text-gray-500">${this.formatFileSize(file.size)}</p>
                    </div>
                `;
            } else {
                // 不支持预览的文件类型
                modalContent.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-file text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">无法预览此文件类型</p>
                        <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">${file.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-500 mb-6">${this.formatFileSize(file.size)}</p>
                        <button onclick="fileManager.downloadFile({name: '${file.name}'})" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                            下载文件
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('预览文件错误:', error);
            modalContent.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <p class="text-red-600 dark:text-red-400">预览失败</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">${error.message}</p>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
    }

    /**
     * 创建预览模态框
     */
    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-full overflow-auto shadow-2xl">
                <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">文件预览</h2>
                    <button class="close-modal text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="modal-content p-6">
                    <div class="text-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p class="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
                    </div>
                </div>
            </div>
        `;

        // 关闭模态框事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
                document.body.removeChild(modal);
            }
        });

        return modal;
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 下载文件
     */
    downloadFile(file) {
        const filePath = this.joinPath(this.currentPath, file.name);
        const link = document.createElement('a');
        link.href = `api/download.php?path=${encodeURIComponent(filePath)}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('开始下载文件', 'success');
    }

    /**
     * 重命名文件
     */
    async renameFile(file) {
        const newName = prompt('请输入新的文件名:', file.name);
        if (!newName || newName === file.name) return;

        try {
            const response = await fetch('api/rename.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPath: this.joinPath(this.currentPath, file.name),
                    newName: newName
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('重命名成功', 'success');
                this.loadFiles(this.currentPath);
            } else {
                this.showNotification(data.message || '重命名失败', 'error');
            }
        } catch (error) {
            console.error('重命名错误:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(file) {
        if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;

        try {
            const response = await fetch('api/delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: this.joinPath(this.currentPath, file.name)
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('删除成功', 'success');
                this.loadFiles(this.currentPath);
            } else {
                this.showNotification(data.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除错误:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 创建文件夹
     */
    async createFolder() {
        const folderName = prompt('请输入文件夹名称:');
        if (!folderName) return;

        try {
            const response = await fetch('api/create_folder.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: this.currentPath,
                    name: folderName
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('文件夹创建成功', 'success');
                this.loadFiles(this.currentPath);
            } else {
                this.showNotification(data.message || '创建文件夹失败', 'error');
            }
        } catch (error) {
            console.error('创建文件夹错误:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 处理文件上传
     */
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append('path', this.currentPath);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        try {
            this.showNotification('正在上传文件...', 'info');
            
            const response = await fetch('api/upload.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('文件上传成功', 'success');
                this.loadFiles(this.currentPath);
            } else {
                this.showNotification(data.message || '文件上传失败', 'error');
            }
        } catch (error) {
            console.error('上传错误:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 返回上级目录
     */
    goBack() {
        if (this.currentPath) {
            const parentPath = this.currentPath.split('/').slice(0, -1).join('/');
            this.loadFiles(parentPath);
        }
    }

    /**
     * 更新面包屑导航
     */
    updateBreadcrumb() {
        const breadcrumbElement = document.getElementById('breadcrumb');
        if (!breadcrumbElement) return;

        const pathParts = this.currentPath ? this.currentPath.split('/') : [];
        let breadcrumbHtml = '<a href="#" class="breadcrumb-item text-blue-500 hover:text-blue-600 transition-colors" data-path=""><i class="fas fa-home mr-1"></i>根目录</a>';

        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += (index > 0 ? '/' : '') + part;
            breadcrumbHtml += ` <span class="text-gray-400 mx-2">/</span> <a href="#" class="breadcrumb-item text-blue-500 hover:text-blue-600 transition-colors" data-path="${currentPath}">${part}</a>`;
        });

        breadcrumbElement.innerHTML = breadcrumbHtml;

        // 绑定面包屑点击事件
        breadcrumbElement.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.target.getAttribute('data-path');
                this.loadFiles(path);
            });
        });
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        this.showNotification(isDark ? '已切换到暗色主题' : '已切换到亮色主题', 'info');
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        
        const typeStyles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-yellow-500 text-white'
        };

        const typeIcons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${typeStyles[type]}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${typeIcons[type]}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 隐藏动画
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * 路径拼接工具
     */
    joinPath(...parts) {
        return parts.filter(part => part).join('/').replace(/\/+/g, '/');
    }
}

// 初始化文件管理器
let fileManager;
document.addEventListener('DOMContentLoaded', () => {
    fileManager = new FileManager();
});
