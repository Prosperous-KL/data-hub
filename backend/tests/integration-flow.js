const axios = require('axios');

async function run() {
  const API_URL = 'http://127.0.0.1:4000';
  console.log('Starting local integration flow test on:', API_URL);

  const phone = '024' + Math.floor(1000000 + Math.random() * 9000000);
  const email = `testuser_${Date.now()}@gmail.com`;
  const password = 'Opensaysme@2929';
  const fullName = 'Integration Test User';

  console.log(`Using email: ${email}, phone: ${phone}`);

  // Step 1: Request OTP
  console.log('\n--- Step 1: Requesting OTP for Registration ---');
  const otpRes = await axios.post(`${API_URL}/api/auth/otp/request`, {
    purpose: 'REGISTER',
    channel: 'PHONE',
    target: phone
  });

  console.log('OTP request status:', otpRes.status);
  console.log('OTP response data:', otpRes.data);
  const { otpSessionId, devOtp } = otpRes.data;

  if (!otpSessionId || !devOtp) {
    throw new Error('Failed to get otpSessionId or devOtp');
  }

  // Step 2: Register user
  console.log('\n--- Step 2: Registering user ---');
  const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
    fullName,
    email,
    phone,
    password,
    otpSessionId,
    otpCode: devOtp
  });

  console.log('Register response status:', registerRes.status);
  console.log('Register response data:', registerRes.data);

  // Step 3: Login to get token
  console.log('\n--- Step 3: Logging in ---');
  const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password
  });

  console.log('Login status:', loginRes.status);
  const { token, user } = loginRes.data;
  console.log(`Logged in successfully! User ID: ${user.id}`);

  // Step 4: Verify initial wallet balance
  console.log('\n--- Step 4: Checking initial wallet balance ---');
  const walletRes = await axios.get(`${API_URL}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Wallet status:', walletRes.status);
  console.log('Wallet data:', walletRes.data);
  const initialBalance = Number(walletRes.data.wallet.available_balance);
  console.log(`Initial balance: GHS ${initialBalance}`);

  // Step 5: Initiate payment
  console.log('\n--- Step 5: Initiating payment ---');
  const paymentRes = await axios.post(
    `${API_URL}/api/payment/initiate`,
    {
      amount: 50.00,
      momoNumber: phone,
      provider: 'MTN'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-idempotency-key': `idemp-${Date.now()}`
      }
    }
  );

  console.log('Payment initiate status:', paymentRes.status);
  console.log('Payment data:', paymentRes.data);
  const { payment } = paymentRes.data;
  const externalReference = payment.external_reference;

  // Step 6: Callback webhook
  console.log('\n--- Step 6: Triggering simulated callback/webhook ---');
  const callbackRes = await axios.post(
    `${API_URL}/api/payment/callback`,
    {
      externalReference,
      status: 'SUCCESS',
      signature: 'dev-callback-token-change-in-prod'
    },
    {
      headers: {
        'x-callback-token': 'dev-callback-token-change-in-prod'
      }
    }
  );

  console.log('Callback response status:', callbackRes.status);
  console.log('Callback response data:', callbackRes.data);

  // Step 7: Verify balance again
  console.log('\n--- Step 7: Checking updated wallet balance ---');
  const walletUpdatedRes = await axios.get(`${API_URL}/api/wallet/balance`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Updated wallet data:', walletUpdatedRes.data);
  const updatedBalance = Number(walletUpdatedRes.data.wallet.available_balance);
  console.log(`Updated balance: GHS ${updatedBalance}`);

  if (updatedBalance !== initialBalance + 50.00) {
    throw new Error(`Integration failed: Expected GHS ${initialBalance + 50.00}, got GHS ${updatedBalance}`);
  }

  console.log('\n=========================================');
  console.log('INTEGRATION TEST PASSED SUCCESSFULLY! 🎉');
  console.log('=========================================');
}

run().catch((err) => {
  console.error('Integration test failed with error:');
  if (err.response) {
    console.error(err.response.status, err.response.data);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
