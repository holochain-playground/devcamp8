import {
  SimulatedZome,
  SimulatedDna,
  SimulatedHappBundle,
} from '@holochain-playground/core';
import { create_game_code_anchor } from './game_code';
import { new_move } from './game_move';
import { try_to_close_round } from './game_round';
import {
  get_my_own_sessions_via_source_query,
  start_game_session_with_code,
} from './game_session';
import {
  get_player_profiles_for_game_code,
  join_game_with_code,
} from './player_profile';

export const gameLogicZome: SimulatedZome = {
  name: 'game_logic',
  entry_defs: [
    {
      id: 'anchor',
      visibility: 'Public',
    },
    {
      id: 'game_code',
      visibility: 'Public',
    },
    {
      id: 'player_profile',
      visibility: 'Public',
    },
    {
      id: 'game_session',
      visibility: 'Public',
    },
    {
      id: 'game_round',
      visibility: 'Public',
    },
    {
      id: 'game_move',
      visibility: 'Public',
    },
  ],
  zome_functions: {
    create_game_code_anchor: {
      call:
        hdk =>
        async ({ short_unique_code }) =>
          create_game_code_anchor(hdk)(short_unique_code),
      arguments: [{ name: 'short_unique_code', type: 'string' }],
    },
    join_game_with_code: {
      call:
        hdk =>
        async ({ nickname, game_code }) =>
          join_game_with_code(hdk)(game_code, nickname),
      arguments: [
        { name: 'nickname', type: 'string' },
        { name: 'game_code', type: 'string' },
      ],
    },
    get_players_for_game_code: {
      call:
        hdk =>
        async ({ short_unique_code }) =>
          get_player_profiles_for_game_code(hdk)(short_unique_code),
      arguments: [{ name: 'short_unique_code', type: 'string' }],
    },
    start_game_session_with_code: {
      call:
        hdk =>
        async ({ game_code }) =>
          start_game_session_with_code(hdk)(game_code),
      arguments: [{ name: 'game_code', type: 'string' }],
    },
    get_my_owned_sessions: {
      call: hdk => async () => get_my_own_sessions_via_source_query(hdk)(),
      arguments: [],
    },
    make_new_move: {
      call:
        hdk =>
        async ({ round_entry_hash, resource_amount }) =>
          new_move(hdk)(resource_amount, round_entry_hash),
      arguments: [
        {
          name: 'round_entry_hash',
          type: 'string',
        },
        {
          name: 'resource_amount',
          type: 'number',
        },
      ],
    },
    try_to_close_round: {
      call:
        hdk =>
        async ({ round_hash }) =>
          try_to_close_round(hdk)(round_hash),
      arguments: [{ name: 'round_hash', type: 'string' }],
    },
  },
  validation_functions: {},
};

export function dna(): SimulatedDna {
  const zomes = [gameLogicZome];
  return {
    properties: {},
    uid: '',
    zomes,
  };
}

export function happ(): SimulatedHappBundle {
  return {
    name: 'tragedy-of-commons',
    description: '',
    slots: {
      default: {
        dna: dna(),
        deferred: false,
      },
    },
  };
}
