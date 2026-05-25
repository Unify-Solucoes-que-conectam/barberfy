import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import instagramSVG from '@/assets/apps/instagram_light.svg'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { phoneFormatter } from '@/utils/formatters'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function ClientInfoBarbershop() {
  const navigate = useNavigate()
  const { barbershop, loading } = useAuth()

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-muted-foreground'>Carregando...</p>
      </div>
    )
  }

  if (!barbershop) {
    return null
  }

  const formatTime = (time: string) => time.slice(0, 5)

  /**
   * função para montar o endereço completo da barbearia, considerando os campos disponíveis
   */
  const getFullAddress = () => {
    const { address, street, city, state, zip_code } = barbershop
    if (!address && !street && !city && !state) return null

    const parts: string[] = []
    if (street) parts.push(street)
    if (address) parts.push(address)
    if (city && state) parts.push(`${city}/${state}`)
    else if (city) parts.push(city)
    else if (state) parts.push(state)
    if (zip_code) parts.push(`CEP ${zip_code}`)

    return parts.join(', ')
  }

  const fullAddress = getFullAddress()
  const mapsUrl = fullAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`
    : null

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      {/* Header */}
      <header className='border-b p-4'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => navigate(`/client/home`)}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <h1 className='font-semibold'>Informações</h1>
        </div>
      </header>

      {/* Content */}
      <main className='flex-1 p-4 space-y-4'>
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>{barbershop.company_name}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <a
              href={mapsUrl ?? '#'}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-start gap-3 hover:text-primary'
            >
              <MapPin className='h-5 w-5 shrink-0 mt-0.5' />
              <p className='truncate'>{fullAddress ?? 'Não informado'}</p>
            </a>

            <a
              href={`https://api.whatsapp.com/send?phone=${barbershop.phone}&text=${barbershop.whatsapp_message || 'Olá, gostaria de mais informações!'}`}
              className='flex items-center gap-3 hover:text-primary'
              target='_blank'
              rel='noopener noreferrer'
            >
              <Phone className='h-5 w-5' />
              <span>{barbershop.phone ? phoneFormatter(barbershop.phone) : 'Não informado'}</span>
            </a>

            <a
              href={`https://instagram.com/${barbershop.instagram?.replace('@', '')}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-3 hover:text-primary'
            >
              <img src={instagramSVG} alt='Instagram' className='inline-block w-5' />
              <span>{barbershop.instagram || 'Não informado'}</span>
            </a>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Horário de Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {DAYS.map((day, index) => {
                const hours = barbershop.business_hours.find((h) => h.day_of_week === index)
                return (
                  <div key={day} className='flex justify-between py-1 border-b last:border-0'>
                    <span className='font-medium'>{day}</span>
                    <span className={hours?.is_open ? '' : 'text-muted-foreground'}>
                      {hours?.is_open
                        ? `${formatTime(hours.open_time)} - ${formatTime(hours.close_time)}`
                        : 'Fechado'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
