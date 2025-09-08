# Flask应用国际化支持
import os
import json
from flask import request, session

class I18n:
    def __init__(self, app=None, default_locale='zh'):
        self.default_locale = default_locale
        self.translations = {}
        self.app = app
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        self.load_translations()
        
        # 添加全局函数到模板上下文
        @app.context_processor
        def inject_i18n():
            return dict(t=self.t, get_locale=self.get_locale)
    
    def load_translations(self):
        """加载翻译文件"""
        translations_dir = os.path.join(os.path.dirname(__file__), 'translations')
        
        # 如果translations目录不存在，创建默认翻译
        if not os.path.exists(translations_dir):
            os.makedirs(translations_dir)
            self.create_default_translations(translations_dir)
        
        # 清空现有翻译，重新加载
        self.translations.clear()
        
        # 加载翻译文件
        for filename in os.listdir(translations_dir):
            if filename.endswith('.json'):
                locale = filename[:-5]  # 移除.json扩展名
                filepath = os.path.join(translations_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        self.translations[locale] = json.load(f)
                        print(f"Loaded translations for {locale}: {len(self.translations[locale])} keys")
                except Exception as e:
                    print(f"Error loading translation file {filepath}: {e}")
        
        print(f"Available locales: {list(self.translations.keys())}")
    
    def create_default_translations(self, translations_dir):
        """创建默认的翻译文件"""
        zh_translations = {
            'title': 'GitHub 代码统计分析器',
            'subtitle': '在线分析GitHub仓库的代码统计信息',
            'repo_url_label': 'GitHub仓库地址',
            'repo_url_placeholder': '例如：https://github.com/microsoft/vscode',
            'repo_url_hint': '请输入完整的GitHub仓库URL地址',
            'analyze_button': '开始分析',
            'analyzing': '正在分析中，请稍候...',
            'error_invalid_url': '请输入有效的GitHub仓库URL地址',
            'error_repo_not_found': '仓库未找到或无法访问',
            'error_analysis_failed': '分析失败',
            'retry_button': '重试',
            'total_lines': '总行数',
            'total_files': '文件数量',
            'languages': '编程语言',
            'file_types': '文件类型分布',
            'analysis_complete': '分析完成',
            'download_report': '下载报告',
            'language_settings': '语言设置',
            'chinese': '中文',
            'english': 'English',
            'recent_analysis': '最近分析',
            'no_recent_analysis': '暂无分析记录',
            'file_structure': '文件结构',
            'folder': '文件夹',
            'file': '文件',
            'lines': '行',
            'root_directory': '根目录',
            'expand_folder': '展开文件夹',
            'collapse_folder': '收缩文件夹'
        }
        
        en_translations = {
            'title': 'GitHub Code Statistics Analyzer',
            'subtitle': 'Online analysis of GitHub repository code statistics',
            'repo_url_label': 'GitHub Repository URL',
            'repo_url_placeholder': 'e.g.: https://github.com/microsoft/vscode',
            'repo_url_hint': 'Please enter the complete GitHub repository URL',
            'analyze_button': 'Start Analysis',
            'analyzing': 'Analyzing, please wait...',
            'error_invalid_url': 'Please enter a valid GitHub repository URL',
            'error_repo_not_found': 'Repository not found or inaccessible',
            'error_analysis_failed': 'Analysis failed',
            'retry_button': 'Retry',
            'total_lines': 'Total Lines',
            'total_files': 'Total Files',
            'languages': 'Programming Languages',
            'file_types': 'File Type Distribution',
            'analysis_complete': 'Analysis Complete',
            'download_report': 'Download Report',
            'language_settings': 'Language Settings',
            'chinese': '中文',
            'english': 'English',
            'recent_analysis': 'Recent Analysis',
            'no_recent_analysis': 'No recent analysis records',
            'file_structure': 'File Structure',
            'folder': 'Folder',
            'file': 'File',
            'lines': 'lines',
            'root_directory': 'Root Directory',
            'expand_folder': 'Expand folder',
            'collapse_folder': 'Collapse folder'
        }
        
        # 写入翻译文件
        with open(os.path.join(translations_dir, 'zh.json'), 'w', encoding='utf-8') as f:
            json.dump(zh_translations, f, ensure_ascii=False, indent=2)
        
        with open(os.path.join(translations_dir, 'en.json'), 'w', encoding='utf-8') as f:
            json.dump(en_translations, f, ensure_ascii=False, indent=2)
        
        # 直接加载到内存中
        self.translations['zh'] = zh_translations
        self.translations['en'] = en_translations
    
    def get_locale(self):
        """获取当前语言设置"""
        # 优先使用URL参数中的语言设置
        if 'lang' in request.args:
            lang = request.args.get('lang')
            if lang in self.translations:
                session['locale'] = lang
                return lang
        
        # 其次使用session中的语言设置
        if 'locale' in session and session['locale'] in self.translations:
            return session['locale']
        
        # 最后使用浏览器Accept-Language头
        return request.accept_languages.best_match(
            list(self.translations.keys())
        ) or self.default_locale
    
    def t(self, key, **kwargs):
        """翻译函数"""
        locale = self.get_locale()
        
        # 获取翻译文本
        text = self.translations.get(locale, {}).get(key)
        if text is None:
            # 回退到默认语言
            text = self.translations.get(self.default_locale, {}).get(key, key)
        
        # 支持参数替换
        if kwargs:
            try:
                text = text.format(**kwargs)
            except (KeyError, ValueError):
                pass
        
        return text
    
    def get_available_locales(self):
        """获取可用的语言列表"""
        return list(self.translations.keys())

# 全局实例
i18n = I18n()