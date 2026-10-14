const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');

test('Excel export creates a readable workbook with incident values and status formatting', async () => {
  const { createIncidentWorkbook } = await import('../client/src/services/exportExcel.js');
  const workbook = await createIncidentWorkbook([
    { corrida: 2, camera: '4', curva: 'Turn 5', hora: '12:34:56', video: true, report: true, nfa: false, priority: true, obs: 'Contacto\nRevisão vídeo' },
    { corrida: 3, camera: '', curva: 'Post 1', hora: '13:00:00', video: false, report: false, nfa: true, priority: false, obs: 'Sem ação' }
  ], 'Corrida de teste');
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.deepEqual(reopened.worksheets.map(sheet => sheet.name), ['Corrida 2', 'Corrida 3']);
  const sheet = reopened.getWorksheet('Corrida 2');
  const thirdRace = reopened.getWorksheet('Corrida 3');
  assert.equal(sheet.getCell('A1').value, 'Corrida de teste — Corrida 2');
  assert.deepEqual(sheet.getRow(3).values.slice(1), ['Race','Camera','Turn / Post','Time','Vídeo','Report','N.F.A.','Prioridade','Observações']);
  assert.deepEqual(sheet.getRow(4).values.slice(1), [2,'4','Turn 5','12:34:56','Sim','Sim','Não','Sim','Contacto\nRevisão vídeo']);
  assert.equal(sheet.getCell('F4').fill.fgColor.argb, 'FFFFCCCC');
  assert.equal(thirdRace.getCell('G4').fill.fgColor.argb, 'FFFFFF99');
  assert.equal(thirdRace.getCell('I4').value, 'Sem ação');
  assert.equal(sheet.rowCount,4); assert.equal(thirdRace.rowCount,4);
});

test('race sheets are sorted numerically and preserve incident order without losing unassigned records', async () => {
  const { createIncidentWorkbook } = await import('../client/src/services/exportExcel.js');
  const workbook = await createIncidentWorkbook([
    {corrida:10,obs:'Corrida dez'}, {corrida:2,obs:'Primeiro registo'},
    {corrida:1,obs:'Corrida um'}, {corrida:'2',obs:'Segundo registo'},
    {obs:'Registo histórico sem corrida'}
  ],'Evento');
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.deepEqual(reopened.worksheets.map(sheet=>sheet.name),['Corrida 1','Corrida 2','Corrida 10','Sem corrida']);
  const secondRace = reopened.getWorksheet('Corrida 2');
  assert.equal(secondRace.getCell('I4').value,'Primeiro registo');
  assert.equal(secondRace.getCell('I5').value,'Segundo registo');
  assert.equal(reopened.getWorksheet('Sem corrida').getCell('I4').value,'Registo histórico sem corrida');
});

test('Excel export without incidents still contains the title and column headers', async () => {
  const { createIncidentWorkbook } = await import('../client/src/services/exportExcel.js');
  const workbook = await createIncidentWorkbook([], '');
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  const sheet = reopened.getWorksheet('Incidentes');
  assert.equal(sheet.getCell('A1').value, 'WFR RaceTech');
  assert.equal(sheet.rowCount, 3);
});
