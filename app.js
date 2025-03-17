// app.js
document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Variabili e strutture dati
  //
  // Sottocategorie per ogni categoria
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

  // Array per memorizzare tutte le spese inserite
  let spese = [];

  //
  // 2. Selettori principali
  //
  const dataGiornoInput      = document.querySelector('.data-giorno');      // <input type="date">
  const giornoSettimanaInput = document.querySelector('.giorno-settimana'); // <input type="text" readonly>
  const numeroSettimanaInput = document.querySelector('.numero-settimana'); // <input type="text" readonly>

  const categoriaSelect      = document.querySelector('.categoria');
  const sottoCatSelect       = document.querySelector('.sottocategoria');
  const importoInput         = document.querySelector('.importo');
  const fotoInput            = document.querySelector('.foto');

  const aggiungiVoceBtn      = document.querySelector('.aggiungi-voce');

  const riepilogoContainer   = document.getElementById('riepilogo-giornaliero');
  const sommaSettimanaleEl   = document.getElementById('somma-settimanale');

  const stampaTxtBtn         = document.getElementById('stampa-txt');
  const whatsappBtn          = document.getElementById('condividi-whatsapp');
  const stampaReplicaBtn     = document.getElementById('stampa-replica');

  // Dati “generali” (dipendente, targa, ecc.) se presenti nel form
  const dipendenteInput  = document.getElementById('dipendente');
  const targaInput       = document.getElementById('targa');
  // Se la “settimana” fosse da compilare manualmente, potresti usare un id=“settimana”
  // ma in questo esempio la compiliamo in automatico => numeroSettimanaInput

  const noteTextarea     = document.getElementById('note');

  //
  // 3. Funzioni di utilità per data e settimana
  //

  // Restituisce il nome del giorno in italiano (Domenica=0, Lunedì=1, ...)
  function getNomeGiorno(dateObj) {
    const giorniSettimana = [
      'Domenica',
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato'
    ];
    return giorniSettimana[dateObj.getDay()];
  }

  // Calcola il numero ISO della settimana
  // (In ISO-8601, la settimana 1 è quella che contiene il primo giovedì dell’anno)
  function getISOWeekNumber(dateObj) {
    // Creiamo una copia in UTC per evitare offset
    const data = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    // Otteniamo il giorno della settimana in UTC (0=dom, 1=lun, ...). Se 0, lo forziamo a 7
    const day = data.getUTCDay() || 7;
    // Portiamo la data al giovedì di quella settimana
    data.setUTCDate(data.getUTCDate() + 4 - day);
    // 1 gennaio di quell’anno (UTC)
    const yearStart = new Date(Date.UTC(data.getUTCFullYear(), 0, 1));
    // Calcoliamo quante settimane sono passate
    const weekNo = Math.ceil(((data - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  }

  //
  // 4. Eventi
  //

  // 4.1 Quando l'utente sceglie la data => aggiorniamo giorno e numero settimana
  dataGiornoInput.addEventListener('change', () => {
    if (!dataGiornoInput.value) return;
    const dataSelezionata = new Date(dataGiornoInput.value + 'T00:00:00');

    // Giorno in italiano
    const giornoNome = getNomeGiorno(dataSelezionata);
    giornoSettimanaInput.value = giornoNome;

    // Numero ISO settimana
    const weekNum = getISOWeekNumber(dataSelezionata);
    numeroSettimanaInput.value = weekNum;
  });

  // 4.2 Cambio categoria => aggiorno le sottocategorie
  categoriaSelect.addEventListener('change', (e) => {
    const catValue = e.target.value;
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

  // 4.3 Click su “Aggiungi Voce” => crea una riga di spesa
  aggiungiVoceBtn.addEventListener('click', () => {
    const dataScelta    = dataGiornoInput.value;    // stringa "YYYY-MM-DD"
    const giornoTesto   = giornoSettimanaInput.value;
    const settiNum      = numeroSettimanaInput.value;

    const categoria     = categoriaSelect.value;
    const sottocategoria = sottoCatSelect.value;
    const importo       = parseFloat(importoInput.value) || 0;
    const fotoFile      = fotoInput.files[0] || null;

    // Verifica campi obbligatori
    if (!dataScelta || !giornoTesto || !settiNum || !categoria || !sottocategoria) {
      alert('Compila tutti i campi (data, giorno, settimana, categoria, sottocategoria).');
      return;
    }

    // Crea un oggetto spesa
    const voceSpesa = {
      data: dataScelta,
      giorno: giornoTesto,
      settimana: settiNum,
      categoria: categoria,
      sottocategoria: sottocategoria,
      importo: importo,
      foto: fotoFile
    };

    // Aggiunge al nostro array spese
    spese.push(voceSpesa);

    // Reset del campo importo e foto
    importoInput.value = '';
    fotoInput.value = '';

    // Aggiorna il riepilogo
    aggiornaRiepilogo();
  });

  // 4.4 Pulsante “Stampa in TXT”
  stampaTxtBtn.addEventListener('click', () => {
    let testo = '';

    // Dati generali
    const dipendenteVal = dipendenteInput ? dipendenteInput.value : '';
    const targaVal      = targaInput ? targaInput.value : '';

    testo += `NOTA SPESE TRASFERTA\n`;
    testo += `Dipendente: ${dipendenteVal}\n`;
    testo += `Targa Automezzo: ${targaVal}\n`;

    // Se vuoi mostrare la “settimana” globale, potresti usare numeroSettimanaInput.value,
    // ma considera che ogni riga potrebbe avere date diverse
    testo += `\n--- Dettaglio spese ---\n`;

    // Dettagli spese
    spese.forEach((s) => {
      testo += `[Settimana ${s.settimana}] ${s.giorno} (${s.data}) - ${s.categoria}/${s.sottocategoria}: €${s.importo.toFixed(2)}\n`;
    });

    // Totale
    const totaleSpese = spese.reduce((acc, cur) => acc + cur.importo, 0);
    testo += `\nTotale settimanale: €${totaleSpese.toFixed(2)}\n`;

    // Note
    const noteVal = noteTextarea ? noteTextarea.value : '';
    testo += `\nNote: ${noteVal}\n\n`;

    // Generazione e download file .txt
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nota_spese.txt';
    link.click();
    URL.revokeObjectURL(url);
  });

  // 4.5 Condivisione via WhatsApp
  whatsappBtn.addEventListener('click', () => {
    let testo = `NOTA SPESE TRASFERTA\n`;
    const dipendenteVal = dipendenteInput ? dipendenteInput.value : '';
    const targaVal      = targaInput ? targaInput.value : '';

    testo += `Dipendente: ${dipendenteVal}\n`;
    testo += `Targa Automezzo: ${targaVal}\n\n`;

    // Elenco spese
    spese.forEach((s) => {
      testo += `[Settimana ${s.settimana}] ${s.giorno} (${s.data})\n`;
      testo += `=> ${s.categoria}/${s.sottocategoria}: €${s.importo.toFixed(2)}\n\n`;
    });

    const totaleSpese = spese.reduce((acc, cur) => acc + cur.importo, 0);
    testo += `Totale settimanale: €${totaleSpese.toFixed(2)}\n`;

    // Apri WhatsApp con il testo precompilato
    const urlWhatsapp = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlWhatsapp, '_blank');
  });

  // 4.6 Stampa “replica form” (stampa classica)
  stampaReplicaBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 5. Funzione per aggiornare il riepilogo sullo schermo
  //
  function aggiornaRiepilogo() {
    riepilogoContainer.innerHTML = '';

    // Raggruppiamo le spese per data+giorno => chiave
    const spesePerGiorno = {};

    spese.forEach((s) => {
      const chiave = s.data + '|' + s.giorno + '|' + s.settimana;
      if (!spesePerGiorno[chiave]) {
        spesePerGiorno[chiave] = [];
      }
      spesePerGiorno[chiave].push(s);
    });

    let totaleSettimanaGlobale = 0;

    // Costruiamo l’HTML
    for (const chiave in spesePerGiorno) {
      const [data, giorno, sett] = chiave.split('|');
      const elencoSpese = spesePerGiorno[chiave];

      let subtotale = 0;
      elencoSpese.forEach((item) => {
        subtotale += item.importo;
      });
      totaleSettimanaGlobale += subtotale;

      // Container del giorno
      const giornoDiv = document.createElement('div');
      giornoDiv.classList.add('giorno-container');

      // Titolo
      const titoloGiorno = document.createElement('h3');
      titoloGiorno.textContent = `Settimana ${sett} - ${giorno} (${data}) - Subtotale: €${subtotale.toFixed(2)}`;
      giornoDiv.appendChild(titoloGiorno);

      // Dettaglio voci
      elencoSpese.forEach((s) => {
        const voce = document.createElement('div');
        voce.classList.add('voce-spesa');
        voce.textContent = `${s.categoria} / ${s.sottocategoria}: €${s.importo.toFixed(2)}`;

        // Se vuoi mostrare un’anteprima dell’immagine caricata:
        // if (s.foto) {
        //   const img = document.createElement('img');
        //   img.src = URL.createObjectURL(s.foto);
        //   img.width = 100; // dimensione eventuale preview
        //   voce.appendChild(img);
        // }
        giornoDiv.appendChild(voce);
      });

      riepilogoContainer.appendChild(giornoDiv);
    }

    // Aggiorna il totale settimana
    sommaSettimanaleEl.textContent = totaleSettimanaGlobale.toFixed(2);
  }
});
