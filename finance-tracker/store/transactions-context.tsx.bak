import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { transactionApi } from '@/lib/api';

// ── Category definitions ──

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'clothing'
  | 'health'
  | 'communication'
  | 'subscriptions'
  | 'education'
  | 'other_expense';

export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'gifts'
  | 'business'
  | 'other_income';

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  food:           { label: 'Еда',           emoji: '🍔', color: '#FF6B6B' },
  transport:      { label: 'Транспорт',     emoji: '🚗', color: '#4ECDC4' },
  housing:        { label: 'Жильё',         emoji: '🏠', color: '#45B7D1' },
  entertainment:  { label: 'Развлечения',   emoji: '🎬', color: '#96CEB4' },
  clothing:       { label: 'Одежда',        emoji: '👕', color: '#FFEAA7' },
  health:         { label: 'Здоровье',      emoji: '💊', color: '#DDA0DD' },
  communication:  { label: 'Связь',         emoji: '📱', color: '#74B9FF' },
  subscriptions:  { label: 'Подписки',      emoji: '📺', color: '#A29BFE' },
  education:      { label: 'Образование',   emoji: '📚', color: '#FDCB6E' },
  other_expense:  { label: 'Другое',        emoji: '📦', color: '#B2BEC3' },
};

export const INCOME_CATEGORIES: Record<IncomeCategory, { label: string; emoji: string; color: string }> = {
  salary:       { label: 'Зарплата',     emoji: '💰', color: '#00B894' },
  freelance:    { label: 'Фриланс',      emoji: '💻', color: '#0984E3' },
  investments:  { label: 'Инвестиции',    emoji: '📈', color: '#6C5CE7' },
  gifts:        { label: 'Подарки',       emoji: '🎁', color: '#E17055' },
  business:     { label: 'Бизнес',        emoji: '🏢', color: '#00CEC9' },
  other_income: { label: 'Другое',        emoji: '💵', color: '#B2BEC3' },
};

// ── Transaction type ──

export type Transaction = {
  id: string;
  type: 'expense' | 'income';
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  currency: string;
  description: string;
  date: string; // ISO string
};

// ── Helper functions ──

function apiToTransaction(apiTx: {
  id: number;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
}): Transaction {
  return {
    id: String(apiTx.id),
    type: apiTx.type as 'expense' | 'income',
    category: apiTx.category as ExpenseCategory | IncomeCategory,
    amount: apiTx.amount,
    currency: apiTx.currency,
    description: apiTx.description,
    date: apiTx.date,
  };
}

// ── State & actions ──

type TransactionsState = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  stats: {
    totalExpenses: number;
    totalIncome: number;
    expensesByCategory: Record<string, number>;
    incomeByCategory: Record<string, number>;
  } | null;
};

type TransactionsAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD'; payload: Transaction }
  | { type: 'UPDATE'; payload: Transaction }
  | { type: 'DELETE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATS'; payload: TransactionsState['stats'] };

type TransactionsContextType = {
  transactions: Transaction[];
  expenses: Transaction[];
  income: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Transaction | undefined;
  totalExpenses: number;
  totalIncome: number;
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  refreshTransactions: () => Promise<void>;
  refreshStats: () => Promise<void>;
};

function transactionsReducer(state: TransactionsState, action: TransactionsAction): TransactionsState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, loading: false, error: null };
    case 'ADD':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transactionsReducer, {
    transactions: [],
    loading: true,
    error: null,
    stats: null,
  });

  const loadTransactions = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await transactionApi.getAll();
    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    } else if (result.data) {
      const transactions = result.data.map(apiToTransaction);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    }
  }, []);

  const loadStats = useCallback(async () => {
    const result = await transactionApi.getStats();
    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    } else if (result.data) {
      dispatch({
        type: 'SET_STATS',
        payload: {
          totalExpenses: result.data.total_expenses,
          totalIncome: result.data.total_income,
          expensesByCategory: result.data.expenses_by_category,
          incomeByCategory: result.data.income_by_category,
        },
      });
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [loadTransactions, loadStats]);

  const expenses = state.transactions.filter((t) => t.type === 'expense');
  const income = state.transactions.filter((t) => t.type === 'income');

  // Use stats from API if available, otherwise calculate from transactions
  const totalExpenses = state.stats?.totalExpenses ?? expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = state.stats?.totalIncome ?? income.reduce((s, t) => s + t.amount, 0);
  const expensesByCategory = state.stats?.expensesByCategory ?? {};
  const incomeByCategory = state.stats?.incomeByCategory ?? {};

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    const result = await transactionApi.create({
      type: t.type,
      category: t.category,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      date: t.date,
    });

    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else if (result.data) {
      const newTransaction = apiToTransaction(result.data);
      dispatch({ type: 'ADD', payload: newTransaction });
      // Refresh stats after adding
      await loadStats();
    }
  }, [loadStats]);

  const updateTransaction = useCallback(async (t: Transaction) => {
    const result = await transactionApi.update(parseInt(t.id), {
      type: t.type,
      category: t.category,
      amount: t.amount,
      currency: t.currency,
      description: t.description,
      date: t.date,
    });

    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else if (result.data) {
      const updatedTransaction = apiToTransaction(result.data);
      dispatch({ type: 'UPDATE', payload: updatedTransaction });
      // Refresh stats after updating
      await loadStats();
    }
  }, [loadStats]);

  const deleteTransaction = useCallback(async (id: string) => {
    const result = await transactionApi.delete(parseInt(id));
    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else {
      dispatch({ type: 'DELETE', payload: id });
      // Refresh stats after deleting
      await loadStats();
    }
  }, [loadStats]);

  const getTransaction = useCallback((id: string) => {
    return state.transactions.find((t) => t.id === id);
  }, [state.transactions]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions: state.transactions,
        expenses,
        income,
        loading: state.loading,
        error: state.error,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransaction,
        totalExpenses,
        totalIncome,
        expensesByCategory,
        incomeByCategory,
        refreshTransactions: loadTransactions,
        refreshStats: loadStats,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
