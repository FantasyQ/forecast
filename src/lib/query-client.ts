import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 分鐘
        gcTime: 1000 * 60 * 10, // 10 分鐘
      },
    },
  });
}
