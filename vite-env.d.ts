/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_WHATSAPP_NUMBER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
