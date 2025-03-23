document.addEventListener('DOMContentLoaded', () => {
  // Selettori generali
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const settimanaInput = document.getElementById('num-settimana');
  const annoInput      = document.getElementById('anno');

  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  const noteInput      = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const whatsappBtn    = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  const tableSpese     = document.getElementById('table-spese');

  // Oggetto per memorizzare i dati
  let speseData = {
    lun: {},
    mar: {},
    mer: {},
    gio: {},
    ven: {},
    sab: {},
    dom: {}
  };

  // Giorni e categorie
  const giorni = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
  const speseViaggioCats = ["parcheggi", "noleggio", "taxiBus", "biglietti", "carburCont", "viaggioAltro"];
  const alloggioCats     = ["alloggio", "colazione", "pranzo", "cena", "acquaCaffe", "alloggioAltro"];
  const carburanteCats   = ["cartaEni"];

  // ========================
  // Funzione per calcolare il lunedì della settimana ISO
  // ========================
  function getMondayOfISOWeek(week, year) {
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7; // converte 0 (domenica) in 7
    const firstMonday = new Date(jan4);
    firstMonday.setDate(jan4.getDate() - jan4Day + 1);
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (week - 1) * 7);
    return monday;
  }

  // ========================
  // Funzione per aggiornare le intestazioni della tabella con le date
  // ========================
  function aggiornaDateSettimana(week, year) {
    const monday = getMondayOfISOWeek(week, year);
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const dd = currentDate.getDate().toString().padStart(2, '0');
      const mm = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const formattedDate = `${dd}.${mm}.${year}`;
      const th = document.querySelector(`#date-row th:nth-child(${i + 2})`);
      if (th) {
        th.innerText = formattedDate;
      }
    }
  }

  // ========================
  // Funzione aggiornaCalcoli
  // ========================
  function aggiornaCalcoli() {
    let totaleKmSettimana   = 0;
    let spViaggioWeekTot    = 0;
    let alloggioWeekTot     = 0;
    let carburanteWeekTot   = 0;

    // Calcolo Km Diff
    giorni.forEach(day => {
      const kmIni = parseFloat(speseData[day].kmIni) || 0;
      const kmFin = parseFloat(speseData[day].kmFin) || 0;
      const diff  = kmFin - kmIni;
      speseData[day].kmDiff = diff;
      const cellDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${day}"]`);
      if (cellDiff) cellDiff.innerText = diff.toFixed(2);
      totaleKmSettimana += diff;
    });

    // Calcolo subtotali giornalieri
    giorni.forEach(day => {
      let subtotViaggio    = 0;
      let subtotAlloggio   = 0;
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

      const cellViaggio = tableSpese.querySelector(`td[data-cat="spViaggioDay"][data-day="${day}"]`);
      if (cellViaggio) cellViaggio.innerText = subtotViaggio.toFixed(2);

      const cellAlloggio = tableSpese.querySelector(`td[data-cat="alloggioDay"][data-day="${day}"]`);
      if (cellAlloggio) cellAlloggio.innerText = subtotAlloggio.toFixed(2);

      const cellCarbEni = tableSpese.querySelector(`td[data-cat="carbEniDay"][data-day="${day}"]`);
      if (cellCarbEni) cellCarbEni.innerText = subtotCarburante.toFixed(2);

      spViaggioWeekTot  += subtotViaggio;
      alloggioWeekTot   += subtotAlloggio;
      carburanteWeekTot += subtotCarburante;
    });

    // Aggiorna Totale Km Settimana
    const cellKmSet = tableSpese.querySelector(".km-sett-tot");
    if (cellKmSet) {
      cellKmSet.innerText = totaleKmSettimana.toFixed(2);
    }

    // Aggiorna Totale di ogni riga per celle editabili
    const rows = tableSpese.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const totCell = row.querySelector(".totale-riga");
      if (totCell) {
        let somma = 0;
        const editCells = row.querySelectorAll('td[contenteditable="true"]');
        editCells.forEach(c => {
          // Utilizzo .replace e .trim per gestire correttamente eventuali virgole/spazi
          const v = parseFloat(c.innerText.replace(',', '.').trim()) || 0;
          somma += v;
        });
        totCell.innerText = somma.toFixed(2);
      }
    });

    // Totali settimanali per blocchi
    const spViaggioWeekCell = tableSpese.querySelector(".sp-viaggio-week-tot");
    if (spViaggioWeekCell) {
      spViaggioWeekCell.innerText = spViaggioWeekTot.toFixed(2);
    }
    const alloggioWeekCell = tableSpese.querySelector(".alloggio-week-tot");
    if (alloggioWeekCell) {
      alloggioWeekCell.innerText = alloggioWeekTot.toFixed(2);
    }
    const carbEniWeekCell = tableSpese.querySelector(".carburante-week-tot");
    if (carbEniWeekCell) {
      carbEniWeekCell.innerText = carburanteWeekTot.toFixed(2);
    }

    // Totale settimana (somma dei blocchi)
    const totalSett = spViaggioWeekTot + alloggioWeekTot + carburanteWeekTot;
    const cellTotSettimana = tableSpese.querySelector(".totale-settimana");
    if (cellTotSettimana) {
      cellTotSettimana.innerText = totalSett.toFixed(2);
    }
  }

  // ========================
  // Eventi sulle celle editabili
  // ========================
  const editableCells = tableSpese.querySelectorAll('td[contenteditable="true"]');
  editableCells.forEach(cell => {
    cell.addEventListener('input', () => {
      const cat = cell.dataset.cat;
      const day = cell.dataset.day;
      const val = parseFloat(cell.innerText.replace(',', '.').trim()) || 0;
      if (!speseData[day]) speseData[day] = {};
      speseData[day][cat] = val;
      aggiornaCalcoli();
    });
  });

  // ========================
  // Carica Settimana
  // ========================
  caricaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    const anno = annoInput.value;
    if (!sett || !anno) {
      alert("Inserisci sia il numero di settimana che l'anno!");
      return;
    }
    aggiornaDateSettimana(parseInt(sett), parseInt(anno));

    const key = `NotaSpese_${anno}_W${sett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun dato per la settimana ${sett} dell'anno ${anno}`);
      return;
    }
    const dati = JSON.parse(salvato);
    dipInput.value      = dati.dipendente || "";
    targaInput.value    = dati.targa || "";
    noteInput.value     = dati.note || "";
    firmaDirInput.value = dati.firmaDirezione || "";
    firmaDipInput.value = dati.firmaDipendente || "";
    speseData           = dati.speseData || {};

    // Ripristina i valori nelle celle
    giorni.forEach(day => {
      if (!speseData[day]) return;
      for (let cat in speseData[day]) {
        const cell = tableSpese.querySelector(`td[data-cat="${cat}"][data-day="${day}"]`);
        if (cell) {
          cell.innerText = speseData[day][cat];
        }
      }
    });
    aggiornaCalcoli();
    alert(`Settimana ${sett} dell'anno ${anno} caricata con successo!`);
  });

  // ========================
  // Salva Settimana
  // ========================
  salvaBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    const anno = annoInput.value;
    if (!sett || !anno) {
      alert("Inserisci sia il numero di settimana che l'anno!");
      return;
    }
    const key = `NotaSpese_${anno}_W${sett}`;
    const dati = {
      dipendente: dipInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteInput.value.trim(),
      firmaDirezione: firmaDirInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim(),
      speseData: speseData
    };
    localStorage.setItem(key, JSON.stringify(dati));
    alert(`Settimana ${sett} dell'anno ${anno} salvata con successo!`);
  });

  // ========================
  // Stampa in TXT
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

    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota_spese_${sett}.txt`;
    a.click();
  });

  // ========================
  // Invia via WhatsApp
  // ========================
  whatsappBtn.addEventListener('click', () => {
    const sett = settimanaInput.value;
    let msg = `NOTA SPESE (Settimana ${sett})\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // ========================
  // Stampa Replica Form
  // ========================
  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  // ========================
  // Gestione caricamento immagini e generazione ZIP
  // ========================
  const fileInput = document.getElementById('file-input');
  const fotoBtn = document.getElementById('foto-btn');
  const zipBtn = document.getElementById('zip-btn');
  const previewContainer = document.getElementById('preview-immagini');
  let imagesArray = []; // Array per memorizzare gli oggetti File delle immagini

  // Quando si clicca sul bottone per caricare le foto, attiva il file input
  fotoBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Gestione del caricamento file
  fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    for (let file of files) {
      // Usa FileReader per creare la preview
      const reader = new FileReader();
      reader.onload = function(e) {
        // Crea un contenitore per l'immagine e il pulsante di eliminazione
        const imgContainer = document.createElement('div');
        imgContainer.style.position = 'relative';
        imgContainer.style.display = 'inline-block';

        // Crea l'elemento immagine
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '150px';
        img.style.maxHeight = '150px';
        img.style.display = 'block';

        // Crea il pulsante per eliminare l'immagine
        const delBtn = document.createElement('button');
        delBtn.textContent = 'X';
        delBtn.style.position = 'absolute';
        delBtn.style.top = '0';
        delBtn.style.right = '0';
        delBtn.style.backgroundColor = 'red';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.cursor = 'pointer';

        // Evento per eliminare l'immagine dal preview e dall'array
        delBtn.addEventListener('click', () => {
          previewContainer.removeChild(imgContainer);
          imagesArray = imagesArray.filter(f => f !== file);
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(delBtn);
        previewContainer.appendChild(imgContainer);
      }
      reader.readAsDataURL(file);
      // Aggiunge il file all'array delle immagini
      imagesArray.push(file);
    }
    // Resetta il file input per poter ricaricare anche file già selezionati in futuro
    fileInput.value = "";
  });

  // Gestione della generazione dello ZIP
  zipBtn.addEventListener('click', async () => {
    if (imagesArray.length === 0) {
      alert("Nessuna foto caricata!");
      return;
    }
    
    const zip = new JSZip();
    // Ottieni il valore del campo "Settimana (es. 11/2025)"
    const settimanaImmagini = document.getElementById('settimana-immagini').value.trim();
    // Imposta il nome del file ZIP includendo il numero di settimana, se presente
    let zipFileName = settimanaImmagini ? `Settimana_${settimanaImmagini}.zip` : "immagini.zip";

    // Aggiunge ogni immagine allo ZIP
    for (let file of imagesArray) {
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }

    // Genera il file ZIP e attiva il download
    zip.generateAsync({type:"blob"}).then(function(content) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = zipFileName;
      a.click();
    });
  });
  
  // All'avvio
  aggiornaCalcoli();
});
