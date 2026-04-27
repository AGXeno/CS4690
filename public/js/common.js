// Common utilities shared across all pages
/**
 * Extract tenant from the current URL path (e.g., /uvu/admin → "uvu")
 */
function getTenant() {
    const parts = window.location.pathname.split('/');
    return parts[1] || '';
}
/**
 * Get the API base URL for the current tenant
 */
function getApiBase() {
    return `${window.location.origin}/api/${getTenant()}`;
}
/**
 * Get the stored JWT token
 */
function getToken() {
    return localStorage.getItem('token');
}
/**
 * Store the JWT token
 */
function setToken(token) {
    localStorage.setItem('token', token);
}
/**
 * Remove the JWT token
 */
function clearToken() {
    localStorage.removeItem('token');
}
/**
 * Decode a JWT payload (without verification — verification happens server-side)
 */
function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''));
        return JSON.parse(jsonPayload);
    }
    catch (_a) {
        return null;
    }
}
/**
 * Check if token is valid and matches current tenant.
 * Redirects to login if not.
 */
function requireAuth(allowedRoles) {
    const token = getToken();
    const tenant = getTenant();
    if (!token) {
        redirectToLogin();
        return null;
    }
    const payload = decodeToken(token);
    if (!payload) {
        clearToken();
        redirectToLogin();
        return null;
    }
    // Check token expiration
    if (payload.exp * 1000 < Date.now()) {
        clearToken();
        redirectToLogin();
        return null;
    }
    // Cross-tenant check: if token tenant doesn't match URL tenant, force re-login
    if (payload.tenant !== tenant) {
        clearToken();
        redirectToLogin();
        return null;
    }
    // Role check
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
        clearToken();
        redirectToLogin();
        return null;
    }
    return payload;
}
/**
 * Redirect to the tenant's login page
 */
function redirectToLogin() {
    const tenant = getTenant();
    window.location.href = `/${tenant}/login`;
}
/**
 * Redirect to the user's appropriate dashboard based on role
 */
function redirectToDashboard(role) {
    const tenant = getTenant();
    window.location.href = `/${tenant}/${role}`;
}
/**
 * Make an authenticated API request using jQuery AJAX.
 * Automatically handles 401/403 responses.
 */
function apiRequest(url, options = {}) {
    const token = getToken();
    const defaults = {
        url: url,
        contentType: 'application/json',
        beforeSend: (xhr) => {
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        },
        statusCode: {
            401: () => {
                clearToken();
                redirectToLogin();
            },
            403: (_xhr) => {
                // Check response for forceLogout or forceLogin
                try {
                    const resp = typeof _xhr.responseJSON !== 'undefined'
                        ? _xhr.responseJSON
                        : JSON.parse(_xhr.responseText || '{}');
                    if (resp.forceLogout || resp.forceLogin) {
                        clearToken();
                        redirectToLogin();
                    }
                }
                catch (_a) {
                    // If we can't parse, just redirect
                    clearToken();
                    redirectToLogin();
                }
            }
        }
    };
    return $.ajax($.extend(true, defaults, options));
}
/**
 * Load tenant theme CSS dynamically
 */
function loadTenantTheme() {
    const tenant = getTenant();
    const themeFile = tenant === 'uofu' ? 'uofu-theme.css' : 'uvu-theme.css';
    $('head').append(`<link rel="stylesheet" href="/public/css/${themeFile}">`);
}
/**
 * Get tenant display name
 */
function getTenantDisplayName() {
    const tenant = getTenant();
    return tenant === 'uofu' ? 'University of Utah' : 'Utah Valley University';
}
/**
 * Get tenant short name
 */
function getTenantShortName() {
    const tenant = getTenant();
    return tenant === 'uofu' ? 'UofU' : 'UVU';
}
/**
 * Get tenant logo URL
 */
function getTenantLogo() {
    const tenant = getTenant();
    // Locally-hosted SVGs avoid hotlink blocks (Wikimedia/Firefox OBR) and
    // any flicker from cross-origin fetches.
    return tenant === 'uofu'
        ? '/public/img/uofu-logo.svg'
        : '/public/img/uvu-logo.svg';
}
/**
 * Tenant-aware favicon — set on the existing <link rel="icon"> at page load
 * so the browser tab shows the correct school's mark.
 */
