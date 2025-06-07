export interface Transaction {
  id: string,
  date: string,
  description: string,
  amount: number,
  category?: string
}

export interface CategorizedTransaction extends Transaction {
  category: string;
}