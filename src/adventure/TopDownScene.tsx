import { useEffect, useId, useRef, useState } from "react";
import { cloudScaleAtProgress } from "./exploration";
import { CartoonCloud } from "./CartoonCloud";
import "./fog.css";

type Carriage = { id: string; name: string; color: string };
const sceneClouds = [
  { x: 72, y: 78, clearsAt: 0.2, size: 0.76, angle: -2, variant: 0 },
  { x: 270, y: 111, clearsAt: 0.3, size: 0.72, angle: 1, variant: 1 },
  { x: 478, y: 75, clearsAt: 0.4, size: 0.79, angle: 2, variant: 2 },
  { x: 705, y: 108, clearsAt: 0.5, size: 0.73, angle: -1, variant: 0 },
  { x: 875, y: 74, clearsAt: 0.6, size: 0.77, angle: 2, variant: 1 },
  { x: 150, y: 330, clearsAt: 0.7, size: 0.72, angle: 1, variant: 2 },
  { x: 384, y: 345, clearsAt: 0.8, size: 0.78, angle: -2, variant: 0 },
  { x: 632, y: 324, clearsAt: 0.9, size: 0.74, angle: 2, variant: 1 },
  { x: 850, y: 342, clearsAt: 1, size: 0.77, angle: -1, variant: 2 },
];

