// 国际化配置和函数
class I18n {
  constructor() {
    this.currentLocale = 'zh';
    this.messages = {
      'zh': {
        'title': 'GitHub代码统计',
        'subtitle': '配置统计服务器地址',
        'currentServer': '当前服务器',
        'serverAddress': '服务器地址',
        'save': '保存',
        'testConnection': '测试连接',
        'notSet': '未设置',
        'testing': '测试中...',
        'connectSuccess': '连接成功！服务器正常运行',
        'connectFailed': '连接失败',
        'saved': '服务器地址已保存',
        'enterUrl': '请输入服务器地址',
        'invalidUrl': '请输入有效的URL地址',
        'enterUrlFirst': '请先输入服务器地址',
        'connecting': '正在测试连接...',
        'serverUpdated': '服务器地址已更新',
        'languageSettings': '语言设置',
        'chinese': '中文',
        'english': 'English'
      },
      'en': {
        'title': 'GitHub Code Statistics',
        'subtitle': 'Configure Statistics Server Address',
        'currentServer': 'Current Server',
        'serverAddress': 'Server Address',
        'save': 'Save',
        'testConnection': 'Test Connection',
        'notSet': 'Not Set',
        'testing': 'Testing...',
        'connectSuccess': 'Connection successful! Server is running normally',
        'connectFailed': 'Connection failed',
        'saved': 'Server address has been saved',
        'enterUrl': 'Please enter server address',
        'invalidUrl': 'Please enter a valid URL address',
        'enterUrlFirst': 'Please enter server address first',
        'connecting': 'Testing connection...',
        'serverUpdated': 'Server address has been updated',
        'languageSettings': 'Language Settings',
        'chinese': '中文',
        'english': 'English'
      }
    };
    
    this.init();
  }

  async init() {
    // 从存储中加载语言设置
    await this.loadLocale();
    // 检测浏览器语言作为默认值
    this.detectBrowserLanguage();
  }

  async loadLocale() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['locale'], (result) => {
        if (result.locale && this.messages[result.locale]) {
          this.currentLocale = result.locale;
        }
        resolve();
      });
    });
  }

  detectBrowserLanguage() {
    if (!chrome.storage) return; // 如果没有设置过语言
    
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('zh')) {
      this.currentLocale = 'zh';
    } else {
      this.currentLocale = 'en';
    }
  }

  setLocale(locale) {
    if (this.messages[locale]) {
      this.currentLocale = locale;
      // 保存到存储
      chrome.storage.sync.set({ locale: locale });
      // 更新界面
      this.updateUI();
    }
  }

  t(key, params = {}) {
    let message = this.messages[this.currentLocale][key] || this.messages['zh'][key] || key;
    
    // 支持参数替换
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param]);
    });
    
    return message;
  }

  getCurrentLocale() {
    return this.currentLocale;
  }

  updateUI() {
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (element.tagName === 'INPUT' && element.type !== 'button') {
        element.placeholder = this.t(key);
      } else {
        element.textContent = this.t(key);
      }
    });

    // 更新带有 data-i18n-attr 属性的元素的属性值
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrConfig = element.getAttribute('data-i18n-attr');
      const [attr, key] = attrConfig.split(':');
      element.setAttribute(attr, this.t(key));
    });
  }
}

// 创建全局实例
const i18n = new I18n();

// 导出供其他脚本使用
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}