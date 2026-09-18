import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Customer {
    id: string;
    name?: string;
}

interface CustomerContextValue {
    customer: Customer | null;
    isLoading: boolean;
    setCustomer: (customer: Customer) => void;
    logout: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);
const STORAGE_KEY = "gasmlangoni_customer";

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  // Starts true - we don't yet know if a stored cutomer exists, and
  // showing Onboarding for a split second before correcting to Main
  // would be visible flicker, not a clean experience.
  const [isLoading, setIsLoading] = useState(true);

  // Runs once, on mount - checks for a previously-registered customer
  // before we decide which screen to open on.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setCustomerState(JSON.parse(stored));
      })
      .catch((err) => {
        console.error("Failed to load stored customer:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Writes to disk, not just memory - this line is the actual fix.
  // Without it, state would reset to null every time the app fully 
  // restarts, regardless of anything else.
  async function setCustomer(newCustomer: Customer) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCustomer));
    setCustomerState(newCustomer);
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCustomerState(null);
  }

  return <CustomerContext.Provider value={{ customer, isLoading, setCustomer, logout }}>{children}</CustomerContext.Provider>;
}

// A small wrapper hook rather than expecting CustomerContext directly -
// this throws a clear error if some screen forgets it needs to be
// rendered inside <CustomerProvider>, instead of silently returning
// undefined and failing confusingly two lines later.
export function useCustomer() {
    const context = useContext(CustomerContext);
    if (!context) throw new Error("useCustomer must be used within a CustomerProvider");
    return context;
}