import { createContext, useContext, useState, type ReactNode } from "react";

interface Customer {
    id: string;
    name?: string;
}

interface CustomerContextValue {
    customer: Customer | null;
    setCustomer: (customer: Customer) => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  return <CustomerContext.Provider value={{ customer, setCustomer }}>{children}</CustomerContext.Provider>;
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