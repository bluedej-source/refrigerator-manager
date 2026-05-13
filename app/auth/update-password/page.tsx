"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/auth/actions";
import { Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("password", password);

    const result = await updatePassword(formData);

    if (result?.error) {
      setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
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
          <p className="text-xl font-bold text-primary-foreground">새 비밀번호 설정</p>
          <p className="text-sm text-primary-foreground/70 mt-1">새로운 비밀번호를 입력해주세요</p>
        </div>

        <div className="px-6 py-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 새 비밀번호 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">새 비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력하세요"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-muted text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              {loading ? "변경 중..." : "비밀번호 변경하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
