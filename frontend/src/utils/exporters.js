/**
 * Exporters utility for WBS Engine
 * Exports structured WBS data to JSON, CSV, Jira/Trello CSV, MS Project XML,
 * Standalone HTML Embed, and Printable PDF.
 */

// ── 1. JSON Export ────────────────────────────────────────────────────────
export const exportToJson = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `wbs-${slugify(data.projectName || data.projectType)}-${Date.now()}.json`);
};

// ── 2. Standard CSV / Excel Export ─────────────────────────────────────────
export const exportToCsv = (data) => {
  const rows = [
    [
      'WBS Code',
      'Level',
      'Type',
      'Title / Name',
      'Description',
      'Estimated Hours',
      '% of Scope',
      'Priority',
      'Skill Required',
      'Dependencies',
      'Risk Level',
      'Risk Mitigation',
    ],
  ];

  // Project Root
  rows.push([
    '0',
    '0',
    'Project',
    data.projectName || data.projectType,
    data.summary || '',
    data.totalEstimatedHours,
    '100%',
    '',
    '',
    '',
    data.complexity,
    '',
  ]);

  (data.deliverables || []).forEach((deliv, dIdx) => {
    const delivCode = `${dIdx + 1}`;
    rows.push([
      delivCode,
      '1',
      'Deliverable / Phase',
      deliv.deliverableName,
      deliv.description || '',
      deliv.estimatedHours,
      `${deliv.percentageOfProject || 0}%`,
      '',
      '',
      '',
      '',
      '',
    ]);

    (deliv.workPackages || []).forEach((wp, wIdx) => {
      const wpCode = `${delivCode}.${wIdx + 1}`;
      rows.push([
        wpCode,
        '2',
        'Work Package',
        wp.packageName,
        wp.description || '',
        wp.estimatedHours,
        `${wp.percentageOfDeliverable || 0}%`,
        '',
        '',
        '',
        '',
        '',
      ]);

      (wp.tasks || []).forEach((task, tIdx) => {
        const taskCode = `${wpCode}.${tIdx + 1}`;
        rows.push([
          taskCode,
          '3',
          'Task',
          task.taskTitle,
          task.description || '',
          task.estimatedHours,
          '',
          task.priority || 'Medium',
          task.skillRequired || '',
          (task.dependsOn || []).join('; '),
          task.riskLevel || 'Low',
          task.riskMitigation || '',
        ]);
      });
    });
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((field) => {
          const str = String(field == null ? '' : field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `wbs-${slugify(data.projectName || data.projectType)}-${Date.now()}.csv`);
};

// ── 3. Jira / Trello Importable CSV ────────────────────────────────────────
export const exportToJiraCsv = (data) => {
  const rows = [
    [
      'Issue Type',
      'Summary',
      'Description',
      'Original Estimate',
      'Priority',
      'Labels',
      'Component',
      'Acceptance Criteria',
    ],
  ];

  (data.deliverables || []).forEach((deliv) => {
    // Deliverable as Epic
    rows.push([
      'Epic',
      deliv.deliverableName,
      deliv.description || `Deliverable for ${data.projectName}`,
      `${deliv.estimatedHours}h`,
      'High',
      'wbs-deliverable',
      data.projectType,
      '',
    ]);

    (deliv.workPackages || []).forEach((wp) => {
      // Work Package as Story
      rows.push([
        'Story',
        wp.packageName,
        wp.description || '',
        `${wp.estimatedHours}h`,
        'Medium',
        'wbs-workpackage',
        deliv.deliverableName,
        '',
      ]);

      (wp.tasks || []).forEach((task) => {
        // Task as Sub-task
        const criteria = Array.isArray(task.acceptanceCriteria)
          ? task.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
          : '';

        const fullDesc = `${task.description || ''}\n\nRequired Role: ${task.skillRequired || 'Specialist'}\nRisk Level: ${task.riskLevel || 'Low'}\nMitigation: ${task.riskMitigation || 'N/A'}`;

        rows.push([
          'Sub-task',
          task.taskTitle,
          fullDesc,
          `${task.estimatedHours}h`,
          task.priority || 'Medium',
          `skill-${slugify(task.skillRequired || 'general')}`,
          wp.packageName,
          criteria,
        ]);
      });
    });
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((field) => {
          const str = String(field == null ? '' : field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `jira-import-${slugify(data.projectName || data.projectType)}-${Date.now()}.csv`);
};

// ── 4. Microsoft Project XML (MSPDI) ───────────────────────────────────────
export const exportToMsProjectXml = (data) => {
  let uid = 1;
  const projectTitle = escapeXml(data.projectName || data.projectType || 'Project WBS');

  const taskXmlParts = [];

  // Project Root Task
  taskXmlParts.push(`
    <Task>
      <UID>${uid++}</UID>
      <ID>1</ID>
      <Name>${projectTitle}</Name>
      <OutlineLevel>1</OutlineLevel>
      <Duration>PT${data.totalEstimatedHours || 0}H0M0S</Duration>
      <Summary>1</Summary>
    </Task>`);

  let currentId = 2;

  (data.deliverables || []).forEach((deliv) => {
    taskXmlParts.push(`
    <Task>
      <UID>${uid++}</UID>
      <ID>${currentId++}</ID>
      <Name>${escapeXml(deliv.deliverableName)}</Name>
      <OutlineLevel>2</OutlineLevel>
      <Duration>PT${deliv.estimatedHours || 0}H0M0S</Duration>
      <Summary>1</Summary>
      <Notes>${escapeXml(deliv.description || '')}</Notes>
    </Task>`);

    (deliv.workPackages || []).forEach((wp) => {
      taskXmlParts.push(`
    <Task>
      <UID>${uid++}</UID>
      <ID>${currentId++}</ID>
      <Name>${escapeXml(wp.packageName)}</Name>
      <OutlineLevel>3</OutlineLevel>
      <Duration>PT${wp.estimatedHours || 0}H0M0S</Duration>
      <Summary>1</Summary>
      <Notes>${escapeXml(wp.description || '')}</Notes>
    </Task>`);

      (wp.tasks || []).forEach((task) => {
        taskXmlParts.push(`
    <Task>
      <UID>${uid++}</UID>
      <ID>${currentId++}</ID>
      <Name>${escapeXml(task.taskTitle)}</Name>
      <OutlineLevel>4</OutlineLevel>
      <Duration>PT${task.estimatedHours || 8}H0M0S</Duration>
      <Summary>0</Summary>
      <Priority>${task.priority === 'Critical' ? '900' : task.priority === 'High' ? '700' : task.priority === 'Low' ? '300' : '500'}</Priority>
      <Notes>${escapeXml(task.description || '')}&#10;Role: ${escapeXml(task.skillRequired || '')}&#10;Risk: ${escapeXml(task.riskLevel || 'Low')}</Notes>
    </Task>`);
      });
    });
  });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${projectTitle}</Name>
  <Title>${projectTitle}</Title>
  <Company>WBS Engine AI</Company>
  <Tasks>
    ${taskXmlParts.join('\n')}
  </Tasks>
</Project>`;

  const blob = new Blob([xmlContent], { type: 'application/xml' });
  downloadBlob(blob, `msproject-${slugify(data.projectName || data.projectType)}-${Date.now()}.xml`);
};

// ── 5. Standalone Interactive HTML Embed ────────────────────────────────────
export const exportToStandaloneHtml = (data) => {
  const jsonString = JSON.stringify(data);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(data.projectName || data.projectType)} — Interactive WBS</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f19; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; }
    .card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; }
  </style>
</head>
<body class="p-6 md:p-10 max-w-7xl mx-auto">
  <header class="mb-8 border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
    <div>
      <span class="text-xs uppercase font-bold tracking-wider text-indigo-400">Interactive Project WBS</span>
      <h1 class="text-3xl font-extrabold text-white mt-1">${escapeXml(data.projectName || data.projectType)}</h1>
      <p class="text-white/60 text-sm mt-1">${escapeXml(data.summary || '')}</p>
    </div>
    <div class="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-white/10">
      <div><span class="text-xs text-white/40 block">Complexity</span><span class="font-bold text-amber-400">${data.complexity || 'Medium'}</span></div>
      <div class="h-8 w-px bg-white/10"></div>
      <div><span class="text-xs text-white/40 block">Total Hours</span><span class="font-bold text-emerald-400 text-lg">${data.totalEstimatedHours}h</span></div>
    </div>
  </header>

  <main class="space-y-6" id="wbs-container"></main>

  <script>
    const data = ${jsonString};
    const container = document.getElementById('wbs-container');

    data.deliverables.forEach((deliv, dIdx) => {
      const delivEl = document.createElement('div');
      delivEl.className = 'card p-6';
      delivEl.innerHTML = \`
        <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <span class="text-xs font-mono text-indigo-400 font-bold">DELIVERABLE \${dIdx + 1}</span>
            <h2 class="text-xl font-bold text-white">\${deliv.deliverableName}</h2>
          </div>
          <span class="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-sm rounded-lg border border-indigo-500/30">
            \${deliv.estimatedHours}h (\${deliv.percentageOfProject || 0}%)
          </span>
        </div>
        <div class="space-y-4">
          \${(deliv.workPackages || []).map((wp, wIdx) => \`
            <div class="bg-slate-900/60 p-4 rounded-xl border border-white/5">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-slate-200">\${wp.packageName}</h3>
                <span class="text-xs text-slate-400 font-mono">\${wp.estimatedHours}h</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                \${(wp.tasks || []).map(t => \`
                  <div class="p-3 bg-slate-800/50 rounded-lg border border-white/5 flex justify-between items-start gap-2">
                    <div>
                      <div class="font-medium text-sm text-white">\${t.taskTitle}</div>
                      <div class="text-xs text-slate-400 mt-1">\${t.description}</div>
                      <div class="flex gap-2 mt-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">\${t.skillRequired}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Risk: \${t.riskLevel || 'Low'}</span>
                      </div>
                    </div>
                    <span class="text-xs font-mono text-indigo-400 font-bold">\${t.estimatedHours}h</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`).join('')}
        </div>
      \`;
      container.appendChild(delivEl);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  downloadBlob(blob, `wbs-standalone-${slugify(data.projectName || data.projectType)}-${Date.now()}.html`);
};

// ── 6. High-Res Printable PDF / Report ──────────────────────────────────────
export const exportToPrintPdf = () => {
  window.print();
};

// ── Helpers ────────────────────────────────────────────────────────────────
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const slugify = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const escapeXml = (unsafe = '') => {
  return unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
};
