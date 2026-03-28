import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  CreditCard,
  Building2,
  Wallet,
  Check,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  doctorName: string;
  appointmentMode: "online" | "in-person";
  consultationFee: number;
  appointmentId?: string; // Added to link transaction to appointment
}

interface PaymentMethod {
  id: string;
  type: "bank" | "mobile-wallet";
  name: string;
  accountNumber?: string;
  iban?: string;
  phoneNumber?: string;
  isDefault: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  doctorName,
  appointmentMode,
  consultationFee,
  appointmentId, // Added to link transaction to appointment
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Load payment methods from API
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Fetch payment methods on mount
  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      const patientId = sessionStorage.getItem("patientId");
      console.log("PaymentModal - Patient ID:", patientId);
      if (!patientId) return;

      try {
        const response = await fetch(
          `http://localhost:8000/api/patient-payment-methods/?patient_id=${patientId}`
        );
        const data = await response.json();
        console.log("PaymentModal - Fetched payment methods:", data);

        // Handle paginated response (results array) or direct array
        const methodsArray = data.results || data;

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
        console.log(
          "PaymentModal - Processed payment methods:",
          methodsArray.length
        );
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save transaction to database via API
    try {
      const patientId = sessionStorage.getItem("patientId");
      const doctorId = sessionStorage.getItem("selectedDoctorId");
      const selectedPaymentMethod = paymentMethods.find(
        (m) => m.id === selectedMethod
      );

      console.log("Creating transaction:", {
        patientId,
        doctorId,
        consultationFee,
        appointmentMode,
      });

      if (patientId && doctorId) {
        const transactionId = `TXN-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const response = await fetch(
          "http://localhost:8000/api/transactions/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: transactionId,
              patient: patientId,
              doctor: doctorId,
              appointment: appointmentId, // Link transaction to appointment for refunds
              amount: consultationFee,
              mode: appointmentMode,
              status: "completed",
              payment_method: selectedPaymentMethod?.name || "Unknown",
            }),
          }
        );

        if (response.ok) {
          const transactionData = await response.json();
          console.log("Transaction created successfully:", transactionData);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to create transaction:", errorData);
        }
      } else {
        console.error("Missing patientId or doctorId for transaction");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    }

    setIsProcessing(false);
    setPaymentSuccess(true);

    // Wait a moment to show success message, then complete
    setTimeout(() => {
      onPaymentComplete();
      setPaymentSuccess(false);
      setSelectedMethod(null);
    }, 1500);
  };

  const handleClose = () => {
    if (!isProcessing && !paymentSuccess) {
      onClose();
      setSelectedMethod(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("payment.paymentRequired")}
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing || paymentSuccess}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Success State */}
          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("payment.paymentSuccessful")}
              </h3>
              <p className="text-gray-600">
                {t("payment.appointmentConfirming")}
              </p>
            </div>
          ) : (
            <>
              {/* Appointment Summary */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {t("payment.appointmentSummary")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("payment.doctor")}:
                    </span>
                    <span className="font-medium text-gray-900">
                      {doctorName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("payment.mode")}:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {appointmentMode === "online"
                        ? t("booking.online")
                        : t("booking.inPerson")}
                    </span>
                  </div>
                  <div className="h-px bg-indigo-200 my-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      {t("payment.consultationFee")}:
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      Rs. {consultationFee.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {t("payment.selectPaymentMethod")}
                </h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isProcessing}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedMethod === method.id
                          ? "border-indigo-600 bg-indigo-50 shadow-md"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              method.type === "bank"
                                ? "bg-blue-100"
                                : "bg-purple-100"
                            }`}
                          >
                            {method.type === "bank" ? (
                              <Building2
                                className={`w-5 h-5 ${
                                  method.type === "bank"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                }`}
                              />
                            ) : (
                              <Wallet
                                className={`w-5 h-5 ${
                                  method.type === "bank"
                                    ? "text-blue-600"
                                    : "text-purple-600"
                                }`}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {method.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {method.type === "bank"
                                ? `****${method.accountNumber?.slice(-4)}`
                                : method.phoneNumber}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedMethod === method.id
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedMethod === method.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Add New Method Link */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/patient/payments", {
                      state: { openAddPaymentMethod: true },
                    });
                  }}
                  disabled={isProcessing}
                  className="mt-3 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {t("payment.addNewPaymentMethod")}
                  </span>
                </button>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>{t("payment.processingPayment")}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {t("payment.payAmount")}{" "}
                      {consultationFee.toLocaleString()}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Security Note */}
              <p className="text-xs text-center text-gray-500 mt-4">
                🔒 {t("payment.secureNote")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
