import { AgentPubKeyB64, EntryHashB64 } from '@holochain-open-dev/core-types';
import { Hdk } from '@holochain-playground/core';

export interface GameMove {
  owner: AgentPubKeyB64;
  resource_amount: number;
  round_hash: EntryHashB64;
}

export const new_move =
  (hdk: Hdk.Hdk) =>
  async (resource_amount: number, round_hash: EntryHashB64) => {
    const agent_info = await hdk.agent_info();

    const move: GameMove = {
      resource_amount,
      round_hash,
      owner: agent_info.agent_latest_pubkey,
    };

    await hdk.create_entry({
      content: move,
      entry_def_id: 'game_move',
    });

    const move_hash = await hdk.hash_entry({ content: move });

    return hdk.create_link({
      base: round_hash,
      target: move_hash,
      tag: 'ROUND_MOVE',
    });
  };

export const get_moves_for_round =
  (hdk: Hdk.Hdk) =>
  async (round_hash: EntryHashB64): Promise<GameMove[]> => {
    const links = await hdk.get_links(round_hash);

    if (!links) return [];

    const movesPromises = links.map(link => hdk.get(link.target));

    const moves = await Promise.all(movesPromises);

    return moves.map(m => m?.entry?.content);
  };
