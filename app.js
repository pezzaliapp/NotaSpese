// app.js
document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Dizionario di sottocategorie
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

  // Array dove memorizzeremo tutte le spese inserite
  let spese = [];

  //
  // 2. Selettori di elementi HTML
  //
  // Campi Data / Giorno / Settimana (auto-calcolati)
  const dataGiornoInput      = document.getElementById('data-giorno');      // <input type="date">
  const giornoSettimanaEl    = document.getElementById('giorno-settimana'); // <input readonly>
  const numeroSettimanaEl    = document.getElementById('numero-settimana'); // <input readonly>

  // Eventuale selettore giorno manuale (se presente in index.html)
  const giornoSelezioneEl    = document.getElementById('giorno-selezione'); // <select> “Lunedì, Martedì…”
  // Se non lo usi, puoi ignorarlo o rimuoverlo

  // Selettori per inserimento spesa (categoria, sottocategoria, importo, foto)
  const categoriaSelect      = document.getElementById('categoria');
  const sottoCatSelect       = document.getElementById('sottocategoria');
  const importoInput         = document.getElementById('importo');
  const fotoInput            = document.getElementById('foto');
  const aggiungiVoceBtn      = document.getElementById('aggiungi-voce');

  // Riepilogo e totale
  const riepilogoContainer   = document.getElementById('riepilogo-giornaliero');
  const sommaSettimanaleEl   = document.getElementById('somma-settimanale');

  // Pulsanti di stampa/condivisione
  const stampaTxtBtn         = document.getElementById('stampa-txt');
  const whatsappBtn          = document.getElementById('condividi-whatsapp');
  const stampaReplicaBtn     = document.getElementById('stampa-replica');

  // Campi opzionali per dati generali
  const dipendenteInput      = document.getElementById('dipendente');
  const targaInput           = document.getElementById('targa');
  const settimanaGeneraleInp = document.getElementById('settimana-generale'); // se presente

  // Note e firme
  const noteTextarea         = document.getElementById('note');
  const firmaDirezioneInput  = document.getElementById('firma-direzione');
  const firmaDipendenteInput = document.getElementById('firma-dipendente');


  //
  // 3. Eventi: cambio data => calcolo giorno e settimana
  //
  dataGiornoInput.addEventListener('change', () => {
    // Se non c'è un valore, esci
    if (!dataGiornoInput.value) return;

    // dataGiornoInput.value è in formato "YYYY-MM-DD"
    // Splittiamo e creiamo un oggetto Date
    const [yyyy, mm, dd] = dataGiornoInput.value.split('-');
    const dataSelezionata = new Date(+yyyy, +mm - 1, +dd);

    // 3a) Calcolo nome giorno in italiano
    const giornoIndex = dataSelezionata.getDay(); // 0=Dom, 1=Lun, ...
    const giorniIta = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    const nomeGiorno = giorniIta[giornoIndex];

    // Mostra il giorno in readOnly
    giornoSettimanaEl.value = nomeGiorno;

    // 3b) Calcolo numero di settimana ISO
    const weekNum = getISOWeekNumber(dataSelezionata);
    numeroSettimanaEl.value = weekNum;
  });

  /**
   * Funzione per calcolare il numero di settimana in formato ISO-8601.
   * La settimana 1 è quella che contiene il primo giovedì dell'anno.
   */
  function getISOWeekNumber(dateObj) {
    // Copia la data in UTC
    const tmp = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    // Otteniamo il giorno della settimana (1=Lun, ..., 7=Dom). Se 0, forziamo a 7
    let day = tmp.getUTCDay();
    if (day === 0) day = 7;
    // Portiamo la data al giovedì di quella settimana
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    // Calcoliamo la differenza con il 1° gennaio di quell'anno (in UTC)
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    // Confronto in giorni e divisione per 7
    const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  }


  //
  // 4. Cambio categoria => aggiorna sottocategorie
  //
  categoriaSelect.addEventListener('change', () => {
    const catValue = categoriaSelect.value;
    // Svuota il select
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    // Popola se la categoria esiste nel dizionario
    if (sottoCategorie[catValue]) {
      sottoCategorie[catValue].forEach((sub) => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        sottoCatSelect.appendChild(opt);
      });
    }
  });


  //
  // 5. Click su “Aggiungi Voce” => creazione oggetto spesa
  //
  aggiungiVoceBtn.addEventListener('click', () => {
    // Leggiamo i valori
    const dataScelta    = dataGiornoInput.value;       // stringa "YYYY-MM-DD"
    const giornoAuto    = giornoSettimanaEl.value;     // es. "Lunedì"
    const settimanaAuto = numeroSettimanaEl.value;     // es. "12"

    // Se hai un select giorno manuale (es. #giorno-selezione), puoi decidere se usarlo o ignorarlo.
    // Per coerenza con la richiesta, usiamo i valori calcolati automaticamente da dataScelta
    // const giornoManuale = giornoSelezioneEl ? giornoSelezioneEl.value : '';

    const categoria     = categoriaSelect.value;
    const sottocategoria = sottoCatSelect.value;
    const importo       = parseFloat(importoInput.value) || 0;
    const fotoFile      = fotoInput.files[0] || null;

    // Verifica campi minimi obbligatori
    if (!dataScelta || !giornoAuto || !settimanaAuto || !categoria || !sottocategoria) {
      alert('Compila i campi obbligatori: Data, Giorno, Settimana, Categoria, Sottocategoria.');
      return;
    }

    // Creiamo l'oggetto spesa
    const voceSpesa = {
      data: dataScelta,
      giorno: giornoAuto,
      settimana: settimanaAuto,
      categoria: categoria,
      sottocategoria: sottocategoria,
      importo: importo,
      foto: fotoFile
    };

    // Aggiungiamo al nostro array spese
    spese.push(voceSpesa);

    // Reset di importo e file
    importoInput.value = '';
    fotoInput.value = '';

    // Aggiorniamo il riepilogo
    aggiornaRiepilogo();
  });


  //
  // 6. Funzione di aggiornamento del riepilogo
  //
  function aggiornaRiepilogo() {
    // Svuotiamo il container
    riepilogoContainer.innerHTML = '';

    // Raggruppiamo le spese per data+giorno+settimana => chiave
    const spesePerGiorno = {};
    spese.forEach((s) => {
      const chiave = s.data + '|' + s.giorno + '|' + s.settimana;
      if (!spesePerGiorno[chiave]) {
        spesePerGiorno[chiave] = [];
      }
      spesePerGiorno[chiave].push(s);
    });

    let totaleSettimana = 0;

    // Creiamo un blocco per ogni chiave (data+giorno+settimana)
    for (const chiave in spesePerGiorno) {
      const [data, giorno, sett] = chiave.split('|');
      const elencoSpese = spesePerGiorno[chiave];

      // Calcola subtotale
      let subtotale = 0;
      elencoSpese.forEach((item) => {
        subtotale += item.importo;
      });
      totaleSettimana += subtotale;

      // Creiamo un div per questa giornata
      const giornoDiv = document.createElement('div');
      giornoDiv.classList.add('giorno-container');

      // Titolo
      const titolo = document.createElement('h3');
      titolo.textContent = `Settimana ${sett} - ${giorno} (${data}) - Subtotale: €${subtotale.toFixed(2)}`;
      giornoDiv.appendChild(titolo);

      // Elenco delle singole spese
      elencoSpese.forEach((sp) => {
        const voce = document.createElement('div');
        voce.classList.add('voce-spesa');
        voce.textContent = `${sp.categoria} / ${sp.sottocategoria}: €${sp.importo.toFixed(2)}`;

        // Se vuoi mostrare un'anteprima dell'immagine:
        // if (sp.foto) {
        //   const img = document.createElement('img');
        //   img.src = URL.createObjectURL(sp.foto);
        //   img.width = 80;
        //   voce.appendChild(img);
        // }

        giornoDiv.appendChild(voce);
      });

      riepilogoContainer.appendChild(giornoDiv);
    }

    // Aggiorna il totale settimana nel DOM
    sommaSettimanaleEl.textContent = totaleSettimana.toFixed(2);
  }


  //
  // 7. Stampa in TXT
  //
  stampaTxtBtn.addEventListener('click', () => {
    let testo = '';

    // Dati generali
    const dipendenteVal  = dipendenteInput ? dipendenteInput.value : '';
    const targaVal       = targaInput ? targaInput.value : '';
    const settGenerale   = settimanaGeneraleInp ? settimanaGeneraleInp.value : '';

    testo += `NOTA SPESE TRASFERTA\n`;
    testo += `Dipendente: ${dipendenteVal}\n`;
    testo += `Targa Automezzo: ${targaVal}\n`;
    if (settGenerale) {
      testo += `Numero Settimana (generale): ${settGenerale}\n`;
    }
    testo += `\n--- Dettaglio Spese ---\n`;

    // Elenchiamo le spese
    spese.forEach((s) => {
      testo += `[Settimana ${s.settimana}] ${s.giorno} (${s.data}) - ${s.categoria}/${s.sottocategoria}: €${s.importo.toFixed(2)}\n`;
    });

    // Totale
    const totale = spese.reduce((acc, cur) => acc + cur.importo, 0);
    testo += `\nTotale: €${totale.toFixed(2)}\n`;

    // Note
    const noteVal = noteTextarea ? noteTextarea.value : '';
    testo += `\nNote: ${noteVal}\n\n`;

    // Firme (se vuoi inserirle in TXT come testo)
    const firmaDirVal = firmaDirezioneInput ? firmaDirezioneInput.value : '';
    const firmaDipVal = firmaDipendenteInput ? firmaDipendenteInput.value : '';
    testo += `Visto Direzione: ${firmaDirVal}\n`;
    testo += `Firma Dipendente: ${firmaDipVal}\n`;

    // Generiamo il file .txt
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
    const dipVal  = dipendenteInput ? dipendenteInput.value : '';
    const targaVal = targaInput ? targaInput.value : '';
    const settGen  = settimanaGeneraleInp ? settimanaGeneraleInp.value : '';

    testo += `Dipendente: ${dipVal}\n`;
    testo += `Targa: ${targaVal}\n`;
    if (settGen) {
      testo += `Settimana (generale): ${settGen}\n`;
    }
    testo += `\n--- Spese ---\n`;

    spese.forEach((s) => {
      testo += `[Wk${s.settimana}] ${s.giorno} (${s.data}): ${s.categoria}/${s.sottocategoria} €${s.importo.toFixed(2)}\n`;
    });

    const total = spese.reduce((acc, cur) => acc + cur.importo, 0);
    testo += `\nTotale: €${total.toFixed(2)}\n`;

    // Apriamo WhatsApp
    const urlWhatsapp = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlWhatsapp, '_blank');
  });


  //
  // 9. Stampa replica form (stampa classica)
  //
  stampaReplicaBtn.addEventListener('click', () => {
    window.print();
  });

});
