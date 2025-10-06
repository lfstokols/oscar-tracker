import {QueryClientConfig} from '@tanstack/react-query';

export default {
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
      staleTime: 1000 * 10, //* 10 seconds
      // staleTime: 100
    },
  },
} satisfies QueryClientConfig;
