import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError, checkAccountUnique, loginWithBackend, syncAccountToNeon } from "../api";
import { assets } from "../assets/assets";
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
      if (error instanceof ApiError && (error.redirectToLogin || error.statusCode === 409)) {
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
    <main className="grid min-h-screen bg-[#f6fcf8] md:grid-cols-[52%_48%]">
      <section
        aria-label="Chào mừng đến với POPPIN MART"
        className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-app-green bg-cover bg-center px-8 text-center md:flex"
        style={{ backgroundImage: `url(${assets.hero_bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a3d24]/92 via-[#0f5132]/85 to-[#16a34a]/75" />
        <div className="relative z-10 max-w-lg text-white">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-white/30 bg-white p-1.5 shadow-lg">
            <img
              src="/poppin-mart-logo.jpg"
              alt="POPPIN MART Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
            <LeafMark />
            Tươi sạch từ nông trại
          </div>
          <h1 className="font-sans text-3xl font-bold leading-tight lg:text-4xl">
            Chào mừng bạn đến với POPPIN MART
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-emerald-50/85">
            Siêu thị thực phẩm tươi sạch và nông sản hữu cơ được giao nhanh tận nhà.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[410px] rounded-3xl border border-emerald-100 bg-white p-7 shadow-[0_12px_35px_-12px_rgba(15,81,50,0.1)] sm:p-9">
          <Link
            to="/"
            className="mb-6 flex flex-col items-center justify-center gap-2"
            aria-label="Trang chủ POPPIN MART"
          >
            <img
              src="/poppin-mart-logo.jpg"
              alt="POPPIN MART Logo"
              className="size-16 rounded-2xl border border-emerald-200 bg-white object-contain p-1 shadow-xs"
            />
            <span className="font-serif text-2xl font-extrabold tracking-tight">
              <span className="text-[#16a34a]">POPPIN</span>{" "}
              <span className="text-[#0f5132]">MART</span>
            </span>
          </Link>

          <div className="mb-7 text-center">
            <h2 className="text-2xl font-semibold text-app-green">
              {isCreatingAccount ? "Tạo tài khoản" : "Đăng nhập vào tài khoản"}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              {isCreatingAccount ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
              <button
                type="button"
                onClick={() => setIsCreatingAccount((current) => !current)}
                className="font-semibold text-app-orange hover:text-app-orange-dark"
              >
                {isCreatingAccount ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreatingAccount && (
              <>
                <div>
                  <label htmlFor="name" className="mb-1 block text-xs font-medium text-app-green">
                    Họ và tên
                  </label>
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-app-green focus-within:ring-2 focus-within:ring-app-green/10">
                    <UserRound size={16} className="shrink-0 text-slate-500" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="Nhập họ và tên"
                      className="h-full w-full bg-transparent text-xs text-app-text outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-xs font-medium text-app-green">
                    Số điện thoại (duy nhất cho 1 tài khoản)
                  </label>
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-app-green focus-within:ring-2 focus-within:ring-app-green/10">
                    <Phone size={16} className="shrink-0 text-slate-500" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="Ví dụ: 0901234567"
                      className="h-full w-full bg-transparent text-xs text-app-text outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-app-green">
                Địa chỉ email
              </label>
              <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-app-green focus-within:ring-2 focus-within:ring-app-green/10">
                <Mail size={16} className="shrink-0 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ban@example.com"
                  className="h-full w-full bg-transparent text-xs text-app-text outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-app-green">
                Mật khẩu
              </label>
              <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-app-green focus-within:ring-2 focus-within:ring-app-green/10">
                <LockKeyhole size={16} className="shrink-0 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isCreatingAccount ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  placeholder="Ít nhất 6 ký tự"
                  className="h-full w-full bg-transparent text-xs text-app-text outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full rounded-xl bg-[#00351c] text-sm font-semibold text-white hover:bg-app-green-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-green"
            >
              {isSubmitting
                ? "Đang xử lý..."
                : isCreatingAccount
                  ? "Tạo tài khoản"
                  : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link to="/" className="font-medium text-app-green hover:text-app-orange">
              Quay lại trang chủ
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

const LeafMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
    <path d="M20.8 3.2c-7.3-.5-13.2 1.3-15.5 5.2-1.6 2.7-.8 5.8 1.5 7.1 2.2 1.2 5 .3 6.5-2.2-1.9.9-3.5.8-4.4-.2 1.8-3.1 5-5.7 9.2-7.2-4.1 2.3-7 5.2-8.8 8.7-1.6 3.2.3 6.3 3.2 6.2 5.8-.2 9.2-8 8.3-17.6Z" />
  </svg>
);

export default LogIn;
