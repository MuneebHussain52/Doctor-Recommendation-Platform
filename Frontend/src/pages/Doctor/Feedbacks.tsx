import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Send, Edit2, Trash2, Reply, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDateTimeFormat } from '../../context/DateTimeFormatContext';

interface FeedbackMessage {
  id: string;
  feedback: string;
  sender_type: 'patient' | 'doctor';
  message_text: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

interface Feedback {
  id: string;
  patient_info: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  doctor_reply?: string;
  patient_reply?: string;
  doctor_reply_to_patient?: string;
  created_at: string;
  updated_at?: string;
  doctor_reply_at?: string;
  patient_reply_at?: string;
  doctor_reply_to_patient_at?: string;
  doctor_reply_deleted_at?: string;
  patient_reply_deleted_at?: string;
  doctor_reply_to_patient_deleted_at?: string;
  messages?: FeedbackMessage[];
}

const renderStars = (rating: number) => {
  return Array(5)
    .fill(0)
    .map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
};

const FeedbacksPage = () => {
  const { doctor } = useAuth();
  const { formatDate: formatDateContext, formatTime, formatDateTime: formatDateTimeContext } = useDateTimeFormat();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyToPatientValues, setReplyToPatientValues] = useState<{ [key: string]: string }>({});
  const [editingReplyToPatientId, setEditingReplyToPatientId] = useState<string | null>(null);
  const [viewRepliesMap, setViewRepliesMap] = useState<{ [key: string]: boolean }>({});

  // Message threading state
  const [messages, setMessages] = useState<{ [feedbackId: string]: FeedbackMessage[] }>({});
  const [replyingToFeedbackId, setReplyingToFeedbackId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');

  // Fetch feedbacks from backend
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!doctor?.id) return;

      try {
        console.log('[Feedbacks] Fetching feedbacks for doctor:', doctor.id);
        const response = await fetch(`http://localhost:8000/api/doctors/${doctor.id}/feedback/`);
        const data = await response.json();
        console.log('[Feedbacks] Received feedbacks:', data);
        setFeedbacks(data);

        // Extract messages for each feedback
        const messagesMap: { [feedbackId: string]: FeedbackMessage[] } = {};
        data.forEach((feedback: Feedback) => {
          if (feedback.messages) {
            messagesMap[feedback.id] = feedback.messages;
          }
        });
        setMessages(messagesMap);

        setLoading(false);
      } catch (error) {
        console.error('[Feedbacks] Failed to fetch feedbacks:', error);
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [doctor]);

  const getPatientFullName = (patient_info: Feedback['patient_info']) => {
    return patient_info.name;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;

    // For dates older than 1 year, use the configured date format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    return formatDateContext(isoDate);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return formatDateTimeContext(isoDate, timeStr);
  };

