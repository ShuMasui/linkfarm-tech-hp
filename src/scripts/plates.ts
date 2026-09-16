/* 背景の「お皿」
   丸 / ひし形 / 六角 の3種を、ページを開くたびにランダムに散らす。
   縁のある皿に見えるよう、外周と見込み（内側の輪）の二重線で描く。
   詳細は docs/02-design.md 第5節。 */

const SHAPES = ['circle', 'diamond', 'hexagon'] as const;
type Shape = (typeof SHAPES)[number];

/** 正多角形の頂点を "x,y x,y ..." の形で返す */
function polygonPoints(cx: number, cy: number, r: number, sides: number, rotation: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** 皿1枚 = 外周と見込みの2本の輪郭 */
function plate(shape: Shape, cx: number, cy: number, r: number): string {
  const inner = r * 0.72;
  const n = (v: number) => v.toFixed(1);
  if (shape === 'circle') {
    return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" />
            <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(inner)}" />`;
  }
  const sides = shape === 'diamond' ? 4 : 6;
  const rot = shape === 'diamond' ? -Math.PI / 2 : -Math.PI / 6;
  return `<polygon points="${polygonPoints(cx, cy, r, sides, rot)}" />
          <polygon points="${polygonPoints(cx, cy, inner, sides, rot)}" />`;
}

export function drawPlates(host: Element): void {
  const w = 1000;
  const h = 1000;

  /* 重なりすぎないよう、粗いグリッドの各マス内でずらして配置する */
  const cols = 3;
  const rows = 3;
  const cell = { w: w / cols, h: h / rows };
  const body: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      /* 全マスは埋めない。まばらなほうが紙らしい */
      if (Math.random() < 0.35) continue;

      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
      const r = cell.w * (0.26 + Math.random() * 0.2);
      const cx = col * cell.w + cell.w * (0.25 + Math.random() * 0.5);
      const cy = row * cell.h + cell.h * (0.25 + Math.random() * 0.5);
      body.push(plate(shape, cx, cy, r));
    }
  }

  host.innerHTML =
    `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
       <g fill="none" stroke="currentColor" stroke-width="1.6">${body.join('')}</g>
     </svg>`;
}
