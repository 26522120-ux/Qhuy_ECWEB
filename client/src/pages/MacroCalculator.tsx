import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Plus,
  RotateCcw,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  calculateMacrosAndRecommend,
  type MacroActivityLevel,
  type MacroGender,
  type MacroGoal,
  type MacroRecommendationResponse,
} from "../api";
import { useCart } from "../context/CartContext";
import { formatUnitVi, formatVnd, getProductNameVi } from "../localization";

const ACTIVITY_OPTIONS: Array<{
  value: MacroActivityLevel;
  label: string;
  hint: string;
}> = [
  { value: "sedentary", label: "Ít vận động", hint: "Ngồi văn phòng, ít đi lại hoặc chưa tập luyện" },
  { value: "light", label: "Vận động nhẹ", hint: "Đi bộ hoặc tập nhẹ 1–3 buổi mỗi tuần" },
  { value: "moderate", label: "Vận động vừa", hint: "Tập gym, chạy bộ hoặc thể thao 3–5 buổi/tuần" },
  { value: "active", label: "Vận động nặng", hint: "Tập luyện cường độ cao 6–7 buổi/tuần" },
  { value: "very_active", label: "Cường độ rất cao", hint: "Vận động viên hoặc tập 2 buổi/ngày" },
];

const GOAL_OPTIONS: Array<{ value: MacroGoal; label: string; desc: string }> = [
  {
    value: "cut",
    label: "Siết mỡ — Giảm cân sạch",
    desc: "Thâm hụt khoảng 450 kcal/ngày, ưu tiên giữ cơ và giàu đạm",
  },
  {
    value: "maintain",
    label: "Giữ dáng — Cân bằng năng lượng",
    desc: "Giữ mức calo bằng TDEE để duy trì thể lực và vóc dáng ổn định",
  },
  {
    value: "bulk",
    label: "Tăng cơ — Nạp năng lượng",
    desc: "Thặng dư khoảng 350 kcal/ngày giúp phục hồi và phát triển cơ bắp",
  },
];

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "Giới tính",
  "Chỉ số cơ thể",
  "Mức vận động",
  "Mục tiêu",
  "Số bữa/ngày",
];

