import type { Menu } from '../../src/router/types';
import { applyFreshDemoMenu, hasMenuPath, shouldUseFreshDemoMenu } from '../../src/router/helper/freshDemoMenu';

test('课堂模式必须显式开启且保留管理员的完整导航', () => {
  const writePermissions = ['outorder:wms_out_orders:add'];
  const storeMenus = [{ name: '我的门店', path: '/fresh/my-store' }];
  expect(shouldUseFreshDemoMenu(false, 'legacy_operator', writePermissions, [])).toBe(false);
  expect(shouldUseFreshDemoMenu(false, 'fresh_store_a', [], storeMenus)).toBe(false);
  expect(shouldUseFreshDemoMenu(true, 'ADMIN', writePermissions, storeMenus)).toBe(false);
  expect(shouldUseFreshDemoMenu(true, 'unrelated_user', [], [])).toBe(false);
  expect(shouldUseFreshDemoMenu(true, 'fresh_wh', writePermissions, [])).toBe(true);
  expect(shouldUseFreshDemoMenu(true, 'fresh_store_a', [], storeMenus)).toBe(true);
});

test('课堂菜单保留后端授予的入口，移除旧波次并收口标签', () => {
  const granted: Menu[] = [
    { name: '库存', path: '/inventory', children: [{ name: '库存查询', path: '/inventory/wmsInventoryList' }] },
    { name: '出库', path: '/outorder', children: [
      { name: '出库单', path: '/outorder/wmsOutOrdersList' },
      { name: '波次管理', path: '/wave/wmsWaveMasterList' },
    ] },
    { name: '隐藏的食材页', path: '/fresh/products', hideMenu: true },
  ];
  const demo = applyFreshDemoMenu(granted);
  expect(demo.map(({ children }) => children?.map(({ name }) => name))).toEqual([['库存与效期'], ['选批出库与配送']]);
  expect(hasMenuPath(demo, '/fresh/my-store')).toBe(false);
  expect(hasMenuPath(demo, '/fresh/products')).toBe(false);
  expect(hasMenuPath(granted, '/wave/wmsWaveMasterList')).toBe(true);
});

test('门店保留本店配送入口，课堂菜单不会为门店添加仓储作业', () => {
  const demo = applyFreshDemoMenu([{ name: '我的门店', path: '/fresh/my-store' }]);
  expect(demo).toHaveLength(1);
  expect(demo[0].name).toBe('我的门店与配送');
  expect(hasMenuPath(demo, '/outorder/wmsOutOrdersList')).toBe(false);
});
