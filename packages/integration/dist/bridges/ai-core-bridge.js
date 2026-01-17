const mapMessages = (messages) => messages.map((message) => ({
    role: message.role,
    content: message.content,
}));
const resolveModel = (adapter, params, overrideModel) => params.model ?? overrideModel ?? adapter.getDefaultModel();
const buildOptions = (params, model) => ({
    model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    stopSequences: params.stopSequences,
});
const mapFinishReason = (reason) => {
    if (reason === 'stop')
        return 'stop';
    if (reason === 'length')
        return 'max_tokens';
    return 'error';
};
const chunkToStream = function* (chunk) {
    const content = chunk.delta?.content ?? '';
    const done = Boolean(chunk.finishReason);
    if (content.length > 0 || done) {
        yield { content, done };
    }
};
export function createCoreAIAdapterFromIntegration(adapter, options) {
    return {
        name: adapter.getName(),
        version: 'integration-bridge',
        isConfigured: () => true,
        getModel: () => resolveModel(adapter, { messages: [] }, options?.model),
        chat: async (params) => {
            const messages = mapMessages(params.messages);
            const model = resolveModel(adapter, params, options?.model);
            const completionOptions = buildOptions(params, model);
            const response = params.systemPrompt
                ? await adapter.chatWithSystem(params.systemPrompt, messages, completionOptions)
                : await adapter.chat(messages, completionOptions);
            return {
                content: response.content,
                model: response.model,
                usage: {
                    inputTokens: response.usage.promptTokens,
                    outputTokens: response.usage.completionTokens,
                },
                finishReason: mapFinishReason(response.finishReason),
            };
        },
        chatStream: async function* (params) {
            const messages = mapMessages(params.messages);
            const model = resolveModel(adapter, params, options?.model);
            const completionOptions = buildOptions(params, model);
            const stream = params.systemPrompt
                ? adapter.chatStreamWithSystem(params.systemPrompt, messages, completionOptions)
                : adapter.chatStream(messages, completionOptions);
            for await (const chunk of stream) {
                yield* chunkToStream(chunk);
            }
        },
    };
}
//# sourceMappingURL=ai-core-bridge.js.map