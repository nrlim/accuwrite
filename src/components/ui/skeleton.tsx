import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  )
}

function SkeletonTableRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between border-b px-4 py-3 gap-6", className)}>
      <Skeleton className="h-4 w-[120px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonTableRow }
