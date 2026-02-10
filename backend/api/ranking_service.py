"""
Doctor Ranking Service
Modular service for calculating doctor rankings based on multiple factors
Supports current metrics and future sentiment analysis integration
"""
from django.db.models import Avg, Count


class DoctorRankingService:
    """
    Service for calculating composite ranking scores for doctors

    Scoring System (Phase 1):
    - Rating: 40% (average feedback rating)
    - Experience: 30% (years of practice)
    - Feedback Count: 20% (number of reviews for credibility)
    - Sentiment: 0% (reserved for Phase 3)
    - Specialty Match: 10% (bonus if matches ML prediction)

    Future (Phase 3):
    - Sentiment will be weighted at 15-20%
    - Weights will be adjustable dynamically
    """

    # Default weights for scoring (Phase 1)
    DEFAULT_WEIGHTS = {
        'rating': 0.40,          # 40% - Patient satisfaction
        'experience': 0.30,      # 30% - Years of experience
        'feedback_count': 0.20,  # 20% - Review credibility
        'sentiment': 0.00,       # 0% - Reserved for Phase 3
        'specialty_match': 0.10, # 10% - Matches predicted specialty
    }

    # Future weights (Phase 3)
    FUTURE_WEIGHTS = {
        'rating': 0.30,          # 30% - Reduced as sentiment adds context
        'experience': 0.25,      # 25% - Still important
        'feedback_count': 0.15,  # 15% - Less weight with sentiment
        'sentiment': 0.20,       # 20% - NEW: Comment sentiment analysis
        'specialty_match': 0.10, # 10% - Unchanged
    }

    @classmethod
    def calculate_score(cls, doctor, predicted_specialty=None, weights=None, include_sentiment=False):
        """
        Calculate composite ranking score for a doctor

        Args:
            doctor: Doctor model instance
            predicted_specialty: Specialty predicted by ML (for bonus)
            weights: Custom weight dictionary (optional)
            include_sentiment: Whether to include sentiment analysis (Phase 3)

        Returns:
            float: Composite score (0-100)
        """
        if weights is None:
            weights = cls.FUTURE_WEIGHTS if include_sentiment else cls.DEFAULT_WEIGHTS

        # Calculate individual component scores
        rating_score = cls._calculate_rating_score(doctor)
        experience_score = cls._calculate_experience_score(doctor)
        feedback_score = cls._calculate_feedback_count_score(doctor)
        sentiment_score = cls._calculate_sentiment_score(doctor) if include_sentiment else 0
        specialty_score = cls._calculate_specialty_match_score(doctor, predicted_specialty)

        # Weight and combine scores
        total_score = (
            rating_score * weights['rating'] +
            experience_score * weights['experience'] +
            feedback_score * weights['feedback_count'] +
            sentiment_score * weights['sentiment'] +
            specialty_score * weights['specialty_match']
        )

        return round(total_score, 2)

    @staticmethod
    def _calculate_rating_score(doctor):
        """
        Calculate score based on average rating

        Returns:
            float: Score 0-100 based on average rating
        """
        from api.models import Feedback

        feedback_stats = Feedback.objects.filter(doctor=doctor).aggregate(
            avg_rating=Avg('rating')
        )

        avg_rating = feedback_stats['avg_rating']

        if avg_rating is None:
            # No ratings yet - neutral score
            return 50.0

        # Convert rating (typically 1-5 scale) to 0-100 scale
        # Assuming 5-star rating system
        return (avg_rating / 5.0) * 100

    @staticmethod
    def _calculate_experience_score(doctor):
        """
        Calculate score based on years of experience

        Returns:
            float: Score 0-100 based on experience (capped at 20 years = 100)
        """
        years = doctor.years_of_experience or 0

        # Cap at 20 years for 100 score
        # Linear scale: 0 years = 0, 20+ years = 100
        score = min((years / 20.0) * 100, 100)

        return score

    @staticmethod
    def _calculate_feedback_count_score(doctor):
        """
        Calculate score based on number of feedback/reviews
        More reviews = more credibility

        Returns:
            float: Score 0-100 based on feedback count (capped at 50 reviews = 100)
        """
        from api.models import Feedback

        feedback_count = Feedback.objects.filter(doctor=doctor).count()

        # Cap at 50 reviews for 100 score
        # Linear scale: 0 reviews = 0, 50+ reviews = 100
        score = min((feedback_count / 50.0) * 100, 100)

        return score

    @staticmethod
    def _calculate_sentiment_score(doctor):
        """
        Calculate score based on sentiment analysis of feedback comments

        Phase 1: Returns doctor.sentiment_score (default 0)
        Phase 3: Will analyze recent feedback comments for sentiment

        Returns:
            float: Score 0-100 based on sentiment (0=negative, 50=neutral, 100=positive)
        """
        # Phase 1: Use stored sentiment_score (default 0 = neutral)
        # Phase 3: This will be calculated from FeedbackSentiment model
        sentiment = doctor.sentiment_score or 0.0

        # Ensure score is in 0-100 range
        return max(0, min(sentiment, 100))

    @staticmethod
    def _calculate_specialty_match_score(doctor, predicted_specialty):
        """
        Calculate bonus score if doctor's specialty matches ML prediction

        Returns:
            float: 100 if match, 0 if no match or no prediction
        """
        if predicted_specialty is None:
            return 0.0

        # Case-insensitive comparison
        if doctor.specialty.lower() == predicted_specialty.lower():
            return 100.0

        return 0.0

    @classmethod
    def get_detailed_scores(cls, doctor, predicted_specialty=None, include_sentiment=False):
        """
        Get detailed breakdown of scoring components

        Useful for debugging and admin dashboard

        Returns:
            dict: Breakdown of all scoring components
        """
        weights = cls.FUTURE_WEIGHTS if include_sentiment else cls.DEFAULT_WEIGHTS

        rating_score = cls._calculate_rating_score(doctor)
        experience_score = cls._calculate_experience_score(doctor)
        feedback_score = cls._calculate_feedback_count_score(doctor)
        sentiment_score = cls._calculate_sentiment_score(doctor) if include_sentiment else 0
        specialty_score = cls._calculate_specialty_match_score(doctor, predicted_specialty)

        total_score = (
            rating_score * weights['rating'] +
            experience_score * weights['experience'] +
            feedback_score * weights['feedback_count'] +
            sentiment_score * weights['sentiment'] +
            specialty_score * weights['specialty_match']
        )

        return {
            'total_score': round(total_score, 2),
            'components': {
                'rating': {
                    'raw_score': round(rating_score, 2),
                    'weight': weights['rating'],
                    'weighted_score': round(rating_score * weights['rating'], 2)
                },
                'experience': {
                    'raw_score': round(experience_score, 2),
                    'weight': weights['experience'],
                    'weighted_score': round(experience_score * weights['experience'], 2)
                },
                'feedback_count': {
                    'raw_score': round(feedback_score, 2),
                    'weight': weights['feedback_count'],
                    'weighted_score': round(feedback_score * weights['feedback_count'], 2)
                },
                'sentiment': {
                    'raw_score': round(sentiment_score, 2),
                    'weight': weights['sentiment'],
                    'weighted_score': round(sentiment_score * weights['sentiment'], 2)
                },
                'specialty_match': {
                    'raw_score': round(specialty_score, 2),
                    'weight': weights['specialty_match'],
                    'weighted_score': round(specialty_score * weights['specialty_match'], 2)
                }
            },
            'weights_used': 'future' if include_sentiment else 'default'
        }
