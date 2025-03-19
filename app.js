document.addEventListener('DOMContentLoaded', () => {
    const dipendenteInput = document.getElementById('dipendente');
    const targaInput = document.getElementById('targa');
    const settimanaInput = document.getElementById('num-settimana');
    const tableSpese = document.getElementById('table-spese');
    const noteInput = document.getElementById('note');
    const firmaDirezioneInput = document.getElementById('firma-direzione');
    const firmaDipendenteInput = document.getElementById('firma-dipendente');

    const salvaBtn = document.getElementById('salva-settimana');
    const caricaBtn = document.getElementById('carica-settimana');
    const stampaTxtBtn = document.getElementById('stampa-txt');
    const whatsappBtn = document.getElementById('condividi-whatsapp');

    let speseData = {}; // Oggetto che conterrà i dati salvati per la settimana selezionata

    // 📌 Funzione per calcolare il numero della settimana e il giorno della settimana
    function calcolaSettimanaEDay(data) {
        const dateObj = new Date(data);
        if (isNaN(dateObj)) return { settimana: '', giorno: '' };

        const primoGennaio = new Date(dateObj.getFullYear(), 0, 1);
        const giornoAnno = Math.floor((dateObj - primoGennaio) / (24 * 60 * 60 * 1000)) + 1;
        const settimana = Math.ceil(giornoAnno / 7);
        const giorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
        const giorno = giorniSettimana[dateObj.getDay()];
        return { settimana, giorno };
    }

    // 📌 Funzione per aggiornare i calcoli della tabella
    function aggiornaCalcoli() {
        let totaleKmSettimana = 0;
        let totaleSettimanale = 0;

        ["lun", "mar", "mer", "gio", "ven", "sab", "dom"].forEach(giorno => {
            const kmIni = speseData[giorno]?.kmIni || 0;
            const kmFin = speseData[giorno]?.kmFin || 0;
            const kmDiff = kmFin - kmIni;
            speseData[giorno].kmDiff = kmDiff;
            totaleKmSettimana += kmDiff;

            // Scrive il valore della differenza km
            const cellKmDiff = tableSpese.querySelector(`td[data-cat="kmDiff"][data-day="${giorno}"]`);
            if (cellKmDiff) cellKmDiff.innerText = kmDiff;

            // Calcolo subtotali per ogni categoria
            let subtotaleGiorno = 0;
            ["parcheggi", "noleggio", "taxiBus", "biglietti", "carburCont", "viaggioAltro", "alloggio", "colazione", "pranzo", "cena", "acquaCaffe", "alloggioAltro", "cartaEni"].forEach(cat => {
                subtotaleGiorno += speseData[giorno]?.[cat] || 0;
            });

            totaleSettimanale += subtotaleGiorno;

            // Aggiorna il subtotale giornaliero nella tabella
            const cellSubtotale = tableSpese.querySelector(`td[data-cat="subtotaleDay"][data-day="${giorno}"]`);
            if (cellSubtotale) cellSubtotale.innerText = subtotaleGiorno.toFixed(2);
        });

        // Aggiorna il totale della settimana
        document.querySelector(".km-sett-tot").innerText = totaleKmSettimana.toFixed(2);
        document.querySelector(".totale-settimana").innerText = totaleSettimanale.toFixed(2);
    }

    // 📌 Funzione per ripristinare le celle con i dati salvati
    function ripristinaCelle() {
        Object.keys(speseData).forEach(giorno => {
            Object.keys(speseData[giorno]).forEach(cat => {
                const cell = tableSpese.querySelector(`td[data-cat="${cat}"][data-day="${giorno}"]`);
                if (cell) cell.innerText = speseData[giorno][cat];
            });
        });
        aggiornaCalcoli();
    }

    // 📌 Evento per modificare i valori nelle celle
    tableSpese.addEventListener('input', (e) => {
        const cell = e.target;
        const cat = cell.dataset.cat;
        const day = cell.dataset.day;
        const valore = parseFloat(cell.innerText) || 0;

        if (!speseData[day]) speseData[day] = {};
        speseData[day][cat] = valore;

        aggiornaCalcoli();
    });

    // 📌 Carica settimana salvata
    caricaBtn.addEventListener('click', () => {
        const settimana = settimanaInput.value;
        if (!settimana) { alert("Inserisci un numero di settimana valido!"); return; }
        
        const datiSalvati = localStorage.getItem(`NotaSpese_${settimana}`);
        if (!datiSalvati) { alert(`Nessun dato trovato per la settimana ${settimana}`); return; }

        const dati = JSON.parse(datiSalvati);
        dipendenteInput.value = dati.dipendente || '';
        targaInput.value = dati.targa || '';
        noteInput.value = dati.note || '';
        firmaDirezioneInput.value = dati.firmaDirezione || '';
        firmaDipendenteInput.value = dati.firmaDipendente || '';
        speseData = dati.speseData || {};
        
        ripristinaCelle();
        alert(`Settimana ${settimana} caricata con successo!`);
    });

    // 📌 Salva settimana
    salvaBtn.addEventListener('click', () => {
        const settimana = settimanaInput.value;
        if (!settimana) { alert("Inserisci un numero di settimana valido!"); return; }

        const dati = {
            dipendente: dipendenteInput.value.trim(),
            targa: targaInput.value.trim(),
            note: noteInput.value.trim(),
            firmaDirezione: firmaDirezioneInput.value.trim(),
            firmaDipendente: firmaDipendenteInput.value.trim(),
            speseData: speseData
        };

        localStorage.setItem(`NotaSpese_${settimana}`, JSON.stringify(dati));
        alert(`Settimana ${settimana} salvata con successo!`);
    });

    // 📌 Stampa TXT
    stampaTxtBtn.addEventListener('click', () => {
        const settimana = settimanaInput.value;
        let txt = `NOTA SPESE TRASFERTA - Settimana ${settimana}\n\nDipendente: ${dipendenteInput.value}\nTarga: ${targaInput.value}\n\n`;

        Object.keys(speseData).forEach(day => {
            txt += `${day.toUpperCase()}: ${JSON.stringify(speseData[day])}\n`;
        });

        const blob = new Blob([txt], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `nota_spese_${settimana}.txt`;
        a.click();
    });

    // 📌 WhatsApp
    whatsappBtn.addEventListener('click', () => {
        let msg = `Nota Spese ${settimanaInput.value}: Dipendente ${dipendenteInput.value}, Targa ${targaInput.value}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    });

    aggiornaCalcoli();
});
