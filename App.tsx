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
  Alert,
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
  return false;
}

function makeArray(rows: number, columns: number) {
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
  isFlagged: boolean;
};
type BoardGeography = {
  widthBlockCount: number;
  heightBlockCount: number;
  mineTotal: number;
  flagTotal: number;
  isFreshBoard: boolean;
  level: BoardLevel;
  totalColoredCount: number;
};
const boardState = atom<Block[][]>({
  key: "BoardState",
  default: [],
});
const secondsState = atom({
  key:"Seconds",
  default:0,
})
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
        totalColoredCount:0,
      };
    case BoardLevel.INTERMEDIATE:
      return {
        widthBlockCount: 16,
        heightBlockCount: 16,
        mineTotal: 40,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.INTERMEDIATE,
        totalColoredCount:0,
      };
    case BoardLevel.EXPERT:
      return {
        widthBlockCount: 30,
        heightBlockCount: 16,
        mineTotal: 99,
        flagTotal: 0,
        isFreshBoard: true,
        level: BoardLevel.EXPERT,
        totalColoredCount:0,
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
const areaLeftToSweepState = selector({
  key: "AreaLeftToSweep",
  get:({get})=>{
    // const blocks = get(boardState);
    const boardGeography = get(boardGeographyState);
    return (boardGeography.widthBlockCount * boardGeography.heightBlockCount) - boardGeography.mineTotal - boardGeography.totalColoredCount;
    // for(var i = 0; i < arrToConvert.length; i++)
    // {
    //     newArr = newArr.concat(arrToConvert[i]);
    // }
    
  }
})

function App() {
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [bottomSheet, setbottomSheet] = useRecoilState(bottomSheetState);
  const [seconds, setSeconds] = useRecoilState(secondsState);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (bottomSheet.isVisible) {
      bottomSheetModalRef.current?.present();
    }
  }, [bottomSheet]);

  useEffect(() => {
    resetGame();
  }, []);
  const [boardGeography, setBoardGeography] =
    useRecoilState(boardGeographyState);
  const [blocks, setBlocks] = useRecoilState(boardState);
  const minesLeft = useRecoilValue(minesLeftState);
  const areaLeftToSweep = useRecoilValue(areaLeftToSweepState);

  useEffect(()=>{
    console.log('areaLefttosweep:',areaLeftToSweep);
    if(areaLeftToSweep == 0){
      gameOver(true);
    }
  },[areaLeftToSweep]);
  useEffect(()=>{
    // let interval;
    if (boardGeography.isFreshBoard == false){
      intervalRef.current = setInterval(()=>{
        setSeconds((prevSeconds)=>prevSeconds+1);

      },1000);
    }

    return ()=>clearInterval(intervalRef.current!);
  },[boardGeography.isFreshBoard])

  const itemWidth = Math.min(
    windowWidth / boardGeography.widthBlockCount,
    windowHeight / boardGeography.heightBlockCount
  );

  //MARKER: Intents
  const resetGame = () => {
    setSeconds(0);
    setBoardGeography(getDefaultBoard(boardGeography.level));
    setBlocks(
      makeArray(boardGeography.widthBlockCount, boardGeography.heightBlockCount)
    );
    
  };
  const onItemLongPress = (
    index: number[],
    item: Block,
    boardgeography: BoardGeography
  ) => {
    //TODO: refactor to selector , filtered flagged items
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
  const onItemPress = (
    index: number[],
    item: Block,
    boardGeography: BoardGeography
  ) => {
    if (item.isSelected) {
      return;
    }
    console.log("onItemPress index:", index);
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
      // setBoardGeography({ ...boardGeography, isFreshBoard: false });
    } else {
      const row = index[0];
      const column = index[1];
      if (item.isBomb) {
        console.log("bombed!!");
        gameOver(false);
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
  };
  const gameOver = (isWin: boolean) => {
    clearInterval(intervalRef.current);
    if (isWin) {
      createAlert("승리했습니다!");
    } else {
      createAlert("패배했습니다.");
    }

  };
  const createAlert = (message: string) => {
    Alert.alert("GAME OVER", message, [
      {
        text: "다시하기",
        onPress: () => {
          resetGame();
        },
      },
    ]);
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
    console.log('coloredCount:',coloredCount);
    setBlocks(newArray);
    setBoardGeography({...boardGeography,totalColoredCount:boardGeography.totalColoredCount + coloredCount,isFreshBoard:false});
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
                    resetGame();
                  }}
                />
                <Text>{seconds}</Text>
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
                        disabled={item.isSelected && item.isFlagged == false}
                        key={[rowIndex, colIndex].toString()}
                        onPress={() => {
                          onItemPress(
                            [rowIndex, colIndex],
                            item,
                            boardGeography
                          );
                        }}
                        onLongPress={() => {
                          console.log("on long press!");
                          onItemLongPress(
                            [rowIndex, colIndex],
                            item,
                            boardGeography
                          );
                        }}
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          width: itemWidth,
                          height: itemWidth,
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
