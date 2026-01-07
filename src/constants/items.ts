import { ItemCategory, ItemUnit } from '@/types';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics', 'Clothing', 'Food', 'Grocery', 'Stationery',
  'Hardware', 'Cosmetics', 'Medicine', 'Other',
];

export const ITEM_UNITS: ItemUnit[] = ['Piece', 'Kg', 'Gram', 'Liter', 'Meter', 'Box', 'Dozen', 'Pack'];

export const DEFAULT_FORM_STATE = {
  name: '',
  sku: '',
  unit: 'Piece' as ItemUnit,
  category: 'Other' as ItemCategory,
  purchasePrice: '',
  salePrice: '',
  openingStock: '',
  lowStockAlert: 5,
};
