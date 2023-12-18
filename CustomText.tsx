/** @format */

import React, { PropsWithChildren, ReactNode } from "react";
import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native";

type CustomTextProps = {

  style?: StyleProp<TextStyle | ViewStyle>,
}

export const CustomText = ({ style,children }: PropsWithChildren<CustomTextProps>) => {
  return <Text   style={ [style,{fontSize:20}]}>{children}</Text>;
};

export const DEFAILT_FONTSIZE = 20;


