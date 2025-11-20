export function formatToETH(value?: number | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return "0 ETH";
  // show up to 6 decimal places for ETH display
  return `${Number(value).toFixed(6)} ETH`;
}

export function parseETHString(value: string): number {
  if (!value) return 0;
  // remove any non numeric characters except dot and minus
  const numeric = value.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(numeric);
  return isNaN(parsed) ? 0 : parsed;
}

export default formatToETH;
