import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
            <main className="max-w-3xl text-center space-y-8">
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Welcome to <span className="text-purple-600 dark:text-purple-400">KuriAI</span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    KuriAI is an intelligent task management application designed to help you organize your daily life. 
                    Using AI, KuriAI breaks down complex goals into manageable subtasks, extracts due dates naturally from your text, 
                    and seamlessly categorizes your workflow.
                </p>
                
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 text-left">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Core Features & Purpose</h2>
                    <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                        <li className="flex items-start">
                            <span className="text-purple-500 mr-3">✨</span>
                            <span><strong>AI Task Decomposition:</strong> Automatically split large, overwhelming goals into step-by-step action items.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-500 mr-3">📅</span>
                            <span><strong>Google Calendar Sync:</strong> Optional integration to export your tasks directly to your Google Calendar so you never miss a deadline.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-purple-500 mr-3">📂</span>
                            <span><strong>Smart Categorization:</strong> Automatically tag and sort tasks into the appropriate lists based on context.</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <Link 
                        href="/login" 
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/30"
                    >
                        Go to App / Log In
                    </Link>
                    <Link 
                        href="/privacy" 
                        className="px-8 py-3 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 font-medium rounded-xl transition-colors"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </main>
        </div>
    );
}
