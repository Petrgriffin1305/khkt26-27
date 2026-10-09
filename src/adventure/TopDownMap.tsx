import { useId, useRef, useState } from "react";
import { mapGeometry, stopIndices as stops } from "./mapGeometry";
import { explorationProgress } from "./exploration";
import type { Journey } from "../../backend/src/adventure/domain";
import "./fog.css";

type Carriage = { id: string; name: string; color: string };
const names = [
  "Ga Khởi đầu",
  "Đồng cỏ Gió",
  "Rừng Sương mù",
  "Đèo Ánh sao",
  "Thành phố Bình minh",
];

export function TopDownMap({
  journey,
  carriages,
  ownId,
  draftSeconds = 0,
  targetSeconds,
}: {
  journey?: Journey;
  carriages: Carriage[];
  ownId: string;
  draftSeconds?: number;
  targetSeconds?: number;
}) {
  const maskId = `exploration-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const { route, distances, total, path, position } = mapGeometry(
    journey?.branch,
  );
  const progress = explorationProgress(journey, draftSeconds, targetSeconds);
  const stage = progress.station;
  const fraction = progress.fraction;
  const distance =
    distances[stops[stage]] +
    (stage < 4
      ? fraction * (distances[stops[stage + 1]] - distances[stops[stage]])
      : 0);
  const engine = position(distance);
  const current =
    carriages.find((car) => car.id === selected) ??
    carriages.find((car) => car.id === ownId) ??
    carriages[0];
  const coast = journey?.branch === "coast";
  function locate() {
    const element = viewport.current;
    if (!element) return;
    element.scrollTo({
      left: (engine.x / 1100) * element.scrollWidth - element.clientWidth / 2,
      top:
        (engine.y / 650) * (element.querySelector("svg")?.clientHeight ?? 0) -
        element.clientHeight / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <section
      className="overhead-map panel"
      aria-label="Bản đồ tiến trình từ trên xuống"
    >
      <div className="overhead-toolbar">
        <div>
          <small>GÓC NHÌN TỪ TRÊN XUỐNG</small>
          <h2>Một đoàn tàu, một hành trình</h2>
        </div>
        <div className="overhead-controls" aria-label="Điều khiển bản đồ">
          <button
            aria-label="Thu nhỏ bản đồ"
            disabled={zoom <= 1}
            onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
          >
            −
          </button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Phóng to bản đồ"
            disabled={zoom >= 2}
            onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
          >
            +
          </button>
          <button onClick={locate}>⌖ Tìm tàu</button>
        </div>
      </div>
      <p className="overhead-hint">
        {carriages.length} toa · 1 đầu tàu · Kéo thanh cuộn để khám phá, chọn
        toa để xem tên.
      </p>
      <div
        className="overhead-viewport"
        ref={viewport}
        tabIndex={0}
        aria-label="Vùng bản đồ có thể cuộn ngang"
      >
        <svg
          className="overhead-world"
          style={{ width: `${zoom * 100}%`, minWidth: 760 * zoom }}
          viewBox="0 0 1100 650"
          role="group"
          aria-label={`Bản đồ khám phá: tàu có ${carriages.length} toa, đang ở ${names[stage]}; vùng chưa tới được phủ sương`}
        >
          <defs>
            <mask id={`${maskId}-route-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="650">
              <rect width="1100" height="650" fill="black" />
              <path d={path} pathLength={total} fill="none" stroke="white" strokeWidth="40"
                strokeLinejoin="round" strokeDasharray={`${distance} ${Math.max(1, total - distance)}`} />
            </mask>
            <radialGradient id={`${maskId}-train-reveal`}>
              <stop offset="0%" stopColor="black" />
              <stop offset="72%" stopColor="black" />
              <stop offset="100%" stopColor="white" />
            </radialGradient>
            <mask id={`${maskId}-fog-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="650">
              <rect width="1100" height="650" fill="white" />
              <path d={path} pathLength={total} fill="none" stroke="black" strokeWidth="132"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={`${distance} ${Math.max(1, total - distance)}`} />
              <path d={path} pathLength={total} fill="none" stroke="black" strokeWidth="176"
                strokeOpacity=".32" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={`${distance} ${Math.max(1, total - distance)}`} />
              <circle cx={engine.x} cy={engine.y} r="112" fill={`url(#${maskId}-train-reveal)`} />
              {stops.slice(0, stage + 1).map((stop) => {
                const [x, y] = route[stop];
                return <circle key={stop} cx={x} cy={y} r="78" fill="black" />;
              })}
            </mask>
          </defs>
          <rect width="1100" height="650" rx="24" fill="#dceac3" />
          <path
            d="M0 65 Q180 -20 350 70 T710 45 L1100 0 V650 H0Z"
            fill="#cce0ab"
          />
          <path
            d="M920 0 Q780 85 910 195 Q1040 255 1000 450 Q970 560 1100 580 V0Z"
            fill="#9bcfd4"
          />
          <path
            d="M934 0 Q798 85 928 195 Q1058 255 1018 450"
            fill="none"
            stroke="#c1e6e7"
            strokeWidth="7"
          />
          <ellipse cx="500" cy="402" rx="108" ry="45" fill="#9bcfd4" />
          <ellipse cx="495" cy="398" rx="86" ry="29" fill="#b4dfdc" />
          <g aria-hidden="true">
            {[
              [115, 140],
              [170, 165],
              [140, 220],
              [220, 95],
              [520, 75],
              [570, 92],
              [630, 62],
              [685, 85],
              [725, 105],
              [410, 215],
              [455, 230],
              [590, 220],
              [665, 265],
              [720, 365],
              [740, 580],
              [665, 600],
              [195, 410],
              [245, 385],
              [130, 560],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <ellipse
                  cx="4"
                  cy="10"
                  rx="22"
                  ry="17"
                  fill="#6d9b65"
                  opacity=".18"
                />
                <circle
                  r={i % 2 ? 20 : 26}
                  fill={i % 3 ? "#79a578" : "#4d8972"}
                />
                <circle cx="-6" cy="-6" r="13" fill="#a0c390" opacity=".7" />
              </g>
            ))}
            {[
              [125, 335],
              [190, 310],
              [95, 285],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path d="M-38 28 L0 -40 L40 28Z" fill="#a8b1a2" />
                <path
                  d="M-13 -17 L0 -40 L15 -14 L2 -19 L-3 -12Z"
                  fill="#f8f5e7"
                />
              </g>
            ))}
            {[
              [925, 230],
              [990, 245],
              [970, 390],
              [910, 405],
              [1040, 355],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <rect
                  x="-20"
                  y="-19"
                  width="40"
                  height="38"
                  rx="5"
                  fill="#f6e6bf"
                />
                <path
                  d="M-24 -6 L0 -26 L24 -6Z"
                  fill={i % 2 ? "#c88468" : "#7b99a1"}
                />
                <rect
                  x="-8"
                  y="4"
                  width="16"
                  height="9"
                  rx="2"
                  fill="#a0b8b5"
                />
              </g>
            ))}
            {Array.from({ length: 25 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${70 + i * 37} ${590 + (i % 3) * 12})`}
              >
                <circle r="4" fill={i % 2 ? "#e5a498" : "#fff5cf"} />
                <circle r="1.5" fill="#d5a348" />
              </g>
            ))}
          </g>
          <g aria-hidden="true">
            <text x="40" y="58" className="overhead-region">
              VIỄN DU · MIỀN BÌNH MINH
            </text>
            <text x="85" y="375" className="overhead-region">
              NÚI MÂY
            </text>
            <text x="470" y="465" className="overhead-region">
              HỒ ÊM
            </text>
            <text
              x="977"
              y="98"
              className="overhead-region"
              transform="rotate(12 977 98)"
            >
              BỜ BIỂN
            </text>
          </g>
          <rect
            className="overhead-exploration-fog"
            width="1100"
            height="650"
            fill="#bdc9b8"
            opacity=".96"
            mask={`url(#${maskId}-fog-mask)`}
            aria-hidden="true"
          />
          <path
            d={path}
            pathLength={total}
            fill="none"
            stroke="#baa88a"
            strokeWidth="23"
            strokeLinejoin="round"
            strokeDasharray={`${distance} ${Math.max(1, total - distance)}`}
          />
          <g mask={`url(#${maskId}-route-mask)`} aria-hidden="true">
            <path
              d={path}
              pathLength={total}
              fill="none"
              stroke="#816f5d"
              strokeWidth="29"
              strokeDasharray="3 13"
              strokeLinejoin="round"
            />
          </g>
          <path
            d={path}
            pathLength={total}
            fill="none"
            stroke="#f3dfb5"
            strokeWidth="17"
            strokeLinejoin="round"
            strokeDasharray={`${distance} ${Math.max(1, total - distance)}`}
          />
          <path
            d={path}
            pathLength={total}
            fill="none"
            stroke="#aac296"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeDasharray={`${distance} ${Math.max(1, total - distance)}`}
          />
          <path
            d={path}
            pathLength={total}
            fill="none"
            stroke="#e4a557"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeDasharray={`${distance} ${Math.max(1, total - distance)}`}
          />
          {stops.slice(0, stage + 1).map((stop, i) => {
            const [x, y] = route[stop];
            return (
              <g
                key={stop}
                aria-label={`${names[i]}: đã khám phá`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r="19"
                  fill="#f6d599"
                  stroke="#ae8147"
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fill="#42564a"
                  fontSize="14"
                  fontWeight="800"
                >
                  {i + 1}
                </text>
                <rect
                  x={x - 86}
                  y={y + 27}
                  width="172"
                  height="30"
                  rx="12"
                  fill="#fcfaf0"
                  opacity=".96"
                />
                <text
                  x={x}
                  y={y + 47}
                  textAnchor="middle"
                  fill="#42564a"
                  fontSize="13"
                  fontWeight="700"
                >{names[i]}</text>
              </g>
            );
          })}
          <g
            transform={`translate(${engine.x} ${engine.y}) rotate(${engine.angle})`}
            aria-label="Đầu tàu"
          >
            <rect
              x="-23"
              y="-15"
              width="46"
              height="34"
              rx="10"
              fill="#526553"
              opacity=".2"
            />
            <rect
              x="-24"
              y="-15"
              width="48"
              height="30"
              rx="9"
              fill="#354f46"
              stroke="#fff4d5"
              strokeWidth="2"
            />
            <rect
              x="-20"
              y="-12"
              width="19"
              height="24"
              rx="4"
              fill="#ebc573"
            />
            <rect x="4" y="-9" width="15" height="18" rx="5" fill="#72a190" />
            <circle cx="12" cy="0" r="5" fill="#344b42" />
            <path d="M25 -8 L30 0 L25 8" fill="#d4aa64" />
          </g>
          {carriages.map((car, i) => {
            const p = position(distance - (i + 1) * 49);
            return (
              <g
                key={car.id}
                transform={`translate(${p.x} ${p.y}) rotate(${p.angle})`}
                role="button"
                tabIndex={0}
                aria-label={`Toa ${i + 1}: ${car.name}${car.id === ownId ? ", của bạn" : ""}`}
                aria-pressed={current?.id === car.id}
                onClick={() => setSelected(car.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(car.id);
                  }
                }}
                className="overhead-car"
              >
                <rect
                  x="-26"
                  y="-3"
                  width="52"
                  height="6"
                  rx="2"
                  fill="#736955"
                />
                <rect
                  x="-21"
                  y="-13"
                  width="43"
                  height="30"
                  rx="7"
                  fill="#526553"
                  opacity=".2"
                />
                <rect
                  x="-22"
                  y="-15"
                  width="44"
                  height="30"
                  rx="7"
                  fill={car.color}
                  stroke={current?.id === car.id ? "#fff3b4" : "#36594a"}
                  strokeWidth={current?.id === car.id ? 4 : 2}
                />
                <rect
                  x="-15"
                  y="-10"
                  width="30"
                  height="20"
                  rx="4"
                  fill="#fff2cc"
                  opacity=".5"
                />
                <text
                  y="5"
                  textAnchor="middle"
                  fill="#263f35"
                  fontWeight="800"
                  fontSize="14"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
          <g transform="translate(1034 555)" aria-hidden="true">
            <circle r="29" fill="#f7f6e9" />
            <path d="M0 -18 L8 10 L0 5 L-8 10Z" fill="#496b59" />
            <text y="-34" textAnchor="middle" fontSize="13" fill="#496b59">
              BẮC
            </text>
          </g>
        </svg>
      </div>
      <div className="overhead-status" aria-live="polite">
        <strong>{names[stage]}</strong>
        <span>
          {stage === 4
            ? "Đã đến đích"
            : `${Math.round(fraction * 100)}% đến trạm kế tiếp`}
        </span>
        <span>Ngã rẽ: {coast ? "Bờ biển" : "Qua núi"}</span>
      </div>
      <div className="overhead-exploration-progress">
        <div>
          <strong>Tiến độ khám phá</strong>
          <span>Đã mở {stage + 1}/5 trạm</span>
        </div>
        <progress
          value={Math.min(4, stage + fraction)}
          max={4}
          aria-label="Tiến độ khám phá hành trình"
          aria-valuetext={`${stage + 1} trên 5 trạm đã mở${stage < 4 ? `, ${Math.round(fraction * 100)} phần trăm tới trạm kế tiếp` : ""}`}
        />
        <small>{stage === 4 ? "Toàn bộ tuyến đường đã được khám phá." : "Tuyến và cảnh quan phía trước vẫn được che bởi sương."}</small>
      </div>
      <div className="overhead-carriages" aria-label="Danh sách toa tàu">
        {carriages.map((car, i) => (
          <button
            key={car.id}
            aria-pressed={current?.id === car.id}
            onClick={() => setSelected(car.id)}
          >
            <i style={{ background: car.color }} />
            Toa {i + 1}
            {car.id === ownId ? " · Bạn" : ""}
          </button>
        ))}
      </div>
      {current && (
        <p className="overhead-selected">
          ▣ <strong>{current.name}</strong>
          {current.id === ownId ? " · Toa của bạn" : " · Thành viên đoàn"}
          <span>
            Vị trí toa {carriages.indexOf(current) + 1} / {carriages.length}
          </span>
        </p>
      )}
      {draftSeconds > 0 && (
        <p className="overhead-hint">
          Vị trí gồm thời gian học của phiên này; tiến độ chính thức được lưu
          khi kết thúc phiên.
        </p>
      )}
      <div className="overhead-legend">
        <span><i className="fog-legend-known" /> Vùng đã khám phá</span>
        <span><i className="fog-legend-hidden" /> Sương che vùng chưa tới</span>
        <span><i className="fog-legend-route" /> Tuyến đã đi</span>
      </div>
    </section>
  );
}
