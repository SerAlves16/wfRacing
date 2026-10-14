// ExcelJS is loaded only when exporting, keeping the initial React bundle small.
export async function exportExcel(incidents, title) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Incidentes');
  sheet.columns = [{key:'corrida',width:10},{key:'camera',width:15},{key:'curva',width:20},{key:'hora',width:15},{key:'video',width:12},{key:'report',width:12},{key:'nfa',width:12},{key:'priority',width:14},{key:'obs',width:60}];
  sheet.mergeCells('A1:I2'); sheet.getCell('A1').value=title || 'WFR RaceTech'; sheet.getCell('A1').font={bold:true,size:16};
  const header=sheet.addRow(['Race','Camera','Turn / Post','Time','Vídeo','Report','N.F.A.','Prioridade','Observações']);
  header.eachCell(cell => { cell.font={bold:true,color:{argb:'FFFFFFFF'}}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE30613'}}; });
  for(const incident of incidents) {
    const row=sheet.addRow({...incident,video:incident.video?'Sim':'Não',report:incident.report?'Sim':'Não',nfa:incident.nfa?'Sim':'Não',priority:incident.priority?'Sim':'Não'});
    row.alignment={vertical:'top',wrapText:true};
    if(incident.report)row.getCell('report').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFCCCC'}};
    if(incident.nfa)row.getCell('nfa').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF99'}};
  }
  const url=URL.createObjectURL(new Blob([await workbook.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download=(title || 'WFR').replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
