import React, { createContext, useState, useContext } from 'react';

const KillerModeContext = createContext();

export const KillerModeProvider = ({ children }) => {
  const [killerMode, setKillerMode] = useState(false);

  return (
    <KillerModeContext.Provider value={{ killerMode, setKillerMode }}>
      {children}
    </KillerModeContext.Provider>
  );
};

export const useKillerMode = () => useContext(KillerModeContext);