-- food_items 테이블 생성
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  expiry_date DATE NOT NULL,
  storage_type TEXT NOT NULL DEFAULT 'fridge',
  price INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 조회
CREATE POLICY "food_items_select_own"
  ON public.food_items FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 데이터만 삽입
CREATE POLICY "food_items_insert_own"
  ON public.food_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 데이터만 수정
CREATE POLICY "food_items_update_own"
  ON public.food_items FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 데이터만 삭제
CREATE POLICY "food_items_delete_own"
  ON public.food_items FOR DELETE
  USING (auth.uid() = user_id);
