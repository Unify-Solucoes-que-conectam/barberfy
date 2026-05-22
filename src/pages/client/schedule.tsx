import { useEffect, useState } from 'react'

import { addDays, format, isBefore, parse, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Calendar as CalendarIcon, CheckIcon, Clock, Scissors } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import Loader from '@/components/custom/loader'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import axios from '@/lib/axios'
import type { ApiResponse } from '@/types/api-response'
import type { Appointment, Service } from '@/types/consults'

type Step = 'service' | 'date' | 'time' | 'confirm'

export default function ClientSchedule() {
  const navigate = useNavigate()
  const { barbershop, user } = useAuth()
  const { tokens } = useTheme()

  const [step, setStep] = useState<Step>('service')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [spinners, setSpinners] = useState({
    general: false,
    services: false,
    submit: false,
  })

  // Load existing appointments when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAppointments()
    }
  }, [selectedDate])

  // Recalculate available slots when appointments, date, or service changes
  useEffect(() => {
    calculateAvailableSlots()
  }, [appointments, selectedDate, selectedService])

  /******************** FETCHERS ********************/
  const fetchAppointments = async () => {
    setSpinners((prev) => ({ ...prev, general: true }))

    try {
      const response = await axios.get<ApiResponse<Appointment[]>>('/appointments')

      if (response.data.success) {
        setAppointments(response.data.data)
      } else {
        toast.error(response.data.message || 'Erro ao buscar agendamentos.')
      }
    } catch (error: any) {
      toast.error('Erro ao buscar estatísticas.', error)
    } finally {
      setSpinners((prev) => ({ ...prev, general: false }))
    }
  }

  const fetchServices = async () => {
    setSpinners((prev) => ({ ...prev, services: true }))

    try {
      const response = await axios.get<ApiResponse<Service[]>>('/services', {
        params: { active: true },
      })

      if (response.data.success) {
        setServices(response.data.data)
      } else {
        toast.error(response.data.message || 'Erro ao buscar serviços.')
      }
    } catch (error: any) {
      toast.error('Erro ao buscar serviços.', error)
    } finally {
      setSpinners((prev) => ({ ...prev, services: false }))
    }
  }

  /******************** FETCHERS ********************/
  useEffect(() => {
    if (step === 'service') {
      fetchServices()
    }
  }, [step])

  const calculateAvailableSlots = () => {
    if (!selectedDate || !selectedService) return

    const dayOfWeek = selectedDate.getDay()
    const hours = barbershop?.business_hours.find((h) => h.day_of_week === dayOfWeek)
    if (!hours || !hours.is_open) {
      setAvailableSlots([])
      return
    }

    const slots: string[] = []
    // Parse times - handle both HH:mm:ss and HH:mm formats
    const timeFormat = hours.open_time.split(':').length === 3 ? 'HH:mm:ss' : 'HH:mm'
    const openTime = parse(hours.open_time, timeFormat, selectedDate)
    const closeTime = parse(hours.close_time, timeFormat, selectedDate)
    const now = new Date()
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')

    let currentSlot = openTime

    while (isBefore(currentSlot, closeTime)) {
      const slotString = format(currentSlot, 'HH:mm')

      // Check if slot is in the past (for today)
      if (isToday) {
        const slotDateTime = parse(slotString, 'HH:mm', now)
        if (isBefore(slotDateTime, now)) {
          currentSlot = new Date(currentSlot.getTime() + 30 * 60000)
          continue
        }
      }

      // Check if slot conflicts with existing appointments on this specific date
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
      const isOccupied = appointments.some((apt) => {
        const aptTime = apt.time.slice(0, 5)
        const aptDate = apt.date
        // Compare both date AND time, and only exclude confirmed/pending appointments
        return (
          aptDate === selectedDateStr && aptTime === slotString && ['0', '1'].includes(apt.status)
        )
      })

      if (!isOccupied) {
        slots.push(slotString)
      }

      currentSlot = new Date(currentSlot.getTime() + 30 * 60000) // 30 min intervals
    }

    setAvailableSlots(slots)
  }

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (isBefore(date, startOfDay(new Date()))) return true

    // Disable dates more than 30 days in the future
    if (isBefore(addDays(new Date(), 30), date)) return true

    // Check if barbershop is open on this day
    const dayOfWeek = date.getDay()
    const hours = barbershop?.business_hours.find((h) => h.day_of_week === dayOfWeek)
    return !hours || !hours.is_open
  }

  const handleConfirm = async () => {
    setSpinners((prev) => ({ ...prev, submit: true }))

    try {
      const response = await axios.post<ApiResponse<Appointment[]>>('/appointments', {
        customer_id: user?.id,
        service_id: selectedService?.id,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        time: selectedTime,
      })

      if (response.data.success) {
        toast.success('Agendamento realizado com sucesso!')
        navigate('/meus-agendamentos')
      } else {
        toast.error(response.data.message || 'Erro ao realizar agendamento.')
      }
    } catch (error: any) {
      toast.error('Erro ao realizar agendamento.', error)
    } finally {
      setSpinners((prev) => ({ ...prev, submit: false }))
    }
  }

  const formatPrice = (price: number | string | null) => {
    if (!price) return 'Consultar'
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      numericPrice
    )
  }

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      {/* Header */}
      <header className='p-4 border-b'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              if (step === 'service') navigate('/client/home')
              else if (step === 'date') setStep('service')
              else if (step === 'time') setStep('date')
              else if (step === 'confirm') setStep('time')
            }}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='font-semibold'>Agendar Horário</h1>
            <p className='text-sm text-muted-foreground'>
              {step === 'service' && 'Escolha o serviço'}
              {step === 'date' && 'Escolha a data'}
              {step === 'time' && 'Escolha o horário'}
              {step === 'confirm' && 'Confirme seu agendamento'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className='flex gap-2 mt-4'>
          {['service', 'date', 'time', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded ${
                ['service', 'date', 'time', 'confirm'].indexOf(step) >= i
                  ? tokens.primary
                  : 'bg-muted'
              }`}
              style={{
                backgroundColor:
                  ['service', 'date', 'time', 'confirm'].indexOf(step) >= i
                    ? barbershop?.primary_color
                    : undefined,
              }}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 overflow-y-auto p-4'>
        {/* Step: Service */}
        {step === 'service' && (
          <div className='space-y-3'>
            {spinners.services ? (
              <div className='py-8'>
                <Loader showMessage={true} message='Carregando serviços...' />
              </div>
            ) : services.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>Nenhum serviço disponível</p>
            ) : (
              services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-colors ${
                    selectedService?.id === service.id ? 'border-3' : ''
                  }`}
                  style={{
                    borderColor: selectedService?.id === service.id ? tokens.border : undefined,
                  }}
                  onClick={() => {
                    setSelectedService(service)
                    setStep('date')
                  }}
                >
                  <CardContent className='flex items-center gap-4'>
                    <div
                      className='w-12 h-12 rounded-full flex items-center justify-center border'
                      style={{ backgroundColor: tokens.primary, borderColor: tokens.border }}
                    >
                      <Scissors className='h-6 w-6' style={{ color: tokens.onPrimary }} />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-medium'>{service.name}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {service.duration_minutes} min
                      </p>
                    </div>
                    <span className='font-semibold'>{formatPrice(service.price)}</span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step: Date */}
        {step === 'date' && (
          <>
            <style>{`
              [data-selected-single="true"] {
                border: 1px solid !important;
                border-color: ${tokens.border} !important;
                background-color: ${tokens.primary} !important;
                color: ${tokens.onPrimary} !important;
              }
              [data-range-start="true"],
              [data-range-end="true"] {
                background-color: ${tokens.primary} !important;
                color: ${tokens.onPrimary} !important;
              }
            `}</style>
            <div className='flex justify-center'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  if (date) setStep('time')
                }}
                disabled={isDateDisabled}
                locale={ptBR}
                className='rounded-md border pointer-events-auto w-full'
              />
            </div>
          </>
        )}

        {/* Step: Time */}
        {step === 'time' && (
          <div className='space-y-4'>
            <p className='text-sm text-muted-foreground text-center'>
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>

            {spinners.general ? (
              <div className='py-8'>
                <Loader showMessage={true} message='Carregando horários...' />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className='text-center text-muted-foreground py-8'>
                Nenhum horário disponível nesta data
              </p>
            ) : (
              <div className='grid grid-cols-3 gap-2'>
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? 'solid' : 'outline'}
                    className='h-12 border'
                    style={{
                      borderColor: selectedTime === slot ? tokens.border : undefined,
                      backgroundColor:
                        selectedTime === slot ? barbershop?.primary_color : undefined,
                      color: selectedTime === slot ? tokens.onPrimary : undefined,
                    }}
                    onClick={() => {
                      setSelectedTime(slot)
                      setStep('confirm')
                    }}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedService && selectedDate && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Agendamento</CardTitle>
              <CardDescription>Confira os detalhes antes de confirmar</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Scissors className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='font-medium'>{selectedService.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {selectedService.duration_minutes} min • {formatPrice(selectedService.price)}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <CalendarIcon className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='font-medium'>
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Clock className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='font-medium'>{selectedTime}</p>
                </div>
              </div>

              <Button
                className='w-full h-12 mt-4 border'
                style={{
                  backgroundColor: tokens.primary,
                  borderColor: tokens.border,
                  color: tokens.onPrimary,
                }}
                onClick={handleConfirm}
                disabled={spinners.submit}
              >
                {spinners.submit ? (
                  'Confirmando...'
                ) : (
                  <>
                    <CheckIcon />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
