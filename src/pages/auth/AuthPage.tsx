import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleAuthForm } from '@/components/auth/SimpleAuthForm';
import { FallbackAuth } from '@/components/auth/FallbackAuth';
import { useSimpleAuthStore } from '@/store/useSimpleAuthStore';
import { useFallbackAuthStore } from '@/store/useFallbackAuthStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated: isSimpleAuth } = useSimpleAuthStore();
  const { isAuthenticated: isFallbackAuth } = useFallbackAuthStore();
  const [useFallback, setUseFallback] = useState(false);

  const isAuthenticated = useFallback ? isFallbackAuth : isSimpleAuth;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Force fallback mode since Supabase URL is not resolving
  useEffect(() => {
    setUseFallback(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {useFallback ? <FallbackAuth /> : <SimpleAuthForm />}
      </div>
    </div>
  );
}
