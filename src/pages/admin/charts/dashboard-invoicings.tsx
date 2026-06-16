import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { InvoicingByYear } from '@/types/consults'
import { formatCurrency } from '@/utils/formatters'
import { getYearList } from '@/utils/list'

interface InvoicingChartProps {
  config: ChartConfig
  data: InvoicingByYear[]
  year: number
  onYearChange: (year: number) => void
}

export default function InvoicingChart(props: InvoicingChartProps) {
  return (
    <Card className='w-full'>
      <CardHeader className='flex items-center justify-between'>
        <div className='flex flex-col gap-1'>
          <CardTitle>Faturamento Anual</CardTitle>
          <CardDescription>Comparativo mês a mês</CardDescription>
        </div>
        <Select
          value={props.year.toString()}
          onValueChange={(val) => props.onYearChange(Number(val))}
        >
          <SelectTrigger className='w-full max-w-48'>
            <SelectValue placeholder='Selecione o ano' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Ano</SelectLabel>
              {getYearList(2024).map((year, index) => (
                <SelectItem key={index} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={props.config}>
          <LineChart accessibilityLayer data={props.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='month' tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className='flex gap-2'>
                      <div className='p-2 rounded-sm bg-blue-500'></div>
                      <span className='text-xs text-muted-foreground'>Faturamento: </span>
                      {formatCurrency(Number(value))}
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey='total'
              type='linear'
              stroke='var(--color-blue-500)'
              strokeWidth={2}
              dot={false}
              animationDuration={500}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
