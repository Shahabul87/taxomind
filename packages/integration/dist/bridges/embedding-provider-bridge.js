export function createEmbeddingProviderFromIntegration(adapter) {
    return {
        embed: (text) => adapter.embed(text),
        embedBatch: (texts) => adapter.embedBatch(texts),
        getDimensions: () => adapter.getDimensions(),
        getModelName: () => adapter.getModelName(),
    };
}
//# sourceMappingURL=embedding-provider-bridge.js.map