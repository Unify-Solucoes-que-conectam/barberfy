import { useEffect, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  BuildingIcon,
  CheckIcon,
  ChevronRightIcon,
  ContactIcon,
  CopyIcon,
  LinkIcon,
  Loader2Icon,
  MapPinIcon,
  PaletteIcon,
  PhoneIcon,
  ScissorsIcon,
  UserIcon,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'

import instagramSVG from '@/assets/apps/instagram_light.svg'
import whatsappSVG from '@/assets/apps/whatsapp_light.svg'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import axios from '@/lib/axios'
import type { ApiResponse } from '@/types/api-response'
import {
  formatCEPDisplay,
  formatPhoneDisplay,
  unformatCEP,
  unformatPhone,
} from '@/utils/formatters'

import schema, { defaultValues, type Schema } from './schemas'
import PageSkeleton from './skeletons'

export default function AdminSettings() {
  // ==================== Dados Iniciais ====================
  const { barbershop, refreshAuth } = useAuth()

  // ==================== States ====================
  const [spinners, setSpinners] = useState({
    page: true,
    submitting: false,
  })
  const [logoError, setLogoError] = useState(false)
  const [appLinkCopied, setAppLinkCopied] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // ==================== Formulário ====================
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(barbershop),
    mode: 'onBlur',
  })

  const previewLogoUrl = useWatch({ control: form.control, name: 'logo_url' })
  const previewLogoFile = useWatch({ control: form.control, name: 'logo_file' })
  const previewCompanyName = useWatch({ control: form.control, name: 'company_name' })
  const previewPrimaryColor = useWatch({ control: form.control, name: 'primary_color' })
  const previewLogoSrc = previewLogoFile || previewLogoUrl

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

  const getDominantColor = (src: string): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(null)
          return
        }

        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let count = 0

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha < 128) continue

          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count += 1
        }

        if (!count) {
          resolve(null)
          return
        }

        resolve(rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count)))
      }
      img.onerror = () => resolve(null)
      img.src = src
    })

  // Reset logo error when URL changes
  useEffect(() => {
    setLogoError(false)
  }, [previewLogoUrl, previewLogoFile])

  useEffect(() => {
    if (!previewLogoSrc) return

    let cancelled = false

    getDominantColor(previewLogoSrc).then((color) => {
      if (cancelled || !color) return
      if (color.toLowerCase() === (previewPrimaryColor || '').toLowerCase()) return

      form.setValue('primary_color', color, { shouldDirty: true, shouldValidate: true })
    })

    return () => {
      cancelled = true
    }
  }, [form, previewLogoSrc, previewPrimaryColor])

  // ==================== Submit ====================
  const onSubmit = async (values: Schema) => {
    const hasChanges =
      !barbershop?.app_link ||
      form.formState.dirtyFields.company_name ||
      form.formState.dirtyFields.phone ||
      form.formState.dirtyFields.address ||
      form.formState.dirtyFields.street ||
      form.formState.dirtyFields.city ||
      form.formState.dirtyFields.state ||
      form.formState.dirtyFields.zip_code ||
      form.formState.dirtyFields.number ||
      form.formState.dirtyFields.complement ||
      form.formState.dirtyFields.instagram ||
      form.formState.dirtyFields.logo_url ||
      form.formState.dirtyFields.logo_file ||
      form.formState.dirtyFields.primary_color ||
      form.formState.dirtyFields.whatsapp_message

    const shouldRefreshAuth = !!(
      form.formState.dirtyFields.company_name ||
      form.formState.dirtyFields.logo_url ||
      form.formState.dirtyFields.logo_file ||
      form.formState.dirtyFields.primary_color
    )

    if (!hasChanges) return

    if (previewLogoUrl && logoError) {
      toast.error('Erro ao carregar o logo. Verifique a URL.')
      return
    }

    setSpinners((prev) => ({ ...prev, submitting: true }))
    setAutoSaveStatus('saving')

    try {
      const appLink = barbershop?.id
        ? `${window.location.origin}/agendafy/auth/login?barbershop_id=${barbershop.id}`
        : values.app_link

      const response = await axios.put<ApiResponse>(`/barber-shops/${barbershop?.id}`, {
        ...values,
        app_link: appLink,
      })
      const { data } = response

      if (data.success) {
        setAutoSaveStatus('saved')
        form.reset(values)
        if (shouldRefreshAuth) {
          refreshAuth()
        }
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } else {
        toast.error(data.message || 'Erro ao salvar configurações.')
        setAutoSaveStatus('idle')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar configurações.')
      setAutoSaveStatus('idle')
    } finally {
      setSpinners((prev) => ({ ...prev, submitting: false }))
    }
  }

  // ==================== Auto-save ====================
  const handleAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      form.handleSubmit(onSubmit)()
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  // atualizar formulário quando os dados da barbearia mudarem
  useEffect(() => {
    if (barbershop) {
      form.reset(defaultValues(barbershop))
      setSpinners((prev) => ({ ...prev, page: false }))
    }
  }, [barbershop])

  // ==================== FUNÇÕES AUXILIARES ====================
  const getCEPInformations = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then((r) => r.json())

      if (response.erro === 'true') {
        toast.error('CEP não encontrado. Verifique o número digitado.')
        return
      } else {
        const { logradouro, localidade, uf } = response
        form.setValue('street', logradouro, { shouldDirty: true, shouldValidate: true })
        form.setValue('city', localidade, { shouldDirty: true, shouldValidate: true })
        form.setValue('state', uf, { shouldDirty: true, shouldValidate: true })
        handleAutoSave()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // ==================== Copiar Link do App ====================
  const handleCopyAppLink = () => {
    if (!barbershop?.id) return

    const appLink = barbershop.app_link
      ? barbershop.app_link
      : `${window.location.origin}/agendafy/auth/login?barbershop_id=${barbershop.id}`
    navigator.clipboard.writeText(appLink)
    setAppLinkCopied(true)
    toast.success('Link do app copiado para a área de transferência!')
    setTimeout(() => setAppLinkCopied(false), 2000)
  }

  if (spinners.page) {
    return <PageSkeleton />
  }

  return (
    <div className='min-w-2xl mx-auto space-y-6'>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold hidden lg:block'>Configurações</h1>
            <p className='text-muted-foreground'>Personalize sua barbearia</p>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            {autoSaveStatus === 'saving' && (
              <span className='flex items-center gap-1.5 text-muted-foreground'>
                <Loader2Icon className='h-4 w-4 animate-spin' />
                Salvando...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className='flex items-center gap-1.5 text-green-500'>
                <CheckIcon className='h-4 w-4' />
                Salvo
              </span>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className='space-y-6' onBlur={handleAutoSave}>
          {/* Configurações */}
          <div className='flex gap-3'>
            <Link to='account' className='flex-1'>
              <Button type='button' className='size-12 w-full' variant='outline'>
                <span className='flex items-center gap-2'>
                  <UserIcon className='h-4 w-4' /> Minha Conta
                </span>
                <ChevronRightIcon className='h-4 w-4' />
              </Button>
            </Link>
            <Link to='panel' className='flex-1'>
              <Button type='button' className='size-12 w-full' variant='outline'>
                <span className='flex items-center gap-2'>
                  <PaletteIcon className='h-4 w-4' /> Configurações do Painel
                </span>
                <ChevronRightIcon className='h-4 w-4' />
              </Button>
            </Link>
          </div>

          {/* App Link */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <LinkIcon color={barbershop?.primary_color} />
                Link do App
              </CardTitle>
              <CardDescription>Compartilhe este link com seus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex gap-2'>
                <Input
                  readOnly
                  type='url'
                  className='font-mono'
                  placeholder='https://seu_link_aparecera_aqui.com'
                  value={
                    barbershop?.id
                      ? barbershop.app_link
                        ? barbershop.app_link
                        : `${window.location.origin}/agendafy/auth/login?barbershop_id=${barbershop.id}`
                      : ''
                  }
                />
                <Button type='button' variant='outline' size='icon' onClick={handleCopyAppLink}>
                  {appLinkCopied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardContent className='space-y-8'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2 font-bold text-lg'>
                  <BuildingIcon color={barbershop?.primary_color} />
                  Informações Básicas
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name='company_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Nome da Barbearia</FormLabel>
                      <FormControl>
                        <Input placeholder='Nome da Barbearia' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='space-y-4'>
                <div className='flex items-center gap-2 font-bold text-lg'>
                  <ContactIcon color={barbershop?.primary_color} />
                  Redes Sociais e Contato
                </div>

                <Separator />

                <div className='flex justify-between gap-3'>
                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>
                          <PhoneIcon size={16} />
                          Telefone / Whatsapp
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='(00) 00000-0000'
                            maxLength={15}
                            value={formatPhoneDisplay(field.value || '')}
                            onChange={(e) => {
                              const unformatted = unformatPhone(e.target.value)
                              if (unformatted.length <= 11) {
                                field.onChange(unformatted)
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='instagram'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>
                          <img src={instagramSVG} alt='Instagram' className='inline-block w-4' />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder='@suabarbearia' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Card className='border-l-4 border-l-green-400'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-green-300'>
                      <img src={whatsappSVG} alt='WhatsApp' className='inline-block w-5' />
                      Mensagem de Boas-Vindas do WhatsApp
                    </CardTitle>
                    <CardDescription>
                      Os clientes enviarão esta mensagem ao clicar no seu contato do WhatsApp.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name='whatsapp_message'
                      render={({ field }) => (
                        <FormItem className='w-full'>
                          <FormControl>
                            <Textarea
                              className='max-w-2xl resize-none'
                              maxLength={255}
                              placeholder='Digite sua mensagem de boas-vindas'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>Até 255 caracteres</p>
                    <Badge className='rounded-sm text-green-300 bg-green-400/10 border-green-400/10'>
                      {form.watch('whatsapp_message')?.length || 0}/255
                    </Badge>
                  </CardFooter>
                </Card>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center gap-2 font-bold text-lg'>
                  <MapPinIcon color={barbershop?.primary_color} />
                  Localização
                </div>

                <Separator />

                <div className='flex justify-between gap-3'>
                  <FormField
                    control={form.control}
                    name='zip_code'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder='00000-000'
                            value={formatCEPDisplay(field.value || '')}
                            onChange={(e) => {
                              const unformatted = unformatCEP(e.target.value)
                              if (unformatted.length <= 8) {
                                field.onChange(unformatted)
                                if (unformatted.length === 8) {
                                  getCEPInformations(unformatted)
                                } else {
                                  handleAutoSave()
                                }
                              }
                            }}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='state'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder='Estado' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='city'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder='Cidade' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='flex justify-between gap-3'>
                  <FormField
                    control={form.control}
                    name='street'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormLabel>Endereço (Rua/Avenida)</FormLabel>
                        <FormControl>
                          <Input placeholder='Rua, número, bairro, cidade' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='address'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input type='number' placeholder='Número' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='complement'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>
                        Complemento
                        <span className='text-muted-foreground'> (opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Apartamento, bloco, etc.' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Whitelabel */}
          <Card>
            <CardHeader>
              <CardTitle>Personalização Visual</CardTitle>
              <CardDescription>Customize a aparência do seu app</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Tabs
                defaultValue='url'
                onValueChange={() => {
                  const isFilled =
                    form.getValues('logo_url')!.length > 0 || form.getValues('logo_file') !== null

                  if (!isFilled) form.setValue('logo_url', '')
                }}
              >
                <TabsList>
                  <TabsTrigger value='url'>URL</TabsTrigger>
                  <TabsTrigger value='file'>Arquivo</TabsTrigger>
                </TabsList>
                <TabsContent value='url'>
                  <FormField
                    control={form.control}
                    name='logo_url'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logo</FormLabel>
                        <FormControl>
                          <Input
                            type='url'
                            className='font-mono'
                            placeholder='https://exemplo.com/logo.png'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        {previewLogoUrl && logoError && (
                          <p className='text-xs text-destructive mt-1'>
                            Erro ao carregar imagem. Verifique a URL.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value='file'>
                  <FormField
                    control={form.control}
                    name='logo_file'
                    render={({ field }) => {
                      const { onChange, value: _value, ...fieldProps } = field

                      return (
                        <FormItem>
                          <FormLabel>Arquivo do Logo</FormLabel>
                          <FormControl>
                            <Input
                              type='file'
                              {...fieldProps}
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    const base64String = reader.result as string
                                    onChange(base64String)
                                  }
                                  reader.readAsDataURL(file)
                                } else {
                                  onChange(null)
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </TabsContent>
              </Tabs>

              <FormField
                control={form.control}
                name='primary_color'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Cor Principal</FormLabel>
                    <FormControl>
                      <div className='flex gap-2'>
                        <Input
                          type='color'
                          value={field.value || '#000000'}
                          onChange={(event) => field.onChange(event.target.value)}
                          className='w-14'
                        />
                        <Input
                          placeholder='#000000'
                          maxLength={7}
                          value={field.value || '#'}
                          onKeyDown={(event) => {
                            if (event.key === 'Backspace' && (field.value || '#') === '#') {
                              event.preventDefault()
                            }
                          }}
                          onChange={(event) => {
                            const rawValue = event.target.value
                            const nextValue = rawValue.startsWith('#')
                              ? rawValue
                              : `#${rawValue.slice(1)}`
                            field.onChange(nextValue)
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview */}
              <div className='mt-4 p-4 rounded-lg border'>
                <p className='text-sm text-muted-foreground mb-3'>Prévia</p>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 rounded-full flex items-center justify-center bg-muted'>
                    {previewLogoSrc && !logoError ? (
                      <img
                        src={previewLogoSrc}
                        alt='Logo'
                        className='w-12 h-12 rounded-full object-cover'
                        onError={() => setLogoError(true)}
                        onLoad={() => setLogoError(false)}
                      />
                    ) : (
                      <ScissorsIcon className='h-6 w-6 text-muted-foreground' />
                    )}
                  </div>
                  <span className='font-semibold'>{previewCompanyName}</span>
                </div>
                <Button
                  type='button'
                  className='mt-3 w-full'
                  style={{
                    backgroundColor: previewPrimaryColor,
                    borderColor: previewPrimaryColor,
                    color: '#FFFFFF',
                  }}
                >
                  Exemplo de Botão
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
