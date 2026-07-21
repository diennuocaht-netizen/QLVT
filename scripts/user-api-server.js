#!/usr/bin/env node
/**
 * Simple API Server to create users
 * Run: node scripts/user-api-server.js
 * 
 * Usage from React:
 * POST http://localhost:3001/api/users/create
 * {
 *   "email": "user@email.com",
 *   "password": "Password123",
 *   "displayName": "User Name",
 *   "role": "viewer"
 * }
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import XLSX from 'xlsx';
import Docxtemplater from 'docxtemplater';
import { DOMParser } from '@xmldom/xmldom';
import { uploadToGoogleDriveOAuth } from './google-drive-oauth-service.js';
import 'dotenv/config';

// Use OAuth instead of Service Account
const USE_OAUTH = true;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.'));
    }
  },
});

// Supabase client (optional - only needed for user creation endpoint)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (!supabaseServiceKey) {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!');
  console.warn('   User creation endpoint (/api/users/create) will not work.');
  console.warn('   Google Drive uploads will work fine.');
  console.warn('');
  console.warn('   To enable user creation, set:');
  console.warn('   export SUPABASE_SERVICE_ROLE_KEY="your_key"');
  console.warn('');
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase initialized');
}

// Routes

// Ensure templates folder and a basic template exist
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
const TEMPLATE_FILE = path.join(TEMPLATES_DIR, 'to-trinh-template.docx');

const ensureTemplateExists = async () => {
  try {
    await fs.promises.mkdir(TEMPLATES_DIR, { recursive: true });
    const exists = await fs.promises.stat(TEMPLATE_FILE).then(() => true).catch(() => false);
    if (exists) return;

    // Create a simple DOCX template with placeholders using docx (so it's editable in Word)
    const tplChildren = [
      new Paragraph({ children: [new TextRun({ text: '{{documentTitle}}', bold: true, size: 28 })], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun('Số tờ trình: {{documentNumber}}')] }),
      new Paragraph({ children: [new TextRun('Bộ phận yêu cầu: {{department}}')] }),
      new Paragraph({ children: [new TextRun('Được yêu cầu bởi: {{requestedBy}}')] }),
      new Paragraph({ children: [new TextRun('Ngày yêu cầu: {{requestDate}}')] }),
      new Paragraph({ children: [new TextRun(' ')] }),
    ];

    // Header table for items with a templated row
    const headerRow = new TableRow({ children: [
      new TableCell({ children: [new Paragraph('TT')] }),
      new TableCell({ children: [new Paragraph('Mã chi phí')] }),
      new TableCell({ children: [new Paragraph('Mã vật tư (nếu có)')] }),
      new TableCell({ children: [new Paragraph('Mô tả chung về hàng hóa hoặc dịch vụ')] }),
      new TableCell({ children: [new Paragraph('Đơn vị tính')] }),
      new TableCell({ children: [new Paragraph('Số lượng dự kiến')] }),
      new TableCell({ children: [new Paragraph('Số lượng tồn kho hiện tại')] }),
      new TableCell({ children: [new Paragraph('Phạm vi công việc, Thông số sản phẩm')] }),
      new TableCell({ children: [new Paragraph('Ghi chú')] }),
      new TableCell({ children: [new Paragraph('Kế hoạch/Phát sinh hạng mục')] }),
    ]});

    // Data row with docxtemplater loop tags: {#items}...{/items}
    const dataRow = new TableRow({ children: [
      new TableCell({ children: [new Paragraph('{#items}{{no}}')] }),
      new TableCell({ children: [new Paragraph('{{costCode}}')] }),
      new TableCell({ children: [new Paragraph('{{itemCode}}')] }),
      new TableCell({ children: [new Paragraph('{{description}}')] }),
      new TableCell({ children: [new Paragraph('{{unit}}')] }),
      new TableCell({ children: [new Paragraph('{{qtyRequested}}')] }),
      new TableCell({ children: [new Paragraph('{{qtyOnHand}}')] }),
      new TableCell({ children: [new Paragraph('{{scope}}')] }),
      new TableCell({ children: [new Paragraph('{{notes}}')] }),
      new TableCell({ children: [new Paragraph('{{plan}}{/items}')] }),
    ]});

    const itemsTable = new Table({ rows: [headerRow, dataRow], width: { size: 100, type: WidthType.PERCENTAGE } });

    tplChildren.push(itemsTable);
    tplChildren.push(new Paragraph({ children: [new TextRun({ text: 'Lý do/Sự cần thiết:', bold: true })] }));
    tplChildren.push(new Paragraph('{{reason}}'));

    const tplDoc = new Document({ sections: [{ properties: {}, children: tplChildren }] });
    const buf = await Packer.toBuffer(tplDoc);
    await fs.promises.writeFile(TEMPLATE_FILE, buf);
    console.log('✅ Created template:', TEMPLATE_FILE);
  } catch (err) {
    console.error('Failed creating template:', err);
  }
};

// Ensure template at startup (non-blocking)
ensureTemplateExists();

// Map incoming payload to template variable names discovered in template
const mapPayloadToTemplate = (data = {}) => {
  const mapped = {
    documentTitle: data.title || data.documentTitle || 'TỜ TRÌNH',
    documentNumber: data.documentNumber || data.documentNo || '',
    department: data.department || data.dept || '',
    requestedBy: data.requestedBy || data.requested_by || data.createdBy || '',
    requestDate: data.requestDate || data.request_date || data.date || '',
    reason: data.reason || data.purpose || data.notes || '',
  };

  const items = Array.isArray(data.items) ? data.items : [];
  mapped.items = items.map((it, idx) => ({
    no: idx + 1,
    costCode: it.costCode || it.cost_code || it.cost || '',
    itemCode: it.code || it.itemCode || it.item_code || it.item || '',
    description: it.name || it.description || it.desc || '',
    unit: it.unit || it.uom || '',
    qtyRequested: it.qty || it.qtyRequested || it.requestedQuantity || '',
    qtyOnHand: it.qtyOnHand || it.qty_on_hand || '',
    scope: it.scope || '',
    notes: it.note || it.notes || '',
    plan: it.plan || '',
  }));

  return mapped;
};

/**
 * Render template via docxtemplater
 * POST /api/documents/render-docx
 * Body: { data: { ... }, filename?: string }
 */
