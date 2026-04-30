const NETWORKS = ["MTN", "TELECEL", "AIRTELTIGO"];

const DATA_BUNDLES = {
  MTN: [
    { code: "MTN_1GB", basePrice: 4.25, profit: 1.05, amount: 5.30, volume: "1GB" },
    { code: "MTN_2GB", basePrice: 8.50, profit: 2.1, amount: 10.60, volume: "2GB" },
    { code: "MTN_3GB", basePrice: 12.75, profit: 2.2, amount: 14.95, volume: "3GB" },
    { code: "MTN_4GB", basePrice: 17.00, profit: 2.2, amount: 19.20, volume: "4GB" },
    { code: "MTN_5GB", basePrice: 21.50, profit: 2.75, amount: 24.25, volume: "5GB" },
    { code: "MTN_6GB", basePrice: 25.50, profit: 3.3, amount: 28.80, volume: "6GB" },
    { code: "MTN_8GB", basePrice: 33.50, profit: 3.4, amount: 36.90, volume: "8GB" },
    { code: "MTN_10GB", basePrice: 41.00, profit: 4, amount: 45.00, volume: "10GB" },
    { code: "MTN_15GB", basePrice: 59.00, profit: 4.5, amount: 63.50, volume: "15GB" },
    { code: "MTN_20GB", basePrice: 79.00, profit: 5.6, amount: 84.60, volume: "20GB" },
    { code: "MTN_25GB", basePrice: 98.50, profit: 6, amount: 104.50, volume: "25GB" },
    { code: "MTN_30GB", basePrice: 117.80, profit: 9.5, amount: 127.30, volume: "30GB" },
    { code: "MTN_40GB", basePrice: 155.50, profit: 10, amount: 165.50, volume: "40GB" },
    { code: "MTN_50GB", basePrice: 198.00, profit: 12, amount: 210.00, volume: "50GB" },
    { code: "MTN_100GB", basePrice: 385.00, profit: 20, amount: 405.00, volume: "100GB" }
  ],
  TELECEL: [
    { code: "TELECEL_10GB", basePrice: 40.00, profit: 3, amount: 43.00, volume: "10GB" },
    { code: "TELECEL_15GB", basePrice: 64.98, profit: 3.12, amount: 68.10, volume: "15GB" },
    { code: "TELECEL_20GB", basePrice: 86.00, profit: 4, amount: 90.00, volume: "20GB" },
    { code: "TELECEL_30GB", basePrice: 132.00, profit: 5, amount: 137.00, volume: "30GB" },
    { code: "TELECEL_40GB", basePrice: 165.00, profit: 6.5, amount: 171.50, volume: "40GB" },
    { code: "TELECEL_50GB", basePrice: 199.00, profit: 9, amount: 208.00, volume: "50GB" }
  ],
  AIRTELTIGO: [
    { code: "AT_1GB", basePrice: 3.90, profit: 1.1, amount: 5.00, volume: "1GB" },
    { code: "AT_2GB", basePrice: 8.00, profit: 2, amount: 10.00, volume: "2GB" },
    { code: "AT_3GB", basePrice: 13.00, profit: 2, amount: 15.00, volume: "3GB" },
    { code: "AT_4GB", basePrice: 16.00, profit: 3, amount: 19.00, volume: "4GB" },
    { code: "AT_5GB", basePrice: 20.00, profit: 4, amount: 24.00, volume: "5GB" },
    { code: "AT_6GB", basePrice: 26.50, profit: 4.4, amount: 30.90, volume: "6GB" },
    { code: "AT_7GB", basePrice: 27.50, profit: 5, amount: 32.50, volume: "7GB" },
    { code: "AT_8GB", basePrice: 31.00, profit: 5, amount: 36.00, volume: "8GB" },
    { code: "AT_9GB", basePrice: 40.00, profit: 5, amount: 45.00, volume: "9GB" },
    { code: "AT_10GB", basePrice: 43.00, profit: 5, amount: 48.00, volume: "10GB" },
    { code: "AT_12GB", basePrice: 47.00, profit: 5, amount: 52.00, volume: "12GB" },
    { code: "AT_15GB", basePrice: 58.50, profit: 7, amount: 65.50, volume: "15GB" },
    { code: "AT_20GB", basePrice: 86.00, profit: 7, amount: 93.00, volume: "20GB" },
    { code: "AT_25GB", basePrice: 105.00, profit: 10, amount: 115.00, volume: "25GB" }
  ]
};

module.exports = {
  NETWORKS,
  DATA_BUNDLES
};
