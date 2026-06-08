'use client';

import { cn } from '@/lib/utils';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type AnchoredMenuPanelProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef?: RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  className?: string;
  children: ReactNode;
};

export function AnchoredMenuPanel({
  open,
  anchorRef,
  menuRef: menuRefProp,
  align = 'end',
  className,
  children,
}: AnchoredMenuPanelProps) {
  const internalMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = menuRefProp ?? internalMenuRef;
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }
    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        ...(align === 'end'
          ? { right: window.innerWidth - rect.right }
          : { left: rect.left }),
        zIndex: 200,
      });
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, anchorRef, align]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef as RefObject<HTMLDivElement>}
      role="menu"
      style={style}
      className={cn(
        'min-w-[14rem] rounded-lg border border-border/80 bg-popover py-1 shadow-md',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}
