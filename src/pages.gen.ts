// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';

// prettier-ignore
import type { getConfig as File_AboutIndex_getConfig } from './pages/about/index';
// prettier-ignore
import type { getConfig as File_Index_getConfig } from './pages/index';
// prettier-ignore
import type { getConfig as File_RegisterIndex_getConfig } from './pages/register/index';

// prettier-ignore
type Page =
| ({ path: '/about' } & GetConfigResponse<typeof File_AboutIndex_getConfig>)
| ({ path: '/' } & GetConfigResponse<typeof File_Index_getConfig>)
| { path: '/login'; render: 'static' }
| ({ path: '/register' } & GetConfigResponse<typeof File_RegisterIndex_getConfig>);

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
