// truffle-config.js config for klaytn.
const HDWalletProvider = require("truffle-hdwallet-provider-klaytn")

const fs = require("fs")
const PRIVATE_KEY = fs.readFileSync(".secret").toString().trim()

module.exports = {
  networks: {
    klaytn: {
      provider: () => new HDWalletProvider(PRIVATE_KEY, "https://api.baobab.klaytn.net:8651"),
      network_id: '1001', // Baobab 네트워크 id
      gas: "20000000", // 트랜잭션 가스 한도
      gasPrice: null, // Baobab의 gasPrice는 25 Gpeb입니다. null 을 넣으면 네트워크에서 알아서 채워줌
    },
  },
  compilers: {
    solc: {
      version: "0.5.6"    // 컴파일러 버전을 0.5.6로 지정
    }
  }
};