"""
ML Specialist Prediction Service
Calls the Flask ML API to predict specialist based on symptoms
"""
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


ML_API_URL = "http://127.0.0.1:5174/predict"


@api_view(['POST'])
def predict_specialist(request):
    """
    Predict specialist based on symptoms

    Request body:
    {
        "symptoms": ["chills", "vomiting", "high_fever", "abdominal_pain"]
    }

    Response:
    {
        "predicted_specialist": "Gastroenterologist",
        "recognized_symptoms": ["chills", "vomiting", "high_fever", "abdominal_pain"],
        "unrecognized_symptoms": []
    }
    """
    symptoms = request.data.get('symptoms', [])

    if not symptoms or not isinstance(symptoms, list):
        return Response({
            'error': 'Please provide a list of symptoms'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Call the ML Flask API
        response = requests.post(
            ML_API_URL,
            json={'symptoms': symptoms},
            timeout=30
        )

        if response.status_code == 200:
            ml_response = response.json()
            predicted_specialist = ml_response.get('predicted_specialist')

            # Fetch and rank doctors by the predicted specialty
            ranked_doctors = []
            if predicted_specialist:
                try:
                    from api.models import Doctor
                    from api.serializers import DoctorSerializer
                    from api.ranking_service import DoctorRankingService

                    # Get doctors matching the predicted specialty
                    doctors = Doctor.objects.filter(
                        specialty__iexact=predicted_specialist,
                        approval_status='approved',
                        is_blocked=False
                    )

                    # Calculate ranking scores
                    doctor_scores = []
                    for doctor in doctors:
                        score = DoctorRankingService.calculate_score(
                            doctor=doctor,
                            predicted_specialty=predicted_specialist
                        )
                        doctor_scores.append((doctor, score))

                    # Sort by ranking score (highest first) - return all doctors
                    doctor_scores.sort(key=lambda x: x[1], reverse=True)
                    all_ranked_doctors = [doctor for doctor, score in doctor_scores]

                    # Serialize doctors
                    serializer = DoctorSerializer(
                        all_ranked_doctors,
                        many=True,
                        context={'request': request, 'predicted_specialty': predicted_specialist}
                    )
                    ranked_doctors = serializer.data

                except Exception as e:
                    print(f"[ML Predict] Error fetching ranked doctors: {e}")
                    # Continue even if doctor ranking fails

            # Add ranked doctors to response
            ml_response['ranked_doctors'] = ranked_doctors
            ml_response['total_doctors_found'] = len(ranked_doctors)

            return Response(ml_response, status=status.HTTP_200_OK)
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {'error': 'ML API error'}
            return Response(error_data, status=response.status_code)

    except requests.exceptions.ConnectionError:
        return Response({
            'error': 'ML prediction service is not available. Please ensure the ML Flask server is running on port 5174.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    except requests.exceptions.Timeout:
        return Response({
            'error': 'ML prediction service timed out'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)

    except Exception as e:
        return Response({
            'error': f'Failed to get prediction: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
