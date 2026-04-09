const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");
const { buildHubtelSignatureHeaders, buildExpressPaySignatureHeaders } = require("../../utils/paymentSignatures");

async function initiateMomoCharge({ amount, momoNumber, provider, externalReference }) {
  if (env.PAYMENT_PROVIDER === "SIMULATED") {
    return {
      providerReference: `SIM-${uuidv4()}`,
      status: "PENDING",
      checkoutUrl: `${env.APP_BASE_URL}/mock-momo-approval/${externalReference}`
    };
  }

  if (env.PAYMENT_PROVIDER === "HUBTEL") {
    const body = {
      amount,
      customerNumber: momoNumber,
      channel: provider,
      clientReference: externalReference
    };
    const path = "/momo/initiate";
    const response = await axios.post(
      `${env.HUBTEL_BASE_URL}${path}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          ...buildHubtelSignatureHeaders({ method: "POST", path, body }),
          "X-Client-Secret": env.HUBTEL_CLIENT_SECRET
        }
      }
    );

    return {
      providerReference: response.data.providerReference,
      status: "PENDING",
      checkoutUrl: response.data.checkoutUrl
    };
  }

  const body = {
    amount,
    mobileNumber: momoNumber,
    network: provider,
    requestId: externalReference
  };
  const path = "/momo/initiate";

  const response = await axios.post(
    `${env.EXPRESSPAY_BASE_URL}${path}`,
    body,
    {
      headers: {
        ...buildExpressPaySignatureHeaders({ method: "POST", path, body })
      }
    }
  );

  return {
    providerReference: response.data.reference,
    status: "PENDING",
    checkoutUrl: response.data.paymentUrl
  };
}

module.exports = {
  initiateMomoCharge
};
