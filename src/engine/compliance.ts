/**
 * 跨境电商合规引擎
 * 提供品类限制、商标风险检测、市场准入要求
 *
 * 数据来源基于公开法规整理，仅供参考，最终以目标市场监管机构为准。
 */

// ── 市场合规配置 ──

export interface MarketCompliance {
  market: string;
  label: string;
  /** 禁止销售的品类 */
  prohibitedCategories: string[];
  /** 需要特殊认证的品类 */
  restrictedCategories: { category: string; certification: string }[];
  /** 强制标签要求 */
  labelingRequirements: string[];
  /** 知识产权执法力度: low | medium | high */
  ipEnforcement: "low" | "medium" | "high";
  /** 其他说明 */
  notes: string[];
}

export const COMPLIANCE: MarketCompliance[] = [
  {
    market: "th",
    label: "泰国",
    prohibitedCategories: [
      "电子烟及配件", "赌博设备", "色情物品",
      "受版权保护的盗版品", "未注册药品", "军火武器",
    ],
    restrictedCategories: [
      { category: "食品", certification: "泰国 FDA 食品注册" },
      { category: "化妆品", certification: "泰国 FDA 化妆品注册" },
      { category: "保健品", certification: "泰国 FDA 保健品注册" },
      { category: "医疗器械", certification: "泰国 FDA 医疗器械注册" },
      { category: "电子产品", certification: "TISI 强制认证" },
      { category: "通讯设备", certification: "NBTC 认证" },
      { category: "玩具", certification: "TISI 玩具安全标准" },
    ],
    labelingRequirements: [
      "产品标签须含泰文说明",
      "部分品类须标注进口商信息",
      "食品/化妆品须标注成分和生产日期",
    ],
    ipEnforcement: "medium",
    notes: [
      "泰国海关对侵权商品抽查力度逐年加大",
      "建议在泰国注册品牌商标（DIP 知识产权局）",
      "电子产品若无 TISI 认证将被海关扣押",
    ],
  },
  {
    market: "vn",
    label: "越南",
    prohibitedCategories: [
      "电子烟及加热烟草制品", "二手消费品（特定品类）",
      "反动/政治敏感出版物", "受保护野生动物制品",
    ],
    restrictedCategories: [
      { category: "食品", certification: "越南食品安全局注册" },
      { category: "化妆品", certification: "越南卫生部化妆品公告" },
      { category: "药品", certification: "越南药品管理局注册" },
      { category: "电子产品", certification: "CR 符合性认证" },
      { category: "玩具", certification: "QCVN 儿童玩具安全标准" },
    ],
    labelingRequirements: [
      "产品标签必须包含越南语",
      "进口商品须标注原产国",
      "食品须标注生产日期和保质期",
    ],
    ipEnforcement: "low",
    notes: [
      "越南对二手商品进口管控严格",
      "商标建议在越南国家知识产权局（NOIP）注册",
    ],
  },
  {
    market: "id",
    label: "印尼",
    prohibitedCategories: [
      "酒精饮料（线上禁售）", "色情物品",
      "政治敏感出版物", "受保护动植物制品",
    ],
    restrictedCategories: [
      { category: "食品", certification: "BPOM 注册 + Halal 认证" },
      { category: "化妆品", certification: "BPOM 化妆品注册" },
      { category: "药品", certification: "BPOM 药品注册" },
      { category: "电子产品", certification: "SNI 强制认证" },
      { category: "玩具", certification: "SNI 玩具安全标准" },
      { category: "纺织品", certification: "SNI 纺织品标准 + 进口配额" },
      { category: "鞋类", certification: "SNI 鞋类标准 + 进口配额" },
    ],
    labelingRequirements: [
      "产品标签须含印尼文",
      "食品须标注 Halal 认证编号",
      "电子产品须标注 SNI 编号和进口商信息",
    ],
    ipEnforcement: "medium",
    notes: [
      "印尼对纺织/鞋类/电子产品有进口配额限制",
      "线上卖家通常需要本地注册公司或分销商",
      "Halal 认证对食品类几乎是事实上的强制要求",
      "2024 年起海关对小包裹价值审查趋严",
    ],
  },
  {
    market: "my",
    label: "马来西亚",
    prohibitedCategories: [
      "酒精饮料（部分州禁售）", "色情物品",
      "非Halal肉类制品（线上受限制）",
    ],
    restrictedCategories: [
      { category: "食品", certification: "JAKIM Halal 认证 / MOH 注册" },
      { category: "化妆品", certification: "NPRA 化妆品注册" },
      { category: "药品", certification: "NPRA 药品注册" },
      { category: "电子产品", certification: "SIRIM 认证" },
      { category: "通讯设备", certification: "MCMC 认证" },
      { category: "玩具", certification: "MCAC 玩具安全标准" },
    ],
    labelingRequirements: [
      "产品标签须含马来文或英文",
      "食品须标注 Halal 认证信息（如适用）",
      "电子产品须标注 SIRIM 编号",
    ],
    ipEnforcement: "high",
    notes: [
      "马来西亚 IP 执法为东南亚最严之一",
      "海关可主动扣押涉嫌侵权商品",
      "Halal 市场庞大，非 Halal 产品将被排斥",
    ],
  },
  {
    market: "ph",
    label: "菲律宾",
    prohibitedCategories: [
      "电子烟（线上受限）", "赌博设备",
      "色情物品", "受保护动植物制品",
    ],
    restrictedCategories: [
      { category: "食品", certification: "菲律宾 FDA 食品注册" },
      { category: "化妆品", certification: "菲律宾 FDA 化妆品注册" },
      { category: "药品", certification: "菲律宾 FDA 药品注册" },
      { category: "医疗器械", certification: "菲律宾 FDA 医疗器械注册" },
      { category: "电子产品", certification: "DTI/S 安全认证" },
      { category: "通讯设备", certification: "NTC 型号核准" },
      { category: "玩具", certification: "DTI 玩具安全标准" },
    ],
    labelingRequirements: [
      "产品标签须含英文",
      "食品/化妆品须标注成分和有效期",
      "电子产品须标注进口商和认证编号",
    ],
    ipEnforcement: "medium",
    notes: [
      "菲律宾 FDA 对跨境化妆品的抽查力度加大",
      "建议在菲律宾知识产权局（IPOPHL）注册商标",
    ],
  },
  {
    market: "sg",
    label: "新加坡",
    prohibitedCategories: [
      "口香糖", "电子烟", "色情物品",
      "军火武器", "受管制药物",
    ],
    restrictedCategories: [
      { category: "食品", certification: "SFA 食品进口许可" },
      { category: "化妆品", certification: "HSA 化妆品注册" },
      { category: "药品", certification: "HSA 药品注册" },
      { category: "医疗器械", certification: "HSA 医疗器械注册" },
      { category: "电子产品", certification: "CPSR 安全认证（Safety Mark）" },
      { category: "通讯设备", certification: "IMDA 型号核准" },
      { category: "玩具", certification: "CPSR 玩具安全标准" },
    ],
    labelingRequirements: [
      "产品标签须含英文",
      "食品须标注成分、过敏原、保质期",
      "电子产品须标注 Safety Mark",
    ],
    ipEnforcement: "high",
    notes: [
      "新加坡 IP 执法极为严格，侵权处罚重",
      "海关对进口货物抽查率高",
      "商标建议通过 IPOS 马德里体系国际注册",
    ],
  },
];

