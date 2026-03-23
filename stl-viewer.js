(function () {
  const viewer = document.querySelector('#stl-viewer');
  const title = document.querySelector('#stl-viewer-title');
  const meta = document.querySelector('#stl-viewer-meta');
  const modelButtons = document.querySelectorAll('[data-preview-key]');
  const previews = window.STL_PREVIEWS;

  if (!viewer || !title || !meta || !modelButtons.length || !window.THREE || !previews) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, viewer.clientWidth / viewer.clientHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const target = new THREE.Vector3(0, 0, 0);
  const pointer = {
    active: false,
    x: 0,
    y: 0,
  };

  let currentMesh = null;
  let radius = 180;
  let theta = 0.7;
  let phi = 1.1;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(viewer.clientWidth, viewer.clientHeight);
  viewer.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 1.3);
  const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.75);
  const rimLight = new THREE.DirectionalLight(0x8bb7ff, 1.1);
  const fillLight = new THREE.HemisphereLight(0xffd9a3, 0x120c20, 0.95);
  const grid = new THREE.GridHelper(220, 14, 0xffb84d, 0x5d4567);

  keyLight.position.set(120, 160, 90);
  rimLight.position.set(-80, 60, -110);
  grid.position.y = -54;

  scene.add(ambient, keyLight, rimLight, fillLight, grid);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateCamera() {
    const sinPhi = Math.sin(phi);
    camera.position.set(
      target.x + radius * sinPhi * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * sinPhi * Math.cos(theta)
    );
    camera.lookAt(target);
  }

  function setActiveButton(nextButton) {
    const activeKey = nextButton.dataset.previewKey;
    modelButtons.forEach((button) => button.classList.toggle('active', button.dataset.previewKey === activeKey));
  }

  function updateMeta(nextTitle, nextMeta) {
    title.textContent = nextTitle;
    meta.textContent = nextMeta;
  }

  function disposeCurrentMesh() {
    if (!currentMesh) {
      return;
    }

    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    scene.remove(currentMesh);
    currentMesh = null;
  }

  function loadPreview(button) {
    const key = button.dataset.previewKey;
    const preview = previews[key];

    if (!preview || !preview.positions || !preview.positions.length) {
      updateMeta('Preview unavailable', 'This local preview could not be loaded.');
      return;
    }

    const modelTitle = button.dataset.modelTitle || 'STL Preview';
    const modelMeta = button.dataset.modelMeta || 'Interactive local model preview.';

    setActiveButton(button);
    disposeCurrentMesh();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(preview.positions, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.center();

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xf1d9af,
        metalness: 0.08,
        roughness: 0.82,
        side: THREE.DoubleSide,
      })
    );

    mesh.rotation.x = -Math.PI / 2;

    const bounds = preview.bounds || [100, 100, 100];
    const maxDim = Math.max(bounds[0], bounds[1], bounds[2]) || 1;
    const scale = 120 / maxDim;
    mesh.scale.setScalar(scale);

    scene.add(mesh);
    currentMesh = mesh;

    radius = clamp(180 * Math.max(0.7, maxDim / 180), 110, 260);
    theta = 0.7;
    phi = 1.1;
    updateCamera();

    const previewNote =
      preview.step && preview.step > 1
        ? `${modelMeta} Interactive preview uses a lighter local mesh for direct file viewing.`
        : modelMeta;

    updateMeta(modelTitle, previewNote);
  }

  viewer.addEventListener('pointerdown', (event) => {
    pointer.active = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    viewer.setPointerCapture(event.pointerId);
  });

  viewer.addEventListener('pointermove', (event) => {
    if (!pointer.active) {
      return;
    }

    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;

    pointer.x = event.clientX;
    pointer.y = event.clientY;

    theta -= deltaX * 0.01;
    phi = clamp(phi + deltaY * 0.01, 0.2, Math.PI - 0.2);
    updateCamera();
  });

  function releasePointer(event) {
    if (!pointer.active) {
      return;
    }

    pointer.active = false;
    try {
      viewer.releasePointerCapture(event.pointerId);
    } catch (error) {
      // No action needed if the pointer capture is already released.
    }
  }

  viewer.addEventListener('pointerup', releasePointer);
  viewer.addEventListener('pointerleave', releasePointer);
  viewer.addEventListener('wheel', (event) => {
    event.preventDefault();
    radius = clamp(radius + event.deltaY * 0.08, 60, 320);
    updateCamera();
  });

  modelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      loadPreview(button);
      viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (!width || !height) {
        continue;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      updateCamera();
    }
  });

  resizeObserver.observe(viewer);

  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
  updateCamera();
  loadPreview(modelButtons[0]);
})();
