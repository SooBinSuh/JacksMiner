/** @format */

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  View,
  Text,
  Button,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  boardGeographyState,
  boardState,
  bottomSheetState,
  secondsState,
} from "../../recoil/atoms";
import { useRecoilState, useRecoilValue } from "recoil";
import { areaLeftToSweepState, minesLeftState } from "../../recoil/selectors";
import {
  copyArray,
  hasAtleastOneFreeBlockExcludingSelf,
  initNumbers,
  isCoordinateInBound,
  makeGame,
  replaceItemAtRowColumn,
} from "./board";
import { Block, BoardGeography, BoardLevel, getDefaultBoard } from "./types";
import { getRandomInt } from "../../util/helpers";
import { Coordinate, Queue } from "../../util/types";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { styles } from "./styles";
import { CustomText } from "../../components/CustomText";
import { Board } from "./board";
export function Game() {
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
  // let itemWidth = Math.min(
  //   windowWidth / boardGeography.widthBlockCount,
  //   windowHeight / boardGeography.heightBlockCount
  // );

  useEffect(() => {
    console.log("areaLefttosweep:", areaLeftToSweep);
    if (areaLeftToSweep == 0) {
      gameOver(true);
    }
  }, [areaLeftToSweep]);
  useEffect(() => {
    if (boardGeography.isFreshBoard == false) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    }

    return () => clearInterval(intervalRef.current!);
  }, [boardGeography.isFreshBoard]);

  useEffect(() => {
    resetGame();
  }, [boardGeography.widthBlockCount, boardGeography.heightBlockCount]);

  //MARKER: Intents
  const resetGame = () => {
    setSeconds(0);
    setBlocks(
      makeGame(boardGeography.widthBlockCount, boardGeography.heightBlockCount)
    );
    console.log(
      "widthCount:",
      boardGeography.widthBlockCount,
      "height:",
      boardGeography.heightBlockCount
    );
    setBoardGeography(getDefaultBoard(boardGeography.level));
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
    console.log("clicked item:", level);
    if (boardGeography.level != level) {
      setBoardGeography(getDefaultBoard(level));
    }
    bottomSheetModalRef.current?.dismiss();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.AndroidSafeArea}>
            <View style={styles.container}>
              <View style={styles.scoreboardContianer}>
                <Text>{minesLeft}</Text>
                <Button
                  title="😀"
                  onPress={() => {
                    setbottomSheet({ isVisible: true });
                  }}
                />
                <Text>{seconds}</Text>
              </View>
              <Board/>
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
                // <Button key={index} title={value} onPress={()=>onBottomSheetChocieTypePressed(value)}/>
                <TouchableWithoutFeedback
                  key={index}
                  onPress={() => {
                    onBottomSheetChocieTypePressed(value);
                  }}
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