// ── 商标高危关键词库 ──

export const TRADEMARK_SENSITIVE_KEYWORDS: { keyword: string; owner: string; markets: string[] }[] = [
  { keyword: "iphone", owner: "Apple Inc.", markets: ["all"] },
  { keyword: "ipad", owner: "Apple Inc.", markets: ["all"] },
  { keyword: "airpods", owner: "Apple Inc.", markets: ["all"] },
  { keyword: "samsung", owner: "Samsung Electronics", markets: ["all"] },
  { keyword: "xiaomi", owner: "Xiaomi Inc.", markets: ["all"] },
  { keyword: "huawei", owner: "Huawei Technologies", markets: ["all"] },
  { keyword: "oppo", owner: "BBK Electronics", markets: ["all"] },
  { keyword: "vivo", owner: "BBK Electronics", markets: ["all"] },
  { keyword: "nike", owner: "Nike Inc.", markets: ["all"] },
  { keyword: "adidas", owner: "Adidas AG", markets: ["all"] },
  { keyword: "gucci", owner: "Gucci (Kering)", markets: ["all"] },
  { keyword: "lv", owner: "Louis Vuitton", markets: ["all"] },
  { keyword: "louis", owner: "Louis Vuitton", markets: ["all"] },
  { keyword: "chanel", owner: "Chanel S.A.", markets: ["all"] },
  { keyword: "hermes", owner: "Hermès", markets: ["all"] },
  { keyword: "prada", owner: "Prada S.p.A.", markets: ["all"] },
  { keyword: "dior", owner: "Christian Dior", markets: ["all"] },
  { keyword: "rolex", owner: "Rolex SA", markets: ["all"] },
  { keyword: "disney", owner: "The Walt Disney Company", markets: ["all"] },
  { keyword: "hello kitty", owner: "Sanrio Co., Ltd.", markets: ["all"] },
  { keyword: "marvel", owner: "Marvel (Disney)", markets: ["all"] },
  { keyword: "pokemon", owner: "Nintendo / The Pokémon Company", markets: ["all"] },
  { keyword: "lego", owner: "LEGO Group", markets: ["all"] },
  { keyword: "barbie", owner: "Mattel Inc.", markets: ["all"] },
  { keyword: "pepsi", owner: "PepsiCo Inc.", markets: ["all"] },
  { keyword: "coca", owner: "The Coca-Cola Company", markets: ["all"] },
  { keyword: "starbucks", owner: "Starbucks Corporation", markets: ["all"] },
  { keyword: "mcdonald", owner: "McDonald's Corporation", markets: ["all"] },
  { keyword: "sony", owner: "Sony Corporation", markets: ["all"] },
  { keyword: "playstation", owner: "Sony Interactive Entertainment", markets: ["all"] },
  { keyword: "xbox", owner: "Microsoft Corporation", markets: ["all"] },
  { keyword: "nintendo", owner: "Nintendo Co., Ltd.", markets: ["all"] },
  { keyword: "supreme", owner: "Chapter 4 Corp. (VF)", markets: ["all"] },
];

