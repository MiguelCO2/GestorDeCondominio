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
  profile_image?: string | null;
  name: string;
  initials: string;
  is_linked: boolean;
  linked_property?: string | null;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signInWithBiometrics: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (payload: RegisterPayload) => Promise<{ ok: boolean; message?: string; email?: string }>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<{ ok: boolean; message?: string }>;
  resendVerificationCode: (email: string) => Promise<{ ok: boolean; message?: string }>;
  updateProfile: (payload: FormData) => Promise<{
    ok: boolean;
    message?: string;
    requiresEmailVerification?: boolean;
    pendingEmail?: string;
  }>;
  verifyEmailChange: (code: string) => Promise<{
    ok: boolean;
    message?: string;
  }>;
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
    profile_image?: string | null;
    is_linked?: boolean;
    linked_property?: string | null;
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

type RegisterResponse = {
  message: string;
  email: string;
};

type VerifyEmailPayload = {
  email: string;
  code: string;
};

type VerifyEmailChangeResponse = {
  message: string;
  user: LoginResponse['user'];
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
    is_linked: user.is_linked ?? false,
    linked_property: user.linked_property ?? null,
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
      const response = await api.post<RegisterResponse>('/auth/register/', {
        ...payload,
        email: payload.email.trim().toLowerCase(),
        username: payload.username.trim(),
        full_name: payload.full_name.trim(),
        phone: payload.phone.trim(),
        role: 'resident',
      });
  
      return {
        ok: true,
        message: response.data.message,
        email: response.data.email,
      };
    } catch (error: any) {
      const backendError = error?.response?.data;
  
      console.log('Register error:', backendError || error?.message || error);
  
      const getErrorMessage = (field: string) => {
        const fieldError = backendError?.[field];
  
        if (Array.isArray(fieldError)) {
          return fieldError[0];
        }
  
        if (typeof fieldError === 'string') {
          return fieldError;
        }
  
        return null;
      };
  
      const message =
        getErrorMessage('email') ||
        getErrorMessage('username') ||
        getErrorMessage('phone') ||
        getErrorMessage('password') ||
        getErrorMessage('password_confirm') ||
        backendError?.detail ||
        'No se pudo crear la cuenta. Verifica los datos.';
  
      return {
        ok: false,
        message,
      };
    }
  };

  const verifyEmail = async (payload: VerifyEmailPayload) => {
    try {
      const response = await api.post<LoginResponse>('/auth/verify-email/', {
        email: payload.email.trim().toLowerCase(),
        code: payload.code.trim(),
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
        message: 'Correo verificado correctamente.',
      };
    } catch (error: any) {
      const backendError = error?.response?.data;
  
      console.log('Verify email error:', backendError || error?.message || error);
  
      const getErrorMessage = (field: string) => {
        const fieldError = backendError?.[field];
  
        if (Array.isArray(fieldError)) {
          return fieldError[0];
        }
  
        if (typeof fieldError === 'string') {
          return fieldError;
        }
  
        return null;
      };
  
      const message =
        getErrorMessage('email') ||
        getErrorMessage('code') ||
        backendError?.detail ||
        'No se pudo verificar el correo.';
  
      return {
        ok: false,
        message,
      };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const response = await api.post<{ message: string }>('/auth/resend-verification/', {
        email: email.trim().toLowerCase(),
      });
  
      return {
        ok: true,
        message: response.data.message,
      };
    } catch (error: any) {
      const backendError = error?.response?.data;
  
      console.log('Resend verification error:', backendError || error?.message || error);
  
      let message = 'No se pudo reenviar el código.';
  
      if (backendError?.email) {
        message = Array.isArray(backendError.email)
          ? backendError.email[0]
          : backendError.email;
      } else if (backendError?.detail) {
        message = backendError.detail;
      }
  
      return {
        ok: false,
        message,
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

  const updateProfile = async (payload: FormData) => {
    try {
      const response = await api.patch<LoginResponse['user']>(
        '/auth/profile/',
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      const normalizedUser = normalizeUser(response.data);

      setUser(normalizedUser);
      
      const session = await getSession();
      
      if (session) {
        await saveSession({
          access: session.access,
          refresh: session.refresh,
          user: normalizedUser,
        });
      }
      
      const responseData = response.data as LoginResponse['user'] & {
        message?: string;
        requires_email_verification?: boolean;
        pending_email?: string;
      };
      
      return {
        ok: true,
        message: responseData.message,
        requiresEmailVerification: responseData.requires_email_verification || false,
        pendingEmail: responseData.pending_email,
      };
    } catch (error: any) {
      const backendError = error?.response?.data;
  
      console.log('Update profile error:', backendError || error?.message || error);
  
      const getErrorMessage = (field: string) => {
        const fieldError = backendError?.[field];
  
        if (Array.isArray(fieldError)) {
          return fieldError[0];
        }
  
        if (typeof fieldError === 'string') {
          return fieldError;
        }
  
        return null;
      };
  
      const message =
        getErrorMessage('email') ||
        getErrorMessage('phone') ||
        getErrorMessage('full_name') ||
        getErrorMessage('profile_image') ||
        backendError?.detail ||
        'No se pudo actualizar el perfil.';
  
      return {
        ok: false,
        message,
      };
    }
  };

  const verifyEmailChange = async (code: string) => {
  try {
    const response = await api.post<VerifyEmailChangeResponse>(
      '/auth/verify-email-change/',
      {
        code: code.trim(),
      }
    );

    const normalizedUser = normalizeUser(response.data.user);

    setUser(normalizedUser);

    const session = await getSession();

    if (session) {
      await saveSession({
        access: session.access,
        refresh: session.refresh,
        user: normalizedUser,
      });
    }

    return {
      ok: true,
      message: response.data.message,
    };
  } catch (error: any) {
    const backendError = error?.response?.data;

    console.log('Verify email change error:', backendError || error?.message || error);

    const getErrorMessage = (field: string) => {
      const fieldError = backendError?.[field];

      if (Array.isArray(fieldError)) {
        return fieldError[0];
      }

      if (typeof fieldError === 'string') {
        return fieldError;
      }

      return null;
    };

    const message =
      getErrorMessage('code') ||
      backendError?.detail ||
      'No se pudo verificar el cambio de correo.';

    return {
      ok: false,
      message,
    };
  }
};

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
        verifyEmail,
        resendVerificationCode,
        updateProfile,
        verifyEmailChange,
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
