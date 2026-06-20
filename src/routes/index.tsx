import AdminLayout from '../pages/layout/admin-layout'
import ClientLayout from '../pages/layout/client-layout'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { getRedirectPathByRole } from '@/lib/detectAppMode'

import { AdminRoutesChildren } from './admin'
import { AuthRoute } from './auth'
import { ClientRoutesChildren } from './client'
import { AdminGuard } from './guards'

function RootRedirect() {
  const role = localStorage.getItem('user_role')
  const targetPath = getRedirectPathByRole(role) || '/auth/login'

  return <Navigate to={getRedirectPathByRole(targetPath)} replace />
}

const router = createBrowserRouter(
  [
    // Auth (unprotected)
    AuthRoute,

    // Admin routes — protected by role guard
    {
      path: '/admin',
      element: (
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      ),
      children: AdminRoutesChildren,
    },

    // Client routes — accessible to everyone
    {
      path: '/client',
      element: <ClientLayout />,
      children: ClientRoutesChildren,
    },

    // Root redirect based on stored role
    {
      path: '/',
      element: <RootRedirect />,
    },

    // Catch-all
    {
      path: '*',
      element: <RootRedirect />,
    },
  ],
  {
    basename: '/barberfy',
  }
)

export default router
