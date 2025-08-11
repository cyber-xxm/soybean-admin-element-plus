<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, menuIconTypeOptions, menuTypeOptions } from '@/constants/business';
import { createMenu, updateMenu } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { getLocalIcons } from '@/utils/icon';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import {
  getLayoutAndPage,
  getPathParamFromRoutePath,
  getRoutePathByRouteName,
  getRoutePathWithParam,
  transformLayoutAndPageToComponent
} from './shared';
import { useLoading } from '~/packages/hooks';

defineOptions({ name: 'MenuOperateModal' });

export type OperateType = UI.TableOperateType | 'addChild';

interface Props {
  /** the type of operation */
  operateType: OperateType;
  /** the edit menu data or the parent menu data when adding a child menu */
  rowData?: Api.SystemManage.Menu | null;
  /** all pages */
  allPages: string[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const menuId = computed(() => props.rowData?.id || '');

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: $t('page.manage.menu.addMenu'),
    addChild: $t('page.manage.menu.addChildMenu'),
    edit: $t('page.manage.menu.editMenu')
  };
  return titles[props.operateType];
});

type Model = Pick<
  Api.SystemManage.Menu,
  | 'menu_type'
  | 'menu_name'
  | 'route_name'
  | 'route_path'
  | 'component'
  | 'order'
  | 'i18n_key'
  | 'icon'
  | 'icon_type'
  | 'status'
  | 'parent_id'
  | 'keep_alive'
  | 'constant'
  | 'href'
  | 'hide_menu'
  | 'active_menu'
  | 'multi_tab'
  | 'fixedIndexInTab'
> & {
  query: NonNullable<Api.SystemManage.Menu['query']>;
  buttons: NonNullable<Api.SystemManage.Menu['buttons']>;
  layout: string;
  page: string;
  path_param: string;
};

const { startLoading, endLoading } = useLoading();

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    menu_type: 1,
    menu_name: '',
    route_name: '',
    route_path: '',
    path_param: '',
    component: '',
    layout: '',
    page: '',
    i18n_key: null,
    icon: '',
    icon_type: 1,
    parent_id: '',
    status: 1,
    keep_alive: false,
    constant: false,
    order: 0,
    href: null,
    hide_menu: false,
    active_menu: undefined,
    multi_tab: false,
    fixedIndexInTab: undefined,
    query: [],
    buttons: []
  };
}

type RuleKey = Extract<keyof Model, 'menu_name' | 'status' | 'route_name' | 'route_path'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  menu_name: defaultRequiredRule,
  status: defaultRequiredRule,
  route_name: defaultRequiredRule,
  route_path: defaultRequiredRule
};

const disabledMenuType = computed(() => props.operateType === 'edit');

const localIcons = getLocalIcons();
const localIconOptions = localIcons.map(item => ({
  label: () => (
    <div class="flex-y-center gap-16px">
      <SvgIcon localIcon={item} class="text-icon" />
      <span>{item}</span>
    </div>
  ),
  value: item
}));

const showLayout = computed(() => model.value.parent_id === '');

const showPage = computed(() => model.value.menu_type === 2);

const pageOptions = computed(() => {
  const allPages = [...props.allPages];

  if (model.value.route_name && !allPages.includes(model.value.route_name)) {
    allPages.unshift(model.value.route_name);
  }

  const opts: CommonType.Option[] = allPages.map(page => ({
    label: page,
    value: page
  }));

  return opts;
});

const layoutOptions: CommonType.Option[] = [
  { label: 'base', value: 'base' },
  { label: 'blank', value: 'blank' }
];

/** the enabled role options */
// const roleOptions = ref<CommonType.Option<string>[]>([]);

async function getRoleOptions() {
  // const { error, data } = await fetchGetAllRoles();
  //
  // if (!error) {
  //   const options = data.map(item => ({
  //     label: item.name,
  //     value: item.roleCode
  //   }));
  //
  //   roleOptions.value = [...options];
  // }
}

/** - add a query input */
function addQuery(index: number) {
  model.value.query.splice(index + 1, 0, { key: '', value: '' });
}

/** - remove a query input */
function removeQuery(index: number) {
  model.value.query.splice(index, 1);
}

/** - add a button input */
function addButton(index: number) {
  model.value.buttons.splice(index + 1, 0, { code: '', desc: '' });
}

