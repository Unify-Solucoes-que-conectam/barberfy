import { useEffect, useRef, useState } from 'react'

import { BellIcon } from 'lucide-react'

// Importar o arquivo de áudio diretamente
import cancelledAppointmentNotification from '@/assets/cancelled-appointment.mp3'
import newAppointmentNotification from '@/assets/new-appointment.mp3'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import useEcho from '@/hooks/use-echo'
import axios from '@/lib/axios'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import type { ApiResponse } from '@/types/api-response'
import { type Notification } from '@/types/consults'

const SETTINGS_KEY = 'admin_panel_settings'

interface PanelSettings {
  notificationSound: boolean
  receiveNotifications: boolean
}

function loadPanelSettings(): PanelSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        notificationSound: parsed.notificationSound ?? true,
        receiveNotifications: parsed.receiveNotifications ?? true,
      }
    }
  } catch {
    // ignore
  }
  return { notificationSound: true, receiveNotifications: true }
}

const HeaderNotifications = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const newAppointmentSound = useRef<HTMLAudioElement | null>(null)
  const cancelledAppointmentSound = useRef<HTMLAudioElement | null>(null)
  const lastPlayTimeRef = useRef<number>(0)
  const settingsRef = useRef<PanelSettings>(loadPanelSettings())

  // dados do usuário
  const { user } = useAuth()

  // Prevenir múltiplas reproduções em um curto período de tempo
  const PLAY_DEBOUNCE_MS = 500

  // Volume padrão para os sons (pode ser ajustado conforme necessário)
  const DEFAULT_VOLUME = 0.1

  // Sincronizar settings quando localStorage muda (ex: outra aba ou a própria settings page)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_KEY) settingsRef.current = loadPanelSettings()
    }
    window.addEventListener('storage', onStorage)

    // Também re-ler ao focar a janela (mesma aba)
    const onFocus = () => {
      settingsRef.current = loadPanelSettings()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Inicializar os sons apenas uma vez usando HTMLAudioElement
  useEffect(() => {
    const createAudio = (src: string) => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = DEFAULT_VOLUME
      return audio
    }

    const newSound = createAudio(newAppointmentNotification)
    const cancelledSound = createAudio(cancelledAppointmentNotification)
    newAppointmentSound.current = newSound
    cancelledAppointmentSound.current = cancelledSound

    // Desbloquear áudio na primeira interação global do usuário
    const unlockAudio = () => {
      ;[newAppointmentSound.current, cancelledAppointmentSound.current].forEach((audio) => {
        if (!audio) return
        audio.volume = 0
        audio.currentTime = 0
        audio
          .play()
          .then(() => {
            audio.pause()
            audio.currentTime = 0
            audio.volume = DEFAULT_VOLUME
          })
          .catch(() => {
            audio.volume = DEFAULT_VOLUME
          })
      })
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)

    return () => {
      newSound.pause()
      newSound.src = ''
      cancelledSound.pause()
      cancelledSound.src = ''
      newAppointmentSound.current = null
      cancelledAppointmentSound.current = null
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // Só inicializa o Echo quando o user estiver carregado
  const { messages, clearMessages } = useEcho({
    channelName: user ? `barber.${user.id}.notifications` : '',
    mode: 'event',
    eventName: 'appointment.created',
  })

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))

    axios.post('notifications/read', { id: [id] })
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))

    axios.post('notifications/read', { id: notifications.map((n) => n.id) })
  }

  const fetchOldNotifications = async () => {
    try {
      const res = await axios.get<ApiResponse<Notification[]>>('notifications')

      if (res.data.success) {
        const oldNotifications = res.data.data!

        setNotifications((prev) => [...oldNotifications, ...prev])
      }
    } catch {
      setNotifications([])
    }
  }

  useEffect(() => {
    fetchOldNotifications()
  }, [])

  // Scroll automático ao abrir o popover
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        const container = scrollRef.current
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [open])

  useEffect(() => {
    if (messages.length > 0) {
      // Re-ler settings a cada batch de mensagens (garante valor atualizado)
      settingsRef.current = loadPanelSettings()
      const { receiveNotifications, notificationSound: soundEnabled } = settingsRef.current

      // Se notificações estão desligadas, descarta as mensagens silenciosamente
      if (!receiveNotifications) {
        clearMessages()
        return
      }

      // selecionar o áudio correto baseado no tipo da última mensagem recebida
      const lastMessageType = messages[messages.length - 1].type
      const audioToPlay =
        lastMessageType === 'warning'
          ? cancelledAppointmentSound.current
          : newAppointmentSound.current

      setNotifications((prev) => {
        return [
          ...prev,
          ...messages.map((message) => ({
            id: message.id,
            title: message.title,
            message: message.message,
            type: message.type,
            link: message.link,
            sent_at: message.sent_at,
            read: message.read,
          })),
        ]
      })

      // Reproduzir som somente se habilitado nas configurações
      if (soundEnabled && audioToPlay) {
        const now = Date.now()
        if (now - lastPlayTimeRef.current > PLAY_DEBOUNCE_MS) {
          audioToPlay.currentTime = 0
          audioToPlay.play().catch(() => {})
          lastPlayTimeRef.current = now
        }
      }

      clearMessages()
    }
  }, [messages, clearMessages])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Tooltip content='Notificações' align='center'>
          <Button variant='ghost' size='icon' className='size-7 relative'>
            <BellIcon />

            {unreadCount > 0 && (
              <span className='absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-500'></span>
            )}

            <span className='sr-only'>Notificações</span>
          </Button>
        </Tooltip>
      </PopoverTrigger>

      <PopoverContent className='w-lg p-0 select-none' align='start'>
        {notifications.length > 0 ? (
          <>
            <div className='flex items-center justify-between border-b px-4 py-2'>
              <h3 className='font-medium pl-3'>Notificações</h3>
              <Button
                variant='ghost'
                size='sm'
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className='text-xs text-muted-foreground hover:text-foreground'
              >
                Marcar todas como lidas
              </Button>
            </div>

            <div className='h-87.5 overflow-auto' ref={scrollRef}>
              {Array.from(new Map(notifications.map((n) => [n.id, n])).values()).map(
                (notification) => {
                  const Component = notification.link ? 'a' : 'div'
                  return (
                    <Component
                      key={notification.id}
                      href={notification.link || '#'}
                      target='_blank'
                      onClick={() => {
                        if (notification.link) setOpen(false)
                      }}
                    >
                      <div
                        className={cn({
                          'border-l-4 border-blue-500': !notification.read,
                          'cursor-pointer': notification.link,
                        })}
                      >
                        <div
                          className={cn(
                            'flex gap-3 border-b p-4 transition-colors hover:bg-muted/50',
                            notification.read ? 'opacity-70' : ''
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className='shrink-0 pt-1'>
                            <span
                              className={cn('block h-3 w-3 rounded-full', {
                                'bg-blue-500': notification.type === 'info',
                                'bg-amber-500': notification.type === 'warning',
                                'bg-red-500': notification.type === 'error',
                                'bg-green-500': notification.type === 'success',
                              })}
                            />
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-start justify-between gap-2'>
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  !notification.read && 'font-semibold'
                                )}
                              >
                                {notification.title || 'Notificação'}
                              </p>

                              <span
                                className='text-[10px] text-muted-foreground whitespace-nowrap'
                                title={dayjs(notification.sent_at).format('DD/MM/YYYY HH:mm:ss')}
                              >
                                {dayjs(notification.sent_at).fromNow()}
                              </span>
                            </div>

                            <p className='mt-1 text-xs text-muted-foreground'>
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Component>
                  )
                }
              )}
            </div>
          </>
        ) : (
          <div className='p-4 text-center text-gray-500'>
            <p>Nenhuma notificação no momento</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default HeaderNotifications
