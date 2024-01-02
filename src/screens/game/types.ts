/** @format */


export type Block = {
  isSelected: boolean;
  isBomb: boolean;
  nearbyBombCount: number;
  isFlagged: boolean;
};

export type BoardGeography = {
  widthBlockCount: number;
  heightBlockCount: number;
  mineTotal: number;
  flagTotal: number;
  isFreshBoard: boolean;
  level: BoardLevel;
  totalColoredCount: number;
};


export enum BoardLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  EXPERT = "Expert",
}


export function getDefaultBoard(level: BoardLevel): BoardGeography {
  switch (level) {
    case BoardLevel.BEGINNER:
      return {
        widthBlockCount: 8,
        heightBlockCount: 8,
        mineTotal: 10,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.BEGINNER,
        totalColoredCount: 0,
      };
    case BoardLevel.INTERMEDIATE:
      return {
        widthBlockCount: 10,
        heightBlockCount: 14,
        mineTotal: 40,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.INTERMEDIATE,
        totalColoredCount: 0,
      };
    case BoardLevel.EXPERT:
      return {
        widthBlockCount: 14,
        heightBlockCount: 32,
        mineTotal: 99,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.EXPERT,
        totalColoredCount: 0,
      };
  }
}