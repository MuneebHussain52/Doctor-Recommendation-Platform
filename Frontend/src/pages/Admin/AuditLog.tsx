import React, { useState, useEffect } from 'react';
import { Shield, Ban, CheckCircle, Search, Calendar, User, FileText } from 'lucide-react';

interface AuditEntry {
  id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  action: 'blocked' | 'unblocked';
  reason?: string;
  performed_by: string;
  performed_by_name: string;
  timestamp: string;
}

const AuditLog: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'blocked' | 'unblocked'>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);

  useEffect(() => {
    fetchAuditLog();
  }, []);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      // Fetch audit log from backend
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/api/admin/audit-log/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch audit log');
      
      const data = await response.json();
      
      // Transform API data to match our interface
      const entries: AuditEntry[] = data.map((log: any) => ({
        id: log.id,
        doctor_id: log.doctor_id,
        doctor_name: log.doctor_name,
        doctor_specialty: log.doctor_specialty,
        action: log.action,
        reason: log.reason,
        performed_by: log.performed_by,
        performed_by_name: log.performed_by_name,
        timestamp: log.performed_at
      }));
      
      setAuditEntries(entries);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
      setLoading(false);
    }
  };

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = entry.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.doctor_specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewReason = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setShowReasonModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-cyan-600" />
          <h1 className="text-2xl font-bold text-gray-900">Doctor Blocking Audit Trail</h1>
        </div>
        <p className="text-gray-600">Track all doctor blocking and unblocking actions</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Action:</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as 'all' | 'blocked' | 'unblocked')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All Actions</option>
              <option value="blocked">Blocked Only</option>
              <option value="unblocked">Unblocked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{auditEntries.length}</p>
            </div>
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">
                {auditEntries.filter(e => e.action === 'blocked').length}
              </p>
            </div>
            <Ban className="h-10 w-10 text-red-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unblocked</p>
              <p className="text-2xl font-bold text-green-600">
                {auditEntries.filter(e => e.action === 'unblocked').length}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No audit entries found</p>
            <p className="text-gray-400 text-sm">Blocking and unblocking actions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{entry.doctor_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{entry.doctor_specialty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.action === 'blocked' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.action === 'blocked' ? <Ban className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{entry.performed_by_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(entry.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {entry.action === 'blocked' && entry.reason ? (
                        <button
                          onClick={() => viewReason(entry)}
                          className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                        >
                          View Reason
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Reason Modal */}
      {showReasonModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Block Reason</h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Doctor:</span> {selectedEntry.doctor_name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Specialty:</span> {selectedEntry.doctor_specialty}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Date:</span> {formatDate(selectedEntry.timestamp)}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Reason for Blocking:</p>
              <p className="text-sm text-gray-800">{selectedEntry.reason || 'No reason provided'}</p>
            </div>

            <button
              onClick={() => setShowReasonModal(false)}
              className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
