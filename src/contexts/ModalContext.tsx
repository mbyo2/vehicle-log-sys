import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalContextType {
  openModal: (props: ModalProps) => void;
  closeModal: () => void;
}

interface ModalProps {
  title: string;
  description?: string;
  content: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalContent, setModalContent] = useState<ModalProps | null>(null);

  const openModal = (props: ModalProps) => {
    setModalContent(props);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const getModalSize = (size?: 'sm' | 'md' | 'lg' | 'xl') => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'md':
      default:
        return 'max-w-md';
    }
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Dialog open={!!modalContent} onOpenChange={() => closeModal()}>
        {modalContent && (
          <DialogContent className={getModalSize(modalContent.size)}>
            <DialogHeader>
              <DialogTitle>{modalContent.title}</DialogTitle>
              {modalContent.description && (
                <DialogDescription>
                  {modalContent.description}
                </DialogDescription>
              )}
            </DialogHeader>
            {modalContent.content}
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}