import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
  initials: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

// Usuario hardcodeado (proyecto universitario, no hay backend).
const DEMO_USER: User = {
  name: 'Andrea Vásquez',
  email: 'admin@losrobles.com',
  role: 'Administradora',
  initials: 'AV',
};
const DEMO_PASSWORD = 'admin123';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Splash sintético: damos ~900ms para que el branding se vea antes
  // de mandar al usuario al login/tabs.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulamos latencia de red.
    await new Promise((r) => setTimeout(r, 600));
    if (
      email.trim().toLowerCase() === DEMO_USER.email &&
      password === DEMO_PASSWORD
    ) {
      setUser(DEMO_USER);
      return true;
    }
    return false;
  };

  const signOut = () => setUser(null);

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}

export const DEMO_CREDENTIALS = {
  email: DEMO_USER.email,
  password: DEMO_PASSWORD,
};
