import * as React from "react";
import { create } from 'zustand';

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

interface ToastState {
  toasts: ToasterToast[];
  addToast: (toast: ToasterToast) => void;
  updateToast: (toast: Partial<ToasterToast>) => void;
  dismissToast: (toastId?: string) => void;
  removeToast: (toastId?: string) => void;
}

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => set((state) => ({
    toasts: [toast, ...state.toasts].slice(0, TOAST_LIMIT)
  })),

  updateToast: (toast) => set((state) => ({
    toasts: state.toasts.map((t) => (t.id === toast.id ? { ...t, ...toast } : t))
  })),

  dismissToast: (toastId) => {
    const { removeToast } = get();
    if (toastId) {
      setTimeout(() => removeToast(toastId), TOAST_REMOVE_DELAY);
    } else {
      const state = get();
      state.toasts.forEach((toast) => {
        setTimeout(() => removeToast(toast.id), TOAST_REMOVE_DELAY);
      });
    }
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === toastId || toastId === undefined
          ? { ...t, open: false }
          : t
      )
    }));
  },

  removeToast: (toastId) => set((state) => ({
    toasts: toastId === undefined
      ? []
      : state.toasts.filter((t) => t.id !== toastId)
  })),
}));

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const { addToast } = useToastStore.getState();
  const id = genId();

  const update = (props: ToasterToast) => {
    useToastStore.getState().updateToast({ ...props, id });
  };

  const dismiss = () => {
    useToastStore.getState().dismissToast(id);
  };

  addToast({
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss();
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const addToast = useToastStore((state) => state.addToast);
  const updateToast = useToastStore((state) => state.updateToast);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const removeToast = useToastStore((state) => state.removeToast);

  return {
    toasts,
    toast,
    addToast,
    updateToast,
    dismiss: dismissToast,
    removeToast,
  };
}

export { useToast, toast };
