const https = require("https");

const SUPABASE_URL = "https://oikzkutuyaonqyazziqg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = "oikzkutuyaonqyazziqg";

if (!SUPABASE_SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

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

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const body = JSON.stringify({ query: sql });
  const options = {
    hostname: "api.supabase.com",
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Length": Buffer.byteLength(body),
    },
  };

  console.log("Supabase 데이터베이스에 연결 중...");
  const result = await request(options, body);
  console.log("응답 상태:", result.status);
  console.log("응답 내용:", result.body);

  if (result.status === 200 || result.status === 201) {
    console.log("food_items 테이블 생성 완료!");
  } else {
    console.error("오류 발생. 아래 SQL을 Supabase 대시보드 SQL Editor에서 직접 실행해주세요:");
    console.log(sql);
  }
}

main().catch(console.error);
