"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMastercardAPI } from "@/hooks/use-mastercard-api"
import { RefreshCw, CreditCard, Globe, Building, Info } from "lucide-react"

interface BINLookupCardProps {
  cardNumber: string
}

export function BINLookupCard({ cardNumber }: BINLookupCardProps) {
  const { lookupBIN, isLoading, error } = useMastercardAPI()
  const [binData, setBinData] = useState<any>(null)
  const [lastLookup, setLastLookup] = useState<string>("")

  const handleBINLookup = async () => {
    if (cardNumber.length >= 6) {
      const bin = cardNumber.substring(0, 8) // Use first 8 digits for better accuracy
      const result = await lookupBIN(bin)
      setBinData(result)
      setLastLookup(bin)
    }
  }

  // Auto-lookup when card number changes and has enough digits
  useEffect(() => {
    if (cardNumber.length >= 8 && cardNumber.substring(0, 8) !== lastLookup) {
      handleBINLookup()
    }
  }, [cardNumber])

  const formatAccountRange = (range: number) => {
    return range.toString().replace(/(\d{4})(?=\d)/g, "$1 ")
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Mastercard BIN Lookup
        </CardTitle>
      </CardHeader>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              onClick={handleBINLookup}
              disabled={isLoading || cardNumber.length < 6}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  BIN Sorgulanıyor...
                </>
              ) : (
                "BIN Bilgilerini Sorgula"
              )}
            </Button>

            {binData && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Son Güncelleme: {new Date().toLocaleString()}
              </Badge>
            )}
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center text-red-900">
                <Info className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  <strong>Hata:</strong> {error}
                </span>
              </div>
            </div>
          )}

          {binData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temel BIN Bilgileri */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  BIN Bilgileri
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <strong>BIN Numarası:</strong>
                    <span className="font-mono">{binData.binNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>BIN Uzunluğu:</strong>
                    <span>{binData.binLength} hane</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Kart Markası:</strong>
                    <Badge variant="outline">{binData.acceptanceBrand}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <strong>ICA Kodu:</strong>
                    <span className="font-mono">{binData.ica}</span>
                  </div>
                </div>
              </div>

              {/* Banka ve Ülke Bilgileri */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Banka Bilgileri
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Banka Adı:</strong>
                    <div className="mt-1 p-2 bg-white rounded border">{binData.customerName}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <strong>Ülke:</strong>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      <span>{binData.country.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {binData.country.alpha3}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ürün Bilgileri */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-3">Ürün Detayları</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <strong>Ürün Kodu:</strong>
                    <Badge variant="outline">{binData.productCode}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <strong>Ürün Açıklaması:</strong>
                    <span>{binData.productDescription}</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>Finansman Kaynağı:</strong>
                    <Badge
                      variant="outline"
                      className={
                        binData.fundingSource === "CREDIT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }
                    >
                      {binData.fundingSource}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <strong>Tüketici Tipi:</strong>
                    <span>{binData.consumerType}</span>
                  </div>
                </div>
              </div>

              {/* Özellikler ve İndikatörler */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-3">Kart Özellikleri</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${binData.smartDataEnabled ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      <span>Smart Data</span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${binData.gamblingBlockEnabled ? "bg-red-500" : "bg-green-500"}`}
                      ></div>
                      <span>Kumar Engeli</span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${binData.governmentRange ? "bg-blue-500" : "bg-gray-400"}`}
                      ></div>
                      <span>Devlet Kartı</span>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${binData.localUse ? "bg-orange-500" : "bg-gray-400"}`}
                      ></div>
                      <span>Yerel Kullanım</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <div className="flex justify-between">
                      <strong>Ödeme Hesap Tipi:</strong>
                      <Badge variant="outline">{binData.paymentAccountType}</Badge>
                    </div>
                    <div className="flex justify-between mt-1">
                      <strong>Anonim Prepaid:</strong>
                      <span>{binData.anonymousPrepaidIndicator === "Y" ? "Evet" : "Hayır"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {binData && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Hesap Aralığı Bilgileri</h4>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Alt Aralık:</strong>
                  <span className="font-mono ml-2">{formatAccountRange(binData.lowAccountRange)}</span>
                </div>
                <div>
                  <strong>Üst Aralık:</strong>
                  <span className="font-mono ml-2">{formatAccountRange(binData.highAccountRange)}</span>
                </div>
              </div>
            </div>
          )}

          {!binData && !isLoading && cardNumber.length >= 6 && (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>BIN bilgilerini görmek için "BIN Bilgilerini Sorgula" butonuna tıklayın</p>
              <p className="text-sm mt-1">Kart numarasının ilk 6-8 hanesi kullanılacaktır</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
