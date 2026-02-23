import { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { accountApi } from '@/lib/api';

export type BankAccount = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  currency: string;
  lastFour?: string;
};

// Helper to convert API response to BankAccount
function apiToAccount(apiAccount: {
  id: number;
  name: string;
  bank_name: string;
  balance: number;
  currency: string;
  last_four?: string;
}): BankAccount {
  return {
    id: String(apiAccount.id),
    name: apiAccount.name,
    bankName: apiAccount.bank_name,
    balance: apiAccount.balance,
    currency: apiAccount.currency,
    lastFour: apiAccount.last_four,
  };
}

type AccountsState = {
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
};

type AccountsAction =
  | { type: 'SET_ACCOUNTS'; payload: BankAccount[] }
  | { type: 'ADD'; payload: BankAccount }
  | { type: 'UPDATE'; payload: BankAccount }
  | { type: 'DELETE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

type AccountsContextType = {
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
  addAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;
  updateAccount: (account: BankAccount) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccount: (id: string) => BankAccount | undefined;
   transfer: (params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    description?: string;
  }) => Promise<void>;
  refreshAccounts: () => Promise<void>;
};

function accountsReducer(state: AccountsState, action: AccountsAction): AccountsState {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload, loading: false, error: null };
    case 'ADD':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(accountsReducer, {
    accounts: [],
    loading: true,
    error: null,
  });

  const loadAccounts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await accountApi.getAll();
    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    } else if (result.data) {
      const accounts = result.data.map(apiToAccount);
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const addAccount = useCallback(async (account: Omit<BankAccount, 'id'>) => {
    const result = await accountApi.create({
      name: account.name,
      bank_name: account.bankName,
      balance: account.balance,
      currency: account.currency,
      last_four: account.lastFour,
    });

    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else if (result.data) {
      const newAccount = apiToAccount(result.data);
      dispatch({ type: 'ADD', payload: newAccount });
    }
  }, []);

  const updateAccount = useCallback(async (account: BankAccount) => {
    const result = await accountApi.update(parseInt(account.id), {
      name: account.name,
      bank_name: account.bankName,
      balance: account.balance,
      currency: account.currency,
      last_four: account.lastFour,
    });

    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else if (result.data) {
      const updatedAccount = apiToAccount(result.data);
      dispatch({ type: 'UPDATE', payload: updatedAccount });
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    const result = await accountApi.delete(parseInt(id));
    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      throw new Error(result.error);
    } else {
      dispatch({ type: 'DELETE', payload: id });
    }
  }, []);

  const transfer = useCallback(
    async (params: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      currency: string;
      description?: string;
    }) => {
      const result = await accountApi.transfer({
        from_account_id: parseInt(params.fromAccountId),
        to_account_id: parseInt(params.toAccountId),
        amount: params.amount,
        currency: params.currency,
        description: params.description,
      });

      if (result.error) {
        dispatch({ type: 'SET_ERROR', payload: result.error });
        throw new Error(result.error);
      } else if (result.data) {
        const updatedFrom = apiToAccount(result.data.from_account);
        const updatedTo = apiToAccount(result.data.to_account);
        dispatch({ type: 'UPDATE', payload: updatedFrom });
        dispatch({ type: 'UPDATE', payload: updatedTo });
      }
    },
    [],
  );

  const getAccount = useCallback((id: string) => {
    return state.accounts.find((a) => a.id === id);
  }, [state.accounts]);

  return (
    <AccountsContext.Provider
      value={{
        accounts: state.accounts,
        loading: state.loading,
        error: state.error,
        addAccount,
        updateAccount,
        deleteAccount,
        getAccount,
        transfer,
        refreshAccounts: loadAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountsProvider');
  }
  return context;
}
