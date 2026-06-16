import type { NotificationType } from '@/hooks/use-echo'

export interface User {
  id: number
  name: string
  email: string | null
  phone: string | null
  profile_photo: string | null
  role: string
  first_access: number
  created_at: string
  updated_at: string
  barbershop_id: string
}

export interface BarberShop {
  id: string
  company_name: string
  domain: string | null
  primary_color: string
  logo_url: string | null
  logo_file: string | null
  app_link: string | null
  street: string | null
  city: string | null
  state: string | null
  address: string | null
  complement: string | null
  zip_code: string | null
  phone: string | null
  whatsapp_message: string | null
  instagram: string | null
  email: string | null
  created_at: string
  updated_at: string
  business_hours: BusinessHour[]
}

export interface Service {
  id: number
  barbershop_id: string
  name: string
  price: string
  duration_minutes: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  barbershop_id: string
  name: string
  description: string | null
  active: number
  created_at: string
  updated_at: string
  services: Service[]
}

export interface Appointment {
  id: number
  barbershop_id: string
  customer_id: number
  service_id: number
  date: string
  time: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  service: Service
  customer: User
}

export interface DashboardStats {
  today: number
  pending: number
  confirmed: number
  cancelled: number
}

export interface FinancialSummary {
  today_invoicing: {
    total: number
    invoincing_trend_porcentage: number
    isFirst: boolean
  }
  month_invoicing: number
  average_ticket: number
}

export interface InvoicingByYear {
  month: string
  total: number
}

export interface BusinessHour {
  id: string
  barbershop_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
  created_at: string | null
  updated_at: string | null
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  link: string | null
  sent_at: string
  read: boolean
}
