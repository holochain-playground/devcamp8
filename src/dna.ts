import {
  SimulatedZome,
  SimulatedDna,
  SimulatedHappBundle,
} from '@holochain-playground/core';

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
  ],
  zome_functions: {
    create_game_code_anchor: {
      call:
        hdk =>
        async ({ short_unique_code }) => {
          await hdk.create_entry({
            content: short_unique_code,
            entry_def_id: 'game_code',
          });
          await hdk.create_entry({
            content: 'ALL_GAME_CODES',
            entry_def_id: 'anchor',
          });
          const anchorHash = await hdk.hash_entry({
            content: 'ALL_GAME_CODES',
          });

          const gameCodeHash = await hdk.hash_entry({
            content: short_unique_code,
          });

          await hdk.create_link({
            base: anchorHash,
            target: gameCodeHash,
            tag: null,
          });

          return gameCodeHash;
        },
      arguments: [{ name: 'short_unique_code', type: 'string' }],
    },
    join_game_with_code: {
      call:
        hdk =>
        async ({ nickname, game_code }) => {
          const gameCodeHash = await hdk.hash_entry({
            content: game_code,
          });
          const info = await hdk.agent_info();
          const playerProfile = {
            player_id: info.agent_initial_pubkey,
            nickname,
          };

          await hdk.create_entry({
            content: playerProfile,
            entry_def_id: 'player_profile',
          });
          const playerProfileHash = await hdk.hash_entry({
            content: playerProfile,
          });
          await hdk.create_link({
            base: gameCodeHash,
            target: playerProfileHash,
            tag: null,
          });
          return playerProfileHash;
        },
      arguments: [
        { name: 'nickname', type: 'string' },
        { name: 'game_code', type: 'string' },
      ],
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
