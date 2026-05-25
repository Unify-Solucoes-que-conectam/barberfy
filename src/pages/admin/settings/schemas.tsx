import { z } from 'zod'

import type { BarberShop } from '@/types/consults'

const schema = z.object({
  company_name: z.string().min(1, 'O nome da empresa é obrigatório.'),
  phone: z.string().max(15, 'O telefone deve ter no máximo 15 caracteres.').optional(),
  whatsapp_message: z
    .string()
    .max(255, 'A mensagem de boas-vindas deve ter no máximo 255 caracteres.')
    .optional(),

  // Campos de endereço
  zip_code: z.string().max(9, 'O CEP deve ter no máximo 9 caracteres.').optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  address: z.string().optional(),

  instagram: z.string().optional(),
  logo_url: z.string().optional(),
  logo_file: z.any().optional(),
  app_link: z.string().optional(),
  primary_color: z
    .string()
    .min(7, 'A cor primária é obrigatória.')
    .max(7, 'A cor primária é obrigatória.'),
})

export type Schema = z.infer<typeof schema>

export const defaultValues = (data?: BarberShop | null): Schema => ({
  company_name: data?.company_name || '',
  phone: data?.phone || '',
  whatsapp_message: data?.whatsapp_message || '',
  street: data?.street || '',
  city: data?.city || '',
  state: data?.state || '',
  address: data?.address || '', // O número não está presente na resposta da API, então deixamos como string vazia
  complement: data?.complement || '', // O complemento não está presente na resposta da API, então deixamos como string vazia
  zip_code: data?.zip_code || '', // O CEP não está presente na resposta da API, então deixamos como string vazia
  instagram: data?.instagram || '',
  logo_url: data?.logo_url || '',
  logo_file: null,
  app_link: data?.app_link || '',
  primary_color: data?.primary_color || '#000000',
})

export default schema
