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

function createFallbackOtp() {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return (randomValues[0] % 1_000_000).toString().padStart(6, "0");
}

function createFallbackOrderCode() {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return `IM${Date.now().toString().slice(-6)}${randomValues[0].toString(36).slice(0, 4).toUpperCase()}`;
}

const Checkout = () => {
  const { items, totals, clearCart } = useCart();
  const { addOrder, taxRate, currentUser, refreshAuth, logout } = useStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"QR_OTP" | "COD">("QR_OTP");
  const [otpSession, setOtpSession] = useState<CheckoutOtpSession | null>(null);
  const [otp, setOtp] = useState(createFallbackOtp);
  const [paymentCode, setPaymentCode] = useState(createFallbackOrderCode);
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
        setOtp(session.otpCode);
        setOtpInput(session.otpCode);
        setPaymentCode(session.orderCode);
        const nextExpires = new Date(session.expiresAt).getTime();
        setExpiresAt(nextExpires);
        setSecondsLeft(Math.max(0, Math.ceil((nextExpires - Date.now()) / 1000)));
        if (showToast) {
          toast.success(`Đã tạo mã OTP mới (${session.otpCode}) đồng bộ với máy chủ.`);
        }
      } catch (error) {
        if (requestSeq !== otpRequestSeqRef.current) return;
        const fallbackCode = createFallbackOtp();
        setOtpSession(null);
        setOtp(fallbackCode);
        setOtpInput(fallbackCode);
        setPaymentCode(createFallbackOrderCode());
        setExpiresAt(Date.now() + OTP_LIFETIME_SECONDS * 1000);
        setSecondsLeft(OTP_LIFETIME_SECONDS);
        if (error instanceof Error) {
          toast.error(error.message);
        }
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
      if (otpSession) {
        await verifyCheckoutOtp({
          otpId: otpSession.otpId,
          orderCode: otpSession.orderCode,
          otpCode: trimmedOtp,
        });
      } else if (trimmedOtp !== otp) {
        throw new Error("Mã OTP không trùng khớp.");
      }
      setIsOtpPreVerified(true);
      toast.success("Xác thực mã OTP hợp lệ! Bạn có thể hoàn tất đơn hàng.");
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
      if (secondsLeft <= 0) {
        toast.error("Mã OTP đã hết hạn. Vui lòng tạo mã OTP mới.");
        return;
      }
      const trimmedOtp = otpInput.trim();
      if (!/^[0-9]{6}$/.test(trimmedOtp)) {
        toast.error("Vui lòng nhập đủ 6 chữ số mã OTP để xác nhận thanh toán.");
        return;
      }
      if (!otpSession && trimmedOtp !== otp) {
        toast.error("Mã OTP nhập vào không khớp với mã OTP hiện tại.");
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
        orderCode: paymentCode,
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
    try {
      await navigator.clipboard.writeText(otp);
      setOtpInput(otp);
      toast.success("Đã sao chép và tự động điền mã OTP.");
    } catch {
      setOtpInput(otp);
      toast.success("Đã tự động điền mã OTP vào ô xác nhận.");
    }
  };

  if (completedOrder) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 size={64} className="text-app-success" />
        <h1 className="mt-5 font-serif text-3xl text-app-green">Đặt hàng thành công!</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-app-text-light">
          Cảm ơn bạn đã mua sắm tại POPPIN MART. Đơn hàng của bạn đã được ghi nhận.
        </p>
        <div className="mt-5 w-full max-w-md space-y-2 rounded-2xl border border-app-border bg-white p-5 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-app-text-light">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-app-green">{completedOrder.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-app-text-light">Phương thức:</span>
            <span className="font-medium text-app-text">{completedOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-app-text-light">Trạng thái thanh toán:</span>
            <span className="font-semibold text-app-success">
              {completedOrder.isPaid ? "Đã xác thực OTP & Thanh toán" : "Thanh toán khi nhận hàng"}
            </span>
          </div>
          <div className="flex justify-between border-t border-app-border pt-2">
            <span className="font-semibold text-app-text">Tổng cộng:</span>
            <span className="font-bold text-app-green">{formatVndAmount(completedOrder.total)}</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {currentUser && (
            <Link
              to="/orders"
              className="rounded-full border border-app-green px-6 py-3 text-sm font-semibold text-app-green hover:bg-app-cream"
            >
              Xem đơn hàng của tôi
            </Link>
          )}
          <Link
            to="/products"
            className="rounded-full bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-app-green">Chưa có sản phẩm để thanh toán</h1>
        <p className="mt-2 text-sm text-app-text-light">Hãy thêm sản phẩm vào giỏ hàng trước nhé.</p>
        <Link
          to="/products"
          className="mt-6 rounded-full bg-app-green px-6 py-3 text-sm font-semibold text-white hover:bg-app-green-light"
        >
          Xem sản phẩm
        </Link>
      </main>
    );
  }

  const paymentPayload = JSON.stringify({
    type: "POPPINMART_OTP_CHECKOUT",
    orderCode: paymentCode,
    otpId: otpSession?.otpId ?? "local",
    amountVnd: totals.total,
    otp,
  });
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/cart"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-app-text-light hover:text-app-green"
      >
        <ArrowLeft size={16} />
        Quay lại giỏ hàng
      </Link>
      <div className="mb-7">
        <p className="text-sm font-semibold text-app-orange">Bước cuối cùng</p>
        <h1 className="mt-1 font-serif text-3xl text-app-green">Thanh toán & Xác thực OTP</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-app-border bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-app-green">Thông tin nhận hàng</h2>
            <form
              id="checkout-form"
              onSubmit={handlePaymentSubmit}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-1.5 block text-sm font-medium text-app-text"
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
                  className="w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-app-green"
                />
              </div>
              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-1.5 block text-sm font-medium text-app-text"
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
                  className="w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-app-green"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="customer-email"
                  className="mb-1.5 block text-sm font-medium text-app-text"
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
                  className="w-full rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-app-green"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="customer-address"
                  className="mb-1.5 block text-sm font-medium text-app-text"
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
                  className="w-full resize-y rounded-xl border border-app-border px-4 py-3 text-sm outline-none focus:border-app-green"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-app-text">
                  Phương thức thanh toán
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("QR_OTP")}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${
                      paymentMethod === "QR_OTP"
                        ? "border-app-green bg-app-green/5 font-semibold text-app-green"
                        : "border-app-border text-app-text-light hover:border-app-green/50"
                    }`}
                  >
                    <span>Quét QR & Xác thực OTP (Khuyên dùng)</span>
                    <ShieldCheck size={18} className="text-app-green" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-sm transition ${
                      paymentMethod === "COD"
                        ? "border-app-green bg-app-green/5 font-semibold text-app-green"
                        : "border-app-border text-app-text-light hover:border-app-green/50"
                    }`}
                  >
                    <span>Thanh toán khi nhận hàng (COD)</span>
                    <CheckCircle2 size={18} className="text-app-orange" />
                  </button>
                </div>
              </div>
            </form>
          </section>

          {paymentMethod === "QR_OTP" && (
            <section className="rounded-2xl border border-app-border bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-app-green">
                    Quét mã QR & Xác nhận mã OTP
                  </h2>
                  <p className="mt-1 text-sm text-app-text-light">
                    Mã giao dịch:{" "}
                    <span className="font-mono font-semibold text-app-green">{paymentCode}</span>
                    {otpSession && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        Đã đồng bộ API
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    secondsLeft > 60
                      ? "bg-app-cream text-app-green"
                      : secondsLeft > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-app-error"
                  }`}
                >
                  <Clock3 size={16} />
                  {secondsLeft > 0 ? `Hết hạn sau ${minutes}:${seconds}` : "Mã OTP đã hết hạn"}
                </div>
              </div>

              <div className="mt-5 grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
                <div className="mx-auto rounded-2xl border border-app-border bg-white p-3">
                  <QRCodeSVG
                    value={paymentPayload}
                    size={196}
                    level="M"
                    includeMargin
                    title="Mã QR thanh toán mô phỏng InstantMart"
                  />
                </div>

                <div>
                  <p className="text-sm text-app-text-light">Tổng thanh toán</p>
                  <p className="mt-1 text-2xl font-bold text-app-green">
                    {formatVndAmount(totals.total)}
                  </p>

                  <div className="mt-4 rounded-xl bg-app-cream p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-app-text-light">
                        Mã OTP được cấp bởi máy chủ
                      </p>
                      <button
                        type="button"
                        disabled={isRequestingOtp}
                        onClick={() => void initServerOtpSession(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-app-green hover:text-app-orange disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isRequestingOtp ? "animate-spin" : ""} />
                        Tạo mã mới
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-2xl font-bold tracking-[0.3em] text-app-green">
                        {otp}
                      </span>
                      <button
                        type="button"
                        onClick={copyOtp}
                        aria-label="Sao chép và điền mã OTP"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-app-green shadow-xs hover:text-app-orange"
                      >
                        <Copy size={14} />
                        Sao chép & Điền
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="otp-confirm-input"
                      className="mb-1.5 flex items-center justify-between text-xs font-semibold text-app-green"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <KeyRound size={14} />
                        Nhập mã OTP 6 chữ số để xác thực thanh toán
                      </span>
                      {isOtpPreVerified && (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
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
                        className="w-full rounded-xl border border-app-border px-4 py-2.5 font-mono text-base font-bold tracking-[0.25em] text-app-green outline-none focus:border-app-green"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || secondsLeft <= 0}
                        onClick={() => void handleVerifyOtpOnly()}
                        className="shrink-0 rounded-xl border border-app-green px-4 py-2.5 text-xs font-semibold text-app-green hover:bg-app-cream disabled:opacity-50"
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

        <aside className="rounded-2xl border border-app-border bg-white p-5 sm:p-6 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold text-app-green">Đơn hàng của bạn</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product._id} className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt={getProductNameVi(product)}
                  className="size-12 rounded-lg bg-app-cream object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-app-green">
                    {getProductNameVi(product)}
                  </p>
                  <p className="text-xs text-app-text-light">
                    Số lượng: {quantity}
                    {currentUser?.isAdmin ? ` (Kho còn: ${product.stock})` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-app-green">
                  {formatVnd(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-app-border pt-4 text-sm">
            <div className="flex justify-between gap-3 text-app-text-light">
              <span>Tạm tính</span>
              <span className="text-app-text">{formatVndAmount(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3 text-app-text-light">
              <span>Phí giao hàng</span>
              <span className="text-app-text">
                {totals.deliveryFee === 0 ? "Miễn phí" : formatVndAmount(totals.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-app-text-light">
              <span>Thuế ({taxRate}%)</span>
              <span className="text-app-text">{formatVndAmount(totals.tax)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-app-border pt-4 text-base font-bold text-app-green">
              <span>Tổng cộng</span>
              <span>{formatVndAmount(totals.total)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={
              isSubmitting ||
              isRequestingOtp ||
              (paymentMethod === "QR_OTP" && (secondsLeft <= 0 || otpInput.trim().length !== 6))
            }
            className="mt-5 w-full rounded-xl bg-app-green px-5 py-3 font-semibold text-white hover:bg-app-green-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Đang xử lý đơn hàng..."
              : paymentMethod === "QR_OTP"
                ? "Xác nhận mã OTP & Thanh toán"
                : "Đặt hàng (Thanh toán khi nhận)"}
          </button>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
