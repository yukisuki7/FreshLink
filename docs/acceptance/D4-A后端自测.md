# D4 A 侧后端自测

2026-11-19。验证基线为 `main@1f2c8377a542b9dd8c7847911b5aa22bd9c7cacb`，包含 D3 后端 PR #6 和前端 PR #7。本批补齐团队本机开发指南的迁移顺序和已有库升级步骤。后端源码、SQL 与 D3 接口合同沿用该基线。

## 构建与回归

使用 JDK 17 和已下载依赖的 Maven 缓存离线构建。以下命令从仓库根目录执行，`$settings` 和 `$repo` 使用团队脚本约定的路径。若离线缓存尚未准备，先运行团队指南中的后端构建命令。

```powershell
$settings = (Resolve-Path .\.mvn\settings.xml).Path
$repo = (Resolve-Path .\runtime\cache\maven-repository).Path
Push-Location .\apps\backend
try {
    mvn -o -s $settings "-Dmaven.repo.local=$repo" -B -ntp -Pp0-tests -pl jeecg-module-system/jeecg-system-start -am package
} finally {
    Pop-Location
}
```

- 退出码 0，19 项测试通过，失败、错误及跳过均为 0。
- 启动 JAR 的 SHA256 为 `CB1E970E5AA489B59FC34EB9B4405054EFBC4292434A7CF4F708B11895268FA7`。
- 复用已迁移的独立 MySQL 测试库和独立 Redis。连接池会话位于目标测试库，应用账号的业务授权仅限该库。按顺序重跑 `D3_00_outbound.sql` 和 `D3_01_delivery.sql` 两次，迁移记录、唯一索引和已有单据数量一致。已有 D2 库的升级步骤见[团队本机开发指南](../团队本机开发指南.md)。
- `python scripts/Invoke-FreshD3ApiProbe.py` 退出码 0，112 项断言通过。新收货 10 袋和 20 袋，上架合计仍是 30 袋；确认出库 6 袋后两批分别剩 4 袋和 20 袋。过期与库存不足被拒绝，重复确认复用同一配送单，门店账号仅能读取本店配送。
- 使用 `scripts/team/Start-TeamBackend.ps1` 启动，停止该隔离后端的 Java 进程后用同一脚本重启。仓管和门店账号重新登录成功。数据库仍有已确认出库、已送达配送、唯一一条 `-6` 库存流水，库存仍为 24 袋。

## 复跑 API 探针

在已应用 D3 迁移并启动后端的隔离演示库上执行。先核对目标实例与库名，再在仓库根目录配置以下环境变量。

- `FRESHLINK_API_ROOT` 为该实例 API 根地址，包含 `/jeecg-boot`。
- `FRESHLINK_ACCESS_TOKEN` 和 `FRESHLINK_OPERATOR_ID` 为本机仓管测试账号的登录令牌和用户 ID。
- `D3_STORE_A_TOKEN` 和 `D3_STORE_B_TOKEN` 为两家本机测试门店的登录令牌，用于复跑门店访问断言。
- `FRESHLINK_EVIDENCE_DIR` 指向本 checkout 的 `work/` 下一个新的证据目录。

从仓库根运行 `python scripts/Invoke-FreshD3ApiProbe.py`。该探针会创建测试单据并写入库存，凭据仅在本机提供。

## 联调交接

B 可基于当前 `main` 并行进行浏览器全链、前端构建与类型诊断、启动和演示材料。该批只有文档差异，若后续改动触及接口、数据库或权限，在最终组合版本上重跑对应受影响用例。

D3 的回滚故障注入和门店改址、禁用用例沿用 D3 交付记录，后端和探针脚本与该记录对应版本一致。D4 课堂实例的前后端联合重启、浏览器全链、旧 Excel 导入页面与负责人最终验收仍待验证。原始构建、接口及库存对账结果保存在本机 `work/fresh-acceptance/D4/attempt-01/`。
