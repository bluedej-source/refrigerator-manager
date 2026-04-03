import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 간단한 연결 확인: 테이블 목록 조회 시도
    const { error } = await supabase.from("food_items").select("count").limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = 테이블 없음 (연결은 됨)
      return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connected: true, message: "Supabase 연결 성공" });
  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) }, { status: 500 });
  }
}
