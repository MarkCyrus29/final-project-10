import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Airline Reservation`;
    return () => {
      document.title = 'Airline Reservation';
    };
  }, [title]);
};

export default useDocumentTitle;
