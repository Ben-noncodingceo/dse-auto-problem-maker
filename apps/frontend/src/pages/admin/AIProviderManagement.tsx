import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Edit, Trash2, X } from 'lucide-react';
import {
  getAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  type AIProvider,
} from '../../lib/api';

// AI 供应商预设配置
const PROVIDER_PRESETS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    description: 'DeepSeek 深度求索 - 性价比极高的 AI 模型',
  },
  GEMINI: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelName: 'gemini-pro',
    description: 'Google Gemini - 强大的多模态 AI 模型',
  },
  CHATGPT: {
    name: 'OpenAI ChatGPT',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4-turbo-preview',
    description: 'OpenAI ChatGPT - 业界领先的 AI 模型',
  },
  TONGYI: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api',
    modelName: 'qwen-turbo',
    description: '阿里云通义千问 - 中文优化的 AI 模型',
  },
  DOUBAO: {
    name: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    modelName: 'doubao-pro',
    description: '字节跳动豆包 - 高性能中文 AI 模型',
  },
};

export default function AIProviderManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [formData, setFormData] = useState({
    providerName: 'DEEPSEEK',
    baseUrl: '',
    modelName: '',
    apiKey: '',
    isDefault: false,
    timeoutMs: 30000,
  });

  const { data: providersData, isLoading } = useQuery({
    queryKey: ['aiProviders'],
    queryFn: getAIProviders,
  });

  const createMutation = useMutation({
    mutationFn: createAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAIProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setShowModal(false);
      setEditingProvider(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
    },
  });

  const providers = providersData?.data || [];

  const resetForm = () => {
    setFormData({
      providerName: 'DEEPSEEK',
      baseUrl: '',
      modelName: '',
      apiKey: '',
      isDefault: false,
      timeoutMs: 30000,
    });
  };

  const handleProviderChange = (providerName: string) => {
    const preset = PROVIDER_PRESETS[providerName as keyof typeof PROVIDER_PRESETS];
    if (preset) {
      setFormData({
        ...formData,
        providerName,
        baseUrl: preset.baseUrl,
        modelName: preset.modelName,
      });
    } else {
      setFormData({ ...formData, providerName });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setFormData({
      providerName: provider.providerName,
      baseUrl: '',
      modelName: provider.modelName,
      apiKey: '', // 不回显 API Key
      isDefault: provider.isDefault,
      timeoutMs: 30000,
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个 AI 供应商配置吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenModal = () => {
    resetForm();
    setEditingProvider(null);
    setShowModal(true);
  };

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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI 供应商配置</h2>
          <p className="text-sm text-gray-600 mt-1">
            配置用于题目生成和批改的 AI 模型
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加供应商
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                供应商
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                模型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((provider: AIProvider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {PROVIDER_PRESETS[provider.providerName as keyof typeof PROVIDER_PRESETS]?.name || provider.providerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {provider.providerName}
                      </div>
                    </div>
                    {provider.isDefault && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        默认
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{provider.modelName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    已配置
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(provider)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    <Edit className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(provider.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {providers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">暂无 AI 供应商配置</p>
            <p className="text-sm">请点击上方按钮添加供应商配置</p>
          </div>
        )}
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingProvider ? '编辑 AI 供应商' : '添加 AI 供应商'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProvider(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  供应商类型 *
                </label>
                <select
                  value={formData.providerName}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.name} - {preset.description}
                    </option>
                  ))}
                  <option value="CUSTOM">自定义供应商</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://api.example.com/v1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  API 的基础 URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称 *
                </label>
                <input
                  type="text"
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="gpt-4-turbo-preview"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="sk-..."
                  required={!editingProvider}
                />
                {editingProvider && (
                  <p className="text-xs text-gray-500 mt-1">
                    留空则不更新 API Key
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  超时时间（毫秒）
                </label>
                <input
                  type="number"
                  value={formData.timeoutMs}
                  onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1000"
                  max="120000"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  设为默认供应商
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </span>
                  ) : (
                    editingProvider ? '更新' : '添加'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
