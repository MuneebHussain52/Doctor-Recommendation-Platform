import React, { useState } from 'react';
import { Search, Loader, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const Symptoms = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [symptomText, setSymptomText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Helper function to get symptom label based on language
  const getSymptomLabel = (label: string) => {
    if (language === 'urdu') {
      const urduMatch = label.match(/\((.*?)\)/);
      return urduMatch ? urduMatch[1] : label;
    }
    return label.split(' (')[0];
  };

  // Helper function to get category translation key
  const getCategoryTranslationKey = (category: string) => {
    const keyMap: { [key: string]: string } = {
      'General Symptoms': 'symptoms.categoryGeneral',
      'Skin Problems': 'symptoms.categorySkin',
      'Stomach & Digestion': 'symptoms.categoryStomach',
      'Breathing & Chest': 'symptoms.categoryBreathing',
      'Urinary Problems': 'symptoms.categoryUrinary',
      'Eyes & Vision': 'symptoms.categoryEyes',
      'Brain & Nerves': 'symptoms.categoryBrain',
      'Bones & Joints': 'symptoms.categoryBones',
      'Mental Health': 'symptoms.categoryMental',
      'Liver Symptoms': 'symptoms.categoryLiver',
      'Heart Related': 'symptoms.categoryHeart',
      'Hormonal Issues': 'symptoms.categoryHormonal',
      'Rectal Problems': 'symptoms.categoryRectal',
      'Other Symptoms': 'symptoms.categoryOther'
    };
    return keyMap[category] || category;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['General Symptoms']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPredictionResult, setShowPredictionResult] = useState(false);
  const [predictedSpecialist, setPredictedSpecialist] = useState('');
  const [predictionError, setPredictionError] = useState('');
  const [rankedDoctors, setRankedDoctors] = useState<any[]>([]);
  const [showRankedDoctors, setShowRankedDoctors] = useState(false);

  const symptomCategories = {
    "General Symptoms": {
      'high_fever': 'High Fever (تیز بخار)',
      'mild_fever': 'Mild Fever (ہلکا بخار)',
      'shivering': 'Shivering (کپکپی)',
      'chills': 'Feeling Cold (سردی لگنا)',
      'fatigue': 'Tiredness (تھکاوٹ)',
      'lethargy': 'Extreme Weakness (شدید کمزوری)',
      'malaise': 'Feeling Unwell (طبیعت خراب)',
      'weight_loss': 'Weight Loss (وزن میں کمی)',
      'weight_gain': 'Weight Gain (وزن میں اضافہ)',
      'sweating': 'Sweating (پسینہ آنا)',
      'swelled_lymph_nodes': 'Swollen Glands (غدود میں سوجن)',
      'loss_of_appetite': 'No Appetite (بھوک نہ لگنا)',
      'excessive_hunger': 'Always Hungry (زیادہ بھوک)',
      'increased_appetite': 'Increased Appetite (بھوک میں اضافہ)',
      'dehydration': 'Dehydration (پانی کی کمی)',
      'sunken_eyes': 'Sunken Eyes (آنکھیں اندر دھنسنا)',
      'obesity': 'Overweight (موٹاپا)',
      'toxic_look_(typhos)': 'Very Sick Appearance (شدید بیمار نظر آنا)',
      'restlessness': 'Restlessness (بے چینی)',
      'muscle_wasting': 'Muscle Loss (پٹھوں کا گھلنا)',
      'muscle_weakness': 'Muscle Weakness (پٹھوں میں کمزوری)',
      'cold_hands_and_feets': 'Cold Hands and Feet (ہاتھ پاؤں ٹھنڈے)'
    },
    "Skin Problems": {
      'itching': 'Itching (خارش)',
      'skin_rash': 'Skin Rash (جلد پر دانے)',
      'nodal_skin_eruptions': 'Skin Bumps (جلد پر گلٹیاں)',
      'dischromic_patches': 'Skin Color Patches (جلد پر دھبے)',
      'red_spots_over_body': 'Red Spots on Body (جسم پر سرخ نشان)',
      'pus_filled_pimples': 'Pimples with Pus (پیپ والے دانے)',
      'blackheads': 'Blackheads (کیل مہاسے)',
      'scurring': 'Skin Scarring (جلد پر نشان)',
      'skin_peeling': 'Peeling Skin (جلد کا چھلکا)',
      'silver_like_dusting': 'Silvery Skin Flakes (چاندی جیسے چھلکے)',
      'small_dents_in_nails': 'Nail Pitting (ناخن میں گڑھے)',
      'inflammatory_nails': 'Inflamed Nails (ناخن میں سوزش)',
      'blister': 'Blisters (چھالے)',
      'red_sore_around_nose': 'Sores Around Nose (ناک کے گرد زخم)',
      'yellow_crust_ooze': 'Yellow Crusty Discharge (پیلا مواد)'
    },
    "Stomach & Digestion": {
      'stomach_pain': 'Stomach Pain (پیٹ درد)',
      'abdominal_pain': 'Abdominal Pain (پیٹ میں درد)',
      'belly_pain': 'Belly Pain (پیٹ کا درد)',
      'acidity': 'Acidity/Heartburn (سینے میں جلن)',
      'ulcers_on_tongue': 'Mouth Ulcers (منہ میں چھالے)',
      'vomiting': 'Vomiting (قے/الٹی)',
      'nausea': 'Nausea (متلی)',
      'indigestion': 'Indigestion (بد ہضمی)',
      'constipation': 'Constipation (قبض)',
      'diarrhoea': 'Loose Motions (دست/پیچش)',
      'passage_of_gases': 'Gas/Flatulence (گیس کا اخراج)',
      'stomach_bleeding': 'Blood in Vomit (خون کی قے)',
      'swelling_of_stomach': 'Stomach Swelling (پیٹ میں سوجن)',
      'distention_of_abdomen': 'Bloated Stomach (پیٹ پھولنا)',
      'fluid_overload': 'Water Retention (پانی کا جمع ہونا)',
      'bloody_stool': 'Blood in Stool (پاخانہ میں خون)',
      'loss_of_smell': 'Loss of Smell (سونگھنے کی حس ختم)',
      'internal_itching': 'Internal Itching (اندرونی خارش)'
    },
    "Breathing & Chest": {
      'cough': 'Cough (کھانسی)',
      'chest_pain': 'Chest Pain (سینے میں درد)',
      'breathlessness': 'Difficulty Breathing (سانس پھولنا)',
      'phlegm': 'Phlegm/Mucus (بلغم)',
      'mucoid_sputum': 'Thick Phlegm (گاڑھا بلغم)',
      'blood_in_sputum': 'Blood in Cough (کھانسی میں خون)',
      'rusty_sputum': 'Brown/Rusty Phlegm (زنگ آلود بلغم)',
      'throat_irritation': 'Throat Irritation (گلے میں خراش)',
      'continuous_sneezing': 'Continuous Sneezing (مسلسل چھینکیں)',
      'runny_nose': 'Runny Nose (ناک بہنا)',
      'sinus_pressure': 'Sinus Pressure (ناک میں دباؤ)',
      'congestion': 'Nose Blockage (ناک بند)'
    },
    "Urinary Problems": {
      'burning_micturition': 'Burning Urination (پیشاب میں جلن)',
      'spotting_urination': 'Blood in Urine (پیشاب میں خون)',
      'dark_urine': 'Dark Urine (گہرا پیشاب)',
      'yellow_urine': 'Yellow Urine (پیلا پیشاب)',
      'bladder_discomfort': 'Bladder Pain (مثانے میں تکلیف)',
      'foul_smell_of_urine': 'Smelly Urine (بدبودار پیشاب)',
      'continuous_feel_of_urine': 'Frequent Urge (بار بار پیشاب کی حاجت)',
      'polyuria': 'Excessive Urination (زیادہ پیشاب)'
    },
    "Eyes & Vision": {
      'watering_from_eyes': 'Watery Eyes (آنکھوں سے پانی)',
      'yellowish_skin': 'Yellow Skin (پیلی جلد)',
      'yellowing_of_eyes': 'Yellow Eyes (پیلی آنکھیں)',
      'redness_of_eyes': 'Red Eyes (سرخ آنکھیں)',
      'blurred_and_distorted_vision': 'Blurry Vision (دھندلا نظر آنا)',
      'visual_disturbances': 'Vision Problems (نظر کی خرابی)',
      'puffy_face_and_eyes': 'Puffy Face and Eyes (چہرہ اور آنکھیں سوجنا)'
    },
    "Brain & Nerves": {
      'headache': 'Headache (سر درد)',
      'dizziness': 'Dizziness (چکر آنا)',
      'loss_of_balance': 'Balance Problems (توازن کھونا)',
      'lack_of_concentration': "Can't Focus (توجہ میں کمی)",
      'altered_sensorium': 'Confusion (ذہنی الجھاؤ)',
      'slurred_speech': 'Difficulty Speaking (بولنے میں دشواری)',
      'spinning_movements': 'Vertigo (سر گھومنا)',
      'unsteadiness': 'Unsteady Walking (لڑکھڑانا)',
      'weakness_of_one_body_side': 'One Side Weakness (ایک طرف کمزوری)',
      'coma': 'Unconsciousness (بے ہوشی)'
    },
    "Bones & Joints": {
      'joint_pain': 'Joint Pain (جوڑوں میں درد)',
      'back_pain': 'Back Pain (کمر درد)',
      'neck_pain': 'Neck Pain (گردن میں درد)',
      'muscle_pain': 'Muscle Pain (پٹھوں میں درد)',
      'knee_pain': 'Knee Pain (گھٹنے کا درد)',
      'hip_joint_pain': 'Hip Pain (کولہے کا درد)',
      'weakness_in_limbs': 'Weak Arms/Legs (بازو ٹانگ میں کمزوری)',
      'stiff_neck': 'Stiff Neck (گردن میں اکڑن)',
      'swelling_joints': 'Swollen Joints (جوڑوں میں سوجن)',
      'painful_walking': 'Pain While Walking (چلنے میں درد)',
      'movement_stiffness': 'Stiffness (اکڑن)',
      'swollen_legs': 'Swollen Legs (ٹانگوں میں سوجن)',
      'cramps': 'Muscle Cramps (پٹھوں میں کھچاؤ)'
    },
    "Mental Health": {
      'depression': 'Depression (ڈپریشن/اداسی)',
      'irritability': 'Irritability (چڑچڑاہٹ)',
      'anxiety': 'Anxiety (بے چینی/گھبراہٹ)',
      'mood_swings': 'Mood Changes (مزاج میں تبدیلی)',
      'lack_of_concentration': 'Poor Concentration (توجہ کی کمی)'
    },
    "Liver Symptoms": {
      'acute_liver_failure': 'Liver Failure (جگر کی خرابی)',
      'history_of_alcohol_consumption': 'Alcohol History (شراب کی تاریخ)',
      'receiving_blood_transfusion': 'Blood Transfusion History (خون چڑھانے کی تاریخ)',
      'receiving_unsterile_injections': 'Unsafe Injection History (غیر محفوظ انجکشن)'
    },
    "Heart Related": {
      'fast_heart_rate': 'Fast Heartbeat (دل کی تیز دھڑکن)',
      'palpitations': 'Palpitations (دل کا زور سے دھڑکنا)',
      'prominent_veins_on_calf': 'Visible Veins on Legs (ٹانگوں میں نسیں نظر آنا)',
      'swollen_blood_vessels': 'Swollen Blood Vessels (خون کی نالیوں میں سوجن)'
    },
    "Hormonal Issues": {
      'irregular_sugar_level': 'Blood Sugar Problems (شوگر لیول کی خرابی)',
      'enlarged_thyroid': 'Swollen Thyroid (گلے کی غدود میں سوجن)',
      'brittle_nails': 'Brittle Nails (کمزور ناخن)',
      'swollen_extremeties': 'Swollen Hands/Feet (ہاتھ پاؤں سوجنا)',
      'abnormal_menstruation': 'Irregular Periods (ماہواری کی خرابی)'
    },
    "Rectal Problems": {
      'pain_during_bowel_movements': 'Pain During Toilet (پاخانہ میں درد)',
      'pain_in_anal_region': 'Anal Pain (مقعد میں درد)',
      'irritation_in_anus': 'Anal Itching (مقعد میں خارش)',
      'bloody_stool': 'Blood in Stool (پاخانہ میں خون)'
    },
    "Other Symptoms": {
      'patches_in_throat': 'Throat Patches (گلے میں دھبے)',
      'pain_behind_the_eyes': 'Pain Behind Eyes (آنکھوں کے پیچھے درد)',
      'family_history': 'Family History (خاندانی تاریخ)',
      'extra_marital_contacts': 'Sexual History (جنسی تاریخ)',
      'bruising': 'Easy Bruising (آسانی سے نیل پڑنا)',
      'drying_and_tingling_lips': 'Dry/Tingling Lips (خشک ہونٹ)'
    }
  };

  const mockRecommendations = [
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      specialty: 'Internal Medicine',
      rating: 4.8,
      experience: 12,
      fee: 150,
      avatar: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
      matchScore: 95
    },
    {
      id: '2',
      name: 'Dr. Michael Rodriguez',
      specialty: 'General Physician',
      rating: 4.6,
      experience: 8,
      fee: 120,
      avatar: 'https://images.pexels.com/photos/6749778/pexels-photo-6749778.jpeg',
      matchScore: 88
    },
    {
      id: '3',
      name: 'Dr. Lisa Wang',
      specialty: 'Family Medicine',
      rating: 4.7,
      experience: 10,
      fee: 130,
      matchScore: 82
    }
  ];

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  const handleSymptomToggle = (symptomId: string, symptomName: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) return;
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmPrediction = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setPredictionError('');

    try {
      // Call the ML prediction API with backend symptom IDs (not user-friendly names)
      const response = await fetch('http://localhost:8000/api/predict-specialist/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms // These are already backend IDs like 'high_fever', 'chills', etc.
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPredictedSpecialist(data.predicted_specialist);
        setRankedDoctors(data.ranked_doctors || []);
        setShowPredictionResult(true);
        console.log('[Symptoms] Prediction success:', data.predicted_specialist, '- Doctors found:', data.total_doctors_found);
      } else {
        setPredictionError(data.error || 'Failed to predict specialist');
        setShowPredictionResult(true);
      }
    } catch (error) {
      console.error('[Symptoms] Prediction error:', error);
      setPredictionError('Failed to connect to prediction service. Please ensure the server is running.');
      setShowPredictionResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter symptoms based on search query
  const getFilteredCategories = () => {
    if (!searchQuery.trim()) return symptomCategories;

    const filtered: any = {};
    Object.entries(symptomCategories).forEach(([category, symptoms]) => {
      const matchingSymptoms: any = {};
      Object.entries(symptoms).forEach(([id, name]) => {
        if (name.toLowerCase().includes(searchQuery.toLowerCase())) {
          matchingSymptoms[id] = name;
        }
      });
      if (Object.keys(matchingSymptoms).length > 0) {
        filtered[category] = matchingSymptoms;
      }
    });
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  // Handler to navigate to doctor details page
  const handleViewDoctorDetails = (doctor: any) => {
    // Navigate to recommendations page with the complete doctor data to open profile modal
    navigate('/patient/recommendations', {
      state: {
        selectedDoctor: doctor,
        openProfileModal: true
      }
    });
  };

  // Helper function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`star-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="star-half" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    }

    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('symptoms.title')}</h1>
        <p className="text-gray-600">{t('symptoms.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Symptoms Display - Compact Header */}
          {selectedSymptoms.length > 0 && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg shadow-sm border border-cyan-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {t('symptoms.selectedSymptoms')} ({selectedSymptoms.length})
                </h3>
                <button
                  onClick={() => setSelectedSymptoms([])}
                  className="text-xs text-cyan-700 hover:text-cyan-900 font-medium px-3 py-1 bg-white rounded-md hover:bg-cyan-50 transition-colors"
                >
                  {t('symptoms.clearAll')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptomId) => {
                  // Find the symptom name from categories
                  let symptomName = '';
                  Object.values(symptomCategories).forEach((symptoms) => {
                    if (symptoms[symptomId]) {
                      symptomName = symptoms[symptomId];
                    }
                  });

                  return (
                    <div
                      key={symptomId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-cyan-300 rounded-full text-cyan-700 shadow-sm"
                    >
                      <span className="text-sm font-medium">{getSymptomLabel(symptomName)}</span>
                      <button
                        onClick={() => handleSymptomToggle(symptomId, symptomName)}
                        className="hover:bg-red-100 rounded-full p-0.5 transition-colors text-cyan-600 hover:text-red-600"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Common Symptoms Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('symptoms.browseSymptoms')}</h3>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('symptoms.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Symptoms Categories */}
            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(filteredCategories).length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('symptoms.noSymptomsFound')} "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    {t('symptoms.clearSearch')}
                  </button>
                </div>
              ) : (
                Object.entries(filteredCategories).map(([category, symptoms]) => {
                const isExpanded = searchQuery ? true : expandedCategories.includes(category);
                const selectedCount = Object.keys(symptoms).filter(id => selectedSymptoms.includes(id)).length;

                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-6 rounded-full ${selectedCount > 0 ? 'bg-cyan-500' : 'bg-gray-300'}`} />
                        <div className="text-left">
                          <span className="font-medium text-gray-900 block">
                            {language === 'urdu' ? t(getCategoryTranslationKey(category)) : category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {selectedCount > 0 ? `${selectedCount} ${t('symptoms.of')} ${Object.keys(symptoms).length} ${t('symptoms.selected')}` : `${Object.keys(symptoms).length} ${t('symptoms.symptoms')}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                            {selectedCount}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Symptoms Grid */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(symptoms).map(([symptomId, symptomName]) => {
                            const isSelected = selectedSymptoms.includes(symptomId);
                            return (
                              <button
                                key={symptomId}
                                onClick={() => handleSymptomToggle(symptomId, symptomName)}
                                className={`px-3 py-2.5 rounded-lg border-2 text-sm text-left transition-all ${
                                  isSelected
                                    ? 'border-cyan-500 bg-white text-cyan-700 shadow-sm'
                                    : 'border-transparent bg-white hover:border-gray-300 hover:shadow-sm text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                                    isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300'
                                  }`}>
                                    {isSelected && (
                                      <CheckCircle className="h-3 w-3 text-white fill-current" />
                                    )}
                                  </div>
                                  <span className={`${isSelected ? 'font-medium' : ''}`}>{getSymptomLabel(symptomName)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Info & Recommendations */}
        <div className="space-y-4">
          {/* Help Card - Always Visible */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-blue-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('symptoms.howItWorks')}</h3>
                <ol className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-cyan-600">1.</span>
                    <span>{t('symptoms.step1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-cyan-600">2.</span>
                    <span>{t('symptoms.step2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-cyan-600">3.</span>
                    <span>{t('symptoms.step3')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {selectedSymptoms.length > 0 && !isLoading && !showRecommendations && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('symptoms.readyToSubmit')}</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {t('symptoms.youveSelected')} <span className="font-bold text-cyan-600">{selectedSymptoms.length}</span> {selectedSymptoms.length !== 1 ? t('symptoms.symptoms') : t('symptoms.symptom')}
                </p>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors"
                >
                  {t('symptoms.getRecommendation')}
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <Loader className="animate-spin h-8 w-8 text-cyan-600 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">{t('symptoms.analyzing')}</h3>
                <p className="text-sm text-gray-600">{t('symptoms.findingBest')}</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {showRecommendations && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Top Matches</h3>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((doctor) => (
                  <div key={doctor.id} className="border border-gray-200 rounded-lg p-3 hover:border-cyan-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0">
                        {doctor.avatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={doctor.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                            {doctor.name.charAt(3)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{doctor.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{doctor.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-yellow-600 font-medium">★ {doctor.rating}</span>
                          <span className="text-xs text-gray-400">${doctor.fee}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {doctor.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-sm text-cyan-600 hover:text-cyan-800 font-semibold hover:underline">
                  View all recommendations →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('symptoms.confirmTitle')}</h3>
            <p className="text-gray-600 mb-4">
              {t('symptoms.confirmMessage')}
            </p>

            {/* Display selected symptoms as pills */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptomId) => {
                  let symptomName = '';
                  Object.values(symptomCategories).forEach((symptoms) => {
                    if (symptoms[symptomId]) {
                      symptomName = symptoms[symptomId];
                    }
                  });

                  return (
                    <div
                      key={symptomId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-100 border border-cyan-300 rounded-full text-cyan-700"
                    >
                      <span className="text-sm font-medium">{getSymptomLabel(symptomName)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {t('symptoms.total')}: <span className="font-bold text-cyan-600">{selectedSymptoms.length}</span> {selectedSymptoms.length !== 1 ? t('symptoms.symptoms') : t('symptoms.symptom')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                {t('symptoms.cancel')}
              </button>
              <button
                onClick={handleConfirmPrediction}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('symptoms.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prediction Result Modal */}
      {showPredictionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 text-center">
            {predictionError ? (
              <>
                {/* Error State */}
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('symptoms.predictionError')}</h3>
                <p className="text-gray-600 mb-6">{predictionError}</p>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('symptoms.recommendedSpecialist')}</h3>
                <p className="text-gray-600 mb-2">{t('symptoms.basedOnSymptoms')}</p>
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-2xl font-bold text-cyan-700">{predictedSpecialist}</p>
                </div>

                {/* Show doctors count or search prompt */}
                <div className="mb-4 text-sm text-gray-600">
                  {rankedDoctors.length > 0 ? (
                    <>
                      {t('symptoms.found')} <span className="font-bold text-cyan-600">{rankedDoctors.length}</span> {rankedDoctors.length === 1 ? t('symptoms.doctor') : t('symptoms.doctors')} {t('symptoms.available')}
                    </>
                  ) : (
                    <span className="text-amber-600">
                      {t('symptoms.clickToSearch')}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!predictionError && (
                <button
                  onClick={() => {
                    setShowPredictionResult(false);
                    setShowRankedDoctors(true);
                  }}
                  className="w-full px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                >
                  {rankedDoctors.length > 0 ? t('symptoms.viewRankedDoctors') : t('symptoms.searchForDoctors')}
                </button>
              )}
              <button
                onClick={() => {
                  setShowPredictionResult(false);
                  setPredictedSpecialist('');
                  setPredictionError('');
                  if (!rankedDoctors.length) {
                    setRankedDoctors([]);
                  }
                }}
                className={`w-full px-6 py-2 rounded-lg font-medium transition-colors ${
                  !predictionError
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                }`}
              >
                {!predictionError ? t('symptoms.close') : t('symptoms.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Doctors Modal */}
      {showRankedDoctors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{t('symptoms.rankedDoctors')}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('symptoms.specialty')}: <span className="font-semibold text-cyan-700">{predictedSpecialist}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowRankedDoctors(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Doctors List */}
            <div className="flex-1 overflow-y-auto p-6">
              {rankedDoctors.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="mb-6">
                    <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('symptoms.noDoctorsAvailable')}</h4>
                    <p className="text-gray-600 mb-4">
                      {t('symptoms.couldntFind')} <span className="font-semibold text-cyan-700">{predictedSpecialist}</span> {t('symptoms.atMoment')}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">{t('symptoms.whatCanYouDo')}</h5>
                    <ul className="text-sm text-gray-700 space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">•</span>
                        <span>{t('symptoms.tryAgainLater')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">•</span>
                        <span>{t('symptoms.browseAll')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">•</span>
                        <span>{t('symptoms.contactSupport')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rankedDoctors.map((doctor, index) => (
                    <div
                      key={doctor.id || index}
                      className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-cyan-300 hover:shadow-md transition-all"
                    >
                      {/* Rank Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              Dr. {doctor.first_name} {doctor.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Details */}
                      <div className="space-y-2 mb-4">
                        {/* Rating */}
                        {doctor.avg_rating !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">{t('symptoms.rating')}:</span>
                            <div className="flex items-center gap-1">
                              {renderStars(doctor.avg_rating)}
                              <span className="text-sm text-gray-700 font-semibold ml-1">
                                {doctor.avg_rating.toFixed(1)}
                              </span>
                              {doctor.total_feedback > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({doctor.total_feedback} {doctor.total_feedback === 1 ? t('symptoms.review') : t('symptoms.reviews')})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Experience */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 font-medium">{t('symptoms.experience')}:</span>
                          <span className="text-sm text-gray-800">
                            {doctor.years_of_experience} {doctor.years_of_experience === 1 ? t('symptoms.year') : t('symptoms.years')}
                          </span>
                        </div>

                        {/* Ranking Score */}
                        {doctor.ranking_score !== null && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">{t('symptoms.matchScore')}:</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                <div
                                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                                  style={{ width: `${doctor.ranking_score}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-cyan-700">
                                {doctor.ranking_score.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Contact Info */}
                        {doctor.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">{t('symptoms.email')}:</span>
                            <span className="text-sm text-gray-800">{doctor.email}</span>
                          </div>
                        )}

                        {doctor.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">{t('symptoms.phone')}:</span>
                            <span className="text-sm text-gray-800">{doctor.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Consultation Fee */}
                      {doctor.consultation_fee && (
                        <div className="pt-3 border-t border-gray-200 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 font-medium">{t('symptoms.consultationFee')}:</span>
                            <span className="text-lg font-bold text-cyan-700">
                              ${doctor.consultation_fee}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* View Doctor Details Button */}
                      <button
                        onClick={() => handleViewDoctorDetails(doctor)}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                      >
                        {t('symptoms.viewDetailsBook')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {t('symptoms.showing')} <span className="font-bold text-cyan-600">{rankedDoctors.length}</span> {rankedDoctors.length !== 1 ? t('symptoms.doctors') : t('symptoms.doctor')}
                </p>
                <button
                  onClick={() => setShowRankedDoctors(false)}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                >
                  {t('symptoms.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Symptoms;