function setTenantFavicon() {
    const href = getTenantLogo();
    let $link = $('link[rel="icon"]');
    if ($link.length === 0) {
        $link = $('<link rel="icon">').appendTo('head');
    }
    $link.attr('href', href);
}
/**
 * Initialize theme toggle (light/dark mode)
 */
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        $('html').attr('data-bs-theme', 'dark');
        $('#themeToggle').text('☀️ Light Mode');
    }
    $('#themeToggle').on('click', () => {
        const current = $('html').attr('data-bs-theme') || 'light';
        if (current === 'light') {
            $('html').attr('data-bs-theme', 'dark');
            $('#themeToggle').text('☀️ Light Mode');
            localStorage.setItem('theme', 'dark');
        }
        else {
            $('html').attr('data-bs-theme', 'light');
            $('#themeToggle').text('🌙 Dark Mode');
            localStorage.setItem('theme', 'light');
        }
    });
}
/**
 * Logout handler
 */
function logout() {
    clearToken();
    redirectToLogin();
}
/**
 * Render logs in a Bootstrap accordion
 */
function renderLogsAccordion(logs, containerSelector) {
    const $container = $(containerSelector).empty();
    if (logs.length === 0) {
        $container.append('<p class="text-muted fst-italic">No logs found.</p>');
        return;
    }
    const $accordion = $('<div>').addClass('accordion').attr('id', 'logsAccordion');
    $.each(logs, (i, log) => {
        const collapseId = `log-collapse-${i}`;
        const dateStr = new Date(log.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const $item = $('<div>').addClass('accordion-item');
        $item.append(`<h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button"
          data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          <span class="me-3">${escapeHtml(dateStr)}</span>
          <small class="text-muted">${escapeHtml(log.courseId)} — ${escapeHtml(log.uvuId)}</small>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#logsAccordion">
        <div class="accordion-body">${escapeHtml(log.text)}</div>
      </div>`);
        $accordion.append($item);
    });
    $container.append($accordion);
}
function escapeHtml(s) {
    return $('<div>').text(s).html();
}
function nl2br(s) {
    return escapeHtml(s).replace(/\n/g, '<br>');
}
/**
 * UVU catalog-style card. Mirrors UVU's published catalog format
 * (course code · title · credits · description · lab fee) inside Bootstrap
 * card chrome — header / body / footer.
 */
function renderUvuCourseCard(course, fallbackId, withJoinButton) {
    const display = (course === null || course === void 0 ? void 0 : course.display) || fallbackId;
    const title = (course === null || course === void 0 ? void 0 : course.title) || '';
    const credits = (course === null || course === void 0 ? void 0 : course.credits) != null
        ? `${course.credits} Credit${course.credits === 1 ? '' : 's'}`
        : '';
    const prerequisites = (course === null || course === void 0 ? void 0 : course.prerequisites) || '';
    const description = (course === null || course === void 0 ? void 0 : course.description) || '';
    const labFee = (course === null || course === void 0 ? void 0 : course.labFee) || '';
    const titleLine = title
        ? `<div class="card-title h6 mb-1">${escapeHtml(display)}</div>
       <div class="card-subtitle small text-muted">${escapeHtml(title)}</div>`
        : `<div class="card-title h6 mb-0">${escapeHtml(display)}</div>`;
    const descLine = description
        ? `<p class="card-text small mb-2">${escapeHtml(description)}</p>`
        : '';
    const prereqLine = prerequisites
        ? `<details class="small mb-2">
         <summary class="text-muted">Prerequisite(s)</summary>
         <div class="mt-1">${escapeHtml(prerequisites)}</div>
       </details>`
        : '';
    const labFeeLine = labFee
        ? `<div class="small text-muted fst-italic">${escapeHtml(labFee)}</div>`
        : '';
    const creditsBadge = credits
        ? `<span class="badge text-bg-secondary">${credits}</span>`
        : '<span></span>';
    const joinable = withJoinButton && course;
    const cardClasses = joinable ? 'card shadow-sm w-100 course-joinable' : 'card shadow-sm w-100';
    const cardData = joinable ? `data-course-id="${escapeHtml(course.id)}"` : '';
    const footerCta = joinable
        ? `<span class="text-tenant fw-semibold small">Click to join →</span>`
        : '<span></span>';
    return `<div class="col-md-6 col-xl-4 d-flex">
    <div class="${cardClasses}" ${cardData}>
      <div class="card-header bg-transparent">
        ${titleLine}
      </div>
      <div class="card-body">
        ${descLine}
        ${prereqLine}
        ${labFeeLine}
      </div>
      <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
        ${creditsBadge}
        ${footerCta}
      </div>
    </div>
  </div>`;
}
/**
 * UofU catalog-page-style card. Mirrors UofU's requirements-page layout —
 * department subtitle, labelled sections (Required Requisite(s), Semester
 * Credit Hours, Semesters Typically Offered, etc.) — inside Bootstrap card
 * chrome.
 */
function renderUofuCourseCard(course, fallbackId, withJoinButton) {
    const display = ((course === null || course === void 0 ? void 0 : course.display) || fallbackId).replace(/\s+/g, ''); // "CS 3810" → "CS3810"
    const title = (course === null || course === void 0 ? void 0 : course.title) || '';
    const min = course === null || course === void 0 ? void 0 : course.creditsMin;
    const max = course === null || course === void 0 ? void 0 : course.creditsMax;
    const creditsBadgeText = min != null && max != null
        ? (min === max ? `${min} cr` : `${min}-${max} cr`)
        : '';
    const titleLine = title
        ? `<div class="card-title h6 mb-1">${escapeHtml(display)} <span class="text-muted fw-normal">— ${escapeHtml(title)}</span></div>`
        : `<div class="card-title h6 mb-1">${escapeHtml(display)}</div>`;
    const department = `<div class="card-subtitle small text-muted">Computing EN · J &amp; M Price College of Eng.</div>`;
    const sections = [];
    if (min != null && max != null) {
        sections.push(`<div class="mb-2 small">
        <div class="fw-semibold">Semester Credit Hours</div>
        <div>Minimum Credits: ${min}</div>
        <div>Maximum Credits: ${max}</div>
        <div>Repeat for Credit: No</div>
      </div>`);
    }
    if (course === null || course === void 0 ? void 0 : course.prerequisites) {
        sections.push(`<details class="mb-2 small">
         <summary class="fw-semibold">Required Requisite(s)</summary>
         <div class="mt-1">${nl2br(course.prerequisites)}</div>
       </details>`);
    }
    if (course === null || course === void 0 ? void 0 : course.recommendedBackground) {
        sections.push(`<div class="mb-2 small">
        <div class="fw-semibold">Recommended background knowledge:</div>
        <div>${escapeHtml(course.recommendedBackground)}</div>
      </div>`);
    }
    if (course === null || course === void 0 ? void 0 : course.genEdDesignation) {
        sections.push(`<div class="mb-2 small">
        <div class="fw-semibold">Gen-Ed Designation:</div>
        <div>${escapeHtml(course.genEdDesignation)}</div>
      </div>`);
    }
    if (course === null || course === void 0 ? void 0 : course.semestersOffered) {
        sections.push(`<div class="mb-2 small">
        <div class="fw-semibold">Semesters Typically Offered:</div>
        <div>${escapeHtml(course.semestersOffered)}</div>
      </div>`);
    }
    if (course === null || course === void 0 ? void 0 : course.crossListed) {
        sections.push(`<div class="mb-2 small">
        <div class="fw-semibold">Cross Listed Courses:</div>
        <div>${escapeHtml(course.crossListed)}</div>
      </div>`);
    }
    const creditsBadge = creditsBadgeText
        ? `<span class="badge text-bg-secondary">${creditsBadgeText}</span>`
        : '<span></span>';
    const joinable = withJoinButton && course;
    const cardClasses = joinable ? 'card shadow-sm w-100 course-joinable' : 'card shadow-sm w-100';
    const cardData = joinable ? `data-course-id="${escapeHtml(course.id)}"` : '';
    const footerCta = joinable
        ? `<span class="text-tenant fw-semibold small">Click to join →</span>`
        : '<span></span>';
    return `<div class="col-md-6 col-xl-4 d-flex">
    <div class="${cardClasses}" ${cardData}>
      <div class="card-header bg-transparent">
        ${titleLine}
        ${department}
      </div>
      <div class="card-body">
        ${sections.join('')}
      </div>
      <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
        ${creditsBadge}
        ${footerCta}
      </div>
    </div>
  </div>`;
}
/**
 * Dispatcher — picks the right per-tenant catalog format. Each school has its
 * own presentation, on purpose: this is multi-tenancy at the data + UI layer,
 * not just a CSS swap.
 */
function renderCourseCard(course, fallbackId, withJoinButton = false) {
    const tenant = getTenant();
    return tenant === 'uofu'
        ? renderUofuCourseCard(course, fallbackId, withJoinButton)
        : renderUvuCourseCard(course, fallbackId, withJoinButton);
}
/**
 * Show a temporary alert in a dashboard section
 */
function showSectionAlert(selector, message, type) {
    $(selector)
        .removeClass('d-none alert-success alert-danger alert-warning')
        .addClass(`alert-${type}`)
        .text(message);
    setTimeout(() => $(selector).addClass('d-none'), 4000);
}
