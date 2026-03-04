export const locationTranslations: Record<string, { en: string, vi: string }> = {
  'Roof': { en: 'Roof', vi: 'Mái nhà' },
  'Foundation': { en: 'Foundation', vi: 'Móng nhà' },
  'Main Pillar': { en: 'Main Pillar', vi: 'Cột chính' },
  'Floor Base': { en: 'Floor Base', vi: 'Nền' },
  'Exterior Wall': { en: 'Exterior Wall', vi: 'Tường bao' },
  'Ceiling': { en: 'Ceiling', vi: 'Trần' },
  'Pillar': { en: 'Pillar', vi: 'Cột' },
  'Load-bearing Beam': { en: 'Load-bearing Beam', vi: 'Dầm chịu lực' },
  'Main Water Pipe': { en: 'Main Water Pipe', vi: 'Ống nước chính' },
  'Technical Shaft': { en: 'Technical Shaft', vi: 'Trục kỹ thuật' },
  'Floor': { en: 'Floor', vi: 'Sàn' },
  'Pillar Rebar': { en: 'Pillar Rebar', vi: 'Cốt thép cột' },
  'Dome Roof': { en: 'Dome Roof', vi: 'Mái vòm' }
};

// Quick helper function you can use in your tooltips/drawers
export const translateLocation = (location: string, lang: 'en' | 'vi') => {
  return locationTranslations[location]?.[lang] || location;
};