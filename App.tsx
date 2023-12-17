/** @format */

import { StatusBar } from "expo-status-bar";
import { Children, PropsWithChildren, useState } from "react";
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

export default () => {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};

export type Block = {
  isSelected: boolean;
};
const makeArray = (rows: number, columns: number) => {
  let arr = [];
  for (let i = 0; i < columns; i++) {
    arr.push(new Array(rows).fill({ isSelected: false }));
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

function App() {
  // MARKER: 게임 설정 및 블럭 크기 계산하는 부분
  const insets = useSafeAreaInsets();

  const widthBlock = 6; //가로 블록 계수
  const heightBlock = 6; //세로 블록 계수
  const mineCount = 4; //지뢰 계수

  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;
  const [blocks, setBlocks] = useState(makeArray(widthBlock, heightBlock));

  const itemWidth = Math.min(
    windowWidth / widthBlock,
    windowHeight / heightBlock
  );

  const onItemPress = (index: number[], item: Block) => {
    if (item.isSelected) {
      console.log("중복 클릭 불가!");
      return;
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
          <Text>mines left area</Text>
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
