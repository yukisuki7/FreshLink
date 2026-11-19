import type { Menu } from '/@/router/types';

export const deliveryPath = '/outorder/wmsOutOrdersList';

const labels = new Map([
  ['/dashboard/analysis', '首页'],
  ['/fresh/products', '食材资料'],
  ['/fresh/suppliers', '供应商'],
  ['/fresh/stores', '门店'],
  ['/fresh/user-stores', '用户门店绑定'],
  ['/fresh/my-store', '我的门店与配送'],
  ['/warehouse/wmsWarehousesList', '仓库'],
  ['/warehouse/wmsStorageZonesList', '库区'],
  ['/warehouse/wmsStorageLocationsList', '储位'],
  ['/inorder/wmsStockInOrdersList', '批次入库单'],
  ['/inorder/wmsReceiveTasksList', '收货'],
  ['/inorder/wmsPutwayTasksList', '上架'],
  ['/inorder/wmsReceiveTasksRecordsList', '收货记录'],
  ['/inorder/wmsPutwayTasksRecordsList', '上架记录'],
  ['/inventory/wmsInventoryList', '库存与效期'],
  [deliveryPath, '选批出库与配送'],
]);

export function applyFreshDemoMenu(menus: Menu[]): Menu[] {
  return menus.flatMap<Menu>((menu) => {
    if (menu.hideMenu) return [];
    const children = applyFreshDemoMenu(menu.children ?? []);
    if (children.length) return [{ ...menu, children }];
    const name = labels.get(menu.path);
    return name ? [{ ...menu, children: undefined, name, meta: { ...menu.meta, title: name } }] : [];
  });
}

export function hasMenuPath(menus: Menu[], path: string): boolean {
  return menus.some((menu) => !menu.hideMenu && (menu.path === path || hasMenuPath(menu.children ?? [], path)));
}
