import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ApiError, requestCheckoutOtp, verifyCheckoutOtp, type CheckoutOtpSession } from "../api";
import { useCart } from "../context/CartContext";
import { useStore } from "../context/StoreContext";
import { formatVnd, formatVndAmount, getProductNameVi } from "../localization";

const OTP_LIFETIME_SECONDS = 5 * 60;

const Checkout = () => {
  const { items, totals, clearCart } = useCart();
  const { addOrder, taxRate, currentUser, refreshAuth, logout } = useStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"QR_OTP" | "COD">("QR_OTP");
  const [otpSession, setOtpSession] = useState<CheckoutOtpSession | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpRevealed, setIsOtpRevealed] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isOtpPreVerified, setIsOtpPreVerified] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    total: number;
    paymentMethod: string;
    isPaid: boolean;
  } | null>(null);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + OTP_LIFETIME_SECONDS * 1000);
  const [secondsLeft, setSecondsLeft] = useState(OTP_LIFETIME_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chống xung đột API (race condition & double submit)
  const otpRequestSeqRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const initServerOtpSession = useCallback(
    async (showToast = false) => {
      if (items.length === 0) return;
      const requestSeq = ++otpRequestSeqRef.current;
      setIsRequestingOtp(true);
      setIsOtpPreVerified(false);
      setOtpError(null);

      try {
        const session = await requestCheckoutOtp(
          items.map(({ product, quantity }) => ({
            productId: product._id,
            quantity,
          })),
        );
        // Bỏ qua nếu đã có phiên yêu cầu mới hơn
        if (requestSeq !== otpRequestSeqRef.current) return;

        setOtpSession(session);
        setOtpInput("");
        setIsOtpRevealed(false);
        const nextExpires = new Date(session.expiresAt).getTime();
        setExpiresAt(nextExpires);
        setSecondsLeft(Math.max(0, Math.ceil((nextExpires - Date.now()) / 1000)));
        if (showToast) {
          toast.success("Đã khởi tạo phiên OTP mới từ máy chủ.");
        }
      } catch (error) {
        if (requestSeq !== otpRequestSeqRef.current) return;
        setOtpSession(null);
        setOtpInput("");
        const message =
          error instanceof Error
            ? error.message
            : "Không thể khởi tạo phiên OTP từ máy chủ.";
        setOtpError(message);
        toast.error(message);
      } finally {
        if (requestSeq === otpRequestSeqRef.current) {
          setIsRequestingOtp(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((i) => `${i.product._id}:${i.quantity}`).join(",")],
  );

  useEffect(() => {
    void initServerOtpSession(false);
  }, [initServerOtpSession]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const handleVerifyOtpOnly = async () => {
    if (!otpSession) {
      toast.error("Chưa có phiên OTP hợp lệ từ máy chủ. Vui lòng bấm Tạo mã mới.");
      return;
    }
    const trimmedOtp = otpInput.trim();
    if (!/^[0-9]{6}$/.test(trimmedOtp)) {
      toast.error("Vui lòng nhập mã OTP gồm đúng 6 chữ số.");
      return;
    }
    if (secondsLeft <= 0) {
      toast.error("Mã OTP đã hết hạn. Vui lòng tạo mã mới.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyCheckoutOtp({
        otpId: otpSession.otpId,
        orderCode: otpSession.orderCode,
        otpCode: trimmedOtp,
      });
      setIsOtpPreVerified(true);
      toast.success("Xác thực mã OTP trên máy chủ hợp lệ! Bạn có thể hoàn tất đơn hàng.");
    } catch (error) {
      setIsOtpPreVerified(false);
      toast.error(error instanceof Error ? error.message : "Mã OTP không hợp lệ.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    if (paymentMethod === "QR_OTP") {
      if (!otpSession) {
        toast.error("Phiên OTP máy chủ chưa sẵn sàng. Vui lòng tạo mã OTP mới hoặc chọn COD.");
        return;
      }
      if (secondsLeft <= 0) {
        toast.error("Mã OTP đã hết hạn. Vui lòng tạo mã OTP mới.");
        return;
      }
      const trimmedOtp = otpInput.trim();
      if (!/^[0-9]{6}$/.test(trimmedOtp)) {
        toast.error("Vui lòng nhập đủ 6 chữ số mã OTP để xác nhận thanh toán.");
        return;
      }
    }

    const formData = new FormData(event.currentTarget);
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const order = await addOrder({
        customerName: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim() || currentUser?.email,
        phone: String(formData.get("phone") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        paymentMethod,
        otpId: paymentMethod === "QR_OTP" ? otpSession?.otpId : undefined,
        orderCode: otpSession?.orderCode,
        otpCode: paymentMethod === "QR_OTP" ? otpInput.trim() : undefined,
        items: items.map(({ product, quantity }) => ({
          productId: product._id,
          quantity,
        })),
      });

      await refreshAuth();
      setCompletedOrder({
        id: order.orderCode ?? order.id,
        total: order.total,
        paymentMethod: paymentMethod === "QR_OTP" ? "QR & OTP Bảo mật" : "Thanh toán khi nhận hàng (COD)",
        isPaid: paymentMethod === "QR_OTP",
      });
      clearCart();
      toast.success("Đặt hàng thành công!");
    } catch (error) {
      if (error instanceof ApiError && (error.redirectToLogin || error.statusCode === 409)) {
        toast.error(error.message);
        if (error.code === "DUPLICATE_PHONE" || error.code === "DUPLICATE_EMAIL" || error.code === "PHONE_MISMATCH" || error.code === "EMAIL_MISMATCH") {
          if (!currentUser) {
            navigate("/login");
          } else {
            await logout();
            navigate("/login");
          }
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const copyOtp = async () => {
    if (!otpSession) return;
    try {
      await navigator.clipboard.writeText(otpSession.otpCode);
      setOtpInput(otpSession.otpCode);
      setIsOtpRevealed(true);
      toast.success("Đã lấy mã OTP từ phiên máy chủ và điền vào ô xác nhận.");
    } catch {
      setOtpInput(otpSession.otpCode);
      setIsOtpRevealed(true);
      toast.success("Đã điền mã OTP vào ô xác nhận.");
    }
  };

  if (completedOrder) {
    return (
      <main className="min-h-[70vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-xs border border-[#b8f927]/35 bg-[#b8f927]/10 text-[#b8f927]">
            <CheckCircle2 size={36} />
          </span>
          <p className="mt-5 text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // GIAO DỊCH HOÀN TẤT
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
            Đặt hàng thành công!
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
            Cảm ơn bạn đã mua sắm tại nutraGO. Đơn hàng của bạn đã được ghi nhận trên hệ thống.
          </p>
          <div className="mt-6 w-full max-w-md space-y-2.5 rounded-xs border border-white/10 bg-[#111513] p-5 text-left text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-400">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-[#b8f927]">{completedOrder.id}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-400">Phương thức:</span>
              <span className="font-medium text-white">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-400">Trạng thái thanh toán:</span>
              <span className="font-semibold text-[#b8f927]">
                {completedOrder.isPaid ? "Đã xác thực OTP & Thanh toán" : "Thanh toán khi nhận hàng"}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-3">
              <span className="font-display text-base font-bold text-white uppercase">Tổng cộng:</span>
              <span className="font-display text-xl font-black text-[#b8f927]">
                {formatVndAmount(completedOrder.total)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {currentUser && (
              <Link
                to="/orders"
                className="rounded-xs border border-white/15 bg-[#111513] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase hover:border-[#b8f927] hover:text-[#b8f927]"
              >
                Xem đơn hàng của tôi
              </Link>
            )}
            <Link
              to="/products"
              className="rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-[65vh] bg-[#0b0d0c] text-white">
        <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // THANH TOÁN nutraGO
          </p>
          <h1 className="mt-2 font-display text-3xl font-black text-white uppercase sm:text-4xl">
            Chưa có sản phẩm để thanh toán
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Hãy thêm sản phẩm vào giỏ hàng trước nhé.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d]"
          >
            Xem sản phẩm
          </Link>
        </div>
      </main>
    );
  }

  const paymentPayload = JSON.stringify({
    type: "NUTRAGO_OTP_CHECKOUT",
    orderCode: otpSession?.orderCode ?? "PENDING",
    otpId: otpSession?.otpId ?? "none",
    amountVnd: totals.total,
  });
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          to="/cart"
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase hover:text-[#b8f927]"
        >
          <ArrowLeft size={15} />
          Quay lại giỏ hàng
        </Link>
        <div className="mb-7 border-b border-white/10 pb-5">
          <p className="text-xs font-bold tracking-[0.22em] text-[#b8f927] uppercase">
            // BƯỚC CUỐI CÙNG
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
            Thanh toán &amp; Xác thực OTP
          </h1>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <section className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-6">
              <h2 className="font-display text-xl font-black tracking-wide text-white uppercase">
                Thông tin nhận hàng
              </h2>
              <form
                id="checkout-form"
                onSubmit={handlePaymentSubmit}
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                <div>
                  <label
                    htmlFor="customer-name"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Họ và tên
                  </label>
                  <input
                    id="customer-name"
                    name="name"
                    defaultValue={currentUser?.name ?? ""}
                    autoComplete="name"
                    required
                    placeholder="Nhập họ và tên"
                    className="w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="customer-phone"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Số điện thoại (1 SĐT / 1 tài khoản)
                  </label>
                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    defaultValue={currentUser?.phone ?? ""}
                    autoComplete="tel"
                    required
                    placeholder="Ví dụ: 0901234567"
                    className="w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="customer-email"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Email tài khoản (1 Email / 1 tài khoản)
                  </label>
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    defaultValue={currentUser?.email ?? ""}
                    autoComplete="email"
                    required={Boolean(currentUser)}
                    placeholder="ban@example.com"
                    className="w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="customer-address"
                    className="mb-1.5 block text-xs font-bold tracking-wider text-zinc-300 uppercase"
                  >
                    Địa chỉ giao hàng
                  </label>
                  <textarea
                    id="customer-address"
                    name="address"
                    autoComplete="street-address"
                    required
                    rows={3}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="w-full resize-y rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#b8f927]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="mb-2 block text-xs font-bold tracking-wider text-zinc-300 uppercase">
                    Phương thức thanh toán
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("QR_OTP")}
                      className={`flex items-center justify-between rounded-xs border p-3.5 text-left text-xs font-bold transition ${
                        paymentMethod === "QR_OTP"
                          ? "border-[#b8f927] bg-[#b8f927]/12 text-[#b8f927]"
                          : "border-white/15 bg-[#0b0d0c] text-zinc-300 hover:border-white/30"
                      }`}
                    >
                      <span>Quét QR &amp; Xác thực OTP (Khuyên dùng)</span>
                      <ShieldCheck size={18} className="shrink-0 text-[#b8f927]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`flex items-center justify-between rounded-xs border p-3.5 text-left text-xs font-bold transition ${
                        paymentMethod === "COD"
                          ? "border-[#b8f927] bg-[#b8f927]/12 text-[#b8f927]"
                          : "border-white/15 bg-[#0b0d0c] text-zinc-300 hover:border-white/30"
                      }`}
                    >
                      <span>Thanh toán khi nhận hàng (COD)</span>
                      <CheckCircle2 size={18} className="shrink-0 text-[#b8f927]" />
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {paymentMethod === "QR_OTP" && (
              <section className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-black tracking-wide text-white uppercase">
                      Quét mã QR &amp; Xác nhận mã OTP
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Mã giao dịch:{" "}
                      <span className="font-mono font-bold text-[#b8f927]">
                        {otpSession?.orderCode ?? "Đang cấp..."}
                      </span>
                      {otpSession ? (
                        <span className="ml-2 rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 px-2 py-0.5 text-[10px] font-bold text-[#b8f927]">
                          Đã đồng bộ Server
                        </span>
                      ) : (
                        <span className="ml-2 rounded-xs border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          Chưa có phiên OTP
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-xs border px-3 py-1.5 text-xs font-bold ${
                      secondsLeft > 60
                        ? "border-[#b8f927]/35 bg-[#b8f927]/10 text-[#b8f927]"
                        : secondsLeft > 0
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border-red-500/40 bg-red-500/10 text-red-400"
                    }`}
                  >
                    <Clock3 size={15} />
                    {secondsLeft > 0 ? `Hết hạn sau ${minutes}:${seconds}` : "Mã OTP đã hết hạn"}
                  </div>
                </div>

                <div className="mt-5 grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
                  <div className="mx-auto rounded-xs border border-white/15 bg-white p-3">
                    <QRCodeSVG
                      value={paymentPayload}
                      size={196}
                      level="M"
                      includeMargin
                      title="Mã QR thanh toán nutraGO"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
                      Tổng thanh toán
                    </p>
                    <p className="mt-1 font-display text-3xl font-black text-[#b8f927]">
                      {formatVndAmount(totals.total)}
                    </p>

                    <div className="mt-4 rounded-xs border border-white/10 bg-[#0b0d0c] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-400">
                          Mã OTP được cấp bởi máy chủ
                        </p>
                        <button
                          type="button"
                          disabled={isRequestingOtp}
                          onClick={() => void initServerOtpSession(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#b8f927] hover:underline disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={isRequestingOtp ? "animate-spin" : ""} />
                          Tạo mã mới
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {otpSession ? (
                          <>
                            <span className="font-mono text-2xl font-black tracking-[0.3em] text-[#b8f927]">
                              {isOtpRevealed
                                ? otpSession.otpCode
                                : `••••${otpSession.otpCode.slice(-2)}`}
                            </span>
                            <button
                              type="button"
                              onClick={copyOtp}
                              aria-label="Nhận và điền mã OTP từ máy chủ"
                              className="inline-flex items-center gap-1.5 rounded-xs border border-white/15 bg-[#111513] px-3 py-1.5 text-xs font-bold text-white hover:border-[#b8f927] hover:text-[#b8f927]"
                            >
                              <Copy size={13} />
                              {isOtpRevealed ? "Sao chép lại" : "Hiện & Điền OTP"}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-red-400">
                            {otpError ?? "Không thể kết nối máy chủ OTP. Vui lòng bấm Tạo mã mới."}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="otp-confirm-input"
                        className="mb-1.5 flex items-center justify-between text-xs font-bold text-zinc-200"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <KeyRound size={14} className="text-[#b8f927]" />
                          Nhập mã OTP 6 chữ số để xác thực thanh toán
                        </span>
                        {isOtpPreVerified && (
                          <span className="inline-flex items-center gap-1 text-[#b8f927]">
                            <Sparkles size={13} /> Đã xác thực
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="otp-confirm-input"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                            setIsOtpPreVerified(false);
                          }}
                          placeholder="Nhập 6 chữ số OTP"
                          className="w-full rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-2.5 font-mono text-base font-bold tracking-[0.25em] text-[#b8f927] outline-none placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-zinc-500 focus:border-[#b8f927]"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingOtp || secondsLeft <= 0}
                          onClick={() => void handleVerifyOtpOnly()}
                          className="shrink-0 rounded-xs border border-[#b8f927] bg-[#b8f927]/10 px-4 py-2.5 text-xs font-bold text-[#b8f927] uppercase hover:bg-[#b8f927] hover:text-black disabled:opacity-50"
                        >
                          {isVerifyingOtp ? "Đang kiểm tra..." : "Kiểm tra OTP"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="font-display text-xl font-black tracking-wide text-white uppercase">
              Đơn hàng của bạn
            </h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product._id} className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={getProductNameVi(product)}
                    className="size-12 shrink-0 rounded-xs border border-white/10 bg-[#181d1a] object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold break-words text-white sm:text-sm">
                      {getProductNameVi(product)}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Số lượng: {quantity}
                      {currentUser?.isAdmin ? ` (Kho còn: ${product.stock})` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-extrabold text-[#b8f927]">
                    {formatVnd(product.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between gap-3 text-zinc-400">
                <span>Tạm tính</span>
                <span className="font-semibold text-white">{formatVndAmount(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3 text-zinc-400">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-white">
                  {totals.deliveryFee === 0 ? "Miễn phí" : formatVndAmount(totals.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between gap-3 text-zinc-400">
                <span>Thuế ({taxRate}%)</span>
                <span className="font-semibold text-white">{formatVndAmount(totals.tax)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                <span className="font-display text-lg font-bold text-white uppercase">
                  Tổng cộng
                </span>
                <span className="font-display text-2xl font-black text-[#b8f927]">
                  {formatVndAmount(totals.total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={
                isSubmitting ||
                isRequestingOtp ||
                (paymentMethod === "QR_OTP" &&
                  (!otpSession || secondsLeft <= 0 || otpInput.trim().length !== 6))
              }
              className="mt-5 w-full rounded-xs bg-[#b8f927] px-5 py-3.5 text-xs font-black tracking-wider text-[#08100a] uppercase hover:bg-[#cbff4d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Đang xử lý đơn hàng..."
                : paymentMethod === "QR_OTP"
                  ? "Xác nhận mã OTP & Thanh toán"
                  : "Đặt hàng (Thanh toán khi nhận)"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
