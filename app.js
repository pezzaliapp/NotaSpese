document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Dizionario per sottocategorie
  //
  const sottoCatMap = {
    km: ['Km Iniziali', 'Km Finali'],
    'spese-viaggio': [
      'Parcheggi',
      'Noleggio Auto',
      'Taxi/Autobus',
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

  //
  // 2. Selettori
  //
  const dipInput      = document.getElementById('dipendente');
  const targaInput    = document.getElementById('targa');
  const settInput     = document.getElementById('numero-settimana'); // readOnly, calcolato da data
  const dataInput     = document.getElementById('data-giorno');
  const giornoInput   = document.getElementById('giorno-settimana');
  const descInput     = document.getElementById('descrizione-giorno');
  const catSelect     = document.getElementById('categoria');
  const sottoCatSelect= document.getElementById('sottocategoria');
  const valoreInput   = document.getElementById('valore-voce');
  const aggiungiBtn   = document.getElementById('aggiungi-voce');

  const riepilogoBody = document.querySelector('#riepilogo-table tbody');
  const sommaSettEl   = document.getElementById('somma-settimanale');

  const noteArea      = document.getElementById('note');
  const firmaDirInput = document.getElementById('firma-direzione');
  const firmaDipInput = document.getElementById('firma-dipendente');

  const stampaTxtBtn  = document.getElementById('stampa-txt');
  const wappBtn       = document.getElementById('condividi-whatsapp');
  const stampaRepBtn  = document.getElementById('stampa-replica');

  //
  // 3. Struttura dati: array di voci
  //
  let spese = [];
  let editIndex = -1; // se > -1 stiamo modificando

  //
  // 4. Carica da localStorage (se presente)
  //
  function caricaDati() {
    const salvato = localStorage.getItem('notaSpese');
    if (salvato) {
      const obj = JSON.parse(salvato);
      spese = obj.spese || [];
      dipInput.value      = obj.dipendente || '';
      targaInput.value    = obj.targa || '';
      noteArea.value      = obj.note || '';
      firmaDirInput.value = obj.firmaDirezione || '';
      firmaDipInput.value = obj.firmaDipendente || '';
      aggiornaTabella();
    }
  }

  //
  // 5. Salva su localStorage
  //
  function salvaDati() {
    const obj = {
      spese: spese,
      dipendente: dipInput.value,
      targa: targaInput.value,
      note: noteArea.value,
      firmaDirezione: firmaDirInput.value,
      firmaDipendente: firmaDipInput.value
    };
    localStorage.setItem('notaSpese', JSON.stringify(obj));
  }

  //
  // 6. Calcolo giorno e settimana ogni volta che cambia la data
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    // Esempio "2025-03-17"
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const d = new Date(+yyyy, +mm - 1, +dd);

    // Giorno in italiano
    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[d.getDay()];

    // Calcolo ISO week
    const w = getISOWeekNumber(d);
    settInput.value = w;
  });

  // Funzione ISO Week
  function getISOWeekNumber(d) {
    // Copia in UTC
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // getUTCDay => 0=Dom => 7
    let day = date.getUTCDay();
    if (day === 0) day = 7;
    // Spostiamo al giovedì
    date.setUTCDate(date.getUTCDate() + 4 - day);
    // 1° gennaio
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // differenza in giorni /7
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  }

  //
  // 7. Cambio categoria => aggiorna sottocategorie
  //
  catSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const c = catSelect.value;
    if (sottoCatMap[c]) {
      sottoCatMap[c].forEach((sub) => {
        const op = document.createElement('option');
        op.value = sub;
        op.textContent = sub;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 8. Aggiungi / Modifica voce
  //
  aggiungiBtn.addEventListener('click', () => {
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
      descrizione: descInput.value.trim(),
      categoria: catSelect.value,
      sottocategoria: sottoCatSelect.value,
      valore: parseFloat(valoreInput.value) || 0
    };

    if (editIndex >= 0) {
      // salviamo modifica
      spese[editIndex] = voce;
      editIndex = -1;
      aggiungiBtn.textContent = 'Aggiungi';
    } else {
      // nuova voce
      spese.push(voce);
    }

    // Pulisci campi
    dataInput.value = '';
    giornoInput.value = '';
    descInput.value = '';
    catSelect.value = '';
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    valoreInput.value = '';

    aggiornaTabella();
    salvaDati();
  });

  //
  // 9. Aggiorna tabella
  //
  function aggiornaTabella() {
    riepilogoBody.innerHTML = '';

    // mappa per km: { "YYYY-MM-DD": { kmIni: number, kmFin: number } }
    const kmMap = {};

    // 1) popola kmMap
    spese.forEach((v) => {
      if (v.categoria === 'km') {
        const key = v.data;
        if (!kmMap[key]) {
          kmMap[key] = { kmIni: null, kmFin: null };
        }
        if (v.sottocategoria === 'Km Iniziali') {
          kmMap[key].kmIni = v.valore;
        } else if (v.sottocategoria === 'Km Finali') {
          kmMap[key].kmFin = v.valore;
        }
      }
    });

    // 2) crea righe
    spese.forEach((voce, i) => {
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

      // Tot Km (se esistono Ini e Finali per questa data)
      const tdKm = document.createElement('td');
      tdKm.textContent = '';
      if (kmMap[voce.data]) {
        const { kmIni, kmFin } = kmMap[voce.data];
        if (kmIni !== null && kmFin !== null) {
          tdKm.textContent = kmFin - kmIni;
        }
      }
      tr.appendChild(tdKm);

      // Azioni
      const tdAz = document.createElement('td');
      // Bottone Modifica
      const btnMod = document.createElement('button');
      btnMod.textContent = 'Modifica';
      btnMod.addEventListener('click', () => {
        editIndex = i;
        dataInput.value = voce.data;
        giornoInput.value = voce.giorno;
        descInput.value = voce.descrizione;
        catSelect.value = voce.categoria;
        // Ricarica sottocategorie
        sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
        if (sottoCatMap[voce.categoria]) {
          sottoCatMap[voce.categoria].forEach((sub) => {
            const op = document.createElement('option');
            op.value = sub;
            op.textContent = sub;
            sottoCatSelect.appendChild(op);
          });
        }
        sottoCatSelect.value = voce.sottocategoria;
        valoreInput.value = voce.valore;
        aggiungiBtn.textContent = 'Salva Modifica';
      });
      tdAz.appendChild(btnMod);

      // Bottone Elimina
      const btnDel = document.createElement('button');
      btnDel.textContent = 'Elimina';
      btnDel.style.marginLeft = '5px';
      btnDel.addEventListener('click', () => {
        spese.splice(i, 1);
        aggiornaTabella();
        salvaDati();
      });
      tdAz.appendChild(btnDel);

      tr.appendChild(tdAz);

      riepilogoBody.appendChild(tr);
    });

    // 3) Calcolo totale spese (escluse km)
    let totEuro = 0;
    spese.forEach((v) => {
      if (v.categoria !== 'km') {
        totEuro += v.valore;
      }
    });
    sommaSettEl.textContent = totEuro.toFixed(2);
  }

  //
  // 10. Stampa / WhatsApp / Print
  //
  stampaTxtBtn.addEventListener('click', () => {
    let testo = 'NOTA SPESE TRASFERTA\n\n';
    testo += `Dipendente: ${dipInput.value}\n`;
    testo += `Targa: ${targaInput.value}\n`;
    testo += `Settimana ISO (ultima data inserita): ${settInput.value}\n\n`;

    spese.forEach((v) => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione} => ${v.categoria}/${v.sottocategoria} = ${v.valore}\n`;
    });

    // Totale spese no km
    let total = 0;
    spese.forEach((v) => { if (v.categoria !== 'km') total += v.valore; });
    testo += `\nTotale Spese (no Km): ${total.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\n`;
    testo += `Firma Dipendente: ${firmaDipInput.value}\n`;

    // Scarichiamo .txt
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nota_spese.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  wappBtn.addEventListener('click', () => {
    let testo = 'NOTA SPESE\n';
    testo += `Dipendente: ${dipInput.value}\n`;
    testo += `Targa: ${targaInput.value}\n\n`;

    spese.forEach((v) => {
      testo += `[${v.data} ${v.giorno}] ${v.descrizione}\n=> ${v.categoria}/${v.sottocategoria}: ${v.valore}\n\n`;
    });

    let total = 0;
    spese.forEach((v) => { if (v.categoria !== 'km') total += v.valore; });
    testo += `Totale Spese (no Km): ${total.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const url = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(url, '_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 11. Avvio: carica localStorage e aggiorna tabella
  //
  caricaDati();
  aggiornaTabella();
});
