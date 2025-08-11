<script setup lang="tsx">
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { deleteUser, fetchGetUserList } from '@/service/api';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserSearch from './modules/user-search.vue';

defineOptions({ name: 'UserManage' });

const {
  columns,
  columnChecks,
  list,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetUserList,
  showTotal: true,
  apiParams: {
    current: 1,
    page_size: 10,
    status: undefined,
    username: undefined,
    gender: undefined,
    name: undefined,
    phone: undefined,
    email: undefined
  },
  columns: () => [
    { type: 'selection', width: 48 },
    { prop: 'index', label: $t('common.index'), width: 64 },
    { prop: 'username', label: $t('page.manage.user.username'), minWidth: 100 },
    {
      prop: 'gender',
      label: $t('page.manage.user.userGender'),
      width: 100,
      formatter: row => {
        if (row.gender === undefined) {
          return '';
        }

        const tagMap: Record<Api.SystemManage.UserGender, UI.ThemeColor> = {
          1: 'primary',
          2: 'danger'
        };

        const label = $t(userGenderRecord[row.gender]);

        return <ElTag type={tagMap[row.gender]}>{label}</ElTag>;
      }
    },
    { prop: 'name', label: $t('page.manage.user.nickName'), minWidth: 100 },
    { prop: 'phone', label: $t('page.manage.user.userPhone'), width: 120 },
    { prop: 'email', label: $t('page.manage.user.userEmail'), minWidth: 200 },
    {
      prop: 'status',
      label: $t('page.manage.user.userStatus'),
      align: 'center',
      formatter: row => {
        if (row.status === undefined) {
          return '';
        }

        const tagMap: Record<Api.Common.EnableStatus, UI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        const label = $t(enableStatusRecord[row.status]);

        return <ElTag type={tagMap[row.status]}>{label}</ElTag>;
      }
    },
    {
      prop: 'operate',
      label: $t('common.operate'),
      align: 'center',
      formatter: row => (
        <div class="flex-center">
          <ElButton type="primary" plain size="small" onClick={() => edit(row.id)}>
            {$t('common.edit')}
          </ElButton>
          <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id)}>
            {{
              reference: () => (
                <ElButton type="danger" plain size="small">
                  {$t('common.delete')}
                </ElButton>
              )
            }}
          </ElPopconfirm>
        </div>
      )
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted,
  onDeleted
  // closeDrawer
} = useTableOperate(list, getData);

async function handleBatchDelete() {
  // eslint-disable-next-line no-console
  console.log(checkedRowKeys.value);
  // request
  const rows = checkedRowKeys.value;
  rows.forEach(id => {
    handleDelete(id);
  });
  await onBatchDeleted();
}

async function handleDelete(id: string) {
  // request
  const { error } = await deleteUser(id);

  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    await onDeleted();
  } else {
    window.$message?.error($t('common.deleteFailed'));
  }
}

function edit(id: string) {
  handleEdit(id);
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="sm:flex-1-hidden card-wrapper" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.user.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </div>
      </template>
      <div class="h-[calc(100%-50px)]">
        <ElTable
          v-loading="loading"
          height="100%"
          border
          class="sm:h-full"
          :data="list"
          row-key="id"
          @selection-change="checkedRowKeys = $event"
        >
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col" />
        </ElTable>
      </div>
      <div class="mt-20px flex justify-end">
        <ElPagination
          v-if="mobilePagination.total"
          layout="total,prev,pager,next,sizes"
          v-bind="mobilePagination"
          @current-change="mobilePagination['current-change']"
          @size-change="mobilePagination['size-change']"
        />
      </div>
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getDataByPage"
      />
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}
</style>
