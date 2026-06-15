/**
 * Cria uma lista de todos os meses do ano
 */
export function getMonthList(
  locale: string = 'pt-BR',
  formato: 'long' | 'short' = 'long'
): string[] {
  const anoAtual = new Date().getFullYear()
  const formatter = new Intl.DateTimeFormat(locale, { month: formato })

  // Cria um array com 12 posições e mapeia para o nome do mês
  return Array.from({ length: 12 }, (_, indice) => {
    const data = new Date(anoAtual, indice, 1)
    return formatter.format(data)
  })
}

/**
 * Cria uma lista de anos começando pelo ano atual até um determinado ano no passado
 */
export function getYearList(minYear: number = new Date().getFullYear()): number[] {
  const anoAtual = new Date().getFullYear()
  return Array.from({ length: anoAtual - minYear + 1 }, (_, indice) => minYear + indice)
}
