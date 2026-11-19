<template>
  <main class="p-6">
    <a-card>
      <h1 class="mb-3 text-2xl font-semibold">{{ title }}</h1>
      <a-space wrap>
        <router-link v-for="link in links" :key="link.label" :to="link.to">
          <a-button>{{ link.label }}</a-button>
        </router-link>
      </a-space>
    </a-card>
  </main>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useGlobSetting } from '/@/hooks/setting';
  import { usePermissionStore } from '/@/store/modules/permission';
  import { deliveryPath, hasMenuPath } from '/@/router/helper/freshDemoMenu';

  const { title } = useGlobSetting();
  const permissions = usePermissionStore();
  const steps = [
    { label: '食材资料', to: { path: '/fresh/products' } },
    { label: '批次入库', to: { path: '/inorder/wmsStockInOrdersList' } },
    { label: '收货', to: { path: '/inorder/wmsReceiveTasksList' } },
    { label: '上架', to: { path: '/inorder/wmsPutwayTasksList' } },
    { label: '库存与效期', to: { path: '/inventory/wmsInventoryList' } },
    { label: '人工选批出库', to: { path: deliveryPath } },
    { label: '生鲜配送', to: { path: deliveryPath, query: { tab: 'delivery' } } },
    { label: '本店与配送查询', to: { path: '/fresh/my-store' } },
  ];
  const links = computed(() => steps.filter(({ to }) => hasMenuPath(permissions.getBackMenuList, to.path)));
</script>
