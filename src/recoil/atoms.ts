import { atom } from "recoil";
import { Block, BoardGeography, BoardLevel, getDefaultBoard } from "../screens/game/types";

export const boardState = atom<Block[][]>({
    key: "BoardState",
    default: [],
  });
  
  export const secondsState = atom({
    key: "Seconds",
    default: 0,
  });
  
  export const bottomSheetState = atom({
    key: "BottomSheetState",
    default: {
      isVisible: false,
    },
  });
  export const boardGeographyState = atom<BoardGeography>({
    key: "BoardGeography",
    default: getDefaultBoard(BoardLevel.BEGINNER),
  });
  