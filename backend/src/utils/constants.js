const NETWORKS = ["MTN", "TELECEL", "AIRTELTIGO"];

const DATA_BUNDLES = {
  MTN: [
    { code: "MTN_1GB", amount: 10, volume: "1GB" },
    { code: "MTN_2GB", amount: 18, volume: "2GB" },
    { code: "MTN_5GB", amount: 40, volume: "5GB" }
  ],
  TELECEL: [
    { code: "TELECEL_1GB", amount: 9, volume: "1GB" },
    { code: "TELECEL_2GB", amount: 17, volume: "2GB" },
    { code: "TELECEL_4GB", amount: 32, volume: "4GB" }
  ],
  AIRTELTIGO: [
    { code: "AT_1GB", amount: 8, volume: "1GB" },
    { code: "AT_2GB", amount: 15, volume: "2GB" },
    { code: "AT_3GB", amount: 21, volume: "3GB" }
  ]
};

module.exports = {
  NETWORKS,
  DATA_BUNDLES
};