// ═══════════════════════════════════════════════════════════
// 中国出口端法规
// 法律依据：《对外贸易法》《海关法》《出口管制法》《进出口商品检验法》
//          《知识产权海关保护条例》《跨境电商零售出口监管通知》
// ═══════════════════════════════════════════════════════════

export interface ExportRegulation {
  law: string;
  year: number;
  summary: string;
  practicalImpact: string;
}

export const CHINA_EXPORT_LAWS: ExportRegulation[] = [
  {
    law: "《中华人民共和国对外贸易法》",
    year: 2004,
    summary: "规范跨境贸易经营主体、货物进出口管理、知识产权保护。明确从事外贸无需行政审批，但实行备案登记制。",
    practicalImpact: "跨境电商卖家需在商务部门完成对外贸易经营者备案登记，方可办理出口报关。",
  },
  {
    law: "《中华人民共和国海关法》",
    year: 2021,
    summary: "规定进出口货物通关程序、关税征收、海关监管、走私处罚。",
    practicalImpact: "所有跨境包裹须如实申报品名/数量/价值，低报、夹藏属于走私行为，面临罚款和刑事风险。",
  },
  {
    law: "《中华人民共和国出口管制法》",
    year: 2020,
    summary: "建立统一的出口管制体系，管制清单包括两用物项、军品、核及其他敏感物项。实行最终用户和最终用途管理制度。",
    practicalImpact: "管制物项出口须取得许可证。未经许可出口管制物项，最高可处20倍违法经营额罚款，情节严重追究刑事责任。",
  },
  {
    law: "《中华人民共和国进出口商品检验法》",
    year: 2021,
    summary: "列入《法定检验商品目录》的商品必须经商检机构检验合格方可出口。",
    practicalImpact: "电子产品、玩具、纺织品、食品接触材料等品类属于法定检验范围，出口前须取得商检放行单。",
  },
  {
    law: "《中华人民共和国知识产权海关保护条例》",
    year: 2018,
    summary: "权利人可向海关总署申请知识产权保护备案（商标权、著作权、专利权）。海关发现涉嫌侵权货物时主动中止放行并通知权利人确认。",
    practicalImpact: "品牌仿品在出口查验时即会被海关扣留。即使是合法品牌商品，若未在海关备案授权链，也可能被中止放行延误会期。",
  },
  {
    law: "《关于完善跨境电子商务零售出口监管有关工作的通知》（商财发〔2018〕486号）",
    year: 2018,
    summary: "跨境电商零售出口不执行首次进口许可批件、注册或备案要求（特殊商品除外）。适用9610/9710/9810等海关监管方式代码。",
    practicalImpact: "普通消费品走9610报关模式可简化通关手续，但需纳入海关统计和外汇管理。综试区内企业享受增值税/消费税免退税政策。",
  },
  {
    law: "《海关行政处罚实施条例》",
    year: 2004,
    summary: "对申报不实、伪报、瞒报、夹藏等行为的处罚标准细化。",
    practicalImpact: "品名申报错误（如'手机壳'申报为'塑料片'）即为申报不实，罚款货物价值的5%-30%。",
  },
  {
    law: "《个人外汇管理办法》及跨境贸易外汇管理",
    year: 2007,
    summary: "个人年度结汇/购汇额度各5万美元。跨境电商卖家收取的外汇货款需按规定结汇或留存外汇账户。",
    practicalImpact: "月销超过约3万美金（年超5万）的卖家，个人账户将面临结汇额度不足问题，需开立企业外汇账户或使用第三方跨境收付款平台。",
  },
];

