import React, { useState, useEffect } from "react";
import {
  Banknote,
  Users,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Building2,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
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
}

interface DoctorSummary {
  id: string;
  name: string;
  specialty: string;
  totalEarnings: number;
  completedAppointments: number;
  refundedAmount: number;
}

interface PatientSummary {
  id: string;
  name: string;
  totalSpent: number;
  completedAppointments: number;
  refundedAmount: number;
}

const Payments = () => {
  const [activeSection, setActiveSection] = useState<
    "overview" | "doctors" | "patients"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  // State for backend data
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data from backend
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true);

        // Fetch all transactions
        const txnResponse = await fetch(
          "http://localhost:8000/api/transactions/"
        );
        const txnData = await txnResponse.json();
        const transactionsArray = txnData.results || txnData;

        if (Array.isArray(transactionsArray)) {
          setAllTransactions(
            transactionsArray.map((t: any) => ({
              id: t.id,
              date: t.created_at.split("T")[0],
              type: t.status === "refunded" ? "refund" : "payment",
              patientName: t.patient_name || "Unknown Patient",
              patientId: t.patient || t.patient_id || "",
              doctorName: t.doctor_name || "Unknown Doctor",
              doctorId: t.doctor || t.doctor_id || "",
              appointmentId: t.appointment_id || t.appointment || "N/A",
              amount: parseFloat(t.amount),
              mode: t.mode,
              status: t.status,
              paymentMethod: t.payment_method,
            }))
          );
        }

        // Fetch doctors list and calculate their stats
        const doctorsResponse = await fetch(
          "http://localhost:8000/api/doctors/"
        );
        const doctorsData = await doctorsResponse.json();
        const doctorsArray = doctorsData.results || doctorsData;

        if (Array.isArray(doctorsArray)) {
          const doctorStats = await Promise.all(
            doctorsArray.map(async (doc: any) => {
              try {
                // Fetch doctor's transactions
                const docTxnRes = await fetch(
                  `http://localhost:8000/api/transactions/?doctor_id=${doc.id}`
                );
                const docTxnData = await docTxnRes.json();
                const docTransactions = docTxnData.results || docTxnData;

                const completedTxns = docTransactions.filter(
                  (t: any) =>
                    t.status === "completed" && !t.id.startsWith("TXN-REFUND")
                );
                const refundedTxns = docTransactions.filter(
                  (t: any) => t.status === "refunded"
                );

                const totalEarnings = completedTxns.reduce(
                  (sum: number, t: any) => sum + parseFloat(t.amount),
                  0
                );
                const refundedAmount = refundedTxns.reduce(
                  (sum: number, t: any) => sum + parseFloat(t.amount),
                  0
                );

                return {
                  id: doc.id,
                  name:
                    `Dr. ${doc.user?.first_name || ""} ${
                      doc.user?.last_name || ""
                    }`.trim() || doc.id,
                  specialty: doc.specialty || "General",
                  totalEarnings,
                  completedAppointments: completedTxns.length,
                  refundedAmount,
                };
              } catch (error) {
                console.error(
                  `Error fetching stats for doctor ${doc.id}:`,
                  error
                );
                return {
                  id: doc.id,
                  name:
                    `Dr. ${doc.user?.first_name || ""} ${
                      doc.user?.last_name || ""
                    }`.trim() || doc.id,
                  specialty: doc.specialty || "General",
                  totalEarnings: 0,
                  completedAppointments: 0,
                  refundedAmount: 0,
                };
              }
            })
          );
          setDoctors(doctorStats);
        }

        // Fetch patients list and calculate their stats
        const patientsResponse = await fetch(
          "http://localhost:8000/api/patients/"
        );
        const patientsData = await patientsResponse.json();
        const patientsArray = patientsData.results || patientsData;

        if (Array.isArray(patientsArray)) {
          const patientStats = await Promise.all(
            patientsArray.map(async (pat: any) => {
              try {
                // Fetch patient's transactions
                const patTxnRes = await fetch(
                  `http://localhost:8000/api/transactions/?patient_id=${pat.id}`
                );
                const patTxnData = await patTxnRes.json();
                const patTransactions = patTxnData.results || patTxnData;

                const completedTxns = patTransactions.filter(
                  (t: any) =>
                    t.status === "completed" && !t.id.startsWith("TXN-REFUND")
                );
                const refundedTxns = patTransactions.filter(
                  (t: any) => t.status === "refunded"
                );

                const totalSpent = completedTxns.reduce(
                  (sum: number, t: any) => sum + parseFloat(t.amount),
                  0
                );
                const refundedAmount = refundedTxns.reduce(
                  (sum: number, t: any) => sum + parseFloat(t.amount),
                  0
                );

                return {
                  id: pat.id,
                  name:
                    `${pat.user?.first_name || ""} ${
                      pat.user?.last_name || ""
                    }`.trim() || pat.id,
                  totalSpent,
                  completedAppointments: completedTxns.length,
                  refundedAmount,
                };
              } catch (error) {
                console.error(
                  `Error fetching stats for patient ${pat.id}:`,
                  error
                );
                return {
                  id: pat.id,
                  name:
                    `${pat.user?.first_name || ""} ${
                      pat.user?.last_name || ""
                    }`.trim() || pat.id,
                  totalSpent: 0,
                  completedAppointments: 0,
                  refundedAmount: 0,
                };
              }
            })
          );
          setPatients(patientStats);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching payment data:", error);
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, []);

  // Calculate Statistics
  const totalRevenue = allTransactions
    .filter((t) => t.status === "completed" && t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = allTransactions
    .filter((t) => t.status === "refunded" && t.type === "refund")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = allTransactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransactions = allTransactions.length;

  // Filter transactions based on selected doctor/patient
  const getFilteredTransactions = () => {
    let filtered = allTransactions;

    if (selectedDoctor) {
      filtered = filtered.filter((t) => t.doctorId === selectedDoctor);
    }

    if (selectedPatient) {
      filtered = filtered.filter((t) => t.patientId === selectedPatient);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.appointmentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Export PDF Report Function
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add header
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 0, pageWidth, 40, "F");

    // Logo/Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, "bold");
    doc.text("Medora", 14, 15);

    doc.setFontSize(16);
    doc.text("Payment Report", 14, 28);

    // Report date
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      pageWidth - 14,
      15,
      { align: "right" }
    );

    // Report type
    let reportTitle = "All Transactions";
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      reportTitle = `Doctor Report: ${doctor?.name}`;
    } else if (selectedPatient) {
      const patient = patients.find((p) => p.id === selectedPatient);
      reportTitle = `Patient Report: ${patient?.name}`;
    } else if (activeSection === "doctors") {
      reportTitle = "All Doctors Summary";
    } else if (activeSection === "patients") {
      reportTitle = "All Patients Summary";
    }

    doc.text(reportTitle, pageWidth - 14, 28, { align: "right" });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Summary Statistics
    let yPos = 50;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text("Summary Statistics", 14, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");

    // Create summary table
    const summaryData = [
      ["Total Revenue", `Rs. ${totalRevenue.toLocaleString()}`],
      ["Total Transactions", totalTransactions.toString()],
      ["Pending Payments", `Rs. ${pendingPayments.toLocaleString()}`],
      ["Total Refunds", `Rs. ${totalRefunds.toLocaleString()}`],
      ["Net Revenue", `Rs. ${(totalRevenue - totalRefunds).toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Transactions or Summary based on active section
    if (activeSection === "overview" || selectedDoctor || selectedPatient) {
      // Transaction Details
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Transaction Details", 14, yPos);

      yPos += 5;

      const filteredTxns = getFilteredTransactions();
      const transactionData = filteredTxns.map((txn) => [
        txn.id,
        new Date(txn.date).toLocaleDateString(),
        txn.type,
        txn.patientName,
        txn.doctorName,
        `Rs. ${txn.amount.toLocaleString()}`,
        txn.status,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["ID", "Date", "Type", "Patient", "Doctor", "Amount", "Status"]],
        body: transactionData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 22 },
          6: { cellWidth: 20 },
        },
      });
    } else if (activeSection === "doctors") {
      // Doctors Summary
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Doctors Financial Summary", 14, yPos);

      yPos += 5;

      const doctorData = doctors.map((doc) => [
        doc.name,
        doc.specialty,
        `Rs. ${doc.totalEarnings.toLocaleString()}`,
        doc.completedAppointments.toString(),
        `Rs. ${doc.refundedAmount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Doctor", "Specialty", "Earnings", "Appointments", "Refunds"]],
        body: doctorData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    } else if (activeSection === "patients") {
      // Patients Summary
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Patients Financial Summary", 14, yPos);

      yPos += 5;

      const patientData = patients.map((pat) => [
        pat.name,
        `Rs. ${pat.totalSpent.toLocaleString()}`,
        pat.completedAppointments.toString(),
        `Rs. ${pat.refundedAmount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Patient", "Total Spent", "Appointments", "Refunds"]],
        body: patientData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos;
    if (pageHeight - finalY > 30) {
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        "© 2025 Medora - Healthcare Management System",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const fileName = `payment-report-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all payment transactions across the platform
          </p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-2">
                Rs. {totalRevenue.toLocaleString()}
              </h3>
            </div>
            <Banknote className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Transactions</p>
              <h3 className="text-3xl font-bold mt-2">{totalTransactions}</h3>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Payments</p>
              <h3 className="text-3xl font-bold mt-2">
                Rs. {pendingPayments.toLocaleString()}
              </h3>
            </div>
            <Calendar className="w-12 h-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Refunds</p>
              <h3 className="text-3xl font-bold mt-2">
                Rs. {totalRefunds.toLocaleString()}
              </h3>
            </div>
            <ArrowDownRight className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {["overview", "doctors", "patients"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSection(tab as any);
                setSelectedDoctor(null);
                setSelectedPatient(null);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeSection === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by patient, doctor, or appointment ID..."
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
            </div>
          </div>

          {/* All Transactions Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold">All Transactions</h3>
            </div>
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredTransactions().length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">
                          No transactions found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    getFilteredTransactions().map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {txn.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`flex items-center space-x-1 ${
                              txn.type === "payment"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "payment" ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            <span className="capitalize">{txn.type}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {txn.doctorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {txn.appointmentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          Rs. {txn.amount.toLocaleString()}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Section */}
      {activeSection === "doctors" && (
        <div className="space-y-6">
          {!selectedDoctor ? (
            <>
              {/* Doctors Summary Cards */}
              {doctors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900">
                    No doctors found
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Doctors will appear here once registered
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                      onClick={() => setSelectedDoctor(doctor.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {doctor.specialty}
                          </p>
                        </div>
                        <Eye className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Total Earnings
                          </span>
                          <span className="font-semibold text-green-600">
                            Rs. {doctor.totalEarnings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Appointments
                          </span>
                          <span className="font-semibold">
                            {doctor.completedAppointments}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Refunded
                          </span>
                          <span className="font-semibold text-red-600">
                            Rs. {doctor.refundedAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Doctor Transaction History */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {doctors.find((d) => d.id === selectedDoctor)?.name}
                  </h3>
                  <p className="text-gray-600">Transaction History</p>
                </div>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Back to Doctors
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
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
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredTransactions().map((txn) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Rs. {txn.amount.toLocaleString()}
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
            </>
          )}
        </div>
      )}

      {/* Patients Section */}
      {activeSection === "patients" && (
        <div className="space-y-6">
          {!selectedPatient ? (
            <>
              {/* Patients Summary Cards */}
              {patients.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900">
                    No patients found
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Patients will appear here once registered
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                      onClick={() => setSelectedPatient(patient.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-gray-600">Patient</p>
                        </div>
                        <Eye className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Total Spent
                          </span>
                          <span className="font-semibold text-blue-600">
                            Rs. {patient.totalSpent.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Appointments
                          </span>
                          <span className="font-semibold">
                            {patient.completedAppointments}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Refunded
                          </span>
                          <span className="font-semibold text-green-600">
                            Rs. {patient.refundedAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Patient Transaction History */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {patients.find((p) => p.id === selectedPatient)?.name}
                  </h3>
                  <p className="text-gray-600">Transaction History</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Back to Patients
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
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
                          Doctor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredTransactions().map((txn) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Rs. {txn.amount.toLocaleString()}
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Payments;
