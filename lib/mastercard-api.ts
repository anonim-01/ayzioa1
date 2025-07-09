// Mastercard API integration utilities
interface MastercardConfig {
  consumerKey: string
  signingKey: string
  environment: "sandbox" | "production"
}

// Update the BINLookupResponse interface to match the actual API response
interface BINLookupResponse {
  lowAccountRange: number
  highAccountRange: number
  binNum: string
  binLength: number
  acceptanceBrand: string
  ica: string
  customerName: string
  country: {
    code: number
    alpha3: string
    name: string
  }
  localUse: boolean
  authorizationOnly: boolean
  productCode: string
  productDescription: string
  governmentRange: boolean
  nonReloadableIndicator: boolean
  anonymousPrepaidIndicator: string
  cardholderCurrencyIndicator: string
  programName: string | null
  vertical: string | null
  fundingSource: string
  consumerType: string
  smartDataEnabled: boolean
  affiliate: string | null
  comboCardIndicator: string
  flexCardIndicator: string
  gamblingBlockEnabled: boolean
  paymentAccountType: string
}

export class MastercardAPIClient {
  private config: MastercardConfig
  private baseUrl: string

  constructor(config: MastercardConfig) {
    this.config = config
    this.baseUrl =
      config.environment === "sandbox" ? "https://sandbox.api.mastercard.com" : "https://api.mastercard.com"
  }

  // OAuth 1.0a signature generation
  private generateOAuthSignature(method: string, url: string, body = "", timestamp: string, nonce: string): string {
    // Implementation would use the oauth1-signer library
    // This is a placeholder for the actual OAuth signature generation
    return "generated_signature"
  }

  // Generate OAuth authorization header
  private generateAuthHeader(method: string, url: string, body = ""): string {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = this.generateNonce()
    const bodyHash = this.generateBodyHash(body)
    const signature = this.generateOAuthSignature(method, url, body, timestamp, nonce)

    return `OAuth oauth_body_hash="${bodyHash}",oauth_nonce="${nonce}",oauth_signature="${signature}",oauth_consumer_key="${this.config.consumerKey}",oauth_signature_method="RSA-SHA256",oauth_timestamp="${timestamp}",oauth_version="1.0"`
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private generateBodyHash(body: string): string {
    // Generate SHA-256 hash of body and encode as base64
    // This would use crypto library in actual implementation
    return btoa(body) // Placeholder
  }

  // Update the lookupBIN method to use the correct endpoint and request format
  async lookupBIN(accountRange: string): Promise<BINLookupResponse | null> {
    const url = `${this.baseUrl}/bin-ranges/account-searches`
    const body = JSON.stringify({
      accountRange: accountRange,
    })

    const authHeader = this.generateAuthHeader("POST", url, body)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data: BINLookupResponse[] = await response.json()

      // API returns an array, we'll take the first result
      return data.length > 0 ? data[0] : null
    } catch (error) {
      console.error("Mastercard BIN Lookup API Error:", error)
      return null
    }
  }

  // Card validation API call
  async validateCard(cardNumber: string, expiryDate: string, cvv: string): Promise<boolean> {
    const url = `${this.baseUrl}/card-validation/v1/validate`
    const body = JSON.stringify({
      cardNumber,
      expiryDate,
      cvv,
    })

    const authHeader = this.generateAuthHeader("POST", url, body)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()
      return data.isValid
    } catch (error) {
      console.error("Mastercard API Error:", error)
      return false
    }
  }
}
