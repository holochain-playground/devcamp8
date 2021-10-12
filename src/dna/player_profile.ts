import { Hdk } from '@holochain-playground/core';
import { create_game_code_anchor, get_game_code_anchor } from './game_code';

export const create_and_hash_entry_player_profile =
  (hdk: Hdk.Hdk) => async (nickname: string) => {
    const info = await hdk.agent_info();
    const playerProfile = {
      player_id: info.agent_initial_pubkey,
      nickname,
    };

    await hdk.create_entry({
      content: playerProfile,
      entry_def_id: 'player_profile',
    });
    return hdk.hash_entry({
      content: playerProfile,
    });
  };

export const join_game_with_code =
  (hdk: Hdk.Hdk) => async (gameCode: string, nickname: string) => {
    const gameCodeHash = await create_game_code_anchor(hdk)(gameCode);

    const playerProfileHash = await create_and_hash_entry_player_profile(hdk)(
      nickname
    );

    await hdk.create_link({
      base: gameCodeHash,
      target: playerProfileHash,
      tag: null,
    });
    return playerProfileHash;
  };

export const get_player_profiles_for_game_code =
  (hdk: Hdk.Hdk) => async (game_code: string) => {
    const anchor = await get_game_code_anchor(hdk)(game_code);

    const links = await hdk.get_links(anchor);

    if (!links) return [];

    const players = [];
    for (const link of links) {
      const element = await hdk.get(link.target);

      if (element) {
        players.push(element.entry?.content);
      }
    }
    return players;
  };
