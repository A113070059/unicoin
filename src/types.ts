export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO string
  isInvoiceSynced?: boolean;
}

export type CategoryType = 
  | '學餐/宵夜'
  | '書籍教材'
  | '學雜費'
  | '房租水電'
  | '社團系隊'
  | '社交娛樂'
  | '交通費'
  | '其他';

export interface IASplitGroup {
  id: string;
  name: string;
  totalAmount: number;
  paidBy: string; // Names of students (e.g., "小明")
  participants: string[]; // e.g., ["小明", "小華", "小美", "阿強"]
  splitType: '平分' | '自訂';
  customAmounts?: Record<string, number>; // If splitType is "自訂"
  date: string;
  isSettled?: boolean;
  status?: 'pending' | 'completed' | 'canceled';
  settledParticipants?: string[];
}

export interface InvoiceItem {
  id: string;
  amount: number;
  merchant: string;
  details: string;
  date: string;
  isSynced: boolean;
  prizeChecked: boolean;
  prizeResult: '未中獎' | '中獎200元' | '中獎1000元' | '未開獎';
}

export interface BudgetConfig {
  monthlyLimit: number;
  currentExpense: number;
}

export interface FriendItem {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  isRealUser?: boolean;
}
