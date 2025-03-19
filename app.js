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

    let speseData = {};

    // 📌 Funzione per aggiornare i calcoli
    function aggiornaCalcoli() {
        let totaleSettimanale = 0;
        let totaleKmSettimana = 0;

        const giorniSettimana = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

        // **Categorie di spesa**
        const categorieViaggio = ["parcheggi", "noleggio", "taxiBus", "biglietti", "carburCont", "viaggioAltro"];
        const categorieAlloggio = ["alloggio", "colazione", "pranzo", "cena", "acquaCaffe", "alloggioAltro"];
        const categorieCarburante = ["cartaEni"];

        giorniSettimana.forEach(giorno => {
            let subtotaleViaggio = 0;
            let subtotaleAlloggio = 0;
            let subtotaleCarburante = 0;

            // **Calcolo subtotali per ogni categoria**
            categorieViaggio.forEach(cat => {
                let valore = parseFloat(speseData[giorno]?.[cat]) || 0;
                subtotaleViaggio += valore;
            });

            categorieAlloggio.forEach(cat => {
                let valore = parseFloat(speseData[giorno]?.[cat]) || 0;
                subtotaleAlloggio += valore;
            });

            categorieCarburante.forEach(cat => {
                let valore = parseFloat(speseData[giorno]?.[cat]) || 0;
                subtotaleCarburante += valore;
            });

            // **Aggiorna i subtotali giornalieri nella tabella**
            document.querySelector(`td[data-cat="spViaggioDay"][data-day="${giorno}"]`).innerText = subtotaleViaggio.toFixed(2);
            document.querySelector(`td[data-cat="alloggioDay"][data-day="${giorno}"]`).innerText = subtotaleAlloggio.toFixed(2);
            document.querySelector(`td[data-cat="carbEniDay"][data-day="${giorno}"]`).innerText = subtotaleCarburante.toFixed(2);

            // **Aggiunge i subtotali al totale settimanale**
            totaleSettimanale += subtotaleViaggio + subtotaleAlloggio + subtotaleCarburante;
        });

        // **Calcolo Totale Km Settimana**
        giorniSettimana.forEach(giorno => {
            let kmIni = parseFloat(speseData[giorno]?.kmIni) || 0;
            let kmFin = parseFloat(speseData[giorno]?.kmFin) || 0;
            let kmDiff = kmFin - kmIni;

            speseData[giorno].kmDiff = kmDiff;
            totaleKmSettimana += kmDiff;

            // **Aggiorna il valore della differenza Km**
            document.querySelector(`td[data-cat="kmDiff"][data-day="${giorno}"]`).innerText = kmDiff.toFixed(2);
        });

        // **Aggiorna i totali nella tabella**
        document.querySelector(".km-sett-tot").innerText = totaleKmSettimana.toFixed(2);
        document.querySelector(".totale-settimana").innerText = totaleSettimanale.toFixed(2);
    }

    // 📌 Evento per modificare i valori nelle celle
    tableSpese.addEventListener('input', (e) => {
        const cell = e.target;
        const valore = parseFloat(cell.innerText) || 0;
        const cat = cell.dataset.cat;
        const day = cell.dataset.day;

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

        // **Ripristina i valori nella tabella**
        Object.keys(speseData).forEach(giorno => {
            Object.keys(speseData[giorno]).forEach(cat => {
                const cell = document.querySelector(`td[data-cat="${cat}"][data-day="${giorno}"]`);
                if (cell) cell.innerText = speseData[giorno][cat];
            });
        });

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

    aggiornaCalcoli();
});
