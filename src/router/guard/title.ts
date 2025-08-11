import type { Router } from 'vue-router';
import { useTitle } from '@vueuse/core';
import { $t } from '@/locales';

export function createDocumentTitleGuard(router: Router) {
  router.afterEach(to => {
    const { i18n_key, title } = to.meta;

    const documentTitle = i18n_key ? $t(i18n_key) : title;

    useTitle(documentTitle);
  });
}
