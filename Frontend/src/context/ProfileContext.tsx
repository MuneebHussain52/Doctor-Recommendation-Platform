import React, { createContext, useContext, useState, ReactNode } from 'react';


type Break = { start: string; end: string };
type WorkingHour = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  breaks: Break[];
};

export type { Break, WorkingHour };

interface ProfileContextType {
  profilePic: string;
  setProfilePic: (pic: string) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  middleName: string;
  setMiddleName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  specialization: string;
  setSpecialization: (spec: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  workingHours: WorkingHour[];
  setWorkingHours: React.Dispatch<React.SetStateAction<WorkingHour[]>>;
}

const defaultPic = "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg";

const defaultWorkingHours: WorkingHour[] = [
  { day: 'Monday', enabled: true, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Tuesday', enabled: true, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Wednesday', enabled: true, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Thursday', enabled: true, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Friday', enabled: true, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Saturday', enabled: false, start: '09:00', end: '17:00', breaks: [] },
  { day: 'Sunday', enabled: false, start: '09:00', end: '17:00', breaks: [] },
];

const ProfileContext = createContext<ProfileContextType>({
  profilePic: defaultPic,
  setProfilePic: () => {},
  firstName: 'Sarah',
  setFirstName: () => {},
  middleName: '',
  setMiddleName: () => {},
  lastName: 'Chen',
  setLastName: () => {},
  specialization: 'Cardiologist',
  setSpecialization: () => {},
  email: 'dr.chen@example.com',
  setEmail: () => {},
  phone: '+1 (555) 987-6543',
  setPhone: () => {},
  bio: 'Dr. Sarah Chen is a board-certified cardiologist with over 10 years of experience in diagnosing and treating heart conditions. She specializes in preventive cardiology and heart failure management.',
  setBio: () => {},
  workingHours: defaultWorkingHours,
  setWorkingHours: () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profilePic, setProfilePic] = useState<string>(defaultPic);
  const [firstName, setFirstName] = useState<string>('Sarah');
  const [middleName, setMiddleName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('Chen');
  const [specialization, setSpecialization] = useState<string>('Cardiologist');
  const [email, setEmail] = useState<string>('dr.chen@example.com');
  const [phone, setPhone] = useState<string>('+1 (555) 987-6543');
  const [bio, setBio] = useState<string>('Dr. Sarah Chen is a board-certified cardiologist with over 10 years of experience in diagnosing and treating heart conditions. She specializes in preventive cardiology and heart failure management.');
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(defaultWorkingHours);
  return (
    <ProfileContext.Provider value={{ profilePic, setProfilePic, firstName, setFirstName, middleName, setMiddleName, lastName, setLastName, specialization, setSpecialization, email, setEmail, phone, setPhone, bio, setBio, workingHours, setWorkingHours }}>
      {children}
    </ProfileContext.Provider>
  );
};