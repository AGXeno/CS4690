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
    $('#toggleMode').on('click', (e) => {
        e.preventDefault();
        isSignup = !isSignup;
        hideAlert();
        if (isSignup) {
            $('#roleGroup').removeClass('d-none');
            $('[data-cy="submit_btn"]').text('Sign Up');
            $('#formModeLabel').text('Create a new account');
            $('#toggleMode').text('Already have an account? Sign in');
        }
        else {
            $('#roleGroup').addClass('d-none');
            $('[data-cy="submit_btn"]').text('Sign In');
            $('#formModeLabel').text('Sign in to your account');
            $('#toggleMode').text("Don't have an account? Sign up");
        }
    });
    // Form submission
    $('#authForm').on('submit', (e) => {
        e.preventDefault();
        hideAlert();
        const username = $.trim($('#username').val());
        const password = $('#password').val();
        const role = $('#role').val();
        if (!username || !password) {
            showAlert('Please fill in all fields.', 'danger');
            return;
        }
        const endpoint = isSignup ? 'signup' : 'login';
        const body = { username, password };
        if (isSignup)
            body.role = role;
        $.ajax({
            url: `${getApiBase()}/auth/${endpoint}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(body),
            success: (data) => {
                setToken(data.token);
                redirectToDashboard(data.user.role);
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Something went wrong';
                showAlert(msg, 'danger');
            }
        });
    });
});
function showAlert(message, type) {
    $('#alertBox')
        .removeClass('d-none alert-success alert-danger alert-warning')
        .addClass(`alert-${type}`)
        .text(message);
}
function hideAlert() {
    $('#alertBox').addClass('d-none');
}
