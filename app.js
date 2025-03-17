// app.js
document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Strutture dati
  //
  // Dizionario sottocategorie
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

  // Array di spese correnti. Verrà caricato e salvato in localStorage
  let spese = [];

  // Indice della voce che stiamo eventualmente modificando (-1 se non stiamo modificando)
  let editIndex = -1;

  //
  // 2. Selettori
  //
  // Dati principali (Dipendente, Targa, Settimana)
  const dipendenteInput   = document.getElementById('dipendente');
  const targaInput        = document.getElementById('targa');
  const numeroSettInput   = document.getElementById('numero-settimana');

  // Sezione inserimento
  const dataInput         = document.getElementById('data-giorno');
  const giornoInput       = document.getElementById('giorno-settimana');
  const descrizioneGiorno = document.getElementById('descrizione-giorno');
  const categoriaSelect   = document.getElementById('categoria');
  const sottoCatSelect    = document.getElementById('sottocategoria');
  const importoInput      = document.getElementById('importo');
  const aggiungiVoceBtn   = document.getElementById('aggiungi-voce');

  // Riepilogo
  const riepilogoTableBody = document.querySelector('#riepilogo-table tbody');
  const sommaSettimanaleEl = document.getElementById('somma-settimanale');

  // Note e firme
  const noteTextarea        = document.getElementById('note');
  const firmaDirezioneInput = document.getElementById('firma-direzione');
  const firmaDipInput       = document.getElementById('firma-dipendente');

  // Pulsanti
  const stampaTxtBtn        = document.getElementById('stampa-txt');
  const whatsappBtn         = document.getElementById('condividi-whatsapp');
  const stampaReplicaBtn    = document.getElementById('stampa-replica');

  //
  // 3. Eventi: caricamento/salvataggio LocalStorage per Settimana
  //
  numeroSettInput.addEventListener('change', () => {
    // Quando cambia il numero settimana, carichiamo i dati salvati (se esistono)
    caricaSettimana();
  });

  function caricaSettimana() {
    const nSett = numeroSettInput.value;
    if (!nSett) return;

    // Chiave di localStorage per questa settimana
    const key = `NotaSpeseSettimana_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (salvato) {
      const obj = JSON.parse(salvato);
      spese = obj.spese || [];
      // Carichiamo anche i campi dipendente, targa, note, firme
      dipendenteInput.value   = obj.dipendente || '';
      targaInput.value        = obj.targa || '';
      noteTextarea.value      = obj.note || '';
      firmaDirezioneInput.value = obj.firmaDirezione || '';
      firmaDipInput.value     = obj.firmaDipendente || '';
    } else {
      // Nessun salvataggio presente, reset
      spese = [];
      dipendenteInput.value   = '';
      targaInput.value        = '';
      noteTextarea.value      = '';
      firmaDirezioneInput.value = '';
      firmaDipInput.value     = '';
    }
    // Aggiorniamo la tabella
    aggiornaTabella();
  }

  function salvaSettimana() {
    const nSett = numeroSettInput.value;
    if (!nSett) return; // se non c'è una settimana, non salviamo

    const key = `NotaSpeseSettimana_${nSett}`;
    const obj = {
      spese: spese,
      dipendente: dipendenteInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteTextarea.value.trim(),
      firmaDirezione: firmaDirezioneInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim()
    };
    localStorage.setItem(key, JSON.stringify(obj));
  }

  //
  // 4. Cambio data => calcoliamo giorno
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const dataJs = new Date(+yyyy, +mm - 1, +dd);
    // 0=Dom,1=Lun,...
    const giornoIndex = dataJs.getDay();
    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[giornoIndex];
  });

  //
  // 5. Cambio categoria => aggiorna sottocategorie
  //
  categoriaSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const catVal = categoriaSelect.value;
    if (sottoCategorie[catVal]) {
      sottoCategorie[catVal].forEach((sub) => {
        const opt = document.createElement('option');
        opt.value = sub;
        opt.textContent = sub;
        sottoCatSelect.appendChild(opt);
      });
    }
  });

  //
  // 6. Aggiungi o Modifica voce
  //
  aggiungiVoceBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value;
    if (!nSett) {
      alert('Inserisci prima il Numero Settimana');
      return;
    }

    // Leggiamo i campi
    const dataVal = dataInput.value;      // string "YYYY-MM-DD"
    const giornoVal = giornoInput.value;  // es. "Lunedì"
    const descrizioneVal = descrizioneGiorno.value.trim();
    const catVal  = categoriaSelect.value;
    const subVal  = sottoCatSelect.value;
    const impVal  = parseFloat(importoInput.value) || 0;

    if (!dataVal || !giornoVal || !catVal || !subVal) {
      alert('Compila correttamente Data, Giorno, Categoria e Sottocategoria');
      return;
    }

    // Se stiamo modificando (editIndex >= 0), aggiorniamo la voce
    if (editIndex >= 0) {
      spese[editIndex] = {
        data: dataVal,
        giorno: giornoVal,
        descrizione: descrizioneVal,
        categoria: catVal,
        sottocategoria: subVal,
        valore: impVal
      };
      editIndex = -1;
      aggiungiVoceBtn.textContent = 'Aggiungi Voce';
    } else {
      // Nuova voce
      const voce = {
        data: dataVal,
        giorno: giornoVal,
        descrizione: descrizioneVal,
        categoria: catVal,
        sottocategoria: subVal,
        valore: impVal
      };
      spese.push(voce);
    }

    // Reset campi
    dataInput.value = '';
    giornoInput.value = '';
    descrizioneGiorno.value = '';
    categoriaSelect.value = '';
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    importoInput.value = '';

    // Aggiorna tabella e salva
    aggiornaTabella();
    salvaSettimana();
  });

  //
  // 7. Aggiorna tabella
  //
  function aggiornaTabella() {
    // Svuota la tbody
    riepilogoTableBody.innerHTML = '';

    // Raggruppiamo i KM (Iniziali, Finali) per data per calcolare differenza
    // avremo una mappa { "YYYY-MM-DD": { kmIniziali: number, kmFinali: number } }
    const kmMap = {};

    // 1) Scandiamo spese e popoliamo kmMap
    spese.forEach((voce) => {
      if (voce.categoria === 'km') {
        const key = voce.data; // raggruppiamo per data
        if (!kmMap[key]) {
          kmMap[key] = { kmIniziali: null, kmFinali: null };
        }
        if (voce.sottocategoria === 'Km Iniziali') {
          kmMap[key].kmIniziali = voce.valore;
        } else if (voce.sottocategoria === 'Km Finali') {
          kmMap[key].kmFinali = voce.valore;
        }
      }
    });

    // 2) Creiamo le righe
    spese.forEach((voce, index) => {
      const tr = document.createElement('tr');

      // Data
      const tdData = document.createElement('td');
      tdData.textContent = voce.data;
      tr.appendChild(tdData);

      // Giorno
      const tdGiorno = document.createElement('td');
      tdGiorno.textContent = voce.giorno;
      tr.appendChild(tdGiorno);

      // Descrizione
      const tdDesc = document.createElement('td');
      tdDesc.textContent = voce.descrizione || '';
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
      const tdValore = document.createElement('td');
      tdValore.textContent = voce.valore;
      tr.appendChild(tdValore);

      // Tot. Km Giornalieri
      // Se questa voce è data D, se in kmMap[D].kmIniziali e .kmFinali => differenza
      const tdTotKm = document.createElement('td');
      tdTotKm.textContent = '';
      if (kmMap[voce.data]) {
        const { kmIniziali, kmFinali } = kmMap[voce.data];
        if (kmIniziali !== null && kmFinali !== null) {
          const diff = kmFinali - kmIniziali;
          tdTotKm.textContent = diff; // differenza
        }
      }
      tr.appendChild(tdTotKm);

      // Azioni (Modifica / Elimina)
      const tdAzioni = document.createElement('td');
      // Bottone Modifica
      const btnMod = document.createElement('button');
      btnMod.textContent = 'Modifica';
      btnMod.addEventListener('click', () => {
        // Popoliamo il form con i dati di questa voce
        dataInput.value = voce.data;
        // Forziamo l'evento change per calcolare giorno, oppure lo settiamo direttamente
        const [yyyy, mm, dd] = voce.data.split('-');
        const dataJs = new Date(+yyyy, +mm - 1, +dd);
        giornoInput.value = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'][dataJs.getDay()];
        
        descrizioneGiorno.value = voce.descrizione;
        categoriaSelect.value = voce.categoria;
        // Popola sottocategorie
        sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
        if (sottoCategorie[voce.categoria]) {
          sottoCategorie[voce.categoria].forEach((sub) => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            sottoCatSelect.appendChild(opt);
          });
        }
        sottoCatSelect.value = voce.sottocategoria;
        importoInput.value = voce.valore;

        editIndex = index;
        aggiungiVoceBtn.textContent = 'Salva Modifica';
      });
      tdAzioni.appendChild(btnMod);

      // Bottone Elimina
      const btnDel = document.createElement('button');
      btnDel.textContent = 'Elimina';
      btnDel.style.marginLeft = '5px';
      btnDel.addEventListener('click', () => {
        spese.splice(index, 1);
        aggiornaTabella();
        salvaSettimana();
      });
      tdAzioni.appendChild(btnDel);

      tr.appendChild(tdAzioni);

      riepilogoTableBody.appendChild(tr);
    });

    // Calcoliamo il totale settimana per le voci NON km
    let totaleSpese = 0;
    spese.forEach((voce) => {
      // Solo se la categoria NON è km
      if (voce.categoria !== 'km') {
        totaleSpese += voce.valore;
      }
    });
    sommaSettimanaleEl.textContent = totaleSpese.toFixed(2);
  }

  //
  // 8. Salviamo su localStorage quando cambiano note, firme, ecc.
  //
  noteTextarea.addEventListener('change', salvaSettimana);
  firmaDirezioneInput.addEventListener('change', salvaSettimana);
  firmaDipInput.addEventListener('change', salvaSettimana);
  dipendenteInput.addEventListener('change', salvaSettimana);
  targaInput.addEventListener('change', salvaSettimana);

  //
  // 9. Pulsanti di stampa
  //
  // 9a) Stampa in TXT
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value || '';
    let testo = `NOTA SPESE TRASFERTA\nSettimana: ${nSett}\n\n`;

    testo += `Dipendente: ${dipendenteInput.value}\n`;
    testo += `Targa: ${targaInput.value}\n\n`;

    // Elenco spese
    spese.forEach((voce) => {
      testo += `[${voce.data} ${voce.giorno}] ${voce.descrizione} - ${voce.categoria}/${voce.sottocategoria} => ${voce.valore}\n`;
    });

    // Totale spese (non km)
    let totSpese = 0;
    spese.forEach((v) => {
      if (v.categoria !== 'km') {
        totSpese += v.valore;
      }
    });
    testo += `\nTotale spese (no Km): ${totSpese.toFixed(2)}\n`;

    // Note, firme
    testo += `\nNote: ${noteTextarea.value}\n`;
    testo += `Visto Direzione: ${firmaDirezioneInput.value}\n`;
    testo += `Firma Dipendente: ${firmaDipInput.value}\n`;

    // Scarica come .txt
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota_spese_sett_${nSett}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // 9b) WhatsApp
  whatsappBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value || '';
    let testo = `NOTA SPESE (Settimana ${nSett})\n`;
    testo += `Dipendente: ${dipendenteInput.value}\nTarga: ${targaInput.value}\n\n`;

    spese.forEach((voce) => {
      testo += `[${voce.data} ${voce.giorno}] ${voce.descrizione}\n- ${voce.categoria}/${voce.sottocategoria}: ${voce.valore}\n\n`;
    });

    let totSpese = 0;
    spese.forEach((v) => {
      if (v.categoria !== 'km') {
        totSpese += v.valore;
      }
    });
    testo += `Totale spese (no Km): ${totSpese.toFixed(2)}\n`;
    testo += `\nNote: ${noteTextarea.value}\n`;
    testo += `Visto Direzione: ${firmaDirezioneInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const urlWhats = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlWhats, '_blank');
  });

  // 9c) Stampa Replica
  stampaReplicaBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 10. Al primo avvio, se c'è un numero di settimana già inserito, carichiamo
  //
  if (numeroSettInput.value) {
    caricaSettimana();
  }
});
