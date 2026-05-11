// components/modals/employee/inventories-modal/manage-categories-modal.tsx

import ManageCategoriesBase from "@/components/modals/employee/shared/manage-categories-base";

interface Props {
  tenantId:     string;
  onClose:      () => void;
  placeholder?: string; // ← new, optional
}

export default function ManageCategoriesModal({ tenantId, onClose, placeholder = "e.g. New Category" }: Props) {
  return (
    <ManageCategoriesBase
      tenantId={tenantId}
      type="product"
      title="Manage Categories"
      contextLabel="Products"
      placeholder={placeholder}
      onClose={onClose}
    />
  );
}