export function TopDownScene({
  carriages,
  ownId,
  running,
  fogStrength,
  exploration = 0,
  coast = false,
}: {
  carriages: Carriage[];
  ownId: string;
  running: boolean;
  fogStrength: number;
  exploration?: number;
  coast?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const element = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(ownId);
  useEffect(() => {
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (element.current) observer.observe(element.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const engineX = 450 + carriages.length * 32;
  const chosen = carriages.find((car) => car.id === selected) ?? carriages[0];
  const moving = running && visible;
  return (
    <section
      ref={element}
      className="travel-scene"
      aria-label="Cảnh tàu 2D nhìn thẳng từ trên xuống"
      data-moving={moving}
    >
      <div className="travel-toolbar">
        <span>1 đầu tàu · {carriages.length} toa · Tàu giữ vị trí giữa khung hình</span>
        <div className="overhead-controls">
          <button aria-label="Thu nhỏ cảnh 2D" disabled={zoom <= 1} onClick={() => setZoom((v) => Math.max(1, v - 0.25))}>
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button aria-label="Phóng to cảnh 2D" disabled={zoom >= 1.5} onClick={() => setZoom((v) => Math.min(1.5, v + 0.25))}>
            +
          </button>
        </div>
      </div>
      <svg
        className="travel-world"
        viewBox={`${450 - 450 / zoom} ${210 - 210 / zoom} ${900 / zoom} ${420 / zoom}`}
        role="group"
        aria-label={`Góc nhìn 2D: ${carriages.length} toa, ${running ? "cảnh vật đang trôi quanh tàu" : "cảnh vật đang dừng"}`}
      >
        <defs>
          <pattern id={`${id}-sleepers`} width="30" height="50" patternUnits="userSpaceOnUse">
            <rect x="3" y="2" width="8" height="46" rx="3" fill="#9a8b70" />
          </pattern>
        </defs>
        <rect width="900" height="420" fill={coast ? "#dbeacb" : "#dce9c7"} />
        <g className="travel-landscape" aria-hidden="true">
          {[0, 900].map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              <path d="M0 0 H900 V135 Q780 85 665 126 T440 100 T200 123 T0 95Z" fill="#c8dda9" />
              {coast ? (
                <>
                  <path d="M0 320 Q160 270 330 332 T630 300 T900 322 V420 H0Z" fill="#92cdd3" />
                  <path d="M0 321 Q160 271 330 333 T630 301 T900 323" fill="none" stroke="#f8efcf" strokeWidth="12" />
                </>
              ) : (
                <>
                  <ellipse cx="690" cy="325" rx="132" ry="58" fill="#99ced1" />
                  <ellipse cx="684" cy="317" rx="109" ry="40" fill="#b6ddda" />
                  <path d="M60 118 L118 22 L178 118Z M170 125 L225 40 L282 125Z" fill="#adb9a2" />
                  <path d="M95 60 L118 22 L143 63 L119 54Z" fill="#f9f6e8" />
                </>
              )}
              {Array.from({ length: 18 }, (_, i) => (
                <g key={i} transform={`translate(${35 + (i * 97) % 870} ${i % 2 ? 280 + (i % 4) * 23 : 45 + (i % 4) * 20})`}>
                  <ellipse cx="4" cy="10" rx="23" ry="18" fill="#4c7c60" opacity=".16" />
                  <circle r={i % 3 ? 22 : 30} fill={i % 3 ? "#79a777" : "#4e8b70"} />
                  <circle cx="-7" cy="-7" r="13" fill="#aecb8d" opacity=".7" />
                </g>
              ))}
              {[360, 445, 805].map((x, i) => (
                <g key={x} transform={`translate(${x} ${i === 1 ? 330 : 100})`}>
                  <rect x="-23" y="-24" width="46" height="44" rx="5" fill="#f4dfac" />
                  <path d="M-30 -12 L0 -34 L30 -12Z" fill={i % 2 ? "#78959a" : "#c78565"} />
                  <rect x="-8" y="0" width="16" height="13" rx="3" fill="#91afa9" />
                </g>
              ))}
              {Array.from({ length: 25 }, (_, i) => (
                <g key={i} transform={`translate(${12 + i * 36} ${i % 2 ? 155 : 252})`}>
                  <circle r="4" fill={i % 3 ? "#fff2ce" : "#e6a19b"} />
                  <circle r="1.5" fill="#cfaa59" />
                </g>
              ))}
            </g>
          ))}
        </g>
        <rect y="183" width="900" height="54" rx="8" fill="#c3ad88" />
        <g className="travel-track" aria-hidden="true">
          <rect x="0" y="184" width="1800" height="52" fill={`url(#${id}-sleepers)`} />
        </g>
        <path d="M0 193 H900 M0 227 H900" stroke="#716b60" strokeWidth="6" />
        <path d="M0 192 H900 M0 226 H900" stroke="#eee2c5" strokeWidth="2" />
        <g className="travel-landscape travel-cloud-cover" aria-hidden="true" pointerEvents="none">
          {[0, 900].map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              {sceneClouds.map((cloud, index) => (
                <g key={index} transform={`translate(${cloud.x} ${cloud.y}) rotate(${cloud.angle})`}>
                  <CartoonCloud
                    scale={cloud.size * cloudScaleAtProgress(exploration, cloud.clearsAt, 0.16)}
                    variant={cloud.variant}
                  />
                </g>
              ))}
            </g>
          ))}
        </g>
        <g className="travel-train" aria-label="Đoàn tàu cố định">
          <g transform={`translate(${engineX} 210)`} aria-label="Đầu tàu">
            <rect x="-32" y="-23" width="72" height="48" rx="13" fill="#456456" opacity=".18" />
            <rect x="-32" y="-22" width="68" height="44" rx="10" fill="#33564a" stroke="#fff1ca" strokeWidth="3" />
            <rect x="-27" y="-17" width="25" height="34" rx="5" fill="#dfb961" />
            <rect x="4" y="-15" width="24" height="30" rx="10" fill="#6f9c86" />
            <circle cx="17" r="7" fill="#31493d" />
            <path d="M36 -12 L45 0 L36 12Z" fill="#cfa35d" />
          </g>
          {carriages.map((car, i) => (
            <g
              key={car.id}
              transform={`translate(${engineX - (i + 1) * 64} 210)`}
              role="button"
              tabIndex={0}
              aria-label={`Toa ${i + 1}: ${car.name}${car.id === ownId ? ", của bạn" : ""}`}
              aria-pressed={chosen?.id === car.id}
              onClick={() => setSelected(car.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(car.id);
                }
              }}
              className="overhead-car"
            >
              <rect x="-35" y="-4" width="70" height="8" rx="3" fill="#82705b" />
              <rect x="-27" y="-21" width="58" height="46" rx="10" fill="#456456" opacity=".18" />
              <rect x="-29" y="-22" width="58" height="44" rx="9" fill={car.color} stroke={chosen?.id === car.id ? "#fff2b6" : "#456557"} strokeWidth={chosen?.id === car.id ? 4 : 2} />
              <rect x="-21" y="-15" width="42" height="30" rx="6" fill="#fff0ca" opacity=".6" />
              <text y="6" textAnchor="middle" fill="#294638" fontSize="17" fontWeight="800">{i + 1}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="travel-caption">
        <span>{chosen?.name} · {carriages.length} toa</span>
        <span>
          {fogStrength > 0.25
            ? "☁ Toa đang chờ bạn quay lại"
            : exploration >= 1
              ? "Đã khám phá toàn tuyến"
              : running
                ? "☁ Mỗi phút học mở thêm một vùng đất"
                : "Cảnh dừng · tiến độ đã học được giữ."}
        </span>
      </div>
    </section>
  );
}
