import { Hdk } from '@holochain-playground/core';
import { isEqual } from 'lodash-es';

import {
  AgentPubKeyB64,
  EntryHashB64,
  NewEntryHeader,
} from '@holochain-open-dev/core-types';
import { get_game_code_anchor } from './game_code';
import { get_player_profiles_for_game_code } from './player_profile';
import { GameRound } from './game_round';

export interface GameParams {
  regeneration_factor: number;
  start_amount: number;
  num_rounds: number;
}

export type ResourceAmount = number;
export type PlayerStats = { [player: AgentPubKeyB64]: ResourceAmount };

export type SessionState =
  | { state: 'InProgress' }
  | { state: 'Lost'; last_round: EntryHashB64 }
  | { state: 'Finished'; last_round: EntryHashB64 };

export interface GameSession {
  owner: AgentPubKeyB64; // who started the game
  status: SessionState; // how the game is going
  game_params: GameParams; // what specific game are we playing
  players: Array<AgentPubKeyB64>; // who is playing
  scores: PlayerStats; // end scores
  anchor: EntryHashB64; // game code anchor that identifies this game
}

export const new_session =
  (hdk: Hdk.Hdk) =>
  async (
    players: Array<AgentPubKeyB64>,
    game_params: GameParams,
    anchor: EntryHashB64
  ) => {
    const agent_info = await hdk.agent_info();

    const game_session: GameSession = {
      anchor,
      owner: agent_info.agent_initial_pubkey,
      status: { state: 'InProgress' },
      players,
      scores: {},
      game_params,
    };

    await hdk.create_entry({
      content: game_session,
      entry_def_id: 'game_session',
    });

    const hash = await hdk.hash_entry({ content: game_session });

    await hdk.create_link({
      base: agent_info.agent_initial_pubkey,
      target: hash,
      tag: 'MY_GAMES',
    });

    await hdk.create_link({
      base: anchor,
      target: hash,
      tag: 'GAME_SESSION',
    });

    // Start round 0 directly

    const gameRound: GameRound = {
      round_num: 0,
      session: hash,
      state: {
        resources_left: 100,
        player_stats: {},
        resources_grown: 0,
        resources_taken: 0,
      },
    };

    await hdk.create_entry({
      content: gameRound,
      entry_def_id: 'game_round',
    });

    const round_hash = await hdk.hash_entry({
      content: gameRound,
    });

    await hdk.create_link({
      base: hash,
      target: round_hash,
      tag: 'SESSION_ROUND',
    });

    return round_hash;
  };

export const start_game_session_with_code =
  (hdk: Hdk.Hdk) => async (game_code: string) => {
    const anchor = await get_game_code_anchor(hdk)(game_code);
    const players = await get_player_profiles_for_game_code(hdk)(game_code);

    const params: GameParams = {
      num_rounds: 3,
      regeneration_factor: 1.1,
      start_amount: 100,
    };

    return new_session(hdk)(players, params, anchor);
  };

export const get_my_own_sessions_via_source_query =
  (hdk: Hdk.Hdk) => async () => {
    const results = await hdk.query({});

    const sessions_elements = results.filter(element =>
      isEqual(
        (element.signed_header.header.content as NewEntryHeader).entry_type,
        {
          App: {
            id: 3,
            zome_id: 0,
            visibility: 'Public',
          },
        }
      )
    );

    const list_of_tuples: Array<[EntryHashB64, GameSession]> = [];

    for (const session_element of sessions_elements) {
      const { entry_hash } = session_element.signed_header.header
        .content as NewEntryHeader;
      const entry = session_element.entry?.content;
      list_of_tuples.push([entry_hash, entry]);
    }
    return list_of_tuples;
  };
