export interface Affiliate {
  id: string;
  name: string;
  email: string;
  commission: string;
  linkedDate: string;
  cpa: number | null;
  cpaEditedOnce: boolean;
  level: number;
  hasChildren: boolean;
}
