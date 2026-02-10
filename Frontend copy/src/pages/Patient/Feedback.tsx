
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Star, Send, Edit2, X, Check, Reply, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Appointment } from '../../types/appointments';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface OutletContextType {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
}

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

const Feedback = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { patient } = useAuth();
  const { appointments, setAppointments } = useOutletContext<OutletContextType>();
  const [selectedAppointment, setSelectedAppointment] = useState('');

  // Auto-select appointment if navigated with state
  useEffect(() => {
    if (location.state && location.state.appointmentId) {
      setSelectedAppointment(location.state.appointmentId);
    }
  }, [location.state]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Show toast helper
  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Edit feedback state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Message threading state
  const [messages, setMessages] = useState<{ [feedbackId: string]: FeedbackMessage[] }>({});
  const [replyingToFeedbackId, setReplyingToFeedbackId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');

  // View replies toggle state - track which feedback has replies visible
  const [viewRepliesMap, setViewRepliesMap] = useState<{ [key: string]: boolean }>({});

  // Fetch patient's submitted feedbacks
  useEffect(() => {
    const fetchMyFeedbacks = async () => {
      if (!patient?.id) return;

      try {
        const response = await fetch(`http://localhost:8000/api/patients/${patient.id}/feedback/`);
        if (!response.ok) {
          console.error('[Feedback] Failed to fetch, status:', response.status);
          return;
        }
        const data = await response.json();
        console.log('[Feedback] My feedbacks:', data);
        setMyFeedbacks(data);

        // Fetch messages for each feedback (they're now included in the response)
        const messagesMap: { [feedbackId: string]: FeedbackMessage[] } = {};
        data.forEach((feedback: any) => {
          if (feedback.messages) {
            messagesMap[feedback.id] = feedback.messages;
          }
        });
        setMessages(messagesMap);
      } catch (error) {
        console.error('[Feedback] Failed to fetch my feedbacks:', error);
      }
    };

    fetchMyFeedbacks();
  }, [patient, submittedSuccessfully]);

  // Filter for completed and cancelled appointments that have not been reviewed
  const eligibleAppointments: Appointment[] = useMemo(() =>
    appointments.filter(
      (apt: Appointment) =>
        (apt.status === 'completed' || apt.status === 'cancelled') &&
        !apt.feedbackGiven
    ),
    [appointments]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !rating || !comment.trim()) return;

    setIsSubmitting(true);

    try {
      // Get the selected appointment to extract doctor ID
      const appointment = appointments.find(apt => apt.id === selectedAppointment);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const requestData = {
        appointment: selectedAppointment,
        patient: patient?.id,
        doctor: appointment.doctor.id,
        rating: rating,
        comment: comment.trim(),
      };

      console.log('Submitting feedback:', requestData);

      const response = await fetch('http://localhost:8000/api/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Backend error:', errorData);
          throw new Error(errorData.error || 'Failed to submit feedback');
        } else {
          const errorText = await response.text();
          console.error('Backend error (HTML):', errorText.substring(0, 500));
          throw new Error('Server error occurred. Please check the console for details.');
        }
      }

      const responseData = await response.json();
      console.log('Feedback submitted successfully:', responseData);

      // Update local appointments state to mark feedback as given
      setAppointments(appointments.map(apt =>
        apt.id === selectedAppointment
          ? { ...apt, feedbackGiven: true }
          : apt
      ));

      setSubmittedSuccessfully(true);

      // Reset form after 3 seconds (increased from 2)
      setTimeout(() => {
        setSelectedAppointment('');
        setRating(0);
        setComment('');
        setSubmittedSuccessfully(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (feedback: any) => {
    setEditingFeedbackId(feedback.id);
    setEditRating(feedback.rating);
    setEditComment(feedback.comment);
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setEditRating(0);
    setEditComment('');
    setEditHoverRating(0);
  };

  const handleUpdateFeedback = async (feedbackId: string) => {
    if (!editRating || !editComment.trim() || editComment.length < 10) {
      showToastNotification('Please provide a rating and a comment (minimum 10 characters)', 'error');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`http://localhost:8000/api/feedback/${feedbackId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim(),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update feedback');
      }

      const updatedFeedback = await response.json();

      // Update the feedback in the local state
      setMyFeedbacks(myFeedbacks.map(fb =>
        fb.id === feedbackId ? { ...fb, rating: updatedFeedback.rating, comment: updatedFeedback.comment, updated_at: updatedFeedback.updated_at } : fb
      ));

      // Reset edit mode
      handleCancelEdit();

      // Show success message
      showToastNotification('Feedback updated successfully!');
    } catch (error) {
      console.error('Failed to update feedback:', error);
      showToastNotification(error instanceof Error ? error.message : 'Failed to update feedback. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
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
      showToastNotification('Please provide a message (minimum 5 characters)', 'error');
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
          sender_type: 'patient',
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

      // Show success message
      showToastNotification('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
      showToastNotification(error instanceof Error ? error.message : 'Failed to send message. Please try again.', 'error');
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
      showToastNotification('Please provide a message (minimum 5 characters)', 'error');
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

      // Show success message
      showToastNotification('Message updated successfully!');
    } catch (error) {
      console.error('Failed to update message:', error);
      showToastNotification(error instanceof Error ? error.message : 'Failed to update message. Please try again.', 'error');
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
          deleted_by: 'patient',
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

      // Show success message
      showToastNotification('Message deleted successfully!');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showToastNotification(error instanceof Error ? error.message : 'Failed to delete message. Please try again.', 'error');
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const selectedAppointmentData = useMemo(() =>
    eligibleAppointments.find(apt => apt.id === selectedAppointment),
    [eligibleAppointments, selectedAppointment]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Remove seconds from time (HH:MM:SS -> HH:MM)
    return timeString.substring(0, 5);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (interactive = false) => {
    return Array(5).fill(0).map((_, i) => {
      const filled = interactive
        ? i < (hoverRating || rating)
        : i < rating;

      return (
        <Star
          key={i}
          className={`h-8 w-8 cursor-pointer transition-colors ${
            filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
          onClick={interactive ? () => setRating(i + 1) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(i + 1) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      );
    });
  };

  const renderEditStars = () => {
    return Array(5).fill(0).map((_, i) => {
      const filled = i < (editHoverRating || editRating);

      return (
        <Star
          key={i}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
          onClick={() => setEditRating(i + 1)}
          onMouseEnter={() => setEditHoverRating(i + 1)}
          onMouseLeave={() => setEditHoverRating(0)}
        />
      );
    });
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
          className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Reply className="h-4 w-4" />
          Reply
        </button>
      );
    }

    // If no messages but currently replying, show the reply form
    if (!hasMessages && replyingToFeedbackId === feedbackId) {
      return (
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <textarea
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            className="block w-full px-3 py-2 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-purple-50 text-gray-900 text-sm"
            rows={3}
            minLength={5}
            placeholder="Write your message..."
            required
          />
          <p className="mt-1 text-xs text-purple-500">
            Minimum 5 characters required {newMessageText.length > 0 && `(${newMessageText.length}/5)`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleSubmitMessage(feedbackId)}
              disabled={!newMessageText.trim() || newMessageText.length < 5 || isSubmittingMessage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          const isPatient = msg.sender_type === 'patient';
          const isEditing = editingMessageId === msg.id;

          if (msg.deleted_at) {
            // Show deleted message
            return (
              <div
                key={msg.id}
                className={`border rounded-lg p-3 ${
                  isPatient ? 'bg-purple-50/50 border-purple-200' : 'bg-blue-50/50 border-blue-200'
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${
                  isPatient ? 'text-purple-700' : 'text-blue-600'
                }`}>
                  {isPatient ? 'You' : 'Doctor'}:
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
                isPatient ? 'bg-purple-50/80 border-purple-200' : 'bg-blue-50/80 border-blue-200'
              }`}
            >
              <p className={`text-xs font-semibold mb-2 ${
                isPatient ? 'text-purple-700' : 'text-blue-600'
              }`}>
                {isPatient ? 'You' : 'Doctor'}:
              </p>

              {isEditing ? (
                <div>
                  <textarea
                    value={editMessageText}
                    onChange={(e) => setEditMessageText(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white text-gray-900 text-sm"
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
                  {isPatient && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => handleEditMessage(msg)}
                        className={`hover:text-purple-700 text-sm ${
                          isPatient ? 'text-purple-600' : 'text-blue-600'
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
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="block w-full px-3 py-2 border border-purple-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-purple-50 text-gray-900 text-sm"
                  rows={3}
                  minLength={5}
                  placeholder="Write your message..."
                  required
                />
                <p className="mt-1 text-xs text-purple-500">
                  Minimum 5 characters required {newMessageText.length > 0 && `(${newMessageText.length}/5)`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitMessage(feedbackId)}
                    disabled={!newMessageText.trim() || newMessageText.length < 5 || isSubmittingMessage}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors w-full justify-center"
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

  return (
    <div>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
          {toastType === 'success' ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-cyan-700 mb-1 tracking-tight">{t('feedback.title')}</h1>
        <p className="text-gray-500 text-lg">{t('feedback.subtitle')}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Guidelines at the top */}
        <div className="mb-2 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-cyan-800 mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full"></span>
            {t('feedback.guidelines')}
          </h3>
          <ul className="text-sm text-cyan-900 space-y-1 pl-4 list-disc">
            <li>{t('feedback.guideline1')}</li>
            <li>{t('feedback.guideline2')}</li>
            <li>{t('feedback.guideline3')}</li>
            <li>{t('feedback.guideline4')}</li>
          </ul>
        </div>

        {submittedSuccessfully && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-medium">Feedback submitted successfully!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Appointment Selection */}
            <div>
              <label htmlFor="appointment" className="block text-base font-semibold text-cyan-700 mb-2">
                {t('feedback.selectAppointment')} <span className="text-red-500">*</span>
              </label>
              <select
                id="appointment"
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                className="block w-full px-4 py-3 border border-cyan-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 bg-cyan-50 text-cyan-900 text-base"
                required
              >
                <option value="">{t('feedback.chooseAppointment')}</option>
                {eligibleAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.doctor.name} - {formatDate(appointment.date)} at {formatTime(appointment.time)} [{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Appointment Details */}
            {selectedAppointmentData && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 mb-2 flex items-center gap-4">
                {selectedAppointmentData.doctor.avatar ? (
                  <img
                    className="h-14 w-14 rounded-full object-cover border-2 border-cyan-200"
                    src={selectedAppointmentData.doctor.avatar}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                    {selectedAppointmentData.doctor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-cyan-800">
                    {selectedAppointmentData.doctor.name}
                  </h3>
                  <p className="text-sm text-cyan-700">
                    {selectedAppointmentData.doctor.specialty}
                  </p>
                  <p className="text-xs text-cyan-500">
                    {formatDate(selectedAppointmentData.date)} at {formatTime(selectedAppointmentData.time)}
                  </p>
                </div>
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-base font-semibold text-cyan-700 mb-2">
                {t('feedback.overallRating')} <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center space-x-1 ${!selectedAppointment ? 'opacity-50 pointer-events-none' : ''}`}>
                {renderStars(!!selectedAppointment)}
              </div>
              {rating > 0 && selectedAppointment && (
                <p className="mt-2 text-sm text-cyan-600 font-medium">
                  {rating === 1 && t('feedback.ratingPoor')}
                  {rating === 2 && t('feedback.ratingFair')}
                  {rating === 3 && t('feedback.ratingGood')}
                  {rating === 4 && t('feedback.ratingVeryGood')}
                  {rating === 5 && t('feedback.ratingExcellent')}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-base font-semibold text-cyan-700 mb-2">
                {t('feedback.yourReview')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`block w-full px-4 py-3 border border-cyan-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-cyan-900 text-base ${!selectedAppointment ? 'bg-gray-100 cursor-not-allowed' : 'bg-cyan-50'}`}
                placeholder={selectedAppointment ? "Share your experience with the doctor..." : "Please select an appointment first"}
                disabled={!selectedAppointment}
                required
                minLength={10}
              />
              <p className="mt-2 text-sm text-cyan-500">
                Minimum 10 characters required {comment.length > 0 && `(${comment.length}/10)`}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={!selectedAppointment || !rating || !comment.trim() || comment.length < 10 || isSubmitting}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold text-base shadow-md transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* My Submitted Feedbacks Section */}
        {myFeedbacks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-cyan-700 mb-6">My Submitted Feedbacks</h2>
            <div className="space-y-6">
              {myFeedbacks.map((feedback) => {
                const isEditing = editingFeedbackId === feedback.id;

                return (
                  <div key={feedback.id} className="border border-cyan-100 rounded-xl p-6 bg-cyan-50/30">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-cyan-900">{feedback.doctor_info?.name || 'Doctor'}</h3>
                        <p className="text-sm text-gray-600">{feedback.doctor_info?.specialty || ''}</p>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleEditClick(feedback)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Edit Mode */}
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Rating:</p>
                          <div className="flex items-center gap-1">
                            {renderEditStars()}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Your Review:</p>
                          <textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            className="block w-full px-4 py-3 border border-cyan-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 bg-white text-cyan-900 text-base"
                            rows={4}
                            minLength={10}
                            required
                          />
                          <p className="mt-1 text-sm text-cyan-500">
                            Minimum 10 characters required {editComment.length > 0 && `(${editComment.length}/10)`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleUpdateFeedback(feedback.id)}
                            disabled={!editRating || !editComment.trim() || editComment.length < 10 || isUpdating}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                          >
                            {isUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-700 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* View Mode */}
                        <div className="mb-4">
                          <div className="flex items-center gap-1 mb-3">
                            {Array(5).fill(0).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Review:</p>
                          <p className="text-gray-800">{feedback.comment}</p>
                          {feedback.updated_at && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              Edited on {formatDateTime(feedback.updated_at)}
                            </p>
                          )}
                        </div>

                        {/* Conversation Thread */}
                        <div className="mt-4">
                          <div className="border-t border-cyan-100 pt-4">
                            <h4 className="text-sm font-semibold text-cyan-700 mb-3">Conversation</h4>
                            {renderMessageThread(feedback.id)}
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                          Submitted on {new Date(feedback.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
