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

// The wordmark runs off the bottom of the page and fades out before it gets
// there: a faint dot in every cell, the letters lit on top. It is decoration,
// so it does not react to the pointer.
export function FooterWordmark() {
  return (
    <div aria-hidden className="mt-12 aspect-[56/15.5] overflow-hidden sm:mt-16">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full [mask-image:linear-gradient(to_bottom,black_35%,transparent_80%)]"
      >
        <defs>
          <pattern id="wordmark-grid" width={1} height={1} patternUnits="userSpaceOnUse">
            <circle cx={0.5} cy={0.5} r={0.14} fill="currentColor" />
          </pattern>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#wordmark-grid)" opacity={0.1} />
        <path d={LIT} stroke="currentColor" strokeWidth={0.6} strokeLinecap="round" />
      </svg>
    </div>
  );
}
