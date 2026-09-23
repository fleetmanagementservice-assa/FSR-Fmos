import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. TOP PIPELINE NODE FLOW BAR SKELETON */}
      <div className="rounded-2xl border border-gray-100 bg-slate-50 p-6 shadow-xs dark:border-gray-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-[10%] right-[10%] top-[25px] h-[3px] bg-slate-200 dark:bg-slate-800" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative z-10">
              <div className="h-[54px] w-[54px] rounded-full bg-slate-200 dark:bg-slate-700 shadow-sm" />
              <div className="mt-3 h-4 w-8 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN GRID WORKSPACE SKELETON */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN SKELETON */}
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Status Box */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-950">
            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/50">
                  <div className="flex justify-between items-start">
                    <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-6 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Active Tasks Box */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-950">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 w-full rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN SKELETON */}
        <div className="xl:col-span-9 space-y-6">
          {/* Journey Tracker & Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-950 min-h-[300px] flex flex-col">
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800 mb-8" />
              <div className="flex-1 space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-950 min-h-[300px] flex flex-col">
              <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50" />
            </div>
          </div>
          
          {/* Table Row */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-950">
            <div className="flex justify-between items-center mb-6">
               <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
               <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-800/80" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 w-full rounded bg-slate-50 dark:bg-slate-900/40" />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
