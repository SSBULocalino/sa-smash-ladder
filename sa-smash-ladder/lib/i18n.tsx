'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'pt';
const es = {
  login_title: 'El ladder sudamericano de Smash Ultimate', login_sub: 'Entra con Discord, busca rival y sube en el ranking.',
  login_btn: 'Entrar con Discord', signout: 'Salir',
  ob_title: 'Crea tu perfil', ob_tag: 'Smash Tag', ob_country: 'País', ob_lan: 'Tengo adaptador LAN',
  ob_cross: 'Acepto partidas interregionales (Cross-Region)', ob_cross_hint: 'Más rivales, pero mayor latencia.',
  ob_save: 'Guardar y entrar',
  search: 'Buscar partida', searching: 'Buscando rival…', cancel: 'Cancelar búsqueda', in_queue: 'En cola',
  queue_empty: 'Nadie en cola todavía.', leaderboard: 'Clasificación', global: 'Global', player: 'Jugador', record: 'V-D',
  rps_title: 'Piedra, papel o tijera', rps_sub: 'El ganador banea primero.', rock: 'Piedra', paper: 'Papel', scissors: 'Tijera',
  waiting_opp: 'Esperando al rival…', ban_turn: 'Tu turno: banea {n}', pick_turn: 'Elige el escenario', opp_turn: 'Turno de {name}',
  game: 'Juego', arena_title: 'Arena de Switch', arena_id: 'ID de arena', arena_pass: 'Contraseña', arena_save: 'Compartir',
  stage: 'Escenario', report: 'Reportar resultado', i_won: 'Gané', i_lost: 'Perdí',
  reported: 'Reportaste. Esperando al rival.', call_mod: 'Llamar a Mod',
  disputed: 'Partida en disputa. Un moderador revisará el caso.', completed: 'Ganó {name}', back: 'Volver al dashboard',
  banned: 'Baneado', err: 'Algo falló. Intenta de nuevo.',
};
const pt: Record<keyof typeof es, string> = {
  login_title: 'O ladder sul-americano de Smash Ultimate', login_sub: 'Entre com o Discord, ache um rival e suba no ranking.',
  login_btn: 'Entrar com Discord', signout: 'Sair',
  ob_title: 'Crie seu perfil', ob_tag: 'Smash Tag', ob_country: 'País', ob_lan: 'Tenho adaptador LAN',
  ob_cross: 'Aceito partidas inter-regionais (Cross-Region)', ob_cross_hint: 'Mais rivais, mas maior latência.',
  ob_save: 'Salvar e entrar',
  search: 'Buscar partida', searching: 'Procurando rival…', cancel: 'Cancelar busca', in_queue: 'Na fila',
  queue_empty: 'Ninguém na fila ainda.', leaderboard: 'Classificação', global: 'Global', player: 'Jogador', record: 'V-D',
  rps_title: 'Pedra, papel ou tesoura', rps_sub: 'O vencedor bana primeiro.', rock: 'Pedra', paper: 'Papel', scissors: 'Tesoura',
  waiting_opp: 'Aguardando o rival…', ban_turn: 'Sua vez: bana {n}', pick_turn: 'Escolha o cenário', opp_turn: 'Vez de {name}',
  game: 'Jogo', arena_title: 'Arena do Switch', arena_id: 'ID da arena', arena_pass: 'Senha', arena_save: 'Compartilhar',
  stage: 'Cenário', report: 'Reportar resultado', i_won: 'Ganhei', i_lost: 'Perdi',
  reported: 'Você reportou. Aguardando o rival.', call_mod: 'Chamar Mod',
  disputed: 'Partida em disputa. Um moderador vai analisar o caso.', completed: '{name} venceu', back: 'Voltar ao dashboard',
  banned: 'Banido', err: 'Algo deu errado. Tente novamente.',
};
const dict = { es, pt };
export type Key = keyof typeof es;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key, v?: Record<string, string | number>) => string };
const I18n = createContext<Ctx>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setL] = useState<Lang>('es');
  useEffect(() => {
    const s = localStorage.getItem('lang');
    if (s === 'es' || s === 'pt') setL(s);
  }, []);
  const setLang = (l: Lang) => { setL(l); localStorage.setItem('lang', l); document.documentElement.lang = l; };
  const t = useCallback((k: Key, v: Record<string, string | number> = {}) =>
    Object.entries(v).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), dict[lang][k]), [lang]);
  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);
