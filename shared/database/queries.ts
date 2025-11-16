import { supabase } from './client'
import type { User, UserMCPServerConfig, UserMCPServerToolConfig } from './types'

// Helper functions for database operations
export const db = {
  // User management
  async upsertUser(userData: {
    id: string
    email?: string | null
    wallet_address?: string | null
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userData.id,
          email: userData.email || null,
          wallet_address: userData.wallet_address || null,
          last_login_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Get all configs (public)
  async getAllConfigs(): Promise<UserMCPServerConfig[]> {
    const { data, error } = await supabase
      .from('user_mcp_server_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all configs for a user
  async getConfigsByUserId(userId: string): Promise<UserMCPServerConfig[]> {
    const { data, error } = await supabase
      .from('user_mcp_server_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get a single config by ID (with user_id check)
  async getConfigById(configId: string, userId: string): Promise<UserMCPServerConfig | null> {
    const { data, error } = await supabase
      .from('user_mcp_server_configs')
      .select('*')
      .eq('id', configId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Get a single config by ID (public - no user_id check)
  async getConfigByIdPublic(configId: string): Promise<UserMCPServerConfig | null> {
    const { data, error } = await supabase
      .from('user_mcp_server_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  // Check if upstream URL is already monetized
  async isUpstreamUrlMonetized(upstreamUrl: string): Promise<{ exists: boolean; config: UserMCPServerConfig | null }> {
    const { data, error } = await supabase
      .from('user_mcp_server_configs')
      .select('*')
      .eq('upstream_url', upstreamUrl)
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return {
      exists: data !== null,
      config: data
    }
  },

  // Get tools for a config
  async getToolsByConfigId(configId: string): Promise<UserMCPServerToolConfig[]> {
    const { data, error } = await supabase
      .from('user_mcp_server_tool_configs')
      .select('*')
      .eq('config_id', configId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create a new config with tools
  async createConfig(
    userId: string,
    config: {
      upstream_url: string
      server_name: string
      server_description: string
      wallet_address: string
      tools: Array<{
        name: string
        description: string
        price: number
        enabled: boolean
      }>
    }
  ): Promise<string> {
    // Insert the main config
    const { data: configData, error: configError } = await supabase
      .from('user_mcp_server_configs')
      .insert({
        user_id: userId,
        upstream_url: config.upstream_url,
        server_name: config.server_name,
        server_description: config.server_description,
        wallet_address: config.wallet_address,
      })
      .select('id')
      .single()

    if (configError) throw configError

    const configId = configData.id

    // Insert the tools
    if (config.tools.length > 0) {
      const toolsToInsert = config.tools.map(tool => ({
        config_id: configId,
        name: tool.name,
        description: tool.description,
        price: tool.price,
        enabled: tool.enabled,
      }))

      const { error: toolsError } = await supabase
        .from('user_mcp_server_tool_configs')
        .insert(toolsToInsert)

      if (toolsError) throw toolsError
    }

    return configId
  },

  // Update a config
  async updateConfig(
    configId: string,
    userId: string,
    updates: Partial<Pick<UserMCPServerConfig, 'upstream_url' | 'server_name' | 'server_description' | 'wallet_address'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_mcp_server_configs')
      .update(updates)
      .eq('id', configId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Delete a config (tools will be cascade deleted)
  async deleteConfig(configId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_mcp_server_configs')
      .delete()
      .eq('id', configId)
      .eq('user_id', userId)

    if (error) throw error
  },

  // Update tool settings
  async updateTool(
    toolId: string,
    updates: Partial<Pick<UserMCPServerToolConfig, 'price' | 'enabled'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_mcp_server_tool_configs')
      .update(updates)
      .eq('id', toolId)

    if (error) throw error
  },
}
