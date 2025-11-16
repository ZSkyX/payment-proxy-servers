import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"

export function useAgentRegistration() {
  const { user, authenticated, login } = usePrivy()
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerAgent = async (
    email: string,
    agentName: string,
    clientInfo: string
  ) => {
    if (!authenticated || !user) {
      login()
      return { success: false, error: "Not authenticated" }
    }

    setRegistering(true)
    setError(null)

    try {
      // Step 1: Register agent with FluxA
      const registerResponse = await fetch("https://agentid.fluxapay.xyz/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          agent_name: agentName,
          CLIENT_INFO: clientInfo
        }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Failed to register agent with FluxA")
      }

      // Step 2: Extract agentId from response
      const agentId = registerData.agent_id || registerData.agentId

      if (!agentId) {
        throw new Error("No agent ID returned from FluxA")
      }

      // Step 3: Open Agent Wallet in new tab for authorization
      const encodedName = encodeURIComponent(agentName)
      const authUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`

      window.open(authUrl, '_blank')

      setRegistering(false)
      return { success: true, agentId }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to register agent"
      setError(errorMessage)
      setRegistering(false)
      return { success: false, error: errorMessage }
    }
  }

  return {
    registerAgent,
    registering,
    error,
    authenticated,
    login
  }
}
