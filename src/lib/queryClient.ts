import { QueryClient } from '@tanstack/react-query';

interface QueryError {
  status?: number;
  message?: string;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: (failureCount, error: QueryError) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});