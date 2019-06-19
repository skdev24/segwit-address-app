import React from 'react';
import { Text, StyleSheet, View, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  iconTopRight: {
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLeft: {
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {
    height: 60,
    width,
    backgroundColor: 'rgba(0,0,0,1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
  },
});

export const Transaction = ({ currentDate, item }) => (
  <View style={styles.container}>
    <View style={styles.left}>
      {item.incoming && !item.outgoing && (
        <MaterialCommunityIcons
          style={styles.iconLeft}
          name="arrow-bottom-left"
          size={30}
          color="rgb(51, 204, 51)"
        />
      )}
      {item.outgoing && (
        <MaterialCommunityIcons
          style={styles.iconTopRight}
          name="arrow-top-right"
          size={30}
          color="rgb(255, 77, 77)"
        />
      )}
      <View
        style={{
          marginLeft: 5,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,1)',
          }}
        >
          {currentDate}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {item.confirmations === 0 ? 'Unconfirmed' : 'Confirmed'}
        </Text>
      </View>
    </View>
    <Text
      style={{
        fontSize: 13,
        color: 'rgba(255,255,255,1)',
      }}
    >
      {item.outgoing ? `-${item.outgoing.value}` : `+${item.incoming.value}`}
    </Text>
  </View>
);
