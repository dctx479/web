// 增强版导航应用 - 完整版
class EnhancedNavApp {
  constructor() {
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.currentSearchEngine = localStorage.getItem('searchEngine') || 'baidu';
    this.visitStats = JSON.parse(localStorage.getItem('visitStats') || '{}');
    this.settings = JSON.parse(localStorage.getItem('navSettings') || '{}');
    
    // 搜索引擎配置
    this.searchEngines = {
      baidu: 'https://www.baidu.com/s?wd=',
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      haosou: 'https://www.so.com/s?q=',
      bilibili: 'https://search.bilibili.com/all?keyword=',
      github: 'https://github.com/search?q='
    };
    
    // 自定义网站数据
    this.customSites = JSON.parse(localStorage.getItem('customSites') || '[]');
    this.currentEditingSite = null;
  }

  // 初始化应用
  init() {
    this.bindEvents();
    this.loadSettings();
    this.updateStats();
    this.startClock();
    this.checkSystemDarkMode();
    this.loadCustomSites();
    this.updateWeatherDisplay();
    this.restoreSectionStates();
  }

  // 绑定所有事件
  bindEvents() {
    this.bindSearchEvents();
    this.bindToolbarEvents();
    this.bindModalEvents();
    this.bindVisitTracking();
    this.bindKeyboardShortcuts();
  }

