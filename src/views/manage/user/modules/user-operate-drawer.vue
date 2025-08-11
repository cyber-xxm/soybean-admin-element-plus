<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { enableStatusOptions, userGenderOptions } from '@/constants/business';
import { createUser, fetchGetRoleList, updateUser } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import { useLoading } from '~/packages/hooks';

defineOptions({ name: 'UserOperateDrawer' });

const { startLoading, endLoading } = useLoading();

interface Props {
  /** the type of operation */
  operateType: UI.TableOperateType;
  /** the edit row data */
  rowData?: Api.SystemManage.User | null;
}

const props = defineProps<Props>();

const userId = computed(() => props.rowData?.id || '');

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.user.addUser'),
    edit: $t('page.manage.user.editUser')
  };
  return titles[props.operateType];
});

type Model = Pick<Api.SystemManage.User, 'username' | 'gender' | 'name' | 'phone' | 'email' | 'roles' | 'status'>;

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    username: '',
    gender: undefined,
    name: '',
    phone: '',
    email: '',
    roles: [],
    status: undefined
  };
}

const rolesIds = ref<string[]>([]);

type RuleKey = Extract<keyof Model, 'username' | 'status'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  username: defaultRequiredRule,
  status: defaultRequiredRule
};

/** the enabled role options */
const roleOptions = ref<CommonType.Option<any>[]>([]);

async function getRoleOptions() {
  const params = {
    result_type: 'select'
  };
  const { error, data } = await fetchGetRoleList(params);

  if (!error) {
    const options = data?.data.map(item => ({
      label: item.name,
      value: item.id
    }));

    // the mock data does not have the roleCode, so fill it
    // if the real request, remove the following code
    const userRoleOptions = model.value.roles.map(item => ({
      label: item.name,
      value: item.id
    }));
    // end

    roleOptions.value = [...userRoleOptions, ...options];
  }
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    // Object.assign(model.value, props.rowData);
    model.value.name = props.rowData.name;
    model.value.username = props.rowData.username;
    model.value.gender = props.rowData.gender;
    model.value.phone = props.rowData.phone;
    model.value.email = props.rowData.email;
    model.value.status = props.rowData.status;
    rolesIds.value = props.rowData.roles.map(item => item.id);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  // request
  startLoading();
  model.value.roles = rolesIds.value.map(id => {
    const option = roleOptions.value.find(opt => opt.value === id);
    return {
      id,
      name: option?.label || '未知角色'
    } as Api.SystemManage.Role;
  });
  const { error } =
    props.operateType === 'add'
      ? await createUser(model.value as Api.SystemManage.User)
      : await updateUser(userId.value, model.value as Api.SystemManage.User);

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
    getRoleOptions();
  }
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" draggable preset="card" class="w-800px">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
      <ElFormItem :label="$t('page.manage.user.username')" prop="username">
        <ElInput v-model="model.username" :placeholder="$t('page.manage.user.form.username')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userGender')" prop="gender">
        <ElRadioGroup v-model="model.gender">
          <ElRadio v-for="item in userGenderOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.nickName')" prop="name">
        <ElInput v-model="model.name" :placeholder="$t('page.manage.user.form.nickName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userPhone')" prop="phone">
        <ElInput v-model="model.phone" :placeholder="$t('page.manage.user.form.userPhone')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userEmail')" prop="email">
        <ElInput v-model="model.email" :placeholder="$t('page.manage.user.form.userEmail')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userStatus')" prop="status">
        <ElRadioGroup v-model="model.status">
          <ElRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userRole')" prop="roles">
        <ElSelect v-model="rolesIds" multiple :placeholder="$t('page.manage.user.form.userRole')">
          <ElOption v-for="{ label, value } in roleOptions" :key="value" :label="label" :value="value" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped></style>
