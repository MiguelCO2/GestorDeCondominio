import { authenticateWithBiometrics } from '@/services/biometric.service';
import { clearSession, getSession, saveSession } from '@/services/session.service';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  name: string;
  initials: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signInWithBiometrics: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (payload: RegisterPayload) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

type LoginResponse = {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    phone: string;
    role: string;
    is_active: boolean;
  };
};

type RegisterPayload = {
  email: string;
  username: string;
  full_name: string;
  phone: string;
  role: string;
  password: string;
  password_confirm: string;
};

const Ctx = createContext<AuthCtx | null>(null);

function getInitials(name: string, email: string) {
  const base = name?.trim() || email;
  const parts = base.split(' ').filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

function normalizeUser(user: LoginResponse['user']): User {
  const name = user.full_name || user.username || user.email;

  return {
    ...user,
    name,
    initials: getInitials(name, user.email),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login/', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { access, refresh, user } = response.data;

      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(normalizeUser(user));

      api.defaults.headers.common.Authorization = `Bearer ${access}`;

      await saveSession({
        access,
        refresh,
        user: normalizeUser(user),
      });

      return true;
    } catch (error) {
      console.log('Login error:', error);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      delete api.defaults.headers.common.Authorization;
      return false;
    }
  };

  const signUp = async (payload: RegisterPayload) => {
    try {
      const response = await api.post<LoginResponse>('/auth/register/', {
        ...payload,
        email: payload.email.trim().toLowerCase(),
        username: payload.username.trim(),
        full_name: payload.full_name.trim(),
        phone: payload.phone.trim(),
        role: 'resident',
      });
  
      const { access, refresh, user } = response.data;
      const normalizedUser = normalizeUser(user);
  
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(normalizedUser);
  
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
  
      await saveSession({
        access,
        refresh,
        user: normalizedUser,
      });
  
      return {
        ok: true,
      };
    } catch (error: any) {
      const backendError = error?.response?.data;
  
      console.log('Register error:', backendError || error?.message || error);
  
      if (backendError?.email?.[0]) {
        return {
          ok: false,
          message: backendError.email[0],
        };
      }
  
      if (backendError?.username?.[0]) {
        return {
          ok: false,
          message: backendError.username[0],
        };
      }
  
      if (backendError?.phone?.[0]) {
        return {
          ok: false,
          message: backendError.phone[0],
        };
      }
  
      if (backendError?.password?.[0]) {
        return {
          ok: false,
          message: backendError.password[0],
        };
      }
  
      if (backendError?.password_confirm?.[0]) {
        return {
          ok: false,
          message: backendError.password_confirm[0],
        };
      }
  
      if (backendError?.detail) {
        return {
          ok: false,
          message: backendError.detail,
        };
      }
  
      return {
        ok: false,
        message: 'No se pudo crear la cuenta. Verifica los datos.',
      };
    }
  };

  // const signUp = async (payload: RegisterPayload) => {
  //   try {
  //     const response = await api.post<LoginResponse>('/auth/register/', {
  //       ...payload,
  //       email: payload.email.trim().toLowerCase(),
  //       username: payload.username.trim(),
  //       full_name: payload.full_name.trim(),
  //       phone: payload.phone.trim(),
  //       role: 'resident',
  //     });

  //     const { access, refresh, user } = response.data;
  //     const normalizedUser = normalizeUser(user);

  //     setAccessToken(access);
  //     setRefreshToken(refresh);
  //     setUser(normalizedUser);

  //     api.defaults.headers.common.Authorization = `Bearer ${access}`;

  //     await saveSession({
  //       access,
  //       refresh,
  //       user: normalizedUser,
  //     });

  //     return true;
  //   } catch (error: any) {
  //     console.log('Register error:', error?.response?.data || error?.message || error);
  //     return false;
  //   }
  // };

  const signInWithBiometrics = async () => {
    try {
      const session = await getSession();

      if (!session) {
        return false;
      }

      const biometricResult = await authenticateWithBiometrics();

      if (!biometricResult.success) {
        return false;
      }

      setAccessToken(session.access);
      setRefreshToken(session.refresh);
      setUser(session.user);

      api.defaults.headers.common.Authorization = `Bearer ${session.access}`;

      return true;
    } catch (error) {
      console.log('Biometric login error:', error);
      return false;
    }
  };

  const signOut = async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    delete api.defaults.headers.common.Authorization;
    await clearSession();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        accessToken,
        refreshToken,
        signIn,
        signUp,
        signInWithBiometrics,
        signOut,
      }}
    >
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
  email: 'admin@losrobles.com',
  password: 'admin123',
};

// import { createContext, useContext, useEffect, useState } from 'react';

// interface User {
//   name: string;
//   email: string;
//   role: string;
//   initials: string;
// }

// interface AuthCtx {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<boolean>;
//   signOut: () => void;
// }

// const Ctx = createContext<AuthCtx | null>(null);

// // Usuario hardcodeado
// const DEMO_USER: User = {
//   name: 'Andrea Vásquez',
//   email: 'admin@losrobles.com',
//   role: 'Administradora',
//   initials: 'AV',
// };
// const DEMO_PASSWORD = 'admin123';

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Splash sintético: damos ~900ms para que el branding se vea antes
//   // de mandar al usuario al login/tabs.
//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 900);
//     return () => clearTimeout(t);
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     // Simulamos latencia de red.
//     await new Promise((r) => setTimeout(r, 600));
//     if (
//       email.trim().toLowerCase() === DEMO_USER.email &&
//       password === DEMO_PASSWORD
//     ) {
//       setUser(DEMO_USER);
//       return true;
//     }
//     return false;
//   };

//   const signOut = () => setUser(null);

//   return (
//     <Ctx.Provider value={{ user, loading, signIn, signOut }}>
//       {children}
//     </Ctx.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(Ctx);
//   if (!ctx) throw new Error('useAuth fuera de AuthProvider');
//   return ctx;
// }

// export const DEMO_CREDENTIALS = {
//   email: DEMO_USER.email,
//   password: DEMO_PASSWORD,
// };
