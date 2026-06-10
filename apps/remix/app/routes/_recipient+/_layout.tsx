import { useOptionalSession } from '@documenso/lib/client-only/providers/session';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { isRouteErrorResponse, Link, Outlet } from 'react-router';
import { Header as AuthenticatedHeader } from '~/components/general/app-header';
import { GenericErrorLayout } from '~/components/general/generic-error-layout';
import type { Route } from './+types/_layout';

export function meta() {
  return [
    { title: i18n._(msg`Sign Document - Jess Intelligence`) },
    { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
  ];
}

/**
 * A layout to handle scenarios where the user is a recipient of a given resource
 * where we do not care whether they are authenticated or not.
 *
 * Such as direct template access, or signing.
 */
export default function RecipientLayout({ matches }: Route.ComponentProps) {
  const { sessionData } = useOptionalSession();

  // Recipient-facing surfaces always render in light mode: dark mode inverts
  // drawn-signature ink and breaks the brand palette contrast guarantees.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('dark-mode-disabled');
  }, []);

  // Hide the header for signing routes.
  const hideHeader = matches.some(
    (match) =>
      match?.id === 'routes/_recipient+/sign.$token+/_index' || match?.id === 'routes/_recipient+/d.$token+/_index',
  );

  return (
    <div className="dark-mode-disabled min-h-screen">
      {!hideHeader &&
        (sessionData?.user ? (
          <AuthenticatedHeader />
        ) : (
          <header className="px-4 pt-6 md:px-8">
            <img src="/branding/logo-jess.png" alt="Jess Intelligence" className="h-10 w-auto md:h-12" />
          </header>
        ))}

      <main
        className={cn({
          'mt-8 mb-8 px-4 md:mt-12 md:mb-12 md:px-8': !hideHeader,
        })}
      >
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const errorCode = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <GenericErrorLayout
      errorCode={errorCode}
      secondaryButton={null}
      primaryButton={
        <Button asChild className="w-32">
          <Link to="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            <Trans>Go Back</Trans>
          </Link>
        </Button>
      }
    />
  );
}
