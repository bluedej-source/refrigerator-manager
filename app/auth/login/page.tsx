"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("이메일 인증이 완료되지 않았습니다. 가입 시 받은 인증 메일을 확인해주세요.");
      } else {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      }
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "oklch(0.94 0.06 155)" }}>
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl overflow-hidden">
        {/* 상단 헤더 */}
        <div className="bg-primary px-6 pt-10 pb-8">
          <div
            className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image
              src="/chef-character.jpg"
              alt="냉장고 안심 매니저 캐릭터"
              width={56}
              height={56}
              className="object-cover w-full h-full"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl font-bold text-primary-foreground hover:underline underline-offset-2 text-left"
          >
            냉장고 안심 매니저
          </button>
          <p className="text-sm text-primary-foreground/70 mt-1">로그인하고 내 냉장고를 관리해요</p>
        </div>

        {/* 폼 */}
        <div className="px-6 py-7 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            {/* 비밀번호 찾기 */}
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <p className="text-center text-xs text-muted-foreground pt-1">
            아직 계정이 없으신가요?{" "}
            <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
