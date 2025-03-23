document.addEventListener('DOMContentLoaded', () => {
  alert("✅ app.js caricato!");

  const fileInput = document.getElementById('file-input');
  const fotoBtn = document.getElementById('foto-btn');
  const zipBtn = document.getElementById('zip-btn');
  const emailBtn = document.getElementById('email-btn');
  const preview = document.getElementById('preview-immagini');

  let immagini = [];

  fotoBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        immagini.push({ name: file.name, data: reader.result });

        const div = document.createElement('div');
        div.innerHTML = `<img src='${reader.result}' style='width:100px; height:auto;'/>`;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  zipBtn.addEventListener('click', () => {
    if (immagini.length === 0) {
      alert("📸 Carica almeno un'immagine.");
      return;
    }

    const zip = new JSZip();
    immagini.forEach((img, i) => {
      const base64 = img.data.split(',')[1];
      zip.file(img.name || `immagine_${i+1}.jpg`, base64, {base64: true});
    });

    zip.generateAsync({type:"blob"}).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NotaSpese.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        const msg = `Ho compilato la nota spese.
In allegato il file ZIP con gli scontrini.`;
        navigator.clipboard.writeText(msg).then(() => {
          alert("📁 ZIP scaricato. Ora apri WhatsApp o Email e allegalo manualmente. Il messaggio è negli appunti!");
        });
      }, 1000);
    });
  });

  emailBtn.addEventListener('click', () => {
    alert("📨 Funzione email in preparazione.");
  });
});