/** - remove a button input */
function removeButton(index: number) {
  model.value.buttons.splice(index, 1);
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (!props.rowData) return;

  if (props.operateType === 'addChild') {
    const { id } = props.rowData;

    Object.assign(model.value, { parent_id: id });
  }

  if (props.operateType === 'edit') {
    const { component, ...rest } = props.rowData;

    const { layout, page } = getLayoutAndPage(component);
    const { path, param } = getPathParamFromRoutePath(rest.route_path);

    Object.assign(model.value, rest, { layout, page, route_path: path, path_param: param });
  }

  if (!model.value.query) {
    model.value.query = [];
  }
  if (!model.value.buttons) {
    model.value.buttons = [];
  }
}

function closeDrawer() {
  visible.value = false;
}

function handleUpdateRoutePathByRouteName() {
  if (model.value.route_name) {
    model.value.route_path = getRoutePathByRouteName(model.value.route_name);
  } else {
    model.value.route_path = '';
  }
}

function handleUpdateI18nKeyByRouteName() {
  if (model.value.route_name) {
    model.value.i18n_key = `route.${model.value.route_name}` as App.I18n.I18nKey;
  } else {
    model.value.i18n_key = null;
  }
}

function getSubmitParams() {
  const { layout, page, path_param, ...params } = model.value;

  const component = transformLayoutAndPageToComponent(layout, page);
  const routePath = getRoutePathWithParam(model.value.route_path, path_param);

  params.component = component;
  params.route_path = routePath;

  return params;
}

async function handleSubmit() {
  await validate();

  const params = getSubmitParams();

  await validate();
  // request
  startLoading();

  const { error } =
    props.operateType !== 'edit'
      ? await createMenu(params as Api.SystemManage.Menu)
      : await updateMenu(menuId.value, params as Api.SystemManage.Menu);

  if (!error) {
    window.$message?.success(props.operateType !== 'edit' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } else {
    window.$message?.error(props.operateType !== 'edit' ? $t('common.addFailed') : $t('common.updateFailed'));
  }

  endLoading();
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
    getRoleOptions();
  }
});

watch(
  () => model.value.route_name,
  () => {
    handleUpdateRoutePathByRouteName();
    handleUpdateI18nKeyByRouteName();
  }
);
</script>