/** 中国禁止或限制出口的品类（出口管制清单 + 法检目录摘要） */
export const CHINA_EXPORT_PROHIBITED_KEYWORDS: { keyword: string; reason: string; lawRef: string }[] = [
  { keyword: "文物", reason: "禁止一般贸易出口，须取得文物出境许可证", lawRef: "《文物保护法》" },
  { keyword: "金条", reason: "黄金及其制品出口受央行管制，个人不得擅自出口", lawRef: "《黄金管理条例》" },
  { keyword: "稀土", reason: "稀土属于国家战略资源，出口须配额许可证", lawRef: "《出口管制法》" },
  { keyword: "无人机", reason: "部分无人机（续航>30min/飞行高度>3000m等）属于两用物项管制", lawRef: "《出口管制法》两用物项清单" },
  { keyword: "夜视仪", reason: "属于两用物项，出口须许可证", lawRef: "《出口管制法》" },
  { keyword: "加密设备", reason: "密码产品出口受《商用密码管理条例》管制", lawRef: "《出口管制法》+ 商用密码条例" },
  { keyword: "化学品", reason: "列入《危险化学品目录》的商品出口须危包证+MSDS", lawRef: "《危险化学品安全管理条例》" },
  { keyword: "锂电池", reason: "独立锂电池（非内置）属危险品，出口须UN38.3检测+危包证", lawRef: "《危险货物运输规则》+ IATA" },
  { keyword: "种子", reason: "植物种子出口须检疫审批", lawRef: "《进出境动植物检疫法》" },
  { keyword: "食品", reason: "出口食品须生产企业备案+检验检疫+部分目标国注册", lawRef: "《食品安全法》+ 海关出口食品管理规定" },
  { keyword: "肉类", reason: "出口肉类须屠宰加工企业注册+检疫证书+目标国准入", lawRef: "《进出境动植物检疫法》" },
  { keyword: "中药材", reason: "部分中药材出口受CITES公约管制（如沉香、虫草等濒危物种），须CITES许可 + 药监批准", lawRef: "《进出口商品检验法》+ CITES" },
  { keyword: "木材", reason: "部分木材出口须濒危物种证明+检疫证书", lawRef: "《进出境动植物检疫法》+ CITES" },
  { keyword: "化妆品", reason: "出口化妆品须生产企业卫生许可+成分合规+部分国家动物实验相关证明", lawRef: "《化妆品监督管理条例》" },
];

