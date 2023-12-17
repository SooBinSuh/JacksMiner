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
  let arr:Block[][] = [];
  for (let i = 0; i < columns; i++) {
    arr.push(new Array(rows).fill({ isSelected: false,isBomb:false }));
  }
  return arr;
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

function getRandomInt(maxNum:number) {
  return Math.floor(Math.random() * maxNum);
}


//MARKER: Model
export type Block = {
  isSelected: boolean;
  isBomb:boolean;
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
  const heightBlock = 4; //세로 블록 계수
  const MINECOUNT = 3;

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

    ///MINE 초기값이면, 첫 클릭 후 MINE 위치 선정하여 Block update
    if (mineLeft == DEFAULT_MINE_LEFT) {
      setMineLeft(MINECOUNT);
      const totalBlocks = blocks[0].length * blocks.length;
      console.log('totlablocks,',totalBlocks);
      var mines:number[] = [];
      while(mines.length < MINECOUNT){
        var r = getRandomInt(totalBlocks);
        if(mines.indexOf(r) === -1){
          mines.push(r);
        }
      }

      let copiedArray = [...blocks];
      //1. set mine locations excluding first click position
      for (let i = 0; i < mines.length; i++) {
        const mineRow = ~~(mines[i]/widthBlock);
        const mineCol = mines[i] % heightBlock;
        copiedArray = replaceItemAtRowColumn(copiedArray,mineRow,mineCol,{...copiedArray[mineRow][mineCol],isBomb:true});
      }
      setBlocks(copiedArray);
    }

    const row = index[0];
    const column = index[1];

    setBlocks(
      replaceItemAtRowColumn<Block>(blocks, row, column, {
        ...item,
        isSelected: true,
      })
    );
  };

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
                    minWidth: itemWidth,
                    maxWidth: itemWidth,
                    height: itemWidth,
                    backgroundColor: item.isSelected
                      ? "green"
                      : "rgba(249, 180, 45, 0.25)",
                  }}
                >
                  <Item />
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
    padding: 0,
    // backgroundColor: "rgba(249, 180, 45, 0.25)",
    borderWidth: 1,
    borderColor: "#fff",
  },
});
