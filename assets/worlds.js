(() => {
  const worldNavigation = document.querySelector('.world-nav');
  const currentWorld = worldNavigation?.querySelector('[aria-current="page"]');
  const keepCurrentWorldVisible = () => {
    if (!currentWorld || worldNavigation.scrollWidth <= worldNavigation.clientWidth) return;
    const navigationRect = worldNavigation.getBoundingClientRect();
    const currentRect = currentWorld.getBoundingClientRect();
    worldNavigation.scrollLeft += currentRect.left - navigationRect.left - (worldNavigation.clientWidth - currentRect.width) / 2;
  };
  requestAnimationFrame(keepCurrentWorldVisible);
  window.addEventListener('resize', () => requestAnimationFrame(keepCurrentWorldVisible));

  const pictures = [...document.querySelectorAll('[data-gallery-photo]')];
  const dialog = document.getElementById('photo-lightbox');
  let activePicture = 0;
  let previousFocus = null;

  function showPicture(index) {
    activePicture = (index + pictures.length) % pictures.length;
    const source = pictures[activePicture];
    const image = document.getElementById('lightbox-image');
    image.src = source.dataset.photoSrc;
    image.alt = source.querySelector('img').alt;
    document.getElementById('lightbox-caption').textContent = source.dataset.photoCaption;
    document.getElementById('lightbox-counter').textContent = `${String(activePicture + 1).padStart(2, '0')} / ${String(pictures.length).padStart(2, '0')}`;
  }

  function closePictures() {
    if (!dialog?.open) return;
    dialog.close();
  }

  if (dialog && pictures.length) {
    pictures.forEach((button, index) => {
      button.addEventListener('click', () => {
        previousFocus = button;
        showPicture(index);
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        dialog.querySelector('[data-lightbox-close]').focus();
      });
    });
    dialog.querySelector('[data-lightbox-close]').addEventListener('click', closePictures);
    dialog.querySelector('[data-lightbox-previous]').addEventListener('click', () => showPicture(activePicture - 1));
    dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => showPicture(activePicture + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePictures();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPicture(activePicture - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showPicture(activePicture + 1);
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.classList.contains('lightbox-content')) closePictures();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      previousFocus?.focus();
    });
  }

  const copyButton = document.querySelector('[data-copy-email]');
  if (copyButton) {
    const label = copyButton.querySelector('[data-copy-label]');
    const status = document.getElementById('copy-status');
    let resetLabel;
    const fallbackCopy = text => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.readOnly = true;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      try {
        return document.execCommand('copy');
      } finally {
        textarea.remove();
      }
    };
    copyButton.addEventListener('click', async () => {
      copyButton.disabled = true;
      clearTimeout(resetLabel);
      const email = copyButton.dataset.copyEmail;
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch {}
      if (!copied) {
        try { copied = fallbackCopy(email); } catch {}
      }
      copyButton.disabled = false;
      copyButton.focus();
      label.textContent = copied ? '已复制' : '复制邮箱';
      status.textContent = copied ? '邮箱已复制，可以粘贴到邮件应用。' : '请选中上方邮箱地址，手动复制。';
      resetLabel = setTimeout(() => { label.textContent = '复制邮箱'; }, 2200);
    });
  }
})();
