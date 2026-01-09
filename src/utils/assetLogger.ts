export interface AssetError {
  type: 'image' | 'audio' | 'manifest' | 'network' | 'unknown';
  assetId: string;
  assetPath?: string;
  message: string;
  timestamp: string;
}

class AssetLogger {
  private errors: AssetError[] = [];
  private maxErrors = 100;

  logMissingAsset(assetId: string, assetPath: string, type: 'image' | 'audio' = 'image') {
    const error: AssetError = {
      type,
      assetId,
      assetPath,
      message: `Missing ${type} asset: ${assetPath}`,
      timestamp: new Date().toISOString(),
    };
    this.errors.push(error);
    
    // Keep logs bounded
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console for debugging
    console.warn(`[AssetLogger] ${error.message}`, { assetId, assetPath });
  }

  logNetworkError(message: string, context?: Record<string, any>) {
    const error: AssetError = {
      type: 'network',
      assetId: 'network-error',
      message: `Network error: ${message}`,
      timestamp: new Date().toISOString(),
    };
    this.errors.push(error);
    console.error(`[AssetLogger] ${error.message}`, context);
  }

  logManifestError(message: string, manifestPath?: string) {
    const error: AssetError = {
      type: 'manifest',
      assetId: 'manifest-error',
      assetPath: manifestPath,
      message: `Manifest error: ${message}`,
      timestamp: new Date().toISOString(),
    };
    this.errors.push(error);
    console.error(`[AssetLogger] ${error.message}`, { manifestPath });
  }

  getErrors(): AssetError[] {
    return [...this.errors];
  }

  getMissingAssets(): AssetError[] {
    return this.errors.filter(e => e.type === 'image' || e.type === 'audio');
  }

  getNetworkErrors(): AssetError[] {
    return this.errors.filter(e => e.type === 'network');
  }

  clear() {
    this.errors = [];
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

export const assetLogger = new AssetLogger();
