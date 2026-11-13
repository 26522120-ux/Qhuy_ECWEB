import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ApiError,
  checkAccountUnique,
  loginWithBackend,
  syncAccountToNeon,
} from "../api";
import { authClient, signOutAccount } from "../auth";
import { useStore } from "../context/StoreContext";

const LogIn = () => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshAuth } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setIsSubmitting(true);

    try {
      // Nếu đăng ký mới: Kiểm tra 1 khách hàng chỉ được dùng 1 SĐT và 1 Email duy nhất
      if (isCreatingAccount) {
        await checkAccountUnique({ email, phone });
      }

      let neonUserId: string | undefined;
      let neonUserName: string | undefined = name || undefined;
      let neonAuthSucceeded = false;

      try {
        const result = isCreatingAccount
          ? await authClient.signUp.email({
              name,
              email,
              password,
            })
          : await authClient.signIn.email({ email, password });

        if (!result.error && result.data?.user) {
          neonUserId = result.data.user.id;
          neonUserName = result.data.user.name || name;
          neonAuthSucceeded = true;
        } else if (result.error) {
          if (isCreatingAccount) {
            toast.error("Email này đã tồn tại. Vui lòng đăng nhập!");
            setIsCreatingAccount(false);
            return;
          }
        }
      } catch {
        // Fallback sang backend auth trực tiếp
      }

      const synced = neonAuthSucceeded
        ? await syncAccountToNeon({
            id: neonUserId,
            email,
            name: neonUserName,
            phone: isCreatingAccount ? phone : undefined,
          })
        : await loginWithBackend({
            email,
            password,
            name: neonUserName,
            phone: isCreatingAccount ? phone : undefined,
          });

      await refreshAuth();

      if (synced.isAdmin) {
        toast.success(`Xin chào Quản trị viên ${synced.user.name}!`);
        navigate("/admin");
      } else {
        toast.success(
          isCreatingAccount ? "Tạo tài khoản thành công!" : "Đăng nhập thành công!",
        );
        navigate("/");
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.redirectToLogin || error.statusCode === 409)
      ) {
        await signOutAccount();
        toast.error(error.message);
        setIsCreatingAccount(false);
        navigate("/login", { replace: true });
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Không thể xác thực tài khoản.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#0b0d0c] text-white md:grid-cols-[52%_48%]">
      {/* CỘT TRÁI: BANNER THƯƠNG HIỆU nutraGO */}
      <section
        aria-label="Chào mừng đến với nutraGO"
        className="relative hidden min-h-screen items-center justify-center overflow-hidden border-r border-white/10 bg-[#0b0d0c] px-10 md:flex"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-position-[right_top] bg-no-repeat opacity-65"
          style={{ backgroundImage: "url('/form-fwd-hero.jpg')" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0d0c] via-[#0b0d0c]/75 to-[#0b0d0c]/65" />

        <div className="relative z-10 max-w-lg">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 -skew-x-12 items-center justify-center rounded-xs bg-[#b8f927] font-display text-lg font-black text-black shadow-[0_0_25px_rgba(184,249,39,0.35)]">
              <span className="skew-x-12">//</span>
            </span>
            <span className="font-display text-3xl font-black tracking-wide text-white">
              nutra<span className="text-[#b8f927]">GO</span>
            </span>
          </Link>

          <p className="mt-7 text-xs font-bold tracking-[0.25em] text-[#b8f927] uppercase">
            HIỆU SUẤT &bull; DINH DƯỠNG &bull; KỶ LUẬT
          </p>

          <h1 className="mt-3 font-display text-5xl leading-[0.98] font-black tracking-tight text-white uppercase lg:text-6xl">
            BỨT PHÁ GIỚI HẠN CÙNG{" "}
            <span className="text-[#b8f927]">nutraGO</span>
          </h1>
        </div>
      </section>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ */}
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-[430px] rounded-xs border border-zinc-800 bg-[#111513] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] sm:p-9">
          <Link
            to="/"
            className="mb-6 flex items-center justify-center gap-2.5"
            aria-label="Trang chủ nutraGO"
          >
            <span className="inline-flex h-9 w-9 -skew-x-12 items-center justify-center rounded-xs bg-[#b8f927] font-display text-base font-black text-black shadow-[0_0_20px_rgba(184,249,39,0.3)]">
              <span className="skew-x-12">//</span>
            </span>
            <span className="font-display text-2xl font-black tracking-wide text-white">
              nutra<span className="text-[#b8f927]">GO</span>
            </span>
          </Link>

          {/* Thanh chuyển đổi nhanh Đăng nhập / Đăng ký */}
          <div className="mb-6 grid grid-cols-2 rounded-xs border border-zinc-800 bg-[#0b0d0c] p-1">
            <button
              type="button"
              onClick={() => setIsCreatingAccount(false)}
              className={`rounded-xs py-2 text-xs font-extrabold tracking-wider uppercase transition ${
                !isCreatingAccount
                  ? "bg-[#b8f927] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingAccount(true)}
              className={`rounded-xs py-2 text-xs font-extrabold tracking-wider uppercase transition ${
                isCreatingAccount
                  ? "bg-[#b8f927] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Tạo tài khoản
            </button>
          </div>

          <div className="mb-6 text-center">
            <h2 className="font-display text-2xl font-black tracking-wide text-white uppercase sm:text-3xl">
              {isCreatingAccount ? "ĐĂNG KÝ THÀNH VIÊN" : "ĐĂNG NHẬP HỆ THỐNG"}
            </h2>
            <p className="mt-1.5 text-xs text-zinc-400">
              {isCreatingAccount
                ? "Mỗi khách hàng sử dụng 1 Email & 1 Số điện thoại duy nhất."
                : "Truy cập giỏ hàng, lịch sử đơn hàng và lộ trình cá nhân hóa."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreatingAccount && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Họ và tên
                  </label>
                  <div className="flex h-11 items-center gap-3 rounded-xs border border-zinc-800 bg-[#0b0d0c] px-3.5 transition focus-within:border-[#b8f927]">
                    <UserRound size={16} className="shrink-0 text-[#b8f927]" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="Nhập họ và tên của bạn"
                      className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Số điện thoại (duy nhất)
                  </label>
                  <div className="flex h-11 items-center gap-3 rounded-xs border border-zinc-800 bg-[#0b0d0c] px-3.5 transition focus-within:border-[#b8f927]">
                    <Phone size={16} className="shrink-0 text-[#b8f927]" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="Ví dụ: 0901234567"
                      className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
              >
                Địa chỉ email
              </label>
              <div className="flex h-11 items-center gap-3 rounded-xs border border-zinc-800 bg-[#0b0d0c] px-3.5 transition focus-within:border-[#b8f927]">
                <Mail size={16} className="shrink-0 text-[#b8f927]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ban@example.com"
                  className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
              >
                Mật khẩu
              </label>
              <div className="flex h-11 items-center gap-3 rounded-xs border border-zinc-800 bg-[#0b0d0c] px-3.5 transition focus-within:border-[#b8f927]">
                <LockKeyhole size={16} className="shrink-0 text-[#b8f927]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    isCreatingAccount ? "new-password" : "current-password"
                  }
                  required
                  minLength={6}
                  placeholder="Ít nhất 6 ký tự"
                  className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-zinc-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xs bg-[#b8f927] text-xs font-extrabold tracking-[0.12em] text-black uppercase shadow-[0_0_25px_rgba(184,249,39,0.22)] transition hover:bg-[#c9ff4d] disabled:opacity-50 sm:text-sm"
            >
              <span>
                {isSubmitting
                  ? "Đang xác thực..."
                  : isCreatingAccount
                    ? "Tạo tài khoản ngay"
                    : "Đăng nhập"}
              </span>
              {!isSubmitting && <ArrowRight size={16} strokeWidth={2.5} />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-400">
            <Link
              to="/"
              className="font-semibold text-zinc-300 underline-offset-4 hover:text-[#b8f927] hover:underline"
            >
              ← Quay lại trang chủ nutraGO
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default LogIn;
