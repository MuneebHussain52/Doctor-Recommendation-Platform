import React, { createContext, useContext, useState, ReactNode } from "react";

const defaultPic = "https://ui-avatars.com/api/?name=User&background=cccccc&color=555555&size=256";

interface ProfilePicContextType {
  profilePic: string;
  setProfilePic: (pic: string) => void;
}

const ProfilePicContext = createContext<ProfilePicContextType | undefined>(undefined);

export const useProfilePic = () => {
  const context = useContext(ProfilePicContext);
  if (!context) throw new Error("useProfilePic must be used within a ProfilePicProvider");
  return context;
};

export const ProfilePicProvider = ({ children }: { children: ReactNode }) => {
  const [profilePic, setProfilePic] = useState<string>(defaultPic);
  return (
    <ProfilePicContext.Provider value={{ profilePic, setProfilePic }}>
      {children}
    </ProfilePicContext.Provider>
  );
};
