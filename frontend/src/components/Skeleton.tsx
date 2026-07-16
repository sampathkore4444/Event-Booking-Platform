import React from 'react';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'avatar';
type SkeletonAnimation = 'pulse' | 'shimmer';

interface SkeletonProps {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const animationClasses: Record<SkeletonAnimation, string> = {
    pulse: 'animate-pulse bg-gray-200 dark:bg-gray-700',
    shimmer:
      'relative overflow-hidden bg-gray-200 dark:bg-gray-700 ' +
      'after:absolute after:inset-0 after:translate-x-[-100%] ' +
      'after:animate-[shimmer_1.5s_infinite] ' +
      "after:bg-gradient-to-r after:from-transparent after:via-white/40 dark:after:via-white/10 after:to-transparent",
  };

  const variantClasses: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
    avatar: 'rounded-full w-10 h-10',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
};

// ── Composed skeleton components for common patterns ──

export const ReviewSkeleton: React.FC = () => (
  <div className="animate-pulse dark:opacity-80">
    {/* Header row */}
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton variant="text" width={180} height={28} />
        <div className="flex items-center gap-2">
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width={80} height={16} />
        </div>
      </div>
      <Skeleton variant="rectangular" width={130} height={36} />
    </div>

    {/* Rating distribution skeleton */}
    <div className="card p-6 mb-6">
      <div className="flex items-start gap-6">
        <Skeleton variant="circular" width={90} height={90} />
        <div className="flex-1 space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="text" width={12} height={12} />
              <Skeleton variant="rectangular" height={10} className="flex-1" />
              <Skeleton variant="text" width={28} height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Review cards */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start gap-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" width={120} height={16} />
                <Skeleton variant="text" width={60} height={12} />
              </div>
              <Skeleton variant="text" width={90} height={14} />
              <Skeleton variant="text" width="100%" height={14} />
              <Skeleton variant="text" width="70%" height={14} />
              <Skeleton variant="text" width={80} height={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AnalyticsSkeleton: React.FC = () => (
  <div className="animate-pulse dark:opacity-80">
    {/* Header */}
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-2">
        <Skeleton variant="text" width={240} height={32} />
        <Skeleton variant="text" width={180} height={16} />
      </div>
      <div className="flex gap-2">
        {[7, 30, 90].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={48} height={36} />
        ))}
      </div>
    </div>

    {/* Stats cards grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton variant="rectangular" width={40} height={40} className="mb-3" />
          <Skeleton variant="text" width={80} height={28} className="mb-1" />
          <Skeleton variant="text" width={100} height={14} />
        </div>
      ))}
    </div>

    {/* Sales chart skeleton */}
    <div className="card p-6 mb-8">
      <Skeleton variant="text" width={160} height={20} className="mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="text" width={60} height={12} />
            <Skeleton
              variant="rectangular"
              height={24}
              style={{ width: `${40 + Math.random() * 50}%` }}
            />
            <Skeleton variant="text" width={80} height={12} />
          </div>
        ))}
      </div>
    </div>

    {/* Top events skeleton */}
    <div className="card p-6">
      <Skeleton variant="text" width={200} height={20} className="mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <Skeleton variant="text" width={`${50 + Math.random() * 30}%`} height={16} />
            <Skeleton variant="text" width={60} height={16} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
