document.addEventListener('DOMContentLoaded', () => {
  // Selettori generali
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const settimanaInput = document.getElementById('num-settimana');

  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  const noteInput      = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const whatsappBtn    = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  const tableSpese     = document.getElementById('table-spese');

  // Oggetto in cui memorizziamo i valori
  let speseData = {
    lun: {},
    mar: {},
    mer: {},
    gio: {},
    ven: {},
    sab: {},
    dom: {}
  };

  // Giorni
  const giorni = ["lun","mar","mer","gio","ven","sab","dom"];

  // Categorie di spesa
  const speseViaggioCats = ["parcheggi","noleggio","taxiBus","biglietti","carburCont","viaggioAltro"];
  const alloggioCats     = ["alloggio","colazione","pranzo","cena","acquaCaffe","alloggioAltro"];
  const carburanteCats   = ["cartaEni"];

  // ========================
  //  Funzione aggiornaCalcoli
  // ========================
  function aggiornaCalcoli() {
    let totaleKmSettimana   = 0;
    let spViaggioWeekTot    = 0;
    let alloggioWeekTot     = 0;
    let carburanteWeekTot   = 0;

    // 1) Calcolo Km Diff
    giorni.forEach(day => {
      const kmIni = parseFloat(speseData[day].kmIni) || 0;
      const kmFin = parseFloat(speseData[day].kmFin) || 0;
      const diff  = kmFin - kmIni;
      speseData[day].kmDiff = diff;

      // Aggiorna cella data-cat="kmDiff"
      const cellDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) cellDiff.innerText = diff.toFixed(2);

      totaleKmSettimana += diff;
    });

    // 2) Calcolo subtotali giornalieri per Spese Viaggio, Alloggio/Pasti, Carburante
    giorni.forEach(day => {
      let subtotViaggio    = 0;
      let subtotAlloggio   = 0;
      let subtotCarburante = 0;

      // spese Viaggio
      speseViaggioCats.forEach(cat => {
        subtotViaggio += parseFloat(speseData[day][cat]) || 0;
      });
      // Alloggio/Pasti
      alloggioCats.forEach(cat => {
        subtotAlloggio += parseFloat(speseData[day][cat]) || 0;
      });
      // Carburante (Carta ENI)
      carburanteCats.forEach(cat => {
        subtotCarburante += parseFloat(speseData[day][cat]) || 0;
      });

      // Aggiorna le celle di subtotale giornaliero
      const cellViaggio   = tableSpese.querySelector(`td[data-cat="spViaggioDay"][data-day="${day}"]`);
      if (cellViaggio) cellViaggio.innerText = subtotViaggio.toFixed(2);

      const cellAlloggio  = tableSpese.querySelector(`td[data-cat="alloggioDay"][data-day="${day}"]`);
      if (cellAlloggio) cellAlloggio.innerText = subtotAlloggio.toFixed(2);

      const cellCarbEni   = tableSpese.querySelector(`td[data-cat="carbEniDay"][data-day="${day}"]`);
      if (cellCarbEni) cellCarbEni.innerText = subtotCarburante.toFixed(2);

      // Accumula i subtotali per la settimana
      spViaggioWeekTot    += subtotViaggio;
      alloggioWeekTot     += subtotAlloggio;
      carburanteWeekTot   += subtotCarburante;
    });

    // 3) Aggiorna Totale Km Settimana
    const cellKmSet = tableSpese.querySelector(".km-sett-tot");
    if (cellKmSet) {
      cellKmSet.innerText = totaleKmSettimana.toFixed(2);
    }

    // 4) Aggiorna la colonna Totale di ogni riga
    const rows = tableSpese.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const totCell = row.querySelector(".totale-riga");
      if (totCell) {
        let somma = 0;
        const editCells = row.querySelectorAll('td[contenteditable="true"]');
        editCells.forEach(c => {
          const v = parseFloat(c.innerText) || 0;
          somma += v;
        });
        totCell.innerText = somma.toFixed(2);
      }
    }

    // 5) Calcolo Totale Spese Viaggio Settimana
    const spViaggioWeekCell = tableSpese.querySelector(".sp-viaggio-week-tot");
    if (spViaggioWeekCell) {
      spViaggioWeekCell.innerText = spViaggioWeekTot.toFixed(2);
    }

    // 6) Calcolo Totale Alloggio/Pasti Settimana
    const alloggioWeekCell = tableSpese.querySelector(".alloggio-week-tot");
    if (alloggioWeekCell) {
      alloggioWeekCell.innerText = alloggioWeekTot.toFixed(2);
    }

    // 7) Calcolo Totale Carburante ENI Settimana
    const carbEniWeekCell = tableSpese.querySelector(".carburante-week-tot");
    if (carbEniWeekCell) {
      carbEniWeekCell.innerText = carburanteWeekTot.toFixed(2);
    }

    // 8) TOTALE SETTIMANA (somma dei 3 blocchi)
    const totalSett = spViaggioWeekTot + alloggioWeekTot + carburanteWeekTot;
    const cellTotSettimana = tableSpese.querySelector(".totale-settimana");
    if (cellTotSettimana) {
      cellTotSettimana.innerText = totalSett.toFixed(2);
    }
  }

  // ========================
  //  Eventi su celle
  // ========================
  // Ogni cella editabile => aggiorna speseData e richiama aggiornaCalcoli
  const editableCells = tableSpese.querySelectorAll('td[contenteditable="true"]');
  editableCells.forEach(cell => {
    cell.addEventListener('input', () => {
      const cat = cell.dataset.cat;
      const day = cell.dataset.day;
      const val = parseFloat(cell.innerText.replace(',','.')) || 0;
      if (!speseData[day]) speseData[day] = {};
      speseData[day][cat] = val;
      aggiornaCalcoli();
    });
  });

  // ========================
  //  Carica e Salva
  // ========================
  caricaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    if (!sett) {
      alert("Inserisci un numero di settimana!");
      return;
    }
    const key = `NotaSpese_${sett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun dato per la settimana ${sett}`);
      return;
    }
    const dati = JSON.parse(salvato);
    dipInput.value    = dati.dipendente      || "";
    targaInput.value  = dati.targa           || "";
    noteInput.value   = dati.note            || "";
    firmaDirInput.value = dati.firmaDirezione  || "";
    firmaDipInput.value = dati.firmaDipendente || "";
    speseData         = dati.speseData       || {};

    // Ripristina i valori nelle celle
    for (let day of giorni) {
      if (!speseData[day]) continue;
      for (let cat in speseData[day]) {
        const cell = tableSpese.querySelector(`td[data-cat="${cat}"][data-day="${day}"]`);
        if (cell) {
          cell.innerText = speseData[day][cat];
        }
      }
    }
    aggiornaCalcoli();
    alert(`Settimana ${sett} caricata con successo!`);
  });

  salvaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    if (!sett) {
      alert("Inserisci un numero di settimana!");
      return;
    }
    const key = `NotaSpese_${sett}`;
    const dati = {
      dipendente: dipInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteInput.value.trim(),
      firmaDirezione: firmaDirInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim(),
      speseData: speseData
    };
    localStorage.setItem(key, JSON.stringify(dati));
    alert(`Settimana ${sett} salvata con successo!`);
  });

  // ========================
  //  Stampa / WhatsApp
  // ========================
  stampaTxtBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    let testo = `NOTA SPESE TRASFERTA - Settimana ${sett}\n\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    giorni.forEach(day => {
      testo += `${day.toUpperCase()}: ${JSON.stringify(speseData[day])}\n`;
    });
    testo += `\nNote: ${noteInput.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const blob = new Blob([testo], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota_spese_${sett}.txt`;
    a.click();
  });

  whatsappBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    let msg = `NOTA SPESE (Settimana ${sett})\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  // All'avvio
  aggiornaCalcoli();
});
