/** @format */

// import { StatusBar } from "expo-status-bar";
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
  Platform,
  SafeAreaView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
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

import { Block, BoardGeography, BoardLevel } from "./src/screens/game/types";
import { getNearbyBombCount } from "./src/screens/game/board";
import { Game } from "./src/screens/game/Game";

export default () => {
  return (
    <RecoilRoot>
      <SafeAreaProvider>
        <Game />
      </SafeAreaProvider>
    </RecoilRoot>
  );
};

//MARKER: CONSTANTS
const DEFAULT_MINE_LEFT = -1;

//MARKER: Helper Functions






