/** @format */

import { Alert, Dimensions, StyleProp, TextStyle, View, ViewStyle,Text } from "react-native";
import { useRecoilState } from "recoil";

import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { boardGeographyState, boardState } from "../../recoil/atoms";
import { Block, BoardGeography, BoardLevel } from "./types";
import { getRandomInt } from "../../util/helpers";
import { Coordinate, Queue } from "../../util/types";
import React, { PropsWithChildren } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";


export const Board = () => {
  const [blocks, setBlocks] = useRecoilState(boardState);
  const [boardGeography, setBoardGeography] =
    useRecoilState(boardGeographyState);

  const onItemPress = (
    index: number[],
    item: Block,
    boardGeography: BoardGeography
  ) => {
    if (item.isSelected) {
      return;
    }
    const startTime = performance.now();

    console.log("onItemPress index:", index);
    ///MINE 초기값이면, 첫 클릭 후 MINE 위치 선정하여 Block updater
    // if (minesLeft == DEFAULT_MINE_LEFT) {
    if (boardGeography.isFreshBoard) {
      console.log("boardgeography:", boardGeography);
      console.log("index:", index);
      //   const totalBlocks = blocks[0].length * blocks.length;
      const totalBlocks =
        boardGeography.widthBlockCount * boardGeography.heightBlockCount;

      const pressedBlockInNumber =
        index[0] * boardGeography.widthBlockCount + index[1];
      console.log("pressedBlock:", pressedBlockInNumber);
      var mines: number[] = [];
      while (mines.length < boardGeography.mineTotal) {
        var r = getRandomInt(totalBlocks);
        if (mines.indexOf(r) === -1 && pressedBlockInNumber != r) {
          mines.push(r);
        }
      }
      let copiedArray = [...blocks];
      //1. set mine locations excluding first click position
      for (let i = 0; i < mines.length; i++) {
        const mineRow = ~~(mines[i] / boardGeography.widthBlockCount);

        const mineCol = mines[i] % boardGeography.widthBlockCount;
        copiedArray = replaceItemAtRowColumn(copiedArray, mineRow, mineCol, {
          ...copiedArray[mineRow][mineCol],
          isBomb: true,
        });
      }
      const calculatedBombMountedArray = initNumbers(
        copiedArray,
        boardGeography.widthBlockCount,
        boardGeography.heightBlockCount
      );

      const row = index[0];
      const column = index[1];
      flood_fill(
        calculatedBombMountedArray,
        row,
        column,
        boardGeography.widthBlockCount,
        boardGeography.heightBlockCount
      );
      // setBoardGeography({ ...boardGeography, isFreshBoard: false });
    } else {
      const row = index[0];
      const column = index[1];
      if (item.isBomb) {
        console.log("bombed!!");
        // gameOver(false);
      } else {
        flood_fill(
          blocks,
          row,
          column,
          boardGeography.widthBlockCount,
          boardGeography.heightBlockCount
        );
      }
    }
    var endTime = performance.now();
    console.log("Call onItemPress took ", endTime - startTime, "milli sec");
  };



  const flood_fill = (
    blocks: Block[][],
    row: number,
    col: number,
    widthBlock: number,
    heightBlock: number
  ) => {
    console.log("floodfill: row:", row, "column:", col);
    let queue = new Queue<Coordinate>();
    queue.enqueue({ x: row, y: col });
    // const newGrid = blocks;
    let newArray: Block[][] = copyArray(blocks);
    let coloredCount = 0;
    while (!queue.isEmpty()) {
      const coordinate = queue.dequeue();

      if (
        coordinate &&
        isCoordinateInBound(coordinate, widthBlock, heightBlock) &&
        !newArray[coordinate.x][coordinate.y].isBomb &&
        !newArray[coordinate.x][coordinate.y].isSelected
      ) {
        {
          newArray = replaceItemAtRowColumn<Block>(
            newArray,
            coordinate.x,
            coordinate.y,
            { ...newArray[coordinate.x][coordinate.y], isSelected: true }
          );
        }
        coloredCount++;

        const diagonal = [
          [1, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
        ];
        const cross = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ];
        // 자신이 '0' 짜리면 대각선 enqueue.
        if (newArray[coordinate.x][coordinate.y].nearbyBombCount == 0) {
          for (let i = 0; i < diagonal.length; i++) {
            if (
              hasAtleastOneFreeBlockExcludingSelf(
                newArray,
                coordinate.x,
                coordinate.y,
                coordinate.x + diagonal[i][0],
                coordinate.y + diagonal[i][1],
                widthBlock,
                heightBlock
              )
            ) {
              queue.enqueue({
                x: coordinate.x + diagonal[i][0],
                y: coordinate.y + diagonal[i][1],
              });
            }
          }
        }
        //공통적으로 십자 모양으로 enqueue
        for (let i = 0; i < cross.length; i++) {
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x + cross[i][0],
              coordinate.y + cross[i][1],
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({
              x: coordinate.x + cross[i][0],
              y: coordinate.y + cross[i][1],
            });
          }
        }
      } else {
        continue;
      }
    }
    console.log("coloredCount:", coloredCount);
    setBlocks(newArray);
    setBoardGeography({
      ...boardGeography,
      totalColoredCount: boardGeography.totalColoredCount + coloredCount,
      isFreshBoard: false,
    });
  };

  const onItemLongPress = (
    index: number[],
    item: Block,
    boardgeography: BoardGeography
  ) => {
    if (item.isFlagged) {
      setBoardGeography({
        ...boardGeography,
        flagTotal: boardgeography.flagTotal - 1,
      });
    } else {
      setBoardGeography({
        ...boardGeography,
        flagTotal: boardgeography.flagTotal + 1,
      });
    }

    setBlocks(
      replaceItemAtRowColumn(blocks, index[0], index[1], {
        ...blocks[index[0]][index[1]],
        isFlagged: !item.isFlagged,
        isSelected: !item.isSelected,
      })
    );
  };
  const insets = useSafeAreaInsets();

  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;

    
  const itemWidth = () =>
  Math.min(
    windowWidth / boardGeography.widthBlockCount,
    windowHeight / boardGeography.heightBlockCount
  );

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        backgroundColor: "lightgray",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {blocks.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row" }}>
          {row.map((item, colIndex) => (
            <TouchableWithoutFeedback
              disabled={item.isSelected && item.isFlagged == false}
              key={[rowIndex, colIndex].toString()}
              onPress={() => {
                // requestAnimationFrame(()=>{
                onItemPress([rowIndex, colIndex], item, boardGeography);
                // })
              }}
              onLongPress={() => {
                console.log("on long press!");
                onItemLongPress([rowIndex, colIndex], item, boardGeography);
              }}
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: itemWidth(),
                height: itemWidth(),
                borderWidth: 1,
                borderColor: item.isSelected ? "purple" : "#fff",
                backgroundColor: item.isSelected
                  ? item.isFlagged
                    ? "rgba(249, 180, 45, 0.25)"
                    : "lightgreen"
                  : "rgba(249, 180, 45, 0.25)",
              }}
            >
              <Item>
                <Text>
                  {item.isSelected
                    ? item.isFlagged
                      ? "🚩"
                      : item.isBomb
                      ? "*"
                      : item.nearbyBombCount
                    : ""}
                </Text>
              </Item>
            </TouchableWithoutFeedback>
          ))}
        </View>
      ))}
    </View>
  );
};
const Item = ({ style, children }: PropsWithChildren<CustomTextProps>) => {
  return <View style={[style, styles.item]}>{children}</View>;
};
export type CustomTextProps = {

  style?: StyleProp<TextStyle | ViewStyle>,
}







