const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");

async function sendDataBundle({ network, bundleCode, phoneNumber }) {
  if (env.VTU_PROVIDER === "SIMULATED") {
    const shouldFail = phoneNumber.endsWith("000");
    if (shouldFail) {
      return {
        success: false,
        message: "Simulated provider outage",
        providerReference: null
      };
    }

    return {
      success: true,
      message: "Data delivered",
      providerReference: `VTU-${uuidv4()}`
    };
  }

  const response = await axios.post(
    `${env.VTU_BASE_URL}/data/purchase`,
    {
      network,
      bundleCode,
      msisdn: phoneNumber
    },
    {
      headers: {
        Authorization: `Bearer ${env.VTU_API_KEY}`
      }
    }
  );

  return {
    success: response.data.status === "SUCCESS",
    message: response.data.message,
    providerReference: response.data.reference
  };
}

module.exports = {
  sendDataBundle
};
