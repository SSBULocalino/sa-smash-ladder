export interface Stage {
  id: string;
  name: { es: string; pt: string };
  type: 'starter' | 'counterpick';
}

export const SA_STAGES: Stage[] = [
  { id: 'bf', name: { es: 'Campo de Batalla', pt: 'Campo de Batalha' }, type: 'starter' },
  { id: 'sbf', name: { es: 'Pequeño Campo de Batalla', pt: 'Pequeno Campo de Batalha' }, type: 'starter' },
  { id: 'fd', name: { es: 'Destino Final', pt: 'Destino Final' }, type: 'starter' },
  { id: 'ps2', name: { es: 'Estadio Pokémon 2', pt: 'Estádio Pokémon 2' }, type: 'starter' },
  { id: 'sv', name: { es: 'Pueblo Smash', pt: 'Smashville' }, type: 'starter' },
  { id: 'tc', name: { es: 'Sobrevolando el Pueblo', pt: 'Town & City' }, type: 'counterpick' },
  { id: 'kalos', name: { es: 'Liga Pokémon de Kalos', pt: 'Liga Pokémon de Kalos' }, type: 'counterpick' },
  { id: 'hb', name: { es: 'Bastión Hueco', pt: 'Hollow Bastion' }, type: 'counterpick' },
];
