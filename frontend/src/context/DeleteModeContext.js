import React, { createContext, useState, useContext } from 'react';

const DeleteModeContext = createContext();

export const DeleteModeProvider = ({ children }) => {
  const [deleteMode, setDeleteMode] = useState(false);

  return (
    <DeleteModeContext.Provider value={{ deleteMode, setDeleteMode }}>
      {children}
    </DeleteModeContext.Provider>
  );
};

export const useDeleteMode = () => useContext(DeleteModeContext);