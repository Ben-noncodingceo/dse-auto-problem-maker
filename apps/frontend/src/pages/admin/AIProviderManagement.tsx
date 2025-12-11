import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import { getAIProviders, type AIProvider } from '@/lib/api';

export default function AIProviderManagement() {
  const { data: providersData, isLoading } = useQuery({
    queryKey: ['aiProviders'],
    queryFn: getAIProviders,
  });

  const providers = providersData?.data || [];

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
        <h2 className="text-xl font-semibold text-gray-900">AI 供应商配置</h2>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center">
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
                    <div className="text-sm font-medium text-gray-900">
                      {provider.providerName}
                    </div>
                    {provider.isDefault && (
                      <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{provider.modelName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    正常
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary-600 hover:text-primary-900 mr-4">
                    编辑
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {providers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无 AI 供应商配置，请先添加
          </div>
        )}
      </div>
    </div>
  );
}
