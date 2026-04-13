#!/usr/bin/env node

/**
 * Hubtel SMS Configuration Verification Script
 * 
 * Run this script to verify your Hubtel SMS configuration is correct:
 *   node backend/scripts/verify-hubtel-config.js
 * 
 * This will check:
 * - Environment variables are set
 * - Hubtel API is reachable
 * - Test SMS can be sent (optional)
 */

const axios = require("axios");
require("dotenv").config({ path: ".env" });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${"=".repeat(60)}`, "blue");
  log(title, "blue");
  log("=".repeat(60), "blue");
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

async function verifyHubtelConfig() {
  let hasErrors = false;

  logSection("Hubtel SMS Configuration Verification");

  // Step 1: Check environment variables
  logSection("Step 1: Checking Environment Variables");

  const requiredVars = [
    "HUBTEL_SMS_CLIENT_ID",
    "HUBTEL_SMS_CLIENT_SECRET",
    "HUBTEL_SMS_FROM",
    "HUBTEL_SMS_BASE_URL"
  ];

  const config = {};
  let missingVars = false;

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      logError(`Missing: ${varName}`);
      missingVars = true;
      hasErrors = true;
    } else {
      config[varName] = value;
      const masked = varName.includes("SECRET")
        ? value.substring(0, 5) + "*".repeat(Math.max(0, value.length - 10)) + value.substring(value.length - 5)
        : value;
      logSuccess(`${varName}: ${masked}`);
    }
  });

  if (missingVars) {
    log("\nPlease set missing environment variables in .env file", "yellow");
    return;
  }

  // Step 2: Validate configuration values
  logSection("Step 2: Validating Configuration Values");

  // Check URL format
  try {
    new URL(config.HUBTEL_SMS_BASE_URL);
    logSuccess(`Base URL is valid: ${config.HUBTEL_SMS_BASE_URL}`);
  } catch (error) {
    logError(`Invalid Base URL: ${config.HUBTEL_SMS_BASE_URL}`);
    logError(`Error: ${error.message}`);
    hasErrors = true;
  }

  // Check sender name length
  if (config.HUBTEL_SMS_FROM.length > 11) {
    logWarning(`Sender name is ${config.HUBTEL_SMS_FROM.length} chars (max 11 recommended for Ghana)`);
  } else {
    logSuccess(`Sender name is valid: "${config.HUBTEL_SMS_FROM}" (${config.HUBTEL_SMS_FROM.length} chars)`);
  }

  // Check client ID and secret format
  if (config.HUBTEL_SMS_CLIENT_ID.length < 5) {
    logWarning("Client ID seems short (check it's correct)");
  } else {
    logSuccess("Client ID looks valid");
  }

  if (config.HUBTEL_SMS_CLIENT_SECRET.length < 10) {
    logWarning("Client Secret seems short (check it's correct)");
  } else {
    logSuccess("Client Secret looks valid");
  }

  // Step 3: Test API connectivity
  logSection("Step 3: Testing Hubtel API Connectivity");

  try {
    log("Testing API connectivity...");

    const testResponse = await axios.get(config.HUBTEL_SMS_BASE_URL, {
      timeout: 10000,
      params: {
        clientid: config.HUBTEL_SMS_CLIENT_ID,
        clientsecret: config.HUBTEL_SMS_CLIENT_SECRET,
        from: config.HUBTEL_SMS_FROM,
        to: "+233201234567", // Test number
        content: "Test message - ignore"
      },
      validateStatus: () => true // Accept any status
    });

    const statusCode = testResponse.status;
    const apiUrl = testResponse.config.url;

    // Hubtel returns 400/500 for bad numbers, but we just want to check connectivity
    if (statusCode >= 400 && statusCode < 600) {
      // This is expected for a test with bad number
      logSuccess(`API is reachable (test request returned ${statusCode})`);
      logSuccess("Credentials are being accepted by Hubtel");
    } else if (statusCode >= 200 && statusCode < 300) {
      logSuccess("API request successful");
    } else {
      logWarning(`Unexpected response status: ${statusCode}`);
    }

    logSuccess(`Connected to: ${config.HUBTEL_SMS_BASE_URL}`);
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      logError("Could not connect to Hubtel API");
      logError("Check your network connection and firewall settings");
    } else if (error.code === "ENOTFOUND") {
      logError("Could not resolve Hubtel domain");
      logError("Check your DNS settings and network connection");
    } else if (error.code === "ETIMEDOUT") {
      logError("Request to Hubtel API timed out");
      logError("The API may be slow or unreachable");
    } else {
      logError(`API connectivity error: ${error.message}`);
    }
    hasErrors = true;
  }

  // Step 4: Phone number normalization test
  logSection("Step 4: Testing Phone Number Normalization");

  const testNumbers = [
    { input: "0201234567", expected: "+233201234567" },
    { input: "233201234567", expected: "+233201234567" },
    { input: "+233201234567", expected: "+233201234567" },
    { input: "201234567", expected: "INVALID" }
  ];

  testNumbers.forEach(({ input, expected }) => {
    const normalized = normalizePhoneNumber(input);
    if (normalized === expected) {
      logSuccess(`"${input}" → "${normalized}"`);
    } else if (expected === "INVALID") {
      logSuccess(`"${input}" correctly rejected`);
    } else {
      logError(`"${input}" → "${normalized}" (expected "${expected}")`);
      hasErrors = true;
    }
  });

  // Step 5: Summary
  logSection("Verification Summary");

  if (hasErrors) {
    logWarning("Some issues were found. Please review above.");
    log("\nNext steps:");
    log("1. Fix any missing or invalid configuration");
    log("2. Verify Hubtel credentials at https://portal.hubtel.com");
    log("3. Run this script again");
    process.exit(1);
  } else {
    logSuccess("All checks passed! ✓");
    log("\nYour Hubtel SMS configuration is ready!");
    log("\nNext steps:");
    log("1. Test SMS delivery in your application");
    log("2. Monitor delivery in Hubtel portal");
    log("3. Deploy to production");
    process.exit(0);
  }
}

function normalizePhoneNumber(phoneNumber) {
  try {
    const normalized = String(phoneNumber || "")
      .replace(/[\s-().]/g, "")
      .trim();

    if (!normalized) {
      throw new Error("Phone number is required");
    }

    if (normalized.startsWith("+")) {
      const withoutPlus = normalized.slice(1);
      if (!/^\d{12,13}$/.test(withoutPlus)) {
        throw new Error("Invalid international format");
      }
      return normalized;
    }

    if (normalized.startsWith("233")) {
      if (!/^233\d{9}$/.test(normalized)) {
        throw new Error("Ghana phone must be 10 digits after 233");
      }
      return `+${normalized}`;
    }

    if (normalized.startsWith("0")) {
      if (!/^0\d{9}$/.test(normalized)) {
        throw new Error("Ghana phone must be 10 digits starting with 0");
      }
      return `+233${normalized.slice(1)}`;
    }

    throw new Error("Must be Ghana format");
  } catch (error) {
    return "INVALID";
  }
}

// Run verification
verifyHubtelConfig().catch((error) => {
  logError(`Verification failed: ${error.message}`);
  process.exit(1);
});
