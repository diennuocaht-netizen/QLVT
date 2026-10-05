const fs = require('fs');
const filename = 'src/utils/exportWord.ts';
let content = fs.readFileSync(filename, 'utf8');

// 1. Add isCombinedMode
content = content.replace(
  /const isLegacy = !checklist_by_equipment && Object\.keys\(checklist\)\.length > 0;/g,
  `const isCombinedMode = form.checklist_metadata?.isCombinedMode;\n  const isLegacy = !checklist_by_equipment && Object.keys(checklist).length > 0;`
);

// 2. Adjust eqColsCount
content = content.replace(
  /const eqColsCount = isLegacy \? 1 : equipments\.length;/g,
  `const eqColsCount = isLegacy || isCombinedMode ? 1 : equipments.length;`
);

// 3. Adjust Headers
content = content.replace(
  /\$\{isLegacy \? `<th\>Tất cả thiết bị \(Dữ liệu cũ\)<\/th\>` : equipments\.map\(\(eq: any\) => `<th\>\$\{eq\.equipment_name\}<\/th\>`\)\.join\(''\)\}/g,
  `${isLegacy ? '<th>Tất cả thiết bị (Dữ liệu cũ)</th>' : (isCombinedMode ? '<th>Kết quả chung</th>' : equipments.map((eq: any) => '<th>' + eq.equipment_name + '</th>').join(''))}`
);

// 4. Adjust Data Columns
// Let's replace the whole block:
const target = `let eqColsHtml = '';
                if (isLegacy) {
                  const val = checklist[item.id]?.status;
                  const note = checklist[item.id]?.note;
                  const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">Không đạt</span>' : val)) : '-';
                  eqColsHtml = \`<td class="text-center"><b>\${resultText}</b>\${note ? \`<br><i style="font-size: 10pt">\${note}</i>\` : ''}</td>\`;
                } else {
                  eqColsHtml = equipments.map((eq: any) => {
                    const val = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.status;
                    const note = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.note;
                    const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">K.Đạt</span>' : val)) : '-';
                    return \`<td class="text-center"><b>\${resultText}</b>\${note ? \`<br><i style="font-size: 10pt; color: #555;">\${note}</i>\` : ''}</td>\`;
                  }).join('');
                }`;

const replacement = `let eqColsHtml = '';
                if (isLegacy) {
                  const val = checklist[item.id]?.status;
                  const note = checklist[item.id]?.note;
                  const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">Không đạt</span>' : val)) : '-';
                  eqColsHtml = \`<td class="text-center"><b>\${resultText}</b>\${note ? \`<br><i style="font-size: 10pt">\${note}</i>\` : ''}</td>\`;
                } else if (isCombinedMode) {
                  const val = checklist_by_equipment?.['combined']?.[item.id]?.status;
                  const note = checklist_by_equipment?.['combined']?.[item.id]?.note;
                  const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">K.Đạt</span>' : val)) : '-';
                  eqColsHtml = \`<td class="text-center"><b>\${resultText}</b>\${note ? \`<br><i style="font-size: 10pt; color: #555;">\${note}</i>\` : ''}</td>\`;
                } else {
                  eqColsHtml = equipments.map((eq: any) => {
                    const val = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.status;
                    const note = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.note;
                    const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">K.Đạt</span>' : val)) : '-';
                    return \`<td class="text-center"><b>\${resultText}</b>\${note ? \`<br><i style="font-size: 10pt; color: #555;">\${note}</i>\` : ''}</td>\`;
                  }).join('');
                }`;

content = content.replace(target, replacement);
fs.writeFileSync(filename, content, 'utf8');
console.log('Modified exportWord.ts to support isCombinedMode');
