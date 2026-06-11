require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { processPowerPoint } = require('./src/pptxProcessor');
const { extractDataFromDocuments } = require('./src/documentExtractor');
const { processWithAI } = require('./src/aiProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Criar diretórios se não existirem
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Configurar multer
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pptx', '.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Rotas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload e extração de dados
app.post('/api/extract-data', upload.array('documents'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const extractedData = await extractDataFromDocuments(req.files);
    res.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    res.status(500).json({ error: error.message });
  }
});

// Identificar placeholders no template
app.post('/api/identify-placeholders', upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum template enviado' });
    }

    const placeholders = await processPowerPoint.identifyPlaceholders(req.file.path);
    res.json({ success: true, placeholders });
  } catch (error) {
    console.error('Erro ao identificar placeholders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Processar com IA e preencher template
app.post('/api/process', upload.fields([
  { name: 'template', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]), async (req, res) => {
  try {
    if (!req.files.template || !req.files.documents) {
      return res.status(400).json({ error: 'Template e documentos são obrigatórios' });
    }

    const templatePath = req.files.template[0].path;
    const documentPaths = req.files.documents.map(f => f.path);

    // Extrair dados dos documentos
    console.log('📄 Extraindo dados dos documentos...');
    const rawData = await extractDataFromDocuments(req.files.documents);

    // Identificar placeholders
    console.log('🔍 Identificando placeholders...');
    const placeholders = await processPowerPoint.identifyPlaceholders(templatePath);

    // Processar com IA
    console.log('🤖 Processando com IA...');
    const mappedData = await processWithAI.mapDataToPlaceholders(rawData, placeholders);

    // Preencher template
    console.log('✍️ Preenchendo template...');
    const outputPath = await processPowerPoint.fillTemplate(templatePath, mappedData);

    // Enviar arquivo
    res.download(outputPath, 'presentation_filled.pptx', (err) => {
      if (err) console.error('Erro ao enviar arquivo:', err);
      // Limpar arquivo após envio
      setTimeout(() => {
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {}
      }, 1000);
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Limpar uploads antigos
setInterval(() => {
  const files = fs.readdirSync(uploadsDir);
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stat = fs.statSync(filePath);
    const now = new Date().getTime();
    const fileTime = stat.mtime.getTime();
    
    // Deletar arquivos com mais de 1 hora
    if (now - fileTime > 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
    }
  });
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;
