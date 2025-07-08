"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card"
import { useMastercardAPI } from "@/hooks/use-mastercard-api"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface MastercardIntegrationProps {
  cardNumber: string
  expiryDate: string
  cvv: string
}

export function MastercardIntegration({ cardNumber, expiryDate, cvv }: MastercardIntegrationProps) {
  const { lookupBIN, validateCard, isLoading, error } = useMastercardAPI()
  const [binData, setBinData] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<boolean | null>(null)

  const handleBINLookup = async () => {
    if (cardNumber.length >= 6) {
      const bin = cardNumber.substring(0, 6)
      const result = await lookupBIN(bin)
      setBinData(result)
    }
  }

  const handleCardValidation = async () => {
    if (cardNumber && expiryDate && cvv) {
      const result = await validateCard(cardNumber, expiryDate, cvv)
      setValidationResult(result)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <img src="/mastercard-logo.png" alt="Mastercard" className="w-8 h-8 mr-2" />
          Mastercard API Integration
        </CardTitle>
      </CardHeader>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Button onClick={handleBINLookup} disabled={isLoading || cardNumber.length < 6} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    BIN Sorgulanıyor...
                  </>
                ) : (
                  "BIN Bilgilerini Sorgula"
                )}
              </Button>

              <Button
                onClick={handleCardValidation}
                disabled={isLoading || !cardNumber || !expiryDate || !cvv}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Kart Doğrulanıyor...
                  </>
                ) : (
                  "Mastercard ile Doğrula"
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {binData && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">BIN Bilgileri</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>BIN:</strong> {binData.bin}
                    </div>
                    <div>
                      <strong>Marka:</strong> {binData.brand}
                    </div>
                    <div>
                      <strong>Banka:</strong> {binData.issuer}
                    </div>
                    <div>
                      <strong>Ülke:</strong> {binData.country}
                    </div>
                    <div>
                      <strong>Kart Tipi:</strong> {binData.cardType}
                    </div>
                  </div>
                </div>
              )}

              {validationResult !== null && (
                <div
                  className={`p-4 rounded-lg border ${
                    validationResult ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {validationResult ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-900">Mastercard Doğrulaması: Geçerli</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium text-red-900">Mastercard Doğrulaması: Geçersiz</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-red-900 text-sm">
                    <strong>Hata:</strong> {error}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">API Kullanım Bilgileri</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• BIN Lookup: Kart numarasının ilk 6 hanesini kullanarak banka bilgilerini sorgular</li>
              <li>• Card Validation: Gerçek Mastercard sistemleri ile kart doğrulaması yapar</li>
              <li>• OAuth 1.0a: Güvenli kimlik doğrulama protokolü kullanılır</li>
              <li>• Sandbox Environment: Test ortamında çalışmaktadır</li>
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
