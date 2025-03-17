document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Struttura dati
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

  // Array di voci (NON salvate finché non clicchiamo "Salva Settimana")
  let vociCorrenti = [];
  let editIndex = -1; // se >=0 stiamo modificando

  //
  // 2. Selettori
  //
  // (Dati generali e gestione settimana)
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const numeroSettInput= document.getElementById('numero-settimana');
  const caricaBtn      = document.getElementById('carica-settimana');
  const salvaBtn       = document.getElementById('salva-settimana');

  // (Inserimento voce)
  const dataInput      = document.getElementById('data-giorno');
  const giornoInput    = document.getElementById('giorno-settimana');
  const settAutoInput  = document.getElementById('settimana-auto');
  const descInput      = document.getElementById('descrizione-giorno');
  const catSelect      = document.getElementById('categoria');
  const sottoCatSelect = document.getElementById('sottocategoria');
  const valoreInput    = document.getElementById('valore-voce');
  const aggiungiBtn    = document.getElementById('aggiungi-voce');

  // (Riepilogo)
  const riepilogoBody  = document.querySelector('#riepilogo-table tbody');
  const sommaSettEl    = document.getElementById('somma-settimanale');

  // (Note e firme)
  const noteArea       = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  // (Pulsanti esporta/stampa)
  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const wappBtn        = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  //
  // 3. Calcolo giorno e settimana ISO al cambio data
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    // Esempio "2025-03-17" => [2025,03,17]
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const d = new Date(+yyyy, +mm - 1, +dd);

    // Giorno
    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[d.getDay()];

    // Settimana ISO (auto)
    const w = getISOWeekNumber(d);
    settAutoInput.value = w;
  });

  function getISOWeekNumber(d) {
    // Copia in UTC
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    let day = tmp.getUTCDay();
    if (day === 0) day = 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    const weekNo = Math.ceil( ((tmp - yearStart)/86400000 + 1) / 7 );
    return weekNo;
  }

  //
  // 4. Cambio categoria => aggiorna sottocategoria
  //
  catSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const c = catSelect.value;
    if (sottoCatMap[c]) {
      sottoCatMap[c].forEach(sc => {
        const op = document.createElement('option');
        op.value = sc;
        op.textContent = sc;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 5. Click su Aggiungi (o Salva Modifica)
  //
  aggiungiBtn.addEventListener('click', () => {
    // Verifiche minime
    if (!dataInput.value) {
      alert('Inserisci una data');
      return;
    }
    if (!catSelect.value || !sottoCatSelect.value) {
      alert('Seleziona Categoria e Sottocategoria');
      return;
    }
    // Controlla che la data selezionata abbia la stessa settimana (auto) dell'eventuale altra data già inserita
    // (Opzionale: se vuoi bloccare l’inserimento di date di settimane diverse)
    // Per semplicità NON blocchiamo, ma si potrebbe.

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
      vociCorrenti[editIndex] = voce;
      editIndex = -1;
      aggiungiBtn.textContent = 'Aggiungi';
    } else {
      vociCorrenti.push(voce);
    }

    // Pulizia campi
    dataInput.value = '';
    giornoInput.value = '';
    settAutoInput.value = '';
    descInput.value = '';
    catSelect.value = '';
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    valoreInput.value = '';

    aggiornaTabella();
  });

  //
  // 6. Aggiorna tabella
  //
  function aggiornaTabella() {
    riepilogoBody.innerHTML = '';

    // Mappa per km: { data => {kmIni, kmFin} }
    const kmMap = {};

    vociCorrenti.forEach(voce => {
      if (voce.categoria === 'km') {
        const key = voce.data;
        if (!kmMap[key]) {
          kmMap[key] = { kmIni: null, kmFin: null };
        }
        if (voce.sottocategoria === 'Km Iniziali') {
          kmMap[key].kmIni = voce.valore;
        }
        if (voce.sottocategoria === 'Km Finali') {
          kmMap[key].kmFin = voce.valore;
        }
      }
    });

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

      // SottoCat
      const tdSub = document.createElement('td');
      tdSub.textContent = voce.sottocategoria;
      tr.appendChild(tdSub);

      // Valore
      const tdVal = document.createElement('td');
      tdVal.textContent = voce.valore;
      tr.appendChild(tdVal);

      // Km Tot
      const tdKm = document.createElement('td');
      if (kmMap[voce.data]) {
        const { kmIni, kmFin } = kmMap[voce.data];
        if (kmIni !== null && kmFin !== null) {
          tdKm.textContent = kmFin - kmIni;
        } else {
          tdKm.textContent = ''; 
        }
      } else {
        tdKm.textContent = '';
      }
      tr.appendChild(tdKm);

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
        // Ricarica le sottocategorie
        sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
        if (sottoCatMap[voce.categoria]) {
          sottoCatMap[voce.categoria].forEach(sc => {
            const op = document.createElement('option');
            op.value = sc; op.textContent = sc;
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

    // Totale spese (no km)
    let totSpese = 0;
    vociCorrenti.forEach(v => {
      if (v.categoria !== 'km') {
        totSpese += v.valore;
      }
    });
    sommaSettEl.textContent = totSpese.toFixed(2);
  }

  //
  // 7. Carica Settimana
  //
  caricaBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value;
    if (!nSett) {
      alert('Inserisci un numero settimana da caricare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun salvataggio trovato per la settimana ${nSett}`);
      return;
    }
    const obj = JSON.parse(salvato);
    // Ripristiniamo i campi
    dipInput.value      = obj.dipendente || '';
    targaInput.value    = obj.targa || '';
    noteArea.value      = obj.note || '';
    firmaDirInput.value = obj.firmaDirezione || '';
    firmaDipInput.value = obj.firmaDipendente || '';
    vociCorrenti        = obj.voci || [];
    editIndex           = -1;
    aggiungiBtn.textContent = 'Aggiungi';
    aggiornaTabella();
  });

  //
  // 8. Salva Settimana
  //
  salvaBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value;
    if (!nSett) {
      alert('Inserisci o conferma il numero di settimana per salvare');
      return;
    }
    // In base all’ULTIMA voce inserita potresti prendere la “settimanaAuto”
    // Ma qui lasciamo all’utente la libertà di impostare manualmente “N. Settimana”

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
    alert(`Settimana ${nSett} salvata con successo!`);
  });

  //
  // 9. Pulsanti stampa
  //
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value || '';
    let testo = `NOTA SPESE TRASFERTA - Settimana ${nSett}\n\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;

    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione} => ${v.categoria}/${v.sottocategoria} = ${v.valore}\n`;
    });
    // Totale
    let totSpese = 0;
    vociCorrenti.forEach(v => {
      if (v.categoria !== 'km') {
        totSpese += v.valore;
      }
    });
    testo += `\nTotale Spese (no Km): ${totSpese.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    // Scarichiamo .txt
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nota_spese_sett_${nSett}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  wappBtn.addEventListener('click', () => {
    const nSett = numeroSettInput.value || '';
    let testo = `NOTA SPESE (Settimana ${nSett})\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione} => ${v.categoria}/${v.sottocategoria}: ${v.valore}\n\n`;
    });
    let totSpese = 0;
    vociCorrenti.forEach(v => {
      if (v.categoria !== 'km') {
        totSpese += v.valore;
      }
    });
    testo += `Totale Spese (no Km): ${totSpese.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const urlW = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlW, '_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 10. Fine
  // (nessuna azione di default, partiamo con vociCorrenti vuoto,
  //  l'utente può Caricare una settimana già esistente se vuole)
  aggiornaTabella();
});
