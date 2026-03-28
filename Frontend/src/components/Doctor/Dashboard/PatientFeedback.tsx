import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useFeedback } from '../../../context/FeedbackContext';
import { useDateTimeFormat } from '../../../context/DateTimeFormatContext';

const PatientFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { feedbacks } = useFeedback();
  const { formatDate } = useDateTimeFormat();

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Patient Feedback</h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-[350px] overflow-y-auto">
          {feedbacks && feedbacks.length > 0 ? (
            feedbacks.slice(0, 3).map((feedback) => (
          <div key={feedback.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {feedback.patient?.avatar ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={feedback.patient.avatar}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                    {feedback.patient?.name?.charAt(0) || 'P'}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{feedback.patient.name}</h4>
                  <p className="text-xs text-gray-500">{formatDate(feedback.date)}</p>
                </div>
                <div className="flex items-center mt-1">
                  {renderStars(feedback.rating)}
                </div>
                <p className="mt-2 text-sm text-gray-700">{feedback.comment}</p>
              </div>
            </div>
          </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No feedback yet</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            className="text-sm text-cyan-600 hover:text-cyan-900 font-medium"
            onClick={() => navigate('/doctor/feedbacks')}
          >
            View all feedback →
          </button>
        </div>
      </div>
    </>
  );
};

export default PatientFeedback;