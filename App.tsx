/** @format */

import { StatusBar } from "expo-status-bar";
import { Children, PropsWithChildren, useEffect, useState } from "react";
import {
  Button,
  Dimensions,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RecoilRoot, atom, useRecoilState } from "recoil";
import { Coordinate, Queue } from "./Queue";

export default () => {
  return (
    <RecoilRoot>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </RecoilRoot>
  );
};

//MARKER: CONSTANTS
const DEFAULT_MINE_LEFT = -1;

//MARKER: Helper Functions
const makeArray = (rows: number, columns: number) => {
  let arr: Block[][] = [];
  for (let i = 0; i < columns; i++) {
    arr.push(
      new Array(rows).fill({
        isSelected: false,
        isBomb: false,
        nearbyBombCount: -1,
      })
    );
  }
  return arr;
};
const copyArray = (array: Block[][]) => {
  let newArray = [];
  for (var i = 0; i < array.length; i++) newArray[i] = array[i].slice();
  return newArray;
};
function replaceItemAtRowColumn<T>(
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

function getRandomInt(maxNum: number) {
  return Math.floor(Math.random() * maxNum);
}

//MARKER: Model
export type Block = {
  isSelected: boolean;
  isBomb: boolean;
  nearbyBombCount: number;
};
const boardState = atom<Block[][]>({
  key: "BoardState",
  default: [],
});
const mineLeftState = atom<number>({
  key: "mineLeft",
  default: DEFAULT_MINE_LEFT,
});

function App() {
  const insets = useSafeAreaInsets();
  const widthBlock = 4; //가로 블록 계수
  const heightBlock = 5; //세로 블록 계수
  const MINECOUNT = 5;

  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;

  const [blocks, setBlocks] = useRecoilState(boardState);
  const [mineLeft, setMineLeft] = useRecoilState(mineLeftState);

  //TODO: move initializing to level selector
  useEffect(() => {
    setBlocks(makeArray(widthBlock, heightBlock));
  }, []);

  const itemWidth = Math.min(
    windowWidth / widthBlock,
    windowHeight / heightBlock
  );

  const onItemPress = (index: number[], item: Block) => {
    if (item.isSelected) {
      console.log("중복 클릭 불가!");
      return;
    }
    console.log("selected idnex:", index);
    ///MINE 초기값이면, 첫 클릭 후 MINE 위치 선정하여 Block update
    if (mineLeft == DEFAULT_MINE_LEFT) {
      const totalBlocks = blocks[0].length * blocks.length;
      const pressedBlockInNumber =
        index[0] * heightBlock + index[1] * widthBlock;
      console.log("pressedblockInNumbers,", pressedBlockInNumber);
      var mines: number[] = [];
      while (mines.length < MINECOUNT) {
        var r = getRandomInt(totalBlocks);
        if (mines.indexOf(r) === -1 && pressedBlockInNumber != r) {
          mines.push(r);
        }
      }
      let copiedArray = [...blocks];
      //1. set mine locations excluding first click position
      for (let i = 0; i < mines.length; i++) {
        const mineRow = ~~(mines[i] / widthBlock);

        const mineCol = mines[i] % widthBlock;
        copiedArray = replaceItemAtRowColumn(copiedArray, mineRow, mineCol, {
          ...copiedArray[mineRow][mineCol],
          isBomb: true,
        });
      }
      const calculatedBombMountedArray = initNumbers(copiedArray);
      // setBlocks(calculatedBombMountedArray);
      const row = index[0];
      const column = index[1];
      flood_fill(calculatedBombMountedArray, row, column);
      setMineLeft(MINECOUNT);
    } else {
      const row = index[0];
      const column = index[1];
      flood_fill(blocks, row, column);
    }

    //calculate block's value
  };
  const isCoordinateInBound = (
    coordinate: Coordinate,
    widthBound: number,
    heightBound: number
  ) => {
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
  };
  const hasAtleastOneFree = (blocks: Block[][], row: number, col: number) => {
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        if (
          !isCoordinateInBound(
            { x: row + i, y: col + j },
            widthBlock,
            heightBlock
          )
        ) {
          console.log('not bound:',row+i,',',col+j);
          continue;
        }
        if (blocks[row + i][col + j].nearbyBombCount == 0) {
          return true;
        }
      }
    }
    return false;
  };
  const flood_fill = (blocks: Block[][], row: number, col: number) => {
    console.log("floodfill: row:", row, "column:", col);
    let queue = new Queue<Coordinate>();
    queue.enqueue({ x: row, y: col });
    console.log("queue:", queue);
    // const newGrid = blocks;

    let newArray: Block[][] = copyArray(blocks);

    while (!queue.isEmpty()) {
      console.log("fill item:", row, ",", col);
      const coordinate = queue.dequeue();
      console.log("current coordinate:", coordinate);
      console.log("queue:", queue);
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
        if (hasAtleastOneFree(newArray, coordinate.x, coordinate.y)){
          if (hasAtleastOneFree(newArray,coordinate.x +1,coordinate.y)){
            queue.enqueue({ x: coordinate.x + 1, y: coordinate.y});
          }
          if (hasAtleastOneFree(newArray,coordinate.x -1,coordinate.y)){
            queue.enqueue({ x: coordinate.x - 1, y: coordinate.y});
          }
          if (hasAtleastOneFree(newArray,coordinate.x ,coordinate.y+1)){
            queue.enqueue({ x: coordinate.x , y: coordinate.y +1});
          }
          if (hasAtleastOneFree(newArray,coordinate.x ,coordinate.y-1)){
            queue.enqueue({ x: coordinate.x, y: coordinate.y - 1});
          }
        }
        
        // queue.enqueue({ x: coordinate.x - 1, y: coordinate.y });
        // queue.enqueue({ x: coordinate.x, y: coordinate.y + 1 });
        // queue.enqueue({ x: coordinate.x, y: coordinate.y - 1 });
        // break;
      } else {
        if (
          coordinate &&
          hasAtleastOneFree(newArray, coordinate.x, coordinate.y)
        ) {
        }
        continue;
      }
    }
    setBlocks(newArray);

    // setBlocks(newGrid);
  };

  const initNumbers = (bombMountedArray: Block[][]) => {
    let newBlocks = bombMountedArray;
    for (let i = 0; i < heightBlock; i++) {
      for (let j = 0; j < widthBlock; j++) {
        const bombCountForCurrentIndex = getNearbyBombCount(bombMountedArray, [
          i,
          j,
        ]);
        // console.log('bombcount:',bombCountForCurrentIndex);
        newBlocks = replaceItemAtRowColumn<Block>(newBlocks, i, j, {
          ...newBlocks[i][j],
          nearbyBombCount: bombCountForCurrentIndex,
        });
      }
    }
    return newBlocks;
  };
  //[1,1]
  const getNearbyBombCount = (bombMountedArray: Block[][], focus: number[]) => {
    let nearbyBombCount: number = 0;
    //9direction search
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        let rowOfCurrentFocus = focus[0] + i;
        let columnOfCurrentFocus = focus[1] + j;
        if (rowOfCurrentFocus == 0 && columnOfCurrentFocus == 0) {
          continue;
        }
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
  };

  // const sweepMine = (row:number,col:number)=>{
  //   const cleanArea = [:]

  // }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.scoreboardContianer}>
          <Text>{mineLeft}</Text>
          <Button
            title="Reset Button"
            onPress={() => {
              // console.log("will reset");
            }}
          />
          <Text>time passed area</Text>
        </View>
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
                <TouchableOpacity
                  disabled={item.isSelected}
                  key={[rowIndex, colIndex].toString()}
                  onPress={() => {
                    onItemPress([rowIndex, colIndex], item);
                  }}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: itemWidth,
                    // minWidth: itemWidth,
                    // maxWidth: itemWidth,
                    height: itemWidth,
                    borderWidth: 1,
                    borderColor: item.isSelected ? "purple" : "#fff",
                    backgroundColor: item.isSelected
                      ? "green"
                      : "rgba(249, 180, 45, 0.25)",
                  }}
                >
                  <Item>
                    <Text>{item.isBomb ? "*" : item.nearbyBombCount}</Text>
                  </Item>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {/* {rows.map((item, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: "row" }}>
              {columns.map((column, colIndex) => (
                <TouchableOpacity
                  key={[rowIndex, colIndex].toString()}
                  onPress={() => {
                    onItemPress([rowIndex,colIndex]);
                  }}
                  style={{
                    minWidth: itemWidth,
                    maxWidth: itemWidth,
                    height: itemWidth,
                  }}
                >
                  <Item
                   
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))} */}
        </View>
      </View>
    </SafeAreaView>
  );
}

type CustomTextProps = {
  style?: StyleProp<ViewStyle>;
};

const Item = ({ style, children }: PropsWithChildren<CustomTextProps>) => {
  return <View style={[style, styles.item]}>{children}</View>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  scoreboardContianer: {
    // flex:0.1,
    height: 40,

    backgroundColor: "gray",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  gameboardContainer: {
    flex: 1,
    // paddingTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: "auto",
    backgroundColor: "lightgray",
  },
  item: {
    flex: 1,
    // minWidth: 100,
    // maxWidth: 100,
    // height: 100,
    justifyContent: "center",
    alignItems: "center",

    // my visual styles; not important for grid
    // padding: 0,
    // backgroundColor: "rgba(249, 180, 45, 0.25)",
  },
});
