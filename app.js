document.addEventListener('DOMContentLoaded', () => {
  // SELETTORI GENERALI
  const dipInput = document.getElementById('dipendente');
  const targaInput = document.getElementById('targa');
  const settimanaInput = document.getElementById('num-settimana'); // Deve essere di tipo text (es. "11/2025")
  const noteInput = document.getElementById('note');
  const firmaDirInput = document.getElementById('firma-direzione');
  const firmaDipInput = document.getElementById('firma-dipendente');

  const caricaBtn = document.getElementById('carica-settimana');
  const salvaBtn = document.getElementById('salva-settimana');
  const stampaTxtBtn = document.getElementById('stampa-txt');
  const whatsappBtn = document.getElementById('condividi-whatsapp');
  const stampaRepBtn = document.getElementById('stampa-replica');

  // Tabella Excel-like
  const tableSpese = document.getElementById('table-spese');

  // Oggetto per memorizzare i valori per ogni giorno (chiavi: lun, mar, mer, gio, ven, sab, dom)
  let speseData = {
    lun: {},
    mar: {},
    mer: {},
    gio: {},
    ven: {},
    sab: {},
    dom: {}
  };

  const giorni = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
  const giorniNomi = {
    lun: "Lunedì",
    mar: "Martedì",
    mer: "Mercoledì",
    gio: "Giovedì",
    ven: "Venerdì",
    sab: "Sabato",
    dom: "Domenica"
  };

  // Categorie per i blocchi (per i subtotali)
  const speseViaggioCats = ["parcheggi", "noleggio", "taxiBus", "biglietti", "carburCont", "viaggioAltro"];
  const alloggioCats = ["alloggio", "colazione", "pranzo", "cena", "acquaCaffe", "alloggioAltro"];
  const carburanteCats = ["cartaEni"];

  // ===============================
  // Funzione: Aggiorna Intestazione (giorni con date)
  // ===============================
  function updateHeaderDates() {
    // Il campo settimanaInput deve avere il formato "ww/yyyy"
    const val = settimanaInput.value.trim();
    if (!val.includes("/")) return;
    const parts = val.split("/");
    if (parts.length !== 2) return;
    const week = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(week) || isNaN(year)) return;

    // Calcola il lunedì della settimana ISO (considerando il sistema ISO)
    const monday = getMondayOfISOWeek(week, year);
    // Costruisci le date per ogni giorno
    const headerRow = tableSpese.tHead.rows[0];
    // I dati iniziano dalla seconda cella (indice 1) fino all'indice 7 (lun-dom)
    for (let i = 1; i <= 7; i++) {
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + i - 1);
      headerRow.cells[i].innerText = giorniNomi[giorni[i - 1]] + " (" + formatDate(dateObj) + ")";
    }
  }

  // Funzione per calcolare il lunedì della settimana ISO data (week, year)
  function getMondayOfISOWeek(week, year) {
    // Crea una data per il primo giorno dell'anno
    const simple = new Date(year, 0, 1);
    // Ottieni il giorno della settimana (0 = Domenica, ... 6 = Sabato)
    const dow = simple.getDay();
    // Calcola il numero di giorni da aggiungere per raggiungere il primo lunedì
    const diff = dow === 0 ? 1 : (dow === 1 ? 0 : (8 - dow));
    // Primo lunedì dell'anno
    const firstMonday = new Date(year, 0, 1 + diff);
    // Calcola il lunedì della settimana desiderata
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (week - 1) * 7);
    return monday;
  }

  // Funzione per formattare la data in dd/mm/yyyy
  function formatDate(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  }

  // Aggiorna l'intestazione ogni volta che cambia il campo settimana
  settimanaInput.addEventListener('change', updateHeaderDates);

  // ===============================
  // Funzione: Aggiorna Calcoli e Subtotali
  // ===============================
  function aggiornaCalcoli() {
    let totaleKmSettimana = 0;
    let totaleSpeseSett = 0;
    let spViaggioWeekTot = 0;
    let alloggioWeekTot = 0;
    let carburanteWeekTot = 0;

    // 1) Calcola Km giornalieri (kmDiff = kmFin - kmIni)
    giorni.forEach(day => {
      const kmIni = parseFloat(speseData[day].kmIni) || 0;
      const kmFin = parseFloat(speseData[day].kmFin) || 0;
      const diff = kmFin - kmIni;
      speseData[day].kmDiff = diff;
      totaleKmSettimana += diff;
      const cellDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) cellDiff.innerText = diff.toFixed(2);
    });

    // 2) Calcola subtotali giornalieri per i blocchi
    giorni.forEach(day => {
      let subtotViaggio = 0;
      let subtotAlloggio = 0;
      let subtotCarburante = 0;

      speseViaggioCats.forEach(cat => {
        subtotViaggio += parseFloat(speseData[day][cat]) || 0;
      });
      alloggioCats.forEach(cat => {
        subtotAlloggio += parseFloat(speseData[day][cat]) || 0;
      });
      carburanteCats.forEach(cat => {
        subtotCarburante += parseFloat(speseData[day][cat]) || 0;
      });

      // Salva i subtotali nel global object (opzionale)
      speseData[day].spViaggioDay = subtotViaggio;
      speseData[day].alloggioDay = subtotAlloggio;
      speseData[day].carbEniDay = subtotCarburante;

      spViaggioWeekTot += subtotViaggio;
      alloggioWeekTot += subtotAlloggio;
      carburanteWeekTot += subtotCarburante;

      // Aggiorna le celle subtotali (ricorda: in index.html devono esserci celle con data-cat="spViaggioDay", "alloggioDay", "carbEniDay")
      const cellViaggio = tableSpese.querySelector(`td[data-cat="spViaggioDay"][data-day="${day}"]`);
      if (cellViaggio) cellViaggio.innerText = subtotViaggio.toFixed(2);
      const cellAlloggio = tableSpese.querySelector(`td[data-cat="alloggioDay"][data-day="${day}"]`);
      if (cellAlloggio) cellAlloggio.innerText = subtotAlloggio.toFixed(2);
      const cellCarbEni = tableSpese.querySelector(`td[data-cat="carbEniDay"][data-day="${day}"]`);
      if (cellCarbEni) cellCarbEni.innerText = subtotCarburante.toFixed(2);

      totaleSpeseSett += subtotViaggio + subtotAlloggio + subtotCarburante;
    });

    // 3) Aggiorna le righe Totale per ogni riga (somma delle 7 celle editabili)
    const rows = tableSpese.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const totCell = row.querySelector(".totale-riga");
      if (totCell) {
        let somma = 0;
        const editCells = row.querySelectorAll("td[contenteditable='true']");
        editCells.forEach(c => {
          somma += parseFloat(c.innerText) || 0;
        });
        totCell.innerText = somma.toFixed(2);
      }
    }

    // 4) Aggiorna Totali blocco e settimanale
    const cellKmSet = tableSpese.querySelector(".km-sett-tot");
    if (cellKmSet) cellKmSet.innerText = totaleKmSettimana.toFixed(2);

    const cellSpViaggioWeek = tableSpese.querySelector(".sp-viaggio-week-tot");
    if (cellSpViaggioWeek) cellSpViaggioWeek.innerText = spViaggioWeekTot.toFixed(2);

    const cellAlloggioWeek = tableSpese.querySelector(".alloggio-week-tot");
    if (cellAlloggioWeek) cellAlloggioWeek.innerText = alloggioWeekTot.toFixed(2);

    const cellCarburanteWeek = tableSpese.querySelector(".carburante-week-tot");
    if (cellCarburanteWeek) cellCarburanteWeek.innerText = carburanteWeekTot.toFixed(2);

    const cellTotSettimana = tableSpese.querySelector(".totale-settimana");
    if (cellTotSettimana) cellTotSettimana.innerText = totaleSpeseSett.toFixed(2);
  }

  // ===============================
  // Event listener sulle celle editabili
  // ===============================
  const editableCells = tableSpese.querySelectorAll("td[contenteditable='true']");
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

  // ===============================
  // Carica e Salva (LocalStorage)
  // ===============================
  caricaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value.trim();
    if (!sett) {
      alert("Inserisci il numero e l'anno della settimana (es. 11/2025)!");
      return;
    }
    const key = `NotaSpese_${sett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun dato per la settimana ${sett}`);
      return;
    }
    const dati = JSON.parse(salvato);
    dipInput.value = dati.dipendente || "";
    targaInput.value = dati.targa || "";
    noteInput.value = dati.note || "";
    firmaDirInput.value = dati.firmaDirezione || "";
    firmaDipInput.value = dati.firmaDipendente || "";
    speseData = dati.speseData || {};

    // Ripristina le celle della tabella
    giorni.forEach(day => {
      if (!speseData[day]) return;
      for (const cat in speseData[day]) {
        const cell = tableSpese.querySelector(`td[data-cat="${cat}"][data-day="${day}"]`);
        if (cell) cell.innerText = speseData[day][cat];
      }
    });
    aggiornaCalcoli();
    alert(`Settimana ${sett} caricata con successo!`);
  });

  salvaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value.trim();
    if (!sett) {
      alert("Inserisci il numero e l'anno della settimana (es. 11/2025)!");
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

  // ===============================
  // Stampa TXT
  // ===============================
  stampaTxtBtn.addEventListener('click', () => {
    const sett = settimanaInput.value.trim();
    let txt = `NOTA SPESE TRASFERTA - Settimana ${sett}\n\n`;
    txt += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    giorni.forEach(day => {
      txt += `${day.toUpperCase()}: ${JSON.stringify(speseData[day])}\n`;
    });
    txt += `\nNote: ${noteInput.value}\n`;
    txt += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;
    const blob = new Blob([txt], { type: "text/plain" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nota_spese_${sett}.txt`;
    a.click();
  });

  // ===============================
  // WhatsApp
  // ===============================
  whatsappBtn.addEventListener('click', () => {
    const sett = settimanaInput.value.trim();
    let msg = `NOTA SPESE (Settimana ${sett})\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  // ===============================
  // Aggiorna Intestazione (calcola date per settimana)
  // ===============================
  function updateHeaderDates() {
    // Il campo settimanaInput deve avere il formato "ww/yyyy" (es. "11/2025")
    const val = settimanaInput.value.trim();
    if (!val.includes("/")) return;
    const parts = val.split("/");
    if (parts.length !== 2) return;
    const week = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (isNaN(week) || isNaN(year)) return;

    // Calcola il lunedì della settimana ISO
    const monday = getMondayOfISOWeek(week, year);
    const headerRow = tableSpese.tHead.rows[0];
    // Aggiorna le intestazioni dei giorni (celle 1..7)
    for (let i = 1; i <= 7; i++) {
      const dayIndex = i - 1;
      const dateObj = new Date(monday);
      dateObj.setDate(monday.getDate() + dayIndex);
      headerRow.cells[i].innerText = giorniNomi[giorni[dayIndex]] + " (" + formatDate(dateObj) + ")";
    }
  }

  // Funzione per calcolare il lunedì della settimana ISO data la settimana e l'anno
  function getMondayOfISOWeek(week, year) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    let ISOweekStart = new Date(simple);
    // In ISO, la settimana inizia di lunedì (consideriamo che se il giorno è domenica, getDay() restituisce 0)
    if (dow === 0) {
      ISOweekStart.setDate(simple.getDate() - 6);
    } else {
      ISOweekStart.setDate(simple.getDate() - dow + 1);
    }
    return ISOweekStart;
  }

  // Funzione per formattare la data in dd/mm/yyyy
  function formatDate(dateObj) {
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  }

  // Mappa per associare i nomi dei giorni (in italiano) alle abbreviazioni
  const giorniNomi = {
    lun: "Lunedì",
    mar: "Martedì",
    mer: "Mercoledì",
    gio: "Giovedì",
    ven: "Venerdì",
    sab: "Sabato",
    dom: "Domenica"
  };

  // Aggiorna l'intestazione ogni volta che cambia il campo settimana
  settimanaInput.addEventListener('change', updateHeaderDates);

  // All'avvio, esegue i calcoli
  aggiornaCalcoli();
});
