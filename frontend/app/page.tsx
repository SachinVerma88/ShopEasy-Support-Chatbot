import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ShopEasy Support</h1>
            <p className="text-sm text-gray-500">AI-powered customer support</p>
          </div>
        </div>
      </header>
      <ChatWidget />
    </main>
  );
}
