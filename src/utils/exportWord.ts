export const exportMeasurementRecordToWord = async (
  record: any,
  form: any,
  user: any
) => {
  const { record_name, recorded_at, record_data } = record;
  const { checklist = {}, equipments = [], post_maintenance_note = '' } = record_data;

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
  const colSpanBase = 4 + (hasDesc ? 1 : 0) + (hasStd ? 1 : 0);

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
            <th style="width: 30%;">Nội dung kiểm tra</th>
            ${hasDesc ? '<th style="width: 15%;">Miêu tả</th>' : ''}
            ${hasStd ? '<th style="width: 15%;">Tiêu chuẩn</th>' : ''}
            <th style="width: 10%;">Đạt</th>
            <th style="width: 10%;">Không đạt</th>
            <th style="width: 15%;">Ghi chú</th>
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
                const val = checklist[item.id]?.status;
                const note = checklist[item.id]?.note || '';
                return `
                  <tr>
                    <td class="text-center">${globalIndex}</td>
                    <td>${item.label}</td>
                    ${hasDesc ? `<td>${item.description || ''}</td>` : ''}
                    ${hasStd ? `<td>${item.standard || ''}</td>` : ''}
                    <td class="text-center">${val === 'Đạt' ? 'X' : ''}</td>
                    <td class="text-center">${val === 'Không đạt' ? 'X' : ''}</td>
                    <td>${note}</td>
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
