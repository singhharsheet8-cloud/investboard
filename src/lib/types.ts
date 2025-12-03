export type EntityType =
  | "stock"
  | "mutual_fund"
  | "ipo"
  | "market_snapshot"
  | "category"
  | "benchmark";

export interface BaseEntity {
  entityType: EntityType;
  identifier: {
    code?: string | null;
    symbol?: string | null;
    isin?: string | null;
    name: string;
  };
  timestamp: string; // ISO 8601
  sourceUrls: string[];
}

export interface MutualFundMetrics {
  entityType: "mutual_fund" | "category" | "benchmark";
  entityName: string;
  categoryName: string | null;
  benchmarkName: string | null;

  aumCr: number | null; // AUM (₹ Cr)
  categoryAumSharePercent: number | null;
  expenseRatioPercent: number | null; // TER %

  returns: {
    y3: number | null; // 3Y Ann.
    y5: number | null; // 5Y Ann.
    y10: number | null; // 10Y Ann.
  };

  sipReturns: {
    y3: number | null; // 3Y SIP XIRR
    y5: number | null; // 5Y SIP XIRR
    y10: number | null; // 10Y SIP XIRR
  };

  risk: {
    beta3Y: number | null;
    volatilityStdDevPercent: number | null;
    sharpe3Y: number | null;
    sortino3Y: number | null;
    jensenAlpha3Y: number | null;
    treynor3Y: number | null;
    informationRatio3Y: number | null;
    maxDrawdown3YPercent: number | null;
    upsideCapture3Y: number | null;
    downsideCapture3Y: number | null;
  };

  allocation: {
    largeCapPercent: number | null;
    midCapPercent: number | null;
    smallCapPercent: number | null;
    top10HoldingsConcentrationPercent: number | null;
    turnoverPercent: number | null;
  };

  sectors: {
    name: string;
    weightPercent: number | null;
  }[];

  categoryExposurePercent: number | null; // "% investment in category"
}

export interface StockMetrics {
  price: number | null;
  changePercent: number | null;
  marketCap: number | null; // in Cr
  pe: number | null; // P/E ratio
  pb: number | null; // P/B ratio
  dividendYield: number | null; // %
  roe: number | null; // Return on Equity %
  debtToEquity: number | null;
  sector: string | null;
  industry: string | null;
  high52W: number | null;
  low52W: number | null;
  volume: number | null;
}

export interface IPOMetrics {
  companyName: string;
  sector: string | null;
  issueOpen: string | null; // ISO date
  issueClose: string | null; // ISO date
  priceBandLow: number | null;
  priceBandHigh: number | null;
  lotSize: number | null;
  gmp: number | null; // Grey Market Premium
  listingGainPercent: number | null;
  listingDate: string | null; // ISO date
  subscriptionData: {
    qib: number | null;
    nii: number | null;
    retail: number | null;
    total: number | null;
  } | null;
}

export interface MarketSnapshot {
  indices: {
    name: string; // "Nifty 50", "Sensex", etc.
    value: number;
    change: number;
    changePercent: number;
  }[];
  marketBreadth: {
    advances: number;
    declines: number;
    unchanged: number;
  };
  timestamp: string; // ISO 8601
}

export interface CachedEntityData extends BaseEntity {
  metrics: {
    mutual_fund?: MutualFundMetrics;
    stock?: StockMetrics;
    ipo?: IPOMetrics;
    market_snapshot?: MarketSnapshot;
  };
}

