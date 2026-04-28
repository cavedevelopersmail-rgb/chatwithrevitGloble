const Project = require('../models/Project');
const XLSX = require('xlsx');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_ROWS_PER_SHEET = 5000;
const MAX_CELL_LEN = 500;

function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheets = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    const limited = json.slice(0, MAX_ROWS_PER_SHEET);
    const columns = limited.length > 0 ? Object.keys(limited[0]) : [];
    const sanitized = limited.map((row) => {
      const out = {};
      for (const col of columns) {
        let v = row[col];
        if (v === null || v === undefined) v = '';
        v = String(v);
        if (v.length > MAX_CELL_LEN) v = v.slice(0, MAX_CELL_LEN) + '…';
        out[col] = v;
      }
      return out;
    });
    sheets.push({
      name,
      columns,
      rowCount: sanitized.length,
      rows: sanitized,
    });
  }
  return sheets;
}

function buildSourceContext(sources, maxChars = 40000) {
  let out = '';
  for (const src of sources) {
    out += `\n# FILE: ${src.originalName}\n`;
    for (const sheet of src.sheets) {
      out += `\n## Sheet: ${sheet.name}\nColumns: ${sheet.columns.join(' | ')}\nRows (${sheet.rowCount}):\n`;
      for (const row of sheet.rows) {
        const line = sheet.columns.map((c) => `${c}=${row[c] ?? ''}`).join(' | ');
        if (out.length + line.length + 1 > maxChars) {
          out += '\n[... data truncated due to size limit ...]\n';
          return out;
        }
        out += line + '\n';
      }
    }
  }
  return out;
}

exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('name description responseMode responseSpeed sources.originalName sources.uploadedAt sources.sheets.rowCount createdAt updatedAt');

    const summary = projects.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      responseMode: p.responseMode,
      responseSpeed: p.responseSpeed,
      sourceCount: p.sources.length,
      totalRows: p.sources.reduce((sum, s) => sum + s.sheets.reduce((a, sh) => a + (sh.rowCount || 0), 0), 0),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json({ projects: summary });
  } catch (e) {
    console.error('listProjects error:', e);
    res.status(500).json({ error: 'Failed to list projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({
      userId: req.userId,
      name: name || 'Untitled project',
      description: description || '',
    });
    await project.save();
    res.json({ project: { _id: project._id, name: project.name, description: project.description, createdAt: project.createdAt, updatedAt: project.updatedAt } });
  } catch (e) {
    console.error('createProject error:', e);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sources = project.sources.map((s) => ({
      _id: s._id,
      originalName: s.originalName,
      filename: s.filename,
      sizeBytes: s.sizeBytes,
      uploadedAt: s.uploadedAt,
      sheets: s.sheets.map((sh) => ({
        name: sh.name,
        columns: sh.columns,
        rowCount: sh.rowCount,
        preview: sh.rows.slice(0, 5),
      })),
    }));

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        description: project.description,
        responseMode: project.responseMode,
        responseSpeed: project.responseSpeed,
        sources,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (e) {
    console.error('getProject error:', e);
    res.status(500).json({ error: 'Failed to retrieve project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, responseMode, responseSpeed } = req.body;
    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (responseMode !== undefined) update.responseMode = responseMode;
    if (responseSpeed !== undefined) update.responseSpeed = responseSpeed;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: { _id: project._id, name: project.name, description: project.description, responseMode: project.responseMode, responseSpeed: project.responseSpeed } });
  } catch (e) {
    console.error('updateProject error:', e);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (e) {
    console.error('deleteProject error:', e);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

exports.uploadSource = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let sheets;
    try {
      sheets = parseWorkbook(req.file.buffer);
    } catch (err) {
      console.error('Workbook parse error:', err);
      return res.status(400).json({ error: 'Could not parse the file. Please upload a valid Excel or CSV file.' });
    }

    if (!sheets.length || sheets.every((s) => s.rowCount === 0)) {
      return res.status(400).json({ error: 'The file appears to be empty.' });
    }

    project.sources.push({
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      sheets,
    });
    project.updatedAt = new Date();
    await project.save();

    const newSource = project.sources[project.sources.length - 1];
    res.json({
      source: {
        _id: newSource._id,
        originalName: newSource.originalName,
        sizeBytes: newSource.sizeBytes,
        uploadedAt: newSource.uploadedAt,
        sheets: newSource.sheets.map((sh) => ({
          name: sh.name,
          columns: sh.columns,
          rowCount: sh.rowCount,
          preview: sh.rows.slice(0, 5),
        })),
      },
    });
  } catch (e) {
    console.error('uploadSource error:', e);
    res.status(500).json({ error: 'Failed to upload source' });
  }
};

exports.deleteSource = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const before = project.sources.length;
    project.sources = project.sources.filter((s) => String(s._id) !== req.params.sourceId);
    if (project.sources.length === before) return res.status(404).json({ error: 'Source not found' });

    project.updatedAt = new Date();
    await project.save();
    res.json({ message: 'Source deleted' });
  } catch (e) {
    console.error('deleteSource error:', e);
    res.status(500).json({ error: 'Failed to delete source' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.sources.length) {
      return res.json({
        response: "There are no sources uploaded to this project yet. Please upload an Excel or CSV file first.",
        usedSources: [],
      });
    }

    const speed = project.responseSpeed || 'fast';
    const ctxLimit = speed === 'deep' ? 80000 : speed === 'medium' ? 50000 : 30000;
    const sourceContext = buildSourceContext(project.sources, ctxLimit);

    const detail = project.responseMode === 'detailed'
      ? 'Provide a clear, complete answer with brief reasoning when helpful. Keep it focused.'
      : 'Be very concise. Use minimal words. Prefer "Name → Status" style or short bullet points.';

    const systemPrompt = `You are a strict source-only assistant. You MUST answer ONLY using the data provided below, which comes from the user's uploaded spreadsheet sources for the project "${project.name}".

Rules (follow EXACTLY):
1. Use only the rows and columns provided. Do not use any external knowledge or make assumptions.
2. If the question cannot be answered from the data, reply exactly: "Not available in provided source".
3. Match names and values case-insensitively but quote them as they appear in the data.
4. When listing matches, return them in the order they appear in the data.
5. ${detail}
6. If the question is ambiguous, ask one short clarifying question instead of guessing.
7. Never invent columns, sheets, dates, or values that are not present.

=== SOURCE DATA START ===${sourceContext}
=== SOURCE DATA END ===`;

    const safeHistory = (Array.isArray(history) ? history : [])
      .slice(-10)
      .map((m) => {
        const role = m && (m.role === 'user' || m.role === 'assistant') ? m.role : null;
        const content = typeof m?.content === 'string' ? m.content.slice(0, 4000) : '';
        return role && content ? { role, content } : null;
      })
      .filter(Boolean);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: String(message).slice(0, 4000) },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.1,
    });

    const response = completion.choices?.[0]?.message?.content?.trim() || 'Not available in provided source';

    res.json({
      response,
      usedSources: project.sources.map((s) => ({
        _id: s._id,
        originalName: s.originalName,
        sheetNames: s.sheets.map((sh) => sh.name),
      })),
    });
  } catch (e) {
    console.error('project chat error:', e);
    res.status(500).json({ error: 'Failed to get a response' });
  }
};
