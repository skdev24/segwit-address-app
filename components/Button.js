import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Button = ({ onPress, name, logoName }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      justifyContent: 'center',
      alignItems: 'center',
      height: 50,
      width: 90,
    }}
  >
    <MaterialCommunityIcons name={logoName} size={30} color="rgba(0,0,0,0.5)" />
    <Text
      style={{
        fontSize: 10,
        color: 'rgba(0,0,0,0.5)',
        marginTop: 2,
      }}
    >
      {name}
    </Text>
  </TouchableOpacity>
);

export default Button;
