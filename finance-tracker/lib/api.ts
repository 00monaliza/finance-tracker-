import { API_CONFIG } from './config';
import { storage } from './storage';

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const userId = await storage.getUserId();
    const headers: HeadersInit = {
      ...API_CONFIG.headers,
      ...options.headers,
    };

    // Add user_id header if available
    if (userId) {
      headers['X-User-Id'] = userId.toString();
    }

    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ detail: 'Request failed' }));

      let message: string | undefined;
      const detail = errorData?.detail;

      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI validation errors usually come as a list
        message = detail
          .map((d) => d?.msg || d?.detail || JSON.stringify(d))
          .join('; ');
      } else if (detail && typeof detail === 'object') {
        message = JSON.stringify(detail);
      } else if (errorData && typeof errorData === 'object') {
        message = JSON.stringify(errorData);
      }

      return { error: message || `HTTP ${response.status}` };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Account API
export const accountApi = {
  async getAll() {
    return request<Array<{
      id: number;
      user_id: number;
      name: string;
      bank_name: string;
      balance: number;
      currency: string;
      last_four?: string;
      created_at: string;
      updated_at?: string;
    }>>('/api/accounts');
  },

  async create(account: {
    name: string;
    bank_name: string;
    balance: number;
    currency: string;
    last_four?: string;
  }) {
    return request('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  },

  async update(id: number, updates: Partial<{
    name: string;
    bank_name: string;
    balance: number;
    currency: string;
    last_four?: string;
  }>) {
    return request(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: number) {
    return request(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  async transfer(payload: {
    from_account_id: number;
    to_account_id: number;
    amount: number;
    currency: string;
    description?: string;
  }) {
    return request<{
      from_account: {
        id: number;
        user_id: number;
        name: string;
        bank_name: string;
        balance: number;
        currency: string;
        last_four?: string;
        created_at: string;
        updated_at?: string;
      };
      to_account: {
        id: number;
        user_id: number;
        name: string;
        bank_name: string;
        balance: number;
        currency: string;
        last_four?: string;
        created_at: string;
        updated_at?: string;
      };
    }>('/api/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Transaction API
export const transactionApi = {
  async getAll(type?: 'expense' | 'income') {
    const url = type ? `/api/transactions?type=${type}` : '/api/transactions';
    return request<Array<{
      id: number;
      user_id: number;
      account_id?: number;
      type: string;
      category: string;
      amount: number;
      currency: string;
      description: string;
      date: string;
      created_at: string;
    }>>(url);
  },

  async create(transaction: {
    type: 'expense' | 'income';
    category: string;
    amount: number;
    currency: string;
    description: string;
    account_id?: number;
    date?: string;
  }) {
    return request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async update(id: number, updates: Partial<{
    type: 'expense' | 'income';
    category: string;
    amount: number;
    currency: string;
    description: string;
    account_id?: number;
    date?: string;
  }>) {
    return request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: number) {
    return request(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats() {
    return request<{
      total_expenses: number;
      total_income: number;
      balance: number;
      expenses_by_category: Record<string, number>;
      income_by_category: Record<string, number>;
    }>('/api/transactions/stats/summary');
  },
};

// Auth API
export const authApi = {
  async sendCode(phone: string) {
    return request<{ message: string; phone: string }>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyCode(phone: string, code: string) {
    return request<{ user_id: number; phone: string; message: string }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },
};