  const handleReply = async (id: string) => {
    const replyText = inputValues[id] || '';
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply: replyText })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? {
            ...fb,
            doctor_reply: updatedFeedback.doctor_reply,
            doctor_reply_at: updatedFeedback.doctor_reply_at,
            // Keep doctor_reply_deleted_at to maintain conversation history
          } : fb
        ));
        setInputValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        throw new Error('Failed to save reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to save reply:', error);
      alert('Failed to save reply. Please try again.');
    }
  };

  const handleEdit = (id: string, currentReply: string) => {
    setEditingId(id);
    setInputValues((prev) => ({ ...prev, [id]: currentReply }));
  };

  const handleSaveEdit = async (id: string) => {
    const replyText = inputValues[id] || '';
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply: replyText })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? {
            ...fb,
            doctor_reply: updatedFeedback.doctor_reply,
            doctor_reply_at: updatedFeedback.doctor_reply_at,
            // Keep doctor_reply_deleted_at to maintain conversation history
          } : fb
        ));
        setEditingId(null);
      } else {
        throw new Error('Failed to update reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to update reply:', error);
      alert('Failed to update reply. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply: null })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? { ...fb, doctor_reply: undefined, doctor_reply_at: undefined, doctor_reply_deleted_at: updatedFeedback.doctor_reply_deleted_at } : fb
        ));
        setInputValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        throw new Error('Failed to delete reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to delete reply:', error);
      alert('Failed to delete reply. Please try again.');
    }
  };

  const handleReplyToPatient = async (id: string) => {
    const replyText = replyToPatientValues[id] || '';
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply_to_patient: replyText })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? {
            ...fb,
            doctor_reply_to_patient: updatedFeedback.doctor_reply_to_patient,
            doctor_reply_to_patient_at: updatedFeedback.doctor_reply_to_patient_at,
            // Keep doctor_reply_to_patient_deleted_at to maintain conversation history
          } : fb
        ));
        setReplyToPatientValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        throw new Error('Failed to save reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to save reply to patient:', error);
      alert('Failed to save reply. Please try again.');
    }
  };

  const handleEditReplyToPatient = (id: string, currentReply: string) => {
    setEditingReplyToPatientId(id);
    setReplyToPatientValues((prev) => ({ ...prev, [id]: currentReply }));
  };

  const handleSaveEditReplyToPatient = async (id: string) => {
    const replyText = replyToPatientValues[id] || '';
    if (!replyText.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply_to_patient: replyText })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? {
            ...fb,
            doctor_reply_to_patient: updatedFeedback.doctor_reply_to_patient,
            doctor_reply_to_patient_at: updatedFeedback.doctor_reply_to_patient_at,
            // Keep doctor_reply_to_patient_deleted_at to maintain conversation history
          } : fb
        ));
        setEditingReplyToPatientId(null);
      } else {
        throw new Error('Failed to update reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to update reply to patient:', error);
      alert('Failed to update reply. Please try again.');
    }
  };

  const handleDeleteReplyToPatient = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_reply_to_patient: null })
      });

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedbacks(prev => prev.map(fb =>
          fb.id === id ? { ...fb, doctor_reply_to_patient: undefined, doctor_reply_to_patient_at: undefined, doctor_reply_to_patient_deleted_at: updatedFeedback.doctor_reply_to_patient_deleted_at } : fb
        ));
        setReplyToPatientValues((prev) => ({ ...prev, [id]: '' }));
      } else {
        throw new Error('Failed to delete reply');
      }
    } catch (error) {
      console.error('[Feedbacks] Failed to delete reply to patient:', error);
      alert('Failed to delete reply. Please try again.');
    }
  };

  // Message handling functions
  const handleStartReply = (feedbackId: string) => {
    setReplyingToFeedbackId(feedbackId);
    setNewMessageText('');
  };

  const handleCancelReply = () => {
    setReplyingToFeedbackId(null);
    setNewMessageText('');
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleSubmitMessage = async (feedbackId: string) => {
    if (!newMessageText.trim() || newMessageText.length < 5) {
      alert('Please provide a message (minimum 5 characters)');
      return;
    }

    setIsSubmittingMessage(true);

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${feedbackId}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_type: 'doctor',
          message_text: newMessageText.trim(),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const newMessage = await response.json();

      // Update messages in local state
      setMessages(prev => ({
        ...prev,
        [feedbackId]: [...(prev[feedbackId] || []), newMessage]
      }));

      // Reset reply mode
      handleCancelReply();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleEditMessage = (message: FeedbackMessage) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.message_text);
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editMessageText.trim() || editMessageText.length < 5) {
      alert('Please provide a message (minimum 5 characters)');
      return;
    }

    setIsSubmittingMessage(true);

    try {
      const response = await fetch(`http://localhost:8000/api/feedback-messages/${messageId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: editMessageText.trim(),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update message');
      }

      const updatedMessage = await response.json();

      // Update message in local state
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(feedbackId => {
          newMessages[feedbackId] = newMessages[feedbackId].map(msg =>
            msg.id === messageId ? updatedMessage : msg
          );
        });
        return newMessages;
      });

      // Reset edit mode
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (error) {
      console.error('Failed to update message:', error);
      alert(error instanceof Error ? error.message : 'Failed to update message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId: string, feedbackId: string) => {
    setIsSubmittingMessage(true);

    try {
      const response = await fetch(`http://localhost:8000/api/feedback-messages/${messageId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deleted_by: 'doctor',
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete message');
      }

      const deletedMessage = await response.json();

      // Update message in local state
      setMessages(prev => ({
        ...prev,
        [feedbackId]: prev[feedbackId].map(msg =>
          msg.id === messageId ? deletedMessage : msg
        )
      }));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete message. Please try again.');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  // Render message thread for a feedback
  const renderMessageThread = (feedbackId: string) => {
    const feedbackMessages = messages[feedbackId] || [];
    const hasMessages = feedbackMessages.length > 0;
    const isViewingReplies = viewRepliesMap[feedbackId] || false;

    // If no messages and not replying, show reply button
    if (!hasMessages && replyingToFeedbackId !== feedbackId) {
      return (
        <button
          onClick={() => handleStartReply(feedbackId)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          <Reply className="h-4 w-4" />
          Reply
        </button>
      );
    }

    // If no messages but currently replying, show the reply form
    if (!hasMessages && replyingToFeedbackId === feedbackId) {
      return (
        <div className="bg-white border border-cyan-200 rounded-lg p-3">
          <textarea
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            className="block w-full px-3 py-2 border border-cyan-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 bg-cyan-50 text-gray-900 text-sm"
            rows={3}
            minLength={5}
            placeholder="Write your message..."
            required
          />
          <p className="mt-1 text-xs text-cyan-500">
            Minimum 5 characters required {newMessageText.length > 0 && `(${newMessageText.length}/5)`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleSubmitMessage(feedbackId)}
              disabled={!newMessageText.trim() || newMessageText.length < 5 || isSubmittingMessage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSubmittingMessage ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Send Message
                </>
              )}
            </button>
            <button
              onClick={handleCancelReply}
              disabled={isSubmittingMessage}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Has messages - show view replies toggle button
    return (
      <div className="space-y-3">
        <button
          onClick={() => setViewRepliesMap(prev => ({ ...prev, [feedbackId]: !prev[feedbackId] }))}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
        >
          {isViewingReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isViewingReplies ? 'Hide Conversation' : 'View Conversation'}
        </button>

        {/* Show messages only when viewing */}
        {isViewingReplies && (
          <div className="space-y-3 mt-3">
            {/* Render all messages in chronological order */}
            {feedbackMessages.map((msg) => {
          const isDoctor = msg.sender_type === 'doctor';
          const isEditing = editingMessageId === msg.id;

          if (msg.deleted_at) {
            // Show deleted message
            return (
              <div
                key={msg.id}
                className={`border rounded-lg p-3 ${
                  isDoctor ? 'bg-cyan-50/50 border-cyan-200' : 'bg-blue-50/50 border-blue-200'
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${
                  isDoctor ? 'text-cyan-700' : 'text-blue-600'
                }`}>
                  {isDoctor ? 'You' : 'Patient'}:
                </p>
                <div className="bg-gray-100 border border-gray-300 rounded p-2 italic">
                  <p className="text-gray-500 text-sm">
                    Deleted by {msg.deleted_by}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(msg.deleted_at)}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`border rounded-lg p-3 ${
                isDoctor ? 'bg-cyan-50/80 border-cyan-200' : 'bg-blue-50/80 border-blue-200'
              }`}
            >
              <p className={`text-xs font-semibold mb-2 ${
                isDoctor ? 'text-cyan-700' : 'text-blue-600'
              }`}>
                {isDoctor ? 'You' : 'Patient'}:
              </p>

              {isEditing ? (
                <div>
                  <textarea
                    value={editMessageText}
                    onChange={(e) => setEditMessageText(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 bg-white text-gray-900 text-sm"
                    rows={2}
                    minLength={5}
                    required
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateMessage(msg.id)}
                      disabled={!editMessageText.trim() || editMessageText.length < 5 || isSubmittingMessage}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditMessageText('');
                      }}
                      className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm">{msg.message_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500 italic">
                        {formatDateTime(msg.created_at)}
                      </p>
                      {msg.updated_at && (
                        <p className="text-xs text-gray-400 italic">
                          • Edited {formatDateTime(msg.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  {isDoctor && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleEditMessage(msg)}
                        className={`hover:text-cyan-700 text-sm ${
                          isDoctor ? 'text-cyan-600' : 'text-blue-600'
                        }`}
                        title="Edit message"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id, feedbackId)}
                        disabled={isSubmittingMessage}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 text-sm"
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

            {/* New message form */}
            {replyingToFeedbackId === feedbackId ? (
              <div className="bg-white border border-cyan-200 rounded-lg p-3">
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="block w-full px-3 py-2 border border-cyan-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 bg-cyan-50 text-gray-900 text-sm"
                  rows={3}
                  minLength={5}
                  placeholder="Write your message..."
                  required
                />
                <p className="mt-1 text-xs text-cyan-500">
                  Minimum 5 characters required {newMessageText.length > 0 && `(${newMessageText.length}/5)`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitMessage(feedbackId)}
                    disabled={!newMessageText.trim() || newMessageText.length < 5 || isSubmittingMessage}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isSubmittingMessage ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        Send Message
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelReply}
                    disabled={isSubmittingMessage}
                    className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleStartReply(feedbackId)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors w-full justify-center"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 mb-8 border border-cyan-100">
          <h1 className="text-3xl font-bold mb-6 text-cyan-900 tracking-tight text-center">Patient Feedback & Replies</h1>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading feedbacks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10 mb-8 border border-cyan-100">
        <h1 className="text-3xl font-bold mb-6 text-cyan-900 tracking-tight text-center">Patient Feedback & Replies</h1>

        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No feedback yet. When patients leave feedback, it will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="p-4 sm:p-6 bg-cyan-50/40 rounded-xl my-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {feedback.patient_info.avatar ? (
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-cyan-200"
                        src={feedback.patient_info.avatar}
                        alt=""
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg border-2 border-cyan-100">
                        {feedback.patient_info.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900">{getPatientFullName(feedback.patient_info)}</h4>
                      <p className="text-xs text-gray-400">{formatDate(feedback.created_at)}</p>
                    </div>
                    <div className="flex items-center mt-1">{renderStars(feedback.rating)}</div>
                    <p className="mt-2 text-[15px] text-gray-700 font-medium">{feedback.comment}</p>
                    {feedback.updated_at && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Edited on {formatDateTime(feedback.updated_at)}
                      </p>
                    )}

                    {/* Conversation Thread */}
                    <div className="mt-4">
                      <div className="border-t border-cyan-100 pt-4">
                        <h4 className="text-sm font-semibold text-cyan-700 mb-3">Conversation</h4>
                        {renderMessageThread(feedback.id)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbacksPage;
