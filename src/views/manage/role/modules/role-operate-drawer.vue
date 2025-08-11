<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useBoolean, useLoading } from '@sa/hooks';
import { enableStatusOptions } from '@/constants/business';
import { createRole, updateRole } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import MenuAuthModal from './menu-auth-modal.vue';
import ButtonAuthModal from './button-auth-modal.vue';

defineOptions({ name: 'RoleOperateDrawer' });

const { startLoading, endLoading } = useLoading();

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.Role | null;
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
const { bool: menuAuthVisible, setTrue: openMenuAuthModal } = useBoolean();
const { bool: buttonAuthVisible, setTrue: openButtonAuthModal } = useBoolean();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.role.addRole'),
    edit: $t('page.manage.role.editRole')
  };
  return titles[props.operateType];
});

type Model = Pick<Api.SystemManage.Role, 'name' | 'description' | 'status'>;

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    name: '',
    description: '',
    status: undefined
  };
}

type RuleKey = Exclude<keyof Model, 'description'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  name: defaultRequiredRule,
  status: defaultRequiredRule
};

const roleId = computed(() => props.rowData?.id || '');

const isEdit = computed(() => props.operateType === 'edit');

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  // request
  startLoading();

  const { error } =
    props.operateType === 'add'
      ? await createRole(model.value as Api.SystemManage.Role)
      : await updateRole(roleId.value, model.value as Api.SystemManage.Role);

  if (!error) {
    window.$message?.success(props.operateType === 'add' ? $t('common.addSuccess') : $t('common.updateSuccess'));
    closeDrawer();
    emit('submitted');
  } else {
    window.$message?.error(props.operateType === 'add' ? $t('common.addFailed') : $t('common.updateFailed'));
  }

  endLoading();
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" draggable preset="card" class="w-800px">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
      <ElFormItem :label="$t('page.manage.role.roleName')" prop="name">
        <ElInput v-model="model.name" :placeholder="$t('page.manage.role.form.roleName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleStatus')" prop="status">
        <ElRadioGroup v-model="model.status">
          <ElRadio v-for="{ label, value } in enableStatusOptions" :key="value" :value="value" :label="$t(label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleDesc')" prop="description">
        <ElInput v-model="model.description" :placeholder="$t('page.manage.role.form.roleDesc')" />
      </ElFormItem>
    </ElForm>
    <ElSpace v-if="isEdit">
      <ElButton @click="openMenuAuthModal">{{ $t('page.manage.role.menuAuth') }}</ElButton>
      <MenuAuthModal v-model:visible="menuAuthVisible" :role-id="roleId" />
      <ElButton @click="openButtonAuthModal">{{ $t('page.manage.role.buttonAuth') }}</ElButton>
      <ButtonAuthModal v-model:visible="buttonAuthVisible" :role-id="roleId" />
    </ElSpace>
    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped></style>
