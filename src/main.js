const BlockChain = require("./BlockChain").BlockChain;
const Transaction = require("./BlockChain").Transaction;
const Wallet = require("./BlockChain").Wallet;
const Block = require("./BlockChain").Block;

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

console.log("------------ Start");
const cocaChain = new BlockChain(2, 10);

// Create Wallet
const myWallet = new Wallet();
const fooWallet = new Wallet();

console.log("------------ Create Transaction");
const transaction = new Transaction(fooWallet.address, myWallet.address, 100);
transaction.signTransaction(fooWallet.signingKey);
cocaChain.addTransaction(transaction);

// Mine transactions
cocaChain.minePendingTransaction(myWallet.address);
cocaChain.minePendingTransaction(fooWallet.address);

// Check balance
console.log(
  "------------ Balance of my Wallet",
  cocaChain.getBalance(myWallet.address)
);

// console.log(cocaChain.chain[1]);
