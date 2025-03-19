document.addEventListener('DOMContentLoaded', () => {
  //
  // 1. Mappa sottocategorie
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
  // 2. Struttura dati
  //
  // Ogni voce: { data, giorno, settimanaAuto, descrizione, categoria, sottocategoria, valore, allegatoBase64 }
  let vociCorrenti = [];
  let editIndex = -1;

  //
  // 3. Selettori
  //
  // Dati generali
  const dipInput       = document.getElementById('dipendente');
  const targaInput     = document.getElementById('targa');
  const nSettInput     = document.getElementById('numero-settimana');
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
  const allegatoInput  = document.getElementById('allegato');
  const aggiungiBtn    = document.getElementById('aggiungi-voce');

  // Riepilogo (verticale)
  const riepilogoContainer = document.getElementById('riepilogo-container');
  const sommaSettEl        = document.getElementById('somma-settimanale');

  // Note/firme
  const noteArea       = document.getElementById('note');
  const firmaDirInput  = document.getElementById('firma-direzione');
  const firmaDipInput  = document.getElementById('firma-dipendente');

  // Pulsanti
  const stampaTxtBtn   = document.getElementById('stampa-txt');
  const wappBtn        = document.getElementById('condividi-whatsapp');
  const stampaRepBtn   = document.getElementById('stampa-replica');

  //
  // 4. Cambio data => calcola giorno e settimana
  //
  dataInput.addEventListener('change', () => {
    if (!dataInput.value) return;
    const [yyyy, mm, dd] = dataInput.value.split('-');
    const d = new Date(+yyyy, +mm-1, +dd);
    const giorniITA = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
    giornoInput.value = giorniITA[d.getDay()];
    settAutoInput.value = getISOWeekNumber(d);
  });

  function getISOWeekNumber(d) {
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    let day = tmp.getUTCDay();
    if (day===0) day=7;
    tmp.setUTCDate(tmp.getUTCDate()+4-day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
    return Math.ceil(((tmp-yearStart)/86400000+1)/7);
  }

  //
  // 5. Cambio categoria => popola sottocategorie
  //
  catSelect.addEventListener('change', () => {
    sottoCatSelect.innerHTML = '<option value="">-- Sottocategoria --</option>';
    const c = catSelect.value;
    if (sottoCatMap[c]) {
      sottoCatMap[c].forEach(sub => {
        const op = document.createElement('option');
        op.value=sub; op.textContent=sub;
        sottoCatSelect.appendChild(op);
      });
    }
  });

  //
  // 6. Aggiungi/Modifica
  //
  aggiungiBtn.addEventListener('click', async () => {
    if (!dataInput.value) { alert('Inserisci una data'); return; }
    if (!catSelect.value || !sottoCatSelect.value) {
      alert('Seleziona Categoria e Sottocategoria');
      return;
    }

    // Converti il file allegato in base64 (opzionale: potresti usarlo come File object e NON salvare su localStorage)
    let base64str = null;
    if (allegatoInput.files && allegatoInput.files[0]) {
      const file = allegatoInput.files[0];
      base64str = await fileToBase64(file);
    }

    const voce = {
      data: dataInput.value,
      giorno: giornoInput.value,
      settimanaAuto: settAutoInput.value,
      descrizione: descInput.value.trim(),
      categoria: catSelect.value,
      sottocategoria: sottoCatSelect.value,
      valore: parseFloat(valoreInput.value) || 0,
      allegatoBase64: base64str // null se nessun allegato
    };

    if (editIndex >= 0) {
      vociCorrenti[editIndex] = voce;
      editIndex = -1;
      aggiungiBtn.textContent='Aggiungi';
    } else {
      vociCorrenti.push(voce);
    }

    // Pulizia minima (non resettiamo data/cat se vuoi rimanere sulla stessa)
    descInput.value='';
    valoreInput.value='';
    allegatoInput.value='';

    aggiornaRiepilogo();
  });

  // Helper per convertire file -> base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file); // risulta in base64
    });
  }

  //
  // 7. Aggiorna Riepilogo in verticale
  //
  function aggiornaRiepilogo() {
    riepilogoContainer.innerHTML = '';

    vociCorrenti.forEach((voce, i) => {
      const card = document.createElement('div');
      card.classList.add('voce-card');

      const h3 = document.createElement('h3');
      h3.textContent = `Data: ${voce.data} - Settimana: ${voce.settimanaAuto}`;
      card.appendChild(h3);

      // Mostriamo gli altri campi in verticale
      const p1 = document.createElement('p');
      p1.textContent = `Giorno: ${voce.giorno}`;
      card.appendChild(p1);

      const p2 = document.createElement('p');
      p2.textContent = `Descrizione: ${voce.descrizione}`;
      card.appendChild(p2);

      const p3 = document.createElement('p');
      p3.textContent = `Categoria: ${voce.categoria} / ${voce.sottocategoria}`;
      card.appendChild(p3);

      // Calcolo diff km (0 se Km Iniz, se Km Finali cerchiamo “Km Iniziali”)
      let diff = 0;
      if (voce.categoria==='km' && voce.sottocategoria==='Km Finali') {
        const ini = vociCorrenti.find(x => 
          x.data===voce.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (ini) {
          diff = voce.valore - ini.valore;
        }
      }
      const p4 = document.createElement('p');
      p4.textContent = `Valore: ${voce.valore} | Diff Km: ${diff}`;
      card.appendChild(p4);

      // Anteprima allegato se presente
      if (voce.allegatoBase64) {
        const img = document.createElement('img');
        img.classList.add('foto-preview');
        img.src = voce.allegatoBase64;
        card.appendChild(img);
      }

      // Sezione Azioni
      const azioniDiv = document.createElement('div');
      azioniDiv.classList.add('azioni');

      const btnMod = document.createElement('button');
      btnMod.textContent='Modifica';
      btnMod.addEventListener('click', () => {
        // Carichiamo i campi
        editIndex = i;
        dataInput.value=voce.data;
        giornoInput.value=voce.giorno;
        settAutoInput.value=voce.settimanaAuto;
        descInput.value=voce.descrizione;
        catSelect.value=voce.categoria;
        sottoCatSelect.innerHTML='<option value="">-- Sottocategoria --</option>';
        if (sottoCatMap[voce.categoria]) {
          sottoCatMap[voce.categoria].forEach(sub => {
            const op = document.createElement('option');
            op.value=sub; op.textContent=sub;
            sottoCatSelect.appendChild(op);
          });
        }
        sottoCatSelect.value = voce.sottocategoria;
        valoreInput.value = voce.valore;
        // allegato: non possiamo reimpostare un file su un input, 
        // ma se vuoi mostrare l'anteprima la hai in voce.allegatoBase64
        allegatoInput.value='';
        aggiungiBtn.textContent='Salva Modifica';
      });
      azioniDiv.appendChild(btnMod);

      const btnDel = document.createElement('button');
      btnDel.textContent='Elimina';
      btnDel.addEventListener('click', () => {
        vociCorrenti.splice(i,1);
        aggiornaRiepilogo();
      });
      azioniDiv.appendChild(btnDel);

      card.appendChild(azioniDiv);

      riepilogoContainer.appendChild(card);
    });

    // Calcolo Totale Spese
    let totSpese=0;
    vociCorrenti.forEach(v => {
      if (v.categoria!=='km') {
        totSpese += v.valore;
      }
    });
    sommaSettEl.textContent=totSpese.toFixed(2);
  }

  //
  // 8. Carica/Salva Settimana
  //
  caricaBtn.addEventListener('click', () => {
    const nSett = nSettInput.value;
    if (!nSett) {
      alert('Inserisci il numero settimana da caricare');
      return;
    }
    const key = `NotaSpese_${nSett}`;
    const salvato = localStorage.getItem(key);
    if (!salvato) {
      alert(`Nessun salvataggio per la settimana ${nSett}`);
      return;
    }
    const obj = JSON.parse(salvato);
    dipInput.value   = obj.dipendente || '';
    targaInput.value = obj.targa || '';
    noteArea.value   = obj.note || '';
    firmaDirInput.value = obj.firmaDirezione || '';
    firmaDipInput.value = obj.firmaDipendente || '';
    vociCorrenti = obj.voci || [];
    editIndex = -1;
    aggiungiBtn.textContent='Aggiungi';
    aggiornaRiepilogo();
    alert(`Settimana ${nSett} caricata con successo!`);
  });

  salvaBtn.addEventListener('click', () => {
    const nSett = nSettInput.value;
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
    // Attenzione: se vociCorrenti contiene molte foto base64, potresti saturare localStorage
    localStorage.setItem(key, JSON.stringify(obj));
    alert(`Settimana ${nSett} salvata correttamente!`);
  });

  //
  // 9. Stampa, WhatsApp, ecc.
  //
  stampaTxtBtn.addEventListener('click', () => {
    const nSett = nSettInput.value || '';
    let testo = `NOTA SPESE (Settimana ${nSett})\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data} ${v.giorno}] S${v.settimanaAuto} - ${v.descrizione}\n`;
      testo += `=> ${v.categoria}/${v.sottocategoria} = ${v.valore}`;
      if (v.categoria==='km' && v.sottocategoria==='Km Finali') {
        const ini = vociCorrenti.find(x =>
          x.data===v.data && x.categoria==='km' && x.sottocategoria==='Km Iniziali'
        );
        if (ini) {
          const diff = v.valore - ini.valore;
          testo += ` (DiffKm: ${diff})`;
        }
      }
      testo += `\n\n`;
    });
    let tot=0;
    vociCorrenti.forEach(x=> { if(x.categoria!=='km') tot+=x.valore; });
    testo += `Totale Spese (no Km): ${tot.toFixed(2)}\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const blob = new Blob([testo], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`nota_spese_sett_${nSett}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  wappBtn.addEventListener('click', () => {
    let testo = `NOTA SPESE\n`;
    testo += `Dipendente: ${dipInput.value}\nTarga: ${targaInput.value}\n\n`;
    vociCorrenti.forEach(v => {
      testo += `[${v.data}] S${v.settimanaAuto} - ${v.giorno}\n`;
      testo += `${v.descrizione}\n=> ${v.categoria}/${v.sottocategoria} = ${v.valore}\n\n`;
    });
    let tot=0;
    vociCorrenti.forEach(x=> { if(x.categoria!=='km') tot+=x.valore; });
    testo += `Totale Spese (no Km): ${tot.toFixed(2)}\n\n`;
    testo += `Note: ${noteArea.value}\n`;
    testo += `Visto Direzione: ${firmaDirInput.value}\nFirma Dipendente: ${firmaDipInput.value}\n`;

    const wurl = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(wurl,'_blank');
  });

  stampaRepBtn.addEventListener('click', () => {
    window.print();
  });

  //
  // 10. Avvio
  //
  aggiornaRiepilogo();
});