/** 中国出口端需注意的合规要点关键词 */
export const CHINA_EXPORT_RISK_KEYWORDS: { keyword: string; warning: string }[] = [
  { keyword: "品牌", warning: "如出口商品涉及注册商标且非自有品牌，须取得品牌权利人的海关备案授权，否则出口时海关将中止放行" },
  { keyword: "logo", warning: "带有 LOGO 的商品如非正品授权，出口查验率极高，将被海关直接扣留" },
  { keyword: "贴牌", warning: "OEM/贴牌商品出口时，如品牌方未在海关知识产权备案系统中授权你司，货可能被扣" },
  { keyword: "赠品", warning: "赠品同样须如实申报，不得以'免费''非卖品'为由不申报。部分国家海关不接受零价值申报" },
  { keyword: "样品", warning: "商业样品同样受出口法规管辖，须正常报关。样品价值不得超过合理范围" },
];

// ── 通用封禁品类关键词 (目标市场端) ──

export const PROHIBITED_KEYWORDS: { keyword: string; reason: string; markets: string[] }[] = [
  { keyword: "电子烟", reason: "多数东南亚国家禁止或限制电子烟线上销售", markets: ["th", "vn", "sg"] },
  { keyword: "vape", reason: "多数东南亚国家禁止或限制电子烟线上销售", markets: ["th", "vn", "sg"] },
  { keyword: "烟弹", reason: "电子烟配件，受相同法规限制", markets: ["th", "vn", "sg"] },
  { keyword: "军刀", reason: "武器类商品需要特殊许可", markets: ["all"] },
  { keyword: "防身喷雾", reason: "受管制武器/化学品", markets: ["all"] },
  { keyword: "药品", reason: "需目标国药品注册，个人卖家一般无法合规销售", markets: ["all"] },
  { keyword: "处方药", reason: "禁止跨境电商销售", markets: ["all"] },
  { keyword: "壮阳", reason: "保健品/药品类跨境销售几乎无法合规", markets: ["all"] },
  { keyword: "减肥药", reason: "需药品注册，且虚假宣传风险极高", markets: ["all"] },
  { keyword: "美白针", reason: "医疗器械/药品类，跨境销售不合规", markets: ["all"] },
  { keyword: "赌具", reason: "多数东南亚国家禁止或严格管制", markets: ["all"] },
  { keyword: "监听器", reason: "可能违反隐私法和通讯法规", markets: ["all"] },
  { keyword: "针孔", reason: "隐蔽摄像/监听设备，涉嫌隐私侵权", markets: ["all"] },
  { keyword: "盗版", reason: "侵犯知识产权", markets: ["all"] },
  { keyword: "仿牌", reason: "侵犯商标权", markets: ["all"] },
  { keyword: "高仿", reason: "侵犯商标权", markets: ["all"] },
  { keyword: "复刻", reason: "暗示仿冒品，多数平台禁止", markets: ["all"] },
  { keyword: "原单", reason: "暗示未经授权使用品牌，多数平台禁止", markets: ["all"] },
  { keyword: "象牙", reason: "濒危物种制品，国际CITES公约禁止", markets: ["all"] },
  { keyword: "犀牛角", reason: "濒危物种制品，国际CITES公约禁止", markets: ["all"] },
  { keyword: "穿山甲", reason: "濒危物种制品", markets: ["all"] },
];

// ── 检测函数 ──

export interface ComplianceWarning {
  type: "trademark" | "prohibited_category" | "restricted_category" | "labeling" | "export_control" | "export_risk";
  severity: "high" | "medium" | "info";
  message: string;
  market: string;
  detail?: string;
  lawRef?: string; // 涉及的中国法规
}

export interface ComplianceCheckResult {
  warnings: ComplianceWarning[];
  marketSummaries: { market: string; label: string; restrictedCount: number; prohibitedCount: number }[];
  exportWarnings: ComplianceWarning[];
  exportLaws: { law: string; summary: string }[];
}

