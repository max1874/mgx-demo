import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          MGX Demo
        </h1>
        <p className="text-gray-600 mb-6">
          AI 协同开发平台 - 开发环境已就绪
        </p>
        
        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-700 mb-2">技术栈:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Vite + React 18</li>
            <li>✓ TypeScript</li>
            <li>✓ Tailwind CSS</li>
            <li>✓ shadcn/ui</li>
          </ul>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            计数: {count}
          </button>
          <p className="text-xs text-gray-500">
            点击按钮测试 React 状态管理
          </p>
        </div>
      </div>
    </div>
  )
}

export default App