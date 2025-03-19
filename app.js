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

    let speseData = {}; // Oggetto per memorizzare i dati

    // 📌 Funzione per aggiornare i totali
    function aggiornaCalcoli() {
        let totaleKmSettimana = 0;
        let totaleSettimanale = 0;

        // Itera su tutte le righe della tabella
        document.querySelectorAll("tr").forEach(row => {
            let totaleRiga = 0;

            // Prende tutte le celle della riga tranne l'ultima (Totale)
            const celle = row.querySelectorAll("td[data-cat]");
            celle.forEach(cella => {
                let valore = parseFloat(cella.innerText) || 0;
                totaleRiga += valore;
            });

            // Scrive il totale nella colonna "Totale"
            const cellaTotale = row.querySelector(".totale-riga");
            if (cellaTotale) {
                cellaTotale.innerText = totaleRiga.toFixed(2);
            }

            // Se la riga è dei Km, aggiorna anche il totale settimanale Km
            if (row.classList.contains("km-giornalieri")) {
                totaleKmSettimana += totaleRiga;
            }

            // Somma al totale generale
            totaleSettimanale += totaleRiga;
        });

        // Aggiorna i totali
        document.querySelector(".km-sett-tot").innerText = totaleKmSettimana.toFixed(2);
        document.querySelector(".totale-settimana").innerText = totaleSettimanale.toFixed(2);
    }

    // 📌 Funzione per aggiornare le differenze Km Finali - Km Iniziali
    function calcolaKmGiornalieri() {
        ["lun", "mar", "mer", "gio", "ven", "sab", "dom"].forEach(giorno => {
            const kmIni = parseFloat(document.querySelector(`td[data-cat="kmIni"][data-day="${giorno}"]`)?.innerText) || 0;
            const kmFin = parseFloat(document.querySelector(`td[data-cat="kmFin"][data-day="${giorno}"]`)?.innerText) || 0;
            const kmDiff = kmFin - kmIni;

            const cellKmDiff = document.querySelector(`td[data-cat="kmDiff"][data-day="${giorno}"]`);
            if (cellKmDiff) {
                cellKmDiff.innerText = kmDiff.toFixed(2);
            }
        });
    }

    // 📌 Evento per modificare i valori nelle celle
    tableSpese.addEventListener('input', (e) => {
        const cell = e.target;
        const valore = parseFloat(cell.innerText) || 0;
        const cat = cell.dataset.cat;
        const day = cell.dataset.day;

        if (!speseData[day]) speseData[day] = {};
        speseData[day][cat] = valore;

        calcolaKmGiornalieri();
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

        // Ripristina i valori nella tabella
        Object.keys(speseData).forEach(giorno => {
            Object.keys(speseData[giorno]).forEach(cat => {
                const cell = document.querySelector(`td[data-cat="${cat}"][data-day="${giorno}"]`);
                if (cell) cell.innerText = speseData[giorno][cat];
            });
        });

        calcolaKmGiornalieri();
        aggiornaCalcoli();
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
