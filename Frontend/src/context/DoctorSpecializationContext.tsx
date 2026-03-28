import React, { createContext, useContext, useState, ReactNode } from "react";

interface DoctorSpecializationContextType {
  specialization: string;
  setSpecialization: (spec: string) => void;
}

const DoctorSpecializationContext = createContext<DoctorSpecializationContextType | undefined>(undefined);

export const useDoctorSpecialization = () => {
  const context = useContext(DoctorSpecializationContext);
  if (!context) throw new Error("useDoctorSpecialization must be used within a DoctorSpecializationProvider");
  return context;
};

export const DoctorSpecializationProvider = ({ children }: { children: ReactNode }) => {
  const [specialization, setSpecialization] = useState("Cardiologist");
  return (
    <DoctorSpecializationContext.Provider value={{ specialization, setSpecialization }}>
      {children}
    </DoctorSpecializationContext.Provider>
  );
};
