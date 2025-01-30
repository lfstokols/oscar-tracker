/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_RUN_DEBUG: boolean;
    readonly VITE_PORT: number;
    readonly VITE_ROUTE_BASENAME: string;
    readonly VITE_BUILD_BASE_URL: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

