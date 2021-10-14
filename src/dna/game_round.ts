import { EntryHashB64 } from '@holochain-open-dev/core-types';
import { Hdk } from '@holochain-playground/core';
import { GameMove, get_moves_for_round } from './game_move';
import { GameParams, GameSession, PlayerStats } from './game_session';

export interface RoundState {
  resources_left: number;
  resources_taken: number;
  resources_grown: number;
  player_stats: {};
}

export interface GameRound {
  round_num: number;
  session: EntryHashB64;
  state: RoundState;
}

export const try_to_close_round =
  (hdk: Hdk.Hdk) => async (round_hash: EntryHashB64) => {
    const round_element = await hdk.get(round_hash);

    if (!round_element) throw new Error("Couldn't get the round element");

    const round: GameRound = round_element?.entry?.content;

    const session_element = await hdk.get(round.session);

    const session: GameSession = session_element?.entry?.content;

    const moves = await get_moves_for_round(hdk)(round_hash);

    const movesByPlayer: { [key: string]: GameMove | undefined } =
      session.players.reduce(
        (acc, next) => ({ ...acc, [next]: undefined }),
        {}
      );

    for (const move of moves) {
      if (movesByPlayer[move.owner])
        throw new Error('This agent made two moves in this round');

      movesByPlayer[move.owner] = move;
    }

    if (Object.values(movesByPlayer).find(m => m === undefined))
      return 'Not all players have made their move; wait until they have';

    const newState = calculateRoundState(round, session.game_params, moves);

    const newRound: GameRound = {
      round_num: round.round_num + 1,
      session: round.session,
      state: newState,
    };

    await hdk.update_entry(round_element.signed_header.header.hash, {
      content: newRound,
      entry_def_id: 'game_round',
    });

    const newRoundHash = await hdk.hash_entry({
      content: newRound,
    });

    return newRoundHash;
  };

function calculateRoundState(
  last_round: GameRound,
  params: GameParams,
  player_moves: Array<GameMove>
): RoundState {
  const resources_taken = player_moves
    .map(m => m.resource_amount)
    .reduce((acc, next) => acc + next, 0);

  const resources_left =
    params.regeneration_factor * last_round.state.resources_left -
    resources_taken;

  const resources_grown =
    params.regeneration_factor * last_round.state.resources_left -
    last_round.state.resources_left;

  const new_stats = playerStatsFromMoves(
    last_round.state.player_stats,
    player_moves
  );
  return {
    player_stats: new_stats,
    resources_grown,
    resources_left,
    resources_taken,
  };
}

function playerStatsFromMoves(
  previousStats: PlayerStats,
  newMoves: Array<GameMove>
): PlayerStats {
  const newStats: { [key: string]: number } = {};

  for (const move of newMoves) {
    const previousStat = previousStats[move.owner] || 0;
    newStats[move.owner] = previousStat + move.resource_amount;
  }

  return newStats;
}
