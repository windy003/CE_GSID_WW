document.addEventListener('DOMContentLoaded', async function() {
  const serverUrlInput = document.getElementById('serverUrl');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const currentServerDiv = document.getElementById('currentServer');
  const langZhBtn = document.getElementById('langZh');
  const langEnBtn = document.getElementById('langEn');

  // 等待国际化初始化完成
  await i18n.init();
  
  // 更新界面语言
  updateLanguageUI();
  
  // 加载已保存的服务器地址
  loadSavedServer();

  saveBtn.addEventListener('click', saveServerUrl);
  testBtn.addEventListener('click', testConnection);
  langZhBtn.addEventListener('click', () => switchLanguage('zh'));
  langEnBtn.addEventListener('click', () => switchLanguage('en'));
  serverUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveServerUrl();
    }
  });

  function loadSavedServer() {
    chrome.storage.sync.get(['serverUrl'], function(result) {
      if (result.serverUrl) {
        serverUrlInput.value = result.serverUrl;
        currentServerDiv.textContent = result.serverUrl;
      } else {
        currentServerDiv.textContent = i18n.t('notSet');
        serverUrlInput.value = 'http://localhost:5000';
      }
    });
  }

  function saveServerUrl() {
    const url = serverUrlInput.value.trim();
    
    if (!url) {
      showStatus(i18n.t('enterUrl'), 'error');
      return;
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      showStatus(i18n.t('invalidUrl'), 'error');
      return;
    }

    // 确保URL以斜杠结尾
    const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    chrome.storage.sync.set({ serverUrl: normalizedUrl }, function() {
      currentServerDiv.textContent = normalizedUrl;
      showStatus(i18n.t('saved'), 'success');
      
      // 通知内容脚本服务器地址已更新
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url.includes('github.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'serverUpdated',
            serverUrl: normalizedUrl
          }).catch(() => {
            // 忽略错误，内容脚本可能还未加载
          });
        }
      });
    });
  }

  function testConnection() {
    const url = serverUrlInput.value.trim();
    
    if (!url) {
      showStatus(i18n.t('enterUrlFirst'), 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = i18n.t('testing');
    showStatus(i18n.t('connecting'), 'success');

    // 测试服务器连接
    fetch(`${url}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    })
    .then(data => {
      showStatus(i18n.t('connectSuccess'), 'success');
    })
    .catch(error => {
      showStatus(`${i18n.t('connectFailed')}: ${error.message}`, 'error');
    })
    .finally(() => {
      testBtn.disabled = false;
      testBtn.textContent = i18n.t('testConnection');
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  function switchLanguage(locale) {
    i18n.setLocale(locale);
    updateLanguageUI();
    
    // 重新加载服务器状态显示
    loadSavedServer();
    
    // 通知content script语言已更改
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('github.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'localeChanged',
          locale: locale
        }).catch(() => {
          // 忽略错误，内容脚本可能还未加载
        });
      }
    });
  }

  function updateLanguageUI() {
    // 更新语言按钮状态
    const currentLocale = i18n.getCurrentLocale();
    langZhBtn.classList.toggle('active', currentLocale === 'zh');
    langEnBtn.classList.toggle('active', currentLocale === 'en');
    
    // 更新所有国际化文本
    i18n.updateUI();
    
    // 更新按钮文本
    saveBtn.textContent = i18n.t('save');
    testBtn.textContent = i18n.t('testConnection');
  }
});