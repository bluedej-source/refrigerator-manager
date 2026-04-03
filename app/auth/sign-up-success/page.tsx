import Link from "next/link";
import { Mail } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "oklch(0.94 0.06 155)" }}>
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl overflow-hidden text-center">
        <div className="bg-primary px-6 pt-10 pb-8">
          <div className="w-12 h-12 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Mail className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">이메일을 확인해 주세요</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">인증 메일을 발송했어요</p>
        </div>

        <div className="px-6 py-8 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            가입하신 이메일로 인증 링크를 보내드렸어요.
            <br />
            메일함을 확인하고 인증을 완료해 주세요.
          </p>
          <Link
            href="/auth/login"
            className="block w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            로그인 화면으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
