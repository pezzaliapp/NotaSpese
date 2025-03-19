document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Selettori
  //
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const settInput      = document.getElementById('numero-settimana');
  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  const tableExcel     = document.getElementById('table-excel');
  const noteArea       = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const wappBtn        = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  // Celle editabili => mappa: data-cat + data-day => valore
  // Salveremo questi dati in un oggetto come { lun: {...}, mar: {...}, mer: {...} ... }
  // E per le categorie: kmIni, kmFin, parcheggi, alloggio, ...
  // Poi calcoliamo differenze e totali.

  // Memoria in JS:
  let speseData = {
    // es. "lun": { kmIni: 0, kmFin: 0, parcheggi: 0, ... },
    // "mar": { kmIni: ..., ...}, ...
  };

  // Al caricamento, inizializziamo con 0 tutte le celle
  initSpeseData();

  function initSpeseData() {
    ["lun","mar","mer","gio","ven","sab","dom"].forEach(g => {
      speseData[g] = {
        kmIni: 0,
        kmFin: 0,
        // spese-viaggio:
        parcheggi: 0,
        // ... e così via per ogni riga definita
        alloggio: 0,
        // Carburante, etc.
        carburanteENI: 0
      };
    });
  }

  // 2. Lega eventi su contenteditable => oninput => aggiorna speseData e ricalcola
  const cells = tableExcel.querySelectorAll('td[contenteditable="true"]');
  cells.forEach(cell => {
    cell.addEventListener('input', () => {
      const cat = cell.dataset.cat;  // es. "kmIni", "parcheggi", ...
      const day = cell.dataset.day;  // es. "lun", "mar", ...
      const val = parseFloat(cell.innerText.replace(',','.')) || 0;
      if (speseData[day]) {
        speseData[day][cat] = val;
      }
      aggiornaCalcoli();
    });
  });

  // 3. Funzione aggiornaCalcoli => calcola diff Km, tot riga, tot blocco, tot settimana
  function aggiornaCalcoli() {
    // a) Per ogni riga "Km Giornalieri" => kmFin - kmIni su base day
    // Troviamo le celle data-cat="kmDiff"
    ["lun","mar","mer","gio","ven","sab","dom"].forEach(day => {
      const ini = speseData[day].kmIni || 0;
      const fin = speseData[day].kmFin || 0;
      const diff = fin - ini;
      // Troviamo la cella "data-cat=kmDiff" e data-day=day
      const cellDiff = tableExcel.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) {
        cellDiff.innerText = diff;
      }
    });

    // b) Totale di riga => somma di Lunedì..Domenica
    // Esempio, la riga "Km Iniziali" => data-cat="kmIni"
    // prendiamo la riga .km-iniziali => .totale-riga
    const allRows = tableExcel.querySelectorAll('tbody tr');
    allRows.forEach(row => {
      const catCells = row.querySelectorAll('td[contenteditable="true"]');
      let somma = 0;
      catCells.forEach(c => {
        const val = parseFloat(c.innerText.replace(',','.'))||0;
        somma += val;
      });
      const totCell = row.querySelector('.totale-riga');
      if (totCell) {
        totCell.innerText = somma.toFixed(2);
      }
    });

    // c) Totale blocco (es. la riga ".tot-km" => .totale-blocco-km)
    // cerchiamo differenza tot riga di "Km Giornalieri", la sommiamo
    const kmDiffCells = tableExcel.querySelectorAll('td[data-cat="kmDiff"]');
    let sommaKmSett = 0;
    kmDiffCells.forEach(cd => {
      const val = parseFloat(cd.innerText.replace(',','.'))||0;
      sommaKmSett += val;
    });
    const totKmCell = tableExcel.querySelector('.totale-blocco-km');
    if (totKmCell) totKmCell.innerText = sommaKmSett.toFixed(2);

    // d) Totale Spese Viaggio (somma righe: parcheggi, taxi, bus, etc.)
    // e) Totale Alloggio e Pasti
    // f) Totale Carburante
    // Per esempio, la ".spese-viaggio-total" => .totale-blocco-viaggio
    // puoi personalizzare la logica per ciascun blocco.
    let sommaViaggio = 0;
    // un array di cat che fanno parte di spese-viaggio
    // oppure prendi la riga .spese-parcheggi etc. e somma .totale-riga
    const righeViaggio = tableExcel.querySelectorAll('.spese-parcheggi, .spese-noleggio, ...');
    righeViaggio.forEach(r => {
      const tot = r.querySelector('.totale-riga');
      if (tot) {
        const v = parseFloat(tot.innerText)||0;
        sommaViaggio += v;
      }
    });
    const totViaggioCell = tableExcel.querySelector('.totale-blocco-viaggio');
    if (totViaggioCell) totViaggioCell.innerText = sommaViaggio.toFixed(2);

    // ... e così via per Alloggio e Pasti, Carburante, ...
    let sommaAlloggio = 0; 
    // raccogli le righe e somma .totale-riga => .totale-blocco-alloggio
    // ...
    // g) TOTALE SETTIMANA (somme di tutti i blocchi spese, non i km)
    // Esempio:
    let totSettimana = sommaViaggio + /* + alloggio + carburante + ...*/ 0;
    // Se hai righe .alloggio-pasti-total e .carburante-total con i totali di blocco
    // potresti semplicemente sommarli.
    const cellTotSettimana = tableExcel.querySelector('.totale-settimana');
    if (cellTotSettimana) cellTotSettimana.innerText = totSettimana.toFixed(2);
  }

  aggiornaCalcoli(); // Per inizializzare

  // 4. Carica/Salva
  caricaBtn.addEventListener('click', () => {
    const nSett = settInput.value;
    if (!nSett) { alert('N. settimana mancante'); return; }
    const key = `NotaSpese_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun salvataggio per la settimana ${nSett}`);
      return;
    }
    const obj = JSON.parse(salvato);
    dipInput.value    = obj.dipendente||'';
    targaInput.value  = obj.targa||'';
    noteArea.value    = obj.note||'';
    firmaDirInput.value= obj.firmaDirezione||'';
    firmaDipInput.value= obj.firmaDipendente||'';
    speseData         = obj.speseData||{};
    // Aggiorna le celle
    ripristinaCelle();
    aggiornaCalcoli();
    alert(`Settimana ${nSett} caricata con successo!`);
  });

  salvaBtn.addEventListener('click', () => {
    const nSett = settInput.value;
    if (!nSett) { alert('N. settimana mancante'); return; }
    const key = `NotaSpese_${nSett}`;
    const obj = {
      dipendente: dipInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteArea.value.trim(),
      firmaDirezione: firmaDirInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim(),
      speseData: speseData
    };
    localStorage.setItem(key, JSON.stringify(obj));
    alert(`Settimana ${nSett} salvata correttamente!`);
  });

  function ripristinaCelle() {
    // speseData => { lun: { kmIni:..., kmFin:..., parcheggi:..., ...}, mar: {...}, ... }
    // Svuotiamo tutte le celle (contenteditable) e poi reimpostiamo
    const cells = tableExcel.querySelectorAll('td[contenteditable="true"]');
    cells.forEach(cell => {
      cell.innerText = '';
    });
    // Ora riempiamo
    ["lun","mar","mer","gio","ven","sab","dom"].forEach(g => {
      if (!speseData[g]) return; 
      for (const cat in speseData[g]) {
        const sel = `td[contenteditable="true"][data-cat="${cat}"][data-day="${g}"]`;
        const cella = tableExcel.querySelector(sel);
        if (cella) {
          cella.innerText = speseData[g][cat] || 0;
        }
      }
    });
  }

  // 5. Stampa in TXT
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = settInput.value||'';
    let testo = `NOTA SPESE TRASFERTA - Settimana ${nSett}\n\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    // Potresti generare un testo che riflette le celle
    // Esempio: per each day => stampi i valori
    // ...
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const blob = new Blob([testo],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`nota_spese_${nSett}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // 6. WhatsApp
  wappBtn.addEventListener('click', () => {
    let testo = `NOTA SPESE\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    // ... potresti elencare i valori principali
    const url = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(url,'_blank');
  });

  // 7. Stampa Form
  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  // 8. Se vuoi registrare un service worker per la PWA:
  /*
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
  */
});
