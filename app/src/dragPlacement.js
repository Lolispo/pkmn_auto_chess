// Author: Petter Andersson
// Frontend drag-and-drop placement helpers. Pure resolver + a module-level record of
// the current drag source (set on dragstart, read on drop). No DOM, no Redux here.

let dragSource = null;

export const setDragSource = (source) => { dragSource = source; };
export const getDragSource = () => dragSource;
export const clearDragSource = () => { dragSource = null; };

// Given the dragged tile (source) and the tile it was dropped on (target), decide which
// existing event to fire. Board->hand is a withdraw; every other valid combo is a place
// (hand->board, board->board, hand->hand). Same tile / missing source = none.
// Occupied-target rejection is handled by the Cell (it knows the board), not here.
export function resolveDrop(source, target) {
  if (!source || !target) return { action: 'none' };
  if (source.pos === target.pos && source.isBoard === target.isBoard) return { action: 'none' };
  if (source.isBoard && !target.isBoard) return { action: 'withdraw', from: source.pos };
  return { action: 'place', from: source.pos, to: target.pos };
}