<template>
  <ElDialog v-model="visible" :title="title" preset="card" class="w-800px">
    <ElScrollbar class="h-480px pr-20px">
      <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
        <ElRow>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuType')" prop="menuType">
              <ElRadioGroup v-model="model.menu_type" :disabled="disabledMenuType">
                <ElRadio
                  v-for="item in menuTypeOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="$t(item.label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuName')" prop="menuName">
              <ElInput v-model="model.menu_name" :placeholder="$t('page.manage.menu.form.menuName')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.routeName')" prop="routeName">
              <ElInput v-model="model.route_name" :placeholder="$t('page.manage.menu.form.routeName')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.routePath')" prop="routePath">
              <ElInput v-model="model.route_path" disabled :placeholder="$t('page.manage.menu.form.routePath')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.pathParam')" prop="pathParam">
              <ElInput v-model="model.path_param" :placeholder="$t('page.manage.menu.form.pathParam')" />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="showLayout" :span="12">
            <ElFormItem :label="$t('page.manage.menu.layout')" prop="layout">
              <ElSelect v-model="model.layout" clearable :placeholder="$t('page.manage.menu.form.layout')">
                <ElOption
                  v-for="{ label, value } in layoutOptions"
                  :key="value"
                  :label="label"
                  :value="value"
                ></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="showPage" :span="12">
            <ElFormItem :label="$t('page.manage.menu.page')" prop="page">
              <ElSelect v-model="model.page" clearable :placeholder="$t('page.manage.menu.form.page')">
                <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value"></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.i18nKey')" prop="i18nKey">
              <ElInput v-model="model.i18n_key" :placeholder="$t('page.manage.menu.form.i18nKey')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.order')" prop="order">
              <ElInputNumber v-model="model.order" class="w-full" :placeholder="$t('page.manage.menu.form.order')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.iconTypeTitle')" prop="iconType">
              <ElRadioGroup v-model="model.icon_type">
                <ElRadio
                  v-for="item in menuIconTypeOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="$t(item.label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.icon')" prop="icon">
              <template v-if="model.icon_type === 1">
                <ElInput v-model="model.icon" :placeholder="$t('page.manage.menu.form.icon')" class="flex-1">
                  <template #suffix>
                    <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
                  </template>
                </ElInput>
              </template>
              <template v-if="model.icon_type === 2">
                <ElSelect
                  v-model="model.icon"
                  :placeholder="$t('page.manage.menu.form.localIcon')"
                  :options="localIconOptions"
                />
              </template>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.menuStatus')" prop="status">
              <ElRadioGroup v-model="model.status">
                <ElRadio
                  v-for="{ label, value } in enableStatusOptions"
                  :key="value"
                  :value="value"
                  :label="$t(label)"
                />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.keepAlive')" prop="keepAlive">
              <ElRadioGroup v-model="model.keep_alive">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.constant')" prop="constant">
              <ElRadioGroup v-model="model.constant">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.href')" prop="href">
              <ElInput v-model="model.href" :placeholder="$t('page.manage.menu.form.href')" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.hideInMenu')" prop="hideInMenu">
              <ElRadioGroup v-model="model.hide_menu">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol v-if="model.hide_menu" :span="12">
            <ElFormItem :label="$t('page.manage.menu.activeMenu')" prop="activeMenu">
              <ElSelect
                v-model="model.active_menu"
                :options="pageOptions"
                clearable
                :placeholder="$t('page.manage.menu.form.activeMenu')"
              >
                <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value"></ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.multiTab')" prop="multiTab">
              <ElRadioGroup v-model="model.multi_tab">
                <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
                <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
              </ElRadioGroup>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('page.manage.menu.fixedIndexInTab')" prop="fixedIndexInTab">
              <ElInputNumber
                v-model="model.fixedIndexInTab"
                class="w-full"
                clearable
                :placeholder="$t('page.manage.menu.form.fixedIndexInTab')"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem :label="$t('page.manage.menu.query')" prop="query">
              <ElButton v-if="model.query.length === 0" class="w-full border-dashed" @click="addQuery(-1)">
                <template #icon>
                  <icon-carbon-add class="align-sub text-icon" />
                </template>
                <span class="ml-8px">{{ $t('common.add') }}</span>
              </ElButton>
              <template v-else>
                <div v-for="(item, index) in model.query" :key="index" class="flex gap-3">
                  <ElCol :span="10">
                    <ElFormItem :prop="['query', index.toString(), 'key']">
                      <ElInput v-model="item.key" :placeholder="$t('page.manage.menu.form.queryKey')" class="flex-1" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="10">
                    <ElFormItem :prop="['query', index.toString(), 'value']">
                      <ElInput
                        v-model="item.value"
                        :placeholder="$t('page.manage.menu.form.queryValue')"
                        class="flex-1"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="4">
                    <ElSpace class="ml-12px">
                      <ElButton @click="addQuery(index)">
                        <template #icon>
                          <icon-ic:round-plus class="align-sub text-icon" />
                        </template>
                      </ElButton>
                      <ElButton @click="removeQuery(index)">
                        <template #icon>
                          <icon-ic-round-remove class="align-sub text-icon" />
                        </template>
                      </ElButton>
                    </ElSpace>
                  </ElCol>
                </div>
              </template>
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem :label-col="{ span: 4 }" :label="$t('page.manage.menu.button')" prop="buttons">
              <ElButton v-if="model.buttons.length === 0" class="w-full border-dashed" @click="addButton(-1)">
                <template #icon>
                  <icon-carbon-add class="align-sub text-icon" />
                </template>
                <span class="ml-8px">{{ $t('common.add') }}</span>
              </ElButton>
              <template v-else>
                <div v-for="(item, index) in model.buttons" :key="index" class="flex gap-3">
                  <ElCol :span="10">
                    <ElFormItem :prop="['buttons', index.toString(), 'code']">
                      <ElInput
                        v-model="item.code"
                        :placeholder="$t('page.manage.menu.form.buttonCode')"
                        class="flex-1"
                      ></ElInput>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="10">
                    <ElFormItem :prop="['buttons', index.toString(), 'desc']">
                      <ElInput
                        v-model="item.desc"
                        :placeholder="$t('page.manage.menu.form.buttonDesc')"
                        class="flex-1"
                      ></ElInput>
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="4">
                    <ElSpace class="ml-12px">
                      <ElButton @click="addButton(index)">
                        <template #icon>
                          <icon-ic:round-plus class="align-sub text-icon" />
                        </template>
                      </ElButton>
                      <ElButton @click="removeButton(index)">
                        <template #icon>
                          <icon-ic-round-remove class="align-sub text-icon" />
                        </template>
                      </ElButton>
                    </ElSpace>
                  </ElCol>
                </div>
              </template>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElScrollbar>
    <template #footer>
      <ElSpace :size="16" class="float-right">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped></style>
