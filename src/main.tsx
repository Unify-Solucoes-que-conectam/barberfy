import { createRoot } from 'react-dom/client'

import { RouterProvider } from 'react-router-dom'

import { Toaster } from './components/ui/sonner'
import './index.css'
import { AuthProvider } from './providers/AuthProvider'
import ThemeProvider from './providers/ThemeProvider'
import router from './routes'

// Inicializa a detecção de modo ANTES de qualquer coisa
import('./lib/detectAppMode').then(({ default: detectAppMode }) => {
  detectAppMode()
})

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ThemeProvider defaultTheme='system' storageKey='theme'>
      <RouterProvider router={router} />

      <Toaster
        className='pointer-events-auto'
        position='bottom-right'
        visibleToasts={3}
        expand={false}
        richColors
        toastOptions={{
          classNames: {
            toast:
              '!bg-neutral-100 !border-neutral-200 dark:!bg-neutral-800 dark:!border-neutral-700',
            success: '!text-emerald-600',
            error: '!text-red-600',
            warning: '!text-amber-600',
            info: '!text-blue-600',
          },
        }}
      />
    </ThemeProvider>
  </AuthProvider>
)
