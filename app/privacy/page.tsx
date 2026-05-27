import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">隐私政策</h1>
      <p className="text-sm text-slate-400 mb-8">最后更新: 2026-05-27</p>

      <article className="prose prose-slate dark:prose-invert max-w-none space-y-5 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          欢迎使用 SellBridge。我们深知个人信息对您的重要性，本隐私政策将说明我们如何收集、使用、存储和保护您的信息。使用 SellBridge 即表示您同意本隐私政策的全部条款。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">一、信息收集</h2>
        <p>我们在提供服务过程中可能收集以下信息：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>账户信息</strong>：注册时提供的电子邮箱地址，用于账户标识和登录验证。</li>
          <li><strong>店铺授权凭证</strong>：您在连接 Shopify / Lazada / Shopee / TikTok Shop 等第三方平台时提供的 API 密钥或访问令牌。</li>
          <li><strong>商品数据</strong>：您提交的商品标题、描述、图片、价格、库存等信息，用于翻译和上架服务。</li>
          <li><strong>使用日志</strong>：系统自动记录的操作时间、调用次数、错误日志，仅用于服务优化和故障排查。</li>
        </ul>
        <p>我们不收集您的真实姓名、身份证号、手机号码、银行卡号等敏感个人信息。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">二、信息使用</h2>
        <p>收集的信息仅用于以下目的：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>提供核心服务：AI 翻译、商品上架、订单管理、库存同步。</li>
          <li>向第三方电商平台 API 发起请求（以您的授权凭证身份）。</li>
          <li>额度管理和交易记录。</li>
          <li>服务改进和故障处理。</li>
        </ul>
        <p>我们不会将您的信息用于广告投放、用户画像分析或出售给第三方。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">三、信息存储与安全</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>存储位置</strong>：数据存储在 Railway 云平台（美国节点）。我们采用 PostgreSQL 数据库，实行访问控制。</li>
          <li><strong>API 密钥加密</strong>：您的第三方平台 API 密钥采用 AES-256-GCM 算法加密存储，仅在使用时解密。我们无法在您未发起操作时读取您的密钥明文。</li>
          <li><strong>传输安全</strong>：所有数据传输通过 HTTPS/TLS 加密。但我们无法保证互联网传输的绝对安全。</li>
          <li><strong>数据保留</strong>：您关闭账户后，我们将在 30 天内删除您的个人信息。部分匿名化的使用统计可能保留更长时间。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">四、跨境数据传输</h2>
        <p>
          SellBridge 服务器目前部署在美国 Railway 平台。您在中国境内提交的信息将传输至境外服务器处理。我们已采取前述安全措施保护您的信息安全。若您对数据跨境有顾虑，建议评估后谨慎使用本服务。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">五、第三方服务</h2>
        <p>
          本服务核心功能需要与您授权的第三方平台 API 通信（Shopify、Lazada、Shopee、TikTok Shop）。您在对应平台的账户信息和操作行为受各平台自身的隐私政策约束。AI 翻译功能调用 Anthropic / DeepSeek API，您的商品标题和描述将作为翻译提示词发送给上述 AI 服务商，其数据处理方式受各自隐私政策约束。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">六、您的权利</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>查阅与更正</strong>：您可以在用户中心查看和更新账户信息。</li>
          <li><strong>删除</strong>：您可以随时删除已存储的商品数据和店铺连接，或联系我们注销账户。</li>
          <li><strong>导出</strong>：您可以通过客服联系我们，申请导出您的个人数据副本。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">七、未成年人保护</h2>
        <p>本服务面向跨境电商从业者。我们无意收集未满 18 周岁人士的个人信息。如您是未成年人，请在监护人指导下使用。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">八、政策更新</h2>
        <p>我们可能不时更新本隐私政策。重大变更将通过站内通知或邮件告知。继续使用服务即表示接受更新后的条款。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">九、联系方式</h2>
        <p>如对本隐私政策有任何疑问或行使您的数据权利，请通过以下方式联系我们：</p>
        <p>邮箱：sellbridge@outlook.com</p>
      </article>
    </div>
  );
}
