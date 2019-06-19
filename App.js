import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ECPair,
  networks,
  payments,
  TransactionBuilder,
} from 'rn-bitcoinjs-lib';
import axios from 'axios';

import AsyncStorage from '@react-native-community/async-storage';

import { Transaction } from './components/Transaction';
import Button from './components/Button';

const regtest = networks.testnet;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  ButtonContainer: {
    width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    alignItems: 'center',
  },
  separator: {
    height: 40,
    width: 0.6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backgroundView: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unspentText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
    marginBottom: 10,
  },
  bitcoinIcon: {
    height: 30,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateNewKeyText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.7)',
    marginLeft: 5,
    padding: 5,
  },
  generateNewKeyButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 30,
    backgroundColor: 'rgb(194, 194, 214)',
    borderRadius: 10,
    padding: 10,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 5,
    shadowOpacity: 1.0,
    elevation: 3,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 25,
    color: 'rgba(0,0,0,0.7)',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgb(194, 194, 214)',
  },
});

export default class App extends Component {
  state = {
    address: '',
    addressError: '',
    data: null,
    isAddressNotAvailable: false,
    keyPair: null,
    isLoading: false,
  };

  async componentWillMount() {
    try {
      const bitcoin = await AsyncStorage.getItem('bitcoin');
      if (bitcoin !== null) {
        // value previously stored
        const {
          bitcoin: { keyPair, address },
        } = JSON.parse(bitcoin);

        this.setState({
          keyPair,
          address,
        });

        await this.handleUpdateTransaction();
      } else if (bitcoin === null) {
        this.setState({
          isAddressNotAvailable: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  handleCreateNewAddress = async () => {
    this.setState({
      isLoading: true,
    });
    try {
      const bitcoin = await this.handleGenerateAddress();
      this.setState(
        {
          address: bitcoin.address,
          keyPair: bitcoin.keyPair,
        },
        async () => {
          await this.handleUpdateTransaction();
          await AsyncStorage.setItem(
            'bitcoin',
            JSON.stringify({
              bitcoin,
            })
          );
        }
      );
    } catch (error) {
      console.error(error);
      this.setState({
        isLoading: false,
      });
    }
  };

  handleGenerateAddress = async () => {
    try {
      const keyPair = ECPair.makeRandom({ network: regtest });
      const { address } = payments.p2sh({
        redeem: payments.p2wpkh({
          pubkey: keyPair.publicKey,
          network: networks.testnet,
        }),
      });
      return { address, keyPair: { privateKey: keyPair.toWIF() } };
    } catch (error) {
      console.error(error);
    }
  };

  handleSignAndBroadcastTx = async () => {
    const { keyPair, address } = this.state;
    this.setState({
      isLoading: true,
    });
    const generateNewAddress = await this.handleGenerateAddress();
    // eslint-disable-next-line new-cap
    const oldKeyPairValue = new ECPair.fromWIF(
      keyPair.privateKey,
      networks.testnet
    );

    const p2wpkh = payments.p2wpkh({
      pubkey: oldKeyPairValue.publicKey,
      network: regtest,
    });
    const p2sh = payments.p2sh({ redeem: p2wpkh, network: regtest });

    const unspent = await this.handleGetUnspentTx();
    const transactionFee = await this.handleGetRecommendedFee();

    if (unspent.length !== 0 && unspent[0].value_int !== 0) {
      const txb = new TransactionBuilder(networks.testnet);

      txb.addInput(unspent[0].txid, unspent[0].n);

      const unspentBalance = unspent[0].value_int;
      const totalCost = unspentBalance - transactionFee;

      if (totalCost > 0) {
        txb.addOutput(generateNewAddress.address, totalCost);
        txb.addOutput(address, 0);

        txb.sign(
          0,
          oldKeyPairValue,
          p2sh.redeem.output,
          null,
          unspent[0].value_int
        );

        try {
          // pushtx
          // decodetx
          const response = await axios.post(
            `https://testnet-api.smartbit.com.au/v1/blockchain/pushtx`,
            { hex: txb.build().toHex() }
          );
          this.handleShowAlert('Balance successfully send!', true);
        } catch (err) {
          console.log(err);
        }
      } else {
        this.handleShowAlert('Not enough balance to send.', false);
      }
    } else {
      this.handleShowAlert('Unspent transaction not available.', false);
    }
  };

  handleShowAlert = (message, refresh) => {
    Alert.alert(
      'Status',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            const { address, keyPair } = this.state;
            if (refresh) {
              setTimeout(async () => {
                await this.handleUpdateTransaction(address, keyPair);
              }, 3000);
            }
            this.setState({
              isLoading: false,
            });
          },
        },
      ],
      { cancelable: false }
    );
  };

  handleGetRecommendedFee = async () => {
    const medianTransactionSize = 226; // bytes
    try {
      const response = await axios.get(
        `https://bitcoinfees.earn.com/api/v1/fees/recommended`
      );

      return response.data.fastestFee * medianTransactionSize;
    } catch (err) {
      console.log(err);
    }
  };

  handleGetUnspentTx = async () => {
    const { address } = this.state;
    try {
      const rawResponse = await axios.get(
        `https://testnet-api.smartbit.com.au/v1/blockchain/address/${address}/unspent`
      );
      const unspentTx = rawResponse.data.unspent.filter(
        item => item.value_int > 0
      );
      return unspentTx;
    } catch (err) {
      console.log(err);
    }
  };

  handleUpdateTransaction = async () => {
    this.setState({
      isLoading: true,
    });
    const { address } = this.state;

    try {
      const response = await fetch(
        `https://chain.so/api/v2/address/BTCTEST/${address}`
      );
      const responseJson = await response.json();

      this.setState({
        data: responseJson.data,
        isAddressNotAvailable: false,
        isLoading: false,
      });
    } catch (err) {
      // error reading value
      console.log('Error', err);

      this.setState({
        isLoading: false,
      });
    }
  };

  handleDeleteAddress = async () => {
    try {
      await AsyncStorage.removeItem('bitcoin');
      this.setState({
        data: null,
        address: '',
        isAddressNotAvailable: true,
      });
    } catch (e) {
      // remove error
    }
  };

  handleWriteToClipboard = async () => {
    const { address } = this.state;
    await Clipboard.setString(address);
  };

  render() {
    const { address, data, isAddressNotAvailable, isLoading } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        {isLoading && (
          <>
            <View style={styles.activityIndicator}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
            <View style={styles.backgroundView} />
          </>
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: 'rgba(0,0,0,1)' }}
        >
          <View
            style={{
              alignItems: 'center',
              backgroundColor: 'rgb(194, 194, 214)',
            }}
          >
            <Text style={styles.logoText}>LASTBIT TASK</Text>
            {!isAddressNotAvailable && data && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 15,
                  color: 'rgba(0,0,0,0.7)',
                }}
              >
                Address: {address}
              </Text>
            )}

