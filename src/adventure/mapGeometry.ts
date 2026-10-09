type Point = readonly [number, number];
export const stopIndices = [1, 3, 5, 7, 10];

type Cloud = {
  id: string;
  x: number;
  y: number;
  row: number;
  column: number;
  shape: number;
  size: number;
  angle: number;
  clearsAt: number;
};

export function mapGeometry(branch: "mountain" | "coast" = "mountain") {
  const route: Point[] = [
    [35, 505],
    [350, 505],
    [630, 505],
    [810, 410],
    [810, 220],
    [650, 140],
    branch === "coast" ? [870, 230] : [430, 140],
    [280, 230],
    [360, 320],
    [610, 320],
    [965, 320],
  ];
  const lengths = route.map((p, i) =>
    i ? Math.hypot(p[0] - route[i - 1][0], p[1] - route[i - 1][1]) : 0,
  );
  const distances = lengths.map((_, i) =>
    lengths.slice(0, i + 1).reduce((a, b) => a + b, 0),
  );
  const total = distances[distances.length - 1];
  const path = route.map((p, i) => `${i ? "L" : "M"}${p.join(" ")}`).join(" ");
  function position(distance: number) {
    const d = Math.max(0, Math.min(total, distance));
    const i = Math.max(
      1,
      distances.findIndex((v) => v >= d),
    );
    const t = (d - distances[i - 1]) / lengths[i];
    const a = route[i - 1],
      b = route[i];
    return {
      x: a[0] + (b[0] - a[0]) * t,
      y: a[1] + (b[1] - a[1]) * t,
      angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
    };
  }
  // A staggered grid of overlapping cloud clusters covers the whole map. The
  // shortest-path reveal order keeps every newly clear patch connected to the
  // starting station instead of exposing isolated islands on a distant loop.
  const columns = [-60, 95, 250, 405, 560, 715, 870, 1025, 1180];
  const rows = [-45, 65, 175, 285, 395, 505, 615];
  const nodes: Omit<Cloud, "clearsAt">[] = [];
  for (let row = 0; row < rows.length; row++) {
    for (let column = 0; column < columns.length; column++) {
      const staggerX = ((row * 5 + column * 3) % 3 - 1) * 5;
      const staggerY = ((row * 7 + column * 2) % 3 - 1) * 4;
      const variation = (row * 7 + column * 11) % 4;
      nodes.push({
        id: `${row}-${column}`,
        x: columns[column] + staggerX,
        y: rows[row] + staggerY,
        row,
        column,
        shape: (row + column * 2) % 3,
        size: 0.98 + variation * 0.02,
        angle: ((row * 2 + column * 3) % 5 - 2) * 1.2,
      });
    }
  }

  const firstStopDistance = distances[stopIndices[0]];
  const finalStopDistance = distances[stopIndices[4]];
  const projections = nodes.map(({ x, y }) => {
    let nearestDistance = Infinity;
    let lateralDistance = Infinity;
    for (let i = 1; i < route.length; i++) {
      const [ax, ay] = route[i - 1];
      const [bx, by] = route[i];
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      const px = ax + t * dx;
      const py = ay + t * dy;
      const lateral = Math.hypot(x - px, y - py);
      if (lateral < lateralDistance) {
        lateralDistance = lateral;
        nearestDistance = distances[i - 1] + t * lengths[i];
      }
    }
    const routeProgress = Math.max(0, Math.min(1, (nearestDistance - firstStopDistance) / (finalStopDistance - firstStopDistance)));
    return {
      nearestDistance,
      lateralDistance,
      base: routeProgress + Math.min(0.22, lateralDistance / 1700),
    };
  });
  const start = position(firstStopDistance);
  const initialReveal = nodes.map((cloud, index) => {
    const nearStation = Math.hypot(cloud.x - start.x, cloud.y - start.y) <= 160;
    const coversTravelledTail = projections[index].nearestDistance <= firstStopDistance &&
      projections[index].lateralDistance <= 160;
    return nearStation || coversTravelledTail;
  });
  const arrival = nodes.map(() => Infinity);
  const visited = nodes.map(() => false);
  for (let i = 0; i < nodes.length; i++) {
    if (initialReveal[i]) arrival[i] = 0;
  }
  for (let iteration = 0; iteration < nodes.length; iteration++) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited[i] && (current === -1 || arrival[i] < arrival[current])) current = i;
    }
    if (current === -1 || !Number.isFinite(arrival[current])) break;
    visited[current] = true;
    const { row, column } = nodes[current];
    const neighbors = [
      row > 0 ? current - columns.length : -1,
      row + 1 < rows.length ? current + columns.length : -1,
      column > 0 ? current - 1 : -1,
      column + 1 < columns.length ? current + 1 : -1,
    ];
    for (const next of neighbors) {
      if (next < 0 || visited[next]) continue;
      // Favor route-forward cells while charging a small cost for each grid
      // step. Positive edges make each revealed frontier connected.
      const routeAdvance = Math.max(0, projections[next].base - projections[current].base);
      const candidate = arrival[current] + routeAdvance + 0.012;
      if (candidate < arrival[next]) arrival[next] = candidate;
    }
  }
  const latestArrival = Math.max(...arrival.filter(Number.isFinite));
  const clouds: Cloud[] = nodes.map((cloud, index) => ({
    ...cloud,
    clearsAt: initialReveal[index]
      ? 0
      : latestArrival > 0
        ? arrival[index] / latestArrival
        : 0,
  }));
  return { route, distances, total, path, position, clouds };
}
