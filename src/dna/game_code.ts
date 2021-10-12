import { Hdk } from '@holochain-playground/core';

export const get_game_code_anchor = (hdk: Hdk.Hdk) => (game_code: string) =>
  hdk.hash_entry({
    content: game_code,
  });

export const create_game_code_anchor =
  (hdk: Hdk.Hdk) => async (game_code: string) => {
    await hdk.create_entry({
      content: game_code,
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
      content: game_code,
    });

    await hdk.create_link({
      base: anchorHash,
      target: gameCodeHash,
      tag: null,
    });

    return gameCodeHash;
  };
