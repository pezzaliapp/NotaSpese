alert("✅ app.js caricato correttamente!");

document.addEventListener('DOMContentLoaded', () => {
  alert("✅ DOM pronto, script attivo");

  const salvaBtn = document.getElementById('salva-settimana');
  const zipBtn = document.getElementById('zip-btn');

  if (salvaBtn) {
    salvaBtn.addEventListener('click', () => {
      alert("Hai cliccato su SALVA SETTIMANA!");
    });
  } else {
    alert("❌ salva-settimana non trovato!");
  }

  if (zipBtn) {
    zipBtn.addEventListener('click', () => {
      alert("Hai cliccato su CREA ZIP!");
    });
  } else {
    alert("❌ zip-btn non trovato!");
  }
});
