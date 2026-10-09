import { useState } from "react";
import type { Journey } from "../../backend/src/adventure/domain";
import { Scene } from "./Scene";
import { TopDownMap } from "./TopDownMap";
import { TopDownScene } from "./TopDownScene";
import type { ActiveTrip } from "./focus";
import { journeyExplorationFraction, sceneryShouldMove } from "./exploration";

export function JourneyView({
  journey,
  carriages,
  ownId,
  decor,
  fog = false,
  calm = false,
  draftSeconds = 0,
  initial = "3d",
  focusState,
  reconnect = 0,
  targetSeconds,
}: {
  journey?: Journey;
  carriages: { id: string; name: string; color: string }[];
  ownId: string;
  decor?: string;
  fog?: boolean;
  calm?: boolean;
  draftSeconds?: number;
  initial?: "2d" | "3d";
  focusState?: ActiveTrip["state"] | "break";
  reconnect?: number;
  targetSeconds?: number;
}) {
  const [camera, setCamera] = useState(initial);
  const exploration = journeyExplorationFraction(
    journey,
    draftSeconds,
    targetSeconds,
  );
  const running = sceneryShouldMove(focusState);
  const coast = journey?.branch === "coast";
  return (
    <div className="journey-view">
      <div
        className="choice-row camera-switch"
        aria-label="Góc nhìn hành trình"
      >
        <button
          aria-pressed={camera === "3d"}
          className={camera === "3d" ? "selected" : ""}
          onClick={() => setCamera("3d")}
        >
          ◈ Cảnh 3D
        </button>
        <button
          aria-pressed={camera === "2d"}
          className={camera === "2d" ? "selected" : ""}
          onClick={() => setCamera("2d")}
        >
          ⌁ {focusState ? "Góc nhìn 2D" : "Bản đồ 2D"} · {carriages.length} toa
        </button>
      </div>
      {camera === "2d" && focusState ? (
        <TopDownScene
          carriages={carriages}
          ownId={ownId}
          running={running}
          fogStrength={fog ? 1 : Math.min(1, Math.max(0, reconnect / 120))}
          exploration={exploration}
          coast={coast}
        />
      ) : camera === "2d" ? (
        <TopDownMap
          journey={journey}
          carriages={carriages}
          ownId={ownId}
          draftSeconds={draftSeconds}
          targetSeconds={targetSeconds}
        />
      ) : (
        <Scene
          color={
            (carriages.find((car) => car.id === ownId) ?? carriages[0])?.color
          }
          decor={decor}
          fog={fog}
          fogStrength={fog ? 1 : Math.min(1, Math.max(0, reconnect / 120))}
          exploration={exploration}
          calm={calm}
          running={running}
          station={journey?.station}
          branch={journey?.branch}
        />
      )}
    </div>
  );
}