export function checkCompliance(params: {
  title: string;
  description?: string;
  category: string;
  markets: string[];
}): ComplianceCheckResult {
  const warnings: ComplianceWarning[] = [];
  const lowerTitle = params.title.toLowerCase();
  const lowerDesc = (params.description ?? "").toLowerCase();
  const lowerCat = params.category.toLowerCase();
  const fullText = `${lowerTitle} ${lowerDesc} ${lowerCat}`;

  // 1. 检查封禁品类关键词
  for (const pk of PROHIBITED_KEYWORDS) {
    if (fullText.includes(pk.keyword.toLowerCase())) {
      const affected = pk.markets.includes("all") ? params.markets : pk.markets.filter((m) => params.markets.includes(m));
      if (affected.length > 0) {
        warnings.push({
          type: "prohibited_category",
          severity: "high",
          message: `商品可能属于禁售品类：${pk.keyword}（${pk.reason}）`,
          market: affected.join(", "),
          detail: "该品类在目标市场可能被平台下架或海关扣押，强烈建议确认合规后再上架。",
        });
      }
    }
  }

  // 2. 检查商标敏感词
  for (const tk of TRADEMARK_SENSITIVE_KEYWORDS) {
    if (fullText.includes(tk.keyword.toLowerCase())) {
      warnings.push({
        type: "trademark",
        severity: "high",
        message: `商品名称/描述包含注册商标关键词 "${tk.keyword}"（${tk.owner}）`,
        market: "all",
        detail: "如非正品授权，使用该词汇可能导致商标侵权投诉和下架。AI 翻译可能无意中引入此关键词，建议修改商品名。",
      });
    }
  }

  // 3. 检查各目标市场的品类限制
  for (const market of params.markets) {
    const mc = COMPLIANCE.find((c) => c.market === market);
    if (!mc) continue;

    // 检查禁止品类
    for (const pc of mc.prohibitedCategories) {
      if (fullText.includes(pc.toLowerCase())) {
        warnings.push({
          type: "prohibited_category",
          severity: "high",
          message: `${mc.label}禁止销售品类：${pc}`,
          market,
          detail: "上架后可能被平台直接下架或拒绝，建议确认是否属于例外情况。",
        });
      }
    }

    // 检查受限品类
    for (const rc of mc.restrictedCategories) {
      if (lowerCat.includes(rc.category.toLowerCase()) || lowerTitle.includes(rc.category.toLowerCase())) {
        warnings.push({
          type: "restricted_category",
          severity: "medium",
          message: `${mc.label}要求该品类具有：${rc.certification}`,
          market,
          detail: `在${mc.label}销售${rc.category}类商品需要提前获取相关认证。请确认你已具备该认证，否则可能被海关扣押或平台下架。`,
        });
      }
    }

    // IP 执法提醒
    if (mc.ipEnforcement === "high") {
      warnings.push({
        type: "labeling",
        severity: "info",
        message: `${mc.label}知识产权执法严格，海关可主动扣押涉嫌侵权商品`,
        market,
      });
    }
  }

  // 4. 中国出口端合规检查
  const exportWarnings: ComplianceWarning[] = [];

  // 4a 检查中国禁止/管制出口品类
  for (const ek of CHINA_EXPORT_PROHIBITED_KEYWORDS) {
    if (fullText.includes(ek.keyword.toLowerCase())) {
      exportWarnings.push({
        type: "export_control",
        severity: "high",
        message: `中国出口管制：${ek.keyword}（${ek.reason}）`,
        market: "CN",
        detail: `在从中国发往目标国家前，须先完成 ${ek.keyword} 的出口许可/审批/检验，否则海关不放行。`,
        lawRef: ek.lawRef,
      });
    }
  }

  // 4b 检查出口风险关键词
  for (const rk of CHINA_EXPORT_RISK_KEYWORDS) {
    if (fullText.includes(rk.keyword.toLowerCase())) {
      exportWarnings.push({
        type: "export_risk",
        severity: "medium",
        message: rk.warning,
        market: "CN",
        detail: "此为商品出口中国海关时的额外注意点，与目标市场合规无关。",
      });
    }
  }

  // 4c 知识产区海关备案提醒（商品含品牌关键词时触发）
  const brandIndicators = ["品牌", "商标", "正品", "授权", "正版", "专卖", "代理"];
  if (brandIndicators.some((bi) => fullText.includes(bi))) {
    exportWarnings.push({
      type: "export_risk",
      severity: "info",
      message: "涉及品牌商品出口，建议确认品牌方已在海关知识产权保护系统备案",
      market: "CN",
      detail: "根据《知识产权海关保护条例》，海关对已备案商标主动保护。如品牌方未备案你的授权，商品可能被中止放行。可在 customs.gov.cn 查询备案状态。",
      lawRef: "《知识产权海关保护条例》",
    });
  }

  // 去重（同一消息+市场只保留一条）
  const seen = new Set<string>();
  const unique = warnings.filter((w) => {
    const key = `${w.type}|${w.message}|${w.market}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const exportSeen = new Set<string>();
  const uniqueExport = exportWarnings.filter((w) => {
    const key = `${w.type}|${w.message}|${w.market}`;
    if (exportSeen.has(key)) return false;
    exportSeen.add(key);
    return true;
  });

  const marketSummaries = params.markets.map((market) => {
    const mc = COMPLIANCE.find((c) => c.market === market);
    return {
      market,
      label: mc?.label ?? market,
      restrictedCount: mc?.restrictedCategories.length ?? 0,
      prohibitedCount: mc?.prohibitedCategories.length ?? 0,
    };
  });

  // 相关的中国出口法规摘要
  const relevantLaws = CHINA_EXPORT_LAWS.map((l) => ({
    law: l.law,
    summary: l.practicalImpact,
  }));

  return { warnings: unique, marketSummaries, exportWarnings: uniqueExport, exportLaws: relevantLaws };
}

// ═══════════════════════════════════════════════════════════
// 中国 → 东南亚 关税数据
// 依据：中国-东盟自贸区（ACFTA/CAFTA）协定
//       Form E 原产地证书可使大多数品类享受 0% 关税
// ═══════════════════════════════════════════════════════════

export interface TariffInfo {
  market: string;
  label: string;
  /** ACFTA 协定下的基础税率 */
  acftaRate: string;
  /** 无 Form E 时的 MFN 税率范围 */
  mfnRate: string;
  /** 增值税/消费税税率 */
  vatRate: string;
  /** 低价值商品免税阈值 */
  deMinimis: string;
  /** 需特别关注的税目 */
  sensitiveCategories: { category: string; rate: string }[];
  /** 关税计算说明 */
  note: string;
}

export const TARIFFS: TariffInfo[] = [
  {
    market: "th",
    label: "泰国",
    acftaRate: "0%（多数消费品，凭 Form E）",
    mfnRate: "5% - 30%（无 Form E 时适用）",
    vatRate: "7%（增值税 VAT）",
    deMinimis: "1,500 THB（约 ¥300）以下免征关税",
    sensitiveCategories: [
      { category: "电子产品", rate: "0% (ACFTA)" },
      { category: "服装鞋包", rate: "0% (ACFTA)" },
      { category: "化妆品", rate: "0-5% (ACFTA)" },
      { category: "食品饮料", rate: "5-30%（敏感清单）" },
      { category: "汽车配件", rate: "0-10% (ACFTA)" },
    ],
    note: "CIF 价值（货值+运费+保险）× 税率。Form E 须在出口时向中国海关申领。",
  },
  {
    market: "vn",
    label: "越南",
    acftaRate: "0%（多数消费品，凭 Form E）",
    mfnRate: "5% - 35%（无 Form E 时适用）",
    vatRate: "10%（增值税 VAT），部分必需品 5%",
    deMinimis: "1,000,000 VND（约 ¥300）以下免征",
    sensitiveCategories: [
      { category: "电子产品", rate: "0% (ACFTA)" },
      { category: "服装鞋包", rate: "0% (ACFTA)" },
      { category: "化妆品", rate: "0-5% (ACFTA)" },
      { category: "食品饮料", rate: "5-35%（敏感清单）" },
      { category: "钢铁制品", rate: "可能适用反倾销税" },
    ],
    note: "越南对部分中国商品有反倾销调查（钢铁、铝材等），需额外关注。",
  },
  {
    market: "id",
    label: "印尼",
    acftaRate: "0%（多数消费品，凭 Form E）",
    mfnRate: "5% - 40%（无 Form E 时适用）",
    vatRate: "11%（PPN 增值税），2025年从10%上调",
    deMinimis: "$3 以下免征关税（极低），2024年收紧对小包裹的监管",
    sensitiveCategories: [
      { category: "电子产品", rate: "0% (ACFTA)" },
      { category: "服装鞋包", rate: "0-5% (ACFTA)" },
      { category: "化妆品", rate: "0-5% + BPOM 注册" },
      { category: "食品饮料", rate: "5-20% + Halal 认证" },
      { category: "纺织品", rate: "有进口配额限制" },
      { category: "鞋类", rate: "有进口配额限制" },
    ],
    note: "印尼对纺织、鞋类、电子等品类有进口配额（非关税壁垒）。小包裹政策2024年大幅收紧，$3 以上即征税。",
  },
  {
    market: "my",
    label: "马来西亚",
    acftaRate: "0%（多数消费品，凭 Form E）",
    mfnRate: "0% - 60%（无 Form E 时适用，部分极高）",
    vatRate: "10% SST（销售与服务税）+ 5-10% 奢侈品税",
    deMinimis: "MYR 500（约 ¥800）以下免征",
    sensitiveCategories: [
      { category: "电子产品", rate: "0% (ACFTA)" },
      { category: "服装鞋包", rate: "0% (ACFTA)" },
      { category: "化妆品", rate: "0-5% (ACFTA)" },
      { category: "食品饮料", rate: "0-40%（酒精饮料极高）" },
      { category: "汽车", rate: "60-100%（高关税保护）" },
    ],
    note: "马来西亚对酒精饮料和烟草征收极高关税。汽车整车关税极高（保护国产Proton/Perodua）。",
  },
  {
    market: "ph",
    label: "菲律宾",
    acftaRate: "0%（多数消费品，凭 Form E）",
    mfnRate: "0% - 30%（无 Form E 时适用）",
    vatRate: "12%（增值税 VAT）",
    deMinimis: "PHP 10,000（约 ¥1,300）以下免征",
    sensitiveCategories: [
      { category: "电子产品", rate: "0% (ACFTA)" },
      { category: "服装鞋包", rate: "0% (ACFTA)" },
      { category: "化妆品", rate: "0-5% (ACFTA)" },
      { category: "食品饮料", rate: "0-30%" },
      { category: "农产品", rate: "高关税保护" },
    ],
    note: "菲律宾对农产品实施较高关税保护。de minimis 阈值慷慨（约¥1300）。",
  },
  {
    market: "sg",
    label: "新加坡",
    acftaRate: "0%（绝大多数商品，含 ACFTA 及中新双边FTA）",
    mfnRate: "0%（新加坡对绝大多数商品免征关税）",
    vatRate: "9% GST（商品与服务税），2024年从8%上调",
    deMinimis: "SGD 400（约 ¥2,100）以下免征 GST",
    sensitiveCategories: [
      { category: "电子产品", rate: "0%" },
      { category: "服装鞋包", rate: "0%" },
      { category: "化妆品", rate: "0%（GST 9%）" },
      { category: "食品饮料", rate: "0%（酒精/烟草除外）" },
      { category: "酒精饮料", rate: "高额消费税" },
    ],
    note: "新加坡是自由港，关税近零。但 GST 9% 按 CIF + duty 征收。酒精和烟草有高额消费税。",
  },
];

/** 获取指定市场的关税信息 */
export function getTariffInfo(market: string): TariffInfo | undefined {
  return TARIFFS.find((t) => t.market === market);
}

/** 获取指定市场的合规摘要 */
export function getMarketCompliance(market: string): MarketCompliance | undefined {
  return COMPLIANCE.find((c) => c.market === market);
}
