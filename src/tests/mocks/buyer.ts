import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { config } from "dotenv";
import { withPaymentInterceptor, decodeXPaymentResponse } from "x402-axios";
import axios from "axios";
import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}
config({ path: resolve(__dirname, '../../.env') });

// Create a wallet client (using your private key)
const pkey = process.env.PRIVATE_KEY as `0x${string}`;
console.log(pkey)
const account = privateKeyToAccount(pkey); // we recommend using an environment variable for this



// Create an Axios instance with payment handling
const api = withPaymentInterceptor(
  axios.create({
    baseURL: "http://localhost:4021",
  }),
  account,
);

api
.get("/weather") // e.g. /paid-endpoint
.then(response => {
    console.log("Response data:", response.data);

    const paymentResponse = decodeXPaymentResponse(response.headers["x-payment-response"]);
    console.log("Payment response:", paymentResponse);
})
.catch(error => {
    console.error("Full error:", error);
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
});