  // 搜索相关事件
  bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });
    }

    // 搜索按钮点击事件
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          this.handleSearch(searchInput.value);
        }
      });
    }

    // 搜索引擎切换
    document.querySelectorAll('.search-engine').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchSearchEngine(e.target);
      });
    });
  }

  // 工具栏事件
  bindToolbarEvents() {
    const darkToggle = document.getElementById('darkModeToggle');
    const addBtn = document.getElementById('addSiteBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const weatherSettingsBtn = document.getElementById('weatherSettingsBtn');

    if (darkToggle) {
      darkToggle.addEventListener('click', () => this.toggleDarkMode());
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal('addSiteModal'));
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
    }

    if (weatherSettingsBtn) {
      weatherSettingsBtn.addEventListener('click', () => this.openModal('weatherModal'));
    }
  }

  // 模态框事件
  bindModalEvents() {
    // 添加网站表单
    const addForm = document.getElementById('addSiteForm');
    if (addForm) {
      addForm.addEventListener('submit', (e) => this.handleAddSite(e));
    }

    // 编辑网站表单
    const editForm = document.getElementById('editSiteForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleEditSite(e));
    }

    // 点击外部关闭模态框
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal') || e.target.classList.contains('close-btn')) {
        this.closeAllModals();
      }
    });
  }

  // 访问统计事件
  bindVisitTracking() {
    document.querySelectorAll('.site-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.site-stats') && !e.target.closest('.custom-site-actions')) {
          this.trackVisit(card.href);
        }
      });
    });
  }

  // 键盘快捷键
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
      }
      
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.toggleDarkMode();
      }
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.openModal('addSiteModal');
      }
      
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  // 处理搜索
  handleSearch(query) {
    if (!query.trim()) return;
    
    const searchUrl = this.searchEngines[this.currentSearchEngine] + encodeURIComponent(query);
    window.open(searchUrl, '_blank');
  }

  // 切换搜索引擎
  switchSearchEngine(btn) {
    document.querySelectorAll('.search-engine').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentSearchEngine = btn.dataset.engine;
    localStorage.setItem('searchEngine', this.currentSearchEngine);
  }

  // 切换深色模式
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode);
    
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) {
      icon.className = this.isDarkMode ? 'fa fa-sun-o' : 'fa fa-moon-o';
    }
    
    this.settings.darkMode = this.isDarkMode;
    this.saveSettings();
  }

  // 检查系统深色模式
  checkSystemDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      if (!this.settings.hasOwnProperty('darkMode')) {
        this.toggleDarkMode();
      }
    }
  }

  // 加载设置
  loadSettings() {
    if (this.isDarkMode) {
      document.body.classList.add('dark');
      const icon = document.querySelector('#darkModeToggle i');
      if (icon) icon.className = 'fa fa-sun-o';
    }

    if (this.settings.defaultSearchEngine) {
      this.currentSearchEngine = this.settings.defaultSearchEngine;
    }

    const engineBtn = document.querySelector(`[data-engine="${this.currentSearchEngine}"]`);
    if (engineBtn) {
      document.querySelectorAll('.search-engine').forEach(b => b.classList.remove('active'));
      engineBtn.classList.add('active');
    }

    const defaultEngineSelect = document.getElementById('defaultSearchEngine');
    if (defaultEngineSelect) {
      defaultEngineSelect.value = this.currentSearchEngine;
    }
  }

  // 保存设置
  saveSettings() {
    localStorage.setItem('navSettings', JSON.stringify(this.settings));
  }

  // 开始时钟
  startClock() {
    const updateTime = () => {
      const timeEl = document.getElementById('currentTime');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('zh-CN', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    };
    
    updateTime();
    setInterval(updateTime, 1000);
  }

  // 更新统计信息（简化版，只更新访问统计）
  updateStats() {
    document.querySelectorAll('.visit-count').forEach(el => {
      const card = el.closest('.site-card');
      if (card) {
        const visits = this.visitStats[card.href] || 0;
        el.textContent = visits;
      }
    });
  }

  // 跟踪访问
  trackVisit(url) {
    this.visitStats[url] = (this.visitStats[url] || 0) + 1;
    localStorage.setItem('visitStats', JSON.stringify(this.visitStats));
    this.updateStats();
  }

  // 更新天气显示
  updateWeatherDisplay() {
    const weatherCity = this.settings.weatherCity || '北京';
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
      // 这里可以集成真实的天气API
      weatherInfo.textContent = `${weatherCity} 22°C`;
    }
  }

  // 加载自定义网站
  loadCustomSites() {
    const customSitesGrid = document.getElementById('custom-sites');
    const customSitesSection = document.getElementById('customSitesSection');
    
    if (!customSitesGrid) return;

    if (this.customSites.length === 0) {
      customSitesSection.style.display = 'none';
      return;
    }

    customSitesSection.style.display = 'block';
    customSitesGrid.innerHTML = '';

    this.customSites.forEach((site, index) => {
      const siteCard = this.createCustomSiteCard(site, index);
      customSitesGrid.appendChild(siteCard);
    });

    // 重新绑定访问统计事件
    this.bindVisitTracking();
  }

  // 创建自定义网站卡片
  createCustomSiteCard(site, index) {
    const card = document.createElement('div');
    card.className = 'site-card custom-site-card';
    
    card.innerHTML = `
      <div class="custom-site-actions">
        <button class="edit-site-btn" onclick="event.stopPropagation(); app.editCustomSite(${index})" title="编辑">
          <i class="fa fa-edit"></i>
        </button>
      </div>
      <div class="site-icon" style="background-color: #3B82F6;">
        <i class="fa fa-star"></i>
      </div>
      <div class="site-name">${site.name}</div>
      <div class="site-url">${new URL(site.url).hostname}</div>
    `;

    // 添加点击事件到整个卡片
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-site-actions')) {
        window.open(site.url, '_blank');
      }
    });

    return card;
  }

  // 打开模态框
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      const firstInput = modal.querySelector('input, select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  // 关闭所有模态框
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('show');
    });
  }

  // 处理添加网站
  handleAddSite(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('siteName');
    const urlInput = document.getElementById('siteUrl');
    
    if (!nameInput || !urlInput) return;
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (name && url) {
      this.customSites.push({ name, url });
      localStorage.setItem('customSites', JSON.stringify(this.customSites));
      this.loadCustomSites();
      this.showNotification('网站添加成功！', 'success');
      this.closeAllModals();
      e.target.reset();
    } else {
      this.showNotification('请填写完整信息', 'error');
    }
  }

  // 编辑自定义网站
  editCustomSite(index) {
    this.currentEditingSite = index;
    const site = this.customSites[index];
    
    const nameInput = document.getElementById('editSiteName');
    const urlInput = document.getElementById('editSiteUrl');
    
    if (nameInput && urlInput) {
      nameInput.value = site.name;
      urlInput.value = site.url;
      this.openModal('editSiteModal');
    }
  }

  // 处理编辑网站
  handleEditSite(e) {
    e.preventDefault();
    
    if (this.currentEditingSite === null) return;
    
    const nameInput = document.getElementById('editSiteName');
    const urlInput = document.getElementById('editSiteUrl');
    
    if (!nameInput || !urlInput) return;
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    
    if (name && url) {
      this.customSites[this.currentEditingSite] = { name, url };
      localStorage.setItem('customSites', JSON.stringify(this.customSites));
      this.loadCustomSites();
      this.showNotification('网站更新成功！', 'success');
      this.closeAllModals();
      this.currentEditingSite = null;
    } else {
      this.showNotification('请填写完整信息', 'error');
    }
  }

  // 删除自定义网站
  deleteCustomSite() {
    if (this.currentEditingSite === null) return;
    
    if (confirm('确定要删除这个网站吗？')) {
      this.customSites.splice(this.currentEditingSite, 1);
      localStorage.setItem('customSites', JSON.stringify(this.customSites));
      this.loadCustomSites();
      this.showNotification('网站删除成功！', 'success');
      this.closeAllModals();
      this.currentEditingSite = null;
    }
  }

  // 显示通知
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '1001',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      background: type === 'success' ? '#10b981' : '#ef4444',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // 导出数据
  exportData() {
    const data = {
      settings: this.settings,
      visitStats: this.visitStats,
      customSites: this.customSites,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('数据导出成功！', 'success');
  }

  // 切换分区显示
  toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const button = event.target.closest('button');
    
    if (!section || !button) return;
    
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'grid' : 'none';
    
    const icon = button.querySelector('i');
    if (isHidden) {
      if (icon) icon.className = 'fa fa-eye';
      button.innerHTML = '<i class="fa fa-eye"></i> 收起';
    } else {
      if (icon) icon.className = 'fa fa-eye-slash';
      button.innerHTML = '<i class="fa fa-eye-slash"></i> 展开';
    }
    
    // 保存分区状态
    const sectionStates = JSON.parse(localStorage.getItem('sectionStates') || '{}');
    sectionStates[sectionId] = !isHidden;
    localStorage.setItem('sectionStates', JSON.stringify(sectionStates));
  }

  // 恢复分区状态
  restoreSectionStates() {
    const sectionStates = JSON.parse(localStorage.getItem('sectionStates') || '{}');
    const sections = ['ai-tools', 'email-services', 'cloud-services', 'video-sites', 'security-tools', 'dev-tools', 'finance-services', 'learning-resources'];
    
    sections.forEach(sectionId => {
      if (sectionStates.hasOwnProperty(sectionId) && !sectionStates[sectionId]) {
        const section = document.getElementById(sectionId);
        const button = document.querySelector(`[onclick="toggleSection('${sectionId}')"]`);
        
        if (section && button) {
          section.style.display = 'none';
          const icon = button.querySelector('i');
          if (icon) icon.className = 'fa fa-eye-slash';
          button.innerHTML = '<i class="fa fa-eye-slash"></i> 展开';
        }
      }
    });
  }
}

