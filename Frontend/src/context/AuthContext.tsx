import React, { createContext, useContext, useState, useEffect } from 'react';

interface Doctor {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  specialty: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  is_blocked?: boolean;
  block_reason?: string;
  blocked_at?: string;
}

interface Patient {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  avatar?: string;
}

interface AuthContextType {
  doctor: Doctor | null;
  patient: Patient | null;
  isAuthenticated: boolean;
  userType: 'doctor' | 'patient' | null;
  login: (userData: Doctor | Patient, type: 'doctor' | 'patient') => void;
  logout: () => void;
  updateDoctor: (doctorData: Partial<Doctor>) => void;
  updatePatient: (patientData: Partial<Patient>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use sessionStorage instead of localStorage
    // This ensures authentication only persists during the browser session
    // and requires login after closing the browser
    const storedDoctor = sessionStorage.getItem('doctor');
    const storedPatient = sessionStorage.getItem('patient');

    if (storedDoctor) {
      try {
        setDoctor(JSON.parse(storedDoctor));
        setUserType('doctor');
      } catch (error) {
        console.error('Failed to parse stored doctor data:', error);
        sessionStorage.removeItem('doctor');
        sessionStorage.removeItem('doctorId');
      }
    } else if (storedPatient) {
      try {
        setPatient(JSON.parse(storedPatient));
        setUserType('patient');
      } catch (error) {
        console.error('Failed to parse stored patient data:', error);
        sessionStorage.removeItem('patient');
        sessionStorage.removeItem('patientId');
      }
    }

    // Clean up any old localStorage data
    localStorage.removeItem('doctor');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('patient');
    localStorage.removeItem('patientId');

    setLoading(false);
  }, []);

  const login = (userData: Doctor | Patient, type: 'doctor' | 'patient') => {
    if (type === 'doctor') {
      setDoctor(userData as Doctor);
      sessionStorage.setItem('doctor', JSON.stringify(userData));
      sessionStorage.setItem('doctorId', userData.id);
    } else {
      setPatient(userData as Patient);
      sessionStorage.setItem('patient', JSON.stringify(userData));
      sessionStorage.setItem('patientId', userData.id);
    }
    setUserType(type);
  };

  const logout = () => {
    setDoctor(null);
    setPatient(null);
    setUserType(null);
    sessionStorage.removeItem('doctor');
    sessionStorage.removeItem('doctorId');
    sessionStorage.removeItem('patient');
    sessionStorage.removeItem('patientId');
    // Also clear localStorage as backup
    localStorage.removeItem('doctor');
    localStorage.removeItem('doctorId');
    localStorage.removeItem('patient');
    localStorage.removeItem('patientId');
    localStorage.removeItem('token'); // Clear authentication token
  };

  const updateDoctor = (doctorData: Partial<Doctor>) => {
    if (doctor) {
      const updatedDoctor = { ...doctor, ...doctorData };
      setDoctor(updatedDoctor);
      sessionStorage.setItem('doctor', JSON.stringify(updatedDoctor));
    }
  };

  const updatePatient = (patientData: Partial<Patient>) => {
    if (patient) {
      const updatedPatient = { ...patient, ...patientData };
      setPatient(updatedPatient);
      sessionStorage.setItem('patient', JSON.stringify(updatedPatient));
    }
  };

  const value = {
    doctor,
    patient,
    isAuthenticated: !!(doctor || patient),
    userType,
    login,
    logout,
    updateDoctor,
    updatePatient,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
