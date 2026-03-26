/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob<T = unknown>(pattern: string): Record<string, () => Promise<T>>
}
