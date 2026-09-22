export const exportMeasurementRecordToWord = async (
  record: any,
  form: any,
  user: any
) => {
  const { record_name, recorded_at, record_data } = record;
  const { checklist = {}, checklist_by_equipment, equipments = [], post_maintenance_note = '' } = record_data;

  // Fetch logo as base64
  let logoBase64 = '';
  try {
    const response = await fetch('/AHT.png');
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to load logo', err);
  }

  // Group measurement fields
  const groupedColumns: { name: string; fields: any[] }[] = [];
  form.measurement_fields?.forEach((f: any) => {
    const gName = f.group || '';
    const existing = groupedColumns.find(g => g.name === gName);
    if (existing) {
      existing.fields.push(f);
    } else {
      groupedColumns.push({ name: gName, fields: [f] });
    }
  });

  const date = new Date(recorded_at);
  const dateStr = `ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const userName = user?.raw_user_meta_data?.full_name || user?.email || 'Không rõ';

  const groupedChecklist: { name: string, items: any[] }[] = [];
  if (form.checklist_items) {
    form.checklist_items.forEach((item: any) => {
      const gName = item.group || '';
      const existing = groupedChecklist.find(g => g.name === gName);
      if (existing) {
        existing.items.push(item);
      } else {
        groupedChecklist.push({ name: gName, items: [item] });
      }
    });
  }

  const hasDesc = form.checklist_items?.some((i: any) => i.description);
  const hasStd = form.checklist_items?.some((i: any) => i.standard);
  const customColsCount = form.checklist_metadata?.customColumns?.length || (hasDesc ? 1 : 0) + (hasStd ? 1 : 0);
  
  // Decide whether to use old format or new format
  const isLegacy = !checklist_by_equipment && Object.keys(checklist).length > 0;
  const eqColsCount = isLegacy ? 1 : equipments.length;
  const colSpanBase = 2 + customColsCount + eqColsCount;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Export Word</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; }
        .header { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; }
        .title { text-align: center; font-weight: bold; font-size: 16pt; margin: 20px 0; text-transform: uppercase; }
        .section-title { font-weight: bold; margin: 15px 0 10px 0; font-size: 12pt; text-transform: uppercase; }
        .info { margin-bottom: 15px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt; }
        .data-table th, .data-table td { border: 1px solid black; padding: 5px; }
        .data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .signature-section { margin-top: 40px; width: 100%; page-break-inside: avoid; }
        .signature-table { width: 100%; border: none; }
        .signature-table td { border: none; text-align: center; font-weight: bold; width: 50%; padding-bottom: 80px; }
      </style>
    </head>
    <body>
      <table style="width: 100%; border: none; margin-bottom: 10px;">
        <tr>
          <td style="width: 25%; text-align: left; vertical-align: top;">
            ${logoBase64 ? `<img src="${logoBase64}" width="120" alt="AHT Logo" />` : 'AHT Logo'}
          </td>
          <td style="width: 75%; text-align: center; font-size: 11pt;">
            CÔNG TY CỔ PHẦN ĐẦU TƯ KHAI THÁC NHÀ GA<br>
            QUỐC TẾ ĐÀ NẴNG<br>
            <b>PHÒNG KỸ THUẬT - ĐỘI ĐNCT</b>
          </td>
        </tr>
      </table>

      <div style="text-align: right; font-size: 11pt; margin-bottom: 20px; font-style: italic; text-decoration: underline;">
        Số: M8/26/BB/KT-DNCT/BTC
      </div>

      <div class="title">${record_name}</div>
      
      <div class="info">
        <b>Thời gian thực hiện:</b> ${dateStr}<br>
        <b>Người thực hiện:</b> ${userName}
      </div>

      ${form.checklist_items && form.checklist_items.length > 0 ? `
      <div class="section-title">BẢNG 1: NỘI DUNG KIỂM TRA CHUNG</div>
      <table class="data-table" border="1">
        <thead>
          <tr>
            <th style="width: 5%;">STT</th>
            <th style="width: 25%;">${form.checklist_metadata?.itemLabelHeader || 'Nội dung kiểm tra'}</th>
            ${form.checklist_metadata?.customColumns ? 
              form.checklist_metadata.customColumns.map((c: any) => `<th>${c.name}</th>`).join('') 
              : `
              ${hasDesc ? '<th>Miêu tả</th>' : ''}
              ${hasStd ? '<th>Tiêu chuẩn</th>' : ''}
              `
            }
            ${isLegacy ? `<th>Tất cả thiết bị (Dữ liệu cũ)</th>` : equipments.map((eq: any) => `<th>${eq.equipment_name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${(() => {
            let globalIndex = 0;
            return groupedChecklist.map((group) => {
              let groupHtml = '';
              if (group.name) {
                groupHtml += `
                  <tr>
                    <td colspan="${colSpanBase}" style="font-weight: bold; background-color: #f9f9f9; text-transform: uppercase;">
                      ${group.name}
                    </td>
                  </tr>
                `;
              }
              groupHtml += group.items.map((item: any) => {
                globalIndex++;
                
                let customColsHtml = '';
                if (form.checklist_metadata?.customColumns) {
                  customColsHtml = form.checklist_metadata.customColumns.map((col: any) => {
                    const val = item.customValues?.[col.id] || (col.id === 'desc' ? item.description : col.id === 'std' ? item.standard : '');
                    return `<td>${val || ''}</td>`;
                  }).join('');
                } else {
                  customColsHtml += hasDesc ? `<td>${item.description || ''}</td>` : '';
                  customColsHtml += hasStd ? `<td>${item.standard || ''}</td>` : '';
                }

                let eqColsHtml = '';
                if (isLegacy) {
                  const val = checklist[item.id]?.status;
                  const note = checklist[item.id]?.note;
                  const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">Không đạt</span>' : val)) : '-';
                  eqColsHtml = `<td class="text-center"><b>${resultText}</b>${note ? `<br><i style="font-size: 10pt">${note}</i>` : ''}</td>`;
                } else {
                  eqColsHtml = equipments.map((eq: any) => {
                    const val = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.status;
                    const note = checklist_by_equipment?.[eq.equipment_id]?.[item.id]?.note;
                    const resultText = val ? (val === 'Đạt' ? '<span style="color:green">Đạt</span>' : (val === 'Không đạt' ? '<span style="color:red">K.Đạt</span>' : val)) : '-';
                    return `<td class="text-center"><b>${resultText}</b>${note ? `<br><i style="font-size: 10pt; color: #555;">${note}</i>` : ''}</td>`;
                  }).join('');
                }

                return `
                  <tr>
                    <td class="text-center">${globalIndex}</td>
                    <td>${item.label}</td>
                    ${customColsHtml}
                    ${eqColsHtml}
                  </tr>
                `;
              }).join('');
              return groupHtml;
            }).join('');
          })()}
        </tbody>
      </table>
      ` : ''}

      ${form.measurement_fields && form.measurement_fields.length > 0 ? `
      <div class="section-title">BẢNG 2: BẢNG THÔNG SỐ ĐO ĐẠC</div>
      <table class="data-table" border="1">
        <thead>
          <tr>
            <th rowspan="2" style="width: 5%;">STT</th>
            <th rowspan="2" style="width: 20%;">Tên thiết bị</th>
            ${groupedColumns.map(g => `<th colspan="${g.fields.length}">${g.name || 'Thông số khác'}</th>`).join('')}
          </tr>
          <tr>
            ${groupedColumns.flatMap(g => g.fields).map(f => `<th>${f.label} ${f.unit ? `(${f.unit})` : ''}${f.standardValue ? `<br><span style="font-weight:normal;color:green;font-size:11pt">Chuẩn: ${f.standardValue}</span>` : ''}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${equipments.map((eq: any, idx: number) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${eq.equipment_name}</td>
              ${groupedColumns.flatMap(g => g.fields).map(f => {
                const val = eq.measurements[f.id] || '';
                return `<td class="text-center">${val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <div class="section-title">ĐÁNH GIÁ SAU BẢO TRÌ:</div>
      <div style="margin-bottom: 20px;">
        ${post_maintenance_note.replace(/\n/g, '<br>')}
      </div>

      <table class="signature-table">
        <tr>
          <td style="width: 50%;">
            <b>NGƯỜI THỰC HIỆN</b><br>
            <i>(Ký, ghi rõ họ tên)</i><br><br><br><br><br>
            ${userName}
          </td>
          <td style="width: 50%;">
            <b>NGƯỜI PHÊ DUYỆT</b><br>
            <i>(Ký, ghi rõ họ tên)</i><br><br><br><br><br>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Create Blob and trigger download
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bien_Ban_${record_name.replace(/\s+/g, '_')}_${date.getTime()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
