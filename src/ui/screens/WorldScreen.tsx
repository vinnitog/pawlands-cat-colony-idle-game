import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useGame } from '../../app/gameProvider.tsx';
import type { CatClass } from '../../game/models/catClass.ts';
import type { ShopId } from '../../game/models/shop.ts';
import { Shop } from '../components/Shop.tsx';
import {
  createGrimalkin,
  TILE,
  TILESET_COLUMNS,
  tilesetSrc,
  type InteractionKind,
} from '../../game/world/tinyTown.ts';
import manifest from '../sprites/manifest.json';

const ZOOM = 3;
const SPEED = 72; // world px per second

type WorldScreenProps = {
  goTo(kind: InteractionKind): void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function WorldScreen({ goTo }: WorldScreenProps) {
  const { state } = useGame();
  const catClass = state.cat.catClass as CatClass;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const [prompt, setPrompt] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ name: string; lines: string[]; index: number } | null>(null);
  const dialogRef = useRef(false);
  dialogRef.current = dialog !== null;
  const [shopSeller, setShopSeller] = useState<{ name: string; shopId: ShopId } | null>(null);
  const shopRef = useRef(false);
  shopRef.current = shopSeller !== null;
  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    setDialog((d) => (d && d.index < d.lines.length - 1 ? { ...d, index: d.index + 1 } : null));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const base = import.meta.env.BASE_URL;
    const map = createGrimalkin();
    const anims = manifest.heroes[catClass];
    const idleMeta = anims.idle;
    const runMeta = anims.run;
    const keys = keysRef.current;

    const player = { x: map.spawn.x, y: map.spawn.y, facing: 1, anim: 0, moving: false };
    let tileImg: HTMLImageElement | null = null;
    let idleImg: HTMLImageElement | null = null;
    let runImg: HTMLImageElement | null = null;
    const npcImgs = new Map<CatClass, HTMLImageElement>();
    const npcClasses = Array.from(new Set(map.npcs.map((n) => n.sprite)));
    let raf = 0;
    let running = true;
    let last = performance.now();
    let interactLatch = false;
    let shownPrompt: string | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };

    const solidAt = (wx: number, wy: number) => {
      const tx = Math.floor(wx / TILE);
      const ty = Math.floor(wy / TILE);
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
      return map.solid[ty * map.width + tx];
    };
    const hw = 5;
    const hh = 5;
    const blocked = (x: number, y: number) =>
      solidAt(x - hw, y - hh) || solidAt(x + hw, y - hh) || solidAt(x - hw, y) || solidAt(x + hw, y);

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.add(k);
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);

    const render = () => {
      if (!tileImg || !idleImg || !runImg) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#171410';
      ctx.fillRect(0, 0, W, H);

      const viewW = W / ZOOM;
      const viewH = H / ZOOM;
      const mapW = map.width * TILE;
      const mapH = map.height * TILE;
      let camX = mapW < viewW ? (mapW - viewW) / 2 : Math.max(0, Math.min(player.x - viewW / 2, mapW - viewW));
      let camY = mapH < viewH ? (mapH - viewH) / 2 : Math.max(0, Math.min(player.y - viewH / 2, mapH - viewH));
      ctx.setTransform(ZOOM, 0, 0, ZOOM, -camX * ZOOM, -camY * ZOOM);

      const drawTile = (index: number, dx: number, dy: number) => {
        const sx = (index % TILESET_COLUMNS) * TILE;
        const sy = Math.floor(index / TILESET_COLUMNS) * TILE;
        ctx.drawImage(tileImg as HTMLImageElement, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
      };

      const x0 = Math.max(0, Math.floor(camX / TILE));
      const x1 = Math.min(map.width - 1, Math.floor((camX + viewW) / TILE));
      const y0 = Math.max(0, Math.floor(camY / TILE));
      const y1 = Math.min(map.height - 1, Math.floor((camY + viewH) / TILE));
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) drawTile(map.ground[y * map.width + x], x * TILE, y * TILE);
      }
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const o = map.objects[y * map.width + x];
          if (o !== null) drawTile(o, x * TILE, y * TILE);
        }
      }

      const clock = performance.now() / 1000;
      for (const npc of map.npcs) {
        const img = npcImgs.get(npc.sprite);
        if (!img) continue;
        const nm = manifest.heroes[npc.sprite].idle;
        const nframe = Math.floor(clock * nm.fps) % nm.frames;
        const nx = npc.tx * TILE + TILE / 2;
        const ny = npc.ty * TILE + TILE;
        const face = player.x < nx ? -1 : 1;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.scale(face, 1);
        ctx.drawImage(
          img,
          nframe * nm.frameWidth,
          0,
          nm.frameWidth,
          nm.frameHeight,
          -nm.frameWidth / 2,
          -nm.frameHeight,
          nm.frameWidth,
          nm.frameHeight,
        );
        ctx.restore();
      }

      const meta = player.moving ? runMeta : idleMeta;
      const sheet = player.moving ? runImg : idleImg;
      const fw = meta.frameWidth;
      const fh = meta.frameHeight;
      const frame = Math.floor(player.anim * meta.fps) % meta.frames;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(player.facing, 1);
      ctx.drawImage(sheet, frame * fw, 0, fw, fh, -fw / 2, -fh, fw, fh);
      ctx.restore();
    };

    const step = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const interacting = keys.has('e') || keys.has('enter') || keys.has(' ');
      const interactEdge = interacting && !interactLatch;
      interactLatch = interacting;

      if (dialogRef.current) {
        if (interactEdge) advanceRef.current();
        player.moving = false;
        render();
        raf = requestAnimationFrame(step);
        return;
      }

      if (shopRef.current) {
        player.moving = false;
        render();
        raf = requestAnimationFrame(step);
        return;
      }

      let dx = 0;
      let dy = 0;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      const moving = dx !== 0 || dy !== 0;
      if (moving) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
        const nx = player.x + dx * SPEED * dt;
        if (!blocked(nx, player.y)) player.x = nx;
        const ny = player.y + dy * SPEED * dt;
        if (!blocked(player.x, ny)) player.y = ny;
        if (dx !== 0) player.facing = dx < 0 ? -1 : 1;
      }
      player.moving = moving;
      player.anim += dt;

      const ftx = Math.floor(player.x / TILE);
      const fty = Math.floor(player.y / TILE);
      const cheby = (ax: number, ay: number) => Math.max(Math.abs(ax - ftx), Math.abs(ay - fty));
      let nearNpc: (typeof map.npcs)[number] | null = null;
      for (const npc of map.npcs) {
        if (cheby(npc.tx, npc.ty) <= 1) {
          nearNpc = npc;
          break;
        }
      }
      let nearSign: (typeof map.interactions)[number] | null = null;
      for (const it of map.interactions) {
        if (cheby(it.tx, it.ty) <= 1) {
          nearSign = it;
          break;
        }
      }
      const label = nearNpc ? nearNpc.name : nearSign ? nearSign.label : null;
      if (label !== shownPrompt) {
        shownPrompt = label;
        setPrompt(label);
      }
      if (interactEdge) {
        if (nearNpc) {
          if (nearNpc.shop) setShopSeller({ name: nearNpc.name, shopId: nearNpc.shop });
          else setDialog({ name: nearNpc.name, lines: nearNpc.lines, index: 0 });
        } else if (nearSign) {
          goToRef.current(nearSign.kind);
        }
      }

      render();
      raf = requestAnimationFrame(step);
    };

    Promise.all([
      loadImage(base + tilesetSrc),
      loadImage(base + idleMeta.src),
      loadImage(base + runMeta.src),
      ...npcClasses.map((c) => loadImage(base + manifest.heroes[c].idle.src)),
    ])
      .then((imgs) => {
        if (!running) return;
        tileImg = imgs[0];
        idleImg = imgs[1];
        runImg = imgs[2];
        npcClasses.forEach((c, i) => npcImgs.set(c, imgs[3 + i]));
        resize();
        last = performance.now();
        raf = requestAnimationFrame(step);
      })
      .catch(() => {});

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', resize);
    };
  }, [catClass]);

  const hold = (key: string) => {
    const press = (e: ReactPointerEvent) => {
      e.preventDefault();
      keysRef.current.add(key);
    };
    const release = () => keysRef.current.delete(key);
    return {
      onPointerDown: press,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    };
  };

  return (
    <div className={`world-screen${dialog ? ' has-dialog' : ''}`}>
      <canvas ref={canvasRef} className="world-canvas" />
      {prompt && !dialog ? <div className="world-prompt">⚔ {prompt}</div> : null}
      {dialog ? (
        <button type="button" className="world-dialog" onClick={() => advanceRef.current()}>
          <strong>{dialog.name}</strong>
          <span>{dialog.lines[dialog.index]}</span>
          <em>{dialog.index < dialog.lines.length - 1 ? 'toque / E — continuar' : 'toque / E — fechar'}</em>
        </button>
      ) : null}
      {shopSeller ? (
        <Shop
          sellerName={shopSeller.name}
          shopId={shopSeller.shopId}
          onClose={() => setShopSeller(null)}
        />
      ) : null}
      <div className="world-dpad">
        <button type="button" className="dp dp-up" aria-label="Cima" {...hold('w')}>
          ▲
        </button>
        <button type="button" className="dp dp-left" aria-label="Esquerda" {...hold('a')}>
          ◀
        </button>
        <button type="button" className="dp dp-right" aria-label="Direita" {...hold('d')}>
          ▶
        </button>
        <button type="button" className="dp dp-down" aria-label="Baixo" {...hold('s')}>
          ▼
        </button>
      </div>
      <button type="button" className="world-action" aria-label="Interagir" {...hold('e')}>
        E
      </button>
      <p className="world-hint">WASD / setas para andar · E para interagir</p>
    </div>
  );
}
