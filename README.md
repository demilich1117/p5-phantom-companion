# P5 Phantom Companion

P5 · PHANTOM TALK 原生主题的配套扩展，当前版本1.2.0。提供桌面COMMAND指令轮盘、九个原生菜单的拼贴文字，以及Classic/Night切换和配色偏好保存。

## 安装

在SillyTavern扩展→安装扩展中粘贴：

https://github.com/demilich1117/p5-phantom-companion

刷新酒馆，然后另行导入作者提供的P5原生主题JSON。推荐搭配Open Tear 1.4.0；横幅头像、纸边、消息排版来自主题，单独安装本扩展不会带来完整美化。已手动安装同名p5-phantom-companion目录时，先保留旧版再用宿主扩展管理替换，避免同时装两份。

## 使用

- 桌面点击COMMAND展开轮盘；选择菜单、点击外部或Escape收起。手机保留主题横栏。
- 右上按钮切换Classic/Night。扩展设置P5 / DISPLAY MODE可选FOLLOW THEME、CLASSIC、NIGHT、FOLLOW SYSTEM。
- 旧配色选择会保留；想让Night主题决定配色，选择FOLLOW THEME。
- 切换到其他主题后隐藏自有控件；停用时清理自有装饰与事件。

## 兼容与数据

清单最低兼容ST1.18.0；实际浏览器验收为ST1.19.0。TT具备ready与context适配，但本次发布未在真实TT WebView验证。

纯前端扩展，无后端、无模型调用、无网络请求；只读主题变量并保存自己的显示偏好，不读取聊天内容或改写角色。原生菜单的功能仍由宿主管理。本仓库不含用户聊天、工程、测试头像或主题图片。

首次公开发布沿用已验证的1.2.0功能代码；Open Tear头像更新不要求旧用户升级扩展。
