import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Contador global de modales activos para gestionar el bloqueo de scroll
 * de manera robusta incluso si se abren múltiples modales simultáneos o encadenados.
 */
let activeModalsCount = 0;

/**
 * ModalPortal: Renderiza el contenido del modal directamente en document.body
 * garantizando que quede 100% anclado de forma estática en la ventana del usuario (viewport)
 * sin importar cuánto scroll se haya hecho en la página principal, manteniendo el modal
 * permanentemente a la vista y bloqueando el scrolling de la página de fondo.
 */
export default function ModalPortal({ children, isOpen = true }) {
  useEffect(() => {
    if (!isOpen) return;
    
    if (activeModalsCount === 0) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    activeModalsCount++;

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}
