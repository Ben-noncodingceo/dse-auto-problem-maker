import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Edit, Trash2 } from 'lucide-react';
import { getKnowledgeCategories, type KnowledgeCategory } from '@/lib/api';

export default function KnowledgeManagement() {
  const queryClient = useQueryClient();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['knowledgeCategories'],
    queryFn: getKnowledgeCategories,
  });

  const categories = categoriesData?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">知识点体系</h2>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加一级目录
        </button>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {categories.map((category: KnowledgeCategory) => (
          <div key={category.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-gray-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {category.tags && category.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无知识点标签</p>
            )}

            <button className="mt-3 text-sm text-primary-600 hover:text-primary-700">
              + 添加知识点标签
            </button>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无知识点分类，请先添加一级目录
          </div>
        )}
      </div>

      {/* 添加分类对话框（简化版） */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">添加一级知识目录</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入目录名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // TODO: 实现创建逻辑
                  alert('创建功能待实现');
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
