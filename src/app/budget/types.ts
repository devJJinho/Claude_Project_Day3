// budget_items 테이블 행 타입 (T-010 마이그레이션 기준).
export type BudgetItem = {
  id: string;
  couple_id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  created_by: string | null;
  created_at: string;
};

// POST /api/budget 요청 본문.
export type CreateBudgetItemInput = {
  category: string;
  planned_amount?: number;
  actual_amount?: number;
};

// PATCH /api/budget 요청 본문.
export type UpdateBudgetItemInput = {
  id: string;
  category?: string;
  planned_amount?: number;
  actual_amount?: number;
};
