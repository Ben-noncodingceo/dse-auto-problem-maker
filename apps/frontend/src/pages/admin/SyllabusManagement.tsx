import { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  getSyllabusSources,
  uploadSyllabusPDF,
  addSyllabusUrl,
  parseSyllabusSource,
  type SyllabusSource,
} from '../../lib/api';

export default function SyllabusManagement() {
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [sources, setSources] = useState<SyllabusSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载大纲列表
  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const result = await getSyllabusSources();
      setSources(result.data || []);
      setInitError(null);
    } catch (err) {
      console.error('Failed to load syllabus sources:', err);
      setInitError(err instanceof Error ? err.message : '加载大纲列表失败');
    }
  };

  // 处理 URL 导入
  const handleUrlSubmit = async () => {
    if (!syllabusUrl.trim()) {
      setError('请输入有效的 URL');
      return;
    }

    setUrlLoading(true);
    setError(null);

    try {
      await addSyllabusUrl(syllabusUrl);
      setSyllabusUrl('');
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setUrlLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (file.type !== 'application/pdf') {
      setError('仅支持 PDF 格式');
      return;
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      await uploadSyllabusPDF(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 重新加载列表
      await loadSources();

      // 重置状态
      setTimeout(() => {
        setUploadProgress(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // 手动触发解析
  const handleParse = async (id: string) => {
    try {
      await parseSyllabusSource(id);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 格式化时间
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 状态图标和文本
  const getStatusDisplay = (status: SyllabusSource['status']) => {
    switch (status) {
      case 'PENDING':
        return { icon: <AlertCircle className="h-5 w-5 text-yellow-500" />, text: '待解析', color: 'text-yellow-600' };
      case 'PROCESSING':
        return { icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />, text: '解析中', color: 'text-blue-600' };
      case 'COMPLETED':
        return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: '已完成', color: 'text-green-600' };
      case 'FAILED':
        return { icon: <XCircle className="h-5 w-5 text-red-500" />, text: '失败', color: 'text-red-600' };
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">大纲管理</h2>

      {initError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="font-medium">⚠️ 后端服务连接失败</p>
          <p className="text-sm mt-1">{initError}</p>
          <p className="text-sm mt-2">可能原因：后端 Worker 尚未部署或配置不正确</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 通过 URL 导入 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <LinkIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">从 URL 导入大纲</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            输入 HKDSE 物理大纲的在线链接，系统将自动解析
          </p>
          <input
            type="url"
            value={syllabusUrl}
            onChange={(e) => setSyllabusUrl(e.target.value)}
            placeholder="https://example.com/dse-physics-syllabus.pdf"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={urlLoading}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={urlLoading || !syllabusUrl.trim()}
            className={`w-full px-4 py-2 rounded-md transition-colors ${
              urlLoading || !syllabusUrl.trim()
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {urlLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导入中...
              </span>
            ) : (
              '开始解析'
            )}
          </button>
        </div>

        {/* 上传 PDF */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Upload className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">上传 PDF 大纲</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            上传 HKDSE 物理大纲 PDF 文件，系统将自动提取知识点
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="pdf-upload"
            disabled={loading}
          />

          <label
            htmlFor="pdf-upload"
            className={`border-2 border-dashed rounded-lg p-8 text-center block cursor-pointer transition-colors ${
              loading
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            {uploadProgress !== null ? (
              <div className="space-y-3">
                <Loader2 className="h-12 w-12 text-primary-600 mx-auto animate-spin" />
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">上传中... {uploadProgress}%</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">点击上传 PDF 文件</p>
                <p className="text-xs text-gray-500">支持 PDF 格式，最大 10MB</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* 已导入的大纲列表 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">已导入的大纲</h3>

        {sources.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无大纲数据，请先导入
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => {
              const statusDisplay = getStatusDisplay(source.status);
              return (
                <div
                  key={source.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {source.type === 'PDF' ? (
                        <FileText className="h-6 w-6 text-gray-400 mt-1" />
                      ) : (
                        <LinkIcon className="h-6 w-6 text-gray-400 mt-1" />
                      )}

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {source.fileName || source.url || '未命名'}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {statusDisplay.icon}
                            <span className={`text-sm font-medium ${statusDisplay.color}`}>
                              {statusDisplay.text}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1">
                          {source.type === 'PDF' && (
                            <p>大小: {formatFileSize(source.fileSize)}</p>
                          )}
                          <p>创建时间: {formatDate(source.createdAt)}</p>
                          {source.parsedAt && (
                            <p>解析完成: {formatDate(source.parsedAt)}</p>
                          )}
                          {source.errorMessage && (
                            <p className="text-red-600">错误: {source.errorMessage}</p>
                          )}
                        </div>

                        {source.parsedData && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p>
                              已提取 {source.parsedData.categories?.length || 0} 个知识点分类
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {source.status === 'PENDING' && (
                      <button
                        onClick={() => handleParse(source.id)}
                        className="ml-4 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        开始解析
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
