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

const quoteForm = document.querySelector('[data-quote-form]');

if (quoteForm instanceof HTMLFormElement) {
  const fileInput = quoteForm.querySelector('input[name="files"]');
  const fileChipList = document.querySelector('#file-chip-list');
  const status = quoteForm.querySelector('.form-status');
  const priceRange = document.querySelector('#quote-price-range');
  const leadTime = document.querySelector('#quote-lead-time');
  const modelMetrics = document.querySelector('#quote-model-metrics');
  const materialUsage = document.querySelector('#quote-material-usage');
  const materialNote = document.querySelector('#quote-material-note');
  const breakdown = document.querySelector('#quote-breakdown');
  const geometryState = {
    files: [],
    loading: false,
  };

  const quoteFactors = {
    targetMargin: 0.5,
    material: {
      pla: {
        label: 'Ender 3 V3 Pro PLA pricing',
        density: 1.24,
        costPerGram: 0.024,
        flowCm3PerHour: 8.5,
        machineRate: 1.05,
        fillFloor: 0.16,
      },
    },
    quality: {
      draft: { time: 0.82, label: 'Draft quality' },
      standard: { time: 1, label: 'Standard quality' },
      fine: { time: 1.24, label: 'Fine detail quality' },
      presentation: { time: 1.55, label: 'Presentation quality' },
    },
    buildStyle: {
      basic: { fill: 0.18, label: 'Basic everyday print' },
      balanced: { fill: 0.26, label: 'Balanced strength build' },
      strong: { fill: 0.4, label: 'Higher strength build' },
      solid: { fill: 0.9, label: 'Nearly solid build' },
    },
    finish: {
      raw: { add: 0, leadDays: 0, label: 'Raw print only' },
      cleanup: { add: 2, leadDays: 1, label: 'Support removal and cleanup' },
      sanded: { add: 5, leadDays: 2, label: 'Sanded surface prep' },
      primed: { add: 9, leadDays: 2, label: 'Primed for paint' },
      painted: { add: 28, leadDays: 4, label: 'Painted display finish' },
    },
    turnaround: {
      standard: { multiplier: 1, baseDays: [3, 5], label: 'Standard schedule' },
      priority: { multiplier: 1.08, baseDays: [2, 4], label: 'Priority queue' },
      rush: { multiplier: 1.16, baseDays: [1, 3], label: 'Rush production' },
    },
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 10 ? 2 : 0 }).format(value);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, decimals = 1) => Number(value.toFixed(decimals));

  const formatDimensions = (bounds) => `${round(bounds.x)} x ${round(bounds.y)} x ${round(bounds.z)} mm`;

  const getSelectedFiles = () =>
    fileInput instanceof HTMLInputElement && fileInput.files ? Array.from(fileInput.files) : [];

  const renderFileChips = () => {
    if (!fileChipList) {
      return;
    }

    const files = getSelectedFiles();

    if (!files.length) {
      fileChipList.innerHTML = '<p class="empty-files">No STL files selected yet.</p>';
      return;
    }

    fileChipList.innerHTML = files
      .map((file) => {
        const sizeLabel = `${(file.size / (1024 * 1024)).toFixed(file.size >= 10 * 1024 * 1024 ? 1 : 2)} MB`;
        return `<span class="file-chip">${file.name}<strong>${sizeLabel}</strong></span>`;
      })
      .join('');
  };

  const isBinaryStl = (buffer) => {
    if (buffer.byteLength < 84) {
      return false;
    }

    const expectedSize = 84 + new DataView(buffer).getUint32(80, true) * 50;

    if (expectedSize === buffer.byteLength) {
      return true;
    }

    const header = new TextDecoder().decode(buffer.slice(0, Math.min(256, buffer.byteLength)));
    return !header.trimStart().startsWith('solid');
  };

  const accumulateTriangle = (v0, v1, v2, stats) => {
    stats.minX = Math.min(stats.minX, v0[0], v1[0], v2[0]);
    stats.minY = Math.min(stats.minY, v0[1], v1[1], v2[1]);
    stats.minZ = Math.min(stats.minZ, v0[2], v1[2], v2[2]);
    stats.maxX = Math.max(stats.maxX, v0[0], v1[0], v2[0]);
    stats.maxY = Math.max(stats.maxY, v0[1], v1[1], v2[1]);
    stats.maxZ = Math.max(stats.maxZ, v0[2], v1[2], v2[2]);

    const crossX = v1[1] * v2[2] - v1[2] * v2[1];
    const crossY = v1[2] * v2[0] - v1[0] * v2[2];
    const crossZ = v1[0] * v2[1] - v1[1] * v2[0];

    stats.signedVolume += (v0[0] * crossX + v0[1] * crossY + v0[2] * crossZ) / 6;
    stats.triangles += 1;
  };

  const finalizeStats = (file, stats) => ({
    name: file.name,
    sizeBytes: file.size,
    triangles: stats.triangles,
    volumeMm3: Math.abs(stats.signedVolume),
    bounds: {
      x: Math.max(0, stats.maxX - stats.minX),
      y: Math.max(0, stats.maxY - stats.minY),
      z: Math.max(0, stats.maxZ - stats.minZ),
    },
  });

  const parseBinaryStl = (buffer, file) => {
    const view = new DataView(buffer);
    const triangleCount = view.getUint32(80, true);
    const stats = {
      triangles: 0,
      signedVolume: 0,
      minX: Infinity,
      minY: Infinity,
      minZ: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      maxZ: -Infinity,
    };

    for (let index = 0; index < triangleCount; index += 1) {
      const offset = 84 + index * 50 + 12;
      const v0 = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
      const v1 = [view.getFloat32(offset + 12, true), view.getFloat32(offset + 16, true), view.getFloat32(offset + 20, true)];
      const v2 = [view.getFloat32(offset + 24, true), view.getFloat32(offset + 28, true), view.getFloat32(offset + 32, true)];
      accumulateTriangle(v0, v1, v2, stats);
    }

    return finalizeStats(file, stats);
  };

  const parseAsciiStl = (buffer, file) => {
    const text = new TextDecoder().decode(buffer);
    const vertexMatches = text.match(/vertex\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g);

    if (!vertexMatches || vertexMatches.length < 3) {
      throw new Error(`Could not read STL geometry from ${file.name}.`);
    }

    const stats = {
      triangles: 0,
      signedVolume: 0,
      minX: Infinity,
      minY: Infinity,
      minZ: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      maxZ: -Infinity,
    };

    const vertices = vertexMatches.map((line) => {
      const parts = line.trim().split(/\s+/);
      return [Number(parts[1]), Number(parts[2]), Number(parts[3])];
    });

    for (let index = 0; index <= vertices.length - 3; index += 3) {
      accumulateTriangle(vertices[index], vertices[index + 1], vertices[index + 2], stats);
    }

    return finalizeStats(file, stats);
  };

  const parseStlFile = async (file) => {
    const buffer = await file.arrayBuffer();
    return isBinaryStl(buffer) ? parseBinaryStl(buffer, file) : parseAsciiStl(buffer, file);
  };

  const updateQuoteStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const analyzeSelectedFiles = async () => {
    const files = getSelectedFiles();

    geometryState.files = [];

    if (!files.length) {
      updateQuoteStatus('');
      syncQuoteSummary();
      return;
    }

    geometryState.loading = true;
    updateQuoteStatus('Analyzing STL geometry...');

    try {
      geometryState.files = await Promise.all(files.map((file) => parseStlFile(file)));
      updateQuoteStatus('STL geometry analyzed. Review the live estimate below.');
    } catch (error) {
      geometryState.files = [];
      updateQuoteStatus(error instanceof Error ? error.message : 'Could not analyze the STL files.');
    } finally {
      geometryState.loading = false;
      syncQuoteSummary();
    }
  };

  const calculateQuote = () => {
    const formData = new FormData(quoteForm);
    const quantity = Math.max(1, Number(formData.get('quantity')) || 1);
    const scalePercent = clamp(Number(formData.get('scalePercent')) || 100, 25, 400);
    const scaleMultiplier = scalePercent / 100;
    const materialKey = (formData.get('material') || 'pla').toString();
    const qualityKey = (formData.get('quality') || 'standard').toString();
    const buildStyleKey = (formData.get('buildStyle') || 'basic').toString();
    const finishKey = (formData.get('finish') || 'raw').toString();
    const turnaroundKey = (formData.get('turnaround') || 'standard').toString();

    const material = quoteFactors.material[materialKey] || quoteFactors.material.pla;
    const quality = quoteFactors.quality[qualityKey] || quoteFactors.quality.standard;
    const buildStyle = quoteFactors.buildStyle[buildStyleKey] || quoteFactors.buildStyle.basic;
    const finish = quoteFactors.finish[finishKey] || quoteFactors.finish.raw;
    const turnaround = quoteFactors.turnaround[turnaroundKey] || quoteFactors.turnaround.standard;

    const scaledFiles = geometryState.files.map((file) => {
      const scaleVolume = Math.pow(scaleMultiplier, 3);
      return {
        ...file,
        bounds: {
          x: file.bounds.x * scaleMultiplier,
          y: file.bounds.y * scaleMultiplier,
          z: file.bounds.z * scaleMultiplier,
        },
        volumeMm3: file.volumeMm3 * scaleVolume,
      };
    });

    const totalSolidVolumeCm3 = scaledFiles.reduce((sum, file) => sum + file.volumeMm3 / 1000, 0);
    const totalTriangles = scaledFiles.reduce((sum, file) => sum + file.triangles, 0);
    const maxBounds = scaledFiles.reduce(
      (accumulator, file) => ({
        x: Math.max(accumulator.x, file.bounds.x),
        y: Math.max(accumulator.y, file.bounds.y),
        z: Math.max(accumulator.z, file.bounds.z),
      }),
      { x: 0, y: 0, z: 0 }
    );

    const fillRatio = Math.max(buildStyle.fill, material.fillFloor);
    const effectiveVolumeCm3 = totalSolidVolumeCm3 * fillRatio;
    const gramsPerSet = effectiveVolumeCm3 * material.density;
    const materialCostPerSet = gramsPerSet * material.costPerGram;
    const complexityFactor = clamp(1 + Math.log10(Math.max(1, totalTriangles) / 5000 + 1) * 0.16, 1, 1.32);
    const machineHoursPerSet =
      totalSolidVolumeCm3 > 0
        ? (effectiveVolumeCm3 / material.flowCm3PerHour) * quality.time * complexityFactor + maxBounds.z / 180
        : 0;
    const machineCostPerSet = machineHoursPerSet * material.machineRate;
    const handlingPerSet = 1.2 + scaledFiles.length * 0.45;
    const finishingPerSet = finish.add;
    const subtotal =
      quantity *
      (materialCostPerSet + machineCostPerSet + handlingPerSet + finishingPerSet);
    const adjustedSubtotal = subtotal * turnaround.multiplier;
    const pricedAtMargin = adjustedSubtotal / (1 - quoteFactors.targetMargin);
    const low = totalSolidVolumeCm3 > 0 ? Math.max(6, round(pricedAtMargin, 2)) : 0;
    const high = totalSolidVolumeCm3 > 0 ? Math.max(low + 1.5, round(pricedAtMargin * 1.08, 2)) : 0;
    const leadMin =
      turnaround.baseDays[0] + finish.leadDays + (quantity >= 10 ? 2 : quantity >= 4 ? 1 : 0) + (scaledFiles.length >= 4 ? 1 : 0);
    const leadMax =
      turnaround.baseDays[1] + finish.leadDays + (quantity >= 10 ? 3 : quantity >= 4 ? 1 : 0) + (scaledFiles.length >= 4 ? 1 : 0);

    return {
      low,
      high,
      maxBounds,
      gramsPerSet,
      totalSolidVolumeCm3,
      effectiveVolumeCm3,
      machineHoursPerSet,
      totalTriangles,
      baseCost: adjustedSubtotal,
      leadMin,
      leadMax,
      materialLabel: material.label,
      qualityLabel: quality.label,
      buildLabel: buildStyle.label,
      finishLabel: finish.label,
      turnaroundLabel: turnaround.label,
      scalePercent,
      quantity,
      fileCount: scaledFiles.length,
      hasGeometry: totalSolidVolumeCm3 > 0,
      summary: `${scaledFiles.length} STL file${scaledFiles.length === 1 ? '' : 's'} at ${scalePercent}% scale, quantity ${quantity}`,
    };
  };

  const syncQuoteSummary = () => {
    const quote = calculateQuote();

    if (priceRange) {
      priceRange.textContent = quote.hasGeometry ? `${formatCurrency(quote.low)} - ${formatCurrency(quote.high)}` : 'Upload STL files';
    }

    if (leadTime) {
      leadTime.textContent = quote.hasGeometry ? `${quote.leadMin} to ${quote.leadMax} business days` : 'Waiting for STL analysis';
    }

    if (modelMetrics) {
      modelMetrics.textContent = quote.hasGeometry
        ? `${formatDimensions(quote.maxBounds)} max • ${round(quote.totalSolidVolumeCm3, 2)} cm3 solid`
        : geometryState.loading
          ? 'Analyzing STL geometry'
          : 'Upload STL files';
    }

    if (materialUsage) {
      materialUsage.textContent = quote.hasGeometry
        ? `${round(quote.gramsPerSet, 1)} g each • ${round(quote.machineHoursPerSet, 1)} hr each`
        : 'Waiting for STL analysis';
    }

    if (materialNote) {
      materialNote.textContent = quote.hasGeometry ? quote.materialLabel : 'STL-based planning estimate';
    }

    if (breakdown) {
      breakdown.textContent = quote.hasGeometry
        ? `${quote.summary}. ${quote.qualityLabel}. ${quote.buildLabel}. ${quote.finishLabel}. ${quote.turnaroundLabel}. Pricing is based on real STL volume and bounds, then priced to keep at least a 50% gross margin over estimated internal cost.`
        : 'Upload STL files to calculate actual mesh volume and bounding size before the pricing summary is generated.';
    }
  };

  renderFileChips();
  syncQuoteSummary();

  quoteForm.addEventListener('input', syncQuoteSummary);
  quoteForm.addEventListener('change', () => {
    renderFileChips();
    syncQuoteSummary();
  });

  if (fileInput instanceof HTMLInputElement) {
    fileInput.addEventListener('change', () => {
      analyzeSelectedFiles();
    });
  }

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!quoteForm.reportValidity()) {
      updateQuoteStatus('Fill in the required fields first.');
      return;
    }

    if (geometryState.loading) {
      updateQuoteStatus('Wait for STL analysis to finish first.');
      return;
    }

    const quote = calculateQuote();

    if (!quote.hasGeometry) {
      updateQuoteStatus('Upload valid STL files before requesting the final quote review.');
      return;
    }

    const formData = new FormData(quoteForm);
    const recipient = quoteForm.dataset.recipient || 'christoffersent@gmail.com';
    const clientName = (formData.get('name') || '').toString().trim();
    const fileLines = geometryState.files.length
      ? geometryState.files.map(
          (file) =>
            `${file.name} | ${formatDimensions({
              x: file.bounds.x * (quote.scalePercent / 100),
              y: file.bounds.y * (quote.scalePercent / 100),
              z: file.bounds.z * (quote.scalePercent / 100),
            })} | ${round((file.volumeMm3 * Math.pow(quote.scalePercent / 100, 3)) / 1000, 2)} cm3`
        )
      : ['No STL files attached in browser'];
    const bodyLines = [];

    Array.from(quoteForm.elements).forEach((field) => {
      if (
        !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) ||
        !field.name ||
        field.type === 'submit' ||
        field.type === 'button' ||
        field.type === 'file'
      ) {
        return;
      }

      const value = field.value.trim();

      if (!value) {
        return;
      }

      bodyLines.push(`${field.dataset.label || field.name}: ${value}`);
    });

    bodyLines.push('');
    bodyLines.push(`Estimated internal cost: ${formatCurrency(quote.baseCost)}`);
    bodyLines.push(`Estimated range: ${formatCurrency(quote.low)} - ${formatCurrency(quote.high)}`);
    bodyLines.push(`Estimated lead time: ${quote.leadMin} to ${quote.leadMax} business days`);
    bodyLines.push(`Max model bounds: ${formatDimensions(quote.maxBounds)}`);
    bodyLines.push(`Solid model volume per set: ${round(quote.totalSolidVolumeCm3, 2)} cm3`);
    bodyLines.push(`Estimated material usage per set: ${round(quote.gramsPerSet, 1)} g`);
    bodyLines.push(`Estimated machine time per set: ${round(quote.machineHoursPerSet, 1)} hours`);
    bodyLines.push(`Triangle count: ${quote.totalTriangles}`);
    bodyLines.push('');
    bodyLines.push('Selected STL files:');
    fileLines.forEach((line) => bodyLines.push(`- ${line}`));
    bodyLines.push('');
    bodyLines.push('Please attach the STL files directly to this email for final geometry review.');
    bodyLines.push('Submitted from the ForgeScale STL Quote Desk.');

    updateQuoteStatus('Opening your email client...');

    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      `ForgeScale STL Quote Request${clientName ? ` - ${clientName}` : ''}`
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailtoUrl;
  });
}

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
