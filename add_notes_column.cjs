const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// Insert header for Receipt (Nhập)
content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">T.?.? Tr.?.?nh<\/th>\s*<\/>/g,
    `<th className="px-4 py-3 text-left font-medium text-gray-600">Tờ Trình</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                        </>`
);

// Insert header for Issue (Xuất)
content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">M.? Chi Ph.?<\/th>\s*<\/>/g,
    `<th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>
                        </>`
);

// Insert cell for Receipt (Nhập)
content = content.replace(
    /<td className="px-4 py-3 text-gray-900">\{getRequisitionCode\(item\.requisitionId\)\}<\/td>\s*<\/>/g,
    `<td className="px-4 py-3 text-gray-900">{getRequisitionCode(item.requisitionId)}</td>
                              <td className="px-4 py-3 text-gray-900">{item.notes || '-'}</td>
                            </>`
);

// Insert cell for Issue (Xuất)
content = content.replace(
    /<td className="px-4 py-3 text-gray-900">\{item\.expenseCode || '-.\}<\/td>\s*<\/>/g,
    `<td className="px-4 py-3 text-gray-900">{item.expenseCode || '-'}</td>
                              <td className="px-4 py-3 text-gray-900">{item.notes || '-'}</td>
                            </>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Added Ghi chú column to DetailSlipModal');
