// quadrilateral matter template

import * as React from 'react'
import { TouchableWithoutFeedback, View } from "react-native";

interface BoxProps {
  size:number,
  body:any, 
  borderRadius:number,
  color:string
}
interface BoxState {}

// PureComponent won't work
export default class Circle extends React.Component<BoxProps, BoxState> {
  componentWillUnmount() {
    console.log("UNMOUNTING....");
  }

  render() {
    const size = this.props.size,
          x = this.props.body.position.x - (size / 2),
          y = this.props.body.position.y - (size / 2);
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          console.log("BOX PRESSED");
        }}>
         <View
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: this.props.borderRadius,
            backgroundColor: this.props.color || "pink"
          }}/>
      </TouchableWithoutFeedback>
    );
  }
}
