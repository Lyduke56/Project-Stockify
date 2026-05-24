import ManageCategoriesBase from "@/components/modals/employee/shared/manage-categories-base";
import type { CategoryType } from "@/lib/employee/categories";
import { type StorefrontConfig } from "@/lib/admin/storefront-actions";

interface Props {
  tenantId:     string;
  type:         CategoryType;
  onClose:      () => void;
  placeholder?: string;
  colors?:      StorefrontConfig | null;
}

export default function ManageCategoriesModal({ tenantId, type, onClose, placeholder = "e.g. New Category", colors }: Props) {
  return (
    <ManageCategoriesBase
      tenantId={tenantId}
      type={type}
      title="Manage Categories"
      contextLabel="Inventory"
      placeholder={placeholder}
      onClose={onClose}
      colors={colors}
    />
  );
}