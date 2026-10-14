export interface CostCodeItem {
  id?: string;
  code: string;
  name?: string;
  classification?: string;
  subsystem?: string;
  purpose?: string;
  method?: string;
}

export const DEFAULT_PURPOSE = 'Sửa chữa';
export const DEFAULT_METHOD = 'Tự thực hiện';

export const normalizeString = (str?: string) => (str || '').trim().toLowerCase();

/**
 * Tự động tìm mã chi phí tối ưu nhất dựa vào:
 * 1. Phân hệ (subsystem)
 * 2. Mục đích (purpose - mặc định 'Sửa chữa')
 * 3. Phương thức (method - mặc định 'Tự thực hiện')
 * 4. Phân loại vật tư (classification / category nếu có)
 */
export const findBestCostCode = (
  subsystem?: string,
  purpose: string = DEFAULT_PURPOSE,
  method: string = DEFAULT_METHOD,
  classification?: string,
  costCodes: CostCodeItem[] = []
): string => {
  if (!subsystem || !costCodes || costCodes.length === 0) return '';

  const subNorm = normalizeString(subsystem);
  const purpNorm = normalizeString(purpose || DEFAULT_PURPOSE);
  const methNorm = normalizeString(method || DEFAULT_METHOD);
  const classNorm = normalizeString(classification);

  // Lọc các mã chi phí thuộc phân hệ này
  const subCostCodes = costCodes.filter(cc => {
    const ccSub = normalizeString(cc.subsystem);
    return ccSub === subNorm || ccSub.includes(subNorm) || subNorm.includes(ccSub);
  });

  if (subCostCodes.length === 0) return '';
  if (subCostCodes.length === 1) return subCostCodes[0].code;

  let bestMatch: CostCodeItem | null = null;
  let maxScore = -1;

  subCostCodes.forEach(cc => {
    const ccClass = normalizeString(cc.classification);
    const ccPurp = normalizeString(cc.purpose);
    const ccMeth = normalizeString(cc.method);

    const matchClass = !ccClass || !classNorm || ccClass === classNorm || ccClass.includes(classNorm) || classNorm.includes(ccClass);
    const matchPurp = !ccPurp || ccPurp === purpNorm || ccPurp.includes(purpNorm) || purpNorm.includes(ccPurp);
    const matchMeth = !ccMeth || ccMeth === methNorm || ccMeth.includes(methNorm) || methNorm.includes(ccMeth);

    let score = 0;
    // Điểm khớp Phương thức (Cách thực hiện)
    if (matchMeth) score += 10;
    if (ccMeth === methNorm) score += 5;
    if (methNorm.includes('tự thực hiện') && ccMeth.includes('tự thực hiện')) score += 5;

    // Điểm khớp Mục đích
    if (matchPurp) score += 10;
    if (ccPurp === purpNorm) score += 5;
    if (purpNorm.includes('sửa chữa') && (ccPurp.includes('sửa chữa') || ccPurp.includes('bảo trì'))) score += 5;

    // Điểm khớp Phân loại vật tư
    if (matchClass && classNorm && ccClass) score += 8;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = cc;
    }
  });

  return bestMatch ? bestMatch.code : subCostCodes[0].code;
};
