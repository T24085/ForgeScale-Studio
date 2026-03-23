const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const sections = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

sections.forEach((section) => observer.observe(section));

const spotlightTargets = document.querySelectorAll(
  '.hero-copy-block, .hero-photo, .hero-logo-panel, .featured-card, .service-card, .finish-card, .stream-frame, .stream-panel, .gallery-item, .timeline article, .contact-card, .hero-metrics article, .commission-form, .level-card, .fit-card, .faq-card, .signal-card'
);

spotlightTargets.forEach((element) => {
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    element.style.setProperty('--spot-x', `${x}%`);
    element.style.setProperty('--spot-y', `${y}%`);
  });
});

const pageBackgroundVideo = document.querySelector('.page-bg-video');

if (pageBackgroundVideo instanceof HTMLVideoElement) {
  pageBackgroundVideo.muted = true;

  const tryPlayBackgroundVideo = () => {
    const playAttempt = pageBackgroundVideo.play();

    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  };

  if (pageBackgroundVideo.readyState >= 2) {
    tryPlayBackgroundVideo();
  } else {
    pageBackgroundVideo.addEventListener('loadeddata', tryPlayBackgroundVideo, { once: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      tryPlayBackgroundVideo();
    }
  });
}

const applyFormPrefillFromQuery = () => {
  const params = new URLSearchParams(window.location.search);

  if (!params.toString()) {
    return;
  }

  document.querySelectorAll('form').forEach((form) => {
    let applied = false;

    Array.from(form.elements).forEach((field) => {
      if (
        !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) ||
        !field.name ||
        !params.has(field.name)
      ) {
        return;
      }

      const value = params.get(field.name);

      if (value === null) {
        return;
      }

      field.value = value;
      applied = true;
    });

    const status = form.querySelector('.form-status');

    if (applied && status) {
      status.textContent = 'Catalog item loaded. Add your contact details and send the commission request.';
    }
  });
};

applyFormPrefillFromQuery();

const mailtoForms = document.querySelectorAll('[data-mailto-form]');

mailtoForms.forEach((form) => {
  const status = form.querySelector('.form-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      if (status) {
        status.textContent = 'Fill in the required fields first.';
      }
      return;
    }

    const recipient = form.dataset.recipient;
    const subjectPrefix = form.dataset.subjectPrefix || 'Commission Request';
    const formData = new FormData(form);
    const projectType = (formData.get('projectType') || '').toString().trim();
    const clientName = (formData.get('name') || '').toString().trim();
    const subjectParts = [subjectPrefix];

    if (projectType) {
      subjectParts.push(projectType);
    }

    if (clientName) {
      subjectParts.push(clientName);
    }

    const bodyLines = [];

    Array.from(form.elements).forEach((field) => {
      if (
        !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) ||
        !field.name
      ) {
        return;
      }

      if (field.type === 'submit' || field.type === 'button') {
        return;
      }

      if (field instanceof HTMLInputElement && field.type === 'radio' && !field.checked) {
        return;
      }

      const value = field.value.trim();

      if (!value) {
        return;
      }

      bodyLines.push(`${field.dataset.label || field.name}: ${value}`);
    });

    bodyLines.push('', 'Submitted from the ForgeScale Studio artist commission page.');

    if (status) {
      status.textContent = 'Opening your email client...';
    }

    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      subjectParts.join(' - ')
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailtoUrl;
  });
});
