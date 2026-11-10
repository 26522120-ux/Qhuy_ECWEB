import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Save, ShieldCheck, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError, updateAccountProfile } from "../api";
import { useStore } from "../context/StoreContext";

const Adresses = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthLoading, refreshAuth, logout } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name ?? "");
      setEmail(currentUser.email ?? "");
      setPhone(currentUser.phone ?? "");
    }
  }, [currentUser]);

  if (isAuthLoading) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-16">
        <p className="text-sm text-app-text-light">Đang tải thông tin tài khoản...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <UserCheck size={48} className="text-app-green" />
        <h1 className="mt-4 font-serif text-3xl text-app-green">
          Quản lý tài khoản khách hàng
        </h1>
        <p className="mt-2 text-sm text-app-text-light">
          Vui lòng đăng nhập để quản lý email và số điện thoại gắn với tài khoản của bạn.
        </p>
        <Link
          to="/login"
          className="mt-6 rounded-full bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Đi tới trang Đăng nhập
        </Link>
      </main>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await updateAccountProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      await refreshAuth();
      toast.success("Cập nhật thông tin tài khoản thành công.");
    } catch (error) {
      if (error instanceof ApiError && (error.redirectToLogin || error.statusCode === 409)) {
        toast.error(error.message);
        await logout();
        navigate("/login");
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thông tin tài khoản.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-app-orange">Tài khoản cá nhân</p>
        <h1 className="mt-1 font-serif text-3xl text-app-green">
          Thông tin tài khoản khách hàng
        </h1>
        <p className="mt-1 text-sm text-app-text-light">
          Mỗi tài khoản khách hàng chỉ được liên kết duy nhất 1 địa chỉ Email và 1 Số điện thoại.
        </p>
      </div>

      <section className="rounded-2xl border border-app-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-5">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-app-cream text-app-green">
              <ShieldCheck size={24} />
            </span>
            <div>
              <p className="text-base font-semibold text-app-green">
                {currentUser.name}
              </p>
              <p className="text-xs text-app-text-light">
                {currentUser.isAdmin ? "Quản trị viên (Admin)" : "Khách hàng (Customer)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              <Mail size={13} />
              {currentUser.email}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-app-orange">
              <Phone size={13} />
              {currentUser.phone ?? "Chưa liên kết SĐT"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-app-green">
            Họ và tên
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nhập họ và tên của bạn"
              className="mt-1.5 w-full rounded-xl border border-app-border px-4 py-3 text-sm font-normal text-app-text outline-none focus:border-app-green"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-app-green">
              Email gắn với tài khoản (Duy nhất)
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ban@example.com"
                className="mt-1.5 w-full rounded-xl border border-app-border px-4 py-3 text-sm font-normal text-app-text outline-none focus:border-app-green"
              />
            </label>

            <label className="block text-sm font-medium text-app-green">
              Số điện thoại gắn với tài khoản (Duy nhất)
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ví dụ: 0901234567"
                className="mt-1.5 w-full rounded-xl border border-app-border px-4 py-3 text-sm font-normal text-app-text outline-none focus:border-app-green"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-app-green px-5 py-3 text-sm font-semibold text-white hover:bg-app-green-light disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? "Đang kiểm tra & lưu..." : "Lưu thông tin tài khoản"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Adresses;
