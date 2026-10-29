'use client';

import { cn } from '@/lib/utils';

// "OGIS" in Geist Pixel, traced from its Grid cut: one character per dot.
const WORDMARK = [
  '.....######............#######.......##.......######....',
  '...##########........###########.....##.....##########..',
  '..###......###......###.......###....##.....##......###.',
  '..##........##......##.........##....##....##........##.',
  '.##..........##....##...........##...##....##.........##',
  '.##..........##....##...........##...##....##.........##',
  '##............##..##.................##....##...........',
  '##............##..##.................##....###..........',
  '##............##..##.................##.....######......',
  '##............##..##.................##.......#######...',
  '##............##..##......########...##..........######.',
  '##............##..##......########...##.............###.',
  '##............##..##............##...##...............##',
  '.##..........##....##...........##...##....##.........##',
  '.##..........##....##...........##...##....##.........##',
  '..##........##......##..........##...##....##.........##',
  '..###......###......###........###...##.....##.......##.',
  '...##########........##########.##...##.....###########.',
  '.....######............#######..##...##.......#######...',
];
const WIDTH = WORDMARK[0].length;
const HEIGHT = WORDMARK.length;
// A zero-length segment with a round cap draws one dot.
const LIT = WORDMARK.flatMap((row, y) => [...row].flatMap((cell, x) => (cell === '#' ? `M${x + 0.5} ${y + 0.5}h0` : []))).join('');

// The display itself: a faint dot in every cell, the letters lit on top.
function Panel({ id, grid, className }: { id: string; grid: number; className: string }) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={cn('block h-auto w-full', className)}>
      <defs>
        <pattern id={id} width={1} height={1} patternUnits="userSpaceOnUse">
          <circle cx={0.5} cy={0.5} r={0.14} fill="currentColor" />
        </pattern>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#${id})`} opacity={grid} />
      <path d={LIT} stroke="currentColor" strokeWidth={0.6} strokeLinecap="round" />
    </svg>
  );
}

// The wordmark runs off the bottom of the page and fades out before it gets
// there. The pointer is a lamp held to the display: around it the faded rows
// come back and the unlit cells glow.
export function FooterWordmark() {
  function follow(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--y', `${event.clientY - box.top}px`);
  }

  return (
    <div
      aria-hidden
      onPointerMove={follow}
      className="group relative mt-12 aspect-[56/15.5] overflow-hidden [--x:50%] [--y:50%] sm:mt-16"
    >
      <Panel id="wordmark-rest" grid={0.1} className="[mask-image:linear-gradient(to_bottom,black_35%,transparent_80%)]" />
      <Panel
        id="wordmark-lamp"
        grid={0.3}
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-500 [mask-image:radial-gradient(circle_13rem_at_var(--x)_var(--y),black_20%,transparent)] group-hover:opacity-100"
      />
    </div>
  );
}
