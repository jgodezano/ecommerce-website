import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-bold text-accent-500">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved. Please check the URL or browse our products.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
