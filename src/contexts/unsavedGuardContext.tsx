import { createContext, useContext } from "react";

interface UnsavedGuardContextValue {
  guardedCloseDocument: (id: string) => Promise<void>;
}

export const UnsavedGuardContext = createContext<UnsavedGuardContextValue>({
  guardedCloseDocument: async () => {},
});

export const useUnsavedGuard = () => useContext(UnsavedGuardContext);
