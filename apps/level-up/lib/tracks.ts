import type { Track } from './types';
export const tracks: Track[] = [
  {
    id: 'ba',
    category: 'career',
    name: { az: 'Business Analyst', en: 'Business Analyst' },
    description: {
      az: 'Problemləri anla. Düzgün həlli qur.',
      en: 'Understand problems. Shape better solutions.',
    },
    color: '#d97757',
  },
  {
    id: 'po',
    category: 'career',
    name: { az: 'Product Owner', en: 'Product Owner' },
    description: {
      az: 'Dəyəri kəşf et. Məhsulunu irəli apar.',
      en: 'Discover value. Move your product forward.',
    },
    color: '#668578',
  },
  ...(['ecba', 'ccba', 'cbap', 'pspo1', 'pspo2', 'pspo3'] as const).map((id, i) => ({
    id,
    category: 'certification' as const,
    name: {
      az: ['ECBA', 'CCBA', 'CBAP', 'PSPO I', 'PSPO II', 'PSPO III'][i],
      en: ['ECBA', 'CCBA', 'CBAP', 'PSPO I', 'PSPO II', 'PSPO III'][i],
    },
    description: {
      az: 'Orijinal məşq sualları və öyrənmə planı',
      en: 'Original practice questions and a guided study plan',
    },
    color: i < 3 ? '#9c80b3' : '#6b8da5',
  })),
];
export function getTrack(id: string) {
  return tracks.find((t) => t.id === id) ?? tracks[0];
}
