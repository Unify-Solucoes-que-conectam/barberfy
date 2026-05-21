/**
 * Detecta a área atual da aplicação baseado no pathname.
 * Útil para componentes que precisam saber se estão no /admin ou /client.
 */
export function detectAppMode(): 'admin' | 'client' {
  const params = new URLSearchParams(window.location.search)

  if (params.has('barbershop_id')) {
    return 'client'
  }

  return 'admin'
}

/**
 * Obtém o barbershop_id da URL (query param) ou do sessionStorage.
 * Prioridade: URL query param > sessionStorage.
 * Se encontrado na URL, persiste no sessionStorage para requests subsequentes.
 */
export function getBarbershopId(): string | null {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('barbershop_id')

  if (fromUrl) {
    sessionStorage.setItem('barbershop_id', fromUrl)
    return fromUrl
  }

  return sessionStorage.getItem('barbershop_id')
}

/**
 * Verifica se estamos em contexto de cliente (barbershop_id presente).
 * - Com barbershop_id → contexto client (login por OTP)
 * - Sem barbershop_id → contexto admin (login por email/senha)
 */
export function isClientContext(): boolean {
  return !!getBarbershopId()
}

/**
 * Retorna o caminho de redirecionamento baseado no role do usuário.
 * - owner/admin → /admin/dashboard
 * - user (ou qualquer outro) → /client/home
 * - sem role → /auth/login
 */
export function getRedirectPathByRole(userRole?: string | null): string {
  if (!userRole) return '/auth/login'

  const adminRoles = ['admin', 'owner']
  if (adminRoles.includes(userRole.toLowerCase())) {
    return '/admin/dashboard'
  }

  return '/client/home'
}

/**
 * Verifica se o role tem permissão de admin
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  return ['admin', 'owner'].includes(role.toLowerCase())
}

export default detectAppMode
