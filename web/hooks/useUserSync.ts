import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { db } from '@/lib/supabase'

export function useUserSync() {
  const { user, authenticated } = usePrivy()

  useEffect(() => {
    if (!authenticated || !user) {
      return
    }

    const syncUser = async () => {
      try {
        // Extract user data from Privy
        const email = user.email?.address || null
        const wallet_address = user.wallet?.address || null

        // Upsert user to Supabase
        await db.upsertUser({
          id: user.id,
          email,
          wallet_address,
        })

        console.log('User synced to Supabase:', user.id)
      } catch (error) {
        console.error('Failed to sync user to Supabase:', error)
      }
    }

    syncUser()
  }, [user, authenticated])
}
