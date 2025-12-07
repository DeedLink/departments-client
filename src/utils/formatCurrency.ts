export function formatToETH(value?: number | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return "0 ETH";
  return `${Number(value).toFixed(6)} ETH`;
}

export function parseETHString(value: string): number {
  if (!value) return 0;
  const numeric = value.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(numeric);
  return isNaN(parsed) ? 0 : parsed;
}

export function shortAddress(addr: string, left = 6, right = 4): string {
  if (!addr) return "";
  return addr.length > left + right ? `${addr.slice(0, left)}…${addr.slice(-right)}` : addr;
}

export default formatToETH;
