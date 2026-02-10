import React, { createContext, useContext, useState } from 'react';

export interface FeedbackItem {
  id: string;
  patient: { name: string; avatar?: string };
  rating: number;
  date: string;
  comment: string;
  doctor_reply?: string;
}

interface FeedbackContextType {
  feedbacks: FeedbackItem[];
  setFeedbacks: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  replies: { [key: string]: { text: string; editing: boolean } };
  setReplies: React.Dispatch<React.SetStateAction<{ [key: string]: { text: string; editing: boolean } }>>;
  inputValues: { [key: string]: string };
  setInputValues: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode; initial?: FeedbackItem[] }> = ({ children, initial = [] }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initial);
  const [replies, setReplies] = useState<{ [key: string]: { text: string; editing: boolean } }>({});
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  return (
    <FeedbackContext.Provider value={{ feedbacks, setFeedbacks, replies, setReplies, inputValues, setInputValues }}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within a FeedbackProvider');
  return context;
};