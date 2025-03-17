document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Mappa Sottocategorie
  //
  const sottoCatMap = {
    km: ['Km Iniziali','Km Finali'],
    'spese-viaggio': [
      'Parcheggi','Noleggio Auto','Taxi / Autobus','Biglietti Aerei/Treni','Carburante c/contante','Altro'
    ],
    'alloggio-pasti': [
      'Alloggio','Colazione','Pranzo','Cena','Acqua/Caffè','Altro'
    ],
    carburante: ['Carta ENI']
  };

  //
  // 2. Strutture dati
  //
  // vociCorrenti: array di oggetti { data, giorno, settimanaAuto, descrizione, categoria, sottocategoria, valore }
  let vociCorrenti = [];
  let editIndex = -1; // se >=0 stiamo modificando

  //
  // 3. Selettori
  //
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const nSettInput     = document.getElementById('numero-settimana');
  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  // Inserimento voce
  const dataInput      = document.getElementById('data-giorno');
  const giornoInput    = document.getElementById('giorno-settimana');
  const settAutoInput  = document.getElementById('settimana-auto');
  const descInput      = document.getElementById('descrizione-giorno');
  const catSelect      = document.getElementById('categoria');
  const sottoCatSelect = document.getElementById('sottocategoria');
  const valoreInput    = document.getElementById('valore-voce');
  const aggiungiBtn    = document.getElementById('aggiungi-voce');

  // Tabella di editing
  const riepilogoBody  = document.querySelector('#riepilogo-table tbody');
  const sommaSettEl    = document.getElementById('somma-settimanale');

  // Report settimanale
  const reportBody     = document.querySelector('#report-table tbody');
  const reportTotali   = document.getElementById('report-totali');

  // Note / firme
  const noteArea       = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  // Pulsanti export
  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const wappBtn        = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  //
  // 4. Cambio data => calcolo giorno e settimana
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    // Esempio: "2025-03-17"
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const d = new Date(+yyyy, +mm -1, +dd);

    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[d.getDay()];

    const w = getISOWeekNumber(d);
    settAutoInput.value = w;
  });

  function getISOWeekNumber(d) {
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    let day = tmp.getUTCDay();
    if (day === 0) day = 7;
    tmp.setUTCDate(tmp.getUTCDate()+4-day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    return Math.ceil(((tmp - yearStart)/86400000 +1)/7);
  }

  //
  // 5. Cambio categoria => aggiorna sottocategorie
  //
  catSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const c = catSelect.value;
    if (sottoCatMap[c]) {
      sottoCatMap[c].forEach(sub => {
        const op = document.createElement('option');
        op.value=sub; op.textContent=sub;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 6. Aggiungi / Modifica voce
  //
  aggiungiBtn.addEventListener('click', () => {
    if (!dataInput.value) {
      alert('Inserisci una data');
      return;
    }
    if (!catSelect.value || !sottoCatSelect.value) {
      alert('Scegli Categoria e Sottocategoria');
      return;
    }
    const voce = {
      data: dataInput.value,
      giorno: giornoInput.value,
      settimanaAuto: settAutoInput.value,
      descrizione: descInput.value.trim(),
      categoria: catSelect.value,
      sottocategoria: sottoCatSelect.value,
      valore: parseFloat(valoreInput.value) || 0
    };

    if (editIndex >= 0) {
      // Modifichiamo una riga esistente
      vociCorrenti[editIndex] = voce;
      editIndex = -1;
      aggiungiBtn.textContent='Aggiungi';
    } else {
      // Nuova voce
      vociCorrenti.push(voce);
    }

    // Se vuoi NON cambiare la data e la categoria per altre voci,
    // basta pulire solo descrizione e valore:
    descInput.value = '';
    valoreInput.value = '';

    aggiornaTabelle();
  });

  //
  // 7. Aggiorna tabelle (editing + report)
  //
  function aggiornaTabelle() {
    // 7a) Tabella di editing
    riepilogoBody.innerHTML = '';

    vociCorrenti.forEach((voce, i) => {
      const tr = document.createElement('tr');

      // Data
      const tdData = document.createElement('td');
      tdData.textContent = voce.data;
      tr.appendChild(tdData);

      // Giorno
      const tdGiorno = document.createElement('td');
      tdGiorno.textContent = voce.giorno;
      tr.appendChild(tdGiorno);

      // Settimana
      const tdSett = document.createElement('td');
      tdSett.textContent = voce.settimanaAuto || '';
      tr.appendChild(tdSett);

      // Descrizione
      const tdDesc = document.createElement('td');
      tdDesc.textContent = voce.descrizione;
      tr.appendChild(tdDesc);

      // Categoria
      const tdCat = document.createElement('td');
      tdCat.textContent = voce.categoria;
      tr.appendChild(tdCat);

      // Sottocategoria
      const tdSub = document.createElement('td');
      tdSub.textContent = voce.sottocategoria;
      tr.appendChild(tdSub);

      // Valore
      const tdVal = document.createElement('td');
      tdVal.textContent = voce.valore;
      tr.appendChild(tdVal);

      // Diff Km => 0 se “Km Iniziali”, se “Km Finali” => differenza con “Km Iniziali” stessa data
      const tdDiff = document.createElement('td');
      tdDiff.textContent = '0';
      if (voce.categoria==='km' && voce.sottocategoria==='Km Finali') {
        const kmIni = vociCorrenti.find(x =>
          x.data===voce.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (kmIni) {
          tdDiff.textContent = voce.valore - kmIni.valore;
        }
      }
      tr.appendChild(tdDiff);

      // Azioni
      const tdAz = document.createElement('td');
      const btnMod = document.createElement('button');
      btnMod.textContent='Modifica';
      btnMod.addEventListener('click', () => {
        editIndex = i;
        dataInput.value = voce.data;
        giornoInput.value = voce.giorno;
        settAutoInput.value = voce.settimanaAuto;
        descInput.value = voce.descrizione;
        catSelect.value = voce.categoria;
        sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
        if (sottoCatMap[voce.categoria]) {
          sottoCatMap[voce.categoria].forEach(sc => {
            const op = document.createElement('option');
            op.value=sc; op.textContent=sc;
            sottoCatSelect.appendChild(op);
          });
        }
        sottoCatSelect.value=voce.sottocategoria;
        valoreInput.value = voce.valore;
        aggiungiBtn.textContent='Salva Modifica';
      });
      tdAz.appendChild(btnMod);

      const btnDel = document.createElement('button');
      btnDel.textContent='Elimina';
      btnDel.style.marginLeft='5px';
      btnDel.addEventListener('click', () => {
        vociCorrenti.splice(i,1);
        aggiornaTabelle();
      });
      tdAz.appendChild(btnDel);

      tr.appendChild(tdAz);
      riepilogoBody.appendChild(tr);
    });

    // Totale spese (no km)
    let totSpese = 0;
    vociCorrenti.forEach(v => { if(v.categoria!=='km') totSpese += v.valore; });
    sommaSettEl.textContent = totSpese.toFixed(2);

    // 7b) Aggiorna il “Report Settimanale”
    aggiornaReport();
  }

  //
  // 8. Report Settimanale
  //
  function aggiornaReport() {
    reportBody.innerHTML = '';
    reportTotali.innerHTML = '';

    // Ordiniamo le voci per data
    const vociOrdinate = [...vociCorrenti].sort((a,b) => a.data.localeCompare(b.data));

    // Raggruppiamo per data
    const dayMap = {};
    vociOrdinate.forEach(voce => {
      if (!dayMap[voce.data]) dayMap[voce.data] = [];
      dayMap[voce.data].push(voce);
    });

    let totKmSett = 0;
    let totSpeseSett = 0;

    // Per ogni data, calcoliamo KmIniziali, KmFinali, diff, subtot spese
    Object.keys(dayMap).sort().forEach(dataKey => {
      const elenco = dayMap[dataKey];
      const voce0 = elenco[0]; // prendiamo la prima voce per giorno/giorno/sett
      const giorno = voce0.giorno;
      const settAuto = voce0.settimanaAuto || '??';
      let descrGiorno = '';
      let kmIni = null, kmFin=null;
      let subSpese = 0;

      elenco.forEach(v => {
        if (v.categoria==='km') {
          if (v.sottocategoria==='Km Iniziali') kmIni = v.valore;
          if (v.sottocategoria==='Km Finali')   kmFin = v.valore;
        } else {
          subSpese += v.valore;
        }
        // Se vuoi prendere la descrizione “più significativa”
        if (!descrGiorno && v.descrizione) descrGiorno = v.descrizione;
      });

      let diffKm = 0;
      if (kmIni!==null && kmFin!==null) diffKm = kmFin - kmIni;

      totKmSett += diffKm;
      totSpeseSett += subSpese;

      // Creiamo la riga report
      const tr = document.createElement('tr');

      // colonna “Settimana”
      const tdSet = document.createElement('td');
      tdSet.textContent = settAuto;
      tr.appendChild(tdSet);

      const tdData = document.createElement('td');
      tdData.textContent = dataKey;
      tr.appendChild(tdData);

      const tdGiorno = document.createElement('td');
      tdGiorno.textContent = giorno;
      tr.appendChild(tdGiorno);

      const tdDesc = document.createElement('td');
      tdDesc.textContent = descrGiorno;
      tr.appendChild(tdDesc);

      const tdIni = document.createElement('td');
      tdIni.textContent = (kmIni!==null)? kmIni : '';
      tr.appendChild(tdIni);

      const tdFin = document.createElement('td');
      tdFin.textContent = (kmFin!==null)? kmFin : '';
      tr.appendChild(tdFin);

      const tdDiff = document.createElement('td');
      tdDiff.textContent = diffKm;
      tr.appendChild(tdDiff);

      const tdSpese = document.createElement('td');
      tdSpese.textContent = subSpese.toFixed(2);
      tr.appendChild(tdSpese);

      reportBody.appendChild(tr);
    });

    // Totali
    reportTotali.innerHTML = `
      Km totali nella settimana: ${totKmSett}<br/>
      Spese totali nella settimana: ${totSpeseSett.toFixed(2)}
    `;
  }

  //
  // 9. Carica Settimana
  //
  caricaBtn.addEventListener('click', () => {
    const nSett = nSettInput.value;
    if (!nSett) {
      alert('Inserisci il numero di settimana da caricare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun salvataggio per la settimana ${nSett}`);
      return;
    }
    const obj = JSON.parse(salvato);
    dipInput.value      = obj.dipendente || '';
    targaInput.value    = obj.targa || '';
    noteArea.value      = obj.note || '';
    firmaDirInput.value = obj.firmaDirezione || '';
    firmaDipInput.value = obj.firmaDipendente || '';
    vociCorrenti        = obj.voci || [];
    editIndex = -1;
    aggiungiBtn.textContent='Aggiungi';
    aggiornaTabelle();
    alert(`Settimana ${nSett} caricata con successo!`);
  });

  //
  // 10. Salva Settimana
  //
  salvaBtn.addEventListener('click', () => {
    const nSett = nSettInput.value;
    if (!nSett) {
      alert('Inserisci il numero di settimana da salvare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const obj = {
      dipendente: dipInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteArea.value.trim(),
      firmaDirezione: firmaDirInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim(),
      voci: vociCorrenti
    };
    localStorage.setItem(key, JSON.stringify(obj));
    alert(`Settimana ${nSett} salvata correttamente!`);
  });

  //
  // 11. Stampa, WhatsApp, Print
  //
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = nSettInput.value || '';
    let testo = `NOTA SPESE - Settimana ${nSett}\n\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] S${v.settimanaAuto} - ${v.descrizione} => ${v.categoria}/${v.sottocategoria} = ${v.valore}`;
      if (v.categoria==='km' && v.sottocategoria==='Km Finali') {
        const ini = vociCorrenti.find(x =>
          x.data===v.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (ini) {
          const diff = v.valore - ini.valore;
          testo += ` (Diff Km: ${diff})`;
        }
      }
      testo += `\n`;
    });
    let totSpese = 0;
    vociCorrenti.forEach(x => { if(x.categoria!=='km') totSpese+= x.valore; });
    testo += `\nTotale Spese (no Km): ${totSpese.toFixed(2)}\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const blob = new Blob([testo], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`nota_spese_sett_${nSett}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  wappBtn.addEventListener('click', () => {
    const nSett = nSettInput.value || '';
    let testo = `NOTA SPESE (Settimana ${nSett})\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} - S${v.settimanaAuto}] ${v.giorno} => ${v.categoria}/${v.sottocategoria}: ${v.valore}\n`;
      if (v.categoria==='km' && v.sottocategoria==='Km Finali') {
        const ini = vociCorrenti.find(x =>
          x.data===v.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (ini) {
          const diff = v.valore - ini.valore;
          testo += `Diff Km: ${diff}\n`;
        }
      }
      testo += `\n`;
    });
    let totSpese = 0;
    vociCorrenti.forEach(x => { if(x.categoria!=='km') totSpese += x.valore; });
    testo += `Totale Spese (no Km): ${totSpese.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const url = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(url,'_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 12. Avvio
  //
  aggiornaTabelle(); // tabelle vuote all'inizio
});
