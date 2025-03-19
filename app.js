document.addEventListener('DOMContentLoaded', () => {
  // Selettori dati generali
  const dipendenteInput = document.getElementById('dipendente');
  const targaInput = document.getElementById('targa');
  const settimanaInput = document.getElementById('num-settimana'); // numero settimana inserito dall'utente

  // Selettori per salvataggio/caricamento
  const caricaBtn = document.getElementById('carica-settimana');
  const salvaBtn = document.getElementById('salva-settimana');

  // Selettori per note e firme
  const noteInput = document.getElementById('note');
  const firmaDirezioneInput = document.getElementById('firma-direzione');
  const firmaDipendenteInput = document.getElementById('firma-dipendente');

  // La nostra tabella Excel-like
  const tableSpese = document.getElementById('table-spese');

  // Global object per memorizzare i dati per ogni giorno
  // Le chiavi saranno: "lun", "mar", "mer", "gio", "ven", "sab", "dom"
  // Ogni oggetto avrà proprietà per ogni categoria editabile (es. kmIni, kmFin, parcheggi, noleggio, taxiBus, biglietti, carburCont, viaggioAltro, alloggio, colazione, pranzo, cena, acquaCaffe, alloggioAltro, cartaEni)
  let speseData = {
    lun: {},
    mar: {},
    mer: {},
    gio: {},
    ven: {},
    sab: {},
    dom: {}
  };

  // Array di giorni per riferimento
  const giorni = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

  // Definisci gli array di categorie per il calcolo dei subtotali
  const speseViaggioCats = ["parcheggi", "noleggio", "taxiBus", "biglietti", "carburCont", "viaggioAltro"];
  const alloggioCats = ["alloggio", "colazione", "pranzo", "cena", "acquaCaffe", "alloggioAltro"];
  const carburanteCats = ["cartaEni"];

  // Funzione per calcolare i totali e i subtotali
  function aggiornaCalcoli() {
    let totaleKmSettimana = 0;
    let totaleSpeseSettimana = 0;

    // 1. Calcola i Km giornalieri per ogni giorno: kmDiff = kmFin - kmIni
    giorni.forEach(day => {
      const kmIni = parseFloat(speseData[day].kmIni) || 0;
      const kmFin = parseFloat(speseData[day].kmFin) || 0;
      const diff = kmFin - kmIni;
      speseData[day].kmDiff = diff;
      totaleKmSettimana += diff;
      // Aggiorna la cella corrispondente
      const cellDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) {
        cellDiff.innerText = diff.toFixed(2);
      }
    });

    // 2. Calcola i subtotali giornalieri per i blocchi:
    // Per ogni giorno, somma le celle delle categorie interessate
    giorni.forEach(day => {
      let subtotViaggio = 0, subtotAlloggio = 0, subtotCarburante = 0;
      speseViaggioCats.forEach(cat => {
        subtotViaggio += parseFloat(speseData[day][cat]) || 0;
      });
      alloggioCats.forEach(cat => {
        subtotAlloggio += parseFloat(speseData[day][cat]) || 0;
      });
      carburanteCats.forEach(cat => {
        subtotCarburante += parseFloat(speseData[day][cat]) || 0;
      });
      // Salva i subtotali nel global object (se utile per export)
      speseData[day].spViaggioDay = subtotViaggio;
      speseData[day].alloggioDay = subtotAlloggio;
      speseData[day].carbEniDay = subtotCarburante;

      totaleSpeseSettimana += (subtotViaggio + subtotAlloggio + subtotCarburante);

      // Aggiorna le celle dei subtotali giornalieri nella tabella
      const cellViaggio = tableSpese.querySelector(`td[data-cat="spViaggioDay"][data-day="${day}"]`);
      if (cellViaggio) cellViaggio.innerText = subtotViaggio.toFixed(2);
      const cellAlloggio = tableSpese.querySelector(`td[data-cat="alloggioDay"][data-day="${day}"]`);
      if (cellAlloggio) cellAlloggio.innerText = subtotAlloggio.toFixed(2);
      const cellCarburante = tableSpese.querySelector(`td[data-cat="carbEniDay"][data-day="${day}"]`);
      if (cellCarburante) cellCarburante.innerText = subtotCarburante.toFixed(2);
    });

    // 3. Aggiorna le righe "Totale" per ogni riga editabile
    const rows = tableSpese.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Se la riga ha una cella con classe "totale-riga", allora sommiamo le celle editabili (quelle con data-cat)
      const totCell = row.querySelector(".totale-riga");
      if (totCell) {
        let somma = 0;
        // Se la riga non è una riga "subtotale" (che verrà calcolata separatamente)
        const cells = row.querySelectorAll("td[contenteditable='true']");
        cells.forEach(c => {
          const v = parseFloat(c.innerText) || 0;
          somma += v;
        });
        totCell.innerText = somma.toFixed(2);
      }
    }

    // 4. Aggiorna le righe di blocco (subtotali dei blocchi)
    // Ad esempio, la riga con classe "km-sett-tot" viene aggiornata con la somma dei kmDiff
    const cellKmTot = tableSpese.querySelector(".km-sett-tot");
    if (cellKmTot) cellKmTot.innerText = totaleKmSettimana.toFixed(2);

    // Totale spese (no km): somma delle righe che NON sono relative ai km
    let totSpeseNoKm = 0;
    // Iteriamo sulle righe del corpo della tabella
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstCell = row.cells[0].innerText.toLowerCase();
      // Se la riga inizia con "km", saltala
      if (firstCell.includes("km")) return;
      const totCell = row.querySelector(".totale-riga");
      if (totCell) {
        totSpeseNoKm += parseFloat(totCell.innerText) || 0;
      }
    }
    const totaleSettimanaCell = tableSpese.querySelector(".totale-settimana");
    if (totaleSettimanaCell) totaleSettimanaCell.innerText = totSpeseNoKm.toFixed(2);
  }

  // 📌 Aggiunge un listener a tutte le celle editabili per aggiornare speseData
  const editableCells = tableSpese.querySelectorAll('td[contenteditable="true"]');
  editableCells.forEach(cell => {
    cell.addEventListener('input', () => {
      const cat = cell.dataset.cat;
      const day = cell.dataset.day;
      const val = parseFloat(cell.innerText.replace(',', '.')) || 0;
      if (!speseData[day]) speseData[day] = {};
      speseData[day][cat] = val;
      aggiornaCalcoli();
    });
  });

  // 📌 Carica settimana salvata dal localStorage
  caricaBtn.addEventListener('click', () => {
    const settimana = settimanaInput.value;
    if (!settimana) {
      alert("Inserisci un numero di settimana valido!");
      return;
    }
    const key = `NotaSpese_${settimana}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun dato trovato per la settimana ${settimana}`);
      return;
    }
    const dati = JSON.parse(salvato);
    dipendenteInput.value = dati.dipendente || "";
    targaInput.value = dati.targa || "";
    noteInput.value = dati.note || "";
    firmaDirezioneInput.value = dati.firmaDirezione || "";
    firmaDipendenteInput.value = dati.firmaDipendente || "";
    speseData = dati.speseData || {};
    // Ripristina i valori nelle celle
    Object.keys(speseData).forEach(day => {
      Object.keys(speseData[day]).forEach(cat => {
        const cell = tableSpese.querySelector(`td[data-cat="${cat}"][data-day="${day}"]`);
        if (cell) cell.innerText = speseData[day][cat];
      });
    });
    aggiornaCalcoli();
    alert(`Settimana ${settimana} caricata con successo!`);
  });

  // 📌 Salva settimana su localStorage
  salvaBtn.addEventListener('click', () => {
    const settimana = settimanaInput.value;
    if (!settimana) {
      alert("Inserisci un numero di settimana valido!");
      return;
    }
    const key = `NotaSpese_${settimana}`;
    const dati = {
      dipendente: dipendenteInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteInput.value.trim(),
      firmaDirezione: firmaDirezioneInput.value.trim(),
      firmaDipendente: firmaDipendenteInput.value.trim(),
      speseData: speseData
    };
    localStorage.setItem(key, JSON.stringify(dati));
    alert(`Settimana ${settimana} salvata con successo!`);
  });

  // 📌 Stampa in TXT
  stampaTxtBtn.addEventListener('click', () => {
    const settimana = settimanaInput.value;
    let txt = `NOTA SPESE TRASFERTA - Settimana ${settimana}\n\nDipendente: ${dipendenteInput.value}\nTarga: ${targaInput.value}\n\n`;
    giorni.forEach(day => {
      txt += `${day.toUpperCase()}: ${JSON.stringify(speseData[day])}\n`;
    });
    txt += `\nNote: ${noteInput.value}\nVisto Direzione: ${firmaDirezioneInput.value}\nFirma Dipendente: ${firmaDipendenteInput.value}\n`;
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nota_spese_${settimana}.txt`;
    a.click();
  });

  // 📌 WhatsApp (esempio semplice)
  whatsappBtn.addEventListener('click', () => {
    const msg = `Nota Spese Settimana ${settimanaInput.value}: Dipendente ${dipendenteInput.value}, Targa ${targaInput.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  });

  // Inizializza i calcoli
  aggiornaCalcoli();
});
