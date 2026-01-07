/**
 * Accessibility Utilities
 * Helper functions for improving accessibility
 */

import { useEffect, useRef } from 'react';

/**
 * Focus trap utility for modal dialogs and overlays
 */
export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // You can add additional escape handling here if needed
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    // Focus the first element when trap is activated
    firstElement.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [active]);

  return ref;
}

/**
 * Generate ARIA attributes for better accessibility
 */
export function getAriaAttributes({
  label,
  describedBy,
  hidden = false,
  disabled = false,
  expanded = false,
  hasPopup = false,
  live = false,
}: {
  label?: string;
  describedBy?: string;
  hidden?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  hasPopup?: boolean;
  live?: boolean;
}) {
  const attributes: Record<string, string> = {};

  if (label) {
    attributes['aria-label'] = label;
  }

  if (describedBy) {
    attributes['aria-describedby'] = describedBy;
  }

  if (hidden) {
    attributes['aria-hidden'] = 'true';
  }

  if (disabled) {
    attributes['aria-disabled'] = 'true';
  }

  if (hasPopup) {
    attributes['aria-haspopup'] = 'true';
  }

  if (expanded) {
    attributes['aria-expanded'] = 'true';
  } else if ('expanded' in attributes) {
    attributes['aria-expanded'] = 'false';
  }

  if (live) {
    attributes['aria-live'] = 'polite';
  }

  return attributes;
}

/**
 * Check color contrast ratio for accessibility
 */
export function checkContrastRatio(foreground: string, background: string): boolean {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  // Calculate relative luminance
  const getLuminance = (color: { r: number; g: number; b: number }) => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return rs * 0.2126 + gs * 0.7152 + bs * 0.0722;
  };

  const luminance1 = getLuminance(fg);
  const luminance2 = getLuminance(bg);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  // Calculate contrast ratio
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  // WCAG 2.1 AA minimum contrast ratio (4.5:1 for normal text)
  return contrastRatio >= 4.5;
}

/**
 * Add keyboard navigation support to elements
 */
export function addKeyboardNavigation(
  container: HTMLElement,
  items: HTMLElement[],
  onSelect: (item: HTMLElement) => void
) {
  let currentIndex = -1;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[currentIndex].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (currentIndex >= 0) {
        onSelect(items[currentIndex]);
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}