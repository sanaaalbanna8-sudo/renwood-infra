const SPREADSHEET_ID = '1tzenT7ChtVTmYs6v2ixCDQHJ-a78AJdmRJSphnRozTo';

function doGet() {
  return json({ ok: true, message: 'جاهز' });
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const name = String(data.name || '').trim();
    if (name.length < 2) return json({ ok: false, message: 'الاسم ناقص' });
    data.name = name;
    data.group = String(data.group || '').trim();
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      writeStudent(ss, data);
      try {
        if (data.catalog && data.catalog.length) ensureDashboard(ss, data.catalog);
      } catch (dashboardError) {
        console.error(dashboardError);
      }
      return json({ ok: true, message: 'وصلت النتائج إلى جدول المعلمة' });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json({ ok: false, message: String(error && error.message ? error.message : error) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function writeStudent(ss, data) {
  const summary = ensureSheet(ss, 'الملخص');
  const detail = ensureSheet(ss, 'التفاصيل');
  upsert(
    summary,
    ['وقت الإرسال', 'الاسم', 'الشعبة', 'نسبة الاكتمال', 'الاحتياجات المغطاة', 'التنبيهات', 'الصورة العامة'],
    [data.sentAt, data.name, data.group, data.completion, data.needs || '', data.warnings || '', data.story || ''],
    true,
  );
  upsert(detail, data.headers, data.values, false);
}

function upsert(sheet, headers, values, percent) {
  if (!headers || !values || headers.length !== values.length) {
    throw new Error('رؤوس الجدول لا تطابق الصف');
  }
  const headerMissing = sheet.getLastRow() === 0 || String(sheet.getRange(1, 1).getValue()) === '';
  if (headerMissing || sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader(sheet, headers.length);
  }
  const name = String(values[1] || '').trim();
  const group = String(values[2] || '').trim();
  let row = findRow(sheet, name, group);
  if (!row) row = Math.max(sheet.getLastRow(), 1) + 1;
  sheet.getRange(row, 1, 1, values.length).setValues([values.map(cellValue)]);
  if (percent) sheet.getRange(row, 4).setNumberFormat('0%');
}

function cellValue(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  const text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function findRow(sheet, name, group) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const values = sheet.getRange(2, 2, last - 1, 2).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0]).trim() === name && String(values[i][1]).trim() === group) return i + 2;
  }
  return 0;
}

function styleHeader(sheet, width) {
  const header = sheet.getRange(1, 1, 1, width);
  header.setFontWeight('bold').setBackground('#1e1b4b').setFontColor('#ffffff').setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  sheet.setRowHeight(1, 40);
}

function ensureSheet(ss, name) {
  const found = ss.getSheetByName(name);
  if (found) return found;
  const sheets = ss.getSheets();
  const first = sheets[0];
  if (sheets.length === 1 && first.getLastRow() === 0 && (first.getName() === 'Sheet1' || first.getName() === 'ورقة1')) {
    first.setName(name);
    return first;
  }
  return ss.insertSheet(name);
}

function ensureDashboard(ss, catalog) {
  const sig = hash(JSON.stringify(catalog));
  const props = PropertiesService.getScriptProperties();
  const stats = ensureSheet(ss, 'الإحصاء');
  const dash = ensureSheet(ss, 'لوحة المعلومات');
  if (props.getProperty('dashSig') !== sig) {
    dash.getCharts().forEach(function (chart) {
      dash.removeChart(chart);
    });
    stats.clear();
    const plan = layout(catalog);
    if (plan.rows.length) {
      stats.getRange(1, 1, plan.rows.length, 3).setValues(plan.rows);
      stats.getRange(1, 3, plan.rows.length, 1).setNumberFormat('0%');
      stats.setRightToLeft(true);
      stats.setColumnWidth(1, 380);
      stats.setColumnWidth(2, 100);
      stats.setColumnWidth(3, 100);
    }
    dash.setRightToLeft(true);
    dash.getRange('A1').setValue('عدد الطالبات');
    dash.getRange('B1').setFormula("=COUNTA('التفاصيل'!B2:B)");
    dash.getRange('A1:B1').setFontWeight('bold');
    props.setProperty('dashSig', sig);
    props.setProperty('chartsBuilt', '0');
  }
  buildSomeCharts(ss, 8);
}

function buildCharts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const dash = ss.getSheetByName('لوحة المعلومات');
  if (dash) {
    dash.getCharts().forEach(function (chart) {
      dash.removeChart(chart);
    });
  }
  PropertiesService.getScriptProperties().setProperty('chartsBuilt', '0');
  const total = blocksFromStats(ss.getSheetByName('الإحصاء')).length;
  while (Number(PropertiesService.getScriptProperties().getProperty('chartsBuilt') || '0') < total) {
    buildSomeCharts(ss, 20);
  }
}

function buildSomeCharts(ss, limit) {
  const stats = ss.getSheetByName('الإحصاء');
  const dash = ss.getSheetByName('لوحة المعلومات');
  if (!stats || !dash) return;
  const blocks = blocksFromStats(stats);
  const props = PropertiesService.getScriptProperties();
  const built = Number(props.getProperty('chartsBuilt') || '0');
  const end = Math.min(blocks.length, built + limit);
  for (let i = built; i < end; i += 1) {
    const block = blocks[i];
    const chart = dash
      .newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(stats.getRange(block.headerRow, 1, block.numRows, 2))
      .setPosition(4 + Math.floor(i / 2) * 18, (i % 2) * 8 + 1, 0, 0)
      .setOption('title', block.title)
      .setOption('legend', { position: 'none' })
      .setOption('width', 520)
      .setOption('height', 300)
      .build();
    dash.insertChart(chart);
  }
  props.setProperty('chartsBuilt', String(end));
}

function blocksFromStats(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  const blocks = [];
  let i = 0;
  while (i < values.length) {
    const title = String(values[i][0] || '');
    const next = values[i + 1] ? String(values[i + 1][0] || '') : '';
    if (title && next === 'الخيار') {
      let count = 1;
      let row = i + 2;
      while (row < values.length && String(values[row][0] || '')) {
        count += 1;
        row += 1;
      }
      blocks.push({ title: title, headerRow: i + 2, numRows: count });
      i = row + 1;
    } else {
      i += 1;
    }
  }
  return blocks;
}

function layout(catalog) {
  const rows = [];
  catalog.forEach(function (item) {
    const col = columnLetter(Number(item.column));
    rows.push([item.title, '', '']);
    rows.push(['الخيار', 'العدد', 'النسبة']);
    item.options.concat(['لم تجب']).forEach(function (option, index) {
      const r = rows.length + 1;
      const missed = index === item.options.length;
      const count = missed
        ? "=COUNTIF('التفاصيل'!" + col + '$2:' + col + ',"لم تجب")'
        : '=COUNTIF(\'التفاصيل\'!' +
          col +
          '$2:' +
          col +
          ',"*⟪"&SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(A' +
          r +
          ',"~","~~"),"*","~*"),"?","~?")&"⟫*")';
      const percent = '=IF(COUNTA(\'التفاصيل\'!B$2:B)=0,"",B' + r + '/COUNTA(\'التفاصيل\'!B$2:B))';
      rows.push([option, count, percent]);
    });
    rows.push(['', '', '']);
  });
  return { rows: rows };
}

function columnLetter(n) {
  let value = n;
  let out = '';
  while (value > 0) {
    const mod = (value - 1) % 26;
    out = String.fromCharCode(65 + mod) + out;
    value = Math.floor((value - 1) / 26);
  }
  return out;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
