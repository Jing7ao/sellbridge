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

// ── 通用封禁品类关键词 ──

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
  type: "trademark" | "prohibited_category" | "restricted_category" | "labeling";
  severity: "high" | "medium" | "info";
  message: string;
  market: string;
  detail?: string;
}

export interface ComplianceCheckResult {
  warnings: ComplianceWarning[];
  marketSummaries: { market: string; label: string; restrictedCount: number; prohibitedCount: number }[];
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

  // 去重（同一消息+市场只保留一条）
  const seen = new Set<string>();
  const unique = warnings.filter((w) => {
    const key = `${w.type}|${w.message}|${w.market}`;
    if (seen.has(key)) return false;
    seen.add(key);
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

  return { warnings: unique, marketSummaries };
}

/** 获取指定市场的合规摘要 */
export function getMarketCompliance(market: string): MarketCompliance | undefined {
  return COMPLIANCE.find((c) => c.market === market);
}
