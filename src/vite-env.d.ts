/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_URL: string
  readonly VITE_API_URL: string

  readonly VITE_GOOGLE_CLIENT_ID: string

  readonly VITE_REVERB_APP_KEY: string
  readonly VITE_REVERB_HOST: string
  readonly VITE_REVERB_PORT: string
  readonly VITE_REVERB_SCHEME: 'http' | 'https'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
