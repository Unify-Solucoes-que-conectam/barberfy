export const nameFormatter = (name: string) => {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue)
}

export function phoneFormatter(phone: string): string {
  const cleaned = ('' + phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

export function phoneUnformatter(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Formata telefone brasileiro em tempo real conforme o usuário digita.
 * Suporta celular (11 dígitos) e fixo (10 dígitos).
 * Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function phoneMask(value: string): string {
  const cleaned = value.replace(/\D/g, '')

  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  // Celular com 9 dígitos
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}

// ======================= FORMATADORES PARA INPUTS =======================
export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}

export const unformatPhone = (phone: string) => {
  return phone.replace(/\D/g, '')
}

export const formatCEPDisplay = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length <= 5) return cleaned
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
}

export const unformatCEP = (cep: string) => {
  return cep.replace(/\D/g, '')
}
