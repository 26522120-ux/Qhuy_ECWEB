import { useEffect, useState } from "react";
import { ArrowRight, Flame, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const PROMO_STORAGE_KEY = "nutrago_whey_promo_dismissed";
const TARGET_PRODUCT_ID = "gym_prod_giant_whey";

export default function WheyPromoModal() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !window.sessionStorage.getItem(PROMO_STORAGE_KEY);
  });

  const isHiddenRoute =
    location.pathname === "/login" || location.pathname.startsWith("/admin");

  const dismiss = () => {
    setIsOpen(false);
    try {
      window.sessionStorage.setItem(PROMO_STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (!isOpen || isHiddenRoute) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isHiddenRoute]);

  if (!isOpen || isHiddenRoute) return null;

  const handleClaimOffer = () => {
    dismiss();
    navigate(`/products/${TARGET_PRODUCT_ID}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whey-promo-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={dismiss}
    >
      <div
        className="relative grid w-full max-w-2xl overflow-hidden rounded-xs border border-[#b8f927]/50 bg-[#111513] text-white shadow-[0_25px_80px_-15px_rgba(184,249,39,0.25)] md:grid-cols-[1fr_1.05fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng ưu đãi"
          className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-xs border border-white/15 bg-black/70 text-zinc-300 transition hover:border-[#b8f927] hover:text-[#b8f927]"
        >
          <X size={16} />
        </button>

        <div className="relative aspect-[4/4.2] w-full bg-[#0b0d0c] md:aspect-auto md:min-h-[420px]">
          <img
            src="/whey-promo-popup.jpg"
            alt="GIANT Performance Whey Protein - Cookies & Cream"
            className="h-full w-full object-cover object-top"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-xs bg-red-600 px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase shadow-md">
            <Flame size={12} />
            GIẢM SỐC -25%
          </span>
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-7">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#b8f927] uppercase">
              // ƯU ĐÃI ĐỘC QUYỀN nutraGO
            </p>
            <h2
              id="whey-promo-title"
              className="mt-2 font-display text-3xl leading-none font-black tracking-tight text-white uppercase sm:text-4xl"
            >
              GIANT PERFORMANCE{" "}
              <span className="text-[#b8f927]">WHEY</span>
            </h2>
            <p className="mt-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Cookies &amp; Cream &bull; 26g Protein &bull; 55 Servings
            </p>

            <p className="mt-4 text-xs leading-6 text-zinc-300 sm:text-sm">
              Ultra Premium Whey Protein hấp thụ siêu nhanh, chỉ 130 kcal mỗi
              muỗng giúp phát triển cơ bắp nạc tối đa.
            </p>

            <div className="mt-5 rounded-xs border border-[#b8f927]/30 bg-[#0b0d0c] p-3.5">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-3xl font-black text-[#b8f927]">
                  1.380.000 ₫
                </span>
                <span className="text-xs text-zinc-500 line-through">
                  1.845.000 ₫
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold tracking-wider text-zinc-200 uppercase">
                Tặng kèm bình lắc thể thao &amp; Freeship toàn quốc
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleClaimOffer}
              className="flex w-full items-center justify-center gap-2 rounded-xs bg-[#b8f927] px-5 py-3.5 text-xs font-extrabold tracking-wider text-black uppercase shadow-[0_0_25px_rgba(184,249,39,0.28)] transition hover:bg-[#c9ff4d]"
            >
              <span>NHẬN ƯU ĐÃI &amp; XEM SẢN PHẨM</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-1.5 text-center text-xs font-semibold text-zinc-400 transition hover:text-white"
            >
              Để sau, tiếp tục xem trang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
