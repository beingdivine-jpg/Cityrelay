import { useEffect, useRef, useState } from "react";
// An original architectural illustration, never presented as a geographic model.
export default function CityScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  useEffect(() => {
    pauseRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let disposed = false;
    let cleanup = () => {};
    import("three")
      .then((T) => {
        if (disposed) return;
        let renderer: InstanceType<typeof T.WebGLRenderer>;
        try {
          renderer = new T.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "low-power",
          });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = T.SRGBColorSpace;
        node.appendChild(renderer.domElement);
        const scene = new T.Scene();
        const camera = new T.OrthographicCamera(-13, 13, 11, -11, 0.1, 120);
        camera.position.set(24, 24, 30);
        camera.lookAt(0, 0, 0);
        const hemi = new T.HemisphereLight(0xffffff, 0x6b71bd, 2.4);
        scene.add(hemi);
        const sun = new T.DirectionalLight(0xffffff, 3.3);
        sun.position.set(-12, 22, 12);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -20;
        sun.shadow.normalBias = 0.035;
        sun.shadow.bias = -0.0003;
        scene.add(sun);
        const group = new T.Group();
        scene.add(group);
        const cream = new T.MeshStandardMaterial({
          color: 0xe6eaff,
          roughness: 0.75,
        });
        const white = new T.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.65,
        });
        const blue = new T.MeshStandardMaterial({
          color: 0x7d8af0,
          roughness: 0.8,
        });
        const dark = new T.MeshStandardMaterial({
          color: 0x293ccc,
          roughness: 1,
        });
        const lime = new T.MeshStandardMaterial({
          color: 0xdfff6c,
          roughness: 0.7,
        });
        const park = new T.MeshStandardMaterial({
          color: 0xbacee5,
          roughness: 0.95,
        });
        const windows = new T.MeshStandardMaterial({
          color: 0x7183d9,
          roughness: 0.6,
        });
        const box = (
          x: number,
          y: number,
          z: number,
          w: number,
          h: number,
          d: number,
          mat: InstanceType<typeof T.MeshStandardMaterial>,
          parent = group,
        ) => {
          const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
          m.position.set(x, y + h / 2, z);
          m.castShadow = true;
          m.receiveShadow = true;
          parent.add(m);
          return m;
        };
        const tree = (
          x: number,
          z: number,
          parent: InstanceType<typeof T.Group>,
        ) => {
          box(x, 0.24, z, 0.065, 0.35, 0.065, blue, parent);
          const m = new T.Mesh(new T.IcosahedronGeometry(0.25, 1), park);
          m.position.set(x, 0.75, z);
          m.castShadow = true;
          parent.add(m);
        };
        // Two city fragments stay distinct while one idea crosses the space between them.
        const island = (cx: number, cz: number, size: number, seed: number) => {
          const g = new T.Group();
          g.position.set(cx, 0, cz);
          group.add(g);
          box(0, -0.4, 0, size, 0.55, size, cream, g);
          box(0, 0.15, 0, size, 0.07, size, white, g);
          let s = seed;
          const rand = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
          };
          for (let i = -3; i <= 3; i++)
            for (let j = -3; j <= 3; j++) {
              const x = i * 1.22,
                z = j * 1.22;
              if (i === 0 || j === 0) continue;
              const r = rand();
              if (r < 0.14) {
                for (let a = 0; a < 3; a++)
                  tree(x + (rand() - 0.5) * 0.6, z + (rand() - 0.5) * 0.6, g);
                continue;
              }
              const h =
                  0.55 +
                  rand() * 2.7 +
                  (Math.abs(i) < 2 && Math.abs(j) < 2 ? 1 : 0),
                w = 0.68 + rand() * 0.22,
                d = 0.65 + rand() * 0.23;
              const mat = r > 0.83 ? blue : cream;
              box(x, 0.23, z, w, h, d, mat, g);
              box(x, 0.23 + h, z, w + 0.035, 0.07, d + 0.035, white, g);
              if (h > 1.5) {
                box(x, 0.3 + h, z, w * 0.52, 0.22, d * 0.5, white, g);
              }
              for (let y = 0.6; y < h; y += 0.42) {
                box(x - w / 2 - 0.004, y, z, 0.012, 0.07, d * 0.76, windows, g);
                box(x, y, z + d / 2 + 0.004, w * 0.76, 0.07, 0.012, windows, g);
              }
            }
          for (let i = -3; i <= 3; i++) {
            box(i * 1.1, 0.23, 0, 0.25, 0.018, 0.035, dark, g);
            box(0, 0.23, i * 1.1, 0.035, 0.018, 0.25, dark, g);
          }
          return g;
        };
        const a = island(-5.4, -2.1, 9.1, 17),
          b = island(5.2, 3.8, 9.1, 83);
        b.rotation.y = 0.11;
        // A bright civic space anchors each end of the learning connection.
        box(-1.5, 0.25, 0, 1.5, 0.14, 1.5, lime, a);
        box(-1.5, 0.4, 0, 1.25, 0.6, 0.7, white, a);
        box(-1.5, 1, 0, 1.5, 0.09, 0.94, lime, a);
        box(1.5, 0.25, 0, 1.5, 0.14, 1.5, lime, b);
        box(1.5, 0.4, 0, 1.25, 0.6, 0.7, white, b);
        box(1.5, 1, 0, 1.5, 0.09, 0.94, lime, b);
        const start = new T.Vector3(-6.9, 1.2, -2.1),
          end = new T.Vector3(6.7, 1.2, 3.8);
        const curve = new T.CubicBezierCurve3(
          start,
          new T.Vector3(-3.5, 9, -2),
          new T.Vector3(4, 9, 1.5),
          end,
        );
        const line = new T.Mesh(
          new T.TubeGeometry(curve, 96, 0.042, 8, false),
          lime,
        );
        group.add(line);
        const pulse = new T.Mesh(
          new T.SphereGeometry(0.16, 12, 12),
          new T.MeshBasicMaterial({ color: 0xeaff8c }),
        );
        group.add(pulse);
        const base = new T.Mesh(
          new T.PlaneGeometry(100, 100),
          new T.ShadowMaterial({ color: 0x101b83, opacity: 0.29 }),
        );
        base.rotation.x = -Math.PI / 2;
        base.position.y = -0.44;
        base.receiveShadow = true;
        group.add(base);
        let w = 0,
          h = 0,
          frame = 0,
          phase = 0,
          last = 0,
          visible = true,
          px = 0,
          py = 0;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        const resize = () => {
          w = node.clientWidth;
          h = node.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
          const aspect = w / h;
          const span = 12;
          camera.left = -span * aspect;
          camera.right = span * aspect;
          camera.top = span;
          camera.bottom = -span;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        const ro = new ResizeObserver(resize);
        ro.observe(node);
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(node);
        const pointer = (e: PointerEvent) => {
          const rect = node.getBoundingClientRect();
          px = (e.clientX - rect.left) / rect.width - 0.5;
          py = (e.clientY - rect.top) / rect.height - 0.5;
        };
        node.addEventListener("pointermove", pointer);
        const leave = () => {
          px = 0;
          py = 0;
        };
        node.addEventListener("pointerleave", leave);
        let wasFrozen = false;
        function render(time: number) {
          frame = requestAnimationFrame(render);
          if (time - last < 32 || !visible || document.hidden) return;
          const dt = Math.min((time - last) / 1000, 0.1);
          last = time;
          const frozen = pauseRef.current || reduced.matches;
          if (frozen && wasFrozen) return;
          wasFrozen = frozen;
          if (!frozen) {
            phase += dt;
            group.rotation.y +=
              (px * 0.12 + Math.sin(phase * 0.15) * 0.04 - group.rotation.y) *
              0.035;
            group.rotation.x += (py * 0.025 - group.rotation.x) * 0.03;
            pulse.position.copy(curve.getPoint((phase * 0.14) % 1));
          }
          renderer.render(scene, camera);
        }
        resize();
        renderer.render(scene, camera);
        setReady(true);
        frame = requestAnimationFrame(render);
        cleanup = () => {
          cancelAnimationFrame(frame);
          ro.disconnect();
          io.disconnect();
          node.removeEventListener("pointermove", pointer);
          node.removeEventListener("pointerleave", leave);
          scene.traverse((o) => {
            if (o instanceof T.Mesh) {
              o.geometry.dispose();
              const ms = Array.isArray(o.material) ? o.material : [o.material];
              ms.forEach((m) => m.dispose());
            }
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return (
    <div className={`city-scene ${ready ? "scene-ready" : ""}`}>
      <div ref={host} className="city-renderer" aria-hidden="true" />
      <div className="scene-fallback" aria-hidden="true">
        <div />
        <div />
        <span>↗</span>
      </div>
      <span className="scene-city scene-city-origin">
        <i />
        An idea, elsewhere
      </span>
      <span className="scene-city scene-city-local">
        <i />A possibility, here
      </span>
      <div className="scene-caption">
        <span>A STUDY IN SHARED POSSIBILITIES</span>
        <button aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Play motion" : "Pause motion"}{" "}
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
        </button>
      </div>
    </div>
  );
}