// 全局变量和函数
let app;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  app = new EnhancedNavApp();
  app.init();
});

// 全局函数
window.toggleSection = function(sectionId) {
  if (app) app.toggleSection(sectionId);
};

window.closeModal = function(modalId) {
  if (app) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  }
};

window.saveSettings = function() {
  if (!app) return;
  
  const defaultEngineSelect = document.getElementById('defaultSearchEngine');
  if (defaultEngineSelect) {
    app.settings.defaultSearchEngine = defaultEngineSelect.value;
    app.currentSearchEngine = defaultEngineSelect.value;
    localStorage.setItem('searchEngine', app.currentSearchEngine);
  }
  
  app.saveSettings();
  app.showNotification('设置保存成功！', 'success');
  app.closeAllModals();
};

window.saveWeatherSettings = function() {
  if (!app) return;
  
  const weatherCityInput = document.getElementById('weatherCity');
  if (weatherCityInput) {
    app.settings.weatherCity = weatherCityInput.value.trim();
    app.saveSettings();
    app.updateWeatherDisplay();
    app.showNotification('天气城市设置成功！', 'success');
    app.closeAllModals();
  }
};

window.exportData = function() {
  if (app) app.exportData();
};

window.deleteCustomSite = function() {
  if (app) app.deleteCustomSite();
};