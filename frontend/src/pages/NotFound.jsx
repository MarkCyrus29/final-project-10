import React from 'react';
import { FileQuestion } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonLink } from '../components/ui/Button';

export const NotFound = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you’re looking for doesn’t exist or has moved."
        action={
          <ButtonLink to="/flights">
            Go to flights
          </ButtonLink>
        }
      />
    </div>
  );
};

export default NotFound;
