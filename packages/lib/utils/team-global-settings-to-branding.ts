import { bytesToHex } from '@noble/ciphers/utils';
import { sha256 } from '@noble/hashes/sha2';
import type { OrganisationGlobalSettings } from '@prisma/client';

import { NEXT_PUBLIC_WEBAPP_URL } from '../constants/app';

/**
 * Jess fork: version the logo URL with a content hash of the underlying
 * documentData reference so logo swaps bust Gmail's image-proxy cache
 * immediately. The route ignores the query param; only the URL identity
 * matters to the proxy.
 */
const brandingLogoVersion = (brandingLogo: string) => bytesToHex(sha256(brandingLogo)).slice(0, 16);

export const teamGlobalSettingsToBranding = (
  settings: Omit<OrganisationGlobalSettings, 'id'>,
  teamId: number,
  hidePoweredBy: boolean,
) => {
  return {
    ...settings,
    brandingLogo:
      settings.brandingEnabled && settings.brandingLogo
        ? `${NEXT_PUBLIC_WEBAPP_URL()}/api/branding/logo/team/${teamId}?v=${brandingLogoVersion(
            settings.brandingLogo,
          )}`
        : '',
    brandingHidePoweredBy: hidePoweredBy,
  };
};

export const organisationGlobalSettingsToBranding = (
  settings: Omit<OrganisationGlobalSettings, 'id'>,
  organisationId: string,
  hidePoweredBy: boolean,
) => {
  return {
    ...settings,
    brandingLogo:
      settings.brandingEnabled && settings.brandingLogo
        ? `${NEXT_PUBLIC_WEBAPP_URL()}/api/branding/logo/organisation/${organisationId}?v=${brandingLogoVersion(
            settings.brandingLogo,
          )}`
        : '',
    brandingHidePoweredBy: hidePoweredBy,
  };
};
