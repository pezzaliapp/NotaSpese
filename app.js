// app.js
document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Dizionario delle sottocategorie per ogni categoria
  //
  const sottoCategorie = {
    km: ['Km Iniziali', 'Km Finali'],
    'spese-viaggio': [
      'Parcheggi',
      'Noleggio Auto',
      'Taxi / Autobus',
      'Biglietti Aerei/Treni',
      'Carburante c/contante',
      'Altro'
    ],
    'alloggio-pasti': [
      'Alloggio',
      'Colazione',
      'Pranzo',
      'Cena',
      'Acqua/Caffè',
      'Altro'
    ],
    carburante: ['Carta ENI']
  };

  // Array in cui memorizzeremo le voci di spesa inserite
  let spese = [];

  //
  // 2. Selettori principali
  //
  // In alto (Dipendente, Targa, Numero Settimana)
  const dipendenteInput      = document.getElementById('dipendente');
  const targaInput           = document.getElementById('targa');
  const numeroSettimanaEl    = document.getElementById('numero-settimana'); // readOnly

  // Sezione “Inserisci le spese giornaliere”
  const dataGiornoInput      = document.getElementById('data-giorno');      // <input type="date">
  const giornoSettimanaEl    = document.getElementById('giorno-settimana'); // <input type="text" readOnly>

  const categoriaSelect      = document.getElementById('categoria');        // <select>
  const sottoCatSelect       = document.getElementById('sottocategoria');   // <select>
  const importoInput         = document.getElementById('importo');          // <input type="number">
  const fotoInput            = document.getElementById('foto');             // <input type="file">
  const aggiungiVoceBtn      = document.getElementById('aggiungi-voce');    // <button>

  // Riepilogo e totale
  const riepilogoContainer   = document.getElementById('riepilogo-giornaliero');
  const sommaSettimanaleEl   = document.getElementById('somma-settimanale');

  // Note e firme
  const noteTextarea         = document.getElementById('note');
  const firmaDirezioneInput  = document.getElementById('firma-direzione');
  const firmaDipendenteInput = document.getElementById('firma-dipendente');

  // Pulsanti stampa/condivisione
  const stampaTxtBtn         = document.getElementById('stampa-txt');
  const whatsappBtn          = document.getElementById('condividi-whatsapp');
  const stampaReplicaBtn     = document.getElementById('stampa-replica');

  //
  // 3. Quando cambia la data => calcoliamo giorno e numero settimana
  //
  dataGiornoInput.addEventListener('change', () => {
    if (!dataGiornoInput.value) return;

    // dataGiornoInput.value è stringa "YYYY-MM-DD"
    const [yyyy, mm, dd] = dataGiornoInput.value.split('-');
    const dataSelezionata = new Date(+yyyy, +mm - 1, +dd);

    // Giorno della settimana in italiano
    const giornoIndex = dataSelezionata.getDay(); // 0=dom, 1=lun...
    const giorniITA = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const nomeGiorno = giorniITA[giornoIndex];
    giornoSettimanaEl.value = nomeGiorno;

    // Numero settimana ISO
    const weekNum = getISOWeekNumber(dataSelezionata);
    numeroSettimanaEl.value = weekNum;
  });

  /**
   * Calcola il numero di settimana in formato ISO-8601
   * (settimana 1 è quella contenente il primo giovedì dell'anno).
   */
  function getISOWeekNumber(dateObj) {
    // Copia la data in UTC
    const tmp = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    // getUTCDay() = 0=dom,... se 0 => forziamo 7
    let day = tmp.getUTCDay();
    if (day === 0) day = 7;
    // Spostiamo al giovedì di quella settimana
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    // 1° gennaio di quell'anno in UTC
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    // Differenza in giorni /7
    const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  }

  //
  // 4. Cambio categoria => aggiorna sottocategoria
  //
  categoriaSelect.addEventListener('change', () => {
    const catValue = categoriaSelect.value;
    // Svuota
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';

    if (sottoCategorie[catValue]) {
      sottoCategorie[catValue].forEach((sub) => {
        const op = document.createElement('option');
        op.value = sub;
        op.textContent = sub;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 5. Click su “Aggiungi” => crea voce di spesa
  //
  aggiungiVoceBtn.addEventListener('click', () => {
    // Leggiamo i valori correnti
    const dataScelta    = dataGiornoInput.value;   // "YYYY-MM-DD"
    const giornoCalc    = giornoSettimanaEl.value; // es. "Martedì"
    const settCalc      = numeroSettimanaEl.value; // es. "12"

    const categoriaVal  = categoriaSelect.value;
    const sottoCatVal   = sottoCatSelect.value;
    const importoVal    = parseFloat(importoInput.value) || 0;
    const fotoFile      = fotoInput.files[0] || null;

    // Validazione minima
    if (!dataScelta || !giornoCalc || !settCalc || !categoriaVal || !sottoCatVal) {
      alert('Compila tutti i campi obbligatori: Data, Giorno, Settimana, Categoria, Sottocategoria.');
      return;
    }

    // Oggetto voce spesa
    const voceSpesa = {
      data: dataScelta,
      giorno: giornoCalc,
      settimana: settCalc,
      categoria: categoriaVal,
      sottocategoria: sottoCatVal,
      importo: importoVal,
      foto: fotoFile
    };

    // Aggiunge al nostro array
    spese.push(voceSpesa);

    // Reset campi input
    importoInput.value = '';
    fotoInput.value = '';

    // Aggiorna riepilogo
    aggiornaRiepilogo();
  });

  //
  // 6. Funzione di aggiornamento riepilogo
  //
  function aggiornaRiepilogo() {
    // Svuota container
    riepilogoContainer.innerHTML = '';
    let totaleSettimanale = 0;

    // Raggruppiamo spese per data + giorno + settimana => “chiave”
    const spesePerChiave = {};
    spese.forEach((s) => {
      const chiave = `${s.data}|${s.giorno}|${s.settimana}`;
      if (!spesePerChiave[chiave]) {
        spesePerChiave[chiave] = [];
      }
      spesePerChiave[chiave].push(s);
    });

    // Per ogni chiave creiamo un blocco
    for (const chiave in spesePerChiave) {
      const [dataVal, giornoVal, settVal] = chiave.split('|');
      const elenco = spesePerChiave[chiave];

      // Subtotale
      let subtot = 0;
      elenco.forEach((item) => {
        subtot += item.importo;
      });
      totaleSettimanale += subtot;

      // Crea un div
      const giornoDiv = document.createElement('div');
      giornoDiv.classList.add('giorno-container');

      // Titolo
      const titolo = document.createElement('h3');
      titolo.textContent = `Settimana ${settVal} - ${giornoVal} (${dataVal}) - Subtotale: €${subtot.toFixed(2)}`;
      giornoDiv.appendChild(titolo);

      // Elenco voci
      elenco.forEach((sp) => {
        const voceEl = document.createElement('div');
        voceEl.classList.add('voce-spesa');
        voceEl.textContent = `${sp.categoria} / ${sp.sottocategoria}: €${sp.importo.toFixed(2)}`;
        // Se vuoi mostrare anteprima foto:
        // if (sp.foto) {
        //   const img = document.createElement('img');
        //   img.src = URL.createObjectURL(sp.foto);
        //   img.width = 80;
        //   voceEl.appendChild(img);
        // }
        giornoDiv.appendChild(voceEl);
      });

      riepilogoContainer.appendChild(giornoDiv);
    }

    // Aggiorna il totale
    sommaSettimanaleEl.textContent = totaleSettimanale.toFixed(2);
  }

  //
  // 7. Stampa in TXT
  //
  stampaTxtBtn.addEventListener('click', () => {
    let testo = '';

    // Intestazione
    testo += `NOTA SPESE TRASFERTA\n`;

    // Dati generali
    const dipValue  = dipendenteInput.value.trim();
    const targaValue = targaInput.value.trim();

    testo += `Dipendente: ${dipValue}\n`;
    testo += `Targa Automezzo: ${targaValue}\n`;

    testo += `\n--- Dettaglio Spese ---\n`;

    // Elenco voci
    spese.forEach((s) => {
      testo += `[Settimana ${s.settimana}] ${s.giorno} (${s.data}) - ${s.categoria}/${s.sottocategoria}: €${s.importo.toFixed(2)}\n`;
    });

    // Totale
    const tot = spese.reduce((acc, curr) => acc + curr.importo, 0);
    testo += `\nTotale settimana: €${tot.toFixed(2)}\n`;

    // Note e firme
    const noteVal = noteTextarea.value.trim();
    if (noteVal) {
      testo += `\nNote: ${noteVal}\n`;
    }
    const firmaDirVal = firmaDirezioneInput.value.trim();
    const firmaDipVal = firmaDipendenteInput.value.trim();
    testo += `\nVisto Direzione: ${firmaDirVal}\n`;
    testo += `Firma Dipendente: ${firmaDipVal}\n`;

    // Creiamo un file .txt e lo scarichiamo
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nota_spese.txt';
    link.click();
    URL.revokeObjectURL(url);
  });

  //
  // 8. Condivisione via WhatsApp
  //
  whatsappBtn.addEventListener('click', () => {
    let testo = `NOTA SPESE TRASFERTA\n`;

    // Dati generali
    const dipValue  = dipendenteInput.value.trim();
    const targaValue = targaInput.value.trim();
    testo += `Dipendente: ${dipValue}\n`;
    testo += `Targa: ${targaValue}\n\n`;

    // Elenco spese
    spese.forEach((s) => {
      testo += `[Wk${s.settimana}] ${s.giorno} (${s.data}): ${s.categoria}/${s.sottocategoria} - €${s.importo.toFixed(2)}\n`;
    });

    // Totale
    const tot = spese.reduce((acc, curr) => acc + curr.importo, 0);
    testo += `\nTotale settimana: €${tot.toFixed(2)}\n`;

    // Note e firme (opzionali)
    const noteVal = noteTextarea.value.trim();
    if (noteVal) {
      testo += `\nNote: ${noteVal}`;
    }
    const firmaDirVal = firmaDirezioneInput.value.trim();
    const firmaDipVal = firmaDipendenteInput.value.trim();
    testo += `\n\nVisto Direzione: ${firmaDirVal}\nFirma Dipendente: ${firmaDipVal}\n`;

    // Apri link WhatsApp (funziona su mobile con app installata)
    const urlWhatsapp = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlWhatsapp, '_blank');
  });

  //
  // 9. Stampa Replica Form (stampa classica)
  //
  stampaReplicaBtn.addEventListener('click', () => {
    window.print();
  });
});
