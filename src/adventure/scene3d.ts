import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export type SceneOptions = {
  color: string;
  fog: boolean;
  fogStrength?: number;
  decor: string;
  station: number;
  branch: string;
  calm: boolean;
  moving: boolean;
};
export type SceneController = {
  update: (options: SceneOptions) => void;
  dispose: () => void;
};
const palettes = [
  { sky: "#cae4ed", ground: "#93c79a", hill: "#81b09b", tree: "#4f9c7b" },
  { sky: "#bee6eb", ground: "#aed486", hill: "#8bbb82", tree: "#5aa579" },
  { sky: "#c6dcd9", ground: "#86b291", hill: "#659e8d", tree: "#427b67" },
  { sky: "#ceccec", ground: "#9fb1ba", hill: "#8498b2", tree: "#5e7c9b" },
  { sky: "#f4dabe", ground: "#b9cd8f", hill: "#a9c09b", tree: "#689880" },
];
export function createTrainScene(canvas: HTMLCanvasElement): SceneController {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palettes[0].sky);
  scene.fog = new THREE.Fog(palettes[0].sky, 27, 60);
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 100);
  camera.position.set(10, 8, 13);
  camera.lookAt(0, 1.4, 0);
  scene.add(new THREE.HemisphereLight("#fff6df", "#749c85", 2.7));
  const sunLight = new THREE.DirectionalLight("#fff0d1", 3.2);
  sunLight.position.set(-7, 12, 8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.left = -14;
  sunLight.shadow.camera.right = 14;
  sunLight.shadow.camera.top = 12;
  sunLight.shadow.camera.bottom = -12;
  sunLight.shadow.normalBias = 0.04;
  scene.add(sunLight);
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  const gradient = new THREE.DataTexture(
    new Uint8Array([105, 167, 220, 255]),
    4,
    1,
    THREE.RedFormat,
  );
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  function material(color: string) {
    const value = new THREE.MeshToonMaterial({ color, gradientMap: gradient });
    materials.add(value);
    return value;
  }
  const cream = material("#fff2d7"),
    dark = material("#30463f"),
    wood = material("#a17752");
  const green = material("#398575"),
    roof = material("#325d58"),
    glass = material("#b5e4e3");
  const groundMat = material(palettes[0].ground),
    hillMat = material(palettes[0].hill),
    treeMat = material(palettes[0].tree);
  const gold = material("#f0bd6c"),
    pink = material("#f5a688"),
    white = material("#fff8e7");
  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
    radius = 0.1,
  ) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)),
      mat,
      parent,
      x,
      y,
      z,
    );
  }
  function sphere(
    radius: number,
    mat: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return mesh(new THREE.SphereGeometry(radius, 12, 8), mat, parent, x, y, z);
  }
  box(60, 0.55, 30, groundMat, scene, 0, -0.42, -3, 0.2);
  // Rounded hills and distant polygon mountains make a toy-like diorama.
  for (let i = 0; i < 8; i++) {
    const hill = sphere(
      3 + (i % 3),
      hillMat,
      scene,
      -20 + i * 6,
      -0.6,
      -9 - (i % 2) * 3,
    );
    hill.scale.set(1.5, 0.7, 1.1);
    const mountain = mesh(
      new THREE.ConeGeometry(3 + (i % 3), 6 + (i % 2) * 3, 5),
      material(i % 2 ? "#9bbabd" : "#a4c8bf"),
      scene,
      -24 + i * 7,
      2,
      -17,
    );
    mountain.rotation.y = i * 0.8;
  }
  const railBed = box(50, 0.18, 2.6, material("#c7bca5"), scene, 0, -0.08, 0);
  railBed.receiveShadow = true;
  for (const z of [-0.8, 0.8])
    box(50, 0.15, 0.12, dark, scene, 0, 0.1, z, 0.02);
  const sleepers: THREE.Mesh[] = [];
  for (let i = 0; i < 55; i++)
    sleepers.push(
      box(0.23, 0.13, 2.5, wood, scene, -25 + i * 0.95, 0.03, 0, 0.04),
    );
  const trees: THREE.Group[] = [];
  for (let i = 0; i < 21; i++) {
    const tree = new THREE.Group();
    tree.position.set(
      -25 + i * 2.5,
      0,
      i % 3 === 0 ? 4.3 : -3.8 - (i % 4) * 1.15,
    );
    scene.add(tree);
    trees.push(tree);
    const scale = 0.65 + (i % 4) * 0.19;
    tree.scale.setScalar(scale);
    mesh(new THREE.CylinderGeometry(0.15, 0.19, 1.3, 7), wood, tree, 0, 0.6, 0);
    if (i % 2) {
      mesh(new THREE.ConeGeometry(0.95, 1.5, 7), treeMat, tree, 0, 1.5, 0);
      mesh(new THREE.ConeGeometry(0.73, 1.4, 7), treeMat, tree, 0, 2.2, 0);
      mesh(new THREE.ConeGeometry(0.48, 1.2, 7), treeMat, tree, 0, 2.8, 0);
    } else {
      const crown = sphere(1.05, treeMat, tree, 0, 2.15, 0);
      crown.scale.set(0.95, 1.25, 0.95);
      sphere(0.68, treeMat, tree, 0.5, 1.8, 0.2);
      sphere(0.67, treeMat, tree, -0.5, 1.8, -0.1);
    }
  }
  for (let i = 0; i < 24; i++) {
    const x = -16 + ((i * 3.7) % 32),
      z = 2.7 + (i % 4) * 0.65;
    mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.32, 6),
      treeMat,
      scene,
      x,
      0.15,
      z,
    );
    for (let p = 0; p < 5; p++) {
      const angle = (p * Math.PI * 2) / 5;
      sphere(
        0.07,
        i % 2 ? cream : pink,
        scene,
        x + Math.cos(angle) * 0.1,
        0.34,
        z + Math.sin(angle) * 0.1,
      );
    }
    sphere(0.05, gold, scene, x, 0.37, z);
  }
  const train = new THREE.Group();
  scene.add(train);
  train.position.set(0.7, 0, 0);
  const carriage = new THREE.Group();
  train.add(carriage);
  carriage.position.x = 1.1;
  box(4.5, 2.5, 2.25, green, carriage, 0, 1.93, 0, 0.28);
  box(4.8, 0.35, 2.55, roof, carriage, 0, 3.25, 0, 0.16);
  box(4.4, 0.24, 2.35, gold, carriage, 0, 0.92, 0, 0.08);
  box(4.5, 0.3, 2.1, dark, carriage, 0, 0.6, 0);
  for (const side of [-1, 1]) {
    for (const x of [-1.2, 0.1, 1.35]) {
      box(0.99, 1.15, 0.12, cream, carriage, x, 2.2, side * 1.13, 0.11);
      box(0.79, 0.92, 0.08, glass, carriage, x, 2.23, side * 1.21, 0.08);
      box(0.045, 0.95, 0.1, cream, carriage, x, 2.22, side * 1.27, 0.015);
      box(0.78, 0.045, 0.1, cream, carriage, x, 2.17, side * 1.27, 0.015);
    }
    box(0.85, 0.14, 0.09, gold, carriage, 1.25, 1.22, side * 1.18, 0.02);
  }
  // A small cozy decoration visible in the carriage window.
  const decorations: Record<string, THREE.Group> = {};
  for (const key of ["plant", "books", "stars"]) {
    const item = new THREE.Group();
    item.position.set(0.18, 2, 1.34);
    carriage.add(item);
    decorations[key] = item;
  }
  mesh(
    new THREE.CylinderGeometry(0.17, 0.12, 0.25, 8),
    pink,
    decorations.plant,
    0,
    0,
    0,
  );
  const leaf = sphere(0.19, treeMat, decorations.plant, 0, 0.25, 0);
  leaf.scale.set(0.7, 1.4, 0.5);
  for (let i = 0; i < 3; i++)
    box(
      0.34,
      0.09,
      0.14,
      [pink, gold, roof][i],
      decorations.books,
      0,
      i * 0.1 - 0.05,
      0,
      0.025,
    );
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2,
      r = i % 2 ? 0.13 : 0.28;
    const x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    if (!i) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();
  mesh(
    new THREE.ExtrudeGeometry(starShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    }),
    gold,
    decorations.stars,
    0,
    0.05,
    0,
  );
  const engine = new THREE.Group();
  train.add(engine);
  engine.position.x = -2.8;
  box(1.65, 2.2, 2.2, roof, engine, 0.6, 1.85, 0, 0.2);
  box(1.9, 0.28, 2.5, gold, engine, 0.6, 3, 0, 0.12);
  box(1.1, 0.9, 0.1, cream, engine, 0.6, 2.1, 1.14, 0.12);
  box(0.87, 0.67, 0.1, glass, engine, 0.6, 2.1, 1.22, 0.09);
  const boiler = mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 2.25, 16),
    green,
    engine,
    -1,
    1.42,
    0,
  );
  boiler.rotation.z = Math.PI / 2;
  const nose = mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.16, 16),
    dark,
    engine,
    -2.15,
    1.42,
    0,
  );
  nose.rotation.z = Math.PI / 2;
  box(3.75, 0.28, 2.3, gold, engine, -0.85, 0.65, 0);
  mesh(
    new THREE.CylinderGeometry(0.3, 0.24, 0.85, 10),
    dark,
    engine,
    -1.5,
    2.42,
    0,
  );
  mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.16, 10),
    gold,
    engine,
    -1.5,
    2.84,
    0,
  );
  sphere(0.19, gold, engine, -2.25, 1.74, 0.6);
  box(0.5, 0.25, 2.3, wood, engine, -2.62, 0.54, 0, 0.1);
  // Friendly eyes and blush on the locomotive's visible side.
  for (const x of [-1.4, -0.8]) {
    const eye = sphere(0.15, white, engine, x, 1.7, 0.77);
    eye.scale.z = 0.25;
    const pupil = sphere(0.065, dark, engine, x - 0.025, 1.69, 0.82);
    pupil.scale.z = 0.35;
  }
  const cheek = sphere(0.13, pink, engine, -1.78, 1.48, 0.75);
  cheek.scale.set(1, 0.6, 0.2);
  const wheels: THREE.Group[] = [];
  for (const x of [-4.25, -2.75, -0.15, 2.7])
    for (const z of [-1.16, 1.16]) {
      const wheel = new THREE.Group();
      train.add(wheel);
      wheel.position.set(x, 0.52, z);
      wheels.push(wheel);
      const tire = mesh(
        new THREE.CylinderGeometry(0.49, 0.49, 0.22, 16),
        dark,
        wheel,
      );
      tire.rotation.x = Math.PI / 2;
      const hub = mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12),
        gold,
        wheel,
      );
      hub.rotation.x = Math.PI / 2;
      for (let i = 0; i < 4; i++) {
        const spoke = box(
          0.05,
          0.57,
          0.06,
          cream,
          wheel,
          0,
          0,
          z > 0 ? 0.14 : -0.14,
          0.01,
        );
        spoke.rotation.z = (i * Math.PI) / 4;
      }
      const center = sphere(0.105, wood, wheel, 0, 0, z > 0 ? 0.17 : -0.17);
      center.scale.z = 0.5;
    }
  box(0.8, 0.11, 0.15, dark, train, -1.36, 0.75, 0, 0.02);
  const smoke: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.MeshLambertMaterial({
      color: "#fffaee",
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    materials.add(mat);
    const puff = sphere(0.33, mat, scene);
    puff.castShadow = false;
    smoke.push(puff);
  }
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Group();
    scene.add(cloud);
    cloud.position.set(-16 + i * 8, 7.5 + (i % 2) * 1.1, -10 - (i % 2) * 3);
    clouds.push(cloud);
    for (let j = 0; j < 4; j++) {
      const puff = sphere(
        0.7 + (j % 2) * 0.35,
        white,
        cloud,
        j * 0.7,
        Math.sin(j) * 0.3,
        0,
      );
      puff.castShadow = false;
    }
  }
  const sun = sphere(1.1, material("#ffe1a0"), scene, 9, 9, -14);
  sun.castShadow = false;
  const pointer = { x: 0, y: 0 },
    parallax = { x: 0, y: 0 };
  let frame = 0,
    elapsed = 0,
    last = 0,
    visible = true,
    onScreen = true,
    disposed = false;
  let options: SceneOptions = {
    color: "#398575",
    fog: false,
    decor: "plant",
    station: 0,
    branch: "mountain",
    calm: false,
    moving: true,
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    const aspect = rect.width / rect.height,
      height = aspect < 1.6 ? 6.8 : 5.8;
    camera.left = -height * aspect;
    camera.right = height * aspect;
    camera.top = height;
    camera.bottom = -height;
    camera.updateProjectionMatrix();
    render(performance.now());
  };
  function render(time: number) {
    if (disposed) return;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    const animate = options.moving && !reduced.matches;
    const speed = options.calm ? 0.28 : 0.85;
    if (animate) elapsed += dt * speed;
    if (animate) {
      train.position.y = Math.sin(elapsed * 5) * 0.025;
      train.rotation.x = Math.sin(elapsed * 3) * 0.006;
      for (const wheel of wheels) wheel.rotation.z = -elapsed * 2;
      for (let i = 0; i < sleepers.length; i++)
        sleepers[i].position.x = -25 + ((i * 0.95 + elapsed * 1.1) % 52.25);
      for (let i = 0; i < trees.length; i++)
        trees[i].position.x = -25 + ((i * 2.5 + elapsed * 1.1) % 52.5);
      clouds.forEach((cloud, i) => {
        cloud.position.x = -19 + ((i * 8 + elapsed * 0.13) % 40);
        cloud.position.y =
          7.5 + (i % 2) * 1.1 + Math.sin(elapsed * 0.3 + i) * 0.12;
      });
    }
    smoke.forEach((puff, i) => {
      const age = (elapsed * 0.45 + i / 7) % 1;
      puff.position.set(-4.25 + age * 2, 2.9 + age * 3.8, 0);
      puff.scale.setScalar(0.7 + age * 2);
      (puff.material as THREE.MeshLambertMaterial).opacity = (1 - age) * 0.55;
    });
    const smoothing = 1 - Math.exp(-dt * 4);
    parallax.x += (pointer.x - parallax.x) * smoothing;
    parallax.y += (pointer.y - parallax.y) * smoothing;
    camera.position.set(
      10 + (reduced.matches ? 0 : parallax.x * 0.8),
      8 + (reduced.matches ? 0 : parallax.y * 0.5),
      13,
    );
    camera.lookAt(0, 1.4, 0);
    renderer.render(scene, camera);
  }
  function loop(time: number) {
    frame = 0;
    if (disposed || !visible || !onScreen) return;
    render(time);
    if (options.moving && !reduced.matches)
      frame = requestAnimationFrame(loop);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (!disposed && visible && onScreen) frame = requestAnimationFrame(loop);
  }
  const visibility = () => {
    visible = !document.hidden;
    schedule();
  };
  const move = (event: PointerEvent) => {
    if (options.calm || reduced.matches) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointer.y = 0.5 - (event.clientY - rect.top) / rect.height;
  };
  const leave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  const contextRestored = () => schedule();
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  const intersection = new IntersectionObserver((entries) => {
    onScreen = entries[0]?.isIntersecting ?? true;
    schedule();
  });
  intersection.observe(canvas);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", schedule);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  resize();
  schedule();
  return {
    update(value) {
      options = value;
      const palette = palettes[Math.max(0, Math.min(4, value.station))];
      const strength = value.fog ? 1 : Math.max(0, Math.min(1, value.fogStrength ?? 0));
      const sky = strength > 0 ? "#dce5e3" : palette.sky;
      scene.background = new THREE.Color(sky);
      scene.fog = new THREE.Fog(sky, 27 - 19 * strength, 60 - 32 * strength);
      green.color.set(value.color);
      roof.color.copy(green.color).multiplyScalar(0.68);
      groundMat.color.set(
        value.branch === "coast" && value.station === 3
          ? "#dacaa5"
          : palette.ground,
      );
      hillMat.color.set(palette.hill);
      treeMat.color.set(palette.tree);
      for (const [key, object] of Object.entries(decorations))
        object.visible = key === value.decor;
      schedule();
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", schedule);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      gradient.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
