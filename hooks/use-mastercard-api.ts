"use client"

import { useState } from "react"
import { MastercardAPIClient } from "@/lib/mastercard-api"

export function useMastercardAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize with your API credentials
  const apiClient = new MastercardAPIClient({
    consumerKey: process.env.NEXT_PUBLIC_MASTERCARD_CONSUMER_KEY || "",
    signingKey: process.env.MASTERCARD_SIGNING_KEY || "",
    environment: "sandbox", // Change to 'production' for live environment
  })

  const lookupBIN = async (bin: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.lookupBIN(bin)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const validateCard = async (cardNumber: string, expiryDate: string, cvv: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.validateCard(cardNumber, expiryDate, cvv)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    lookupBIN,
    validateCard,
    isLoading,
    error,
  }
}
