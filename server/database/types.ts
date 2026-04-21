export type IncentiveType = 'goal' | 'bid_war';

export interface Incentive {
  id?: number;
  name: string;
  description?: string;
  type: IncentiveType;
  target_amount: number;
  current_amount: number;
  is_active: boolean;
  hashtag?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IncentiveUpdate {
  id?: number;
  incentive_id: number;
  amount: number;
  timestamp?: string;
  notes?: string;
}

export interface BidWarOption {
  id?: number;
  incentive_id: number;
  name: string;
  amount: number;
  hashtag?: string;
  created_at?: string;
  updated_at?: string;
}