            {isAddressNotAvailable && (
              <TouchableOpacity
                style={styles.generateNewKeyButton}
                onPress={this.handleCreateNewAddress}
              >
                <Text style={styles.generateNewKeyText}>
                  Generate New SegWit Address
                </Text>
              </TouchableOpacity>
            )}
            {data && (
              <>
                <View
                  style={{
                    width,
                    marginVertical: 15,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      style={styles.bitcoinIcon}
                      name="bitcoin"
                      size={30}
                      color="rgba(0,0,0,1)"
                    />
                    <Text
                      style={{
                        fontSize: 30,
                        color: 'rgba(0,0,0,1)',
                      }}
                    >
                      {data.balance}
                    </Text>
                  </View>
                  <Text style={styles.unspentText}>Unspent balance</Text>
                </View>
                <View style={styles.ButtonContainer}>
                  <Button
                    onPress={this.handleWriteToClipboard}
                    name="Copy"
                    logoName="content-copy"
                  />
                  <View style={styles.separator} />
                  <Button
                    onPress={this.handleSignAndBroadcastTx}
                    name="Send"
                    logoName="send"
                  />
                  <View style={styles.separator} />
                  <Button
                    onPress={this.handleDeleteAddress}
                    name="Delete"
                    logoName="delete-outline"
                  />
                  <View style={styles.separator} />
                  <Button
                    onPress={() => this.handleUpdateTransaction(address)}
                    name="Refresh"
                    logoName="refresh"
                  />
                </View>
              </>
            )}
          </View>

          {data &&
            data.txs.map((item, index) => {
              const currentDate = moment(item.time * 1000).format(
                'MMM Do, YYYY h:mm'
              );
              return (
                <Transaction
                  key={index}
                  currentDate={currentDate}
                  item={item}
                />
              );
            })}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
