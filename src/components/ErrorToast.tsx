import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Custom toast configurations
export const showToast = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      className: "border-green-200 bg-green-50",
    });
  },
  
  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      className: "border-red-200 bg-red-50",
      duration: 5000, // Errors stay longer
    });
  },
  
  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      icon: <Info className="h-4 w-4 text-blue-500" />,
      className: "border-blue-200 bg-blue-50",
    });
  },
  
  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      description,
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      className: "border-yellow-200 bg-yellow-50",
    });
  },
};

// Database error helper
export const showDatabaseError = (error: unknown, operation: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage, operation);
  
  showToast.error(
    `Database Error: ${operation}`,
    userFriendlyMessage
  );
  
  // Also log to console for debugging
  console.error(`Database Error during ${operation}:`, error);
};

// Convert technical errors to user-friendly messages
const getUserFriendlyErrorMessage = (technicalMessage: string, operation: string): string => {
  if (technicalMessage.includes('permission') || technicalMessage.includes('authorization')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (technicalMessage.includes('network') || technicalMessage.includes('connection')) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  
  if (technicalMessage.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (technicalMessage.includes('duplicate') || technicalMessage.includes('unique')) {
    return 'This record already exists. Please use a different value.';
  }
  
  if (technicalMessage.includes('foreign key') || technicalMessage.includes('constraint')) {
    return 'Cannot delete this record as it is being used by other records.';
  }
  
  if (technicalMessage.includes('validation') || technicalMessage.includes('invalid')) {
    return 'Please check all required fields and try again.';
  }
  
  if (technicalMessage.includes('not found')) {
    return 'The requested record was not found.';
  }
  
  // Default fallback
  return `Something went wrong while ${operation.toLowerCase()}. Please try again or contact support if the problem persists.`;
};

// Loading state helper
export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    icon: <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />,
  });
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};
