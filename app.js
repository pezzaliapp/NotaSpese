// app.js
document.addEventListener('DOMContentLoaded', () => {
  // Definizione delle sottocategorie per ogni categoria
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

  // Struttura dati per memorizzare spese
  let spese = [];

  // Selettori
  const categoriaSelect = document.querySelector('.categoria');
  const sottoCatSelect = document.querySelector('.sottocategoria');
  const aggiungiVoceBtn = document.querySelector('.aggiungi-voce');
  const riepilogoContainer = document.getElementById('riepilogo-giornaliero');
  const sommaSettimanaleEl = document.getElementById('somma-settimanale');

  // Quando cambia la categoria, aggiorna la sottocategoria
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

  // Funzione per aggiungere la voce di spesa
  aggiungiVoceBtn.addEventListener('click', () => {
    const dataGiornoInput = document.querySelector('.data-giorno');
    const giornoSettimanaSelect = document.querySelector('.giorno-settimana');
    const importoInput = document.querySelector('.importo');
    const fotoInput = document.querySelector('.foto');

    const dataGiorno = dataGiornoInput.value;
    const giorno = giornoSettimanaSelect.value;
    const categoria = categoriaSelect.value;
    const sottocategoria = sottoCatSelect.value;
    const importo = parseFloat(importoInput.value) || 0;
    const fotoFile = fotoInput.files[0] || null;

    if (!dataGiorno || !giorno || !categoria || !sottocategoria) {
      alert('Compila tutti i campi richiesti');
      return;
    }

    // Crea un oggetto per la spesa
    const voceSpesa = {
      data: dataGiorno,
      giorno: giorno,
      categoria: categoria,
      sottocategoria: sottocategoria,
      importo: importo,
      foto: fotoFile
    };

    spese.push(voceSpesa);

    // Pulisci i campi input dopo l’aggiunta
    importoInput.value = '';
    fotoInput.value = '';

    // Aggiorna l’interfaccia
    aggiornaRiepilogo();
  });

  // Funzione di aggiornamento del riepilogo
  function aggiornaRiepilogo() {
    riepilogoContainer.innerHTML = '';
    // Raggruppa spese per data+giorno
    // (Potresti anche raggruppare solo per data)
    const spesePerGiorno = {};

    spese.forEach((spesa) => {
      const chiave = spesa.data + '|' + spesa.giorno;
      if (!spesePerGiorno[chiave]) {
        spesePerGiorno[chiave] = [];
      }
      spesePerGiorno[chiave].push(spesa);
    });

    let totaleSettimana = 0;

    for (const chiave in spesePerGiorno) {
      const [data, giorno] = chiave.split('|');
      const elencoSpese = spesePerGiorno[chiave];

      let subtotale = 0;
      elencoSpese.forEach((s) => {
        subtotale += s.importo;
      });
      totaleSettimana += subtotale;

      // Creiamo un container per il giorno
      const giornoDiv = document.createElement('div');
      giornoDiv.classList.add('giorno-container');

      const titoloGiorno = document.createElement('h3');
      titoloGiorno.textContent = `${giorno} (${data}) - Subtotale: €${subtotale.toFixed(2)}`;
      giornoDiv.appendChild(titoloGiorno);

      // Lista delle singole voci
      elencoSpese.forEach((s) => {
        const voce = document.createElement('div');
        voce.classList.add('voce-spesa');
        voce.textContent = `${s.categoria} / ${s.sottocategoria}: €${s.importo.toFixed(2)}`;
        // Se hai bisogno di visualizzare la foto: 
        // puoi creare un <img> e usare URL.createObjectURL(s.foto) se presente
        giornoDiv.appendChild(voce);
      });

      riepilogoContainer.appendChild(giornoDiv);
    }

    sommaSettimanaleEl.textContent = totaleSettimana.toFixed(2);
  }

  // Funzionalità stampa TXT (semplificata)
  const stampaTxtBtn = document.getElementById('stampa-txt');
  stampaTxtBtn.addEventListener('click', () => {
    let testo = '';

    // Dati generali
    const dipendente = document.getElementById('dipendente').value;
    const targa = document.getElementById('targa').value;
    const settimana = document.getElementById('settimana').value;

    testo += `NOTA SPESE TRASFERTA\n`;
    testo += `Dipendente: ${dipendente}\n`;
    testo += `Targa Automezzo: ${targa}\n`;
    testo += `Settimana: ${settimana}\n\n`;

    // Dettagli spese
    spese.forEach((s) => {
      testo += `[${s.giorno} ${s.data}] ${s.categoria} / ${s.sottocategoria} - €${s.importo.toFixed(
        2
      )}\n`;
    });

    // Totale
    testo += `\nTotale settimanale: €${sommaSettimanaleEl.textContent}\n`;

    // Note
    const note = document.getElementById('note').value;
    testo += `\nNote: ${note}\n\n`;

    // Firme
    // (in questo esempio le prendiamo come testo, ma puoi gestire firma digitale in altro modo)
    // ...
    alert(testo); 
    // Se vuoi generare un file .txt da scaricare:
    const blob = new Blob([testo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nota_spese.txt';
    link.click();
    URL.revokeObjectURL(url);
  });

  // Condivisione via WhatsApp (solo testo)
  const whatsappBtn = document.getElementById('condividi-whatsapp');
  whatsappBtn.addEventListener('click', () => {
    let testo = `NOTA SPESE TRASFERTA\n`;
    const dipendente = document.getElementById('dipendente').value;
    const settimana = document.getElementById('settimana').value;
    testo += `Dipendente: ${dipendente}\nSettimana: ${settimana}\n`;

    spese.forEach((s) => {
      testo += `[${s.giorno}] ${s.categoria}/${s.sottocategoria}: €${s.importo.toFixed(2)}\n`;
    });
    testo += `Totale settimanale: €${sommaSettimanaleEl.textContent}\n`;

    // Genera un link WhatsApp
    const urlWhatsapp = `whatsapp://send?text=${encodeURIComponent(testo)}`;
    window.open(urlWhatsapp, '_blank');
  });

  // Eventuale “stampa replica form” in PDF/stampa di sistema
  const stampaReplicaBtn = document.getElementById('stampa-replica');
  stampaReplicaBtn.addEventListener('click', () => {
    window.print();
  });
});
