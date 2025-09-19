"use client";

import {
  AcrModal,
  AcrModalBody,
  AcrModalFooter,
  AcrButton,
} from "@/components/acr";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning"
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AcrModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton={false}
      data-testid="confirm-dialog"
    >
      <AcrModalBody>
      </AcrModalBody>

      <AcrModalFooter>
        <AcrButton
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          {cancelText}
        </AcrButton>
        <AcrButton
          type="button"
          variant={variant === "destructive" ? "destructive" : "primary"}
          onClick={handleConfirm}
        >
          {confirmText}
        </AcrButton>
      </AcrModalFooter>
    </AcrModal>
  );
}