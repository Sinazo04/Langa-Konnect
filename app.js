// Langa Konnect - client-only demo logic using localStorage
(() => {
  // Keys
  const USERS_KEY = 'lk_users';
  const CURRENT_KEY = 'lk_currentUser';
  const BIZ_KEY = 'lk_businesses';
  const EVENTS_KEY = 'lk_events';
  const ORG_ID = 'org-just-grace';

  // Elements
  const authModal = id('authModal');
  const addBusinessModal = id('addBusinessModal');
  const addEventModal = id('addEventModal');
  const bizDetailModal = id('bizDetailModal');
  const currentUserName = id('currentUserName');

  // state
  let users = loadJSON(USERS_KEY) || {};
  let currentUser = loadJSON(CURRENT_KEY) || null;
  let businesses = loadJSON(BIZ_KEY) || [];
  let events = loadJSON(EVENTS_KEY) || [];
  let orgReviews = businesses.find(b => b.id === ORG_ID)?.reviews || [];

  // Payments / Stripe checkout configuration
  const CREATE_CHECKOUT_URL = 'https://zoxowkbyqcuakrexiibr.functions.supabase.co/create-checkout-edge';
  const PRICES = {
    basic: { monthly: 'price_1SnEKQJvD9m662O4iHtMCirI', yearly: 'price_1SnEKRJvD9m662O4wziTyWvJ' },
    pro: { monthly: 'price_1SnEKSJvD9m662O4cNJDzwer', yearly: 'price_1SnEKSJvD9m662O4krntC9nP' }
  };

  // helpers
  function id(i) { return document.getElementById(i); }
  function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
  function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid(prefix='id') { return prefix + '_' + Math.random().toString(36).slice(2,9); }

  // View management
  window.showView = (viewId) => {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.add('hidden'));
    const targetView = id(viewId);
    if (targetView) {
      targetView.classList.remove('hidden');
      // Trigger render functions based on view
      if (viewId === 'eventsView') renderEvents();
      else if (viewId === 'organisationsView') renderOrganisations();
      else if (viewId === 'businessesView') renderBusinessGrid();
      else if (viewId === 'sportsView') renderSports();
      else if (viewId === 'footballView') renderFootball();
      else if (viewId === 'vendorsView') renderVendors();
      else if (viewId === 'communityView') renderCommunity();
    }
  }

  // Auth
  window.toggleAuthModal = (show = true) => { authModal.classList.toggle('hidden', !show); }
  window.switchAuthMode = () => {
    const title = id('authTitle');
    const switchText = id('authSwitchText');
    const switchBtn = id('authSwitchBtn');
    const registerFields = id('registerFields');
    if (title.textContent === 'Login') {
      title.textContent = 'Register';
      switchText.textContent = 'Already have an account?';
      switchBtn.textContent = 'Login';
      registerFields.classList.remove('hidden');
    } else {
      title.textContent = 'Login';
      switchText.textContent = "Don't have an account?";
      switchBtn.textContent = 'Register';
      registerFields.classList.add('hidden');
    }
  }
  window.handleAuth = (e) => {
    e.preventDefault();
    const email = id('authEmail').value.trim().toLowerCase();
    const pass = id('authPassword').value;
    const title = id('authTitle').textContent;
    if (title === 'Register') {
      const name = id('authName').value.trim();
      if (!name) return alert('Please enter your name');
      if (users[email]) return alert('User already exists');
      users[email] = { email, password: pass, name };
      saveJSON(USERS_KEY, users);
      alert('Registration successful! You can now login.');
      switchAuthMode();
      return false;
    } else {
      const user = users[email];
      if (!user || user.password !== pass) return alert('Invalid credentials');
      currentUser = user;
      saveJSON(CURRENT_KEY, currentUser);
      toggleAuthModal(false);
      updateAuthUI();
      alert('Welcome, ' + user.name);
      return false;
    }
  }
  window.logout = () => {
    currentUser = null;
    localStorage.removeItem(CURRENT_KEY);
    updateAuthUI();
  }

  function updateAuthUI() {
    if (currentUser) {
      currentUserName.textContent = currentUser.name;
      id('loginBtn').classList.add('hidden');
      id('logoutBtn').classList.remove('hidden');
      id('addBusinessBtn').classList.remove('hidden');
      id('addEventBtn').classList.remove('hidden');
      id('mobileAddBusinessBtn')?.classList?.remove('hidden');
    } else {
      currentUserName.textContent = 'Guest';
      id('loginBtn').classList.remove('hidden');
      id('logoutBtn').classList.add('hidden');
      id('addBusinessBtn').classList.add('hidden');
      id('addEventBtn').classList.add('hidden');
      id('mobileAddBusinessBtn')?.classList?.add('hidden');
    }
  }

  // Photo gallery modal
  window.togglePhotoModal = (show = true) => { id('photoModal').classList.toggle('hidden', !show); }
  window.openPhotoGallery = (bizId) => {
    const biz = businesses.find(b => b.id === bizId);
    if (!biz || !biz.image) return alert('No photo available for this location');
    const modal = id('photoModal');
    const modalImage = id('modalImage');
    const modalCaption = id('modalCaption');
    modalImage.src = biz.image;
    modalImage.alt = biz.name;
    modalCaption.textContent = biz.name;
    togglePhotoModal(true);
  }

  // Subscribe modal controls
  window.toggleSubscribeModal = (show = true) => { id('subscribeModal').classList.toggle('hidden', !show); }
  window.openSubscribeModal = () => {
    const emailInput = id('subscribeEmail');
    emailInput.value = (currentUser && currentUser.email) || '';
    toggleSubscribeModal(true);
  }

  // Featured listing purchase (one-off)
  const CREATE_FEATURED_URL = 'https://zoxowkbyqcuakrexiibr.functions.supabase.co/create-featured-checkout-edge';
  const FEATURE_AMOUNTS = { basic: 9900, premium: 29900 }; // in cents (ZAR * 100)

  window.toggleFeatureModal = (show = true) => { id('featureModal').classList.toggle('hidden', !show); }
  window.openFeatureModal = (bizId, bizName) => {
    if (!currentUser) { toggleAuthModal(true); return; }
    id('featureBizId').value = bizId;
    const title = id('featureTitle');
    title.textContent = `Feature: ${bizName}`;
    id('featureEmail').value = (currentUser && currentUser.email) || '';
    toggleFeatureModal(true);
  }

  window.handleFeaturePurchase = async (e) => {
    e.preventDefault();
    const option = document.querySelector('input[name="featureOption"]:checked').value;
    const method = document.querySelector('input[name="featureMethod"]:checked').value;
    const email = id('featureEmail').value.trim() || (currentUser && currentUser.email) || '';
    const bizId = id('featureBizId').value;
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return alert('Business not found');
    const amount = FEATURE_AMOUNTS[option];
    const submitBtn = id('featureSubmit');
    submitBtn.disabled = true; submitBtn.textContent = 'Processing...';
    try {
      if (method === 'stripe') {
        const resp = await fetch(CREATE_FEATURED_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency: 'zar', name: `Feature: ${biz.name} (${option})`, successUrl: window.location.origin + '/?featured=success', cancelUrl: window.location.origin + '/?featured=cancel', customerEmail: email })
        });
        const data = await resp.json();
        if (resp.ok && data.url) window.location = data.url;
        else { console.error('Featured checkout error', data); alert('Could not create payment session.'); }
      } else {
        alert('PayPal coming soon — use Stripe for now.');
      }
    } catch (err) {
      console.error('Featured purchase failed', err);
      alert('Purchase failed. See console for details.');
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = 'Purchase Feature';
    }
    return false;
  }

  window.handleSubscribe = async (e) => {
    e.preventDefault();
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const interval = document.querySelector('input[name="interval"]:checked').value;
    const email = id('subscribeEmail').value.trim() || (currentUser && currentUser.email) || '';
    const priceId = PRICES[plan] && PRICES[plan][interval];
    if (!priceId) return alert('Invalid plan selection');
    const submitBtn = id('subscribeSubmit');
    submitBtn.disabled = true; submitBtn.textContent = 'Redirecting...';
    try {
      const resp = await fetch(CREATE_CHECKOUT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, successUrl: window.location.origin + '/?checkout=success', cancelUrl: window.location.origin + '/?checkout=cancel', customerEmail: email })
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        window.location = data.url;
      } else {
        console.error('Checkout error', data);
        alert('Could not create checkout session. Check console for details.');
      }
    } catch (err) {
      console.error('Checkout request failed', err);
      alert('Checkout request failed. Check console for details.');
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = 'Subscribe';
    }
    return false;
  }

  // Businesses
  window.toggleAddBusiness = (show = true) => { addBusinessModal.classList.toggle('hidden', !show); }
  window.handleAddBusiness = (e) => {
    e.preventDefault();
    if (!currentUser) { toggleAuthModal(true); return false; }
    const editingId = id('editingBizId').value || '';
    const name = id('bizName').value.trim();
    const category = id('bizCategory').value;
    const description = id('bizDescription').value.trim();
    const contact = id('bizContact').value.trim();
    const location = id('bizLocation').value.trim();
    const fileInput = id('bizImage');
    if (!name) return alert('Enter a business name');

    const applyWithImage = (imageData) => {
      if (editingId) {
        const idx = businesses.findIndex(b => b.id === editingId);
        if (idx === -1) return alert('Business not found');
        const biz = businesses[idx];
        if (biz.owner !== currentUser.email) return alert('You are not allowed to edit this business');
        biz.name = name; biz.category = category; biz.description = description; biz.contact = contact; biz.location = location;
        if (imageData) biz.image = imageData;
        businesses[idx] = biz;
        saveJSON(BIZ_KEY, businesses);
        toggleAddBusiness(false);
        id('addBusinessForm').reset();
        id('editingBizId').value = '';
        id('authTitle')?.focus && id('authTitle').focus();
        renderBusinessGrid(); renderMyBusinesses();
        alert('Business updated');
        return;
      }
      const newBiz = {
        id: uid('biz'),
        name, category, description, contact, location,
        owner: currentUser.email,
        createdAt: Date.now(),
        reviews: [],
        image: imageData || ''
      };
      businesses.unshift(newBiz);
      saveJSON(BIZ_KEY, businesses);
      toggleAddBusiness(false);
      id('addBusinessForm').reset();
      renderBusinessGrid(); renderMyBusinesses();
      alert('Business added. Thank you!');
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      readFileAsDataURL(fileInput.files[0]).then(data => applyWithImage(data)).catch(() => applyWithImage(''));
    } else {
      applyWithImage('');
    }
    return false;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // Business detail / reviews
  window.toggleBizDetail = (show = true) => { bizDetailModal.classList.toggle('hidden', !show); }
  function openBizDetail(bizId) {
    const biz = businesses.find(b => b.id === bizId) || (bizId === ORG_ID && getOrganisation());
    const container = id('bizDetailContent');
    if (!biz) return;
    const avg = getAverageRating(biz.reviews);
    container.innerHTML = `
      <h2 class="text-2xl font-bold">${escapeHtml(biz.name)}</h2>
      <div class="text-sm text-gray-600">${escapeHtml(biz.category || 'Organisation')} • ${escapeHtml(biz.location || '')}</div>
      <p class="mt-3 text-gray-700">${escapeHtml(biz.description || '')}</p>
      <div class="mt-4 flex items-center gap-3">
        <div class="font-semibold">Rating: ${avg.toFixed(1)} / 5</div>
        <div class="text-sm text-gray-600">(${biz.reviews.length} reviews)</div>
      </div>
      <hr class="my-4" />
      <div id="reviewsList">
        ${biz.reviews.map(r => `
          <div class="mb-3 border-b pb-2">
            <div class="flex justify-between items-center"><strong>${escapeHtml(r.name)}</strong><div class="text-sm text-yellow-600">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div></div>
            <div class="text-sm text-gray-600">${new Date(r.date).toLocaleString()}</div>
            <p class="mt-1">${escapeHtml(r.comment)}</p>
          </div>
        `).join('')}
      </div>
      <div class="mt-4">
        <h4 class="font-semibold">Leave a review</h4>
        <div class="mt-2">
          <select id="reviewRating" class="px-3 py-2 border rounded">
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Very Good</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </div>
        <div class="mt-2">
          <textarea id="reviewComment" rows="3" class="w-full border rounded px-3 py-2" placeholder="Share your experience"></textarea>
        </div>
        <div class="mt-3 text-right space-y-2">
          <div>
            <button onclick="submitReview('${biz.id}')" class="bg-green-700 text-white px-4 py-2 rounded">Submit Review</button>
          </div>
          <div>
            <button onclick="openFeatureModal('${biz.id}','${escapeHtml(biz.name)}')" class="bg-yellow-400 text-green-800 px-3 py-2 rounded">Feature this listing</button>
          </div>
        </div>
      </div>
    `;
    toggleBizDetail(true);
  }
  window.openBizDetail = openBizDetail;

  window.submitReview = (bizId) => {
    if (!currentUser) { toggleAuthModal(true); return; }
    const rating = Number(id('reviewRating').value);
    const comment = id('reviewComment').value.trim();
    if (!comment) return alert('Please enter a comment');
    const biz = businesses.find(b => b.id === bizId) || (bizId === ORG_ID && getOrganisation());
    if (!biz) return alert('Business not found');
    const review = { name: currentUser.name, email: currentUser.email, rating, comment, date: Date.now() };
    biz.reviews.unshift(review);
    const idx = businesses.findIndex(b => b.id === biz.id);
    if (idx >= 0) businesses[idx] = biz;
    saveJSON(BIZ_KEY, businesses);
    openBizDetail(biz.id);
    if (biz.id === ORG_ID) renderOrgReviews();
  }

  function getAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    return reviews.reduce((s,r) => s + r.rating, 0) / reviews.length;
  }

  // Events
  window.toggleAddEvent = (show = true) => { addEventModal.classList.toggle('hidden', !show); }
  window.handleAddEvent = (e) => {
    e.preventDefault();
    if (!currentUser) { toggleAuthModal(true); return false; }
    const title = id('eventTitle').value.trim();
    const date = id('eventDate').value;
    const desc = id('eventDesc').value.trim();
    if (!title || !date) return alert('Provide title and date');
    const ev = { id: uid('ev'), title, date, desc, createdBy: currentUser.email };
    events.unshift(ev);
    saveJSON(EVENTS_KEY, events);
    toggleAddEvent(false);
    id('addEventForm').reset();
    renderEvents();
    return false;
  }

  function renderBusinessGrid() {
    const grid = id('businessGrid');
    if (!grid) return;
    const category = id('categoryFilter')?.value || '';
    const query = id('searchBusinesses')?.value.trim().toLowerCase() || '';
    let list = businesses.slice();
    if (category) list = list.filter(b => b.category === category);
    if (query) list = list.filter(b => (b.name + ' ' + (b.location||'') + ' ' + (b.description||'')).toLowerCase().includes(query));
    grid.innerHTML = list.map(b => `
      <div class="bg-white p-4 rounded shadow">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
            <div class="text-sm text-gray-600">${escapeHtml(b.category || '')} • ${escapeHtml(b.location||'')}</div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-green-700">${getAverageRating(b.reviews).toFixed(1)} ★</div>
            <div class="text-xs text-gray-600">${b.reviews.length} reviews</div>
          </div>
        </div>
        ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="mt-3 max-h-40 w-full object-cover rounded cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')"/>` : ''}
        <p class="mt-3 text-gray-700">${escapeHtml(b.description || '')}</p>
        <div class="mt-4 flex gap-2">
          <button onclick="openBizDetail('${b.id}')" class="px-3 py-1 bg-green-700 text-white rounded">View</button>
          <button onclick="copyContact('${escapeHtml(b.contact||'')}')" class="px-3 py-1 border rounded">Contact</button>
          ${b.owner === (currentUser && currentUser.email) ? `<button onclick="openEditBusiness('${b.id}')" class="px-3 py-1 border rounded">Edit</button><button onclick="deleteBusiness('${b.id}')" class="px-3 py-1 border rounded text-red-600">Delete</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderMyBusinesses() {
    const section = id('myBusinesses');
    const grid = id('myBusinessGrid');
    if (!section || !grid) return;
    if (!currentUser) { section.classList.add('hidden'); return; }
    const mine = businesses.filter(b => b.owner === currentUser.email);
    section.classList.remove('hidden');
    if (mine.length === 0) {
      grid.innerHTML = '<div class="text-gray-600">You have not added any businesses yet.</div>';
      return;
    }
    grid.innerHTML = mine.map(b => `
      <div class="bg-white p-4 rounded shadow">
        ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-36 object-cover rounded"/>` : ''}
        <h3 class="font-semibold mt-3">${escapeHtml(b.name)}</h3>
        <div class="text-sm text-gray-600">${escapeHtml(b.category)} • ${escapeHtml(b.location||'')}</div>
        <p class="mt-2 text-gray-700">${escapeHtml(b.description||'')}</p>
        <div class="mt-3 flex gap-2">
          <button onclick="openEditBusiness('${b.id}')" class="px-3 py-1 border rounded">Edit</button>
          <button onclick="deleteBusiness('${b.id}')" class="px-3 py-1 border rounded text-red-600">Delete</button>
        </div>
      </div>
    `).join('');
  }

  window.openEditBusiness = (bizId) => {
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return alert('Business not found');
    if (biz.owner !== (currentUser && currentUser.email)) return alert('You cannot edit this business');
    id('editingBizId').value = biz.id;
    id('bizName').value = biz.name;
    id('bizCategory').value = biz.category;
    id('bizDescription').value = biz.description || '';
    id('bizContact').value = biz.contact || '';
    id('bizLocation').value = biz.location || '';
    if (biz.image) { id('bizImagePreview').src = biz.image; id('bizImagePreview').classList.remove('hidden'); }
    id('addBusinessSubmit').textContent = 'Save Changes';
    id('addBusinessForm').scrollIntoView({behavior: 'smooth'});
    toggleAddBusiness(true);
  }

  window.deleteBusiness = (bizId) => {
    if (!currentUser) { toggleAuthModal(true); return; }
    const biz = businesses.find(b => b.id === bizId);
    if (!biz) return alert('Business not found');
    if (biz.owner !== currentUser.email) return alert('You are not allowed to delete this business');
    if (!confirm('Are you sure you want to delete this business?')) return;
    const idx = businesses.findIndex(b => b.id === bizId);
    if (idx >= 0) {
      businesses.splice(idx, 1);
      saveJSON(BIZ_KEY, businesses);
      renderBusinessGrid();
      renderMyBusinesses();
      alert('Business deleted');
    }
  }

  window.copyContact = (contact) => {
    if (!contact) return alert('No contact information available');
    navigator.clipboard.writeText(contact).then(() => {
      alert('Contact copied: ' + contact);
    }).catch(() => {
      alert('Contact: ' + contact);
    });
  }

  function renderEvents() {
    const container = id('eventsList');
    if (!container) return;
    const list = events.slice().reverse();
    container.innerHTML = list.map(e => `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-bold text-lg">${escapeHtml(e.title)}</h3>
        <div class="text-sm text-gray-600 mt-2">${new Date(e.date).toLocaleString()}</div>
        <p class="mt-3 text-gray-700">${escapeHtml(e.desc || '')}</p>
      </div>
    `).join('');
  }

  function renderOrganisations() {
    const container = id('organisationsList');
    if (!container) return;
    const searchTerm = id('searchOrganisations')?.value?.toLowerCase() || '';
    const orgs = businesses.filter(b => b.category === 'organisation');
    const filtered = orgs.filter(b => !searchTerm || b.name.toLowerCase().includes(searchTerm) || (b.description || '').toLowerCase().includes(searchTerm));
    
    container.innerHTML = filtered.map(b => {
      const avgRating = b.reviews?.length ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 'N/A';
      return `
        <div class="bg-white p-4 rounded shadow">
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-40 object-cover rounded mb-3 cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')">` : '<div class="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">No photo</div>'}
          <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(b.category)}</p>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(b.description || '')}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-yellow-500 text-sm">Rating: ${avgRating} ${b.reviews?.length ? `(${b.reviews.length})` : ''}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="openBizDetail('${b.id}')" class="flex-1 bg-green-700 text-white px-3 py-2 rounded text-sm">Details & Reviews</button>
            <button onclick="copyContact('${escapeHtml(b.contact)}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm">Contact</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderSports() {
    const container = id('sportsGrid');
    if (!container) return;
    const sports = businesses.filter(b => b.category === 'sports');
    container.innerHTML = sports.map(b => {
      const avgRating = b.reviews?.length ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 'N/A';
      return `
        <div class="bg-white p-4 rounded shadow">
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-40 object-cover rounded mb-3 cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')">` : '<div class="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">No photo</div>'}
          <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(b.category)}</p>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(b.description || '')}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-yellow-500 text-sm">Rating: ${avgRating}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="openBizDetail('${b.id}')" class="flex-1 bg-green-700 text-white px-3 py-2 rounded text-sm">Details</button>
            <button onclick="copyContact('${escapeHtml(b.contact)}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm">Contact</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderFootball() {
    const container = id('footballGrid');
    if (!container) return;
    const footballTeams = businesses.filter(b => b.category === 'other' && b.name.includes('Football'));
    container.innerHTML = footballTeams.map(b => {
      const avgRating = b.reviews?.length ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 'N/A';
      return `
        <div class="bg-white p-4 rounded shadow">
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-40 object-cover rounded mb-3 cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')">` : '<div class="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">No photo</div>'}
          <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(b.description || '')}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-yellow-500 text-sm">Rating: ${avgRating}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="openBizDetail('${b.id}')" class="flex-1 bg-green-700 text-white px-3 py-2 rounded text-sm">Details</button>
            <button onclick="copyContact('${escapeHtml(b.contact)}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm">Contact</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderVendors() {
    const container = id('vendorGrid');
    if (!container) return;
    const vendors = businesses.filter(b => b.category === 'vendor');
    container.innerHTML = vendors.map(b => {
      const avgRating = b.reviews?.length ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 'N/A';
      return `
        <div class="bg-white p-4 rounded shadow">
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-40 object-cover rounded mb-3 cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')">` : '<div class="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">No photo</div>'}
          <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(b.category)}</p>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(b.description || '')}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-yellow-500 text-sm">Rating: ${avgRating}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="openBizDetail('${b.id}')" class="flex-1 bg-green-700 text-white px-3 py-2 rounded text-sm">Details</button>
            <button onclick="copyContact('${escapeHtml(b.contact)}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm">Contact</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCommunity() {
    const container = id('communityGrid');
    if (!container) return;
    const community = businesses.filter(b => b.category === 'community-centre');
    container.innerHTML = community.map(b => {
      const avgRating = b.reviews?.length ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 'N/A';
      return `
        <div class="bg-white p-4 rounded shadow">
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}" class="w-full h-40 object-cover rounded mb-3 cursor-pointer hover:opacity-80" onclick="openPhotoGallery('${b.id}')">` : '<div class="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">No photo</div>'}
          <h3 class="font-bold text-lg">${escapeHtml(b.name)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(b.category)}</p>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(b.description || '')}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-yellow-500 text-sm">Rating: ${avgRating}</span>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="openBizDetail('${b.id}')" class="flex-1 bg-green-700 text-white px-3 py-2 rounded text-sm">Details</button>
            <button onclick="copyContact('${escapeHtml(b.contact)}')" class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm">Contact</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function ensureOrg() {
    let org = businesses.find(b => b.id === ORG_ID);
    if (!org) {
      org = { id: ORG_ID, name: 'Just Grace NPC', category: 'organisation', description: 'Local NGO supporting Langa community. Provides social services and community support programs.', contact: '074-111-2222', location: 'Langa', reviews: [], image: '' };
      businesses.unshift(org);
      saveJSON(BIZ_KEY, businesses);
    }
    return org;
  }

  function getOrganisation() { return ensureOrg(); }

  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

  function seedDemo() {
    if (businesses.length === 0) {
      businesses = [
        // Local Businesses
        { id: uid('biz'), name: 'Exquisite Hair by Zim', category: 'hair-salon', description: 'Professional hair styling, braids, weaves and treatments. Follow us on Instagram @exquisite_hairby_zim', contact: 'Instagram: @exquisite_hairby_zim', location: 'Langa Township', reviews: [{ name: 'Amahle', rating: 5, comment: 'Best hair service in Langa, very professional!', date: Date.now()-86400000}], image: '' },
        { id: uid('biz'), name: 'Langa Welding Works', category: 'welding', description: 'Affordable welding and metalwork in Langa.', contact: '072-555-1111', location: 'Block A', reviews: [{ name: 'Nomvula', rating: 5, comment: 'Great work!', date: Date.now()-86400000}], image: '' },
        { id: uid('biz'), name: 'Mama Ps Hair Salon', category: 'hair-salon', description: 'Braids, weaves and styling.', contact: '073-222-3333', location: 'Main Street', reviews: [], image: '' },
        { id: uid('biz'), name: 'Banatella', category: 'local-business', description: 'Community restaurant and food vendor serving authentic local cuisine. Follow us @banatella_1903', contact: 'Instagram: @banatella_1903', location: 'Langa Township', reviews: [], image: '' },
        { id: uid('biz'), name: 'Tshisanyama Langa', category: 'tshisanyama', description: 'Community food and braai with affordable meals.', contact: '074-444-5555', location: 'Corner Plaza', reviews: [], image: '' },
        
        // Sports Facilities
        { id: uid('biz'), name: 'Langa Sports Complex', category: 'sports', description: 'Full gym facility with modern equipment, personal training sessions, and fitness classes. Open Monday to Sunday.', contact: '073-567-8901', location: 'Langa Main Road', reviews: [], image: '' },
        { id: uid('biz'), name: 'Langa Swimming Pool', category: 'sports', description: 'Olympic-sized swimming pool with swimming lessons for all ages. Lifeguards on duty. Great for training and recreation.', contact: '073-567-8902', location: 'Langa Recreation Area', reviews: [], image: '' },
        { id: uid('biz'), name: 'Langa Stadium', category: 'sports', description: 'Multi-purpose stadium with rugby, football, and cricket fields. Hosts local matches and community tournaments.', contact: '073-567-8903', location: 'Langa Sports Field', reviews: [], image: '' },
        { id: uid('biz'), name: 'Langa Football Matches', category: 'sports', description: 'Weekly football matches every Saturday and Sunday. Local clubs and pickup games. Spectators welcome!', contact: '073-567-8904', location: 'Langa Stadium', reviews: [], image: '' },
        
        // Local Vendors
        { id: uid('biz'), name: 'Smiley Place', category: 'vendor', description: 'Popular local food vendor serving delicious street food, grilled meat, and traditional dishes. Famous for smileys (sheep intestines).', contact: '074-123-4567', location: 'Main Street Market', reviews: [], image: '' },
        { id: uid('biz'), name: 'Cow Head Spot', category: 'vendor', description: 'Authentic vendor serving freshly prepared cow head and other traditional meat specialties. Best quality and prices in Langa.', contact: '074-234-5678', location: 'Market Area', reviews: [], image: '' },
        { id: uid('biz'), name: 'Chicken at the Taxi Rank', category: 'vendor', description: 'Fresh grilled chicken and take-away food. Quick service, quality meat, and great flavors. Popular lunch spot.', contact: '074-345-6789', location: 'Langa Taxi Rank', reviews: [], image: '' },
        
        // Organisations
        { id: uid('biz'), name: 'Langa Police Station', category: 'organisation', description: 'South African Police Service office providing law enforcement and community safety services to the Langa area.', contact: '086-001-10177', location: 'Main Street', reviews: [], image: '' },
        { id: uid('biz'), name: 'Langa Museum', category: 'organisation', description: 'Community museum showcasing the history and culture of Langa township. Educational programs and cultural events.', contact: '073-456-7890', location: 'Heritage Park', reviews: [], image: '' },
        { id: uid('biz'), name: 'DSD - Social Development', category: 'organisation', description: 'Department of Social Development office providing social welfare services, grants, and community support programs.', contact: '074-567-8901', location: 'Government Building', reviews: [], image: '' },
        { id: uid('biz'), name: 'Joe Slovo Community Info', category: 'organisation', description: 'Community information center providing resources, job training, and support services for Joe Slovo residents and Langa community.', contact: '073-678-9012', location: 'Joe Slovo Settlement', reviews: [], image: '' },
        { id: uid('biz'), name: 'Just Grace NPC', category: 'organisation', description: 'Local NGO supporting Langa community with social services, skills training, youth programs and community development initiatives.', contact: '074-111-2222', location: 'Langa Township', reviews: [], image: '' },
        
        // Community Centre
        { id: uid('biz'), name: 'Langa Bicycle Hub', category: 'community-centre', description: 'Bicycle shop, repairs and cycling community hub. Bicycles, accessories and cycling events. Follow us @langabicyclehub', contact: 'Instagram: @langabicyclehub', location: 'Langa Main Road', reviews: [], image: '' },
        
        // Football Teams
        { id: uid('biz'), name: 'Bazi Abantu Football Club', category: 'other', description: 'Local football club promoting sports and community development in Langa. Plays every week. Welcome spectators!', contact: 'Instagram: @bazi_abantu_football_club', location: 'Langa Sports Field', reviews: [], image: '' }
      ];
      saveJSON(BIZ_KEY, businesses);
    }
    if (events.length === 0) {
      const tomorrow = new Date(Date.now() + 86400000);
      const nextWeek = new Date(Date.now() + 7*86400000);
      const twoWeeks = new Date(Date.now() + 14*86400000);
      const threeWeeks = new Date(Date.now() + 21*86400000);
      
      events = [ 
        { id: uid('ev'), title: 'Bazi Abantu vs Langa United', date: tomorrow.toISOString(), desc: 'LFA Premier League match - Senior Team. 🗓️ 6 March 2026, 20:00 | 📍 Langa Football Stadium (A). Come support your favorite team!', createdBy: 'system' },
        { id: uid('ev'), title: 'Community Clean Up Drive', date: nextWeek.toISOString(), desc: 'Join us to clean up Langa streets and local parks. All are welcome!', createdBy: 'system' },
        { id: uid('ev'), title: 'Langa Bicycle Hub - Community Ride', date: twoWeeks.toISOString(), desc: 'Fun community bicycle ride through Langa. All skill levels welcome!', createdBy: 'system' },
        { id: uid('ev'), title: 'Hair & Beauty Workshop', date: threeWeeks.toISOString(), desc: 'Learn hair care and styling tips with Exquisite Hair by Zim. Register now!', createdBy: 'system' }
      ];
      saveJSON(EVENTS_KEY, events);
    }
    ensureOrg();
  }

  id('categoryFilter')?.addEventListener('change', renderBusinessGrid);
  id('searchBusinesses')?.addEventListener('input', renderBusinessGrid);
  id('searchOrganisations')?.addEventListener('input', renderOrganisations);
  
  // Setup listeners (called after DOM loads)
  const setupSearchListeners = () => {
    // Listeners are now set up above
  };

  document.addEventListener('DOMContentLoaded', () => {
    users = users || {};
    currentUser = currentUser || loadJSON(CURRENT_KEY) || null;
    businesses = loadJSON(BIZ_KEY) || businesses;
    events = loadJSON(EVENTS_KEY) || events;
    seedDemo();
    updateAuthUI();
    setupSearchListeners();
    showView('homeView');
  });

  id('bizImage')?.addEventListener('change', (e) => {
    const f = e.target?.files?.[0];
    if (!f) { id('bizImagePreview').classList.add('hidden'); id('bizImagePreview').src = ''; return; }
    readFileAsDataURL(f).then(d => { id('bizImagePreview').src = d; id('bizImagePreview').classList.remove('hidden'); });
  });

  function renderOrgReviews() {
    const org = getOrganisation();
    const container = id('orgReviews');
    if (!container) return;
    if (!org.reviews || org.reviews.length === 0) {
      container.innerHTML = '<div class="text-gray-600">No reviews yet. Be the first to review Just Grace NPC.</div>';
      return;
    }
    container.innerHTML = org.reviews.map(r => `
      <div class="mt-3 border-t pt-3"><div class="flex justify-between"><strong>${escapeHtml(r.name)}</strong><div class="text-yellow-600">${'★'.repeat(r.rating)}</div></div><div class="text-sm text-gray-600">${new Date(r.date).toLocaleString()}</div><p class="mt-1">${escapeHtml(r.comment)}</p></div>
    `).join('');
  }

})();
