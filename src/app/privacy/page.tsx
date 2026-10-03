import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-800 dark:text-gray-200 p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/home" className="text-purple-600 hover:underline mb-8 inline-block">
                    &larr; Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy for KuriAI</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: September 25, 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">1. Introduction</h2>
                    <p>
                        Welcome to KuriAI ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. 
                        This Privacy Policy explains how we collect, use, and share information about you when you use our web application (the "Service").
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">2. Information We Collect</h2>
                    <p>We collect information that you voluntarily provide to us when you register on the Service, including:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Information:</strong> Email address and name.</li>
                        <li><strong>User Content:</strong> The text of the tasks, categories, and descriptions you input into KuriAI.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">3. Artificial Intelligence Processing</h2>
                    <p>
                        When you use the "Organize with AI" feature, the text of your specific task is securely processed by Google's Gemini API to extract dates, categorize, and break down subtasks. 
                        Your data is not used to train global AI models.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">4. Data Retention and Deletion</h2>
                    <p>
                        You can delete your tasks and categories at any time from within the application. If you wish to delete your entire account and all associated data, 
                        contact us directly.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">5. Contact Us</h2>
                    <p>
                        If you have any questions or concerns about this Privacy Policy, please contact the developer.
                    </p>
                </section>
            </div>
        </div>
    );
}
