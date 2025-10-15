// components/ui/AlertProvider.tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import AlertToast, { AlertToastProps } from './AlertToast';

type ShowArgs = Omit<AlertToastProps, 'open' | 'onClose' | 'className'>;

const Ctx = createContext<(args: ShowArgs) => void>(() => {});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShowArgs | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((args: ShowArgs) => {
    setState(args);
    setOpen(true);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <AlertToast
        open={open}
        onClose={() => setOpen(false)}
        text={state?.text ?? ''}
        variant={state?.variant ?? 'success'}
        duration={state?.duration ?? 2500}
      />
    </Ctx.Provider>
  );
}

export const useAlert = () => useContext(Ctx);
