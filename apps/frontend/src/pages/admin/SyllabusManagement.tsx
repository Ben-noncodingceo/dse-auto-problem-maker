import { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

export default function SyllabusManagement() {
  const [syllabusUrl, setSyllabusUrl] = useState('');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">大纲管理</h2>

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
            placeholder="https://example.com/dse-physics-syllabus"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          />
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
          >
            开始解析（开发中）
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">拖放文件到此处，或点击上传</p>
            <p className="text-xs text-gray-500">支持 PDF 格式，最大 10MB</p>
          </div>
        </div>
      </div>

      {/* 已导入的大纲列表 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">已导入的大纲</h3>
        <div className="text-center text-gray-500 py-8">
          暂无大纲数据，请先导入
        </div>
      </div>
    </div>
  );
}
