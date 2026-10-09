export function DurationPicker({
  value,
  onChange,
  breakCount = 0,
  breakMinutes = 5,
  onBreakCountChange,
  onBreakMinutesChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
  breakCount?: number;
  breakMinutes?: number;
  onBreakCountChange?: (count: number) => void;
  onBreakMinutesChange?: (minutes: number) => void;
}) {
  return (
    <div className="duration-picker">
      <div className="quick-times" aria-label="Thời gian gợi ý">
        {[15, 25, 45, 60].map((minutes) => (
          <button
            key={minutes}
            aria-pressed={value === minutes}
            className={value === minutes ? "selected" : ""}
            onClick={() => onChange(minutes)}
          >
            {minutes} phút
          </button>
        ))}
      </div>
      <label className="custom-duration">
        Thời gian tùy chỉnh
        <span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            step={1}
            value={Number.isNaN(value) ? "" : value}
            onChange={(e) =>
              onChange(e.target.value === "" ? NaN : Number(e.target.value))
            }
            aria-describedby="duration-help"
          />
          <span>phút</span>
        </span>
      </label>
      <small id="duration-help">
        Nhập từ 1 đến 240 phút, theo nhịp học của bạn.
      </small>
      {onBreakCountChange && onBreakMinutesChange && <fieldset className="break-picker">
        <legend>Trạm dừng chân giữa giờ</legend>
        <label>Số lượt giải lao<input type="number" min={0} max={Math.max(0,Math.min(10,(Number.isFinite(value) ? Math.floor(value) : 1)-1))} step={1} value={Number.isNaN(breakCount) ? "" : breakCount} onChange={(e) => onBreakCountChange(e.target.value === "" ? NaN : Number(e.target.value))} /></label>
        <label>Phút mỗi lượt<input type="number" min={1} max={30} step={1} disabled={breakCount === 0} value={Number.isNaN(breakMinutes) ? "" : breakMinutes} onChange={(e) => onBreakMinutesChange(e.target.value === "" ? NaN : Number(e.target.value))} /></label>
        <small>Chọn 0 để học liền. Các trạm được chia đều tự động; giải lao không cộng XP và không bị tính xao nhãng. Rời phiên ngoài lịch nghỉ vẫn tính xao nhãng.</small>
        {Number.isInteger(breakCount) && (breakCount === 0 || Number.isInteger(breakMinutes)) && <p>{value} phút học + {breakCount === 0 ? 0 : breakCount * breakMinutes} phút giải lao · tổng {value + (breakCount === 0 ? 0 : breakCount * breakMinutes)} phút.</p>}
        {(!Number.isInteger(breakCount) || breakCount < 0 || breakCount > 10 || breakCount >= value || (breakCount !== 0 && (!Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 30))) && <p className="duration-error" role="alert">Chọn 0–10 lượt, ít hơn số phút học; mỗi lượt 1–30 phút.</p>}
      </fieldset>}
      {(!Number.isInteger(value) || value < 1 || value > 240) && (
        <p role="alert" className="duration-error">
          Vui lòng nhập số phút nguyên từ 1 đến 240.
        </p>
      )}
    </div>
  );
}
