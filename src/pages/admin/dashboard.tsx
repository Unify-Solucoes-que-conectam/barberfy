import { useEffect, useState } from 'react'

import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleXIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import Loader from '@/components/custom/loader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import useEcho from '@/hooks/use-echo'
import { useHeader } from '@/hooks/use-header'
import axios from '@/lib/axios'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import type { ApiResponse } from '@/types/api-response'
import type { Appointment } from '@/types/consults'
import { nameFormatter } from '@/utils/formatters'

type StatusFilter = 'all' | '0' | '1' | '2'

export default function AdminDashboard() {
  const { user } = useAuth()
  const { setPageTitle } = useHeader()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [spinners, setSpinners] = useState({
    general: false,
    refresh: false,
  })

  const { messages } = useEcho({
    channelName: user ? `barber.${user.id}.notifications` : '',
    mode: 'event',
    eventName: 'appointment.created',
  })

  useEffect(() => {
    setPageTitle('Dashboard')
  }, [])

  /**
   * consultar dados quando receber notificação
   */
  useEffect(() => {
    // consultar dados
    fetchStats()
  }, [messages])

  /**
   * refetch quando o filtro mudar
   */
  useEffect(() => {
    fetchStats()
  }, [statusFilter])

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchStats = async (isRefresh = false) => {
    setSpinners((prev) => ({ ...prev, general: true, refresh: isRefresh }))

    try {
      const response = await axios.get<
        ApiResponse<Appointment[]> & {
          stats: { today: number; pending: number; confirmed: number; cancelled: number }
        }
      >('/dashboard/today_appointments', {
        params: { status: statusFilter },
      })

      if (response.data.success) {
        setAppointments(response.data.data)
        setStats(response.data.stats)
      } else {
        toast.error(response.data.message || 'Erro ao buscar agendamentos.')
      }
    } catch (error: any) {
      toast.error('Erro ao buscar estatísticas.', error)
    } finally {
      setSpinners((prev) => ({ ...prev, general: false, refresh: false }))
      setLastUpdate(new Date())
    }
  }

  const getStatusData = (status: string): { label: string; color: string } => {
    switch (status) {
      case '0':
        return { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-600' }
      case '1':
        return { label: 'Confirmado', color: 'bg-green-500/20 text-green-600' }
      case '2':
        return { label: 'Cancelado', color: 'bg-red-500/20 text-red-600' }
      default:
        return { label: 'Desconhecido', color: 'bg-gray-500/20 text-gray-600' }
    }
  }

  const cards: {
    title: string
    ammount: number | string
    icon: React.ReactNode
    className: string
    filter: StatusFilter
  }[] = [
    {
      title: 'Hoje',
      ammount: spinners.general ? '...' : stats.today,
      icon: <CalendarIcon className='h-5 w-5 text-blue-600' />,
      className: 'bg-blue-200 dark:bg-blue-600/20',
      filter: 'all',
    },
    {
      title: 'Pendentes',
      ammount: spinners.general ? '...' : stats.pending,
      icon: <AlertCircleIcon className='h-5 w-5 text-yellow-600' />,
      className: 'bg-yellow-200 dark:bg-yellow-600/20',
      filter: '0',
    },
    {
      title: 'Confirmados',
      ammount: spinners.general ? '...' : stats.confirmed,
      icon: <CheckCircle2Icon className='h-5 w-5 text-green-600' />,
      className: 'bg-green-200 dark:bg-green-600/20',
      filter: '1',
    },
    {
      title: 'Cancelados',
      ammount: spinners.general ? '...' : stats.cancelled,
      icon: <CircleXIcon className='h-5 w-5 text-red-600' />,
      className: 'bg-red-200 dark:bg-red-600/20',
      filter: '2',
    },
  ]

  const filterLabels: Record<StatusFilter, string> = {
    'all': 'Todos',
    '0': 'Pendentes',
    '1': 'Confirmados',
    '2': 'Cancelados',
  }

  return (
    <div>
      {/* Content */}
      <div className='space-y-6'>
        {/* Welcome */}
        <div className='flex justify-between items-end'>
          <div>
            <h1 className='text-2xl font-bold'>Olá! 👋</h1>
            <p className='text-muted-foreground'>
              {dayjs(new Date()).format('dddd, D [de] MMMM [de] YYYY')}
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <span className='text-sm text-muted-foreground'>
              Última atualização realizada às {dayjs(lastUpdate).format('HH:mm:ss')}
            </span>
            <Button size='icon' variant='outline' onClick={() => fetchStats(true)}>
              <RefreshCwIcon
                className={cn({
                  'animate-spin': spinners.refresh,
                })}
              />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {cards.map((card, index) => (
            <Card
              key={index}
              className={cn('cursor-pointer transition-all', {
                'ring-2 ring-primary': statusFilter === card.filter,
              })}
              onClick={() => setStatusFilter(card.filter)}
            >
              <CardContent className='flex items-center gap-4'>
                <div className={cn('p-3 rounded-full', card.className)}>{card.icon}</div>
                <div>
                  <p className='text-2xl font-bold'>{card.ammount}</p>
                  <p className='text-sm text-muted-foreground'>{card.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Appointments */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Agendamentos de Hoje</CardTitle>
              <CardDescription>
                {appointments.length} agendamento(s)
                {statusFilter !== 'all' && ` — ${filterLabels[statusFilter]}`}
              </CardDescription>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <TabsList>
                <TabsTrigger value='all'>Todos</TabsTrigger>
                <TabsTrigger value='0'>Pendentes</TabsTrigger>
                <TabsTrigger value='1'>Confirmados</TabsTrigger>
                <TabsTrigger value='2'>Cancelados</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {spinners.general ? (
              <Loader showMessage={true} message='Carregando agendamentos...' />
            ) : appointments.length === 0 ? (
              <p className='text-muted-foreground'>Nenhum agendamento para hoje</p>
            ) : (
              <div className='space-y-3'>
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className='flex items-center justify-between p-3 rounded-lg bg-muted/50'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='text-center min-w-12.5'>
                        <p className='font-bold'>{apt.time.slice(0, 5)}</p>
                      </div>
                      <div>
                        <p className='font-medium'>{nameFormatter(apt.customer?.name)}</p>
                        <p className='text-sm text-muted-foreground'>{apt.service?.name}</p>
                      </div>
                    </div>
                    <Badge className={getStatusData(apt.status).color}>
                      {getStatusData(apt.status).label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
