import partnerBrandsData from "@/data/partner-brands.json";

export interface Partner {
  name: string;
  logoUrl: string;
  href?: string;
}

export interface PartnerBrandsData {
  headline: string;
  subheadline: string;
  partners: Partner[];
}

export function getPartnerBrands(): PartnerBrandsData | null {
  const data = partnerBrandsData as PartnerBrandsData;
  if (!data.partners?.length) return null;
  return data;
}
