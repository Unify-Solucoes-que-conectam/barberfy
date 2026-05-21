import * as React from 'react'

import { Skeleton } from '../ui/skeleton'
import { ClockIcon, LayoutDashboardIcon, ScissorsIcon, SettingsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

import { CustomAvatar } from './avatar'
import { SidebarMain } from './sidebar-main'
import { SidebarSecondary } from './sidebar-secondary'
import { SidebarUser } from './sidebar-user'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  sidebarPrimary: [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Serviços',
      url: '/admin/services',
      icon: ScissorsIcon,
    },
    {
      title: 'Horários',
      url: '/admin/business-hours',
      icon: ClockIcon,
    },
  ],
  sidebarSecondary: [
    {
      title: 'Configurações',
      url: '/admin/settings',
      icon: SettingsIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { barbershop, loading } = useAuth()
  const logoSrc = barbershop?.logo_url ? barbershop.logo_url : undefined

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:p-1.5!'>
              <Link to='/admin/dashboard'>
                <CustomAvatar
                  src={logoSrc}
                  alt={barbershop?.company_name || undefined}
                  className='rounded-lg'
                />
                {loading ? (
                  <Skeleton className='w-full p-2' />
                ) : (
                  <span className='text-base font-semibold'>{barbershop?.company_name}</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={data.sidebarPrimary} />
        <SidebarSecondary items={data.sidebarSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
