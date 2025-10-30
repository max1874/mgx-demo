# Supabase 认证配置说明

## 问题
注册时提示需要邮件验证,但未配置邮件服务。

## 解决方案

已在代码中实现了注册后自动登录的逻辑,但还需要在 Supabase 后台配置以完全禁用邮件验证。

### 1. 代码修改 (已完成)

在 `frontend/src/contexts/AuthContext.tsx` 中:
- 注册时添加了自动登录逻辑
- 如果注册后没有 session,会立即尝试登录

### 2. Supabase 后台配置 (需要手动完成)

访问您的 Supabase 项目控制台并完成以下设置:

#### 步骤:

1. **登录 Supabase 控制台**
   - 访问: https://supabase.com/dashboard

2. **进入项目设置**
   - 选择您的项目
   - 点击左侧菜单 "Authentication" → "Settings"

3. **禁用邮件确认**
   - 找到 "Email Auth" 部分
   - **取消勾选** "Enable email confirmations"
   - 或者设置 "Confirm email" 为 `disabled`

4. **保存设置**
   - 点击 "Save" 保存配置

#### 可选:配置其他认证设置

在 Authentication → Settings 页面中,您还可以配置:

- **最小密码长度**: 建议保持默认 6 位
- **启用自动确认**: 确保 "Enable email confirmations" 为关闭状态
- **允许的注册域名**: 如需限制特定邮箱域名才能注册

### 3. 测试

配置完成后:

1. 访问应用注册页面
2. 输入邮箱和密码
3. 点击注册
4. 应该会立即跳转到首页,无需邮件验证

### 4. 注意事项

- 禁用邮件验证后,任何人都可以使用任意邮箱注册(即使不拥有该邮箱)
- 建议在生产环境中:
  - 保持邮件验证开启
  - 配置邮件服务 (SMTP)
  - 或使用 Supabase 内置的邮件服务

### 5. 生产环境建议

如果要在生产环境中使用邮件验证:

1. 在 Supabase 控制台配置 SMTP 设置
2. 或使用 Supabase 的内置邮件服务
3. 启用邮件确认功能
4. 自定义邮件模板 (可选)

配置路径: Authentication → Email Templates
