// components/modals/employee/inventories-modal/manage-categories-modal.tsx

import ManageCategoriesBase from "@/components/modals/employee/shared/manage-categories-base";
import type { CategoryType } from "@/lib/employee/categories";

interface Props {
  tenantId:     string;
  type:         CategoryType;
  onClose:      () => void;
  placeholder?: string; // ← new, optional
}

export default function ManageCategoriesModal({ tenantId, type, onClose, placeholder = "e.g. New Category" }: Props) {
  return (
    <ManageCategoriesBase
      tenantId={tenantId}
      type={type}
      title="Manage Categories"
      contextLabel="Products"
      placeholder={placeholder}
      onClose={onClose}
    />
  );
}