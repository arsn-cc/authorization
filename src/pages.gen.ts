// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';

// prettier-ignore
import type { getConfig as File_404Index_getConfig } from './pages/404/index';
// prettier-ignore
import type { getConfig as File_AboutIndex_getConfig } from './pages/about/index';
// prettier-ignore
import type { getConfig as File_DeleteAccountIndex_getConfig } from './pages/delete-account/index';
// prettier-ignore
import type { getConfig as File_ForgotPasswordIndex_getConfig } from './pages/forgot-password/index';
// prettier-ignore
import type { getConfig as File_Index_getConfig } from './pages/index';
// prettier-ignore
import type { getConfig as File_LoginE2faIndex_getConfig } from './pages/login/e-2fa/index';
// prettier-ignore
import type { getConfig as File_LoginIndex_getConfig } from './pages/login/index';
// prettier-ignore
import type { getConfig as File_LoginTotpIndex_getConfig } from './pages/login/totp/index';
// prettier-ignore
import type { getConfig as File_PasswordResetIndex_getConfig } from './pages/password-reset/index';
// prettier-ignore
import type { getConfig as File_RegisterIndex_getConfig } from './pages/register/index';
// prettier-ignore
import type { getConfig as File_UnlockAccountIndex_getConfig } from './pages/unlock-account/index';
// prettier-ignore
import type { getConfig as File_VerifyEmailIndex_getConfig } from './pages/verify-email/index';

// prettier-ignore
type Page =
| ({ path: '/404' } & GetConfigResponse<typeof File_404Index_getConfig>)
| ({ path: '/about' } & GetConfigResponse<typeof File_AboutIndex_getConfig>)
| ({ path: '/delete-account' } & GetConfigResponse<typeof File_DeleteAccountIndex_getConfig>)
| ({ path: '/forgot-password' } & GetConfigResponse<typeof File_ForgotPasswordIndex_getConfig>)
| ({ path: '/' } & GetConfigResponse<typeof File_Index_getConfig>)
| ({ path: '/login/e-2fa' } & GetConfigResponse<typeof File_LoginE2faIndex_getConfig>)
| ({ path: '/login' } & GetConfigResponse<typeof File_LoginIndex_getConfig>)
| ({ path: '/login/totp' } & GetConfigResponse<typeof File_LoginTotpIndex_getConfig>)
| ({ path: '/password-reset' } & GetConfigResponse<typeof File_PasswordResetIndex_getConfig>)
| ({ path: '/register' } & GetConfigResponse<typeof File_RegisterIndex_getConfig>)
| ({ path: '/unlock-account' } & GetConfigResponse<typeof File_UnlockAccountIndex_getConfig>)
| ({ path: '/verify-email' } & GetConfigResponse<typeof File_VerifyEmailIndex_getConfig>);

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
