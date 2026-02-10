import React, { createContext, useContext, useState, ReactNode } from "react";

interface DoctorNameContextType {
  firstName: string;
  setFirstName: (name: string) => void;
  middleName: string;
  setMiddleName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
}

const DoctorNameContext = createContext<DoctorNameContextType | undefined>(undefined);

export const useDoctorName = () => {
  const context = useContext(DoctorNameContext);
  if (!context) throw new Error("useDoctorName must be used within a DoctorNameProvider");
  return context;
};

export const DoctorNameProvider = ({ children }: { children: ReactNode }) => {
  const [firstName, setFirstName] = useState("Sarah");
  const [middleName, setMiddleName] = useState("A.");
  const [lastName, setLastName] = useState("Chen");
  return (
    <DoctorNameContext.Provider value={{ firstName, setFirstName, middleName, setMiddleName, lastName, setLastName }}>
      {children}
    </DoctorNameContext.Provider>
  );
};
