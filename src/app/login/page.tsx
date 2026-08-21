import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { MaterialIcon, StravaLogo, type IconName } from "@/components/ui/Icon";

interface LoginPageProps {
  searchParams?: Promise<{ error?: string; reason?: string }>;
}

type NoticeKind = "reconnect" | "error" | "status";

interface Notice {
  kind: NoticeKind;
  icon: IconName;
  title: string;
  body: string;
}

/**
 * Map OAuth callback error codes (see /api/auth/strava/callback) to friendly,
 * accurate inline notices. This only affects presentation; the callback/server
 * logic is untouched.
 */
const OAUTH_ERROR_NOTICES: Record<string, Notice> = {
  state: {
    kind: "error",
    icon: "error",
    title: "認証を完了できませんでした",
    body: "セッションの整合性を確認できませんでした。もう一度お試しください。",
  },
  denied: {
    kind: "status",
    icon: "info",
    title: "Stravaの連携が許可されませんでした",
    body: "アクセスを許可すると、統計データを読み取れるようになります。",
  },
  missing_code: {
    kind: "error",
    icon: "error",
    title: "認証コードを受け取れませんでした",
    body: "Stravaからの応答に問題がありました。もう一度お試しください。",
  },
  token: {
    kind: "error",
    icon: "error",
    title: "Stravaとの接続に失敗しました",
    body: "トークンの取得に失敗しました。時間を置いてもう一度お試しください。",
  },
  no_athlete: {
    kind: "error",
    icon: "error",
    title: "アスリート情報を取得できませんでした",
    body: "Stravaアカウントの情報を読み取れませんでした。もう一度お試しください。",
  },
  scope: {
    kind: "error",
    icon: "info",
    title: "必要なアクセス権限が許可されませんでした",
    body: "分析に必要な読み取り権限（read / activity:read_all）を許可してください。",
  },
};

function resolveNotice(
  error: string | undefined,
  reason: string | undefined
): Notice | null {
  if (reason === "reconnect") {
    return {
      kind: "reconnect",
      icon: "refresh",
      title: "Stravaとの再接続が必要です",
      body: "接続の有効期限が切れているか、認証情報が更新されました。下のボタンから再度Stravaに接続してください。",
    };
  }
  if (error) {
    return OAUTH_ERROR_NOTICES[error] ?? null;
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const notice = resolveNotice(resolvedParams?.error, resolvedParams?.reason);

  return (
    <main className="m3-container flex flex-1 items-center justify-center py-12 sm:py-16">
      <section
        className="m3-card w-full max-w-md p-6 sm:p-8"
        aria-labelledby="login-heading"
      >
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <MaterialIcon name="monitoring" size={26} aria-hidden />
          </div>

          <h1
            id="login-heading"
            className="mt-5 text-2xl font-semibold tracking-tight text-on-surface"
          >
            Ride Analysis
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            自分のStravaデータをもっと自由に分析する。
          </p>
        </div>

        {/* Reconnect / OAuth error notice */}
        {notice && (
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={`mt-6 flex items-start gap-3 rounded-medium border p-4 ${
              notice.kind === "error"
                ? "border-error/30 bg-error-container text-on-error-container"
                : "border-outline-variant bg-secondary-container text-on-secondary-container"
            }`}
          >
            <MaterialIcon
              name={notice.icon}
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold">{notice.title}</p>
              <p className="mt-1 text-sm leading-relaxed opacity-90">
                {notice.body}
              </p>
            </div>
          </div>
        )}

        {/* OAuth action — Strava orange is reserved for this context. */}
        <div className="mt-8">
          <a
            href="/api/auth/strava/login"
            className="m3-button m3-button--md m3-button--strava w-full"
          >
            <StravaLogo size={20} aria-hidden />
            <span>
              {notice?.kind === "reconnect"
                ? "Stravaと再接続する"
                : "Connect with Strava"}
            </span>
          </a>
        </div>

        {/* Privacy note — accurate: the Strava password is never stored. */}
        <div className="mt-6 flex items-start justify-center gap-2 text-center">
          <MaterialIcon
            name="lock"
            size={15}
            className="mt-0.5 shrink-0 text-on-surface-variant"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Stravaのパスワードは保存されません。
            <br />
            公式OAuth連携により、認証情報は安全に管理されます。
          </p>
        </div>
      </section>
    </main>
  );
}
