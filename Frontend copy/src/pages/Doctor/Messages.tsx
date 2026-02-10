import React, { useState, useEffect, useRef } from "react";
import { Search, Paperclip, Send, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useDateTimeFormat } from "../../context/DateTimeFormatContext";

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  user_type: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_type: string;
  sender_id: string;
  receiver_type: string;
  receiver_id: string;
  text?: string;
  attachment?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  is_read: boolean;
  created_at: string;
  sender_info?: any;
  receiver_info?: any;
}

const Messages = () => {
  const { doctor } = useAuth();
  const location = useLocation();
  const { formatTime: formatTimeContext, formatDate } = useDateTimeFormat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationPollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-select conversation if patient info is passed via navigation state
  useEffect(() => {
    if (location.state?.patientId && !loading) {
      console.log(
        "[DEBUG] Looking for patient with ID:",
        location.state.patientId
      );
      console.log(
        "[DEBUG] Available conversations:",
        conversations.map((c) => ({ id: c.id, name: c.name }))
      );

      // Match by patient ID (more reliable than name) - try both string and number comparison
      const targetPatient = conversations.find(
        (conv) =>
          conv.id === location.state.patientId ||
          conv.id === String(location.state.patientId) ||
          String(conv.id) === String(location.state.patientId)
      );

      console.log("[DEBUG] Found conversation:", targetPatient);

      if (targetPatient) {
        // Patient found in existing conversations - select and load messages
        setSelectedConversation(targetPatient);
        fetchMessages(targetPatient.id, targetPatient.user_type);
      } else {
        // Patient not found - create new conversation entry (no prior messages)
        console.log(
          "[DEBUG] Patient not found in conversations list, creating new conversation entry"
        );
        const newConversation: Conversation = {
          id: String(location.state.patientId),
          name: location.state.patientName || "Patient",
          avatar: undefined,
          user_type: "patient",
          last_message: "Start a conversation",
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        };
        setSelectedConversation(newConversation);
        setMessages([]); // No messages yet for this new conversation
      }
    } else if (location.state?.patientName && conversations.length > 0) {
      // Fallback to name matching if ID not provided
      const targetPatient = conversations.find(
        (conv) =>
          conv.name.toLowerCase() === location.state.patientName.toLowerCase()
      );
      if (targetPatient) {
        setSelectedConversation(targetPatient);
        fetchMessages(targetPatient.id, targetPatient.user_type);
      }
    }
  }, [location.state, conversations, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations (silent update - no loading state)
  const fetchConversations = async (isInitial = false) => {
    if (!doctor?.id) return;

    if (isInitial) setLoading(true);

    try {
      // Fetch existing message conversations
      const messagesResponse = await fetch(
        `http://localhost:8000/api/messages/conversations/?user_type=doctor&user_id=${doctor.id}`
      );

      // Fetch all appointments to get patients
      const appointmentsResponse = await fetch(
        `http://localhost:8000/api/doctors/${doctor.id}/appointments/`
      );

      let messageConversations: Conversation[] = [];
      let appointmentPatients: Conversation[] = [];

      if (messagesResponse.ok) {
        messageConversations = await messagesResponse.json();
      }

      if (appointmentsResponse.ok) {
        const appointments = await appointmentsResponse.json();

        // Extract unique patients from all appointments (completed, cancelled, upcoming)
        const patientMap = new Map<string, Conversation>();

        appointments.forEach((apt: any) => {
          if (apt.patient_info && apt.patient_info.id) {
            const patientId = String(apt.patient_info.id);
            if (!patientMap.has(patientId)) {
              patientMap.set(patientId, {
                id: patientId,
                name: apt.patient_info.name || "Unknown Patient",
                avatar: apt.patient_info.avatar,
                user_type: "patient",
                last_message: "Start a conversation",
                last_message_time: new Date().toISOString(),
                unread_count: 0,
              });
            }
          }
        });

        appointmentPatients = Array.from(patientMap.values());
      }

      // Merge conversations: prioritize those with messages
      const conversationMap = new Map<string, Conversation>();

      // Add appointment patients first
      appointmentPatients.forEach((pat) => {
        conversationMap.set(pat.id, pat);
      });

      // Override with message conversations (they have actual last messages and unread counts)
      messageConversations.forEach((conv) => {
        conversationMap.set(conv.id, conv);
      });

      const mergedConversations = Array.from(conversationMap.values());

      // Sort by: unread count desc, then by last message time
      mergedConversations.sort((a, b) => {
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        return (
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
        );
      });

      setConversations(mergedConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Fetch messages for selected conversation (silent update for polling)
  const fetchMessages = async (
    partnerId: string,
    partnerType: string,
    isInitial = false
  ) => {
    if (!doctor?.id) return;

    if (isInitial) setLoadingMessages(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/with_user/?user_type=doctor&user_id=${doctor.id}&partner_type=${partnerType}&partner_id=${partnerId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // Mark conversation as read (only on initial load)
        if (isInitial) {
          await fetch(
            "http://localhost:8000/api/messages/mark_conversation_read/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_type: "doctor",
                user_id: doctor.id,
                partner_type: partnerType,
                partner_id: partnerId,
              }),
            }
          );

          // Refresh conversations to update unread count
          fetchConversations();
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations(true);
  }, [doctor]);

  // Setup polling for conversations (every 10 seconds)
  useEffect(() => {
    if (!doctor?.id) return;

    // Clear existing interval
    if (conversationPollingRef.current) {
      clearInterval(conversationPollingRef.current);
    }

    // Start new polling interval
    conversationPollingRef.current = setInterval(() => {
      fetchConversations(false); // Silent update
    }, 10000);

    return () => {
      if (conversationPollingRef.current) {
        clearInterval(conversationPollingRef.current);
      }
    };
  }, [doctor]);

  // Setup polling for messages (every 5 seconds when conversation is selected)
  useEffect(() => {
    if (!selectedConversation || !doctor?.id) {
      // Clear message polling if no conversation selected
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
        messagePollingRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
    }

    // Start new polling interval for messages
    messagePollingRef.current = setInterval(() => {
      fetchMessages(
        selectedConversation.id,
        selectedConversation.user_type,
        false
      ); // Silent update
    }, 5000);

    return () => {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, [selectedConversation, doctor]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id, conversation.user_type, true); // Initial load with loading state
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !doctor?.id) return;

    setSendingMessage(true);
    try {
      const response = await fetch("http://localhost:8000/api/messages/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_type: "doctor",
          sender_id: doctor.id,
          receiver_type: selectedConversation.user_type,
          receiver_id: selectedConversation.id,
          text: messageText,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        fetchConversations(false); // Update last message in conversations
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !doctor?.id) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append("sender_type", "doctor");
      formData.append("sender_id", doctor.id);
      formData.append("receiver_type", selectedConversation.user_type);
      formData.append("receiver_id", selectedConversation.id);
      formData.append("attachment", file);
      if (messageText.trim()) {
        formData.append("text", messageText);
      }

      const response = await fetch("http://localhost:8000/api/messages/send/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        fetchConversations(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Failed to send attachment:", error);
      alert("Failed to send attachment. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return formatTimeContext(timeStr);
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    // For dates older than 7 days, use the configured date format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;
    return formatDate(isoDate);
  };

  const filteredConversations = conversations.filter((convo) =>
    convo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with your patients</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex h-[600px]">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
                  const isSelected =
                    selectedConversation?.id === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected
                          ? "bg-cyan-50 border-l-4 border-l-cyan-500"
                          : ""
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 flex-shrink-0 relative">
                          {conversation.avatar ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={conversation.avatar}
                              alt=""
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium text-lg">
                              {conversation.name.charAt(0)}
                            </div>
                          )}
                          {conversation.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatLastMessageTime(
                                conversation.last_message_time
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No conversations found
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 flex-shrink-0">
                      {selectedConversation.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={selectedConversation.avatar}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-medium">
                          {selectedConversation.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {selectedConversation.name}
                      </h3>
                      <p className="text-xs text-gray-500">Patient</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      Loading messages...
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      const isDoctor = message.sender_type === "doctor";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isDoctor ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isDoctor
                                ? "bg-cyan-600 text-white"
                                : "bg-white text-gray-800 border border-gray-200"
                            }`}
                          >
                            {message.text && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.text}
                              </p>
                            )}
                            {message.attachment_url && (
                              <div className="mt-2">
                                {message.attachment_type?.startsWith(
                                  "image/"
                                ) ? (
                                  <img
                                    src={message.attachment_url}
                                    alt={message.attachment_name}
                                    className="max-w-full h-auto rounded cursor-pointer"
                                    onClick={() =>
                                      window.open(
                                        message.attachment_url,
                                        "_blank"
                                      )
                                    }
                                  />
                                ) : (
                                  <a
                                    href={message.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center space-x-2 text-sm ${isDoctor ? "text-white" : "text-cyan-600"} hover:underline`}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    <span>{message.attachment_name}</span>
                                    <Download className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                            <p
                              className={`text-xs mt-1 ${isDoctor ? "text-cyan-100" : "text-gray-500"}`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No messages yet
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end space-x-2">
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-upload-doctor-message"
                        className="hidden"
                        onChange={handleAttachment}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="file-upload-doctor-message"
                        className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                      </label>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                        rows={1}
                        disabled={sendingMessage}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className="flex items-center justify-center w-10 h-10 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                {conversations.length > 0
                  ? "Select a conversation to start messaging"
                  : "No conversations yet. Patients will appear here after appointments."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
