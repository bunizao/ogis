// Sample covers for the playground, all from Unsplash. `fm=jpg` matters: Unsplash
// would otherwise negotiate WebP or AVIF, which the image loader rejects.

const unsplash = (id: string, size: string) => `https://images.unsplash.com/photo-${id}?${size}&fm=jpg&q=80`;

const PHOTOS = [
  {
    label: 'Carina Nebula',
    author: 'NASA',
    page: 'https://unsplash.com/photos/nebula--hI5dX2ObAs',
    id: '1462332420958-a05d1e002413',
  },
  {
    label: 'Earth at night',
    author: 'NASA',
    page: 'https://unsplash.com/photos/photo-of-outer-space-Q1p7bh3SHj8',
    id: '1451187580459-43490279c0fa',
  },
  {
    label: 'Launch at dusk',
    author: 'SpaceX',
    page: 'https://unsplash.com/photos/rocket-launch-light-trail-at-dusk--p-KCm6xB9I',
    id: '1457364887197-9150188c107b',
  },
  {
    label: 'Snow mountain under stars',
    author: 'Benjamin Voros',
    page: 'https://unsplash.com/photos/snow-mountain-under-stars-phIFdC6lA4E',
    id: '1519681393784-d120267933ba',
  },
  {
    label: 'Desert at night',
    author: 'Akhil Lincoln',
    page: 'https://unsplash.com/photos/desert-at-night-dSeQCOh_q7o',
    id: '1577085375786-edb0f45560aa',
  },
];

export const COVER_PHOTOS = PHOTOS.map(({ id, ...photo }) => ({
  ...photo,
  src: unsplash(id, 'w=1200'),
  thumb: unsplash(id, 'w=240&h=126&fit=crop'),
}));
