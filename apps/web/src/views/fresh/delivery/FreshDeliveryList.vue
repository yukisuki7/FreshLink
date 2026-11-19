<template>
  <PageWrapper title="生鲜配送">
    <a-alert v-if="error" type="error" :message="error" show-icon class="mb-3" />
    <BasicTable @register="registerTable">
      <template #action="{ record }">
        <a-button type="link" @click="open(record.id)">详情</a-button>
      </template>
    </BasicTable>
    <a-modal v-model:open="visible" title="配送详情" :footer="null" :width="940" :closable="!busy" :mask-closable="!busy">
      <a-spin :spinning="busy">
        <a-alert v-if="detailError" type="error" :message="detailError" show-icon class="mb-3" />
        <template v-if="current">
          <a-descriptions bordered size="small" :column="2">
            <a-descriptions-item label="配送单号">{{ current.id }}</a-descriptions-item>
            <a-descriptions-item label="关联出库">{{ current.outboundNumber }}</a-descriptions-item>
            <a-descriptions-item label="配送门店">{{ current.storeName }}</a-descriptions-item>
            <a-descriptions-item label="配送地址">{{ current.storeAddress }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ deliveryLabels[current.status] ?? current.status }}</a-descriptions-item>
            <a-descriptions-item label="登记时间">{{ current.createdAt ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="开始配送">{{ showEvent(current.dispatchAt, current.dispatchBy) }}</a-descriptions-item>
            <a-descriptions-item label="确认送达">{{ showEvent(current.deliveredAt, current.deliveredBy) }}</a-descriptions-item>
            <a-descriptions-item label="配送员">{{ current.driverName ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="联系方式">{{ current.driverPhone ?? '—' }}</a-descriptions-item>
            <a-descriptions-item v-if="current.remark" label="备注" :span="2">{{ current.remark }}</a-descriptions-item>
          </a-descriptions>
          <FreshLotTable :items="current.items ?? []" class="my-4" />
          <a-form v-if="canWrite && current.status === 'PENDING'" :model="form" layout="vertical" @finish="save">
            <a-form-item label="配送员" required><a-input v-model:value="form.driverName" :maxlength="64" /></a-form-item>
            <a-form-item label="联系方式" required><a-input v-model:value="form.driverPhone" :maxlength="32" /></a-form-item>
            <a-form-item label="备注"><a-input v-model:value="form.remark" :maxlength="255" /></a-form-item>
            <a-space>
              <a-button html-type="submit" :disabled="busy">保存配送资料</a-button>
              <a-popconfirm title="开始本单配送？" @confirm="advance('start')">
                <a-button type="primary" :disabled="busy || !hasSavedDriver(current)">开始配送</a-button>
              </a-popconfirm>
            </a-space>
          </a-form>
          <a-popconfirm
            v-if="canWrite && current.status === 'IN_TRANSIT'"
            title="登记物流已送达？此操作不会再次扣减库存。"
            @confirm="advance('finish')"
          >
            <a-button type="primary" :disabled="busy">确认送达</a-button>
          </a-popconfirm>
        </template>
      </a-spin>
    </a-modal>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
  import { PageWrapper } from '/@/components/Page';
  import { BasicTable, useTable } from '/@/components/Table';
  import FreshLotTable from '../FreshLotTable.vue';
  import { listDeliveries, getDelivery, saveDispatch, startDelivery, finishDelivery, type Delivery } from '../freshWorkflow.api';
  import { useFreshWorkflowAccess } from '../freshWorkflowAccess';
  import { deliveryLabels, hasSavedDriver, normalizeDriver } from './deliveryState';

  const props = defineProps<{ selectedId?: string; readOnly?: boolean }>();
  const access = useFreshWorkflowAccess();
  const canWrite = computed(() => !props.readOnly && access.canWrite.value);
  const visible = ref(false);
  const busy = ref(false);
  const error = ref<string>();
  const detailError = ref<string>();
  const current = ref<Delivery>();
  const form = reactive({ driverName: '', driverPhone: '', remark: '' });
  const [registerTable, { reload }] = useTable({
    api: async (params) => {
      error.value = undefined;
      try { return await listDeliveries(params); }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '加载配送列表失败';
        throw cause;
      }
    },
    rowKey: 'id',
    columns: [
      { title: '配送单号', dataIndex: 'id' },
      { title: '关联出库', dataIndex: 'outboundNumber' },
      { title: '配送门店', dataIndex: 'storeName' },
      { title: '配送地址', dataIndex: 'storeAddress' },
      { title: '配送员', dataIndex: 'driverName' },
      { title: '状态', dataIndex: 'status', customRender: ({ text }) => deliveryLabels[text] ?? text },
      { title: '登记时间', dataIndex: 'createdAt' },
    ],
    actionColumn: { title: '操作', width: 85, slots: { customRender: 'action' } },
  });

  let active = true;
  onBeforeUnmount(() => { active = false; });

  function showEvent(time?: string, actor?: string) {
    return time ? [time, actor].filter(Boolean).join(' · ') : '—';
  }

  async function load(action: () => Promise<Delivery>, refresh = false) {
    if (busy.value) return;
    busy.value = true;
    detailError.value = undefined;
    try {
      const result = await action();
      if (!active) return;
      current.value = result;
      Object.assign(form, { driverName: result.driverName ?? '', driverPhone: result.driverPhone ?? '', remark: result.remark ?? '' });
      if (refresh) void reload();
    } catch (cause) {
      detailError.value = cause instanceof Error ? cause.message : '配送操作失败，请重试';
    } finally {
      busy.value = false;
    }
  }

  function open(id: string) {
    if (busy.value) return;
    current.value = undefined;
    visible.value = true;
    void load(() => getDelivery(id));
  }

  function save() {
    const model = current.value;
    if (!canWrite.value || model?.status !== 'PENDING') return;
    const info = normalizeDriver(form);
    if (!info) {
      detailError.value = '请填写配送员及联系方式';
      return;
    }
    void load(() => saveDispatch(model.id, info), true);
  }

  function advance(action: 'start' | 'finish') {
    const model = current.value;
    if (!model || !canWrite.value) return;
    if (action === 'start' && model.status === 'PENDING' && hasSavedDriver(model)) {
      void load(() => startDelivery(model.id), true);
    } else if (action === 'finish' && model.status === 'IN_TRANSIT') {
      void load(() => finishDelivery(model.id), true);
    }
  }

  watch(() => props.selectedId, (id) => { if (id) open(id); }, { immediate: true });
</script>
