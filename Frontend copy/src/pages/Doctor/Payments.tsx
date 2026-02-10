import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Banknote,
  TrendingUp,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  Plus,
  Check,
  X,
  Eye,
  Download,
  Filter,
  Search,
  Wallet,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  exportTransactionsToCSV,
  exportTransactionsToExcel,
} from "../../utils/paymentUtils";

interface BankAccount {
  id: string;
  type: "bank" | "mobile-wallet";
  bankName: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  phoneNumber?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  date: string;
  patientName: string;
  appointmentId: string;
  amount: number;
  mode: "online" | "in-person";
  status: "completed" | "pending" | "refunded";
  paymentMethod: string;
}

const Payments = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<
    "overview" | "pricing" | "transactions" | "banks" | "pending"
  >("overview");
  const [showAddBank, setShowAddBank] = useState(false);
  const [methodType, setMethodType] = useState<"bank" | "mobile-wallet">(
    "bank"
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // Check if we should open specific tab from navigation state
  useEffect(() => {
    if (location.state?.openBanksTab) {
      setActiveTab("banks");
    } else if (location.state?.openPricingTab) {
      setActiveTab("pricing");
    }
  }, [location]);

  // Clear field errors when method type changes
  useEffect(() => {
    setFieldErrors({
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      phoneNumber: "",
    });
  }, [methodType]);

  // Clear field errors when form is closed
  useEffect(() => {
    if (!showAddBank) {
      setFieldErrors({
        bankName: "",
        accountTitle: "",
        accountNumber: "",
        iban: "",
        phoneNumber: "",
      });
    }
  }, [showAddBank]);

  // Pricing State - Load from API
  const [pricing, setPricing] = useState({
    online: 0,
    inPerson: 0,
  });
  const [originalPricing, setOriginalPricing] = useState({
    online: 0,
    inPerson: 0,
  });
  const [pricingLoading, setPricingLoading] = useState(true);
  const [showPricingConfirm, setShowPricingConfirm] = useState(false);

  // Bank Accounts State - Load from API
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newBank, setNewBank] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    phoneNumber: "",
  });

  // Field-specific error messages
  const [fieldErrors, setFieldErrors] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    phoneNumber: "",
  });

  // Validation functions
  const validateBankName = () => {
    if (!newBank.bankName) {
      setFieldErrors((prev) => ({
        ...prev,
        bankName:
          methodType === "bank"
            ? "Please select a bank"
            : "Please select a wallet provider",
      }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, bankName: "" }));
    return true;
  };

  const validateAccountTitle = () => {
    if (!newBank.accountTitle) {
      setFieldErrors((prev) => ({
        ...prev,
        accountTitle: "Please enter account title",
      }));
      return false;
    }
    if (newBank.accountTitle.length < 3) {
      setFieldErrors((prev) => ({
        ...prev,
        accountTitle: "Account title must be at least 3 characters long",
      }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, accountTitle: "" }));
    return true;
  };

  const validateAccountNumber = () => {
    if (!newBank.accountNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: "Please enter account number",
      }));
      return false;
    }
    if (newBank.accountNumber.length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: "Account number must be at least 10 digits",
      }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, accountNumber: "" }));
    return true;
  };

  const validateIban = () => {
    if (!newBank.iban) {
      setFieldErrors((prev) => ({ ...prev, iban: "Please enter IBAN" }));
      return false;
    }
    if (newBank.iban.length !== 24) {
      setFieldErrors((prev) => ({
        ...prev,
        iban: "IBAN must be exactly 24 characters",
      }));
      return false;
    }
    if (!newBank.iban.startsWith("PK")) {
      setFieldErrors((prev) => ({
        ...prev,
        iban: 'IBAN must start with "PK" for Pakistan',
      }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, iban: "" }));
    return true;
  };

  const validatePhoneNumber = () => {
    if (!newBank.phoneNumber) {
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: "Please enter phone number",
      }));
      return false;
    }
    if (newBank.phoneNumber.length !== 11) {
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: "Phone number must be exactly 11 digits",
      }));
      return false;
    }
    if (!newBank.phoneNumber.startsWith("03")) {
      setFieldErrors((prev) => ({
        ...prev,
        phoneNumber: 'Phone number must start with "03"',
      }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, phoneNumber: "" }));
    return true;
  };

  // Transaction History State - Load from API
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Pakistan Banks List
  const pakistanBanks = [
    "HBL (Habib Bank Limited)",
    "UBL (United Bank Limited)",
    "MCB (Muslim Commercial Bank)",
    "NBP (National Bank of Pakistan)",
    "Allied Bank Limited",
    "Bank Alfalah",
    "Bank Al-Habib",
    "Meezan Bank",
    "Faysal Bank",
    "Standard Chartered Bank Pakistan",
    "JS Bank",
    "Askari Bank",
    "Soneri Bank",
    "Silk Bank",
    "Bank of Punjab",
  ];

  // Mobile Wallets
  const mobileWallets = ["JazzCash", "Easypaisa", "SadaPay", "NayaPay"];

  // Calculate Statistics
  const totalEarnings = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyEarnings = transactions
    .filter((t) => {
      const txnDate = new Date(t.date);
      const now = new Date();
      return (
        t.status === "completed" &&
        txnDate.getMonth() === now.getMonth() &&
        txnDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const refundedAmount = transactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddBank = async () => {
    // Get doctor ID
    const doctorId = sessionStorage.getItem("doctorId");
    if (!doctorId) {
      showToast("Doctor ID not found. Please login again.", "error");
      return;
    }

    // Check if doctor already has 5 payment methods
    if (bankAccounts.length >= 5) {
      showToast(
        "Maximum limit reached. You can add up to 5 payment methods only.",
        "error"
      );
      return;
    }

    // Validate based on method type
    if (methodType === "bank") {
      // Validate bank account fields
      if (!newBank.bankName) {
        showToast("Please select a bank", "error");
        return;
      }
      if (!newBank.accountTitle) {
        showToast("Please enter account title", "error");
        return;
      }
      if (newBank.accountTitle.length < 3) {
        showToast("Account title must be at least 3 characters long", "error");
        return;
      }
      if (!newBank.accountNumber) {
        showToast("Please enter account number", "error");
        return;
      }
      if (newBank.accountNumber.length < 10) {
        showToast("Account number must be at least 10 digits", "error");
        return;
      }
      if (!newBank.iban) {
        showToast("Please enter IBAN", "error");
        return;
      }
      if (newBank.iban.length !== 24) {
        showToast(
          "IBAN must be exactly 24 characters (e.g., PK12XXXX0000123456789012)",
          "error"
        );
        return;
      }
      if (!newBank.iban.startsWith("PK")) {
        showToast('IBAN must start with "PK" for Pakistan', "error");
        return;
      }

      // All validations passed, submit bank account
      try {
        const requestBody = {
          doctor: doctorId,
          type: "bank",
          bank_name: newBank.bankName,
          account_title: newBank.accountTitle,
          account_number: newBank.accountNumber,
          iban: newBank.iban,
          is_default: false,
        };
        console.log("Submitting bank account:", requestBody);

        const response = await fetch(
          "http://localhost:8000/api/doctor-bank-accounts/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        console.log("Response status:", response.status);
        const responseData = await response.json();
        console.log("Response data:", responseData);

        if (response.ok) {
          setBankAccounts([
            ...bankAccounts,
            {
              id: responseData.id,
              type: "bank",
              bankName: responseData.bank_name,
              accountTitle: responseData.account_title,
              accountNumber: responseData.account_number,
              iban: responseData.iban,
              isDefault: responseData.is_default,
            },
          ]);
          setNewBank({
            bankName: "",
            accountTitle: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setFieldErrors({
            bankName: "",
            accountTitle: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setShowAddBank(false);
          showToast("Bank account added successfully!", "success");

          // Refetch bank accounts to ensure sync
          try {
            const banksRes = await fetch(
              `http://localhost:8000/api/doctor-bank-accounts/?doctor_id=${doctorId}`
            );
            const banksData = await banksRes.json();
            console.log("Refetched bank accounts (bank):", banksData);

            // Handle paginated response (results array) or direct array
            const accountsArray = banksData.results || banksData;

            if (Array.isArray(accountsArray)) {
              setBankAccounts(
                accountsArray.map((b: any) => ({
                  id: b.id,
                  type: b.type || "bank",
                  bankName: b.bank_name,
                  accountTitle: b.account_title,
                  accountNumber: b.account_number,
                  iban: b.iban,
                  phoneNumber: b.phone_number,
                  isDefault: b.is_default,
                }))
              );
            } else {
              console.error("Refetched data is not an array:", banksData);
            }
          } catch (refetchError) {
            console.error("Error refetching bank accounts:", refetchError);
          }
        } else {
          const errorMessage =
            responseData.detail ||
            responseData.error ||
            Object.values(responseData).flat().join(", ") ||
            "Failed to add bank account";
          showToast(`Error: ${errorMessage}`, "error");
        }
      } catch (error) {
        console.error("Error adding bank:", error);
        showToast("Error adding bank account. Please try again.", "error");
      }
    } else {
      // Validate mobile wallet fields
      if (!newBank.bankName) {
        showToast("Please select a wallet provider", "error");
        return;
      }
      if (!newBank.phoneNumber) {
        showToast("Please enter phone number", "error");
        return;
      }
      if (newBank.phoneNumber.length !== 11) {
        showToast(
          "Phone number must be exactly 11 digits (e.g., 03001234567)",
          "error"
        );
        return;
      }
      if (!newBank.phoneNumber.startsWith("03")) {
        showToast(
          'Phone number must start with "03" for Pakistan mobile numbers',
          "error"
        );
        return;
      }

      // All validations passed, submit mobile wallet
      try {
        const requestBody = {
          doctor: doctorId,
          type: "mobile-wallet",
          bank_name: newBank.bankName,
          phone_number: newBank.phoneNumber,
          is_default: false,
        };
        console.log("Submitting mobile wallet:", requestBody);

        const response = await fetch(
          "http://localhost:8000/api/doctor-bank-accounts/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        console.log("Response status:", response.status);
        const responseData = await response.json();
        console.log("Response data:", responseData);

        if (response.ok) {
          setBankAccounts([
            ...bankAccounts,
            {
              id: responseData.id,
              type: "mobile-wallet",
              bankName: responseData.bank_name,
              phoneNumber: responseData.phone_number,
              isDefault: responseData.is_default,
            },
          ]);
          setNewBank({
            bankName: "",
            accountTitle: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setFieldErrors({
            bankName: "",
            accountTitle: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setShowAddBank(false);
          showToast("Mobile wallet added successfully!", "success");

          // Refetch bank accounts to ensure sync
          try {
            const banksRes = await fetch(
              `http://localhost:8000/api/doctor-bank-accounts/?doctor_id=${doctorId}`
            );
            const banksData = await banksRes.json();
            console.log("Refetched bank accounts (mobile wallet):", banksData);

            // Handle paginated response (results array) or direct array
            const accountsArray = banksData.results || banksData;

            if (Array.isArray(accountsArray)) {
              setBankAccounts(
                accountsArray.map((b: any) => ({
                  id: b.id,
                  type: b.type || "bank",
                  bankName: b.bank_name,
                  accountTitle: b.account_title,
                  accountNumber: b.account_number,
                  iban: b.iban,
                  phoneNumber: b.phone_number,
                  isDefault: b.is_default,
                }))
              );
            } else {
              console.error("Refetched data is not an array:", banksData);
            }
          } catch (refetchError) {
            console.error("Error refetching bank accounts:", refetchError);
          }
        } else {
          const errorMessage =
            responseData.detail ||
            responseData.error ||
            Object.values(responseData).flat().join(", ") ||
            "Failed to add mobile wallet";
          showToast(`Error: ${errorMessage}`, "error");
        }
      } catch (error) {
        console.error("Error adding mobile wallet:", error);
        showToast("Error adding mobile wallet. Please try again.", "error");
      }
    }
  };

  const handleRemoveBank = async (id: string) => {
    setDeleteConfirm(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/doctor-bank-accounts/${id}/`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setBankAccounts(bankAccounts.filter((acc) => acc.id !== id));
        showToast("Bank account removed successfully!", "success");
      } else {
        showToast("Failed to remove bank account", "error");
      }
    } catch (error) {
      console.error("Error removing bank account:", error);
      showToast("Error removing bank account", "error");
    }
  };

  const handleSavePricing = async () => {
    setShowPricingConfirm(false);
    try {
      const doctorId = sessionStorage.getItem("doctorId");
      if (!doctorId) return;

      // Try to update existing pricing or create new
      const response = await fetch(
        `http://localhost:8000/api/doctor-pricing/?doctor_id=${doctorId}`
      );
      const pricingData = await response.json();
      const existingPricing = pricingData.results || pricingData;

      let saveResponse;
      if (Array.isArray(existingPricing) && existingPricing.length > 0) {
        // Update existing
        saveResponse = await fetch(
          `http://localhost:8000/api/doctor-pricing/${existingPricing[0].id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              online_consultation_fee: pricing.online,
              in_person_consultation_fee: pricing.inPerson,
            }),
          }
        );
      } else {
        // Create new
        saveResponse = await fetch(
          "http://localhost:8000/api/doctor-pricing/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doctor: doctorId,
              online_consultation_fee: pricing.online,
              in_person_consultation_fee: pricing.inPerson,
            }),
          }
        );
      }

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error("Pricing save error:", errorData);
        if (errorData.detail || errorData.non_field_errors) {
          showToast(errorData.detail || errorData.non_field_errors[0], "error");
        } else if (errorData.doctor) {
          const errorMsg = Array.isArray(errorData.doctor)
            ? errorData.doctor[0]
            : errorData.doctor;
          showToast(errorMsg, "error");
        } else if (
          errorData.online_consultation_fee ||
          errorData.in_person_consultation_fee
        ) {
          const errorMsg =
            errorData.online_consultation_fee?.[0] ||
            errorData.in_person_consultation_fee?.[0] ||
            "Invalid pricing data";
          showToast(errorMsg, "error");
        } else {
          showToast(
            "Failed to update pricing. Please add a bank account first.",
            "error"
          );
        }
        return;
      }

      // Update original pricing after successful save
      setOriginalPricing({ ...pricing });
      showToast("Consultation fees updated successfully!", "success");
    } catch (error) {
      console.error("Error saving pricing:", error);
      showToast(
        "Failed to update pricing. Please ensure you have added at least one bank account.",
        "error"
      );
    }
  };

  // Check if pricing has changed (and is not just zeros)
  const hasPricingChanged =
    (pricing.online !== originalPricing.online ||
      pricing.inPerson !== originalPricing.inPerson) &&
    (pricing.online > 0 || pricing.inPerson > 0);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus;
    const matchesSearch =
      txn.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.appointmentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const doctorId = sessionStorage.getItem("doctorId");
      if (!doctorId) return;

      try {
        // Fetch pricing
        const pricingRes = await fetch(
          `http://localhost:8000/api/doctor-pricing/?doctor_id=${doctorId}`
        );
        const pricingData = await pricingRes.json();
        console.log("Fetched pricing data:", pricingData);

        // Handle paginated response (results array) or direct array
        const pricingArray = pricingData.results || pricingData;

        if (Array.isArray(pricingArray) && pricingArray.length > 0) {
          const loadedPricing = {
            online: parseFloat(
              pricingArray[0].online_consultation_fee ||
                pricingArray[0].online_fee ||
                0
            ),
            inPerson: parseFloat(
              pricingArray[0].in_person_consultation_fee ||
                pricingArray[0].in_person_fee ||
                0
            ),
          };
          console.log("Loaded pricing:", loadedPricing);
          setPricing(loadedPricing);
          setOriginalPricing(loadedPricing);
        }
        setPricingLoading(false);

        // Fetch bank accounts
        const banksRes = await fetch(
          `http://localhost:8000/api/doctor-bank-accounts/?doctor_id=${doctorId}`
        );
        const banksData = await banksRes.json();
        console.log("Fetched bank accounts:", banksData);

        // Handle paginated response (results array) or direct array
        const accountsArray = banksData.results || banksData;

        if (Array.isArray(accountsArray)) {
          setBankAccounts(
            accountsArray.map((b: any) => ({
              id: b.id,
              type: b.type || "bank",
              bankName: b.bank_name,
              accountTitle: b.account_title,
              accountNumber: b.account_number,
              iban: b.iban,
              phoneNumber: b.phone_number,
              isDefault: b.is_default,
            }))
          );
        } else {
          console.error("Bank accounts data is not an array:", banksData);
          setBankAccounts([]);
        }
        setBankAccountsLoading(false);

        // Fetch transactions
        const txnRes = await fetch(
          `http://localhost:8000/api/transactions/?doctor_id=${doctorId}`
        );
        const txnData = await txnRes.json();
        console.log("Fetched transactions data:", txnData);
        // Handle paginated response (results array) or direct array
        const transactionsArray = txnData.results || txnData;
        if (Array.isArray(transactionsArray)) {
          setTransactions(
            transactionsArray.map((t: any) => {
              console.log(`Transaction ${t.id}:`, {
                status: t.status,
                is_refunded: t.is_refunded,
                appointment_status: t.appointment_status,
              });
              // Map transaction status - if appointment is cancelled, show as refunded
              const finalStatus =
                t.status === "cancelled" ||
                t.is_refunded ||
                t.appointment_status === "cancelled"
                  ? "refunded"
                  : t.status;
              console.log(`Final status for ${t.id}: ${finalStatus}`);
              return {
                id: t.id,
                date: t.created_at.split("T")[0],
                patientName: t.patient_name,
                appointmentId: t.appointment_id || t.id,
                amount: parseFloat(t.amount),
                mode: t.mode,
                status: finalStatus,
                paymentMethod: t.payment_method,
              };
            })
          );
        } else {
          console.error("Transactions data is not an array:", txnData);
          setTransactions([]);
        }
        setTransactionsLoading(false);

        // Fetch pending payment requests
        const pendingRes = await fetch(
          `http://localhost:8000/api/payment-requests/?doctor_id=${doctorId}&status=pending`
        );
        const pendingData = await pendingRes.json();
        console.log("[Doctor Payments] Fetched pending requests:", pendingData);
        const pendingArray = pendingData.results || pendingData;
        console.log("[Doctor Payments] Pending array:", pendingArray);
        if (Array.isArray(pendingArray)) {
          setPendingRequests(pendingArray);
          console.log(
            "[Doctor Payments] Set pending requests count:",
            pendingArray.length
          );
        } else {
          console.error(
            "[Doctor Payments] Pending data is not an array:",
            pendingData
          );
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Error fetching payment data:", error);
        setPricingLoading(false);
        setBankAccountsLoading(false);
        setTransactionsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage your earnings, pricing, and payment methods
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {["overview", "pricing", "transactions", "pending", "banks"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize relative ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
                {tab === "pending" && pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 bg-orange-500 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Earnings</p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {totalEarnings.toLocaleString()}
                  </h3>
                </div>
                <Banknote className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">This Month</p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {monthlyEarnings.toLocaleString()}
                  </h3>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">
                    Pending Payment Requests
                  </p>
                  <h3 className="text-3xl font-bold mt-2">
                    {pendingRequests.length}
                  </h3>
                  <p className="text-orange-100 text-xs mt-1">
                    Awaiting patient payment
                  </p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Refunded</p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {refundedAmount.toLocaleString()}
                  </h3>
                </div>
                <X className="w-12 h-12 text-red-200" />
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Current Pricing</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Online Consultation</span>
                  <span className="font-semibold text-lg">
                    Rs. {pricing.online}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">In-Person Consultation</span>
                  <span className="font-semibold text-lg">
                    Rs. {pricing.inPerson}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Payment Methods ({bankAccounts.length}/5)
              </h3>
              {bankAccounts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    All accounts are shown to patients for payment selection:
                  </p>
                  {bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                    >
                      {acc.type === "bank" ? (
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Wallet className="w-4 h-4 text-indigo-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{acc.bankName}</p>
                        {acc.accountNumber && (
                          <p className="text-xs text-gray-500">
                            {acc.accountNumber}
                          </p>
                        )}
                        {acc.phoneNumber && (
                          <p className="text-xs text-gray-500">
                            {acc.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  No payment methods added yet. Add 1-5 methods.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === "pricing" && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-semibold mb-6">
              Set Consultation Fees
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Online Consultation Fee (PKR){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={pricing.online === 0 ? "" : pricing.online}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : parseInt(e.target.value);
                    if (value >= 0) setPricing({ ...pricing, online: value });
                  }}
                  onBlur={(e) => {
                    // Ensure value is set to 0 if empty on blur
                    if (e.target.value === "") {
                      setPricing({ ...pricing, online: 0 });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter amount (minimum Rs. 100)"
                  required
                  min={100}
                  max={50000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  In-Person Consultation Fee (PKR){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={pricing.inPerson === 0 ? "" : pricing.inPerson}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : parseInt(e.target.value);
                    if (value >= 0) setPricing({ ...pricing, inPerson: value });
                  }}
                  onBlur={(e) => {
                    // Ensure value is set to 0 if empty on blur
                    if (e.target.value === "") {
                      setPricing({ ...pricing, inPerson: 0 });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter amount (minimum Rs. 100)"
                  required
                  min={100}
                  max={50000}
                />
              </div>

              <button
                onClick={() => {
                  if (bankAccounts.length === 0) {
                    showToast(
                      "Please add at least one bank account before setting your pricing",
                      "error"
                    );
                    return;
                  }
                  setShowPricingConfirm(true);
                }}
                disabled={!hasPricingChanged || bankAccounts.length === 0}
                className={`w-full py-3 rounded-lg transition font-medium ${
                  hasPricingChanged && bankAccounts.length > 0
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Save Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Confirmation Modal */}
      {showPricingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirm Pricing Update
            </h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to update your consultation fees?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Online Consultation:</span>
                <span className="font-semibold text-indigo-600">
                  Rs. {pricing.online.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">In-Person Consultation:</span>
                <span className="font-semibold text-indigo-600">
                  Rs. {pricing.inPerson.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPricingConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePricing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by patient name or appointment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        const transactionsToExport = filteredTransactions.map(
                          (txn) => ({
                            id: txn.id,
                            date: txn.date,
                            type: (txn.status === "refunded"
                              ? "refund"
                              : "payment") as "payment" | "refund",
                            patientName: txn.patientName,
                            patientId: "",
                            doctorName: "",
                            doctorId: "",
                            appointmentId: txn.appointmentId,
                            amount: txn.amount,
                            mode: txn.mode,
                            status: txn.status,
                            paymentMethod: txn.paymentMethod,
                            reason:
                              txn.status === "refunded" ? "Refund" : undefined,
                          })
                        );
                        exportTransactionsToCSV(
                          transactionsToExport,
                          "doctor_transactions"
                        );
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Export as CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        const transactionsToExport = filteredTransactions.map(
                          (txn) => ({
                            id: txn.id,
                            date: txn.date,
                            type: (txn.status === "refunded"
                              ? "refund"
                              : "payment") as "payment" | "refund",
                            patientName: txn.patientName,
                            patientId: "",
                            doctorName: "",
                            doctorId: "",
                            appointmentId: txn.appointmentId,
                            amount: txn.amount,
                            mode: txn.mode,
                            status: txn.status,
                            paymentMethod: txn.paymentMethod,
                            reason:
                              txn.status === "refunded" ? "Refund" : undefined,
                          })
                        );
                        exportTransactionsToExcel(
                          transactionsToExport,
                          "doctor_transactions"
                        );
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition border-t"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>Export as Excel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {txn.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.patientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {txn.appointmentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            txn.mode === "online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {txn.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span
                          className={
                            txn.status === "refunded"
                              ? "text-red-600"
                              : "text-gray-900"
                          }
                        >
                          {txn.status === "refunded" && "- "}Rs.{" "}
                          {txn.amount.toLocaleString()}
                        </span>
                        {txn.status === "refunded" && (
                          <span className="ml-2 text-xs text-red-600 font-normal">
                            (Refund)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {txn.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            txn.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : txn.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Banks Tab */}
      {activeTab === "banks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Bank Accounts</h3>
              <p className="text-sm text-gray-600 mt-1">
                {bankAccounts.length === 0 ? (
                  "Add 1-5 payment methods. All will be shown to patients."
                ) : bankAccounts.length >= 5 ? (
                  <span className="text-amber-600 font-medium">
                    Maximum limit reached (5/5)
                  </span>
                ) : (
                  `${bankAccounts.length}/5 payment methods added`
                )}
              </p>
            </div>
            <button
              onClick={() => setShowAddBank(!showAddBank)}
              disabled={bankAccounts.length >= 5}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                bankAccounts.length >= 5
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Bank Account</span>
            </button>
          </div>

          {/* Add Bank Form */}
          {showAddBank && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="font-semibold mb-4">Add New Payment Method</h4>

              {/* Method Type Selection */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setMethodType("bank")}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                    methodType === "bank"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Bank Account
                </button>
                <button
                  onClick={() => setMethodType("mobile-wallet")}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                    methodType === "mobile-wallet"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  Mobile Wallet
                </button>
              </div>

              {/* Bank Form */}
              {methodType === "bank" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newBank.bankName}
                      onChange={(e) => {
                        setNewBank({ ...newBank, bankName: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, bankName: "" }));
                      }}
                      onBlur={validateBankName}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.bankName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Select Bank</option>
                      {pakistanBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.bankName && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.bankName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBank.accountTitle}
                      onChange={(e) => {
                        setNewBank({
                          ...newBank,
                          accountTitle: e.target.value,
                        });
                        setFieldErrors((prev) => ({
                          ...prev,
                          accountTitle: "",
                        }));
                      }}
                      onBlur={validateAccountTitle}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.accountTitle
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter account holder name"
                      required
                      minLength={3}
                      maxLength={100}
                    />
                    {fieldErrors.accountTitle && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.accountTitle}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBank.accountNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setNewBank({ ...newBank, accountNumber: value });
                        setFieldErrors((prev) => ({
                          ...prev,
                          accountNumber: "",
                        }));
                      }}
                      onBlur={validateAccountNumber}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.accountNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter account number (digits only)"
                      required
                      minLength={10}
                      maxLength={20}
                    />
                    {fieldErrors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.accountNumber}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBank.iban}
                      onChange={(e) => {
                        const value = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "");
                        setNewBank({ ...newBank, iban: value });
                        setFieldErrors((prev) => ({ ...prev, iban: "" }));
                      }}
                      onBlur={validateIban}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.iban ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="PK12XXXX0000123456789012 (24 characters)"
                      required
                      minLength={24}
                      maxLength={24}
                    />
                    {fieldErrors.iban && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.iban}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Wallet Form */}
              {methodType === "mobile-wallet" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wallet Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newBank.bankName}
                      onChange={(e) => {
                        setNewBank({ ...newBank, bankName: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, bankName: "" }));
                      }}
                      onBlur={validateBankName}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.bankName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Select Wallet</option>
                      {mobileWallets.map((wallet) => (
                        <option key={wallet} value={wallet}>
                          {wallet}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.bankName && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.bankName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBank.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setNewBank({ ...newBank, phoneNumber: value });
                        setFieldErrors((prev) => ({
                          ...prev,
                          phoneNumber: "",
                        }));
                      }}
                      onBlur={validatePhoneNumber}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.phoneNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="03001234567 (11 digits)"
                      required
                      minLength={11}
                      maxLength={11}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleAddBank}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Add {methodType === "bank" ? "Bank Account" : "Mobile Wallet"}
                </button>
                <button
                  onClick={() => setShowAddBank(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bank Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 hover:border-indigo-300 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {account.type === "bank" ? (
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Wallet className="w-6 h-6 text-indigo-600" />
                    )}
                    <div>
                      <h4 className="font-semibold">{account.bankName}</h4>
                      <span className="text-xs text-green-600 font-medium">
                        Available for Payments
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(account.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {account.type === "bank" && (
                    <>
                      <p>
                        <span className="font-medium">Account Title:</span>{" "}
                        {account.accountTitle}
                      </p>
                      <p>
                        <span className="font-medium">Account Number:</span>{" "}
                        {account.accountNumber}
                      </p>
                      <p>
                        <span className="font-medium">IBAN:</span>{" "}
                        {account.iban}
                      </p>
                    </>
                  )}
                  {account.type === "mobile-wallet" && (
                    <p>
                      <span className="font-medium">Phone Number:</span>{" "}
                      {account.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {bankAccounts.length === 0 && !showAddBank && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Bank Accounts Added
              </h3>
              <p className="text-gray-600 mb-4">
                Add your bank account to receive payments
              </p>
              <button
                onClick={() => setShowAddBank(true)}
                className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Bank Account</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">
                Pending Payment Requests
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Payment requests sent to patients awaiting payment
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Pending Requests
              </h3>
              <p className="text-gray-600">
                All payment requests have been processed
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.appointment_type === "Follow-up"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {request.appointment_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {request.appointment_date && (
                            <div>
                              <div>
                                {new Date(
                                  request.appointment_date
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {request.appointment_time} •{" "}
                                {request.appointment_mode}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          Rs. {parseFloat(request.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {request.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Bank Account Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Remove Bank Account
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this bank account? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveBank(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white min-w-[300px] max-w-md`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="text-white hover:text-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
