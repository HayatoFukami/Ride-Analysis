import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import {
  StravaLogo,
  BikeIcon,
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@/components/ui/Icons";

interface LoginPageProps {
  searchParams?: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const isReconnect = resolvedParams?.reason === "reconnect";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] px-4 py-12 sm:px-6 lg:px-8 selection:bg-[#FC5200]/20 selection:text-[#FC5200]">
      {/* Login Card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FC5200] text-white shadow-lg shadow-[#FC5200]/30 transition-transform hover:scale-105">
            <StravaLogo className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Strava Personal Dashboard
          </h1>

          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
            自分のStravaデータをもっと自由に分析する。
          </p>
        </div>

        {/* Reconnect notice if redirected from session expiration */}
        {isReconnect && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
            <AlertCircleIcon className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Stravaとの再接続が必要です</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                接続有効期限が切れたか、認証が更新されました。下のボタンから再度Stravaにログインしてください。
              </p>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs font-medium text-slate-700 border border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#FC5200]">
              <BikeIcon className="h-3.5 w-3.5" />
            </div>
            <span>機材（バイク・シューズ）ごとの正確な期間別走行距離</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ActivityIcon className="h-3.5 w-3.5" />
            </div>
            <span>月間・年間のアクティビティ推移と統計サマリー</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircleIcon className="h-3.5 w-3.5" />
            </div>
            <span>非公開（Only You）アクティビティも含めた集計</span>
          </div>
        </div>

        {/* Connect Action Button */}
        <div className="mt-8">
          <a
            href="/api/auth/strava/login"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FC5200] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FC5200]/30 transition-all hover:bg-[#E04800] hover:shadow-xl hover:shadow-[#FC5200]/40 focus:outline-none focus:ring-4 focus:ring-[#FC5200]/20 active:scale-[0.98]"
          >
            <StravaLogo className="h-5 w-5 fill-current" />
            <span>{isReconnect ? "Stravaと再接続する" : "Connect with Strava"}</span>
          </a>
        </div>

        {/* Security & Privacy Reassurance */}
        <div className="mt-6 text-center">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Stravaのパスワードは保存されません。
            <br />
            公式OAuth連携により安全に統計データへアクセスします。
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        <p>Strava Personal Dashboard · Local MVP</p>
      </footer>
    </div>
  );
}