app.post('/api/documents/render-docx', async (req, res) => {
  try {
    const payload = req.body || {};
    const data = payload.data || {};
    const filename = (payload.filename || `to-trinh-${Date.now()}.docx`).replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Read template
    const content = await fs.promises.readFile(TEMPLATE_FILE);
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, { parser: (tag) => tag, nullGetter: () => '' });
    // Set xml parser (xmldom) for docxtemplater
    doc.setOptions({ paragraphLoop: true, linebreaks: true });

    // docxtemplater expects simple object (including items array)
    doc.render(data);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buf);
  } catch (err) {
    console.error('Render DOCX error:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

/**
 * Generate a procurement document as DOCX
 * POST /api/documents/generate-docx
 * Body: { data: { form fields..., items: [{code,name,unit,qty,note}] }, filename?: string }
 */
app.post('/api/documents/generate-docx', async (req, res) => {
  try {
    const payload = req.body || {};
    const data = payload.data || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const filename = (payload.filename || `to-trinh-${Date.now()}.docx`).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    // If a template exists and contains docxtemplater-style tags, try rendering it first
    const templateExists = await fs.promises.stat(TEMPLATE_FILE).then(() => true).catch(() => false);
    if (templateExists) {
      try {
        const mapped = mapPayloadToTemplate(data);
        const content = await fs.promises.readFile(TEMPLATE_FILE);
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { parser: (tag) => tag, nullGetter: () => '' });
        doc.setOptions({ paragraphLoop: true, linebreaks: true });
        doc.render(mapped);
        const buf = doc.getZip().generate({ type: 'nodebuffer' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buf);
      } catch (err) {
        console.warn('Docxtemplater render failed, falling back to builder:', err.message || err);
        // fallthrough to builder
      }
    }

    // Fallback: build DOCX programmatically like before
    // Prepare initial children (header paragraphs)
    const children = [
      new Paragraph({
        children: [new TextRun({ text: data.title || 'TỜ TRÌNH', bold: true, size: 32 })],
        spacing: { after: 200 }
      }),
      new Paragraph({ children: [new TextRun({ text: `Số tờ trình: ${data.documentNumber || ''}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Bộ phận yêu cầu: ${data.department || ''}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Được yêu cầu bởi: ${data.requestedBy || ''}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Ngày yêu cầu: ${data.requestDate || ''}` })] }),
      new Paragraph({ children: [new TextRun({ text: ' ' })] }),
    ];

    // Prepare table rows (header + items)
    const tableRows = [];
    // Header row
    tableRows.push(new TableRow({ children: [
      new TableCell({ children: [new Paragraph('TT')], width: { size: 5, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph('Mã vật tư')], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph('Mô tả')], width: { size: 40, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph('Đơn vị')], width: { size: 10, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph('Số lượng')], width: { size: 10, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph('Ghi chú')], width: { size: 15, type: WidthType.PERCENTAGE } }),
    ]}));

    items.forEach((it, idx) => {
      tableRows.push(new TableRow({ children: [
        new TableCell({ children: [new Paragraph(String(idx + 1))] }),
        new TableCell({ children: [new Paragraph(it.code || '')] }),
        new TableCell({ children: [new Paragraph(it.name || '')] }),
        new TableCell({ children: [new Paragraph(it.unit || '')] }),
        new TableCell({ children: [new Paragraph(String(it.qty || ''))] }),
        new TableCell({ children: [new Paragraph(it.note || '')] }),
      ]}));
    });

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    // Append table and footer to children
    children.push(table);
    children.push(new Paragraph({ children: [new TextRun({ text: 'Lý do/Sự cần thiết:' , bold: true })] }));
    children.push(new Paragraph(data.reason || ''));

    // Build document with prepared children
    const doc = new Document({ sections: [{ properties: {}, children }] });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating DOCX:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

/**
 * Generate an Excel (.xlsx) list of items
 * POST /api/documents/generate-xlsx
 * Body: { data: { items: [{code,name,unit,qty,note,costCode,scope,plan}], documentNumber?, title? }, filename?: string }
 */
app.post('/api/documents/generate-xlsx', async (req, res) => {
  try {
    const payload = req.body || {};
    const data = payload.data || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const filename = (payload.filename || `${data.documentNumber || data.title || 'to-trinh'}.xlsx`).replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Build rows for Excel
    const rows = items.map((it, idx) => ({
      'TT': idx + 1,
      'Mã vật tư': it.code || it.itemCode || '',
      'Mô tả / Tên': it.name || it.description || '',
      'Đơn vị': it.unit || '',
      'Số lượng': it.qty || it.qtyRequested || it.requestedQuantity || '',
      'Ghi chú': it.note || it.notes || '',
      'Mã chi phí': it.costCode || it.cost_code || '',
      'Phạm vi': it.scope || '',
      'Kế hoạch': it.plan || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: ['TT','Mã vật tư','Mô tả / Tên','Đơn vị','Số lượng','Ghi chú','Mã chi phí','Phạm vi','Kế hoạch'] });
    XLSX.utils.book_append_sheet(wb, ws, 'Vật tư');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating XLSX:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

/**
 * Create a new user (Auth + Profile)
 * POST /api/users/create
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */
app.post('/api/users/create', async (req, res) => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'User creation is not available. SUPABASE_SERVICE_ROLE_KEY is not set.'
      });
    }

    const { email, password, displayName, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    console.log(`⏳ Creating user: ${email}`);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Update user profile with real ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        id: authData.user.id,
        role: role || 'viewer'
      })
      .eq('email', email);

    if (updateError) {
      // If update fails, try insert
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            display_name: displayName,
            role: role || 'viewer',
            created_at: new Date().toISOString(),
          }
        ]);

      if (insertError) throw insertError;
    }

    console.log(`✅ User profile created\n`);

    return res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email,
        displayName,
        role
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user'
    });
  }
});

