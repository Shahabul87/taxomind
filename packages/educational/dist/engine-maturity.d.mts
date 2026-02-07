/**
 * Engine Maturity Registry
 *
 * Tracks the implementation maturity level of each SAM engine.
 * Used for UI badges and documentation.
 *
 * Maturity levels:
 * - production    : Fully implemented, tested, stable
 * - beta          : Functional but may have rough edges
 * - experimental  : Early implementation, subject to change
 * - scaffold      : Placeholder/minimal implementation
 */
type EngineMaturityLevel = 'production' | 'beta' | 'experimental' | 'scaffold';
interface EngineMaturityInfo {
    engineId: string;
    maturity: EngineMaturityLevel;
    description?: string;
}
/**
 * Get the maturity level for a specific engine.
 */
declare function getEngineMaturity(engineId: string): EngineMaturityLevel;
/**
 * Get the maturity level for a SAM mode (based on its primary engines).
 * Returns the lowest maturity among the mode's engines.
 */
declare function getModeMaturity(enginePreset: string[]): EngineMaturityLevel;
/**
 * Get all engines at a specific maturity level.
 */
declare function getEnginesByMaturity(level: EngineMaturityLevel): string[];

export { type EngineMaturityInfo, type EngineMaturityLevel, getEngineMaturity, getEnginesByMaturity, getModeMaturity };
