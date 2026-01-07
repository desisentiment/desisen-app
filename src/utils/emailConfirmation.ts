// Email confirmation utility functions
import { supabase } from '@/integrations/supabase/client';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxAttempts: 3,
  cooldownMinutes: 1,
  storageKey: 'email_confirmation_resend'
};

// Storage interface
interface ResendStorage {
  attempts: number;
  lastResendAt: Date;
  email: string;
}

// Storage functions
const getResendStorage = (): ResendStorage | null => {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_CONFIG.storageKey);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return {
      ...data,
      lastResendAt: new Date(data.lastResendAt)
    };
  } catch {
    return null;
  }
};

const setResendStorage = (data: ResendStorage) => {
  localStorage.setItem(RATE_LIMIT_CONFIG.storageKey, JSON.stringify(data));
};

// Rate limiting logic
export function isResendAllowed(email: string): {
  allowed: boolean;
  cooldownSeconds: number;
  attemptsRemaining: number;
} {
  const stored = getResendStorage();
  
  if (!stored || stored.email !== email) {
    return { allowed: true, cooldownSeconds: 0, attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts };
  }
  
  const now = new Date();
  const timeDiff = now.getTime() - stored.lastResendAt.getTime();
  const cooldownMs = RATE_LIMIT_CONFIG.cooldownMinutes * 60 * 1000;
  
  if (timeDiff >= cooldownMs) {
    return { allowed: true, cooldownSeconds: 0, attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts };
  }
  
  const attemptsRemaining = Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - stored.attempts);
  const cooldownSeconds = Math.ceil((cooldownMs - timeDiff) / 1000);
  
  return { allowed: false, cooldownSeconds, attemptsRemaining };
}

// Resend attempt tracking
export function incrementResendAttempts(email: string): void {
  const stored = getResendStorage();
  const now = new Date();
  
  const newStorage: ResendStorage = {
    email,
    attempts: (stored?.email === email ? stored.attempts : 0) + 1,
    lastResendAt: now
  };
  
  setResendStorage(newStorage);
}

// Email confirmation status checking
export async function checkEmailConfirmationStatus(): Promise<{
  status: 'confirmed' | 'unconfirmed' | 'error';
  email?: string;
  error?: string;
}> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return { status: 'error', error: error.message };
    }
    
    if (!user) {
      return { status: 'error', error: 'No user found' };
    }
    
    const isConfirmed = !!user.email_confirmed_at;
    return {
      status: isConfirmed ? 'confirmed' : 'unconfirmed',
      email: user.email || undefined
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to check confirmation status'
    };
  }
}

// Resend confirmation email
export async function resendConfirmationEmail(
  email: string
): Promise<{
  success: boolean;
  error?: string;
  attemptsRemaining: number;
  cooldownSeconds: number;
}> {
  const rateLimit = isResendAllowed(email);
  
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many requests. Please wait ${rateLimit.cooldownSeconds} seconds.`,
      attemptsRemaining: rateLimit.attemptsRemaining,
      cooldownSeconds: rateLimit.cooldownSeconds
    };
  }
  
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) {
      return {
        success: false,
        error: error.message,
        attemptsRemaining: rateLimit.attemptsRemaining - 1,
        cooldownSeconds: 0
      };
    }
    
    incrementResendAttempts(email);
    return {
      success: true,
      attemptsRemaining: rateLimit.attemptsRemaining - 1,
      cooldownSeconds: 0
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend confirmation email',
      attemptsRemaining: rateLimit.attemptsRemaining,
      cooldownSeconds: rateLimit.cooldownSeconds
    };
  }
}

// Token verification
export async function verifyConfirmationEmail(
  token: string,
  email: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      type: 'email',
      token,
      email,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify confirmation token'
    };
  }
}