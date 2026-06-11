# AI PowerPoint Filler 🚀

Ferramenta inteligente para preencher templates PowerPoint com dados extraídos de documentos usando IA.

## Funcionalidades

✨ **Extração de Dados**: Extrai automaticamente informações de PDFs, Word e outros documentos

🎯 **Mapeamento de Placeholders**: Sistema inteligente de placeholders para mapear dados

🤖 **Preenchimento com IA**: Usa OpenAI para extrair e processar informações

📥 **Download Automático**: Gera arquivo PowerPoint pronto para download

## Como Usar

### 1. Instalação

```bash
npm install
cp .env.example .env
# Adicione sua OPENAI_API_KEY no .env
```

### 2. Configurar Template

Adicione placeholders no seu template PowerPoint usando a sintaxe:
```
{{PLACEHOLDER_NAME}}
```

Exemplos:
- `{{COMPANY_NAME}}`
- `{{PROJECT_TITLE}}`
- `{{CLIENT_EMAIL}}`

### 3. Iniciar Servidor

```bash
npm start
```

Acesse: `http://localhost:3000`

### 4. Usar a Ferramenta

1. Upload do template PowerPoint
2. Upload dos documentos (PDF, Word, etc)
3. Clique em "Preencher com IA"
4. Download do arquivo preenchido

## Estrutura de Placeholders

Os placeholders são mapeados automaticamente:

```json
{
  "COMPANY_NAME": "Extraído do documento",
  "PROJECT_TITLE": "Extraído do documento",
  "CLIENT_EMAIL": "Extraído do documento"
}
```

## API Endpoints

### POST /api/extract-data
Extrai dados de documentos

### POST /api/fill-template
Preenche template com dados

### POST /api/process
Processamento completo (recomendado)

## Tecnologias

- Node.js + Express
- PPTX-Gen (manipulação PowerPoint)
- OpenAI API (IA)
- pdf-parse (PDFs)
- mammoth (Word docs)

## Exemplo de Uso Completo

```javascript
// 1. Upload template
const templateFile = ... // arquivo .pptx

// 2. Upload documentos
const documents = [...] // PDFs, Word, etc

// 3. Processar
const response = await fetch('/api/process', {
  method: 'POST',
  body: formData
});

// 4. Download
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'presentation_filled.pptx';
a.click();
```

## License

MIT
