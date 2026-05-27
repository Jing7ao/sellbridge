import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8">
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </Link>

      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">用户协议</h1>
      <p className="text-sm text-slate-400 mb-8">最后更新: 2026-05-27</p>

      <article className="prose prose-slate dark:prose-invert max-w-none space-y-5 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          请仔细阅读本用户协议后再使用 SellBridge 服务。注册或使用 SellBridge 即表示您已阅读、理解并同意本协议全部条款。如不同意本协议，请勿注册或使用本服务。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">一、定义</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>SellBridge</strong>：由个人开发者运营的跨境电商多平台上架工具，网址为 sellbridge.app。</li>
          <li><strong>用户</strong>：注册并使用 SellBridge 服务的跨境电商卖家。</li>
          <li><strong>额度</strong>：用户在本平台使用的虚拟服务单位，每次商品上架消耗 1 额度。额度不可兑换现金、不可转让。</li>
          <li><strong>第三方平台</strong>：Shopify、Lazada、Shopee、TikTok Shop 等用户授权的电商平台。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">二、服务说明</h2>
        <p>SellBridge 提供以下技术服务：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>AI 多语言翻译与商品标题 SEO 优化</li>
          <li>一键将商品信息同步上架至多个电商平台和市场</li>
          <li>多平台订单管理与库存同步</li>
          <li>跨境合规风险提示（商标、禁售品类、出口管制、关税参考）</li>
        </ul>
        <p>我们保留随时修改、暂停或终止部分或全部服务的权利，重大变更将提前通知用户。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">三、用户资格与义务</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>您须为具有完全民事行为能力的自然人或合法注册的企业主体。</li>
          <li>您须确保注册邮箱真实有效，并对账户下的所有活动负责。</li>
          <li>您不得利用本服务从事下列活动：
            <ul className="list-disc pl-5 mt-1">
              <li>上架假冒伪劣、侵犯知识产权的商品</li>
              <li>上架违反中国出口管制法律法规的商品</li>
              <li>上架违反目标市场国家/地区法律法规的商品</li>
              <li>利用本服务进行欺诈、洗钱、传销等违法犯罪活动</li>
              <li>对服务进行反向工程、爬取、DDoS 攻击等</li>
            </ul>
          </li>
          <li>您对自己提交的所有商品信息（标题、描述、图片、价格等）的合法性、真实性、准确性负全部责任。</li>
          <li>您须自行确保在第三方平台的运营行为符合各平台的服务条款和政策。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">四、第三方平台授权</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>使用本服务的上架功能，您须自行在对应电商平台获取 API 授权凭证（API Key、Access Token 等）。</li>
          <li>您授权 SellBridge 以您的名义通过上述 API 向第三方平台提交商品信息、查询订单和库存数据。这些操作的后果（包括但不限于商品被下架、店铺受处罚）由您自行承担。</li>
          <li>您可以随时在 SellBridge 中取消店铺连接，我们将删除存储的授权凭证。</li>
          <li>SellBridge 不属于 Shopify、Lazada、Shopee、TikTok Shop 的关联公司或官方合作方。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">五、额度与付费</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>新用户注册即获一定数量的免费额度，具体数量以注册时页面展示为准。</li>
          <li>额度的购买价格、套餐内容以定价页面展示为准，我们保留调整价格的权利。</li>
          <li>额度一经消耗不予退还，但因服务故障导致的上架失败除外。</li>
          <li>充值额度长期有效，但若账户连续 12 个月未使用，我们保留清理闲置账户额度的权利。</li>
          <li>邀请好友获得的奖励额度不可兑换现金。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">六、知识产权</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>我们的知识产权</strong>：SellBridge 的代码、界面设计、Logo、文档等均受著作权法保护。未经许可不得复制、修改、分发、反编译本软件。</li>
          <li><strong>您的知识产权</strong>：您提交的商品信息（标题、描述、图片等）的知识产权归属于您或您的授权方。您授予 SellBridge 仅为向您提供服务而必要的使用权（存储、传输、AI 处理）。我们不主张对您的商品信息享有任何所有权。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">七、合规风险提示（重要）</h2>
        <p>
          SellBridge 内置的合规检查功能（商标检测、禁售品类识别、出口管制提示、关税参考）基于关键词匹配和公开数据，<strong>仅供用户参考，不构成法律意见</strong>。合规检查通过不代表商品一定合法合规，未检测到风险不代表不存在风险。用户应自行或委托专业机构对商品进行全面的合规审查，包括但不限于：
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>在目标市场商标局查询商标注册情况</li>
          <li>核实目标市场的产品认证要求（如 TISI、SNI、SIRIM 等）</li>
          <li>确认商品是否属于中国出口管制或禁止出口范围</li>
          <li>咨询专业律师获得针对特定商品的法律意见</li>
        </ul>
        <p>
          AI 翻译结果由第三方 AI 服务自动生成，SellBridge 不对翻译内容的准确性、合规性、商标侵权风险作任何保证。用户应在发布前自行审核翻译内容。
        </p>
        <p>
          因用户商品信息侵犯第三方知识产权（商标权、专利权、著作权等）或违反法律法规引发的投诉、诉讼、行政处罚、店铺封禁等，由用户自行承担全部法律责任和经济损失。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">八、责任限制</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本服务按"现状"提供，我们不保证服务无中断、无错误、完全满足您的特定需求。</li>
          <li>因第三方平台 API 变更、故障、限流导致的上架失败或数据延迟，我们不承担责任。</li>
          <li>因不可抗力（自然灾害、战争、网络攻击、电力故障等）导致的服务中断，我们不承担责任。</li>
          <li>在任何情况下，SellBridge 对您的赔偿总额不超过您在过去 6 个月内向 SellBridge 支付的费用总额。</li>
          <li>任何情况下，SellBridge 不对间接损失（利润损失、商誉损失、数据丢失、业务中断等）承担责任。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">九、损害赔偿</h2>
        <p>
          如因您违反本协议或法律法规使用本服务，导致 SellBridge 遭受索赔、诉讼、行政处罚或经济损失（含合理的律师费），您同意赔偿 SellBridge 的全部损失。
        </p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">十、协议变更</h2>
        <p>我们保留随时修改本协议的权利。修改后的协议将在网站上发布，重大变更将通过站内通知或邮件告知。继续使用服务即表示接受修改后的协议。如不同意修改，应停止使用并注销账户。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">十一、终止</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>您可以随时停止使用本服务并联系我们注销账户。</li>
          <li>如您违反本协议或法律法规，我们有权立即终止服务、冻结或删除账户，无需事先通知。</li>
          <li>终止后，您在协议第三条（用户义务）、第六条（知识产权）、第七条（合规风险提示）、第八条（责任限制）项下的义务和条款仍然有效。</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">十二、法律适用与争议解决</h2>
        <p>本协议适用中华人民共和国法律。因本协议引起的争议，双方应友好协商解决；协商不成的，任何一方可将争议提交至开发者所在地有管辖权的人民法院诉讼解决。</p>

        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">十三、联系方式</h2>
        <p>如对本协议有任何疑问或需要注销账户，请联系：sellbridge@outlook.com</p>
      </article>
    </div>
  );
}
