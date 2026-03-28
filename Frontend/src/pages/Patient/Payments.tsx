import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  Building2,
  Plus,
  X,
  Check,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  Filter,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import {
  exportTransactionsToCSV,
  exportTransactionsToExcel,
} from "../../utils/paymentUtils";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface PaymentMethod {
  id: string;
  type: "bank" | "mobile-wallet";
  name: string;
  accountNumber?: string;
  iban?: string;
  phoneNumber?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  date: string;
  doctorName: string;
  appointmentId: string;
  amount: number;
  mode: "online" | "in-person";
  status: "completed" | "pending" | "refunded";
  paymentMethod: string;
}

interface PaymentRequest {
  id: string;
  date: string;
  doctorName: string;
  appointmentType: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_mode?: string;
  amount: number;
  reason: string;
  reschedule_reason?: string;
  status: "pending" | "paid" | "declined";
}

const Payments = () => {
  const location = useLocation();
  const { patient } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "pending" | "payment-methods" | "requests"
  >("overview");

  // Helper function to translate status
  const translateStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      completed: t("payments.completed"),
      pending: t("payments.pending"),
      refunded: t("payments.refunded"),
      paid: t("payments.paid"),
      declined: t("payments.declined"),
    };
    return statusMap[status] || status;
  };

  // Helper function to translate mode
  const translateMode = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      online: t("payments.online"),
      "in-person": t("payments.inPerson"),
    };
    return modeMap[mode] || mode;
  };

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodType, setMethodType] = useState<"bank" | "mobile-wallet">(
    "bank"
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteMethodConfirm, setDeleteMethodConfirm] = useState<string | null>(
    null
  );
  const [payRequestConfirm, setPayRequestConfirm] = useState<string | null>(
    null
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [declineRequestConfirm, setDeclineRequestConfirm] = useState<
    string | null
  >(null);

  // Payment Methods State - Load from API
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: "",
    accountNumber: "",
    iban: "",
    phoneNumber: "",
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    accountNumber?: string;
    iban?: string;
    phoneNumber?: string;
  }>({});

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Transaction History - Load from API
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Wallet Balance - Load from API
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Payment Requests (for follow-ups) - Load from API
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);

  // Pakistan Banks and Mobile Wallets
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
  ];

  const mobileWallets = [
    "JazzCash",
    "EasyPaisa",
    "SadaPay",
    "NayaPay",
    "Kuickpay",
  ];

  // Calculate Statistics
  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = paymentRequests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);

  const refundedAmount = transactions
    .filter((t) => t.status === "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = walletBalance; // Wallet balance from patient account

  // Validation functions
  const validateBankName = (name: string): string | null => {
    if (!name || name === "") return "Please select a bank";
    return null;
  };

  const validateWalletName = (name: string): string | null => {
    if (!name || name === "") return "Please select a wallet provider";
    return null;
  };

  const validateAccountNumber = (accountNumber: string): string | null => {
    if (!accountNumber.trim()) return "Account number is required";
    if (!/^\d+$/.test(accountNumber))
      return "Account number must contain only digits";
    if (accountNumber.length < 10 || accountNumber.length > 20) {
      return "Account number must be between 10-20 digits";
    }
    return null;
  };

  const validateIban = (iban: string): string | null => {
    if (!iban.trim()) return "IBAN is required";
    const cleanIban = iban.replace(/\s/g, "").toUpperCase();
    if (!cleanIban.startsWith("PK")) return "IBAN must start with PK";
    if (cleanIban.length !== 24) return "IBAN must be exactly 24 characters";
    if (!/^PK\d{22}$/.test(cleanIban))
      return "Invalid IBAN format (PK followed by 22 digits)";
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone.trim()) return "Phone number is required";
    const cleaned = phone.replace(/[\s-]/g, "");
    if (!/^03\d{9}$/.test(cleaned)) {
      return "Phone must be 11 digits starting with 03";
    }
    return null;
  };

  const handleFieldBlur = (field: string, value: string) => {
    let error: string | null = null;

    if (methodType === "bank") {
      if (field === "name") error = validateBankName(value);
      else if (field === "accountNumber") error = validateAccountNumber(value);
      else if (field === "iban") error = validateIban(value);
    } else if (methodType === "mobile-wallet") {
      if (field === "name") error = validateWalletName(value);
      else if (field === "phoneNumber") error = validatePhoneNumber(value);
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: error || undefined,
    }));
  };

  const handleAddPaymentMethod = async () => {
    console.log("handleAddPaymentMethod called");
    const patientId = sessionStorage.getItem("patientId");
    console.log("Patient ID:", patientId);

    if (!patientId) {
      console.log("No patient ID found");
      return;
    }

    // Check if patient already has 5 payment methods
    if (paymentMethods.length >= 5) {
      showToast(
        "Maximum limit reached. You can add up to 5 payment methods only.",
        "error"
      );
      return;
    }

    console.log("Method type:", methodType);
    console.log("Payment method data:", newPaymentMethod);

    // Validate all fields before submission
    const errors: { [key: string]: string } = {};

    if (methodType === "bank") {
      const nameError = validateBankName(newPaymentMethod.name);
      const accountError = validateAccountNumber(
        newPaymentMethod.accountNumber
      );
      const ibanError = validateIban(newPaymentMethod.iban);

      if (nameError) errors.name = nameError;
      if (accountError) errors.accountNumber = accountError;
      if (ibanError) errors.iban = ibanError;
    } else {
      const nameError = validateWalletName(newPaymentMethod.name);
      const phoneError = validatePhoneNumber(newPaymentMethod.phoneNumber);

      if (nameError) errors.name = nameError;
      if (phoneError) errors.phoneNumber = phoneError;
    }

    console.log("Validation errors:", errors);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Please fix all validation errors before submitting.", "error");
      return;
    }

    console.log("Validation passed, proceeding to submit");

    try {
      if (
        methodType === "bank" &&
        newPaymentMethod.name &&
        newPaymentMethod.accountNumber &&
        newPaymentMethod.iban
      ) {
        console.log("Submitting bank account:", {
          patient: patientId,
          type: "bank",
          name: newPaymentMethod.name,
          account_number: newPaymentMethod.accountNumber,
          iban: newPaymentMethod.iban,
          is_default: false,
        });

        const response = await fetch(
          "http://localhost:8000/api/patient-payment-methods/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient: patientId,
              type: "bank",
              name: newPaymentMethod.name,
              account_number: newPaymentMethod.accountNumber,
              iban: newPaymentMethod.iban,
              is_default: false,
            }),
          }
        );

        console.log("Response status:", response.status);

        if (response.ok) {
          // Refetch payment methods from API to get the updated list
          const methodsRes = await fetch(
            `http://localhost:8000/api/patient-payment-methods/?patient_id=${patientId}`
          );
          const methodsData = await methodsRes.json();
          const methodsArray = methodsData.results || methodsData;

          setPaymentMethods(
            methodsArray.map((m: any) => ({
              id: m.id,
              type: m.type,
              name: m.name,
              accountNumber: m.account_number,
              iban: m.iban,
              phoneNumber: m.phone_number,
              isDefault: m.is_default,
            }))
          );

          setNewPaymentMethod({
            name: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setFieldErrors({});
          setShowAddMethod(false);
          showToast("Bank account added successfully!", "success");
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.detail || errorData.error || "Failed to add bank account";
          showToast(errorMessage, "error");
        }
      } else if (
        methodType === "mobile-wallet" &&
        newPaymentMethod.name &&
        newPaymentMethod.phoneNumber
      ) {
        console.log("Submitting mobile wallet:", {
          patient: patientId,
          type: "mobile-wallet",
          name: newPaymentMethod.name,
          phone_number: newPaymentMethod.phoneNumber,
          is_default: false,
        });

        const response = await fetch(
          "http://localhost:8000/api/patient-payment-methods/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patient: patientId,
              type: "mobile-wallet",
              name: newPaymentMethod.name,
              phone_number: newPaymentMethod.phoneNumber,
              is_default: false,
            }),
          }
        );

        console.log("Response status:", response.status);

        if (response.ok) {
          // Refetch payment methods from API to get the updated list
          const methodsRes = await fetch(
            `http://localhost:8000/api/patient-payment-methods/?patient_id=${patientId}`
          );
          const methodsData = await methodsRes.json();
          const methodsArray = methodsData.results || methodsData;

          setPaymentMethods(
            methodsArray.map((m: any) => ({
              id: m.id,
              type: m.type,
              name: m.name,
              accountNumber: m.account_number,
              iban: m.iban,
              phoneNumber: m.phone_number,
              isDefault: m.is_default,
            }))
          );

          setNewPaymentMethod({
            name: "",
            accountNumber: "",
            iban: "",
            phoneNumber: "",
          });
          setFieldErrors({});
          setShowAddMethod(false);
          showToast("Mobile wallet added successfully!", "success");
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.detail ||
            errorData.error ||
            "Failed to add mobile wallet";
          showToast(errorMessage, "error");
        }
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      showToast("Error adding payment method", "error");
    }
  };

  const handleRemoveMethod = async (id: string) => {
    setDeleteMethodConfirm(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/patient-payment-methods/${id}/`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setPaymentMethods(paymentMethods.filter((method) => method.id !== id));
        showToast("Payment method removed successfully!", "success");
      } else {
        showToast("Failed to remove payment method", "error");
      }
    } catch (error) {
      console.error("Error removing method:", error);
      showToast("Error removing payment method", "error");
    }
  };

  const handlePayRequest = async (requestId: string) => {
    setPayRequestConfirm(null);

    // Check if patient has payment methods
    if (paymentMethods.length === 0) {
      showToast("Please add a payment method first", "error");
      setActiveTab("payment-methods");
      return;
    }

    try {
      // Get the payment request details
      const paymentRequest = paymentRequests.find(
        (req) => req.id === requestId
      );
      if (!paymentRequest) {
        showToast("Payment request not found", "error");
        return;
      }

      // Mark payment request as paid
      const paymentResponse = await fetch(
        `http://localhost:8000/api/payment-requests/${requestId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paid" }),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error("Failed to update payment request");
      }

      const updatedPaymentRequest = await paymentResponse.json();
      console.log("[Payment] Updated payment request:", updatedPaymentRequest);

      // Get the actual doctor ID from the payment request
      const doctorId =
        updatedPaymentRequest.doctor || updatedPaymentRequest.doctor_id;

      if (!doctorId) {
        console.error(
          "[Payment] Doctor ID not found in payment request:",
          updatedPaymentRequest
        );
        throw new Error("Doctor information missing from payment request");
      }

      // Create appointment first (to get appointment_id for transaction)
      // Format time to HH:MM (remove seconds if present)
      let formattedTime = updatedPaymentRequest.appointment_time;
      if (formattedTime && formattedTime.includes(":")) {
        const timeParts = formattedTime.split(":");
        formattedTime = `${timeParts[0]}:${timeParts[1]}`; // Only HH:MM
      }

      // Generate appointment ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      const appointmentId = `APT-${timestamp}-${randomStr}`;

      const appointmentData = {
        id: appointmentId,
        patient: patient?.id,
        doctor: doctorId,
        appointment_date: updatedPaymentRequest.appointment_date,
        appointment_time: formattedTime,
        appointment_type: updatedPaymentRequest.appointment_type || "Follow-up",
        appointment_mode: updatedPaymentRequest.appointment_mode,
        reason: updatedPaymentRequest.reason,
        location: updatedPaymentRequest.location,
        status: "upcoming",
      };

      console.log("[Payment] Creating appointment with data:", appointmentData);

      const appointmentResponse = await fetch(
        "http://localhost:8000/api/appointments/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        }
      );

      if (!appointmentResponse.ok) {
        const errorText = await appointmentResponse.text();
        console.error("[Payment] Appointment creation error:", errorText);
        throw new Error(
          "Failed to create appointment: " + errorText.substring(0, 200)
        );
      }

      const newAppointment = await appointmentResponse.json();
      console.log("[Payment] Appointment created:", newAppointment);

      // Create transaction
      const selectedMethod =
        paymentMethods.find((m) => m.id === selectedPaymentMethodId) ||
        paymentMethods.find((m) => m.isDefault) ||
        paymentMethods[0];
      const transactionData = {
        patient: patient?.id,
        doctor: doctorId,
        appointment: newAppointment.id,
        amount: paymentRequest.amount,
        mode: updatedPaymentRequest.appointment_mode,
        status: "completed",
        payment_method: selectedMethod?.name || "Unknown",
      };

      console.log("[Payment] Creating transaction with data:", transactionData);

      const txnResponse = await fetch(
        "http://localhost:8000/api/transactions/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionData),
        }
      );

      if (!txnResponse.ok) {
        const errorText = await txnResponse.text();
        console.error("[Payment] Transaction creation error:", errorText);
        // Don't throw error, appointment is already created
        showToast(
          "Payment successful, but transaction recording failed. Please contact support.",
          "error"
        );
      } else {
        const newTransaction = await txnResponse.json();
        console.log(
          "[Payment] Transaction created successfully:",
          newTransaction
        );

        // Add the new transaction to the state immediately
        const transactionForState = {
          id: newTransaction.id,
          date: new Date().toISOString().split("T")[0],
          doctorName: newTransaction.doctor_name || "Doctor",
          appointmentId: newAppointment.id,
          amount: parseFloat(paymentRequest.amount.toString()),
          mode: updatedPaymentRequest.appointment_mode,
          status: "completed" as const,
          paymentMethod: selectedMethod?.name || "Unknown",
        };
        setTransactions((prev) => [transactionForState, ...prev]);
      }

      // Update state
      const updatedRequests = paymentRequests.map((req) =>
        req.id === requestId ? { ...req, status: "paid" as const } : req
      );
      setPaymentRequests(updatedRequests);
      setSelectedPaymentMethodId(null);

      showToast(
        `✅ Payment successful! Appointment created for ${new Date(
          updatedPaymentRequest.appointment_date
        ).toLocaleDateString()} at ${
          updatedPaymentRequest.appointment_time
        }. Transaction recorded.`,
        "success"
      );

      // Refresh data after a delay to ensure backend has fully processed the transaction
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error paying request:", error);
      showToast("Error processing payment", "error");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setDeclineRequestConfirm(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/payment-requests/${requestId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "declined" }),
        }
      );
      if (response.ok) {
        const updatedRequests = paymentRequests.map((req) =>
          req.id === requestId ? { ...req, status: "declined" as const } : req
        );
        setPaymentRequests(updatedRequests);
        showToast("Payment request declined", "success");
      } else {
        showToast("Failed to decline payment request", "error");
      }
    } catch (error) {
      console.error("Error declining request:", error);
      showToast("Error declining payment request", "error");
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus;
    const matchesSearch =
      txn.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.appointmentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle navigation state to auto-open add payment method form
  useEffect(() => {
    const state = location.state as { openAddPaymentMethod?: boolean };
    if (state?.openAddPaymentMethod) {
      setActiveTab("payment-methods");
      setShowAddMethod(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const patientId = sessionStorage.getItem("patientId");
      if (!patientId) return;

      try {
        // Fetch patient data for wallet balance
        const patientRes = await fetch(
          `http://localhost:8000/api/patients/${patientId}/`
        );
        const patientData = await patientRes.json();
        console.log("Fetched patient data:", patientData);
        setWalletBalance(parseFloat(patientData.wallet_balance || 0));

        // Fetch payment methods
        const methodsRes = await fetch(
          `http://localhost:8000/api/patient-payment-methods/?patient_id=${patientId}`
        );
        const methodsData = await methodsRes.json();
        console.log("Fetched payment methods:", methodsData);

        // Handle paginated response (results array) or direct array
        const methodsArray = methodsData.results || methodsData;

        setPaymentMethods(
          methodsArray.map((m: any) => ({
            id: m.id,
            type: m.type,
            name: m.name,
            accountNumber: m.account_number,
            iban: m.iban,
            phoneNumber: m.phone_number,
            isDefault: m.is_default,
          }))
        );

        // Fetch transactions
        const txnRes = await fetch(
          `http://localhost:8000/api/transactions/?patient_id=${patientId}`
        );
        const txnData = await txnRes.json();
        console.log("Fetched transactions:", txnData);

        // Handle paginated response (results array) or direct array
        const txnArray = txnData.results || txnData;

        setTransactions(
          txnArray.map((t: any) => ({
            id: t.id,
            date: t.created_at.split("T")[0],
            doctorName: t.doctor_name,
            appointmentId: t.appointment_id || t.id,
            amount: parseFloat(t.amount),
            mode: t.mode,
            status: t.status,
            paymentMethod: t.payment_method,
          }))
        );

        // Fetch payment requests
        const reqRes = await fetch(
          `http://localhost:8000/api/payment-requests/?patient_id=${patientId}`
        );
        const reqData = await reqRes.json();
        console.log("Fetched payment requests:", reqData);

        // Handle paginated response (results array) or direct array
        const reqArray = reqData.results || reqData;

        setPaymentRequests(
          reqArray.map((r: any) => ({
            id: r.id,
            date: r.created_at.split("T")[0],
            doctorName: r.doctor_name,
            appointmentType: r.appointment_type,
            appointment_date: r.appointment_date,
            appointment_time: r.appointment_time,
            appointment_mode: r.appointment_mode,
            amount: parseFloat(r.amount),
            reason: r.reason,
            reschedule_reason: r.reschedule_reason,
            status: r.status,
          }))
        );
      } catch (error) {
        console.error("Error fetching payment data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("payments.title")}
          </h1>
          <p className="text-gray-600 mt-1">{t("payments.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: "overview", label: t("payments.overview") },
            { id: "transactions", label: t("payments.transactions") },
            { id: "pending", label: t("payments.pending") },
            { id: "payment-methods", label: t("payments.paymentMethods") },
            { id: "requests", label: t("payments.requests") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize relative ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.id === "pending" &&
                  transactions.filter((t) => t.status === "pending").length >
                    0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                      {
                        transactions.filter((t) => t.status === "pending")
                          .length
                      }
                    </span>
                  )}
                {tab.id === "requests" &&
                  paymentRequests.filter((req) => req.status === "pending")
                    .length > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      {
                        paymentRequests.filter(
                          (req) => req.status === "pending"
                        ).length
                      }
                    </span>
                  )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">
                    {t("payments.totalSpent")}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {totalSpent.toLocaleString()}
                  </h3>
                </div>
                <Wallet className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">
                    {t("payments.availableBalance")}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {balance.toLocaleString()}
                  </h3>
                </div>
                <CreditCard className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">
                    {t("payments.pendingPayments")}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">
                    Rs. {pendingPayments.toLocaleString()}
                  </h3>
                </div>
                <Clock className="w-12 h-12 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">
                    Pending Payment Requests
                  </p>
                  <h3 className="text-3xl font-bold mt-2">
                    {
                      paymentRequests.filter((r) => r.status === "pending")
                        .length
                    }
                  </h3>
                  <p className="text-orange-100 text-xs mt-1">
                    Requests awaiting your payment
                  </p>
                </div>
                <AlertCircle className="w-12 h-12 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("payments.recentTransactions")}
            </h3>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.status === "completed"
                          ? "bg-green-100"
                          : txn.status === "pending"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Receipt
                        className={`w-5 h-5 ${
                          txn.status === "completed"
                            ? "text-green-600"
                            : txn.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {txn.doctorName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(txn.date).toLocaleDateString()} •{" "}
                        {txn.appointmentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        txn.status === "refunded"
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {txn.status === "refunded" && "+ "}Rs.{" "}
                      {txn.amount.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        txn.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : txn.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {translateStatus(txn.status)}
                    </span>
                  </div>
                </div>
              ))}
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
                  placeholder={t("payments.searchPlaceholder")}
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
                <option value="all">{t("payments.all")}</option>
                <option value="completed">{t("payments.completed")}</option>
                <option value="pending">{t("payments.pending")}</option>
                <option value="refunded">{t("payments.refunded")}</option>
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{t("payments.export")}</span>
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
                            patientName: "",
                            patientId: "",
                            doctorName: txn.doctorName,
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
                          "patient_transactions"
                        );
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>{t("payments.exportCSV")}</span>
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
                            patientName: "",
                            patientId: "",
                            doctorName: txn.doctorName,
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
                          "patient_transactions"
                        );
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 transition border-t"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>{t("payments.exportExcel")}</span>
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
                      {t("payments.transactionId")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.doctor")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.appointmentId")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.mode")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.amount")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.paymentMethod")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("payments.status")}
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
                        {txn.doctorName}
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
                          {translateMode(txn.mode)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span
                          className={
                            txn.status === "refunded"
                              ? "text-green-600"
                              : "text-gray-900"
                          }
                        >
                          {txn.status === "refunded" && "+ "}Rs.{" "}
                          {txn.amount.toLocaleString()}
                        </span>
                        {txn.status === "refunded" && (
                          <span className="ml-2 text-xs text-green-600 font-normal">
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
                          {translateStatus(txn.status)}
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

      {/* Pending Payments Tab */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Pending Payment Requests
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Payment requests from doctors awaiting your payment
                </p>
              </div>
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
                <span className="font-semibold">
                  {paymentRequests.filter((r) => r.status === "pending").length}{" "}
                  Pending
                </span>
              </div>
            </div>

            {paymentRequests.filter((r) => r.status === "pending").length ===
            0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Payments
                </h3>
                <p className="text-gray-600">
                  All your payments are up to date
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  You have pending payment requests. Click "View Requests" tab
                  to pay and confirm appointments.
                </p>
                {paymentRequests
                  .filter((r) => r.status === "pending")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-gray-900">
                                {request.doctorName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {request.appointmentType}
                              </p>
                            </div>
                          </div>

                          {request.appointment_date && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <p className="text-sm font-semibold text-blue-900 mb-1">
                                Appointment Details:
                              </p>
                              <div className="text-sm text-blue-800 space-y-1">
                                <div>
                                  📅{" "}
                                  {new Date(
                                    request.appointment_date
                                  ).toLocaleDateString()}
                                </div>
                                <div>🕐 {request.appointment_time}</div>
                                <div>
                                  📍{" "}
                                  {request.appointment_mode === "online"
                                    ? "Online"
                                    : "In-Person"}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-white rounded-lg p-3 border border-orange-200">
                            <p className="text-xs text-gray-600 mb-1">Reason</p>
                            <p className="text-sm font-medium text-gray-900">
                              {request.reason}
                            </p>
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          <p className="text-xs text-gray-500 mb-1">
                            Amount Due
                          </p>
                          <p className="text-3xl font-bold text-orange-600">
                            Rs. {request.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() => {
                              setPayRequestConfirm(request.id);
                              setActiveTab("requests");
                            }}
                            className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "payment-methods" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">
                {t("payments.paymentMethodsTitle")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {paymentMethods.length === 0 ? (
                  t("payments.addMethodsPrompt")
                ) : paymentMethods.length >= 5 ? (
                  <span className="text-amber-600 font-medium">
                    {t("payments.maxLimitReached")}
                  </span>
                ) : (
                  `${paymentMethods.length}/5 ${t("payments.methodsAdded")}`
                )}
              </p>
            </div>
            <button
              onClick={() => setShowAddMethod(!showAddMethod)}
              disabled={paymentMethods.length >= 5}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                paymentMethods.length >= 5
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t("payments.addPaymentMethod")}</span>
            </button>
          </div>

          {/* Add Payment Method Form */}
          {showAddMethod && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h4 className="font-semibold mb-4">
                {t("payments.addNewMethod")}
              </h4>

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
                  {t("payments.bankAccount")}
                </button>
                <button
                  onClick={() => setMethodType("mobile-wallet")}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                    methodType === "mobile-wallet"
                      ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {t("payments.mobileWallet")}
                </button>
              </div>

              {/* Bank Form */}
              {methodType === "bank" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newPaymentMethod.name}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          name: e.target.value,
                        })
                      }
                      onBlur={(e) => handleFieldBlur("name", e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">{t("payments.selectBank")}</option>
                      {pakistanBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.accountNumber}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          accountNumber: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleFieldBlur("accountNumber", e.target.value)
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.accountNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={t("payments.enterAccountNumber")}
                    />
                    {fieldErrors.accountNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.accountNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IBAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.iban}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          iban: e.target.value,
                        })
                      }
                      onBlur={(e) => handleFieldBlur("iban", e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.iban ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="PK12XXXX0000123456789012"
                    />
                    {fieldErrors.iban && (
                      <p className="text-red-500 text-xs mt-1">
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
                      value={newPaymentMethod.name}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          name: e.target.value,
                        })
                      }
                      onBlur={(e) => handleFieldBlur("name", e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Wallet</option>
                      {mobileWallets.map((wallet) => (
                        <option key={wallet} value={wallet}>
                          {wallet}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.phoneNumber}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          phoneNumber: e.target.value,
                        })
                      }
                      onBlur={(e) =>
                        handleFieldBlur("phoneNumber", e.target.value)
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        fieldErrors.phoneNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="03001234567"
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    console.log("Add Method button clicked!");
                    handleAddPaymentMethod();
                  }}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  {t("payments.addMethod")}
                </button>
                <button
                  onClick={() => {
                    setShowAddMethod(false);
                    setNewPaymentMethod({
                      name: "",
                      accountNumber: "",
                      iban: "",
                      phoneNumber: "",
                    });
                    setFieldErrors({});
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  {t("payments.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Payment Methods List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="bg-white rounded-xl shadow-md p-6 border-2 border-transparent"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {method.type === "bank" ? (
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <Wallet className="w-6 h-6 text-indigo-600" />
                    )}
                    <div>
                      <h4 className="font-semibold">{method.name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteMethodConfirm(method.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {method.type === "bank" && (
                    <>
                      <p>
                        <span className="font-medium">Account:</span>{" "}
                        {method.accountNumber}
                      </p>
                      <p>
                        <span className="font-medium">IBAN:</span> {method.iban}
                      </p>
                    </>
                  )}
                  {method.type === "mobile-wallet" && (
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {method.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Requests Tab */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {t("payments.requestsTitle")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t("payments.requestsSubtitle")}
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {paymentRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg">
                          {request.doctorName}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {translateStatus(request.status)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1 font-medium">
                        {request.appointmentType === "Follow-up"
                          ? t("payments.followUp")
                          : request.appointmentType}
                      </p>

                      {/* Appointment Details */}
                      {request.appointment_date && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-2">
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            {t("payments.appointmentDetails")}:
                          </p>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div>
                              📅 {t("payments.date")}:{" "}
                              {new Date(
                                request.appointment_date
                              ).toLocaleDateString()}
                            </div>
                            <div>🕐 Time: {request.appointment_time}</div>
                            <div>
                              📍 {t("payments.mode")}:{" "}
                              {request.appointment_mode === "online"
                                ? t("payments.online")
                                : t("payments.inPerson")}
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        {t("payments.reason")}: {request.reason}
                      </p>
                      {request.reschedule_reason && (
                        <p className="text-sm text-gray-500 mt-1">
                          {t("payments.rescheduleReason")}:{" "}
                          {request.reschedule_reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {t("payments.requested")}:{" "}
                        {new Date(request.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-gray-900">
                        Rs. {request.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setPayRequestConfirm(request.id)}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{t("payments.payNow")}</span>
                      </button>
                      <button
                        onClick={() => setDeclineRequestConfirm(request.id)}
                        className="flex-1 bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition flex items-center justify-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>{t("payments.decline")}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {paymentRequests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("payments.noRequestsTitle")}
              </h3>
              <p className="text-gray-600">{t("payments.noRequestsMessage")}</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Payment Method Confirmation Modal */}
      {deleteMethodConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Remove Payment Method
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this payment method? This action
              cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteMethodConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMethod(deleteMethodConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Request Confirmation Modal */}
      {payRequestConfirm &&
        (() => {
          const request = paymentRequests.find(
            (r) => r.id === payRequestConfirm
          );
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>

                {request && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      Payment Details:
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Doctor: {request.doctorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {request.appointmentType}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      Amount: Rs. {request.amount.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPaymentMethodId || ""}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose payment method...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} -{" "}
                        {method.type === "bank"
                          ? `${method.accountNumber}`
                          : method.phoneNumber}
                        {method.isDefault && " (Default)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setPayRequestConfirm(null);
                      setSelectedPaymentMethodId(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedPaymentMethodId) {
                        showToast("Please select a payment method", "error");
                        return;
                      }
                      handlePayRequest(payRequestConfirm);
                    }}
                    disabled={!selectedPaymentMethodId}
                    className={`flex-1 px-4 py-2 rounded-lg transition ${
                      selectedPaymentMethodId
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Decline Request Confirmation Modal */}
      {declineRequestConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Decline Payment Request
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to decline this payment request? This action
              cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeclineRequestConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeclineRequest(declineRequestConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Decline
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
