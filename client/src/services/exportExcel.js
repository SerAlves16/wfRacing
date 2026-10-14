// ExcelJS is loaded only when exporting, keeping the initial React bundle small.
export async function createIncidentWorkbook(incidents, title) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  // Group only the exported records, preserving their order inside each race.
  const races = new Map();
  for (const incident of incidents) {
    const number = Number(incident.corrida);
    const key = Number.isSafeInteger(number) && number > 0 ? number : null;
    if (!races.has(key)) races.set(key, []);
    races.get(key).push(incident);
  }
  const groups = [...races.entries()].sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity));
  // An empty export still produces a valid workbook with the original column headers.
  if (!groups.length) groups.push([null, []]);
  for (const [number, records] of groups) {
    const name = number !== null ? `Corrida ${number}` : incidents.length ? 'Sem corrida' : 'Incidentes';
    const sheet = workbook.addWorksheet(name);
    sheet.columns = [{key:'corrida',width:10},{key:'camera',width:15},{key:'curva',width:20},{key:'hora',width:15},{key:'video',width:12},{key:'report',width:12},{key:'nfa',width:12},{key:'priority',width:14},{key:'obs',width:60}];
    sheet.mergeCells('A1:I2'); sheet.getCell('A1').value=(title || 'WFR RaceTech') + (number !== null ? ` — Corrida ${number}` : ''); sheet.getCell('A1').font={bold:true,size:16};
    const header=sheet.addRow(['Race','Camera','Turn / Post','Time','Vídeo','Report','N.F.A.','Prioridade','Observações']);
    header.eachCell(cell => { cell.font={bold:true,color:{argb:'FFFFFFFF'}}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE30613'}}; });
    for(const incident of records) {
      const row=sheet.addRow({...incident,video:incident.video?'Sim':'Não',report:incident.report?'Sim':'Não',nfa:incident.nfa?'Sim':'Não',priority:incident.priority?'Sim':'Não'});
      row.alignment={vertical:'top',wrapText:true};
      if(incident.report)row.getCell('report').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFCCCC'}};
      if(incident.nfa)row.getCell('nfa').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF99'}};
    }
  }
  return workbook;
}

export async function exportExcel(incidents, title) {
  const workbook = await createIncidentWorkbook(incidents, title);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }));
  const link = document.createElement('a');
  link.href = url;
  link.download = (title || 'WFR').replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
  link.style.display = 'none';
  // Attach the link before clicking; leave the Blob available while the browser saves it.
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
