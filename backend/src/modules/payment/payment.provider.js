const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");
const { buildHubtelSignatureHeaders, buildExpressPaySignatureHeaders } = require("../../utils/paymentSignatures");
const ApiError = require("../../utils/apiError");

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

async function initiateMomoCharge({ amount, momoNumber, provider, externalReference }) {
  const msisdn = normalizeGhanaMsisdn(momoNumber);

  if (env.PAYMENT_PROVIDER === "SIMULATED") {
    return {
      providerReference: `SIM-${uuidv4()}`,
      status: "PENDING",
      checkoutUrl: `${env.APP_BASE_URL}/mock-momo-approval/${externalReference}`
    };
  }

  if (env.PAYMENT_PROVIDER === "MTN") {
    const credentials = Buffer.from(`${env.MTN_COLLECTION_USER_ID}:${env.MTN_COLLECTION_API_KEY}`).toString("base64");

    const tokenResponse = await axios.post(
      `${env.MTN_BASE_URL}/collection/token/`,
      null,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    const accessToken = tokenResponse?.data?.access_token;
    if (!accessToken) {
      throw new ApiError(502, "Failed to get MTN access token", "MTN_TOKEN_ERROR");
    }

    const requestId = uuidv4();

    await axios.post(
      `${env.MTN_BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: String(amount),
        currency: env.MTN_CURRENCY || "GHS",
        externalId: externalReference,
        payer: {
          partyIdType: "MSISDN",
          partyId: msisdn
        },
        payerMessage: "Prosperous Data Hub Confirmation",
        payeeNote: `Data bundle payment for ${provider}`
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": requestId,
          "X-Target-Environment": env.MTN_TARGET_ENV,
          "Ocp-Apim-Subscription-Key": env.MTN_COLLECTION_SUBSCRIPTION_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      providerReference: requestId,
      status: "PENDING"
    };
  }

  if (env.PAYMENT_PROVIDER === "HUBTEL") {
    const body = {
      amount,
      customerNumber: msisdn,
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
    mobileNumber: msisdn,
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
