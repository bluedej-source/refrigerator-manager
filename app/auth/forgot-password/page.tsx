"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/app/auth/actions";
import { Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    const result = await resetPassword(formData);

    if (result?.error) {
      const msg = result.error;
      if (msg.includes("rate limit") || msg.includes("email_rate_limit")) {
        setError("이메일 발송 횟수 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError(`오류: ${msg}`);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
          <p className="text-xl font-bold text-primary-foreground">비밀번호 찾기</p>
          <p className="text-sm text-primary-foreground/70 mt-1">가입한 이메일로 재설정 링크를 보내드려요</p>
        </div>

        <div className="px-6 py-7 space-y-4">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 rounded-xl px-4 py-5">
                <p className="text-sm font-semibold text-green-700 mb-1">메일을 전송했습니다!</p>
                <p className="text-xs text-green-600">
                  <span className="font-medium">{email}</span>로<br />
                  비밀번호 재설정 링크를 보냈습니다.<br />
                  메일함을 확인해주세요.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold text-center hover:opacity-90 transition-all"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입한 이메일을 입력하세요"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? "전송 중..." : "재설정 링크 보내기"}
              </button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                  로그인으로 돌아가기
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
