// src/components/Skeleton.tsx - Beautiful Shimmer Loading Skeletons
import { motion } from "framer-motion";

// Base skeleton with shimmer effect
function SkeletonBase({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[#e8e0d5] rounded-lg ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Book Card Skeleton
export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#e8e0d5]">
      <SkeletonBase className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <SkeletonBase className="h-5 w-3/4" />
        <SkeletonBase className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <SkeletonBase className="h-6 w-20" />
          <SkeletonBase className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Chat List Item Skeleton
export function ChatItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[#e8e0d5]">
      <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-3 w-2/3" />
      </div>
      <SkeletonBase className="h-3 w-16" />
    </div>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6">
      <SkeletonBase className="w-20 h-20 rounded-full" />
      <div className="flex-1 space-y-3">
        <SkeletonBase className="h-6 w-1/2" />
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Store Card Skeleton
export function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#e8e0d5] p-4">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBase className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 w-2/3" />
          <SkeletonBase className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonBase className="h-24 rounded-xl" />
      <div className="mt-3 flex gap-2">
        <SkeletonBase className="h-6 w-16 rounded-full" />
        <SkeletonBase className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Notification Item Skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-[#e8e0d5]">
      <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-1/4" />
      </div>
    </div>
  );
}

// Community Post Skeleton
export function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-[#e8e0d5]">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBase className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-1/3" />
          <SkeletonBase className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-5/6" />
        <SkeletonBase className="h-4 w-4/6" />
      </div>
      <SkeletonBase className="h-48 rounded-xl mb-4" />
      <div className="flex gap-4">
        <SkeletonBase className="h-8 w-16 rounded-lg" />
        <SkeletonBase className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Grid of Book Cards
export function BookGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

// List of Chat Items
export function ChatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <ChatItemSkeleton key={i} />
      ))}
    </div>
  );
}

export default SkeletonBase;
