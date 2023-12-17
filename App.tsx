/** @format */

import { StatusBar } from "expo-status-bar";
import { Children, PropsWithChildren } from "react";
import {
  Button,
  Dimensions,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
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
function App() {
  const insets = useSafeAreaInsets();
  const widthBlock = 14;
  const heightBlock = 32;
  const windowWidth = Dimensions.get("window").width;
  const windowHeight =
    Dimensions.get("window").height - insets.top - insets.bottom - 50;
  const rows = [...Array(heightBlock).keys()];
  const columns = [...Array(widthBlock).keys()];
  const itemWidth = Math.min(
    windowWidth / widthBlock,
    windowHeight / heightBlock
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.scoreboardContianer}>
          <Text>mines left area</Text>
          <Button
            title="Reset Button"
            onPress={() => {
              console.log("will reset");
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
          {rows.map((item, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: "row" }}>
              {columns.map((column, colIndex) => (
                <Item
                  key={[rowIndex, colIndex].toString()}
                  style={{
                    minWidth: itemWidth,
                    maxWidth: itemWidth,
                    height: itemWidth,
                  }}
                />
              ))}
            </View>
          ))}
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
    backgroundColor: "rgba(249, 180, 45, 0.25)",
    borderWidth: 1,
    borderColor: "#fff",
  },
});
