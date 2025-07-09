"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardBody } from "@/components/ui/card"
import { Globe, Building, CreditCard, Shield, Zap } from "lucide-react"

interface EnhancedBINDisplayProps {
  binData: any
  cardNumber: string
}

export function EnhancedBINDisplay({ binData, cardNumber }: EnhancedBINDisplayProps) {
  if (!binData) return null

  const getCardTypeIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "mcc":
      case "mastercard":
        return "🔴" // Mastercard
      case "visa":
        return "🔵" // Visa
      case "amex":
        return "🟢" // Amex
      default:
        return "💳"
    }
  }

  const getFundingSourceColor = (source: string) => {
    switch (source) {
      case "CREDIT":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "DEBIT":
        return "bg-green-100 text-green-800 border-green-200"
      case "PREPAID":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="mb-4">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getCardTypeIcon(binData.acceptanceBrand)}</span>
            <div>
              <h3 className="font-semibold text-lg">{binData.customerName}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                {binData.country.name} ({binData.country.alpha3})
              </p>
            </div>
          </div>
          <Badge className={getFundingSourceColor(binData.fundingSource)}>{binData.fundingSource}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <CreditCard className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <div className="text-xs text-gray-600">BIN</div>
            <div className="font-mono font-semibold">{binData.binNum}</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Building className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <div className="text-xs text-gray-600">ICA</div>
            <div className="font-mono font-semibold">{binData.ica}</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <div className="text-xs text-gray-600">Ürün</div>
            <div className="font-semibold text-sm">{binData.productCode}</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Zap className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <div className="text-xs text-gray-600">Tip</div>
            <div className="font-semibold text-sm">{binData.consumerType}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {binData.smartDataEnabled && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Smart Data Aktif
            </Badge>
          )}
          {binData.governmentRange && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Devlet Kartı
            </Badge>
          )}
          {binData.gamblingBlockEnabled && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Kumar Engeli
            </Badge>
          )}
          {binData.localUse && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Yerel Kullanım
            </Badge>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
