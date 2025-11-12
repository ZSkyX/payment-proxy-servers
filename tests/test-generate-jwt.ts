import { generateJwt } from "@coinbase/cdp-sdk/auth";

const main = async () => {
  // Check all required environment variables
  console.log("Checking environment variables:");
  console.log("CDP_API_KEY_ID:", process.env.CDP_API_KEY_ID ? "✓ Set" : "✗ Missing");
  console.log("CDP_API_KEY_SECRET:", process.env.CDP_API_KEY_SECRET ? "✓ Set" : "✗ Missing");

  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    console.error("\nError: Missing required environment variables");
    process.exit(1);
  }

  // Generate the JWT using the CDP SDK
  const token = await generateJwt({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    requestMethod: "POST",
    requestHost: "api.cdp.coinbase.com",
    requestPath: "/platform/v2/x402/verify",
    expiresIn: 240 // optional (defaults to 120 seconds)
  });

  console.log("\nGenerated JWT token:");
  console.log(token);
};

main();