const MacroCalculator = () => {
  const { addItem } = useCart();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<MacroGender>("male");
  const [age, setAge] = useState("24");
  const [weightKg, setWeightKg] = useState("68");
  const [heightCm, setHeightCm] = useState("172");
  const [activityLevel, setActivityLevel] = useState<MacroActivityLevel>("moderate");
  const [goal, setGoal] = useState<MacroGoal>("cut");
  const [mealsPerDay, setMealsPerDay] = useState(3);

  const [result, setResult] = useState<MacroRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateBodyMetrics = () => {
    const parsedAge = Number(age);
    const parsedWeight = Number(weightKg);
    const parsedHeight = Number(heightCm);

    if (
      !Number.isFinite(parsedAge) ||
      parsedAge < 14 ||
      parsedAge > 90 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 30 ||
      parsedWeight > 250 ||
      !Number.isFinite(parsedHeight) ||
      parsedHeight < 120 ||
      parsedHeight > 230
    ) {
      toast.error(
        "Bạn kiểm tra lại giúp mình: tuổi (14–90), cân nặng (30–250kg) và chiều cao (120–230cm) nhé!",
      );
      return null;
    }

    return {
      age: Math.round(parsedAge),
      weightKg: parsedWeight,
      heightCm: parsedHeight,
    };
  };

  const handleNextStep = () => {
    if (step === 2 && !validateBodyMetrics()) return;
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleCalculate = async () => {
    const metrics = validateBodyMetrics();
    if (!metrics) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    try {
      const data = await calculateMacrosAndRecommend({
        gender,
        age: metrics.age,
        weightKg: metrics.weightKg,
        heightCm: metrics.heightCm,
        activityLevel,
        goal,
        mealsPerDay,
      });
      setResult(data);
      toast.success("Đã xong! Dưới đây là thực đơn Macro dành riêng cho bạn.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tính macro lúc này.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(1);
  };

  const summary = result?.summary;
  const totalMacroCalories = summary
    ? summary.proteinG * 4 + summary.carbsG * 4 + summary.fatG * 9
    : 1;
  const proteinPct = summary
    ? Math.round(((summary.proteinG * 4) / totalMacroCalories) * 100)
    : 0;
  const carbsPct = summary
    ? Math.round(((summary.carbsG * 4) / totalMacroCalories) * 100)
    : 0;
  const fatPct = summary ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  const progressPercent = result ? 100 : Math.round((step / TOTAL_STEPS) * 100);

  return (
    <main className="min-h-screen bg-[#0b0d0c] text-white">
      <div className="mx-auto max-w-5xl px-3.5 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* HEADER */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#b8f927] uppercase sm:text-xs">
              // TRỢ LÝ DINH DƯỠNG nutraGO
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
              TÍNH MACRO &amp; GỢI Ý MÓN ĂN
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Trả lời nhanh {TOTAL_STEPS} câu hỏi nhỏ để tụi mình tính chuẩn lượng Calo,
              Protein – Carbs – Fat và chọn sẵn món Healthy Meal hợp với bạn nhất.
            </p>
          </div>
          <Link
            to="/products?category=healthy-meal"
            className="inline-flex items-center gap-2 rounded-xs border border-white/15 bg-[#111513] px-4 py-2.5 text-xs font-bold tracking-wider text-zinc-200 uppercase hover:border-[#b8f927]/50 hover:text-[#b8f927]"
          >
            <Utensils size={14} />
            Xem thực đơn Healthy Meal
          </Link>
        </div>

        {/* THANH TIẾN TRÌNH */}
        <div className="mb-6 rounded-xs border border-white/10 bg-[#111513] p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wider text-[#b8f927] uppercase">
              {result ? "Hoàn tất phân tích" : `Bước ${step} / ${TOTAL_STEPS}: ${STEP_TITLES[step - 1]}`}
            </span>
            <span className="font-semibold text-zinc-400">{progressPercent}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-[#b8f927] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-3 hidden grid-cols-5 gap-2 sm:grid">
            {STEP_TITLES.map((title, idx) => {
              const stepNum = idx + 1;
              const isDone = Boolean(result) || step > stepNum;
              const isCurrent = !result && step === stepNum;
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    if (result) setResult(null);
                    setStep(stepNum);
                  }}
                  className={`flex items-center gap-1.5 rounded-xs border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
                    isCurrent
                      ? "border-[#b8f927] bg-[#b8f927]/15 text-[#b8f927]"
                      : isDone
                        ? "border-white/15 bg-[#0b0d0c] text-zinc-200 hover:border-white/30"
                        : "border-white/5 bg-[#0b0d0c]/60 text-zinc-500"
                  }`}
                >
                  <span className="font-black">{stepNum}.</span>
                  <span className="truncate">{title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WIZARD TỪNG BƯỚC KÈM CÂU HỎI */}
        {!result ? (
          <section className="rounded-xs border border-white/10 bg-[#111513] p-5 sm:p-8">
            {step === 1 && (
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Câu hỏi 1 / {TOTAL_STEPS}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Chào bạn! Để tính chuẩn tỷ lệ trao đổi chất (BMR), bạn cho mình biết giới tính nhé?
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Cơ thể nam và nữ có mức tiêu hao năng lượng nền khác nhau một chút, chọn đúng sẽ giúp kết quả chính xác hơn.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "male",
                        label: "Nam",
                        desc: "Công thức Mifflin-St Jeor chuẩn cho nam giới",
                      },
                      {
                        value: "female",
                        label: "Nữ",
                        desc: "Công thức Mifflin-St Jeor chuẩn cho nữ giới",
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGender(item.value)}
                      className={`flex items-center justify-between rounded-xs border p-4 text-left transition sm:p-5 ${
                        gender === item.value
                          ? "border-[#b8f927] bg-[#b8f927]/12 text-white"
                          : "border-white/10 bg-[#0b0d0c] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <div>
                        <p className="font-display text-xl font-black uppercase">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
                      </div>
                      <CheckCircle2
                        size={20}
                        className={
                          gender === item.value ? "text-[#b8f927]" : "text-zinc-700"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Câu hỏi 2 / {TOTAL_STEPS}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Các chỉ số cơ thể hiện tại của bạn thế nào?
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Chỉ cần ước lượng gần đúng tuổi, cân nặng và chiều cao hiện tại của bạn thôi nhé.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block rounded-xs border border-white/10 bg-[#0b0d0c] p-4">
                    <span className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                      Tuổi của bạn
                    </span>
                    <input
                      type="number"
                      min={14}
                      max={90}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="mt-2 w-full rounded-xs border border-white/15 bg-[#111513] px-3 py-2.5 text-lg font-bold text-white focus:border-[#b8f927]"
                    />
                    <span className="mt-1.5 block text-[11px] text-zinc-500">
                      Từ 14 đến 90 tuổi
                    </span>
                  </label>

                  <label className="block rounded-xs border border-white/10 bg-[#0b0d0c] p-4">
                    <span className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                      Cân nặng (kg)
                    </span>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="mt-2 w-full rounded-xs border border-white/15 bg-[#111513] px-3 py-2.5 text-lg font-bold text-white focus:border-[#b8f927]"
                    />
                    <span className="mt-1.5 block text-[11px] text-zinc-500">
                      Ví dụ: 68 kg
                    </span>
                  </label>

                  <label className="block rounded-xs border border-white/10 bg-[#0b0d0c] p-4">
                    <span className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                      Chiều cao (cm)
                    </span>
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="mt-2 w-full rounded-xs border border-white/15 bg-[#111513] px-3 py-2.5 text-lg font-bold text-white focus:border-[#b8f927]"
                    />
                    <span className="mt-1.5 block text-[11px] text-zinc-500">
                      Ví dụ: 172 cm
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Câu hỏi 3 / {TOTAL_STEPS}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Trong một tuần bình thường, bạn vận động nhiều cỡ nào?
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Chọn mức gần giống lịch sinh hoạt &amp; tập luyện của bạn nhất để tụi mình tính TDEE chuẩn xác.
                </p>

                <div className="mt-5 space-y-2.5">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityLevel(opt.value)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xs border p-3.5 text-left transition sm:p-4 ${
                        activityLevel === opt.value
                          ? "border-[#b8f927] bg-[#b8f927]/12 text-white"
                          : "border-white/10 bg-[#0b0d0c] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-extrabold text-white">{opt.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{opt.hint}</p>
                      </div>
                      <CheckCircle2
                        size={18}
                        className={`shrink-0 ${
                          activityLevel === opt.value ? "text-[#b8f927]" : "text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Câu hỏi 4 / {TOTAL_STEPS}
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Mục tiêu lớn nhất của bạn lúc này là gì?
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Dựa vào mục tiêu này, tụi mình sẽ điều chỉnh mức Calo và tỷ lệ Đạm – Tinh bột – Chất béo phù hợp nhất.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {GOAL_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGoal(item.value)}
                      className={`flex flex-col justify-between rounded-xs border p-4 text-left transition ${
                        goal === item.value
                          ? "border-[#b8f927] bg-[#b8f927]/12 text-white"
                          : "border-white/10 bg-[#0b0d0c] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <div>
                        <p
                          className={`font-display text-lg font-black uppercase ${
                            goal === item.value ? "text-[#b8f927]" : "text-white"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                          {item.desc}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <CheckCircle2
                          size={18}
                          className={goal === item.value ? "text-[#b8f927]" : "text-zinc-700"}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <p className="text-xs font-bold tracking-wider text-[#b8f927] uppercase">
                  Câu hỏi cuối ({TOTAL_STEPS} / {TOTAL_STEPS})
                </p>
                <h2 className="mt-2 font-display text-2xl font-black text-white uppercase sm:text-3xl">
                  Bạn muốn chia thành mấy bữa mỗi ngày để dễ theo dõi?
                </h2>
                <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                  Tụi mình sẽ chia đều lượng Macro mỗi bữa và tìm các phần Healthy Meal hợp khẩu phần của bạn.
                </p>

                <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMealsPerDay(num)}
                      className={`rounded-xs border py-4 text-center transition ${
                        mealsPerDay === num
                          ? "border-[#b8f927] bg-[#b8f927] text-black"
                          : "border-white/10 bg-[#0b0d0c] text-white hover:border-white/25"
                      }`}
                    >
                      <span className="block font-display text-2xl font-black">{num}</span>
                      <span className="text-[10px] font-bold uppercase">Bữa</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xs border border-white/10 bg-[#0b0d0c] p-4 text-xs text-zinc-300">
                  <p className="font-bold tracking-wider text-[#b8f927] uppercase">
                    Tóm tắt hồ sơ bạn vừa chọn:
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    {gender === "male" ? "Nam" : "Nữ"}, {age} tuổi • {weightKg} kg •{" "}
                    {heightCm} cm •{" "}
                    {ACTIVITY_OPTIONS.find((a) => a.value === activityLevel)?.label} •{" "}
                    {GOAL_OPTIONS.find((g) => g.value === goal)?.label} • {mealsPerDay} bữa/ngày
                  </p>
                </div>
              </div>
            )}

            {/* NÚT ĐIỀU HƯỚNG BƯỚC */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                disabled={step === 1}
                onClick={handlePrevStep}
                className="inline-flex items-center gap-2 rounded-xs border border-white/15 bg-[#0b0d0c] px-4 py-2.5 text-xs font-bold tracking-wider text-zinc-200 uppercase transition hover:border-white/35 disabled:opacity-35"
              >
                <ArrowLeft size={15} />
                Quay lại
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase transition hover:bg-[#cbff4d]"
                >
                  Tiếp tục
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleCalculate()}
                  className="inline-flex items-center gap-2 rounded-xs bg-[#b8f927] px-6 py-3 text-xs font-black tracking-wider text-[#08100a] uppercase transition hover:bg-[#cbff4d] disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  {isLoading ? "Đang tính & gợi ý..." : "Xem kết quả & Gợi ý món"}
                </button>
              )}
            </div>
          </section>
        ) : (
          /* KẾT QUẢ MACRO + GỢI Ý HEALTHY MEAL */
          <div className="space-y-6">
            {summary && (
              <section className="rounded-xs border border-white/10 bg-[#111513] p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Flame size={18} className="text-[#b8f927]" />
                    <h2 className="font-display text-xl font-black tracking-wide text-white uppercase sm:text-2xl">
                      Chỉ số Macro dành riêng cho bạn
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xs border border-[#b8f927]/30 bg-[#b8f927]/10 px-2.5 py-1 text-[11px] font-bold text-[#b8f927]">
                      ~{summary.perMeal.calories} kcal / bữa ({summary.mealsPerDay} bữa/ngày)
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 rounded-xs border border-white/15 bg-[#0b0d0c] px-3 py-1.5 text-[11px] font-bold text-zinc-200 uppercase hover:border-[#b8f927] hover:text-[#b8f927]"
                    >
                      <RotateCcw size={13} />
                      Tính lại
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xs border border-white/10 bg-[#0b0d0c] p-3">
                    <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      BMR (Cơ bản)
                    </p>
                    <p className="mt-1 font-display text-2xl font-black text-white">
                      {summary.bmr}
                    </p>
                    <p className="text-[11px] text-zinc-500">kcal / ngày</p>
                  </div>
                  <div className="rounded-xs border border-white/10 bg-[#0b0d0c] p-3">
                    <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      TDEE (Tiêu hao)
                    </p>
                    <p className="mt-1 font-display text-2xl font-black text-white">
                      {summary.tdee}
                    </p>
                    <p className="text-[11px] text-zinc-500">kcal / ngày</p>
                  </div>
                  <div className="col-span-2 rounded-xs border border-[#b8f927]/40 bg-[#b8f927]/10 p-3">
                    <p className="text-[10px] font-bold tracking-wider text-[#b8f927] uppercase">
                      Mục tiêu nạp mỗi ngày
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-black text-[#b8f927]">
                        {summary.targetCalories}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">kcal / ngày</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="rounded-xs border border-white/10 bg-[#0b0d0c] p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#b8f927] uppercase">
                      <span>Protein</span>
                      <span>{proteinPct}%</span>
                    </div>
                    <p className="mt-1 font-display text-2xl font-black text-white">
                      {summary.proteinG}g
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      ~{summary.perMeal.proteinG}g / bữa
                    </p>
                  </div>

                  <div className="rounded-xs border border-white/10 bg-[#0b0d0c] p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 uppercase">
                      <span>Carbs</span>
                      <span>{carbsPct}%</span>
                    </div>
                    <p className="mt-1 font-display text-2xl font-black text-white">
                      {summary.carbsG}g
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      ~{summary.perMeal.carbsG}g / bữa
                    </p>
                  </div>

                  <div className="rounded-xs border border-white/10 bg-[#0b0d0c] p-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase">
                      <span>Fat</span>
                      <span>{fatPct}%</span>
                    </div>
                    <p className="mt-1 font-display text-2xl font-black text-white">
                      {summary.fatG}g
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      ~{summary.perMeal.fatG}g / bữa
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* GỢI Ý MÓN HEALTHY MEAL TỪ API */}
            <section className="rounded-xs border border-white/10 bg-[#111513] p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#b8f927]" />
                  <h2 className="font-display text-xl font-black tracking-wide text-white uppercase">
                    Gợi ý món Healthy Meal hợp với bạn nhất
                  </h2>
                </div>
                <span className="text-xs text-zinc-400">
                  {result.recommendations.length} món sẵn sàng giao
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {result.recommendations.map(({ product, macros, matchScore, reason }) => (
                  <article
                    key={product._id}
                    className="flex flex-col justify-between rounded-xs border border-zinc-800 bg-[#0b0d0c] p-3.5 transition hover:border-[#b8f927]/60"
                  >
                    <div>
                      <div className="flex gap-3">
                        <Link
                          to={`/products/${product._id}`}
                          className="size-20 shrink-0 overflow-hidden rounded-xs border border-white/10 bg-[#141816]"
                        >
                          <img
                            src={product.image}
                            alt={getProductNameVi(product)}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-xs bg-[#b8f927] px-2 py-0.5 text-[10px] font-black text-black">
                              PHÙ HỢP {matchScore}%
                            </span>
                            <span className="rounded-xs border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                              {macros.calories} kcal
                            </span>
                          </div>

                          <Link
                            to={`/products/${product._id}`}
                            className="mt-1.5 block text-sm font-bold leading-snug break-words text-white hover:text-[#b8f927]"
                          >
                            {getProductNameVi(product)}
                          </Link>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-zinc-400">
                        {reason}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px]">
                        <div className="rounded-xs border border-white/10 bg-[#111513] py-1.5">
                          <span className="font-bold text-[#b8f927]">{macros.proteinG}g</span>{" "}
                          <span className="text-zinc-400">Đạm</span>
                        </div>
                        <div className="rounded-xs border border-white/10 bg-[#111513] py-1.5">
                          <span className="font-bold text-sky-400">{macros.carbsG}g</span>{" "}
                          <span className="text-zinc-400">Carbs</span>
                        </div>
                        <div className="rounded-xs border border-white/10 bg-[#111513] py-1.5">
                          <span className="font-bold text-amber-400">{macros.fatG}g</span>{" "}
                          <span className="text-zinc-400">Fat</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <div>
                        <p className="font-display text-lg font-black text-[#b8f927]">
                          {formatVnd(product.price)}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          /{formatUnitVi(product.unit)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addItem(product, 1)}
                        className="inline-flex items-center gap-1.5 rounded-xs bg-[#b8f927] px-3 py-2 text-[11px] font-extrabold text-black uppercase transition hover:bg-[#cbff4d]"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default MacroCalculator;
