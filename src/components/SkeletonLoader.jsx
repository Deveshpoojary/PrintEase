import React from 'react';

const SkeletonLoader = ({ className = "", children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

const SkeletonCard = () => (
  <SkeletonLoader className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-300 rounded-xl shimmer"></div>
      <div className="h-6 bg-gray-300 rounded w-32 shimmer"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-300 rounded w-full shimmer"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 shimmer"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 shimmer"></div>
    </div>
  </SkeletonLoader>
);

const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <SkeletonLoader className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/40 shadow-xl">
    <div className="h-8 bg-gray-300 rounded w-48 mb-6 shimmer"></div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="text-left p-3">
                <div className="h-4 bg-gray-300 rounded w-20 shimmer"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-full shimmer"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SkeletonLoader>
);

const SkeletonForm = () => (
  <SkeletonLoader className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-xl">
    <div className="h-8 bg-gray-300 rounded w-48 mb-6 shimmer"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-24 shimmer"></div>
          <div className="h-12 bg-gray-200 rounded-xl shimmer"></div>
        </div>
      ))}
    </div>
    <div className="mt-8 flex justify-center">
      <div className="h-12 bg-gray-300 rounded-2xl w-48 shimmer"></div>
    </div>
  </SkeletonLoader>
);

export { SkeletonLoader, SkeletonCard, SkeletonTable, SkeletonForm };