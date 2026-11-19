<template>
  <a-tabs v-model:active-key="active" class="px-4">
    <a-tab-pane key="outbound" tab="人工选批出库">
      <FreshOutboundList :stock-batch-key="stockBatchKey" @clear-batch="clearBatch" @delivery="showDelivery" />
    </a-tab-pane>
    <a-tab-pane key="delivery" tab="生鲜配送">
      <FreshDeliveryList :key="deliveryNavigation" :selected-id="deliveryId" />
    </a-tab-pane>
  </a-tabs>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import FreshOutboundList from './outbound/FreshOutboundList.vue';
  import FreshDeliveryList from './delivery/FreshDeliveryList.vue';

  const route = useRoute();
  const router = useRouter();
  const active = ref('outbound');
  const deliveryId = ref<string>();
  const deliveryNavigation = ref(0);
  const stockBatchKey = computed(() => typeof route.query.stockBatchKey === 'string' ? route.query.stockBatchKey : undefined);
  watch(
    [stockBatchKey, () => route.query.tab],
    ([key, tab]) => {
      active.value = !key && tab === 'delivery' ? 'delivery' : 'outbound';
    },
    { immediate: true },
  );

  function showDelivery(id: string) {
    deliveryId.value = id;
    deliveryNavigation.value++;
    active.value = 'delivery';
  }

  function clearBatch() {
    const query = { ...route.query };
    delete query.stockBatchKey;
    void router.replace({ path: route.path, query });
  }
</script>
