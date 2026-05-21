import { Link } from 'react-router'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useHeader } from '@/hooks/use-header'

import { CustomAvatar } from './avatar'
import Notifications from './header-notifications'

export function AppHeader() {
  const { pageTitle } = useHeader()
  const { barbershop } = useAuth()
  const logoSrc = barbershop?.logo_url ? barbershop.logo_url : undefined

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Notifications />
        <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
        <h1 className='text-base font-medium'>{pageTitle}</h1>
        <div className='ml-auto flex items-center gap-2'>
          <Link to='/admin/dashboard' rel='noopener noreferrer'>
            <CustomAvatar
              src={logoSrc}
              alt={barbershop?.company_name || undefined}
              className='rounded-lg'
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
