"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Copy,
  CreditCard,
  Clipboard,
  Trash2,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

// Import the new BIN Lookup component
import { BINLookupCard } from "@/components/bin-lookup-card"

export default function CreditCardValidator() {
  const [cardNumber, setCardNumber] = useState("")
  const [cardType, setCardType] = useState("visa")
  const [detectedCardType, setDetectedCardType] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isBinValid, setIsBinValid] = useState<boolean | null>(null)
  const [binInfo, setBinInfo] = useState<string | null>(null)
  const [isPasteIcon, setIsPasteIcon] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLiveChecking, setIsLiveChecking] = useState(false)
  const [liveCheckResult, setLiveCheckResult] = useState<"valid" | "invalid" | "checking" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Add these new state variables after the existing state declarations
  const [checkedCards, setCheckedCards] = useState<
    Array<{
      number: string
      type: string
      timestamp: Date
      isValid: boolean
    }>
  >([])
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isExpiryValid, setIsExpiryValid] = useState<boolean | null>(null)
  const [isCvvValid, setIsCvvValid] = useState<boolean | null>(null)
  const [bulkCardNetwork, setBulkCardNetwork] = useState("visa")
  const [bulkCardCount, setBulkCardCount] = useState("10")
  const [bulkCardFormat, setBulkCardFormat] = useState("web")
  const [bulkCardCountry, setBulkCardCountry] = useState("tr")
  const [generatedCards, setGeneratedCards] = useState<
    Array<{
      number: string
      type: string
      cvv: string
      expiry: string
      isValid: boolean
      bank: string
      country: string
    }>
  >([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const cardsPerPage = 10
  const [bulkCheckFilter, setBulkCheckFilter] = useState<"all" | "valid" | "invalid">("all")
  const [filteredBulkCheckResults, setFilteredBulkCheckResults] = useState<
    Array<{
      number: string
      type: string | null
      cvv: string
      expiry: string
      isValid: boolean
      bank: string
      country: string
    }>
  >([])
  const [generatedCardsFilter, setGeneratedCardsFilter] = useState<"all" | "valid" | "invalid">("all")
  const [filteredGeneratedCards, setFilteredGeneratedCards] = useState<
    Array<{
      number: string
      type: string
      cvv: string
      expiry: string
      isValid: boolean
      bank: string
      country: string
    }>
  >([])

  // Card type patterns and BIN ranges based on the provided table
  // Priority order matters for overlapping BIN ranges
  const cardTypes = {
    amex: {
      name: "American Express",
      bins: [
        { range: /^34/, description: "American Express" },
        { range: /^37/, description: "American Express" },
      ],
      lengths: [15],
      luhn: true,
      color: "bg-blue-400",
    },
    mastercard: {
      name: "MasterCard",
      bins: [
        { range: /^222[1-9]/, description: "MasterCard" },
        { range: /^22[3-9]/, description: "MasterCard" },
        { range: /^2[3-6]/, description: "MasterCard" },
        { range: /^270[0-9]/, description: "MasterCard" },
        { range: /^271[0-9]/, description: "MasterCard" },
        { range: /^2720/, description: "MasterCard" },
        { range: /^51/, description: "MasterCard" },
        { range: /^52/, description: "MasterCard" },
        { range: /^53/, description: "MasterCard" },
        { range: /^54/, description: "MasterCard" },
        { range: /^55/, description: "MasterCard" },
      ],
      lengths: [16],
      luhn: true,
      color: "bg-red-500",
    },
    visa: {
      name: "Visa",
      bins: [{ range: /^4/, description: "Visa" }],
      lengths: [13, 16, 19],
      luhn: true,
      color: "bg-blue-600",
    },
    discover: {
      name: "Discover",
      bins: [
        { range: /^6011/, description: "Discover Card" },
        { range: /^622(?:12[6-9]|1[3-9]|[2-8]|9[0-1]|9[2-5])/, description: "Discover Card" },
        { range: /^64[4-9]/, description: "Discover Card" },
        { range: /^65/, description: "Discover Card" },
      ],
      lengths: [16],
      luhn: true,
      color: "bg-orange-500",
    },
    diners: {
      name: "Diners Club",
      bins: [
        { range: /^300/, description: "Diners Club Carte Blanche" },
        { range: /^301/, description: "Diners Club Carte Blanche" },
        { range: /^302/, description: "Diners Club Carte Blanche" },
        { range: /^303/, description: "Diners Club Carte Blanche" },
        { range: /^304/, description: "Diners Club Carte Blanche" },
        { range: /^305/, description: "Diners Club Carte Blanche" },
        { range: /^36/, description: "Diners Club International" },
        // Note: 54, 55 are shared with MasterCard but MasterCard has priority
      ],
      lengths: [14, 16],
      luhn: true,
      color: "bg-gray-500",
    },
    jcb: {
      name: "JCB",
      bins: [
        { range: /^352[8-9]/, description: "JCB" },
        { range: /^35[3-8]/, description: "JCB" },
        { range: /^3589/, description: "JCB" },
      ],
      lengths: [16],
      luhn: true,
      color: "bg-green-500",
    },
    maestro: {
      name: "Maestro",
      bins: [
        { range: /^50/, description: "Maestro" },
        { range: /^56/, description: "Maestro" },
        { range: /^57/, description: "Maestro" },
        { range: /^58/, description: "Maestro" },
        { range: /^6/, description: "Maestro" },
      ],
      lengths: [12, 13, 14, 15, 16, 17, 18, 19],
      luhn: true,
      color: "bg-red-300",
    },
    unionpay: {
      name: "China UnionPay",
      bins: [{ range: /^62/, description: "China UnionPay" }],
      lengths: [16, 17, 18, 19],
      luhn: false, // UnionPay doesn't use Luhn algorithm
      color: "bg-green-600",
    },
  }

  const sampleCards = {
    amex: "371449635398431",
    diners: "30569309025904",
    discover: "6011111111111117",
    jcb: "3530111333300000",
    mastercard: "5555555555554444", // This is a MasterCard, not Diners Club
    visa: "4916592289993918",
  }

  // Detect card type from number
  const detectCardType = (number: string) => {
    const digits = number.replace(/\D/g, "")

    if (digits.length < 2) return null

    // Check each card type's BIN patterns
    for (const [type, info] of Object.entries(cardTypes)) {
      for (const bin of info.bins) {
        if (bin.range.test(digits)) {
          return {
            type,
            description: bin.description,
            lengths: info.lengths,
            luhn: info.luhn,
          }
        }
      }
    }

    return null
  }

  // Validate BIN (first 6 digits)
  const validateBin = (number: string) => {
    const digits = number.replace(/\D/g, "")

    if (digits.length < 6) return null

    const bin = digits.substring(0, 6)
    const detected = detectCardType(bin)

    if (detected) {
      return {
        valid: true,
        bin,
        type: detected.type,
        description: detected.description,
      }
    }

    return {
      valid: false,
      bin,
    }
  }

  // Luhn algorithm for credit card validation
  const luhnCheck = (digits: string) => {
    let sum = 0
    let shouldDouble = false

    // Process from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(digits.charAt(i))

      if (shouldDouble) {
        digit *= 2
        if (digit > 9) digit -= 9
      }

      sum += digit
      shouldDouble = !shouldDouble
    }

    return sum % 10 === 0
  }

  // Add this function after the existing validation functions
  const validateExpiryDate = (expiry: string) => {
    // Check format MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return false
    }

    const [monthStr, yearStr] = expiry.split("/")
    const month = Number.parseInt(monthStr, 10)
    const year = Number.parseInt(yearStr, 10) + 2000 // Convert to 20YY

    // Check if month is valid (1-12)
    if (month < 1 || month > 12) {
      return false
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

    // Check if the card is not expired
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false
    }

    return true
  }

  // Add this function after validateExpiryDate
  const validateCvv = (cvvCode: string, cardType: string) => {
    // Remove any non-digit characters
    const digits = cvvCode.replace(/\D/g, "")

    // Amex requires 4 digits, others require 3
    if (cardType === "amex") {
      return digits.length === 4
    } else {
      return digits.length === 3
    }
  }

  // Replace the existing performLiveCheck function with this enhanced version
  const performLiveCheck = async (cardNumber: string) => {
    setLiveCheckResult("checking")

    // Validate expiry date and CVV first
    const expiryValid = validateExpiryDate(expiryDate)
    setIsExpiryValid(expiryValid)

    const detectedType = detectCardType(cardNumber)?.type || cardType
    const cvvValid = validateCvv(cvv, detectedType)
    setIsCvvValid(cvvValid)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For demo purposes, use a more sophisticated algorithm to determine if a card is valid
    const digits = cardNumber.replace(/\D/g, "")

    // Check if card passes Luhn algorithm
    const luhnValid = luhnCheck(digits)

    // Check if BIN is valid
    const binValidation = validateBin(digits)
    const binValid = binValidation?.valid || false

    // Check if expiry date is valid and not too far in the future (realistic)
    let expiryRealistic = false
    if (expiryValid) {
      const [monthStr, yearStr] = expiryDate.split("/")
      const year = Number.parseInt(yearStr, 10) + 2000
      const currentYear = new Date().getFullYear()
      expiryRealistic = year <= currentYear + 10 // Not more than 10 years in the future
    }

    // Check if the card number length is valid for the detected card type
    const lengthValid = detectedType
      ? cardTypes[detectedType as keyof typeof cardTypes].lengths.includes(digits.length)
      : false

    // Determine if the card is valid based on all checks
    // For demo purposes, we'll use a weighted approach
    const validationScore =
      (luhnValid ? 40 : 0) +
      (binValid ? 30 : 0) +
      (expiryValid ? 15 : 0) +
      (expiryRealistic ? 5 : 0) +
      (cvvValid ? 10 : 0) +
      (lengthValid ? 20 : 0)

    // Card is considered valid if it scores at least 70 points
    const isValid = validationScore >= 70

    setLiveCheckResult(isValid ? "valid" : "invalid")

    // Add to checked cards history
    const newCheckedCard = {
      number: digits,
      type: detectedType,
      timestamp: new Date(),
      isValid,
    }

    setCheckedCards((prev) => {
      // Add new card to the beginning and keep only the last 10
      const updated = [newCheckedCard, ...prev]
      return updated.slice(0, 10)
    })

    return isValid
  }

  // Fallback clipboard paste function
  const fallbackPaste = () => {
    // Focus the input element
    if (inputRef.current) {
      inputRef.current.focus()

      // Prompt the user to paste manually
      toast({
        title: "Yapıştırma İzni Yok",
        description: "Lütfen Ctrl+V (veya Cmd+V) tuşlarına basarak manuel olarak yapıştırın.",
        duration: 5000,
      })
    }
  }

  const handlePasteOrClear = async () => {
    if (isPasteIcon) {
      try {
        // Try to use the Clipboard API
        const text = await navigator.clipboard.readText()
        setCardNumber(text.replace(/\D/g, ""))
      } catch (err) {
        console.error("Clipboard access denied:", err)
        // Use fallback method
        fallbackPaste()
      }
    } else {
      setCardNumber("")
      setIsValid(null)
      setErrorMessage(null)
      setIsBinValid(null)
      setDetectedCardType(null)
      setBinInfo(null)
      setLiveCheckResult(null)
    }
  }

  // Fallback clipboard copy function
  const fallbackCopy = (text: string) => {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea")
    textArea.value = text

    // Make the textarea out of viewport
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)

    // Select and copy the text
    textArea.focus()
    textArea.select()

    let success = false
    try {
      success = document.execCommand("copy")
    } catch (err) {
      console.error("Fallback: Copying text failed", err)
    }

    document.body.removeChild(textArea)
    return success
  }

  const copyToClipboard = (text: string) => {
    // Try to use the Clipboard API first
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(text)
          setTimeout(() => setCopied(null), 2000)
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          // Use fallback method
          const success = fallbackCopy(text)
          if (success) {
            setCopied(text)
            setTimeout(() => setCopied(null), 2000)
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart numarası kopyalanamadı. Lütfen manuel olarak seçip kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(text)
      if (success) {
        setCopied(text)
        setTimeout(() => setCopied(null), 2000)
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart numarası kopyalanamadı. Lütfen manuel olarak seçip kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }

  // Replace the existing validateCreditCard function with this enhanced version
  const validateCreditCard = async () => {
    if (!cardNumber.trim()) {
      setIsValid(false)
      setErrorMessage("Kart numarası boş olamaz.")
      return false
    }

    // Remove all non-digit characters
    const digits = cardNumber.replace(/\D/g, "")

    // Detect card type
    const detected = detectCardType(digits)

    if (!detected) {
      setIsValid(false)
      setErrorMessage("Tanınmayan kart numarası formatı.")
      return false
    }

    // Check if the length is valid for this card type
    if (!detected.lengths.includes(digits.length)) {
      setIsValid(false)
      setErrorMessage(
        `${detected.description} kartı için geçerli uzunluklar: ${detected.lengths.join(", ")} hanedir. Şu anda ${digits.length} hane girdiniz.`,
      )
      return false
    }

    // Check Luhn algorithm if required for this card type
    if (detected.luhn && !luhnCheck(digits)) {
      setIsValid(false)
      setErrorMessage("Kart numarası geçerli değil (Luhn algoritması kontrolü başarısız).")
      return false
    }

    // If live checking is enabled, perform a live check
    if (isLiveChecking) {
      if (!expiryDate) {
        setIsValid(false)
        setErrorMessage("Son kullanma tarihi gereklidir.")
        return false
      }

      if (!cvv) {
        setIsValid(false)
        setErrorMessage("CVV kodu gereklidir.")
        return false
      }

      const liveCheckValid = await performLiveCheck(digits)
      if (!liveCheckValid) {
        setIsValid(false)
        setErrorMessage("Kart numarası canlı kontrolde geçersiz.")
        return false
      }
    } else {
      // Add to checked cards history even without live check
      const newCheckedCard = {
        number: digits,
        type: detected.type,
        timestamp: new Date(),
        isValid: true,
      }

      setCheckedCards((prev) => {
        const updated = [newCheckedCard, ...prev]
        return updated.slice(0, 10)
      })

      setLiveCheckResult(null)
    }

    // All checks passed
    setIsValid(true)
    setErrorMessage(null)
    return true
  }

  const handleSample = () => {
    setCardNumber(sampleCards[cardType as keyof typeof sampleCards])
    setIsValid(null)
    setErrorMessage(null)
    setLiveCheckResult(null)
  }

  // Add these handlers for the new input fields
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d/]/g, "")

    // Auto-format as MM/YY
    if (input.length === 2 && !input.includes("/") && expiryDate.length === 1) {
      input += "/"
    }

    // Limit to MM/YY format (5 characters)
    if (input.length <= 5) {
      setExpiryDate(input)
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "")

    // Limit CVV to 3 or 4 digits based on card type
    const maxLength = cardType === "amex" ? 4 : 3
    if (input.length <= maxLength) {
      setCvv(input)
    }
  }

  // Add this to the handleReset function
  const handleReset = () => {
    setCardNumber("")
    setIsValid(null)
    setErrorMessage(null)
    setIsBinValid(null)
    setDetectedCardType(null)
    setBinInfo(null)
    setLiveCheckResult(null)
    setExpiryDate("")
    setCvv("")
    setIsExpiryValid(null)
    setIsCvvValid(null)
  }

  const handleContinue = async () => {
    const valid = await validateCreditCard()

    if (valid) {
      toast({
        title: "Ödeme İşlemi",
        description: "Ödeme işlemi devam ediyor...",
        duration: 3000,
      })
      // Here you would typically redirect to the next step or process the payment
    }
  }

  const handleLiveCheckToggle = (checked: boolean) => {
    setIsLiveChecking(checked)
    if (!checked) {
      setLiveCheckResult(null)
    }
  }

  useEffect(() => {
    setIsPasteIcon(!cardNumber)
  }, [cardNumber])

  useEffect(() => {
    // Reset validation when card type changes
    setIsValid(null)
    setErrorMessage(null)
    setLiveCheckResult(null)
  }, [cardType])

  useEffect(() => {
    // Detect card type when card number changes
    const detected = detectCardType(cardNumber)

    if (detected) {
      setDetectedCardType(detected.type)

      // If a card type is detected and it's different from the current selection,
      // update the selected card type
      if (detected.type !== cardType) {
        setCardType(detected.type)
      }
    } else {
      setDetectedCardType(null)
    }

    // Validate BIN when 6 or more digits are entered
    if (cardNumber.length >= 6) {
      const binValidation = validateBin(cardNumber)
      setIsBinValid(binValidation?.valid || false)

      if (binValidation?.valid) {
        setBinInfo(`${binValidation.bin} - ${binValidation.description}`)
      } else if (binValidation) {
        setBinInfo(null)
      }
    } else {
      setIsBinValid(null)
      setBinInfo(null)
    }

    // Reset live check result when card number changes
    setLiveCheckResult(null)
  }, [cardNumber, cardType])

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract only digits from the input
    const rawInput = e.target.value
    const digits = rawInput.replace(/\D/g, "")

    // If a card type is detected, use its maximum allowed length
    const detected = detectCardType(digits)
    const maxLength = detected ? Math.max(...detected.lengths) : 19

    // Limit input to the maximum length
    if (digits.length <= maxLength) {
      setCardNumber(digits)
    }
  }

  // Handle manual paste via keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check for Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
      // Let the default paste behavior happen
      // The onChange handler will process the pasted content
    }
  }

  // Format card number for display
  const formatCardNumber = (number: string) => {
    const digits = number.replace(/\D/g, "")
    const detected = detectCardType(digits)

    if (!detected) return digits

    // Format based on card type
    if (detected.type === "amex") {
      // AMEX format: XXXX XXXXXX XXXXX
      return digits
        .replace(/(\d{4})(\d{6})(\d{0,5})/, (match, p1, p2, p3) => p1 + (p2 ? " " + p2 : "") + (p3 ? " " + p3 : ""))
        .trim()
    } else if (detected.type === "diners" && digits.length === 14) {
      // Diners Club 14-digit format: XXXX XXXXXX XXXX
      return digits.replace(/(\d{4})(\d{6})(\d{4})/, "$1 $2 $3").trim()
    } else {
      // Default format: XXXX XXXX XXXX XXXX
      return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
    }
  }

  // Get card type display name
  const getCardTypeNameFunc = (type: string) => {
    return cardTypes[type as keyof typeof cardTypes]?.name || type
  }

  // Get card color
  const getCardColorFunc = (type: string) => {
    return cardTypes[type as keyof typeof cardTypes]?.color || "bg-gray-500"
  }

  // Kart oluşturma algoritmasını düzelt - kart numaralarının doğru uzunlukta oluşturulduğundan emin ol
  const generateCreditCardNumber = (type: string) => {
    // Random kart tipi seçimi
    if (type === "null") {
      const cardTypes = ["visa", "mastercard", "amex", "discover", "diners", "jcb"]
      type = cardTypes[Math.floor(Math.random() * cardTypes.length)]
    }

    // Kart tipi bilgilerini al
    const cardInfo = cardTypes[type as keyof typeof cardTypes]
    if (!cardInfo) return { number: "", bank: "", country: "" }

    let prefix = ""
    let bankInfo = { name: "", country: "" }
    let length = 16 // Varsayılan uzunluk
    let attempts = 0
    const maxAttempts = 10

    // Her kart tipi için doğru uzunluğu belirle
    switch (type) {
      case "visa":
        length = 16 // Visa için standart 16 hane
        const visaPrefixes = [
          { bin: "4532", bank: "HSBC Bank", country: "TR" },
          { bin: "4546", bank: "İş Bankası", country: "TR" },
          { bin: "4157", bank: "Garanti BBVA", country: "TR" },
          { bin: "4119", bank: "Akbank", country: "TR" },
          { bin: "4987", bank: "Yapı Kredi", country: "TR" },
          { bin: "4130", bank: "QNB Finansbank", country: "TR" },
          { bin: "4766", bank: "Citibank", country: "US" },
          { bin: "4147", bank: "Barclays", country: "GB" },
          { bin: "4024", bank: "Deutsche Bank", country: "DE" },
          { bin: "4628", bank: "BNP Paribas", country: "FR" },
        ]
        const visaChoice = visaPrefixes[Math.floor(Math.random() * visaPrefixes.length)]
        prefix = visaChoice.bin
        bankInfo = { name: visaChoice.bank, country: visaChoice.country }
        break
      case "mastercard":
        length = 16 // MasterCard için standart 16 hane
        const mcPrefixes = [
          { bin: "5301", bank: "Ziraat Bankası", country: "TR" },
          { bin: "5492", bank: "Yapı Kredi", country: "TR" },
          { bin: "5269", bank: "Garanti BBVA", country: "TR" },
          { bin: "5170", bank: "Akbank", country: "TR" },
          { bin: "5401", bank: "İş Bankası", country: "TR" },
          { bin: "5426", bank: "Halkbank", country: "TR" },
          { bin: "5411", bank: "Citibank", country: "US" },
          { bin: "5218", bank: "HSBC", country: "GB" },
          { bin: "5315", bank: "Deutsche Bank", country: "DE" },
          { bin: "5407", bank: "BNP Paribas", country: "FR" },
        ]
        const mcChoice = mcPrefixes[Math.floor(Math.random() * mcPrefixes.length)]
        prefix = mcChoice.bin
        bankInfo = { name: mcChoice.bank, country: mcChoice.country }
        break
      case "amex":
        length = 15 // Amex için standart 15 hane
        const amexPrefixes = [
          { bin: "3400", bank: "American Express", country: "US" },
          { bin: "3700", bank: "American Express", country: "US" },
          { bin: "3734", bank: "American Express", country: "GB" },
          { bin: "3764", bank: "American Express", country: "TR" },
        ]
        const amexChoice = amexPrefixes[Math.floor(Math.random() * amexPrefixes.length)]
        prefix = amexChoice.bin
        bankInfo = { name: amexChoice.bank, country: amexChoice.country }
        break
      case "discover":
        length = 16 // Discover için standart 16 hane
        const discoverPrefixes = [
          { bin: "6011", bank: "Discover", country: "US" },
          { bin: "6446", bank: "Discover", country: "US" },
          { bin: "6510", bank: "Discover", country: "US" },
        ]
        const discoverChoice = discoverPrefixes[Math.floor(Math.random() * discoverPrefixes.length)]
        prefix = discoverChoice.bin
        bankInfo = { name: discoverChoice.bank, country: discoverChoice.country }
        break
      case "diners":
        length = 14 // Diners Club için standart 14 hane
        const dinersPrefixes = [
          { bin: "3001", bank: "Diners Club", country: "US" },
          { bin: "3056", bank: "Diners Club", country: "GB" },
          { bin: "3634", bank: "Diners Club", country: "TR" },
          { bin: "3896", bank: "Diners Club", country: "DE" },
        ]
        const dinersChoice = dinersPrefixes[Math.floor(Math.random() * dinersPrefixes.length)]
        prefix = dinersChoice.bin
        bankInfo = { name: dinersChoice.bank, country: dinersChoice.country }
        break
      case "jcb":
        length = 16 // JCB için standart 16 hane
        const jcbPrefixes = [
          { bin: "3528", bank: "JCB", country: "JP" },
          { bin: "3554", bank: "JCB", country: "JP" },
          { bin: "3589", bank: "JCB", country: "JP" },
        ]
        const jcbChoice = jcbPrefixes[Math.floor(Math.random() * jcbPrefixes.length)]
        prefix = jcbChoice.bin
        bankInfo = { name: jcbChoice.bank, country: jcbChoice.country }
        break
      default:
        // Varsayılan olarak 16 hane
        length = 16
        bankInfo = { name: "Bilinmeyen Banka", country: bulkCardCountry.toUpperCase() }
    }

    // Geçerli kart numarası oluşturmak için döngü
    while (attempts < maxAttempts) {
      // Kalan rakamları oluştur (tam olarak belirtilen uzunluğa gelecek şekilde)
      let number = prefix
      const remainingLength = length - prefix.length - 1 // Check digit için 1 hane ayırıyoruz

      for (let i = 0; i < remainingLength; i++) {
        number += Math.floor(Math.random() * 10)
      }

      // Luhn algoritması ile check digit hesapla
      if (cardInfo.luhn) {
        let sum = 0
        let shouldDouble = false

        // Sağdan sola doğru işlem
        for (let i = number.length - 1; i >= 0; i--) {
          let digit = Number.parseInt(number.charAt(i))

          if (shouldDouble) {
            digit *= 2
            if (digit > 9) digit -= 9
          }

          sum += digit
          shouldDouble = !shouldDouble
        }

        const checkDigit = (10 - (sum % 10)) % 10
        number += checkDigit
      } else {
        // Luhn gerekli değilse rastgele bir rakam ekle
        number += Math.floor(Math.random() * 10)
      }

      // Kartın geçerliliğini kontrol et
      const isLuhnValid = cardInfo.luhn ? luhnCheck(number) : true
      const detected = detectCardType(number)
      const isLengthValid = detected ? detected.lengths.includes(number.length) : false
      const binValidation = validateBin(number)
      const isBinValid = binValidation?.valid || false

      // Eğer kart geçerliyse döndür
      if (isLuhnValid && isLengthValid && isBinValid && number.length === length) {
        return { number, bank: bankInfo.name, country: bankInfo.country }
      }

      attempts++
    }

    // Eğer geçerli kart oluşturulamazsa, en azından format olarak doğru bir kart döndür
    console.warn(`${type} için ${maxAttempts} denemede geçerli kart oluşturulamadı`)
    return { number: "", bank: bankInfo.name, country: bankInfo.country }
  }

  // CVV oluşturmayı düzelt
  const generateCVV = (cardType: string) => {
    const length = cardType === "amex" ? 4 : 3
    let cvv = ""
    for (let i = 0; i < length; i++) {
      cvv += Math.floor(Math.random() * 10)
    }
    return cvv.padStart(length, "0") // Eksik basamakları 0 ile doldur
  }

  // Toplu Checker fonksiyonu ekle
  const [bulkCardInput, setBulkCardInput] = useState("")
  const [bulkCheckResults, setBulkCheckResults] = useState<
    Array<{
      number: string
      type: string | null
      cvv: string
      expiry: string
      isValid: boolean
      bank: string
      country: string
    }>
  >([])
  const [isBulkChecking, setIsBulkChecking] = useState(false)

  // Modify the performBulkCheck function to support different formats
  // Replace the existing performBulkCheck function with this improved version:

  const performBulkCheck = async () => {
    setIsBulkChecking(true)

    // Split input into lines and filter out empty lines
    const lines = bulkCardInput.split("\n").filter((line) => line.trim())
    const results = []

    for (const line of lines) {
      // Support for multiple formats:
      // 1. 5255 9391 0489 8994 | 05/26 | 244
      // 2. 5555555555554444 05/26 | 244
      // 3. 5555 5555 5555 4444 244 06/25
      // 4. 4546 5691 4776 4006 10 29 564 (card number, month, year, cvv)
      let cardNumber = ""
      let cvv = ""
      let expiry = ""

      // Try to parse with pipe separators first
      if (line.includes("|")) {
        const parts = line.split("|").map((part) => part.trim())

        // Format with pipes: cardNumber | expiry | cvv
        if (parts.length >= 3) {
          cardNumber = parts[0]
          expiry = parts[1]
          cvv = parts[2]
        }
        // Format with one pipe: cardNumber expiry | cvv
        else if (parts.length === 2) {
          const firstPart = parts[0].trim().split(/\s+/)
          // Last part is expiry, the rest is cardNumber
          if (firstPart.length >= 2) {
            expiry = firstPart[firstPart.length - 1]
            cardNumber = firstPart.slice(0, firstPart.length - 1).join("")
          }
          cvv = parts[1]
        }
      }
      // No pipes format: parse based on spaces
      else {
        const parts = line.trim().split(/\s+/)

        // If we have at least 4 parts (card number parts + month + year + cvv)
        if (parts.length >= 4) {
          // Check if we have a format like: 4546 5691 4776 4006 10 29 564
          // Where parts are: [card1, card2, card3, card4, month, year, cvv]
          if (parts.length >= 7) {
            // Last part is CVV
            cvv = parts[parts.length - 1]

            // Second to last is year
            const year = parts[parts.length - 2]

            // Third to last is month
            const month = parts[parts.length - 3]

            // Format expiry as MM/YY
            expiry = `${month.padStart(2, "0")}/${year.padStart(2, "0")}`

            // The rest is card number
            cardNumber = parts.slice(0, parts.length - 3).join("")
          }
          // Check if we have a format with MM/YY already formatted
          else if (parts.length >= 3 && parts[parts.length - 2].includes("/")) {
            cvv = parts[parts.length - 1]
            expiry = parts[parts.length - 2]
            cardNumber = parts.slice(0, parts.length - 2).join("")
          }
          // Otherwise try to parse as: cardNumber cvv expiry or cardNumber expiry cvv
          else {
            // Try to determine if the second-to-last part looks like a month (01-12)
            const secondToLast = parts[parts.length - 2]
            const isSecondToLastMonth = /^(0[1-9]|1[0-2])$/.test(secondToLast)

            if (isSecondToLastMonth) {
              // Format is likely: cardNumber month year cvv
              const month = parts[parts.length - 2]
              const year = parts[parts.length - 1]
              cvv = parts[parts.length - 3]
              expiry = `${month}/${year}`
              cardNumber = parts.slice(0, parts.length - 3).join("")
            } else {
              // Try standard format: cardNumber expiry cvv
              cvv = parts[parts.length - 1]
              expiry = parts[parts.length - 2]
              cardNumber = parts.slice(0, parts.length - 2).join("")
            }
          }
        }
      }

      // Remove all non-digit characters from card number
      cardNumber = cardNumber.replace(/\D/g, "")
      cvv = cvv.replace(/\D/g, "")

      // Format expiry as MM/YY if it's not already
      if (expiry && !expiry.includes("/")) {
        // If expiry is just two numbers like "10 29", format as MM/YY
        const expiryParts = expiry.split(/\s+/)
        if (expiryParts.length === 2) {
          expiry = `${expiryParts[0]}/${expiryParts[1]}`
        }
        // If expiry is just a single number (like "29"), it's likely just the year
        // In this case, use a default month (01) and format as MM/YY
        else if (/^\d{1,2}$/.test(expiry)) {
          // Check if it's a month (1-12) or a year
          const num = Number.parseInt(expiry, 10)
          if (num >= 1 && num <= 12) {
            // It's likely a month, use current year + 1 as default
            const year = new Date().getFullYear() + 1
            expiry = `${expiry.padStart(2, "0")}/${year.toString().slice(2)}`
          } else {
            // It's likely a year, use 01 as default month
            expiry = `01/${expiry.padStart(2, "0")}`
          }
        }
      }

      if (cardNumber) {
        // Detect card type
        const detected = detectCardType(cardNumber)
        const type = detected ? detected.type : null

        // Validate card number
        const digits = cardNumber.replace(/\D/g, "")
        const isLuhnValid = luhnCheck(digits)
        const binValidation = validateBin(digits)
        const isLengthValid = detected ? detected.lengths.includes(digits.length) : false

        // Determine if the card is valid
        const isValid = isLuhnValid && isLengthValid && (binValidation?.valid || false)

        // Enhanced bank and country detection based on BIN
        let bank = "Bilinmeyen"
        let country = "Bilinmeyen"

        // Improved bank and country detection based on card number
        // Check first 6 digits (BIN)
        const bin = digits.substring(0, 6)

        // Visa cards
        if (type === "visa") {
          if (bin.startsWith("4532")) {
            bank = "HSBC Bank"
            country = "TR"
          } else if (bin.startsWith("4546")) {
            bank = "İş Bankası"
            country = "TR"
          } else if (bin.startsWith("4157")) {
            bank = "Garanti BBVA"
            country = "TR"
          } else if (bin.startsWith("4119")) {
            bank = "Akbank"
            country = "TR"
          } else if (bin.startsWith("4987")) {
            bank = "Yapı Kredi"
            country = "TR"
          } else if (bin.startsWith("4130")) {
            bank = "QNB Finansbank"
            country = "TR"
          } else if (bin.startsWith("4766")) {
            bank = "Citibank"
            country = "US"
          } else if (bin.startsWith("4147")) {
            bank = "Barclays"
            country = "GB"
          } else if (bin.startsWith("4024")) {
            bank = "Deutsche Bank"
            country = "DE"
          } else if (bin.startsWith("4628")) {
            bank = "BNP Paribas"
            country = "FR"
          } else if (bin.startsWith("4025")) {
            bank = "Bank of America"
            country = "US"
          } else if (bin.startsWith("4067")) {
            bank = "Chase Bank"
            country = "US"
          } else if (bin.startsWith("4319")) {
            bank = "ING Bank"
            country = "NL"
          } else if (bin.startsWith("4571")) {
            bank = "Denizbank"
            country = "TR"
          } else if (bin.startsWith("4462")) {
            bank = "TEB Bank"
            country = "TR"
          }
        }
        // MasterCard
        else if (type === "mastercard") {
          if (bin.startsWith("5301")) {
            bank = "Ziraat Bankası"
            country = "TR"
          } else if (bin.startsWith("5492")) {
            bank = "Yapı Kredi"
            country = "TR"
          } else if (bin.startsWith("5269")) {
            bank = "Garanti BBVA"
            country = "TR"
          } else if (bin.startsWith("5170")) {
            bank = "Akbank"
            country = "TR"
          } else if (bin.startsWith("5401")) {
            bank = "İş Bankası"
            country = "TR"
          } else if (bin.startsWith("5426")) {
            bank = "Halkbank"
            country = "TR"
          } else if (bin.startsWith("5178")) {
            bank = "Citibank"
            country = "US"
          } else if (bin.startsWith("5262")) {
            bank = "HSBC Bank"
            country = "GB"
          } else if (bin.startsWith("5413")) {
            bank = "Deutsche Bank"
            country = "DE"
          } else if (bin.startsWith("5255")) {
            bank = "Bank of America"
            country = "US"
          } else if (bin.startsWith("5567")) {
            bank = "Chase Bank"
            country = "US"
          } else if (bin.startsWith("5384")) {
            bank = "ING Bank"
            country = "NL"
          } else if (bin.startsWith("5456")) {
            bank = "Wells Fargo"
            country = "US"
          }
        }
        // American Express
        else if (type === "amex") {
          if (bin.startsWith("3400")) {
            bank = "American Express"
            country = "US"
          } else if (bin.startsWith("3700")) {
            bank = "American Express"
            country = "US"
          } else if (bin.startsWith("3734")) {
            bank = "American Express"
            country = "GB"
          } else if (bin.startsWith("3764")) {
            bank = "American Express"
            country = "TR"
          }
        }
        // Discover
        else if (type === "discover") {
          bank = "Discover"
          country = "US"
        }
        // JCB
        else if (type === "jcb") {
          bank = "JCB"
          country = "JP"
        }
        // Diners Club
        else if (type === "diners") {
          bank = "Diners Club"
          if (bin.startsWith("3001")) {
            country = "US"
          } else if (bin.startsWith("3056")) {
            country = "GB"
          } else if (bin.startsWith("3634")) {
            country = "TR"
          } else {
            country = "US"
          }
        }

        results.push({
          number: cardNumber,
          type,
          cvv,
          expiry,
          isValid,
          bank,
          country,
        })
      }
    }

    setBulkCheckResults(results)
    setFilteredBulkCheckResults(results)
    setIsBulkChecking(false)
  }

  // Add export to TXT file functionality
  const exportToTxt = () => {
    if (filteredBulkCheckResults.length === 0) {
      toast({
        title: "Dışa Aktarma Hatası",
        description: "Dışa aktarılacak kart sonucu bulunamadı.",
        variant: "destructive",
      })
      return
    }

    let content = "Kart Kontrol Sonuçları\n"
    content += "Tarih: " + new Date().toLocaleString() + "\n\n"
    content += "Kart No | Kart Tipi | CVV | Son Kullanma | Banka | Ülke | Durum\n"
    content += "-------------------------------------------------------------\n"

    filteredBulkCheckResults.forEach((card) => {
      content += `${formatCardNumber(card.number)} | ${card.type ? getCardTypeName(card.type) : "Bilinmeyen"} | ${
        card.cvv
      } | ${card.expiry || "N/A"} | ${card.bank} | ${card.country} | ${card.isValid ? "Geçerli" : "Geçersiz"}\n`
    })

    // Create a Blob with the content
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })

    // Create a link element and trigger download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = "kart_sonuclari.txt"
    document.body.appendChild(link)
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(link)

    toast({
      title: "Dışa Aktarma Başarılı",
      description: "Kart sonuçları başarıyla TXT dosyasına aktarıldı.",
      duration: 2000,
    })
  }

  // Get card type display name
  const getCardTypeName = (type: string) => {
    return cardTypes[type as keyof typeof cardTypes]?.name || type
  }

  // Get card color
  const getCardColor = (type: string) => {
    return cardTypes[type as keyof typeof cardTypes]?.color || "bg-gray-500"
  }

  const generateExpiryDate = () => {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5)).slice(2) // Up to 5 years from now
    return `${month}/${year}`
  }

  // Güncelle: generatedCards state'ini banka ve ülke bilgilerini içerecek şekilde değiştir

  // Güncelle: generateBulkCards fonksiyonunu banka ve ülke bilgilerini ekleyecek şekilde değiştir
  const generateBulkCardsFn = () => {
    setIsGenerating(true)

    // Convert count to number
    const count = Number.parseInt(bulkCardCount === "null" ? "10" : bulkCardCount)

    // Use the selected network or generate cards for all networks
    const network = bulkCardNetwork === "null" ? "all" : bulkCardNetwork

    // Generate the cards
    const newCards = []

    if (network === "all") {
      // Generate cards for all networks
      const networks = ["visa", "mastercard", "amex", "discover", "diners", "jcb"]
      const cardsPerNetwork = Math.ceil(count / networks.length)

      for (const net of networks) {
        for (let i = 0; i < cardsPerNetwork; i++) {
          if (newCards.length >= count) break

          const cardData = generateCreditCardNumber(net)
          newCards.push({
            number: cardData.number,
            type: net,
            cvv: generateCVV(net),
            expiry: generateExpiryDate(),
            isValid: true,
            bank: cardData.bank,
            country: cardData.country,
          })
        }
      }
    } else {
      // Generate cards for the selected network
      for (let i = 0; i < count; i++) {
        const cardData = generateCreditCardNumber(network)
        newCards.push({
          number: cardData.number,
          type: network,
          cvv: generateCVV(network),
          expiry: generateExpiryDate(),
          isValid: true,
          bank: cardData.bank,
          country: cardData.country,
        })
      }
    }

    setGeneratedCards(newCards)
    setCurrentPage(1)
    setIsGenerating(false)
  }

  // Kopyalama fonksiyonunu güncelle
  const copyCardDetails = (card: { number: string; cvv: string; expiry: string; bank: string; country: string }) => {
    const details = `Kart No: ${formatCardNumber(card.number)}\nCVV: ${card.cvv}\nSon Kullanma: ${card.expiry}\nBanka: ${card.bank}\nÜlke: ${card.country}`

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(details)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: "Kart bilgileri panoya kopyalandı.",
            duration: 2000,
          })
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          const success = fallbackCopy(details)
          if (success) {
            toast({
              title: "Kopyalandı",
              description: "Kart bilgileri panoya kopyalandı.",
              duration: 2000,
            })
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(details)
      if (success) {
        toast({
          title: "Kopyalandı",
          description: "Kart bilgileri panoya kopyalandı.",
          duration: 2000,
        })
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }
  // Replace the current copyCardDetails function with this updated version
  const copyCardDetailsFormatted = (card: {
    number: string
    cvv: string
    expiry: string
    bank: string
    country: string
  }) => {
    // Format the details in the requested format: CARD_NUMBER | MM/YY | CVV
    const details = `${formatCardNumber(card.number)} | ${card.expiry} | ${card.cvv}`

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(details)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: "Kart bilgileri panoya kopyalandı.",
            duration: 2000,
          })
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          const success = fallbackCopy(details)
          if (success) {
            toast({
              title: "Kopyalandı",
              description: "Kart bilgileri panoya kopyalandı.",
              duration: 2000,
            })
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(details)
      if (success) {
        toast({
          title: "Kopyalandı",
          description: "Kart bilgileri panoya kopyalandı.",
          duration: 2000,
        })
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }

  // Add these new functions after the existing functions but before the return statement

  // Function to copy all generated cards at once
  const copyAllCards = () => {
    if (generatedCards.length === 0) {
      toast({
        title: "Kopyalama Hatası",
        description: "Kopyalanacak kart bulunamadı.",
        variant: "destructive",
      })
      return
    }

    // Format all cards in the requested format
    let allCardsText = ""
    generatedCards.forEach((card) => {
      allCardsText += `${formatCardNumber(card.number)} | ${card.expiry} | ${card.cvv}\n`
    })

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(allCardsText)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: `${generatedCards.length} kart bilgisi panoya kopyalandı.`,
            duration: 2000,
          })
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          const success = fallbackCopy(allCardsText)
          if (success) {
            toast({
              title: "Kopyalandı",
              description: `${generatedCards.length} kart bilgisi panoya kopyalandı.`,
              duration: 2000,
            })
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(allCardsText)
      if (success) {
        toast({
          title: "Kopyalandı",
          description: `${generatedCards.length} kart bilgisi panoya kopyalandı.`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }

  // Function to download all generated cards as TXT
  const downloadAllCardsAsTxt = () => {
    if (generatedCards.length === 0) {
      toast({
        title: "İndirme Hatası",
        description: "İndirilecek kart bulunamadı.",
        variant: "destructive",
      })
      return
    }

    // Format all cards in the requested format
    let allCardsText = ""
    generatedCards.forEach((card) => {
      const [month, year] = card.expiry.split("/")
      allCardsText += `${formatCardNumber(card.number)}   ${month} ${year} ${card.cvv}\n`
    })

    // Create a Blob with the content
    const blob = new Blob([allCardsText], { type: "text/plain;charset=utf-8" })

    // Create a link element and trigger download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = "tum_kartlar.txt"
    document.body.appendChild(link)
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
    document.body.removeChild(link)

    toast({
      title: "İndirme Başarılı",
      description: `${generatedCards.length} kart bilgisi başarıyla TXT dosyasına aktarıldı.`,
      duration: 2000,
    })
  }

  // Modify the generateBulkCards function to add the download functionality
  const generateBulkCards = () => {
    setIsGenerating(true)

    // Convert count to number
    const count = Number.parseInt(bulkCardCount === "null" ? "10" : bulkCardCount)

    // Use the selected network or generate cards for all networks
    const network = bulkCardNetwork === "null" ? "all" : bulkCardNetwork

    // Generate the cards
    const newCards = []

    if (network === "all") {
      // Generate cards for all networks
      const networks = ["visa", "mastercard", "amex", "discover", "diners", "jcb"]
      const cardsPerNetwork = Math.ceil(count / networks.length)

      for (const net of networks) {
        for (let i = 0; i < cardsPerNetwork; i++) {
          if (newCards.length >= count) break

          const cardData = generateCreditCardNumber(net)
          if (cardData.number) {
            // Only add if card generation was successful
            const newCard = {
              number: cardData.number,
              type: net,
              cvv: generateCVV(net),
              expiry: generateExpiryDate(),
              isValid: true, // All generated cards should be valid
              bank: cardData.bank,
              country: cardData.country,
            }

            // Double-check validity
            const digits = newCard.number.replace(/\D/g, "")
            const isLuhnValid = luhnCheck(digits)
            const detected = detectCardType(digits)
            const isLengthValid = detected ? detected.lengths.includes(digits.length) : false
            const binValidation = validateBin(digits)
            const isBinValid = binValidation?.valid || false

            newCard.isValid = isLuhnValid && isLengthValid && isBinValid

            newCards.push(newCard)
          }
        }
      }
    } else {
      // Generate cards for the selected network
      for (let i = 0; i < count; i++) {
        const cardData = generateCreditCardNumber(network)
        if (cardData.number) {
          // Only add if card generation was successful
          const newCard = {
            number: cardData.number,
            type: network,
            cvv: generateCVV(network),
            expiry: generateExpiryDate(),
            isValid: true, // All generated cards should be valid
            bank: cardData.bank,
            country: cardData.country,
          }

          // Double-check validity
          const digits = newCard.number.replace(/\D/g, "")
          const isLuhnValid = luhnCheck(digits)
          const detected = detectCardType(digits)
          const isLengthValid = detected ? detected.lengths.includes(digits.length) : false
          const binValidation = validateBin(digits)
          const isBinValid = binValidation?.valid || false

          newCard.isValid = isLuhnValid && isLengthValid && isBinValid

          newCards.push(newCard)
        }
      }
    }

    setGeneratedCards(newCards)
    setCurrentPage(1)
    setIsGenerating(false)

    // Show success message with validity statistics
    const validCount = newCards.filter((card) => card.isValid).length
    const invalidCount = newCards.filter((card) => !card.isValid).length

    toast({
      title: "Kartlar Oluşturuldu",
      description: `${newCards.length} kart oluşturuldu. Geçerli: ${validCount}, Geçersiz: ${invalidCount}`,
      duration: 3000,
    })
  }

  // Now update the UI to add the new buttons in the Bulk Card Generator section
  // Find the section with the "Toplu Kartlar Oluşturun" button and add the new buttons

  // Add this useEffect to filter bulk check results
  useEffect(() => {
    if (bulkCheckResults.length === 0) {
      setFilteredBulkCheckResults([])
      return
    }

    if (bulkCheckFilter === "all") {
      setFilteredBulkCheckResults(bulkCheckResults)
    } else if (bulkCheckFilter === "valid") {
      setFilteredBulkCheckResults(bulkCheckResults.filter((card) => card.isValid))
    } else if (bulkCheckFilter === "invalid") {
      setFilteredBulkCheckResults(bulkCheckResults.filter((card) => !card.isValid))
    }
  }, [bulkCheckResults, bulkCheckFilter])

  // Function to copy all bulk check results
  const copyAllBulkCheckResults = () => {
    if (filteredBulkCheckResults.length === 0) {
      toast({
        title: "Kopyalama Hatası",
        description: "Kopyalanacak kart bulunamadı.",
        variant: "destructive",
      })
      return
    }

    // Format all cards in the requested format
    let allCardsText = ""
    filteredBulkCheckResults.forEach((card) => {
      // Use Format 1: CARD_NUMBER | MM/YY | CVV
      allCardsText += `${formatCardNumber(card.number)} | ${card.expiry || "N/A"} | ${card.cvv}\n`
    })

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(allCardsText)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: `${filteredBulkCheckResults.length} kart bilgisi panoya kopyalandı.`,
            duration: 2000,
          })
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          const success = fallbackCopy(allCardsText)
          if (success) {
            toast({
              title: "Kopyalandı",
              description: `${filteredBulkCheckResults.length} kart bilgisi panoya kopyalandı.`,
              duration: 2000,
            })
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(allCardsText)
      if (success) {
        toast({
          title: "Kopyalandı",
          description: `${filteredBulkCheckResults.length} kart bilgisi panoya kopyalandı.`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }

  // Function to copy filtered cards (valid or invalid only)
  const copyFilteredCards = (filterType: "valid" | "invalid") => {
    const cardsToFilter =
      filterType === "valid"
        ? bulkCheckResults.filter((card) => card.isValid)
        : bulkCheckResults.filter((card) => !card.isValid)

    if (cardsToFilter.length === 0) {
      toast({
        title: "Kopyalama Hatası",
        description: `Kopyalanacak ${filterType === "valid" ? "geçerli" : "geçersiz"} kart bulunamadı.`,
        variant: "destructive",
      })
      return
    }

    // Format all cards in the requested format
    let allCardsText = ""
    cardsToFilter.forEach((card) => {
      // Use Format 1: CARD_NUMBER | MM/YY | CVV
      allCardsText += `${formatCardNumber(card.number)} | ${card.expiry || "N/A"} | ${card.cvv}\n`
    })

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(allCardsText)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: `${cardsToFilter.length} ${filterType === "valid" ? "geçerli" : "geçersiz"} kart bilgisi panoya kopyalandı.`,
            duration: 2000,
          })
        })
        .catch((err) => {
          console.error("Clipboard API failed:", err)
          const success = fallbackCopy(allCardsText)
          if (success) {
            toast({
              title: "Kopyalandı",
              description: `${cardsToFilter.length} ${filterType === "valid" ? "geçerli" : "geçersiz"} kart bilgisi panoya kopyalandı.`,
              duration: 2000,
            })
          } else {
            toast({
              title: "Kopyalama Başarısız",
              description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
              variant: "destructive",
            })
          }
        })
    } else {
      // Clipboard API not available, use fallback
      const success = fallbackCopy(allCardsText)
      if (success) {
        toast({
          title: "Kopyalandı",
          description: `${cardsToFilter.length} ${filterType === "valid" ? "geçerli" : "geçersiz"} kart bilgisi panoya kopyalandı.`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Kopyalama Başarısız",
          description: "Kart bilgileri kopyalanamadı. Lütfen manuel olarak kopyalayın.",
          variant: "destructive",
        })
      }
    }
  }

  // Also update the results summary at the bottom to show more detailed statistics:

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardBody className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              validateCreditCard()
            }}
          >
            <div>
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              {isValid === true && (
                <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
                  <AlertDescription>Kart numarası geçerli.</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kredi Kartı Numarası</label>
                <div className="flex">
                  <div className="relative flex-grow">
                    <input
                      ref={inputRef}
                      type="text"
                      className="flex h-10 w-full rounded-l-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Kart numarasını giriniz"
                      value={formatCardNumber(cardNumber)}
                      onChange={handleCardNumberChange}
                      onKeyDown={handleKeyDown}
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {detectedCardType ? (
                        <div className="flex items-center">
                          <span className={`inline-block w-6 h-4 rounded ${getCardColorFunc(detectedCardType)}`}></span>
                        </div>
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-r-md border border-l-0 border-input px-3 h-10 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      !isPasteIcon ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-gray-600"
                    }`}
                    onClick={handlePasteOrClear}
                    title={isPasteIcon ? "Yapıştır" : "Temizle"}
                  >
                    {isPasteIcon ? <Clipboard className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <div className="text-xs text-gray-500">
                    {detectedCardType && cardTypes[detectedCardType as keyof typeof cardTypes]?.lengths.length > 0 && (
                      <>
                        Geçerli uzunluklar: {cardTypes[detectedCardType as keyof typeof cardTypes].lengths.join(", ")}{" "}
                        hane
                      </>
                    )}
                  </div>
                  {detectedCardType && (
                    <div className="text-xs font-medium">Algılanan Kart: {getCardTypeName(detectedCardType)}</div>
                  )}
                </div>
                {isBinValid !== null && (
                  <div className={`text-xs ${isBinValid ? "text-green-600" : "text-red-600"} font-medium`}>
                    {isBinValid ? `BIN Doğrulandı: ${binInfo}` : `Geçersiz BIN: ${cardNumber.substring(0, 6)}`}
                  </div>
                )}

                {liveCheckResult && (
                  <div className="mt-2">
                    {liveCheckResult === "checking" && (
                      <div className="flex items-center text-blue-600">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        <span>Canlı kontrol yapılıyor...</span>
                      </div>
                    )}
                    {liveCheckResult === "valid" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Canlı kontrol: Kart geçerli
                      </Badge>
                    )}
                    {liveCheckResult === "invalid" && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Canlı kontrol: Kart geçersiz
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kart Tipi</label>
                <Select value={cardType} onValueChange={setCardType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kart tipini seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(cardTypes).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <span className={`inline-block w-4 h-3 mr-2 rounded ${info.color}`}></span>
                          {info.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="live-check" checked={isLiveChecking} onCheckedChange={handleLiveCheckToggle} />
                <Label htmlFor="live-check">Canlı Kontrol</Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  Kontrol Et
                </Button>
                <Button type="button" onClick={handleSample} className="bg-green-500 hover:bg-green-600">
                  Örnek
                </Button>
                <Button type="button" onClick={handleReset} className="bg-amber-500 hover:bg-amber-600">
                  Sıfırla
                </Button>
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="bg-purple-500 hover:bg-purple-600"
                  disabled={!isValid}
                >
                  Devam Et
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <label className="text-sm font-medium">Örnek kredi kartı numaraları</label>
            <div className="overflow-x-auto mt-2">
              <table className="w-full border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Kart Tipi</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Kredi Kartı Numarası</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sampleCards).map(([type, number]) => (
                    <tr key={type} className={type === cardType ? "bg-blue-50" : "bg-white even:bg-gray-50"}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        <div className="flex items-center">
                          <span className={`inline-block w-6 h-4 mr-2 rounded ${getCardColorFunc(type)}`}></span>
                          {getCardTypeName(type)}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span
                          className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                          onClick={() => setCardNumber(number)}
                          title="Tıklayarak bu numarayı kullan"
                        >
                          {formatCardNumber(number)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(number)}
                            className="h-8 px-2"
                          >
                            {copied === number ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-1">{copied === number ? "Kopyalandı" : "Kopyala"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCardNumber(number)
                              setCardType(type)
                            }}
                            className="h-8 px-2"
                          >
                            Kullan
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Live Checker Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Live Checker</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Canlı kontrol özelliği, kredi kartı numarasının gerçekten aktif ve kullanılabilir olup olmadığını kontrol
              eder. Bu özelliği kullanmak için yukarıdaki "Canlı Kontrol" düğmesini etkinleştirin.
            </p>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                <strong>Not:</strong> Bu demo sürümünde, canlı kontrol simüle edilmektedir. Gerçek bir uygulamada, bu
                özellik bir ödeme işlemcisine bağlanır.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kart Numarası</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Kart numarasını giriniz"
                      value={formatCardNumber(cardNumber)}
                      onChange={handleCardNumberChange}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {detectedCardType ? (
                        <div className="flex items-center">
                          <span className={`inline-block w-6 h-4 rounded ${getCardColorFunc(detectedCardType)}`}></span>
                        </div>
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Son Kullanma Tarihi (AA/YY)</label>
                  <input
                    type="text"
                    className={`flex h-10 w-full rounded-md border ${
                      isExpiryValid === false ? "border-red-500" : "border-input"
                    } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    placeholder="AA/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    maxLength={5}
                  />
                  {isExpiryValid === false && <p className="text-xs text-red-500">Geçersiz son kullanma tarihi</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    CVV Kodu {cardType === "amex" ? "(4 haneli)" : "(3 haneli)"}
                  </label>
                  <input
                    type="text"
                    className={`flex h-10 w-full rounded-md border ${
                      isCvvValid === false ? "border-red-500" : "border-input"
                    } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    placeholder={cardType === "amex" ? "4 haneli güvenlik kodu" : "3 haneli güvenlik kodu"}
                    value={cvv}
                    onChange={handleCvvChange}
                    maxLength={cardType === "amex" ? 4 : 3}
                  />
                  {isCvvValid === false && <p className="text-xs text-red-500">Geçersiz CVV kodu</p>}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium mb-2">Canlı Kontrol Nasıl Çalışır?</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Kart numarası formatı ve Luhn algoritması ile doğrulanır</li>
                  <li>BIN numarası kontrol edilir</li>
                  <li>Son kullanma tarihi ve CVV kodu doğrulanır</li>
                  <li>Kart bilgileri ödeme işlemcisine gönderilir</li>
                  <li>Ödeme işlemcisi kartın geçerliliğini doğrular</li>
                  <li>Sonuç kullanıcıya gösterilir</li>
                </ol>
              </div>
            </div>

            {liveCheckResult && (
              <div
                className="mt-4 p-3 rounded-md border"
                style={{
                  backgroundColor:
                    liveCheckResult === "valid" ? "#ecfdf5" : liveCheckResult === "invalid" ? "#fef2f2" : "#eff6ff",
                  borderColor:
                    liveCheckResult === "valid" ? "#10b981" : liveCheckResult === "invalid" ? "#ef4444" : "#3b82f6",
                }}
              >
                {liveCheckResult === "checking" && (
                  <div className="flex items-center text-blue-600">
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    <span className="font-medium">Canlı kontrol yapılıyor...</span>
                  </div>
                )}
                {liveCheckResult === "valid" && (
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-medium">Kart aktif ve kullanılabilir</span>
                  </div>
                )}
                {liveCheckResult === "invalid" && (
                  <div className="flex items-center text-red-600">
                    <X className="h-5 w-5 mr-2" />
                    <span className="font-medium">Kart geçersiz veya kullanılamaz</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">Son kontrol: {new Date().toLocaleString()}</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (cardNumber) {
                      performLiveCheck(cardNumber)
                    } else {
                      toast({
                        title: "Hata",
                        description: "Lütfen önce geçerli bir kart numarası girin.",
                        variant: "destructive",
                      })
                    }
                  }}
                  disabled={!cardNumber}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yeniden Kontrol Et
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (cardNumber && expiryDate && cvv) {
                      toast({
                        title: "Kart Kullanımı",
                        description: "Kart bilgileri işleme alındı. İşlem başarılı!",
                        duration: 3000,
                      })
                    } else {
                      toast({
                        title: "Eksik Bilgi",
                        description: "Lütfen tüm kart bilgilerini eksiksiz doldurun.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Kartı Kullan
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* BIN Lookup Card - Add this after the Live Checker Card */}
      <BINLookupCard cardNumber={cardNumber} />
      {/* Recently Checked Cards */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Son Kontrol Edilen Kartlar</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          {checkedCards.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Henüz kontrol edilmiş kart bulunmamaktadır.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Kart Tipi</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Kredi Kartı Numarası</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Kontrol Tarihi</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Durum</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedCards.map((card, index) => (
                    <tr key={index} className="bg-white even:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        <div className="flex items-center">
                          <span className={`inline-block w-6 h-4 mr-2 rounded ${getCardColorFunc(card.type)}`}></span>
                          {getCardTypeName(card.type)}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span
                          className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                          onClick={() => setCardNumber(card.number)}
                          title="Tıklayarak bu numarayı kullan"
                        >
                          {formatCardNumber(card.number)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {card.timestamp.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {card.isValid ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Geçerli
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Geçersiz
                          </Badge>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCardNumber(card.number)
                            setCardType(card.type)
                          }}
                          className="h-8 px-2"
                        >
                          Kullan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      {/* Toplu Kart Kontrolü */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Toplu Kart Kontrolü (Checker)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2">Kontrol Etmek İstediğiniz Kartları Girin</h3>
              <p className="text-sm text-gray-600 mb-1">Her satıra bir kart girin. Desteklenen formatlar:</p>
              <ul className="text-xs text-gray-600 mb-4 list-disc pl-5">
                <li>
                  Format 1: <code>5255 9391 0489 8994 | 05/26 | 244</code> (Kart No | Son Kullanma | CVV)
                </li>
                <li>
                  Format 2: <code>5555555555554444 05/26 | 244</code> (Kart No Son Kullanma | CVV)
                </li>
                <li>
                  Format 3: <code>5555 5555 5555 4444 244 06/25</code> (Kart No CVV Son Kullanma)
                </li>
              </ul>
              <textarea
                className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md"
                placeholder="5255 9391 0489 8994 | 05/26 | 244
5555555555554444 05/26 | 244
4628 8197 0623 9618 244 06/25"
                value={bulkCardInput}
                onChange={(e) => setBulkCardInput(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={performBulkCheck}
                disabled={isBulkChecking || !bulkCardInput.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isBulkChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Kontrol Ediliyor...
                  </>
                ) : (
                  "Toplu Kontrol Et"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkCardInput("")
                  setBulkCheckResults([])
                }}
              >
                Temizle
              </Button>
              <Button variant="outline" onClick={exportToTxt} disabled={bulkCheckResults.length === 0}>
                TXT Olarak Dışa Aktar
              </Button>
            </div>

            {bulkCheckResults.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Kontrol Sonuçları</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <Label htmlFor="bulk-check-filter">Sonuçları Filtrele:</Label>
                  <Select value={bulkCheckFilter} onValueChange={setBulkCheckFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Sonuçlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Sonuçlar</SelectItem>
                      <SelectItem value="valid">Geçerli Kartlar</SelectItem>
                      <SelectItem value="invalid">Geçersiz Kartlar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Kart Numarası</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Kart Tipi</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Son Kullanma</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">CVV</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Banka</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Ülke</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBulkCheckResults.map((card, index) => (
                        <tr key={index} className="bg-white even:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{formatCardNumber(card.number)}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {card.type ? getCardTypeName(card.type) : "Bilinmeyen"}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{card.expiry || "N/A"}</td>
                          <td className="border border-gray-300 px-4 py-2">{card.cvv}</td>
                          <td className="border border-gray-300 px-4 py-2">{card.bank}</td>
                          <td className="border border-gray-300 px-4 py-2">{card.country}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {card.isValid ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Geçerli
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Geçersiz
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Toplam {bulkCheckResults.length} kart kontrol edildi.</p>
                    <p className="text-sm text-gray-500">
                      Geçerli: {bulkCheckResults.filter((card) => card.isValid).length}, Geçersiz:{" "}
                      {bulkCheckResults.filter((card) => !card.isValid).length}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={copyAllBulkCheckResults}>
                      Tümünü Kopyala
                    </Button>
                    <Button variant="outline" onClick={() => copyFilteredCards("valid")}>
                      Geçerli Olanları Kopyala
                    </Button>
                    <Button variant="outline" onClick={() => copyFilteredCards("invalid")}>
                      Geçersiz Olanları Kopyala
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      {/* Toplu Kart Oluşturucu */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Toplu Kart Oluşturucu (Generator)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bulk-card-network">Kart Ağı</Label>
                <Select value={bulkCardNetwork} onValueChange={setBulkCardNetwork}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kart ağını seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Rastgele</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">MasterCard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="discover">Discover</SelectItem>
                    <SelectItem value="diners">Diners Club</SelectItem>
                    <SelectItem value="jcb">JCB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk-card-count">Kart Sayısı</Label>
                <Select value={bulkCardCount} onValueChange={setBulkCardCount}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kart sayısını seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={generateBulkCards} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Toplu Kartlar Oluşturun"
                )}
              </Button>
              <Button variant="outline" onClick={downloadAllCardsAsTxt}>
                TXT Olarak İndir
              </Button>
              <Button variant="outline" onClick={copyAllCards}>
                Tümünü Kopyala
              </Button>
            </div>

            {generatedCards.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Oluşturulan Kartlar</h3>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Kart Numarası</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Kart Tipi</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Son Kullanma</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">CVV</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Banka</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Ülke</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedCards
                        .slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
                        .map((card, index) => (
                          <tr key={index} className="bg-white even:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">{formatCardNumber(card.number)}</td>
                            <td className="border border-gray-300 px-4 py-2">{getCardTypeName(card.type)}</td>
                            <td className="border border-gray-300 px-4 py-2">{card.expiry}</td>
                            <td className="border border-gray-300 px-4 py-2">{card.cvv}</td>
                            <td className="border border-gray-300 px-4 py-2">{card.bank}</td>
                            <td className="border border-gray-300 px-4 py-2">{card.country}</td>
                            <td className="border border-gray-300 px-2 py-2 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyCardDetailsFormatted(card)}
                                className="h-8 px-2"
                              >
                                Kopyala
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    {generatedCards.length} kart oluşturuldu. Sayfa {currentPage} /{" "}
                    {Math.ceil(generatedCards.length / cardsPerPage)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.ceil(generatedCards.length / cardsPerPage))}
                      disabled={currentPage === Math.ceil(generatedCards.length / cardsPerPage)}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === Math.ceil(generatedCards.length / cardsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
