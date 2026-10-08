import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SceneFallback } from "./SceneFallback";
import type { SceneController, SceneOptions } from "./scene3d";
export function Scene({
  color = "#398575",
  fog = false,
  compact = false,
  decor = "plant",
  station = 0,
  branch = "mountain",
  calm = false,
  running = true,
  fogStrength = fog ? 1 : 0,
  revealRadius,
}: Partial<SceneOptions> & { compact?: boolean; running?: boolean; revealRadius?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SceneController | null>(null);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let disposed = false;
    const element = canvas.current;
    if (!element) return;
    void import("./scene3d")
      .then(({ createTrainScene }) => {
        if (disposed) return;
        try {
          controller.current = createTrainScene(element);
        } catch {
          setAvailable(false);
        }
      })
      .catch(() => {
        if (!disposed) setAvailable(false);
      });
    return () => {
      disposed = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    const options = { color, fog, fogStrength, decor, station, branch, calm, moving: running };
    // The controller may still be loading. Apply the latest props once ready.
    let disposed = false,
      handle = 0;
    const apply = () => {
      if (disposed) return;
      if (controller.current) controller.current.update(options);
      else handle = requestAnimationFrame(apply);
    };
    if (available) apply();
    return () => {
      disposed = true;
      cancelAnimationFrame(handle);
    };
  }, [color, fog, fogStrength, decor, station, branch, calm, running, available]);
  return (
    <div
      className={`scene-3d ${compact ? "compact" : ""} ${fog || fogStrength > .01 ? "is-foggy" : ""}`}
    >
      {available ? (
        <canvas
          ref={canvas}
          className="train-canvas"
          role="img"
          aria-label="Cảnh tàu 3D hoạt hình: toa tàu qua đồi xanh, mây bồng bềnh và đường ray"
        />
      ) : (
        <SceneFallback color={color} fog={fog || fogStrength > .01} fogStrength={fogStrength} decor={decor} />
      )}
      <div className="scene-vignette" aria-hidden="true" />
      {revealRadius !== undefined && <div className="exploration-fog" aria-hidden="true"
        style={{ "--reveal-radius": `${revealRadius}%` } as CSSProperties} />}
      {revealRadius !== undefined && !fog && fogStrength <= .01 &&
        <div className="scene-exploration-label">☁ Mỗi phút học mở thêm một vùng đất</div>}
      {(fog || fogStrength > .01) && (
        <div className="scene-fog-label">{fog ? "☁ Toa đang chờ bạn quay lại" : "☁ Sương đang tan khi bạn nối lại"}</div>
      )}
    </div>
  );
}
