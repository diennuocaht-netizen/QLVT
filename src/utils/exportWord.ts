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

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Export Word</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
        }
        .header-table {
          width: 100%;
          text-align: center;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .header-table td {
          vertical-align: top;
        }
        .title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .info {
          margin-bottom: 10px;
        }
        .section-title {
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        table.data-table th, table.data-table td {
          border: 1px solid black;
          padding: 5px;
        }
        table.data-table th {
          background-color: #f2f2f2;
          text-align: center;
          font-weight: bold;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .signature-table {
          width: 100%;
          text-align: center;
          margin-top: 30px;
        }
        .signature-table th {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td style="width: 40%; vertical-align: middle; text-align: left;">
            ${logoBase64 ? `<img src="${logoBase64}" width="150" alt="AHT Logo" />` : 'AHT Logo'}
          </td>
          <td style="width: 60%; text-align: center; font-size: 11pt;">
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
            <th style="width: 45%;">Nội dung kiểm tra</th>
            <th style="width: 10%;">Đạt</th>
            <th style="width: 10%;">Không đạt</th>
            <th style="width: 30%;">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${form.checklist_items.map((item: any, idx: number) => {
            const val = checklist[item.id]?.status;
            const note = checklist[item.id]?.note || '';
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${item.label}</td>
                <td class="text-center">${val === 'Đạt' ? 'X' : ''}</td>
                <td class="text-center">${val === 'Không đạt' ? 'X' : ''}</td>
                <td>${note}</td>
              </tr>
            `;
          }).join('')}
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
            ${groupedColumns.flatMap(g => g.fields).map(f => `<th>${f.label} ${f.unit ? `(${f.unit})` : ''}</th>`).join('')}
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