/**
 * Simple health check for upload endpoint
 * GET /api/drive/health
 */
app.get('/api/drive/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Google Drive upload service is ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * Upload file to Google Drive
 * POST /api/drive/upload
 * 
 * Expected body:
 * {
 *   file: File (multipart/form-data),
 *   folderId: string (Google Drive folder ID)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   fileId: string,
 *   fileName: string,
 *   webViewLink: string,
 *   mimeType: string,
 *   size: number,
 *   createdTime: string
 * }
 */
app.post('/api/drive/upload', upload.single('file'), async (req, res) => {
  try {
    console.log(`\n📤 [Google Drive Upload] Received request`);
    console.log(`   File: ${req.file ? req.file.originalname : 'MISSING'}`);
    console.log(`   Body: ${JSON.stringify(req.body)}`);

    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const { folderId } = req.body;

    if (!folderId) {
      console.error('❌ No folderId in request');
      return res.status(400).json({
        success: false,
        error: 'folderId is required',
      });
    }

    console.log(`📤 [Google Drive Upload] Processing: ${req.file.originalname}`);
    console.log(`   Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   MIME: ${req.file.mimetype}`);
    console.log(`   Folder ID: ${folderId}`);

    // Upload to Google Drive using OAuth
    const result = await uploadToGoogleDriveOAuth(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folderId
    );

    console.log(`✅ [Google Drive Upload] Success - File ID: ${result.fileId}`);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ [Google Drive Upload] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file to Google Drive',
      details: error.message,
    });
  }
});

// Error handler for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ [Multer Error]:', err.message);
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }
  next(err);
});

/**
 * Health check
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'User API Server is running' });
});

/**
 * Start server with automatic port fallback
 */
const startServer = (portToTry = PORT) => {
  const server = app.listen(portToTry, () => {
    console.log(`\n🚀 User API Server running on http://localhost:${portToTry}`);
    console.log(`📝 POST http://localhost:${portToTry}/api/users/create`);
    console.log(`📤 POST http://localhost:${portToTry}/api/drive/upload`);
    console.log(`🔍 GET  http://localhost:${portToTry}/api/health\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      throw err;
    }
  });
};

startServer();
