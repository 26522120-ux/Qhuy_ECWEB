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
      <main className="min-h-[65vh] bg-[#0b0d0c] px-4 py-16 text-center text-sm text-zinc-400">
        Đang tải thông tin tài khoản...
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <UserCheck size={48} className="text-[#b8f927]" />
          <h1 className="mt-4 font-display text-3xl font-black text-white uppercase">
            Quản lý tài khoản khách hàng
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vui lòng đăng nhập để quản lý email và số điện thoại gắn với tài khoản của bạn.
          </p>
          <Link
            to="/login"
            className="mt-6 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
          >
            Đi tới trang Đăng nhập
          </Link>
        </div>
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
      if (
        error instanceof ApiError &&
        (error.redirectToLogin || error.statusCode === 409)
      ) {
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
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 border-b border-white/10 pb-5">
          <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // TÀI KHOẢN CÁ NHÂN nutraGO
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
            Thông tin tài khoản khách hàng
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Mỗi tài khoản khách hàng chỉ được liên kết duy nhất 1 địa chỉ Email và 1 Số điện thoại.
          </p>
        </div>

        <section className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xs border border-[#b8f927]/35 bg-[#b8f927]/10 text-[#b8f927]">
                <ShieldCheck size={24} />
              </span>
              <div>
                <p className="font-display text-lg font-black text-white uppercase">
                  {currentUser.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {currentUser.isAdmin ? "Quản trị viên (Admin)" : "Khách hàng (Customer)"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-white/15 bg-[#0b0d0c] px-3 py-1.5 font-medium text-zinc-200">
                <Mail size={13} className="text-[#b8f927]" />
                {currentUser.email}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-white/15 bg-[#0b0d0c] px-3 py-1.5 font-medium text-zinc-200">
                <Phone size={13} className="text-[#b8f927]" />
                {currentUser.phone ?? "Chưa liên kết SĐT"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
              Họ và tên
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nhập họ và tên của bạn"
                className="mt-1.5 w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
                Email gắn với tài khoản (Duy nhất)
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ban@example.com"
                  className="mt-1.5 w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
                />
              </label>

              <label className="block text-xs font-bold tracking-wider text-zinc-300 uppercase">
                Số điện thoại gắn với tài khoản (Duy nhất)
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="mt-1.5 w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm font-normal text-white outline-none focus:border-[#b8f927]"
                />
              </label>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d] disabled:opacity-60"
              >
                <Save size={15} />
                {isSaving ? "Đang kiểm tra & lưu..." : "Lưu thông tin tài khoản"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Adresses;
