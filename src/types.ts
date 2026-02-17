// ─── User ────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Company ─────────────────────────────────────
export interface Area {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  area_id?: number;
  area?: Area;
  name: string;
  address?: string;
  industry?: string;
  phone?: string;
  contacts_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Contact ─────────────────────────────────────
export interface Contact {
  id: number;
  company_id: number;
  company?: { id: number; name: string };
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  deals_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Commission ──────────────────────────────────
export interface Commission {
  id: number;
  deal_id: number;
  deal?: {
    id: number;
    title: string;
    value: number;
    company?: string;
  };
  user?: { id: number; name: string } | null;
  amount: number;
  calculation_date?: string;
  status: 'pending' | 'paid';
  created_at?: string;
}

export interface CommissionSummary {
  monthly_total: number;
  pending_total: number;
  paid_total: number;
  month: number;
  year: number;
}

// ─── Activity Log ────────────────────────────────
export type ActivityType = 'call' | 'email' | 'meeting' | 'status_change' | 'note';

export interface ActivityLog {
  id: number;
  deal_id: number;
  user_id: number;
  user?: { id: number; name: string };
  activity_type: ActivityType;
  notes?: string;
  created_at?: string;
}

// ─── Deal ────────────────────────────────────────
export type DealStatus =
  | 'lead'
  | 'contacted'
  | 'qualified'
  | 'quotes_sent'
  | 'trial_order'
  | 'active_customer'
  | 'retained_growing'
  | 'lost_customer';

export interface Deal {
  id: number;
  title: string;
  value: number;
  status: DealStatus;
  color?: string;
  description?: string;
  company?: string;
  owner?: string;
  contact?: { id: number; name: string };
  commission?: Commission;
  activity_logs?: ActivityLog[];
  created_at?: string;
  updated_at?: string;
}

// ─── Dashboard Stats ─────────────────────────────
export interface DashboardStats {
  total_active_deals: number;
  monthly_commission: number;
  total_paid_commission: number;
  total_pending_commission: number;
  total_sales_revenue: number;
  total_won_value: number;
  deals_per_stage: Record<DealStatus, number>;
  month: number;
  year: number;
}

// ─── Kanban Column ───────────────────────────────
export interface KanbanColumnDef {
  id: DealStatus;
  label: string;
}

// ─── Auth ────────────────────────────────────────
export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ─── API Pagination ──────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
