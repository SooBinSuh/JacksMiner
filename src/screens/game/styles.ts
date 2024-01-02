import {
    Platform,
    StyleSheet,
    StatusBar,
  } from "react-native";
export const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    AndroidSafeArea: {
      flex: 1,
      backgroundColor: "white",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  