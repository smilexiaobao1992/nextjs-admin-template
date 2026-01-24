import AppSidebar from "@/components/layout/app-sidebar";
import UserHeader from "@/components/layout/user-header";

export default function DashboardPage() {
  return (
    <>
      <AppSidebar />
      <UserHeader />
      <main className="ml-56 mt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总内容</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">128</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">活跃用户</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">24</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">今日访问</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,234</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">转化率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12.5%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              快速开始
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li>• 修改 <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">src/components/layout/app-sidebar.tsx</code> 来自定义导航菜单</li>
              <li>• 在 <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">src/lib/db/schema.ts</code> 中添加数据库表</li>
              <li>• 在 <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">src/app/app</code> 中添加新的页面</li>
              <li>• 使用 <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">src/components/ui</code> 中的组件构建界面</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
