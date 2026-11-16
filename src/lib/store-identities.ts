import type { Platform } from "./catalog";

export interface StoreIdentity {
  platform: Platform;
  storeId: string;
  country: string;
  sourceUrl: string;
  checkedAt: string;
}

const countries = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  ),
);
export function isStoreCountry(value: unknown): value is string {
  return typeof value === "string" && countries.has(value);
}
export function isCanonicalStoreId(
  platform: Platform,
  value: unknown,
): value is string {
  if (typeof value !== "string") return false;
  if (platform === "android")
    return (
      value.length <= 255 &&
      /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/.test(value)
    );
  if (platform === "ios") return /^[1-9][0-9]{0,19}$/.test(value);
  // Observed Store IDs: 9WZDNCRFHVJL (Microsoft Learn), XP89DCGQ3K6VLD (catalog).
  // https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details
  return (
    platform === "windows" && /^(?:9[A-Z0-9]{11}|XP[A-Z0-9]{12})$/.test(value)
  );
}
/** Extracts a candidate only: a product URL is not evidence of a live listing. */
export function extractStoreId(
  platform: Platform,
  sourceUrl: string,
): string | null {
  try {
    const u = new URL(sourceUrl);
    if (u.protocol !== "https:" || u.username || u.password || u.port || u.hash)
      return null;
    let id: string | undefined;
    if (
      platform === "android" &&
      u.hostname === "play.google.com" &&
      u.pathname === "/store/apps/details" &&
      u.searchParams.getAll("id").length === 1
    )
      id = u.searchParams.get("id")!;
    if (platform === "ios" && u.hostname === "apps.apple.com")
      id = u.pathname.match(
        /^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id([1-9][0-9]*)\/?$/,
      )?.[1];
    if (platform === "windows" && u.hostname === "apps.microsoft.com")
      id = u.pathname
        .match(/^\/(?:store\/)?detail\/(?:[^/]+\/)?([a-zA-Z0-9]+)\/?$/)?.[1]
        ?.toUpperCase();
    if (platform === "windows" && u.hostname === "www.microsoft.com")
      id = u.pathname
        .match(
          /^\/(?:[a-z]{2}-[a-z]{2}\/)?store\/(?:productId\/|apps\/(?:[^/]+\/)?)([a-zA-Z0-9]+)\/?$/i,
        )?.[1]
        ?.toUpperCase();
    return isCanonicalStoreId(platform, id) ? id : null;
  } catch {
    return null;
  }
}
export function storeIdentityKey(identity: StoreIdentity): string {
  return `${identity.platform}:${identity.country}:${identity.storeId}`;
}
export function isSafeIdentityDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)
  )
    return false;
  const time = Date.parse(value);
  return (
    Number.isFinite(time) &&
    time <= Date.now() + 300000 &&
    new Date(time).toISOString().slice(0, 10) === value.slice(0, 10)
  );
}
