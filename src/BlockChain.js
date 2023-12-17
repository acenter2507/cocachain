const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const sha256 = require("crypto-js/sha256");

class Block {
  constructor(prevHash, transactions) {
    this.prevHash = prevHash;
    this.transactions = transactions;
    this.created = new Date();
    this.mineCnt = 0;
    this.hash = this.calculateHash();
  }

  calculateHash = function () {
    return sha256(
      this.prevHash +
        JSON.stringify(this.transactions) +
        this.created +
        this.mineCnt
    ).toString();
  };

  mine = function (difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.mineCnt++;
      this.hash = this.calculateHash();
    }
  };

  hasValidTransactions = function () {
    this.transactions.forEach((transaction) => {
      if (!transaction.isValid()) {
        return false;
      }
    });
    return true;
  };
}

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }

  calculateHash = function () {
    return sha256(this.from + this.to + this.amount).toString();
  };

  signTransaction = function (signingKey) {
    if (signingKey.getPublic("hex") !== this.from) {
      throw new Error(
        "Bạn không thể thực hiện giao dịch trên ví của người khác"
      );
    }
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  };

  isValid = function () {
    if (this.from === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("Không có xác thực chữ ký cho giao dịch này");
    }

    const publicKey = ec.keyFromPublic(this.from, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  };
}

class BlockChain {
  constructor(difficulty, miningReward) {
    const firstBlock = new Block("000", { isFirstBlock: true });
    this.chain = [firstBlock];
    this.difficulty = difficulty;
    this.miningReward = miningReward;
    this.pendingTransaction = [];
  }

  addBlock = function (transactions) {
    const lastBlock = this.getLastBlock();
    const newBlock = new Block(lastBlock.hash, transactions);
    newBlock.mine(this.difficulty);
    this.chain.push(newBlock);
  };

  isChainValid = function () {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.prevHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  };

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction = function (transaction) {
    if (!transaction.from || !transaction.to) {
      throw new Error(
        "Một giao dịch cần phải có địa chỉ người nhận và người gửi"
      );
    }
    if (!transaction.isValid()) {
      throw new Error("Không thể thực hiện giao dịch này");
    }
    this.pendingTransaction.push(transaction);
  };

  minePendingTransaction = function (minner) {
    const lastBlock = this.getLastBlock();
    let newBlock = new Block(lastBlock.hash, this.pendingTransaction);
    newBlock.mine(this.difficulty);
    this.chain.push(newBlock);
    this.pendingTransaction = [
      new Transaction(null, minner, this.miningReward),
    ];
  };

  getBalance = function (address) {
    let balance = 0;

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let j = 0; j < block.transactions.length; j++) {
        const transaction = block.transactions[j];
        if (transaction.from == address) {
          balance -= transaction.amount;
        }
        if (transaction.to == address) {
          balance += transaction.amount;
        }
      }
    }
    return balance;
  };
  getHistoryOut = function (address) {
    let histories = [];

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let j = 0; j < block.transactions.length; j++) {
        const transaction = block.transactions[j];
        if (transaction.from == address) {
          histories.push(transaction);
        }
      }
    }

    return histories;
  };
  getHistoryIn = function (address) {
    let histories = [];

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let j = 0; j < block.transactions.length; j++) {
        const transaction = block.transactions[j];
        if (transaction.to == address) {
          histories.push(transaction);
        }
      }
    }

    return histories;
  };
  getHistoryAll = function () {
    let histories = [];

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let j = 0; j < block.transactions.length; j++) {
        const transaction = block.transactions[j];
        if (
          transaction.to !== null &&
          transaction.from !== null &&
          transaction.amount !== 0
        ) {
          histories.push(transaction);
        }
      }
    }

    return histories;
  };
  getHistoryMine = function () {
    let histories = [];

    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      for (let j = 0; j < block.transactions.length; j++) {
        const transaction = block.transactions[j];
        if (
          transaction.to !== null &&
          transaction.from == null &&
          transaction.amount !== 0
        ) {
          histories.push(transaction);
        }
      }
    }

    return histories;
  };
}

class Wallet {
  constructor() {
    const key = ec.genKeyPair();
    this.privateKey = key.getPrivate("hex");
    this.address = key.getPublic("hex");
    this.signingKey = ec.keyFromPrivate(this.privateKey);
  }
}

module.exports.BlockChain = BlockChain;
module.exports.Transaction = Transaction;
module.exports.Wallet = Wallet;
module.exports.Block = Block;
