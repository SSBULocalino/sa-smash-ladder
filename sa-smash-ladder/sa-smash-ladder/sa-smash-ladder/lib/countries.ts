import type { CountryCode } from './matchmaking';
export const COUNTRIES: { code: CountryCode; flag: string; name: { es: string; pt: string } }[] = [
  { code: 'AR', flag: '🇦🇷', name: { es: 'Argentina', pt: 'Argentina' } },
  { code: 'BO', flag: '🇧🇴', name: { es: 'Bolivia', pt: 'Bolívia' } },
  { code: 'BR', flag: '🇧🇷', name: { es: 'Brasil', pt: 'Brasil' } },
  { code: 'CL', flag: '🇨🇱', name: { es: 'Chile', pt: 'Chile' } },
  { code: 'CO', flag: '🇨🇴', name: { es: 'Colombia', pt: 'Colômbia' } },
  { code: 'EC', flag: '🇪🇨', name: { es: 'Ecuador', pt: 'Equador' } },
  { code: 'PY', flag: '🇵🇾', name: { es: 'Paraguay', pt: 'Paraguai' } },
  { code: 'PE', flag: '🇵🇪', name: { es: 'Perú', pt: 'Peru' } },
  { code: 'UY', flag: '🇺🇾', name: { es: 'Uruguay', pt: 'Uruguai' } },
  { code: 'VE', flag: '🇻🇪', name: { es: 'Venezuela', pt: 'Venezuela' } },
];
export const flagOf = (c: string) => COUNTRIES.find((x) => x.code === c)?.flag ?? '🏳️';
