import type { TokenUsage } from './providers'
import { getProvider } from './providers'

// Pins a request to the provider/model captured when the user hit Send.
// Without it, changing Settings mid-generation would silently retarget
// later agent-loop steps to the new model.
export interface LlmPin {
  provider?: string
  model?: string
}

// Provider router: the UI talks to llmService, which looks the provider up
// in the registry (providers.ts) and delegates to it. Local Edition has a
// single provider (Ollama), so this is a thin pass-through kept for the
// shared call signature.
export const llmService = {
  isConfigured(): boolean {
    return getProvider().isConfigured()
  },

  sendMessage(
    message: string,
    context?: string,
    history: Array<{ role: string; content: string }> = [],
    onDelta?: (delta: string) => void,
    signal?: AbortSignal,
    pin?: LlmPin,
    agent?: boolean,
    onUsage?: (usage: TokenUsage) => void,
  ): Promise<string> {
    const provider = getProvider(pin?.provider)
    return provider.sendMessage({ message, context, history, onDelta, signal, model: pin?.model, agent, onUsage })
  },
}
