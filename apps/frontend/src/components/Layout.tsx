import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Settings, Home } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                DSE 物理出题系统
              </span>
            </div>

            <nav className="flex space-x-4">
              <Link
                to="/generate"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/generate')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4 mr-1" />
                生成题目
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive('/admin')
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4 mr-1" />
                管理后台
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2024 DSE Auto Problem Maker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
