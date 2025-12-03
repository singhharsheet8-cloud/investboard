export type MetricKey =
  // Mutual fund metrics
  | "mf.aumCr"
  | "mf.returns.y3"
  | "mf.returns.y5"
  | "mf.returns.y10"
  | "mf.sipReturns.y3"
  | "mf.sipReturns.y5"
  | "mf.sipReturns.y10"
  | "mf.risk.beta3Y"
  | "mf.risk.sharpe3Y"
  | "mf.risk.jensenAlpha3Y"
  | "mf.risk.treynor3Y"
  | "mf.risk.maxDrawdown3YPercent"
  | "mf.expenseRatioPercent"
  | "mf.categoryExposurePercent"
  | "mf.allocation.largeCapPercent"
  | "mf.allocation.midCapPercent"
  | "mf.allocation.smallCapPercent"
  // Stock metrics
  | "stock.price"
  | "stock.changePercent"
  | "stock.marketCap"
  | "stock.pe"
  | "stock.dividendYield"
  // IPO metrics
  | "ipo.issueOpen"
  | "ipo.issueClose"
  | "ipo.priceBandHigh"
  | "ipo.gmp"
  | "ipo.listingGainPercent";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  entityType: "mutual_fund" | "stock" | "ipo";
  tooltip?: string;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "mf.aumCr",
    label: "AUM (₹ Cr)",
    entityType: "mutual_fund",
    tooltip: "Assets Under Management in Crores",
  },
  {
    key: "mf.returns.y3",
    label: "3Y Return (Ann.)",
    entityType: "mutual_fund",
    tooltip: "3-year annualized return percentage",
  },
  {
    key: "mf.returns.y5",
    label: "5Y Return (Ann.)",
    entityType: "mutual_fund",
    tooltip: "5-year annualized return percentage",
  },
  {
    key: "mf.returns.y10",
    label: "10Y Return (Ann.)",
    entityType: "mutual_fund",
    tooltip: "10-year annualized return percentage",
  },
  {
    key: "mf.sipReturns.y3",
    label: "3Y SIP (XIRR)",
    entityType: "mutual_fund",
    tooltip: "3-year SIP return using XIRR calculation",
  },
  {
    key: "mf.sipReturns.y5",
    label: "5Y SIP (XIRR)",
    entityType: "mutual_fund",
    tooltip: "5-year SIP return using XIRR calculation",
  },
  {
    key: "mf.sipReturns.y10",
    label: "10Y SIP (XIRR)",
    entityType: "mutual_fund",
    tooltip: "10-year SIP return using XIRR calculation",
  },
  {
    key: "mf.risk.beta3Y",
    label: "Beta (3Y)",
    entityType: "mutual_fund",
    tooltip: "3-year beta - measures volatility relative to market",
  },
  {
    key: "mf.risk.sharpe3Y",
    label: "Sharpe (3Y)",
    entityType: "mutual_fund",
    tooltip: "Risk-adjusted return over 3 years vs risk-free rate",
  },
  {
    key: "mf.risk.jensenAlpha3Y",
    label: "Jensen's Alpha (3Y)",
    entityType: "mutual_fund",
    tooltip: "Excess return over expected return based on beta",
  },
  {
    key: "mf.risk.treynor3Y",
    label: "Treynor (3Y)",
    entityType: "mutual_fund",
    tooltip: "Return per unit of systematic risk (beta)",
  },
  {
    key: "mf.risk.maxDrawdown3YPercent",
    label: "Max Drawdown (3Y %)",
    entityType: "mutual_fund",
    tooltip: "Maximum peak-to-trough decline over 3 years",
  },
  {
    key: "mf.expenseRatioPercent",
    label: "Expense Ratio (%)",
    entityType: "mutual_fund",
    tooltip: "Total Expense Ratio - annual fees as % of AUM",
  },
  {
    key: "mf.categoryExposurePercent",
    label: "% in Category",
    entityType: "mutual_fund",
    tooltip: "Percentage of investment in the fund's category",
  },
  {
    key: "mf.allocation.largeCapPercent",
    label: "Large Cap %",
    entityType: "mutual_fund",
    tooltip: "Percentage allocation to large-cap stocks",
  },
  {
    key: "mf.allocation.midCapPercent",
    label: "Mid Cap %",
    entityType: "mutual_fund",
    tooltip: "Percentage allocation to mid-cap stocks",
  },
  {
    key: "mf.allocation.smallCapPercent",
    label: "Small Cap %",
    entityType: "mutual_fund",
    tooltip: "Percentage allocation to small-cap stocks",
  },
  {
    key: "stock.price",
    label: "Price",
    entityType: "stock",
    tooltip: "Current stock price",
  },
  {
    key: "stock.changePercent",
    label: "Change %",
    entityType: "stock",
    tooltip: "Percentage change in price",
  },
  {
    key: "stock.marketCap",
    label: "Market Cap",
    entityType: "stock",
    tooltip: "Market capitalization",
  },
  {
    key: "stock.pe",
    label: "P/E",
    entityType: "stock",
    tooltip: "Price-to-Earnings ratio",
  },
  {
    key: "stock.dividendYield",
    label: "Dividend Yield",
    entityType: "stock",
    tooltip: "Annual dividend yield percentage",
  },
  {
    key: "ipo.issueOpen",
    label: "Issue Opens",
    entityType: "ipo",
    tooltip: "IPO issue opening date",
  },
  {
    key: "ipo.issueClose",
    label: "Issue Closes",
    entityType: "ipo",
    tooltip: "IPO issue closing date",
  },
  {
    key: "ipo.priceBandHigh",
    label: "Price Band High",
    entityType: "ipo",
    tooltip: "Upper limit of IPO price band",
  },
  {
    key: "ipo.gmp",
    label: "GMP",
    entityType: "ipo",
    tooltip: "Grey Market Premium",
  },
  {
    key: "ipo.listingGainPercent",
    label: "Listing Gain %",
    entityType: "ipo",
    tooltip: "Percentage gain on listing day",
  },
];

export function getMetricsForEntityType(
  entityType: "mutual_fund" | "stock" | "ipo"
): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter((m) => m.entityType === entityType);
}

