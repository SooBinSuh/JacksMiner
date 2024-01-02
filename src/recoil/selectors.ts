/** @format */

import { atom, selector } from "recoil";
import { Block, BoardGeography, BoardLevel } from "../screens/game/types";
import { boardGeographyState } from "./atoms";

export const minesLeftState = selector({
  key: "MinesLeft",
  get: ({ get }) => {
    const boardGeography = get(boardGeographyState);
    return boardGeography.mineTotal - boardGeography.flagTotal;
  },
});

export const areaLeftToSweepState = selector({
  key: "AreaLeftToSweep",
  get: ({ get }) => {
    // const blocks = get(boardState);
    const boardGeography = get(boardGeographyState);
    return (
      boardGeography.widthBlockCount * boardGeography.heightBlockCount -
      boardGeography.mineTotal -
      boardGeography.totalColoredCount
    );
  },
});


