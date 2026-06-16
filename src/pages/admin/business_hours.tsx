import { useEffect, useState } from 'react'

import { SaveIcon } from 'lucide-react'
import { toast } from 'sonner'

import Loader from '@/components/custom/loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/hooks/use-theme'
import axios from '@/lib/axios'

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

interface DayHours {
  id?: string
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
}

export default function AdminBusinessHours() {
  const { tokens } = useTheme()

  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((day) => ({
      day_of_week: day.value,
      open_time: '09:00',
      close_time: '18:00',
      is_open: day.value >= 1 && day.value <= 6,
    }))
  )
  const [originalHours, setOriginalHours] = useState<DayHours[]>([])
  const [hoursLoading, setHoursLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadHours()
  }, [])

  const loadHours = async () => {
    setHoursLoading(true)

    try {
      const { data } = await axios.get('/business-hours')

      if (data.success && data.data && data.data.length > 0) {
        const loadedHours = DAYS.map((day) => {
          const existing = data.data.find((h: DayHours) => h.day_of_week === day.value)
          if (existing) {
            return {
              day_of_week: existing.day_of_week,
              open_time: existing.open_time.slice(0, 5),
              close_time: existing.close_time.slice(0, 5),
              is_open: existing.is_open,
              id: existing.id,
            }
          }
          return {
            day_of_week: day.value,
            open_time: '09:00',
            close_time: '18:00',
            is_open: day.value >= 1 && day.value <= 6,
          }
        })
        setHours(loadedHours)
        setOriginalHours(JSON.parse(JSON.stringify(loadedHours)))
      }
    } catch (error) {
      console.error('Error loading hours:', error)
    } finally {
      setHoursLoading(false)
    }
  }

  const updateDay = (dayIndex: number, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => prev.map((h, i) => (i === dayIndex ? { ...h, [field]: value } : h)))
  }

  /**
   * atualiza todos os horários
   */
  const updateAllHours = (open_time: string, close_time: string, is_open: boolean) => {
    setHours((prev) => prev.map((h) => ({ ...h, open_time, close_time, is_open })))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Filtra apenas os horários que foram alterados
      const changedHours = hours.filter((hour, index) => {
        const original = originalHours[index]
        if (!original) return true

        return (
          hour.open_time !== original.open_time ||
          hour.close_time !== original.close_time ||
          hour.is_open !== original.is_open
        )
      })

      if (changedHours.length === 0) {
        toast.info('Nenhuma alteração para salvar')
        setSaving(false)
        return
      }

      for (const hour of changedHours) {
        const data = {
          day_of_week: hour.day_of_week,
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_open: hour.is_open,
        }

        if (hour.id) {
          await axios.put(`/business-hours/${hour.id}`, data)
        } else {
          await axios.post('/business-hours', data)
        }
      }

      toast.success(`${changedHours.length} horário(s) atualizado(s) com sucesso!`)
      loadHours()
    } catch (error: any) {
      console.error('Error saving hours:', error)
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold hidden lg:block'>Horários de Funcionamento</h1>
          <p className='text-muted-foreground'>Configure os horários de atendimento</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: tokens.primary,
            color: tokens.onPrimary,
          }}
        >
          <SaveIcon className='mr-2 h-4 w-4' />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {hoursLoading ? (
        <div className='py-8'>
          <Loader showMessage={true} message='Carregando horários...' />
        </div>
      ) : (
        <>
          {/* Auto-complete de horários */}
          <Card>
            <CardContent className='flex gap-3 items-center'>
              <div className='flex-1'>
                <p className='font-medium'>Preencher todos os dias</p>
              </div>

              <div className='flex items-center gap-2'>
                <input
                  type='time'
                  value={hours[0].open_time}
                  onChange={(e) =>
                    updateAllHours(e.target.value, hours[0].close_time, hours[0].is_open)
                  }
                  className='px-2 py-1 border rounded'
                />
                <span>até</span>
                <input
                  type='time'
                  value={hours[0].close_time}
                  onChange={(e) =>
                    updateAllHours(hours[0].open_time, e.target.value, hours[0].is_open)
                  }
                  className='px-2 py-1 border rounded'
                />
              </div>

              <div className='flex items-center gap-2'>
                {!hours[0].is_open && (
                  <span className='text-sm text-muted-foreground'>Fechado</span>
                )}
                <Switch
                  checked={hours[0].is_open}
                  onCheckedChange={(checked) =>
                    updateAllHours(hours[0].open_time, hours[0].close_time, checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4 space-y-4'>
              {hours.map((hour, index) => (
                <div
                  key={hour.day_of_week}
                  className='flex items-center gap-4 p-3 rounded-lg border'
                >
                  <div className='flex-1'>
                    <p className='font-medium'>{DAYS[hour.day_of_week]?.label}</p>
                  </div>

                  {hour.is_open && (
                    <div className='flex items-center gap-2'>
                      <input
                        type='time'
                        value={hour.open_time}
                        onChange={(e) => updateDay(index, 'open_time', e.target.value)}
                        className='px-2 py-1 border rounded'
                      />
                      <span>até</span>
                      <input
                        type='time'
                        value={hour.close_time}
                        onChange={(e) => updateDay(index, 'close_time', e.target.value)}
                        className='px-2 py-1 border rounded'
                      />
                    </div>
                  )}

                  <div className='flex items-center gap-2'>
                    {!hour.is_open && (
                      <span className='text-sm text-muted-foreground'>Fechado</span>
                    )}
                    <Switch
                      checked={hour.is_open}
                      onCheckedChange={(checked) => updateDay(index, 'is_open', checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
