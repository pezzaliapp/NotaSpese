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
  // Chiavi: "lun","mar","mer","gio","ven","sab","dom"
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

  // Categorie di spese per subtotali
  const speseViaggioCats = ["parcheggi","noleggio","taxiBus","biglietti","carburCont","viaggioAltro"];
  const alloggioCats     = ["alloggio","colazione","pranzo","cena","acquaCaffe","alloggioAltro"];
  const carburanteCats   = ["cartaEni"];

  // ========================
  //  Funzione aggiornaCalcoli
  // ========================
  function aggiornaCalcoli() {
    let totaleKmSettimana   = 0;
    let totaleSpeseSett     = 0;

    // 1) Km Diff
    giorni.forEach(day => {
      const kmIni = parseFloat(speseData[day].kmIni) || 0;
      const kmFin = parseFloat(speseData[day].kmFin) || 0;
      const diff  = kmFin - kmIni;
      speseData[day].kmDiff = diff;

      // Aggiorna la cella data-cat="kmDiff"
      const cellDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) {
        cellDiff.innerText = diff.toFixed(2);
      }
      totaleKmSettimana += diff;
    });

    // 2) Subtotali giornalieri (Spese Viaggio, Alloggio/Pasti, Carburante)
    giorni.forEach(day => {
      let subtotViaggio    = 0;
      let subtotAlloggio   = 0;
      let subtotCarburante = 0;

      // spese Viaggio
      speseViaggioCats.forEach(cat => {
        subtotViaggio += parseFloat(speseData[day][cat]) || 0;
      });
      // Alloggio
      alloggioCats.forEach(cat => {
        subtotAlloggio += parseFloat(speseData[day][cat]) || 0;
      });
      // Carburante (Carta ENI)
      carburanteCats.forEach(cat => {
        subtotCarburante += parseFloat(speseData[day][cat]) || 0;
      });

      // Aggiorna celle
      const cellViaggio   = tableSpese.querySelector(`td[data-cat="spViaggioDay"][data-day="${day}"]`);
      if (cellViaggio)   cellViaggio.innerText = subtotViaggio.toFixed(2);

      const cellAlloggio  = tableSpese.querySelector(`td[data-cat="alloggioDay"][data-day="${day}"]`);
      if (cellAlloggio)  cellAlloggio.innerText = subtotAlloggio.toFixed(2);

      const cellCarbEni   = tableSpese.querySelector(`td[data-cat="carbEniDay"][data-day="${day}"]`);
      if (cellCarbEni)   cellCarbEni.innerText = subtotCarburante.toFixed(2);

      totaleSpeseSett += (subtotViaggio + subtotAlloggio + subtotCarburante);
    });

    // 3) Aggiorna la cella "km-sett-tot"
    const cellKmSet = tableSpese.querySelector(".km-sett-tot");
    if (cellKmSet) cellKmSet.innerText = totaleKmSettimana.toFixed(2);

    // 4) Per ogni riga, somma le 7 celle contenteditable => scrivi in .totale-riga
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

    // 5) Aggiorna la cella "totale-settimana" con la somma di tutte le spese
    // (No km). Abbiamo "totaleSpeseSett" calcolato.
    const cellTotSettimana = tableSpese.querySelector(".totale-settimana");
    if (cellTotSettimana) {
      cellTotSettimana.innerText = totaleSpeseSett.toFixed(2);
    }
  }

  // ========================
  //  Eventi su celle
  // ========================
  // Quando modifichi una cella, salvi in speseData e ricalcoli
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
    dipInput.value       = dati.dipendente      || "";
    targaInput.value     = dati.targa           || "";
    noteInput.value      = dati.note            || "";
    firmaDirInput.value  = dati.firmaDirezione  || "";
    firmaDipInput.value  = dati.firmaDipendente || "";
    speseData            = dati.speseData       || {};

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

  // All'avvio, calcola subito
  aggiornaCalcoli();
});
