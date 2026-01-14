# Google Analytics 和 AdSense 集成指南（Cookie 同意管理）

本指南说明如何为 Eraserly 集成 Google Analytics 和 Google AdSense，并实现符合 GDPR 的 Cookie 同意管理。

## 目录

1. [概述](#概述)
2. [Google Analytics 集成](#google-analytics-集成)
3. [Google AdSense 集成](#google-adsense-集成)
4. [完整实现代码](#完整实现代码)
5. [测试实现](#测试实现)

---

## 概述

### GDPR 合规的关键原则

1. **选择加入（Opt-in）**：只有在用户同意后才启用分析和广告 Cookie
2. **易于撤销**：用户必须能够随时撤销同意
3. **精细化控制**：不同类型的 Cookie（必需、分析、广告）应可分别控制

### 同意状态

| 状态      | 说明               | 启用的内容         |
| --------- | ------------------ | ------------------ |
| `dismiss` | 用户点击"接受全部" | 分析 + 广告 Cookie |
| `deny`    | 用户点击"拒绝"     | 仅必需 Cookie      |
| `revoked` | 用户改变主意       | 根据新选择执行     |

---

## Google Analytics 集成

### 步骤 1：获取您的衡量 ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建一个 GA4 媒体资源
3. 复制您的 **衡量 ID**（格式：`G-XXXXXXXXXX`）

### 步骤 2：安装 Google Analytics（代码方式）

将以下代码添加到您的 `index.html`，放在 `</head>` 标签**之前**：

```html
<!-- Google Analytics (GA4) - Cookie 同意控制 -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || []

  function gtag() {
    dataLayer.push(arguments)
  }

  // 重要：默认禁用 GA，直到用户同意
  // 将 G-XXXXXXXXXX 替换为您的实际衡量 ID
  window['ga-disable-G-XXXXXXXXXX'] = true

  gtag('js', new Date())
  gtag('config', 'G-XXXXXXXXXX', {
    // 在用户同意前不发送页面浏览
    send_page_view: false,
  })
</script>
```

### 步骤 3：更新 Cookie 同意函数

在 `index.html` 中，更新 `enableCookies()` 和 `disableCookies()` 函数：

```javascript
function enableCookies() {
  console.log('用户已同意，启用 Cookie')

  // 启用 Google Analytics
  // 将 G-XXXXXXXXXX 替换为您的实际衡量 ID
  window['ga-disable-G-XXXXXXXXXX'] = false

  // 现在已获得同意，发送初始页面浏览
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
  })

  // 启用 Google AdSense（见下方 AdSense 部分）
  // 集成 AdSense 时将添加此部分
}

function disableCookies() {
  console.log('用户拒绝，禁用 Cookie')

  // 禁用 Google Analytics
  // 将 G-XXXXXXXXXX 替换为您的实际衡量 ID
  window['ga-disable-G-XXXXXXXXXX'] = true

  // 禁用 Google AdSense
  // 集成 AdSense 时将添加此部分
}
```

---

## Google AdSense 集成

### 步骤 1：获取您的 AdSense 代码

1. 访问 [Google AdSense](https://www.google.com/adsense/)
2. 创建账户并添加您的网站（eraserly.qzz.io）
3. 获取您的 **AdSense 发布商 ID**（格式：`ca-pub-XXXXXXXXXXXXXXXX`）

### 步骤 2：将 AdSense 代码添加到 index.html

将以下代码添加在现有 Cookie 同意脚本**之后**：

```html
<!-- Google AdSense - Cookie 同意控制 -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossorigin="anonymous"
></script>
<script>
  // 默认禁用个性化广告，直到用户同意
  window.adsbygoogle = window.adsbygoogle || []
</script>
```

### 步骤 3：创建广告单元

对于网站上的每个广告位，添加：

```html
<!-- 示例：横幅广告 -->
<ins
  class="adsbygoogle"
  style="display: block"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"
  data-full-width-responsive="true"
></ins>
<script>
  // 注意：广告在用户同意前不会加载
  // 见下方的 enableCookies() 函数
</script>
```

### 步骤 4：为 AdSense 更新 Cookie 同意函数

```javascript
function enableCookies() {
  console.log('用户已同意，启用 Cookie')

  // 启用 Google Analytics
  window['ga-disable-G-XXXXXXXXXX'] = false
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
  })

  // 启用 Google AdSense - 加载并显示广告
  ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  })
}

function disableCookies() {
  console.log('用户拒绝，禁用 Cookie')

  // 禁用 Google Analytics
  window['ga-disable-G-XXXXXXXXXX'] = true

  // 禁用 Google AdSense - 拒绝广告同意
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}
```

---

## 完整实现代码

### index.html 完整的 Cookie 同意部分

以下是完整的生产级实现代码。请替换占位符值：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Eraserly</title>

    <!-- ========================================= -->
    <!-- 步骤 1: Google Analytics (GA4)           -->
    <!-- ========================================= -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || []
      function gtag() {
        dataLayer.push(arguments)
      }

      // 默认禁用 GA - GDPR 合规
      window['ga-disable-G-XXXXXXXXXX'] = true

      gtag('js', new Date())

      // 配置同意模式 - 默认为拒绝
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        region: [
          'AT',
          'BE',
          'BG',
          'HR',
          'CY',
          'CZ',
          'DK',
          'EE',
          'FI',
          'FR',
          'DE',
          'GR',
          'HU',
          'IS',
          'IE',
          'IT',
          'LV',
          'LT',
          'LU',
          'MT',
          'NL',
          'NO',
          'PL',
          'PT',
          'RO',
          'SK',
          'SI',
          'ES',
          'SE',
          'CH',
          'GB',
          'LI',
        ], // 欧盟/欧洲经济区国家 + 英国
      })

      gtag('config', 'G-XXXXXXXXXX', {
        send_page_view: false,
      })
    </script>

    <!-- Cookie 同意 CSS -->
    <link
      rel="stylesheet"
      type="text/css"
      href="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.css"
    />
    <style>
      .cc-window {
        background: #1f2937 !important
        color: #e5e7eb !important
        border: 1px solid #374151 !important
      }
      .cc-btn {
        background: #3b82f6 !important
        color: #ffffff !important
      }
      .cc-btn:hover {
        background: #2563eb !important
      }
    </style>
  </head>
  <body class="h-screen bg-gray-900">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root" class="h-full"></div>

    <script type="module" src="/src/index.tsx"></script>

    <!-- ========================================= -->
    <!-- 步骤 2: Cookie 同意横幅                   -->
    <!-- ========================================= -->
    <script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
    <script>
      // 您的衡量 ID 和发布商 ID
      const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'
      const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'

      window.addEventListener('load', function () {
        window.cookieconsent.initialise({
          palette: {
            popup: { background: '#1f2937', text: '#e5e7eb' },
            button: { background: '#3b82f6', text: '#ffffff' },
          },
          theme: 'edgeless',
          position: 'bottom',
          static: false,
          content: {
            message:
              '我们使用 Cookie 和类似技术来增强您的体验、分析使用情况并提供个性化广告。您可以在页脚中查看我们的隐私政策。',
            dismiss: '接受全部',
            deny: '拒绝',
            link: null,
            href: null,
          },
          onInitialise: function (status) {
            var type = this.options.type
            var didConsent = this.hasConsented()
            if (type == 'opt-in' && didConsent) {
              enableCookies()
            }
          },
          onStatusChange: function (status, chosenBefore) {
            var type = this.options.type
            var didConsent = this.hasConsented()
            if (type == 'opt-in' && didConsent) {
              enableCookies()
            } else {
              disableCookies()
            }
          },
          onRevokeChoice: function () {
            var type = this.options.type
            if (type == 'opt-in') {
              disableCookies()
            }
          },
          type: 'opt-in',
          law: { regionalLaw: true },
          location: true,
          revokable: true,
          expires: 365,
        })
      })

      // ========================================= -->
      // 步骤 3: 启用/禁用函数                      -->
      // ========================================= -->

      function enableCookies() {
        console.log('用户已同意，启用 Cookie')

        // 启用 Google Analytics
        window['ga-disable-' + GA_MEASUREMENT_ID] = false

        // 发送初始页面浏览
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          send_to: GA_MEASUREMENT_ID,
        })

        // 更新 Google 同意为已授权
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        })

        // 启用 AdSense 广告（如果 AdSense 已加载）
        if (window.adsbygoogle) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        }

        console.log('Google Analytics 和 AdSense 已启用')
      }

      function disableCookies() {
        console.log('用户拒绝，禁用 Cookie')

        // 禁用 Google Analytics
        window['ga-disable-' + GA_MEASUREMENT_ID] = true

        // 更新 Google 同意为已拒绝
        gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        })

        console.log('Google Analytics 和 AdSense 已禁用')
      }
    </script>

    <!-- ========================================= -->
    <!-- 步骤 4: Google AdSense (可选)             -->
    <!-- ========================================= -->
    <!-- 获得 AdSense 账户后取消注释 -->
    <!--
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
      crossorigin="anonymous"
    ></script>
    -->
  </body>
