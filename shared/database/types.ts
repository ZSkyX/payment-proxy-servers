// Type definitions for database tables

export interface User {
  id: string
  email: string | null
  wallet_address: string | null
  created_at: string
  updated_at: string
  last_login_at: string
}

export interface UserMCPServerConfig {
  id: string
  user_id: string
  upstream_url: string
  server_name: string
  server_description: string
  wallet_address: string
  created_at: string
  updated_at: string
}

export interface UserMCPServerToolConfig {
  id: string
  config_id: string
  name: string
  description: string | null
  price: number
  enabled: boolean
  created_at: string
  updated_at: string
}
