import { ollamaService } from './ollamaService'

// Model capabilities, resolved per model. The UI and agent loop read these
// instead of branching on provider-id strings.
export interface ModelCaps {
  streaming: boolean
  thinking?: 'unsupported' | 'optional' | 'always-on'
  promptVariant: 'full' | 'compact'
  historyWindow?: number
}

export interface ModelInfo {
  id: string
  name?: string
  // API-reported version string (e.g. "3.8") - used to demote
  // previous-generation models in the dropdown. Absent for Ollama.
  version?: string
}

// Token counts reported back by a provider when its API returns them
// (Ollama prompt_eval_count/eval_count). Absent fields mean the provider
// did not report that direction.
export interface TokenUsage {
  input?: number
  output?: number
}

export interface SendArgs {
  message: string
  context?: string
  history: Array<{ role: string; content: string }>
  onDelta?: (delta: string) => void
  signal?: AbortSignal
  model?: string
  // True for harness-internal calls (agent loop, tool feedback turns,
  // history compaction). Providers may apply agent-oriented defaults
  // such as a low sampling temperature.
  agent?: boolean
  // Called once per response when the API reports token counts.
  onUsage?: (usage: TokenUsage) => void
}

// Local Edition ships exactly one backend: Ollama on localhost. There is
// no BYOK, no cloud provider, and no proxy - all inference traffic stays
// on this machine.
export interface ProviderDescriptor {
  id: string
  label: string
  isConfigured(): boolean
  sendMessage(args: SendArgs): Promise<string>
  listModels?(): Promise<ModelInfo[]>
  capabilities(modelId: string): ModelCaps
  // The model id a run should use right now, and the label the chat
  // header shows for it.
  resolveModel(): string
  modelLabel(): string
}

const ollamaProvider: ProviderDescriptor = {
  id: 'ollama',
  label: 'Ollama (local, offline)',
  isConfigured: () => ollamaService.isConfigured(),
  sendMessage: (a) =>
    ollamaService.sendMessage(a.message, a.context, a.history, a.onDelta, a.signal, a.model, a.agent, a.onUsage),
  listModels: async () => (await ollamaService.listModels()).map((id) => ({ id })),
  capabilities: (m) => ollamaService.capabilities(m),
  resolveModel: () => ollamaService.resolveModel(),
  modelLabel: () => ollamaService.modelLabel(),
}

export const providers: ProviderDescriptor[] = [ollamaProvider]

// The pin.provider value stored on in-flight requests still resolves to
// the single provider; unknown ids fall back to it as well.
export function getProvider(_id?: string): ProviderDescriptor {
  return ollamaProvider
}
