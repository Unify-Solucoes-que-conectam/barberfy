import { Skeleton } from '../ui/skeleton'
import { CircleUserRoundIcon, EllipsisVerticalIcon, LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

import { CustomAvatar } from './avatar'

export function SidebarUser() {
  const { isMobile } = useSidebar()
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <CustomAvatar src={user?.profile_photo ?? undefined} alt={user?.name || undefined} />
              <div className='grid flex-1 text-left text-sm leading-tight'>
                {loading ? (
                  <Skeleton className='p-2 mb-1 w-22' />
                ) : (
                  <span className='truncate font-medium'>{user?.name.toUpperCase()}</span>
                )}
                {loading ? (
                  <Skeleton className='p-1' />
                ) : (
                  <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
                )}
              </div>
              <EllipsisVerticalIcon className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <CustomAvatar
                  src={user?.profile_photo ?? undefined}
                  alt={user?.name || undefined}
                  className='h-10 w-10'
                />
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  {loading ? (
                    <Skeleton className='p-2 mb-1 w-22' />
                  ) : (
                    <span className='truncate font-medium'>{user?.name.toUpperCase()}</span>
                  )}
                  {loading ? (
                    <Skeleton className='p-1' />
                  ) : (
                    <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/admin/settings/account')}>
                <CircleUserRoundIcon />
                Conta
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
