<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { loginModuleRecord } from '@/constants/app';
import { checkHealth } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'PwdLogin' });

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useForm();

interface FormModel {
  username: string;
  password: string;
}

const model = ref<FormModel>({
  username: 'admin',
  password: '123456'
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale ref, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    username: formRules.username,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login(model.value.username, model.value.password);
}

type AccountKey = 'super' | 'admin' | 'user';

interface Account {
  key: AccountKey;
  label: string;
  username: string;
  password: string;
}

const accounts = computed<Account[]>(() => [
  {
    key: 'super',
    label: $t('page.login.pwdLogin.superAdmin'),
    username: 'Super',
    password: '123456'
  },
  {
    key: 'admin',
    label: $t('page.login.pwdLogin.admin'),
    username: 'Admin',
    password: '123456'
  },
  {
    key: 'user',
    label: $t('page.login.pwdLogin.user'),
    username: 'User',
    password: '123456'
  }
]);

const serverReady = ref(false);

async function handleAccountLogin(account: Account) {
  if (!serverReady.value) {
    ElMessage.warning('后端服务未就绪，请稍候...');
    return;
  }
  await authStore.login(account.username, account.password);
}

// 循环检测后端健康状态
const checkServer = async () => {
  try {
    const { data } = await checkHealth();
    console.log(data, 'checkHealth');
    if (data) {
      serverReady.value = true;
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // ignore errors
  }
  setTimeout(checkServer, 2000);
};

onMounted(() => {
  checkServer();
});
</script>

<template>
  <div class="login-wrapper">
    <ElForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
      <ElFormItem prop="username">
        <ElInput v-model="model.username" :placeholder="$t('page.login.common.usernamePlaceholder')" />
      </ElFormItem>
      <ElFormItem prop="password">
        <ElInput
          v-model="model.password"
          type="password"
          show-password-on="click"
          :placeholder="$t('page.login.common.passwordPlaceholder')"
        />
      </ElFormItem>
      <ElSpace direction="vertical" :size="24" class="w-full" fill>
        <div class="flex-y-center justify-between">
          <ElCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</ElCheckbox>
          <ElButton text @click="toggleLoginModule('reset-pwd')">
            {{ $t('page.login.pwdLogin.forgetPassword') }}
          </ElButton>
        </div>
        <ElButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </ElButton>
        <div class="flex-y-center justify-between gap-12px">
          <ElButton class="flex-1" size="default" @click="toggleLoginModule('code-login')">
            {{ $t(loginModuleRecord['code-login']) }}
          </ElButton>
          <ElButton class="flex-1" size="default" @click="toggleLoginModule('register')">
            {{ $t(loginModuleRecord.register) }}
          </ElButton>
        </div>
        <ElDivider class="text-14px text-#666 !m-0">{{ $t('page.login.pwdLogin.otherAccountLogin') }}</ElDivider>
        <div class="flex-center gap-12px">
          <ElButton
            v-for="item in accounts"
            :key="item.key"
            size="default"
            type="primary"
            :disabled="authStore.loginLoading"
            @click="handleAccountLogin(item)"
          >
            {{ item.label }}
          </ElButton>
        </div>
      </ElSpace>
    </ElForm>
    <!-- 后端未就绪遮罩 -->
    <div v-if="!serverReady" class="server-wait-mask">
      <div class="mask-content">
        <ElIcon class="is-loading"><Loading /></ElIcon>
        <span>后端服务启动中，请稍候...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.server-wait-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.mask-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  color: #333;
}
.is-loading {
  font-size: 24px;
}
</style>
