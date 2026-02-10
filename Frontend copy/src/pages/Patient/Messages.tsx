import React, { useState, useEffect, useRef } from "react";
import { Search, Paperclip, Send, Download } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

interface Conversation {
  id: string;
  name: string;
  specialty?: string;
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

interface Props {
  initialOpenConversationId?: string | null;
}

const Messages = ({ initialOpenConversationId }: Props = {}) => {
  const { t } = useLanguage();
  const { patient } = useAuth();
  const location = useLocation();
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

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  // Auto-select conversation if doctor info is passed via navigation state
  useEffect(() => {
    if (location.state?.doctorId && !loading) {
      console.log(
        "[DEBUG] Looking for doctor with ID:",
        location.state.doctorId
      );
      console.log(
        "[DEBUG] Available conversations:",
        conversations.map((c) => ({ id: c.id, name: c.name }))
      );

      const targetDoctor = conversations.find(
        (conv) =>
          conv.id === location.state.doctorId ||
          conv.id === String(location.state.doctorId) ||
          String(conv.id) === String(location.state.doctorId)
      );

      console.log("[DEBUG] Found conversation:", targetDoctor);

      if (targetDoctor) {
        setSelectedConversation(targetDoctor);
        fetchMessages(targetDoctor.id, targetDoctor.user_type, true);
      } else {
        console.log(
          "[DEBUG] Doctor not found in conversations list, creating new conversation entry"
        );
        const newConversation: Conversation = {
          id: String(location.state.doctorId),
          name: location.state.doctorName || "Doctor",
          specialty: undefined,
          avatar: undefined,
          user_type: "doctor",
          last_message: "Start a conversation",
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        };
        setSelectedConversation(newConversation);
        setMessages([]);
      }
    } else if (location.state?.doctorName && conversations.length > 0) {
      const targetDoctor = conversations.find(
        (conv) =>
          conv.name.toLowerCase() === location.state.doctorName.toLowerCase()
      );
      if (targetDoctor) {
        setSelectedConversation(targetDoctor);
        fetchMessages(targetDoctor.id, targetDoctor.user_type, true);
      }
    }
  }, [location.state, conversations, loading]);

  // Helper function to compare arrays deeply
  const areArraysEqual = (arr1: any[], arr2: any[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  };

  // Fetch conversations with change detection
  const fetchConversations = async (isInitial = false) => {
    if (!patient?.id) {
      if (isInitial) setLoading(false);
      return;
    }

    if (isInitial) setLoading(true);

    try {
      const messagesResponse = await fetch(
        `http://localhost:8000/api/messages/conversations/?user_type=patient&user_id=${patient.id}`
      );

      const appointmentsResponse = await fetch(
        `http://localhost:8000/api/patients/${patient.id}/appointments/`
      );

      let messageConversations: Conversation[] = [];
      let appointmentDoctors: Conversation[] = [];

      if (messagesResponse.ok) {
        messageConversations = await messagesResponse.json();
      }

      if (appointmentsResponse.ok) {
        const appointments = await appointmentsResponse.json();
        const doctorMap = new Map<string, Conversation>();

        appointments.forEach((apt: any) => {
          if (apt.doctor_info && apt.doctor_info.id) {
            const doctorId = apt.doctor_info.id;
            if (!doctorMap.has(doctorId)) {
              doctorMap.set(doctorId, {
                id: doctorId,
                name: apt.doctor_info.name || "Unknown Doctor",
                specialty: apt.doctor_info.specialty,
                avatar: apt.doctor_info.avatar,
                user_type: "doctor",
                last_message: "Start a conversation",
                last_message_time: new Date().toISOString(),
                unread_count: 0,
              });
            }
          }
        });

        appointmentDoctors = Array.from(doctorMap.values());
      }

      const conversationMap = new Map<string, Conversation>();

      appointmentDoctors.forEach((doc) => {
        conversationMap.set(doc.id, doc);
      });

      messageConversations.forEach((conv) => {
        conversationMap.set(conv.id, conv);
      });

      const mergedConversations = Array.from(conversationMap.values());

      mergedConversations.sort((a, b) => {
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        return (
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
        );
      });

      // Only update if conversations actually changed
      setConversations((prevConversations) => {
        if (!areArraysEqual(prevConversations, mergedConversations)) {
          return mergedConversations;
        }
        return prevConversations;
      });
    } catch (error) {
      console.error("[PatientMessages] Failed to fetch conversations:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Fetch messages with change detection
  const fetchMessages = async (
    partnerId: string,
    partnerType: string,
    isInitial = false
  ) => {
    if (!patient?.id) return;

    if (isInitial) setLoadingMessages(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/messages/with_user/?user_type=patient&user_id=${patient.id}&partner_type=${partnerType}&partner_id=${partnerId}`
      );
      if (response.ok) {
        const data = await response.json();

        // Only update if messages actually changed
        setMessages((prevMessages) => {
          if (!areArraysEqual(prevMessages, data)) {
            return data;
          }
          return prevMessages;
        });

        // Mark conversation as read (only on initial load)
        if (isInitial) {
          await fetch(
            "http://localhost:8000/api/messages/mark_conversation_read/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_type: "patient",
                user_id: patient.id,
                partner_type: partnerType,
                partner_id: partnerId,
              }),
            }
          );

          // Refresh conversations to update unread count
          fetchConversations(false);
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
  }, [patient?.id]);

  // Setup polling for conversations (every 10 seconds)
  useEffect(() => {
    if (!patient?.id) return;

    if (conversationPollingRef.current) {
      clearInterval(conversationPollingRef.current);
    }

    conversationPollingRef.current = setInterval(() => {
      fetchConversations(false);
    }, 10000);

    return () => {
      if (conversationPollingRef.current) {
        clearInterval(conversationPollingRef.current);
      }
    };
  }, [patient?.id]);

  // Setup polling for messages (every 5 seconds when conversation is selected)
  useEffect(() => {
    if (!selectedConversation || !patient?.id) {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
        messagePollingRef.current = null;
      }
      return;
    }

    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
    }

    messagePollingRef.current = setInterval(() => {
      fetchMessages(
        selectedConversation.id,
        selectedConversation.user_type,
        false
      );
    }, 5000);

    return () => {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, [selectedConversation, patient?.id]);

  // Handle initial conversation open
  useEffect(() => {
    if (initialOpenConversationId && conversations.length > 0) {
      const convo = conversations.find(
        (c) => c.id === initialOpenConversationId
      );
      if (convo) {
        handleConversationSelect(convo);
      }
    }
  }, [initialOpenConversationId, conversations]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id, conversation.user_type, true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !patient?.id) return;

    setSendingMessage(true);

    try {
      const response = await fetch("http://localhost:8000/api/messages/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_type: "patient",
          sender_id: patient.id,
          receiver_type: selectedConversation.user_type,
          receiver_id: selectedConversation.id,
          text: messageText,
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        fetchConversations(false);
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
    if (!file || !selectedConversation || !patient?.id) return;

    setSendingMessage(true);

    try {
      const formData = new FormData();
      formData.append("sender_type", "patient");
      formData.append("sender_id", patient.id);
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
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(
    (convo) =>
      convo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (convo.specialty &&
        convo.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <h1 className="text-2xl font-bold text-gray-900">
          {t("messages.title")}
        </h1>
        <p className="text-gray-600">{t("messages.subtitle")}</p>
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
                  placeholder={t("messages.searchDoctors")}
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
                          {conversation.specialty && (
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.specialty}
                            </p>
                          )}
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
                  {t("messages.noDoctorsFound")}
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
                      {selectedConversation.specialty && (
                        <p className="text-xs text-gray-500">
                          {selectedConversation.specialty}
                        </p>
                      )}
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
                      const isPatient = message.sender_type === "patient";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isPatient ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isPatient
                                ? "bg-cyan-500 text-white"
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
                                    className={`flex items-center space-x-2 text-sm ${
                                      isPatient ? "text-white" : "text-cyan-600"
                                    } hover:underline`}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    <span>{message.attachment_name}</span>
                                    <Download className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                isPatient ? "text-cyan-100" : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-8">
                      {t("messages.noMessages")}
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
                        id="file-upload-message"
                        className="hidden"
                        onChange={handleAttachment}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <label
                        htmlFor="file-upload-message"
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
                        placeholder={t("messages.typeMessage")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                        rows={1}
                        disabled={sendingMessage}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className="flex items-center justify-center w-10 h-10 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                {conversations.length > 0
                  ? t("messages.selectDoctor")
                  : "No conversations yet. Start by booking an appointment with a doctor."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
