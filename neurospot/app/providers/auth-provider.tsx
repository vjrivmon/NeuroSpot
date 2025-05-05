"use client"

import { ReactNode, useState, useEffect, createContext, useContext } from "react"
import { AuthProvider as OidcAuthProvider, useAuth as useOidcAuth } from "react-oidc-context"

interface AuthProviderProps {
  children: ReactNode
}

type AuthContextType = {
  isLocalAuth: boolean;
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
};

// Creamos un contexto para la autenticación local
const LocalAuthContext = createContext<AuthContextType>({
  isLocalAuth: true,
  isAuthenticated: false,
  email: null,
  login: () => {},
  logout: () => {},
});

// Hook para usar autenticación local
export const useLocalAuth = () => useContext(LocalAuthContext);

// Configuración de Amazon Cognito
const cognitoAuthConfig = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_HJTGbRfBv",
  client_id: "2mf6br4c8vp8cot9i41r0nvkde",
  redirect_uri: typeof window !== 'undefined' 
    ? `${window.location.origin}/panel` 
    : "http://localhost:3001/panel", // URL local para desarrollo
  response_type: "code",
  scope: "phone openid email",
  loadUserInfo: true,
  onSigninCallback: () => {
    // Evitar que la URL mantenga los parámetros de autenticación
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Variable para controlar si queremos usar Cognito o auth local
const USE_COGNITO = true; // Cambiar a true para usar Cognito

// Componente para integrar Cognito con nuestro contexto Auth local
function CognitoIntegration({ children }: { children: ReactNode }) {
  const oidcAuth = useOidcAuth();
  const localAuth = useLocalAuth();
  
  useEffect(() => {
    // Si Cognito ha autenticado al usuario, actualizamos el contexto local
    if (oidcAuth.isAuthenticated && oidcAuth.user?.profile.email) {
      // Usamos el email del perfil de Cognito
      const cognitoEmail = oidcAuth.user.profile.email;
      
      // Solo actualizamos si ha cambiado
      if (localAuth.email !== cognitoEmail) {
        localAuth.login(cognitoEmail);
      }
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.user, localAuth]);
  
  // Manejar estado de carga
  if (oidcAuth.isLoading) {
    return <div>Cargando autenticación...</div>
  }
  
  // Manejar errores
  if (oidcAuth.error) {
    console.error("Error de autenticación con Cognito:", oidcAuth.error);
    return <div>Error de autenticación. Por favor, inténtelo de nuevo.</div>
  }
  
  return <>{children}</>;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  
  // Cargar estado de autenticación del localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const storedEmail = localStorage.getItem("userEmail");
      
      setIsAuthenticated(isLoggedIn);
      setEmail(storedEmail);
    }
  }, []);
  
  // Funciones para manejar autenticación local
  const login = (userEmail: string) => {
    // Limpiar datos de sesión anterior si cambia de usuario
    const currentUser = localStorage.getItem("userEmail");
    if (currentUser && currentUser !== userEmail) {
      // Si es un usuario diferente, limpiamos los datos específicos
      localStorage.removeItem("completedExercises");
      console.log(`Cambiando de usuario: ${currentUser} -> ${userEmail}`);
      // Aquí se pueden agregar más datos específicos del usuario que deban limpiarse
    }
    
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", userEmail);
    setIsAuthenticated(true);
    setEmail(userEmail);
  };
  
  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
    setEmail(null);
  };
  
  // Valor del contexto para autenticación local
  const authContextValue = {
    isLocalAuth: !USE_COGNITO,
    isAuthenticated,
    email,
    login,
    logout
  };
  
  // Si no usamos Cognito, solo usar autenticación local
  if (!USE_COGNITO) {
    return (
      <LocalAuthContext.Provider value={authContextValue}>
        {children}
      </LocalAuthContext.Provider>
    );
  }
  
  // Si usamos Cognito, envolver con ambos proveedores
  return (
    <LocalAuthContext.Provider value={authContextValue}>
      <OidcAuthProvider {...cognitoAuthConfig}>
        <CognitoIntegration>
          {children}
        </CognitoIntegration>
      </OidcAuthProvider>
    </LocalAuthContext.Provider>
  );
} 