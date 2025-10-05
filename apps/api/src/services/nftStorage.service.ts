import { fetch } from "undici";

import envConfig from "../config/envConfig";

export interface MetadataPayload {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

class NftStorageService {
  private readonly apiKey = envConfig.NFT_STORAGE_API_KEY;
  private readonly gatewayBaseUrl = envConfig.NFT_STORAGE_GATEWAY_URL?.endsWith("/") ? envConfig.NFT_STORAGE_GATEWAY_URL : `${envConfig.NFT_STORAGE_GATEWAY_URL}/`;

  isEnabled(): boolean {
    return Boolean(this.apiKey);
  }

  async uploadMetadata(metadata: MetadataPayload): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await fetch("https://api.nft.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("NFT.Storage upload failed:", errorText);
        return null;
      }

      const result = (await response.json()) as { ok: boolean; value?: { cid: string } };
      if (!result.ok || !result.value?.cid) {
        console.error("NFT.Storage response missing CID", result);
        return null;
      }

      return `${this.gatewayBaseUrl}${result.value.cid}`;
    } catch (error) {
      console.error("Error uploading metadata to NFT.Storage:", error);
      return null;
    }
  }
}

export default new NftStorageService();