</html>
```

---

## 测试实现

### 1. 测试 Cookie 同意横幅

打开您的网站并验证：

- [ ] Cookie 横幅出现在底部
- [ ] "接受全部" 按钮正常工作
- [ ] "拒绝" 按钮正常工作
- [ ] 横幅记住您的选择 365 天

### 2. 测试 Google Analytics

**启用 Cookie 并检查：**

```javascript
// 在浏览器控制台中，点击"接受全部"后：
console.log(window['ga-disable-G-XXXXXXXXXX']) // 应该为 false
```

**检查网络请求：**

- 打开 Chrome DevTools → Network 标签
- 过滤 "google-analytics.com"
- 点击"接受全部" - 您应该看到对 `google-analytics.com/g/collect` 的请求
- 点击"拒绝" - 不应该发出任何请求

**实时测试：**

1. 进入 Google Analytics → 实时报告
2. 在隐身窗口中打开您的网站
3. 接受 Cookie - 您应该出现在实时报告中
4. 拒绝 Cookie - 您不应该出现

### 3. 测试 Google AdSense

集成 AdSense 后：

```javascript
// 检查广告是否已加载
document.getElementsByClassName('adsbygoogle').length
```

### 4. 测试同意撤销

1. 点击 Cookie 同意小部件（接受后位于右下角）
2. 更改您的选择
3. 在控制台中验证 Cookie 相应地启用/禁用

---

## 总结清单

- [ ] 将 `G-XXXXXXXXXX` 替换为您的实际 Google Analytics 衡量 ID
- [ ] 将 `ca-pub-XXXXXXXXXXXXXXXX` 替换为您的实际 AdSense 发布商 ID
- [ ] 测试 Cookie 横幅正确显示
- [ ] 测试使用"接受全部"启用 Google Analytics
- [ ] 测试使用"拒绝"禁用 Google Analytics
- [ ] 测试 AdSense 广告根据同意显示/隐藏
- [ ] 测试同意撤销功能
- [ ] 验证欧盟用户的 GDPR 合规性

---

## 其他资源

- [GDPR 的 Google Analytics](https://support.google.com/analytics/answer/9976101)
- [Cookie 同意的 Google AdSense](https://support.google.com/adsense/answer/9036326)
- [Google 同意模式](https://developers.google.com/tag-platform/security/guides/consent)
- [GDPR 合规指南](https://www.gdpr.eu/)

---

## 需要帮助？

如果遇到问题：

1. 检查浏览器控制台是否有错误
2. 验证您的衡量 ID 是否正确
3. 清除浏览器 Cookie 并重新测试
4. 检查 Google Analytics 实时报告

---

## 常见问题

### Q1：为什么默认禁用 Google Analytics？

**A**：GDPR 要求默认禁用跟踪，直到用户明确同意。这通过设置 `window['ga-disable-G-XXXXXXXXXX'] = true` 实现。

### Q2：用户撤销同意后会发生什么？

**A**：

- Google Analytics 停止发送数据
- Google AdSense 停止显示个性化广告
- `gtag('consent', 'update', ...)` 通知 Google 更新同意状态

### Q3：我需要为欧盟/英国用户提供不同的体验吗？

**A**：代码中的 `region` 参数已经指定了欧盟/欧洲经济区/英国国家，这些地区会显示 Cookie 横幅并要求同意。

### Q4：如何检查用户是否已同意？

**A**：

```javascript
// 检查 cookieconsent 的状态
const status = window.cookieconsent.getStatus()
console.log(status) // 'dismiss', 'deny', 或 'allow'
```

### Q5：AdSense 广告在用户拒绝后会显示吗？

**A**：仍会显示广告，但不会使用个性化定位。用户会看到通用的、非个性化的广告。
