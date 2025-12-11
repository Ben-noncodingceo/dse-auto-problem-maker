import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Tag, Brain, FileText } from 'lucide-react';
import KnowledgeManagement from './admin/KnowledgeManagement';
import AIProviderManagement from './admin/AIProviderManagement';
import SyllabusManagement from './admin/SyllabusManagement';

export default function AdminPage() {
  const location = useLocation();

  const tabs = [
    { path: '/admin/knowledge', label: '知识点管理', icon: Tag },
    { path: '/admin/ai-providers', label: 'AI 供应商', icon: Brain },
    { path: '/admin/syllabus', label: '大纲管理', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">管理后台</h1>

      {/* 标签导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                isActive(path)
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <Routes>
        <Route index element={<KnowledgeManagement />} />
        <Route path="knowledge" element={<KnowledgeManagement />} />
        <Route path="ai-providers" element={<AIProviderManagement />} />
        <Route path="syllabus" element={<SyllabusManagement />} />
      </Routes>
    </div>
  );
}