export function getNearbyBombCount(
  bombMountedArray: Block[][],
  focus: number[],
  widthBlock: number,
  heightBlock: number
) {
  let nearbyBombCount: number = 0;
  //8direction search
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      let rowOfCurrentFocus = focus[0] + i;
      let columnOfCurrentFocus = focus[1] + j;
      if (
        !isCoordinateInBound(
          { x: rowOfCurrentFocus, y: columnOfCurrentFocus },
          widthBlock,
          heightBlock
        )
      ) {
        continue;
      }
      if (
        bombMountedArray[rowOfCurrentFocus][columnOfCurrentFocus].isBomb ===
        true
      ) {
        nearbyBombCount++;
      }
    }
  }
  return nearbyBombCount;
}

//해당 좌표가 Frame 내에 위치하는지 판별
export function isCoordinateInBound(
  coordinate: Coordinate,
  widthBound: number,
  heightBound: number
) {
  if (
    coordinate.x < 0 ||
    coordinate.y < 0 ||
    coordinate.x >= heightBound ||
    coordinate.y >= widthBound
  ) {
    return false;
  } else {
    return true;
  }
}

export function hasAtleastOneFreeBlockExcludingSelf(
  blocks: Block[][],
  selfRow: number,
  selfCol: number,
  row: number,
  col: number,
  widthBlock: number,
  heightBlock: number
) {
  if (
    isCoordinateInBound({ x: row, y: col }, widthBlock, heightBlock) &&
    isCoordinateInBound({ x: selfRow, y: selfCol }, widthBlock, heightBlock)
  ) {
    if (
      blocks[row][col].nearbyBombCount == 0 ||
      blocks[selfRow][selfCol].nearbyBombCount == 0
    ) {
      return true;
    }
  }
  return false;
}



export function makeGame(rows: number, columns: number) {
    let arr: Block[][] = [];
    for (let i = 0; i < columns; i++) {
      arr.push(
        new Array(rows).fill({
          isSelected: false,
          isBomb: false,
          nearbyBombCount: -1,
          isFlagged: false,
        })
      );
    }
    return arr;
  }
  export function copyArray(array: Block[][]) {
    let newArray = [];
    for (var i = 0; i < array.length; i++) {
      newArray[i] = array[i].slice();
    }
      
    return newArray;
  }
  export function replaceItemAtRowColumn<T>(
    arr: T[][],
    row: number,
    column: number,
    newValue: T
  ) {
    let newRow = [
      ...arr[row].slice(0, column),
      newValue,
      ...arr[row].slice(column + 1),
    ];
    let newArray = [...arr.slice(0, row), newRow, ...arr.slice(row + 1)];
    return newArray;
  }
  
  
  
export function initNumbers(
    bombMountedArray: Block[][],
    widthBlock: number,
    heightBlock: number
  ) {
    let newBlocks = bombMountedArray;
    for (let i = 0; i < heightBlock; i++) {
      for (let j = 0; j < widthBlock; j++) {
        const bombCountForCurrentIndex = getNearbyBombCount(
          bombMountedArray,
          [i, j],
          widthBlock,
          heightBlock
        );
        newBlocks = replaceItemAtRowColumn<Block>(newBlocks, i, j, {
          ...newBlocks[i][j],
          nearbyBombCount: bombCountForCurrentIndex,
        });
      }
    }
    return newBlocks;
  }
  