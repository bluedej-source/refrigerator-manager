import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oikzkutuyaonqyazziqg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  expiry_date DATE NOT NULL,
  storage_type TEXT NOT NULL DEFAULT 'fridge',
  price INTEGER,
  consumed BOOLEAN NOT NULL DEFAULT false,
  added_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_items' AND policyname = 'food_items_select_own'
  ) THEN
    CREATE POLICY "food_items_select_own" ON public.food_items FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_items' AND policyname = 'food_items_insert_own'
  ) THEN
    CREATE POLICY "food_items_insert_own" ON public.food_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_items' AND policyname = 'food_items_update_own'
  ) THEN
    CREATE POLICY "food_items_update_own" ON public.food_items FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_items' AND policyname = 'food_items_delete_own'
  ) THEN
    CREATE POLICY "food_items_delete_own" ON public.food_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
`;

const { error } = await supabase.rpc("exec_sql", { query: sql }).catch(() => ({ error: "rpc not available" }));

if (error) {
  // rpc 방식이 안되면 직접 REST로 시도
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    console.log("테이블이 이미 존재하거나 Supabase 대시보드에서 직접 SQL을 실행해 주세요.");
    console.log("SQL 내용:");
    console.log(sql);
  } else {
    console.log("마이그레이션 완료!");
  }
} else {
  console.log("마이그레이션 완료!");
}
