export function DurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
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
      {(!Number.isInteger(value) || value < 1 || value > 240) && (
        <p role="alert" className="duration-error">
          Vui lòng nhập số phút nguyên từ 1 đến 240.
        </p>
      )}
    </div>
  );
}
