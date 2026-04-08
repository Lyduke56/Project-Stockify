export interface Product {
  id: number;
  name: string;
  img: string | null;
  sku: string;
  category: string;
  price: number;
  stock: number;
  stockUnit: string;
  alertLimit: string;
  visible: boolean;
}

export const CATEGORIES = ["Coffee", "Tea", "Pastry", "Merchandise"];