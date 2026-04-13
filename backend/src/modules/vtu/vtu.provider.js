const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");

function normalizeGhanaMsisdn(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }

  return digits;
}

async function sendDataBundle({ network, bundleCode, phoneNumber }) {
  if (env.VTU_PROVIDER === "SIMULATED") {
    const failureSuffix = String(process.env.VTU_SIMULATE_FAILURE_SUFFIX || "").trim();
    if (failureSuffix && String(phoneNumber || "").endsWith(failureSuffix)) {
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

  if (!env.VTU_BASE_URL || !env.VTU_API_KEY) {
    return {
      success: false,
      message: "VTU provider is not configured for live purchases",
      providerReference: null
    };
  }

  const msisdn = normalizeGhanaMsisdn(phoneNumber);

  try {
    const response = await axios.post(
      `${env.VTU_BASE_URL}/data/purchase`,
      {
        network,
        bundleCode,
        msisdn
      },
      {
        timeout: 20000,
        validateStatus: () => true,
        headers: {
          Authorization: `Bearer ${env.VTU_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = response.data || {};
    const providerStatus = String(data.status || "").toUpperCase();
    const success = response.status >= 200 && response.status < 300 && providerStatus === "SUCCESS";

    return {
      success,
      message: data.message || (success ? "Data delivered" : `Provider request failed (${response.status})`),
      providerReference: data.reference || null
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Unable to reach VTU provider",
      providerReference: null
    };
  }
}

module.exports = {
  sendDataBundle
};
