// Utility functions for payment operations

export interface Transaction {
  id: string;
  date: string;
  type: "payment" | "refund";
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  appointmentId: string;
  amount: number;
  mode: "online" | "in-person";
  status: "completed" | "pending" | "refunded";
  paymentMethod: string;
  reason?: string;
}

export interface PaymentRequest {
  id: string;
  date: string;
  doctorName: string;
  doctorId: string;
  patientId: string;
  appointmentType: string;
  amount: number;
  reason: string;
  status: "pending" | "paid" | "declined";
  appointmentId?: string;
}

/**
 * Process a refund when a doctor cancels an appointment
 * This creates a refund transaction and updates patient's balance
 */
export const processRefund = (
  appointmentId: string,
  patientId: string,
  patientName: string,
  doctorId: string,
  doctorName: string,
  amount: number,
  appointmentMode: "online" | "in-person",
  paymentMethod: string,
  cancellationReason: string
): Transaction => {
  const refundTransaction: Transaction = {
    id: `TXN-REFUND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split("T")[0],
    type: "refund",
    patientName,
    patientId,
    doctorName,
    doctorId,
    appointmentId,
    amount,
    mode: appointmentMode,
    status: "refunded",
    paymentMethod,
    reason: cancellationReason,
  };

  // In a real application, this would:
  // 1. Create a refund transaction in the database
  // 2. Update patient's available balance
  // 3. Send notification to patient
  // 4. Update transaction history for all dashboards

  console.log("Refund processed:", refundTransaction);
  
  // Store in localStorage for demo purposes
  const existingTransactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
  );
  existingTransactions.push(refundTransaction);
  localStorage.setItem("transactions", JSON.stringify(existingTransactions));

  // Update patient balance
  const patientBalances = JSON.parse(
    localStorage.getItem("patientBalances") || "{}"
  );
  patientBalances[patientId] = (patientBalances[patientId] || 0) + amount;
  localStorage.setItem("patientBalances", JSON.stringify(patientBalances));

  return refundTransaction;
};

/**
 * Create a payment request for a follow-up appointment
 * Patient must pay before follow-up is confirmed
 */
export const createPaymentRequest = (
  doctorId: string,
  doctorName: string,
  patientId: string,
  appointmentType: string,
  amount: number,
  reason: string,
  appointmentId?: string
): PaymentRequest => {
  const paymentRequest: PaymentRequest = {
    id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split("T")[0],
    doctorName,
    doctorId,
    patientId,
    appointmentType,
    amount,
    reason,
    status: "pending",
    appointmentId,
  };

  // In a real application, this would:
  // 1. Create a payment request in the database
  // 2. Send notification to patient
  // 3. Block follow-up until payment is made
  // 4. Show in patient's payment requests section

  console.log("Payment request created:", paymentRequest);

  // Store in localStorage for demo purposes
  const existingRequests = JSON.parse(
    localStorage.getItem("paymentRequests") || "[]"
  );
  existingRequests.push(paymentRequest);
  localStorage.setItem("paymentRequests", JSON.stringify(existingRequests));

  return paymentRequest;
};

/**
 * Process payment for a payment request
 * Called when patient pays for a follow-up
 */
export const processPaymentRequest = (
  requestId: string,
  paymentMethod: string
): Transaction | null => {
  const requests = JSON.parse(localStorage.getItem("paymentRequests") || "[]");
  const requestIndex = requests.findIndex((r: PaymentRequest) => r.id === requestId);

  if (requestIndex === -1) {
    console.error("Payment request not found");
    return null;
  }

  const request = requests[requestIndex];

  // Mark request as paid
  requests[requestIndex].status = "paid";
  localStorage.setItem("paymentRequests", JSON.stringify(requests));

  // Create transaction
  const transaction: Transaction = {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split("T")[0],
    type: "payment",
    patientName: "Patient", // Should fetch from patient data
    patientId: request.patientId,
    doctorName: request.doctorName,
    doctorId: request.doctorId,
    appointmentId: request.appointmentId || request.id,
    amount: request.amount,
    mode: "online", // Follow-ups are typically online
    status: "completed",
    paymentMethod,
    reason: request.reason,
  };

  // Store transaction
  const existingTransactions = JSON.parse(
    localStorage.getItem("transactions") || "[]"
  );
  existingTransactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(existingTransactions));

  console.log("Payment request paid:", transaction);

  return transaction;
};

/**
 * Get consultation fee based on appointment mode
 */
export const getConsultationFee = (mode: "online" | "in-person"): number => {
  return mode === "online" ? 1500 : 2500;
};

/**
 * Get all transactions from localStorage (for demo)
 */
export const getAllTransactions = (): Transaction[] => {
  return JSON.parse(localStorage.getItem("transactions") || "[]");
};

/**
 * Get all payment requests from localStorage (for demo)
 */
export const getAllPaymentRequests = (): PaymentRequest[] => {
  return JSON.parse(localStorage.getItem("paymentRequests") || "[]");
};

/**
 * Get patient balance from localStorage (for demo)
 */
export const getPatientBalance = (patientId: string): number => {
  const balances = JSON.parse(localStorage.getItem("patientBalances") || "{}");
  return balances[patientId] || 0;
};

/**
 * Export transactions to CSV file
 */
export const exportTransactionsToCSV = (
  transactions: Transaction[],
  filename: string = 'transactions'
): void => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  // CSV Headers
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Patient Name',
    'Doctor Name',
    'Appointment ID',
    'Amount (Rs.)',
    'Mode',
    'Status',
    'Payment Method',
    'Reason'
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map(txn => [
    txn.id,
    txn.date,
    txn.status === 'refunded' ? 'Refund' : 'Payment',
    txn.patientName,
    txn.doctorName,
    txn.appointmentId,
    txn.amount.toString(),
    txn.mode,
    txn.status,
    txn.paymentMethod,
    txn.reason || '-'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export transactions to Excel-compatible format
 */
export const exportTransactionsToExcel = (
  transactions: Transaction[],
  filename: string = 'transactions'
): void => {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }

  // Create HTML table for Excel
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Patient Name',
    'Doctor Name',
    'Appointment ID',
    'Amount (Rs.)',
    'Mode',
    'Status',
    'Payment Method',
    'Reason'
  ];

  const rows = transactions.map(txn => [
    txn.id,
    txn.date,
    txn.status === 'refunded' ? 'Refund' : 'Payment',
    txn.patientName,
    txn.doctorName,
    txn.appointmentId,
    txn.amount,
    txn.mode,
    txn.status,
    txn.paymentMethod,
    txn.reason || '-'
  ]);

  const htmlTable = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4F46E5; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default {
  processRefund,
  createPaymentRequest,
  processPaymentRequest,
  getConsultationFee,
  getAllTransactions,
  getAllPaymentRequests,
  getPatientBalance,
  exportTransactionsToCSV,
  exportTransactionsToExcel,
};
