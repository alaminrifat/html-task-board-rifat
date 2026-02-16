import { AlertCircle, Inbox } from 'lucide-react';

import type { ReactNode } from 'react';

interface DataStateProps<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null | undefined;
  isEmpty?: (data: T) => boolean;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

function DefaultLoading() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="h-4 w-3/4 rounded bg-[#E5E7EB] animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-[#E5E7EB] animate-pulse" />
      <div className="h-20 w-full rounded bg-[#E5E7EB] animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[#E5E7EB] animate-pulse" />
      <div className="h-20 w-full rounded bg-[#E5E7EB] animate-pulse" />
    </div>
  );
}

function DefaultError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <p className="text-sm text-red-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-[#4A90D9] rounded-lg hover:bg-[#4A90D9]/90 transition-colors"
        >
          Try Again
        </button>
      ) : null}
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="h-10 w-10 text-[#94A3B8]" />
      <p className="text-sm text-[#64748B]">No items found</p>
    </div>
  );
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  return false;
}

export default function DataState<T>({
  isLoading,
  error,
  data,
  isEmpty = defaultIsEmpty,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  children,
}: DataStateProps<T>) {
  if (isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  if (error) {
    return <>{errorComponent ?? <DefaultError message={error} onRetry={onRetry} />}</>;
  }

  if (data == null || isEmpty(data)) {
    return <>{emptyComponent ?? <DefaultEmpty />}</>;
  }

  return <>{children(data)}</>;
}
