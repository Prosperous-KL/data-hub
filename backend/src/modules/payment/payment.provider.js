import axios from "axios";
import { randomUUID } from "crypto";
import env from "../../config/env.js";
import { buildHubtelSignatureHeaders, buildExpressPaySignatureHeaders } from "../../utils/paymentSignatures.js";
import ApiError from "../../utils/apiError.js";

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

function resolveHubtelPaymentEndpoint(baseUrl) {
  const defaultPath = "/charges/initiate";
  const fallbackUrl = `https://api.hubtel.com${defaultPath}`;

  try {
    const parsed = new URL(baseUrl);
    const pathname = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : defaultPath;

    parsed.pathname = pathname;
    parsed.search = "";
    parsed.hash = "";

    return {
      url: parsed.toString(),
      path: pathname
    };
  } catch (_error) {
    return {
      url: baseUrl || fallbackUrl,
      path: defaultPath
    };
  }
}

async function initiateMomoCharge({ amount, momoNumber, provider, externalReference, customerEmail }) {
  const msisdn = normalizeGhanaMsisdn(momoNumber);

  if (env.PAYMENT_PROVIDER === "SIMULATED") {
    return {
      providerReference: `SIM-${randomUUID()}`,
      status: "PENDING",
      checkoutUrl: `${env.APP_BASE_URL}/mock-momo-approval/${externalReference}`
    };
  }

  if (env.PAYMENT_PROVIDER === "MTN") {
    try {
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

      const requestId = randomUUID();

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
    } catch (error) {
      const providerMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.description ||
        error?.message;
      throw new ApiError(502, `MTN payment prompt failed: ${providerMessage || "Provider request failed"}`, "PAYMENT_PROVIDER_ERROR");
    }
  }

  if (env.PAYMENT_PROVIDER === "HUBTEL") {
    try {
      const body = {
        amount,
        customerNumber: msisdn,
        clientReference: externalReference
      };
      const { url, path } = resolveHubtelPaymentEndpoint(env.HUBTEL_BASE_URL);

      const response = await axios.post(
        url,
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
    } catch (error) {
      const providerMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.description ||
        error?.message;
      throw new ApiError(502, `Hubtel payment prompt failed: ${providerMessage || "Provider request failed"}`, "PAYMENT_PROVIDER_ERROR");
    }
  }

  if (env.PAYMENT_PROVIDER === "PAYSTACK") {
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
        throw new ApiError(400, "Invalid payment amount", "INVALID_PAYMENT_AMOUNT");
      }

      const callbackUrl = env.PAYSTACK_CALLBACK_URL || `${env.APP_BASE_URL}/api/payment/callback`;
      const response = await axios.post(
        `${env.PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email: customerEmail,
          amount: amountMinor,
          reference: externalReference,
          callback_url: callbackUrl,
          currency: env.PAYSTACK_CURRENCY,
          metadata: {
            momoNumber: msisdn,
            network: provider
          }
        },
        {
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response?.data?.status || !response?.data?.data?.reference) {
        throw new ApiError(502, "Paystack response did not include a valid reference", "PAYMENT_PROVIDER_ERROR");
      }

      return {
        providerReference: response.data.data.reference,
        status: "PENDING",
        checkoutUrl: response.data.data.authorization_url
      };
    } catch (error) {
      const providerMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.description ||
        error?.message;

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(502, `Paystack payment initialization failed: ${providerMessage || "Provider request failed"}`, "PAYMENT_PROVIDER_ERROR");
    }
  }

  try {
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
  } catch (error) {
    const providerMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.description ||
      error?.message;
    throw new ApiError(502, `ExpressPay payment prompt failed: ${providerMessage || "Provider request failed"}`, "PAYMENT_PROVIDER_ERROR");
  }
}

export { initiateMomoCharge };
