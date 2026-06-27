"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-bold text-red-500">!</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Please try again or go back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
