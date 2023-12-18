/** @format */

import { StatusBar } from "expo-status-bar";
import {
  Children,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  Dimensions,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from "recoil";
import { Coordinate, Queue } from "./Queue";
import {
  BottomSheetModalProps,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { CustomText } from "./CustomText";

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
function getNearbyBombCount(
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

function initNumbers(
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

function isCoordinateInBound(
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

function hasAtleastOneFreeBlockExcludingSelf(
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

  // isCoordinateInBound(
  //           { x: row + i, y: col + j },
  //           widthBlock,
  //           heightBlock
  //         )

  return false;
}

// function hasAtleastOneFreeBlockExcludingSelf(
//   blocks: Block[][],
//   selfRow: number,
//   selfCol: number,
//   row: number,
//   col: number,
//   widthBlock: number,
//   heightBlock: number
// ) {
//   for (let i = -1; i < 2; i++) {
//     for (let j = -1; j < 2; j++) {
//       const currRow = row + i;
//       const currCol = row + j;
//       if (
//         !isCoordinateInBound(
//           { x: row + i, y: col + j },
//           widthBlock,
//           heightBlock
//         )
//       ) {
//         console.log("not bound:", row + i, ",", col + j);
//         continue;
//       }

//       if (
//         blocks[row + i][col + j].nearbyBombCount == 0
//       ) {
//         return true;
//       }
//     }
//   }
//   return false;
// }

function makeArray(rows: number, columns: number) {
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
}
function copyArray(array: Block[][]) {
  let newArray = [];
  for (var i = 0; i < array.length; i++) newArray[i] = array[i].slice();
  return newArray;
}
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
enum BoardLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  EXPERT = "Expert",
}
export type Block = {
  isSelected: boolean;
  isBomb: boolean;
  nearbyBombCount: number;
};
type BoardGeography = {
  widthBlockCount: number;
  heightBlockCount: number;
  mineTotal: number;
  flagTotal: number;
  isFreshBoard: boolean;
  level: BoardLevel;
};
const boardState = atom<Block[][]>({
  key: "BoardState",
  default: [],
});
// const mineLeftState = atom<number>({
//   key: "mineLeft",
//   default: DEFAULT_MINE_LEFT,
// });
const bottomSheetState = atom({
  key: "BottomSheetState",
  default: {
    isVisible: false,
    selectedIndex: 0,
  },
});
const boardGeographyState = atom<BoardGeography>({
  key: "BoardGeography",
  default: getDefaultBoard(BoardLevel.BEGINNER),
});
function getDefaultBoard(level: BoardLevel): BoardGeography {
  switch (level) {
    case BoardLevel.BEGINNER:
      return {
        widthBlockCount: 8,
        heightBlockCount: 8,
        mineTotal: 10,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.BEGINNER,
      };
    case BoardLevel.INTERMEDIATE:
      return {
        widthBlockCount: 16,
        heightBlockCount: 16,
        mineTotal: 40,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.INTERMEDIATE,
      };
    case BoardLevel.EXPERT:
      return {
        widthBlockCount: 30,
        heightBlockCount: 16,
        mineTotal: 99,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.EXPERT,
      };
  }
}
const minesLeftState = selector({
  key: "MinesLeft",
  get: ({ get }) => {
    const boardGeography = get(boardGeographyState);
    return boardGeography.mineTotal - boardGeography.flagTotal;
  },
});

function App() {
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [bottomSheet, setbottomSheet] = useRecoilState(bottomSheetState);
  useEffect(() => {
    if (bottomSheet.isVisible) {
      bottomSheetModalRef.current?.present();
    }
  }, [bottomSheet]);
  // const widthBlock = 4; //가로 블록 계수
  // const heightBlock = 5; //세로 블록 계수
  // const MINECOUNT = 5;
  useEffect(() => {
    setBlocks(
      makeArray(boardGeography.widthBlockCount, boardGeography.heightBlockCount)
    );
    // setbottomSheet({...bottomSheet,isVisible:true});
  }, []);
  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;

  const [boardGeography, setBoardGeography] =
    useRecoilState(boardGeographyState);
  const [blocks, setBlocks] = useRecoilState(boardState);
  const minesLeft = useRecoilValue(minesLeftState);
  ///
  // const [mineLeft, setMineLeft] = useRecoilState(mineLeftState);

  const itemWidth = Math.min(
    windowWidth / boardGeography.widthBlockCount,
    windowHeight / boardGeography.heightBlockCount
  );

  //MARKER: Intents
  // const resetGame = () => {

  // };

  const onItemPress = (
    index: number[],
    item: Block,
    boardGeography: BoardGeography
  ) => {
    if (item.isSelected) {
      return;
    }
    ///MINE 초기값이면, 첫 클릭 후 MINE 위치 선정하여 Block updater
    // if (minesLeft == DEFAULT_MINE_LEFT) {
    if (boardGeography.isFreshBoard) {
      console.log("boardgeography:", boardGeography);
      console.log("index:", index);
      const totalBlocks = blocks[0].length * blocks.length;
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
      setBoardGeography({ ...boardGeography, isFreshBoard: false });
    } else {
      const row = index[0];
      const column = index[1];
      flood_fill(
        blocks,
        row,
        column,
        boardGeography.widthBlockCount,
        boardGeography.heightBlockCount
      );
    }
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
        if (newArray[coordinate.x][coordinate.y].nearbyBombCount == 0){
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x + 1,
              coordinate.y + 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x + 1, y: coordinate.y + 1});
          }    
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x - 1,
              coordinate.y - 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x - 1, y: coordinate.y - 1});
          }  
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x + 1,
              coordinate.y - 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x + 1, y: coordinate.y - 1});
          }        
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x - 1,
              coordinate.y + 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x - 1, y: coordinate.y + 1});
          }  

        }
        



        // /else
        {
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x + 1,
              coordinate.y,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x + 1, y: coordinate.y });
          }

          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x - 1,
              coordinate.y,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x - 1, y: coordinate.y });
          }
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x,
              coordinate.y + 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x, y: coordinate.y + 1 });
          }
          if (
            hasAtleastOneFreeBlockExcludingSelf(
              newArray,
              coordinate.x,
              coordinate.y,
              coordinate.x,
              coordinate.y - 1,
              widthBlock,
              heightBlock
            )
          ) {
            queue.enqueue({ x: coordinate.x, y: coordinate.y - 1 });
          }
        }
      } else {
        continue;
      }
    }
    setBlocks(newArray);
  };

  //[1,1]
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        style={{ backgroundColor: "red" }}
        {...props}
        enableTouchThrough={false}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior={"close"}
      />
    ),
    []
  );

  const onBottomSheetChocieTypePressed = (level: BoardLevel) => {
    //if state 올바르지 않은 값 OR 이미 선택한 타입 선택이면 리턴
    setBoardGeography({ ...boardGeography, level: level });
    bottomSheetModalRef.current?.dismiss();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
              <View style={styles.scoreboardContianer}>
                <Text>{minesLeft}</Text>
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
                          onItemPress(
                            [rowIndex, colIndex],
                            item,
                            boardGeography
                          );
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
                          <Text>
                            {item.isBomb ? "*" : item.nearbyBombCount}
                          </Text>
                        </Item>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </SafeAreaView>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            backdropComponent={renderBackdrop}
            snapPoints={["50%"]}
            onDismiss={() => {
              setbottomSheet({ ...bottomSheet, isVisible: false });
            }}
            enablePanDownToClose={true}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "space-evenly",
                paddingVertical: 16,
                alignItems: "flex-start",
                paddingStart: 16,
              }}
            >
              {Object.values(BoardLevel).map((value, index) => (
                <TouchableWithoutFeedback
                  key={index}
                  onPress={() => onBottomSheetChocieTypePressed(value)}
                  style={{ padding: 16 }}
                >
                  <CustomText
                    style={{
                      color: `${
                        boardGeography.level === value ? "blue" : "black"
                      }`,
                    }}
                  >
                    {value}
                  </CustomText>
                </TouchableWithoutFeedback>
              ))}
            </View>
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
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
