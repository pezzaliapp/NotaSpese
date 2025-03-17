document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Sottocategorie
  //
  const sottoCatMap = {
    km: ['Km Iniziali','Km Finali'],
    'spese-viaggio': [
      'Parcheggi','Noleggio Auto','Taxi / Autobus','Biglietti Aerei/Treni','Carburante c/contante','Altro'
    ],
    'alloggio-pasti': [
      'Alloggio','Colazione','Pranzo','Cena','Acqua/Caffè','Altro'
    ],
    carburante: ['Carta ENI']
  };

  //
  // 2. Variabili
  //
  // vociCorrenti: array di oggetti { data, giorno, settimanaAuto, descrizione, categoria, sottocategoria, valore }
  let vociCorrenti = [];
  let editIndex = -1; // Se >=0 stiamo modificando una riga

  //
  // 3. Selettori
  //
  // Dati generali
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const nSettimanaInput= document.getElementById('numero-settimana');
  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  // Inserimento voce
  const dataInput      = document.getElementById('data-giorno');
  const giornoInput    = document.getElementById('giorno-settimana');
  const settAutoInput  = document.getElementById('settimana-auto');
  const descInput      = document.getElementById('descrizione-giorno');
  const catSelect      = document.getElementById('categoria');
  const sottoCatSelect = document.getElementById('sottocategoria');
  const valoreInput    = document.getElementById('valore-voce');
  const aggiungiBtn    = document.getElementById('aggiungi-voce');

  // Riepilogo
  const riepilogoBody  = document.querySelector('#riepilogo-table tbody');
  const sommaSettEl    = document.getElementById('somma-settimanale');

  // Note e firme
  const noteArea       = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  // Pulsanti export
  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const wappBtn        = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  //
  // 4. Cambio data => aggiorna giorno e settimana-auto
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    // es. "2025-03-17"
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const d = new Date(+yyyy, +mm - 1, +dd);

    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[d.getDay()];

    // Settimana ISO
    const w = getISOWeekNumber(d);
    settAutoInput.value = w;
  });

  function getISOWeekNumber(dataJs) {
    const tmp = new Date(Date.UTC(dataJs.getFullYear(), dataJs.getMonth(), dataJs.getDate()));
    let day = tmp.getUTCDay();
    if (day===0) day=7;
    tmp.setUTCDate(tmp.getUTCDate()+4-day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    return Math.ceil( ((tmp - yearStart)/86400000 +1)/7 );
  }

  //
  // 5. Cambio categoria => aggiorna sottocategoria
  //
  catSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const c = catSelect.value;
    if (sottoCatMap[c]) {
      sottoCatMap[c].forEach(sub => {
        const op = document.createElement('option');
        op.value = sub; op.textContent = sub;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 6. Aggiungi/Modifica voce
  //
  aggiungiBtn.addEventListener('click', () => {
    // Non puliamo data/giorno/sett in automatico, per NON uscire dalla data impostata
    if (!dataInput.value) {
      alert('Inserisci una data');
      return;
    }
    if (!catSelect.value || !sottoCatSelect.value) {
      alert('Scegli Categoria e Sottocategoria');
      return;
    }
    const voce = {
      data: dataInput.value,
      giorno: giornoInput.value,
      settimanaAuto: settAutoInput.value,
      descrizione: descInput.value.trim(),
      categoria: catSelect.value,
      sottocategoria: sottoCatSelect.value,
      valore: parseFloat(valoreInput.value) || 0
    };

    if (editIndex >= 0) {
      // Salva modifica
      vociCorrenti[editIndex] = voce;
      editIndex = -1;
      aggiungiBtn.textContent = 'Aggiungi';
    } else {
      // Nuova voce
      vociCorrenti.push(voce);
    }

    // Reset di *solo* i campi che vogliamo
    // (non resettiamo dataInput, giornoInput, settAutoInput)
    // in modo che l'utente possa continuare a inserire altre voci per la stessa data
    descInput.value = '';
    catSelect.value = '';
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    valoreInput.value = '';

    aggiornaTabella();
  });

  //
  // 7. Aggiorna Tabella
  //
  function aggiornaTabella() {
    riepilogoBody.innerHTML = '';

    vociCorrenti.forEach((voce, i) => {
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
      tdDesc.textContent = voce.descrizione;
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
      const tdVal = document.createElement('td');
      tdVal.textContent = voce.valore;
      tr.appendChild(tdVal);

      // Diff Km su questa riga
      const tdDiff = document.createElement('td');
      tdDiff.textContent = '0';
      // Se la voce è "Km Finali", cerchiamo se esiste una voce "Km Iniziali" stessa data
      if (voce.categoria === 'km' && voce.sottocategoria === 'Km Finali') {
        // Troviamo "Km Iniziali" per la stessa data
        const kmIni = vociCorrenti.find(v =>
          v.data === voce.data &&
          v.categoria === 'km' &&
          v.sottocategoria === 'Km Iniziali'
        );
        if (kmIni) {
          tdDiff.textContent = voce.valore - kmIni.valore;
        }
      }
      tr.appendChild(tdDiff);

      // Azioni
      const tdAz = document.createElement('td');
      // Modifica
      const btnMod = document.createElement('button');
      btnMod.textContent = 'Modifica';
      btnMod.addEventListener('click', () => {
        editIndex = i;
        dataInput.value = voce.data;
        giornoInput.value = voce.giorno;
        settAutoInput.value = voce.settimanaAuto;
        descInput.value = voce.descrizione;
        catSelect.value = voce.categoria;
        // Ricarichiamo sottoCat
        sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
        if (sottoCatMap[voce.categoria]) {
          sottoCatMap[voce.categoria].forEach(sub => {
            const op = document.createElement('option');
            op.value=sub; op.textContent=sub;
            sottoCatSelect.appendChild(op);
          });
        }
        sottoCatSelect.value = voce.sottocategoria;
        valoreInput.value = voce.valore;
        aggiungiBtn.textContent = 'Salva Modifica';
      });
      tdAz.appendChild(btnMod);

      // Elimina
      const btnDel = document.createElement('button');
      btnDel.textContent = 'Elimina';
      btnDel.style.marginLeft = '5px';
      btnDel.addEventListener('click', () => {
        vociCorrenti.splice(i,1);
        aggiornaTabella();
      });
      tdAz.appendChild(btnDel);

      tr.appendChild(tdAz);

      riepilogoBody.appendChild(tr);
    });

    // Totale spese
    let totale = 0;
    vociCorrenti.forEach(v => {
      if (v.categoria !== 'km') {
        totale += v.valore;
      }
    });
    sommaSettEl.textContent = totale.toFixed(2);
  }

  //
  // 8. Carica Settimana
  //
  caricaBtn.addEventListener('click', () => {
    const nSett = nSettimanaInput.value;
    if (!nSett) {
      alert('Inserisci il numero settimana da caricare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun salvataggio trovato per la settimana ${nSett}`);
      return;
    }
    const obj = JSON.parse(salvato);
    dipInput.value      = obj.dipendente || '';
    targaInput.value    = obj.targa || '';
    noteArea.value      = obj.note || '';
    firmaDirInput.value = obj.firmaDirezione || '';
    firmaDipInput.value = obj.firmaDipendente || '';
    vociCorrenti        = obj.voci || [];
    editIndex           = -1;
    aggiungiBtn.textContent = 'Aggiungi';
    aggiornaTabella();
    alert(`Dati caricati per la settimana ${nSett}.`);
  });

  //
  // 9. Salva Settimana
  //
  salvaBtn.addEventListener('click', () => {
    const nSett = nSettimanaInput.value;
    if (!nSett) {
      alert('Inserisci il numero di settimana da salvare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const obj = {
      dipendente: dipInput.value.trim(),
      targa: targaInput.value.trim(),
      note: noteArea.value.trim(),
      firmaDirezione: firmaDirInput.value.trim(),
      firmaDipendente: firmaDipInput.value.trim(),
      voci: vociCorrenti
    };
    localStorage.setItem(key, JSON.stringify(obj));
    alert(`Settimana ${nSett} salvata correttamente!`);
  });

  //
  // 10. Stampa in TXT / WhatsApp / Print
  //
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = nSettimanaInput.value || '';
    let testo = `NOTA SPESE TRASFERTA - Settimana ${nSett}\n\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione} => ${v.categoria}/${v.sottocategoria} = ${v.valore}\n`;
      if (v.categoria==='km' && v.sottocategoria==='Km Finali') {
        // Trova corrispondente Km Iniziali
        const kmIni = vociCorrenti.find(x =>
          x.data===v.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (kmIni) {
          const diff = v.valore - kmIni.valore;
          testo += `Diff Km: ${diff}\n`;
        }
      }
    });
    // Tot spese
    let tot = 0;
    vociCorrenti.forEach(x => { if (x.categoria!=='km') tot+= x.valore; });
    testo += `\nTotale Spese (no Km): ${tot.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nota_spese_sett_${nSett}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  wappBtn.addEventListener('click', () => {
    const nSett = nSettimanaInput.value || '';
    let testo = `NOTA SPESE (Settimana ${nSett})\nDipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione}\n-> ${v.categoria}/${v.sottocategoria}: ${v.valore}\n`;
      if (v.categoria==='km' && v.sottocategoria==='Km Finali') {
        const kmIni = vociCorrenti.find(x =>
          x.data===v.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (kmIni) {
          const diff = v.valore - kmIni.valore;
          testo += `Diff Km: ${diff}\n`;
        }
      }
      testo += `\n`;
    });
    let tot = 0;
    vociCorrenti.forEach(x => { if (x.categoria!=='km') tot+= x.valore; });
    testo += `Totale Spese (no Km): ${tot.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const url = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(url,'_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 11. Avvio: nessun caricamento automatico, tabelle vuote
  //
  aggiornaTabella();
});
