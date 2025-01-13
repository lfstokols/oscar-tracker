import {QueryClientConfig} from '@tanstack/react-query';

export default {
    defaultOptions: {
            queries: {
            experimental_prefetchInRender: true,
        },
    },
} satisfies QueryClientConfig;