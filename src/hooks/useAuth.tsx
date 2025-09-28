import { createContext, useContext, useEffect, useState } from 'react';
import {
  Session,
  User,
  AuthResponse,
  SignUpWithPasswordCredentials,
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    options: SignUpWithPasswordCredentials['options']
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {
    throw new Error('signIn function not ready');
  },
  signUp: async () => {
    throw new Error('signUp function not ready');
  },
  signOut: async () => {
    throw new Error('signOut function not ready');
  },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = (
    email: string,
    password: string,
    options: SignUpWithPasswordCredentials['options']
  ) => {
    return supabase.auth.signUp({ email, password, options });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle state updates
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Construct profile from user object to avoid extra API call
          const userProfile = {
            ...currentUser.user_metadata,
            id: currentUser.id,
            email: currentUser.email,
          };
          setProfile(userProfile);
        } else {
          // If user is not logged in, clear the profile
          setProfile(null);
        }
        // Set loading to false after session and profile are handled
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);