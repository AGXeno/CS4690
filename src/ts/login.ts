// Login / Signup page logic

$(() => {
  loadTenantTheme();
  setTenantFavicon();
  initThemeToggle();

  // Set tenant branding
  $('#tenantLogo').attr('src', getTenantLogo());
  $('#tenantName').text(getTenantDisplayName());

  // If already logged in with valid token for this tenant, redirect to dashboard
  const token = getToken();
  if (token) {
    const payload = decodeToken(token);
    if (payload && payload.tenant === getTenant() && payload.exp * 1000 > Date.now()) {
      redirectToDashboard(payload.role);
      return;
    }
    // Token invalid or wrong tenant — clear it
    clearToken();
  }

  let isSignup = false;

  // Toggle between login and signup
  $('#toggleMode').on('click', (e: JQuery.ClickEvent) => {
    e.preventDefault();
    isSignup = !isSignup;
    hideAlert();

    if (isSignup) {
      $('#roleGroup').removeClass('d-none');
      $('[data-cy="submit_btn"]').text('Sign Up');
      $('#formModeLabel').text('Create a new account');
      $('#toggleMode').text('Already have an account? Sign in');
    } else {
      $('#roleGroup').addClass('d-none');
      $('[data-cy="submit_btn"]').text('Sign In');
      $('#formModeLabel').text('Sign in to your account');
      $('#toggleMode').text("Don't have an account? Sign up");
    }
  });

  // Form submission
  $('#authForm').on('submit', (e: JQuery.SubmitEvent) => {
    e.preventDefault();
    hideAlert();

    const username = $.trim($('#username').val() as string);
    const password = $('#password').val() as string;
    const role = $('#role').val() as string;

    if (!username || !password) {
      showAlert('Please fill in all fields.', 'danger');
      return;
    }

    const endpoint = isSignup ? 'signup' : 'login';
    const body: Record<string, string> = { username, password };
    if (isSignup) body.role = role;

    $.ajax({
      url: `${getApiBase()}/auth/${endpoint}`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(body),
      success: (data: { token: string; user: { role: string } }) => {
        setToken(data.token);
        redirectToDashboard(data.user.role);
      },
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Something went wrong';
        showAlert(msg, 'danger');
      }
    });
  });
});

function showAlert(message: string, type: string): void {
  $('#alertBox')
    .removeClass('d-none alert-success alert-danger alert-warning')
    .addClass(`alert-${type}`)
    .text(message);
}

function hideAlert(): void {
  $('#alertBox').addClass('d-none');
}
