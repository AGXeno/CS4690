// Admin Dashboard logic
$(() => {
    loadTenantTheme();
    setTenantFavicon();
    initThemeToggle();
    const user = requireAuth(['admin']);
    if (!user)
        return;
    // Set branding
    $('#tenantLogo').attr('src', getTenantLogo());
    $('#tenantBadge').text(getTenantShortName());
    $('#welcomeMsg').text(`Logged in as ${user.username}`);
    // Logout
    $('#logoutBtn').on('click', logout);
    // Sidebar navigation
    $('.sidebar-nav .nav-link').on('click', function (e) {
        e.preventDefault();
        const section = $(this).data('section');
        $('.sidebar-nav .nav-link').removeClass('active');
        $(this).addClass('active');
        $('.dashboard-section').removeClass('active');
        $(`#section-${section}`).addClass('active');
        // Load data for the section
        if (section === 'courses')
            loadCourses();
        if (section === 'users')
            loadUsers();
        if (section === 'logs')
            loadLogFilters();
    });
    // Load initial data
    loadCourses();
    // --- Courses ---
    function loadCourses() {
        apiRequest(`${getApiBase()}/courses`, {
            success: (data) => {
                const $list = $('#coursesList').empty();
                if (data.length === 0) {
                    $list.append('<div class="col-12 text-muted">No courses found.</div>');
                    return;
                }
                $.each(data, (_i, course) => {
                    $list.append(renderCourseCard(course, course.id));
                });
            }
        });
    }
    // --- Users ---
    function loadUsers(roleFilter) {
        const url = roleFilter
            ? `${getApiBase()}/users?role=${roleFilter}`
            : `${getApiBase()}/users`;
        apiRequest(url, {
            success: (data) => {
                const $tbody = $('#usersTableBody').empty();
                if (data.length === 0) {
                    $tbody.append('<tr><td colspan="3" class="text-muted">No users found.</td></tr>');
                    return;
                }
                $.each(data, (_i, u) => {
                    $tbody.append(`<tr>
              <td>${u.username}</td>
              <td><span class="badge bg-secondary">${u.role}</span></td>
              <td>${(u.courses || []).join(', ') || '—'}</td>
            </tr>`);
                });
            }
        });
    }
    $('#filterRole').on('change', function () {
        const role = $(this).val();
        loadUsers(role || undefined);
    });
    // --- Logs ---
    function loadLogFilters() {
        apiRequest(`${getApiBase()}/courses`, {
            success: (data) => {
                const $select = $('#logCourseFilter').empty()
                    .append('<option value="">All courses</option>');
                $.each(data, (_i, c) => {
                    $select.append(`<option value="${c.id}">${c.display}</option>`);
                });
            }
        });
    }
    function loadLogs() {
        const courseId = $('#logCourseFilter').val();
        const uvuId = $.trim($('#logUvuIdFilter').val());
        let url = `${getApiBase()}/logs`;
        const params = [];
        if (courseId)
            params.push(`courseId=${courseId}`);
        if (uvuId)
            params.push(`uvuId=${uvuId}`);
        if (params.length)
            url += '?' + params.join('&');
        apiRequest(url, {
            success: (data) => {
                renderLogsAccordion(data, '#logsDisplay');
            }
        });
    }
    $('#filterLogsBtn').on('click', loadLogs);
    // --- Create User ---
    $('#createUserForm').on('submit', function (e) {
        e.preventDefault();
        const username = $.trim($('#newUsername').val());
        const password = $('#newPassword').val();
        const role = $('#newRole').val();
        apiRequest(`${getApiBase()}/users`, {
            method: 'POST',
            data: JSON.stringify({ username, password, role }),
            success: () => {
                showSectionAlert('#createUserAlert', `User "${username}" created successfully!`, 'success');
                $('#createUserForm')[0].reset();
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Failed to create user';
                showSectionAlert('#createUserAlert', msg, 'danger');
            }
        });
    });
    // --- Create Course ---
    $('#createCourseForm').on('submit', function (e) {
        e.preventDefault();
        const id = $.trim($('#newCourseId').val());
        const display = $.trim($('#newCourseDisplay').val());
        apiRequest(`${getApiBase()}/courses`, {
            method: 'POST',
            data: JSON.stringify({ id, display }),
            success: () => {
                showSectionAlert('#createCourseAlert', `Course "${display}" created!`, 'success');
                $('#createCourseForm')[0].reset();
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Failed to create course';
                showSectionAlert('#createCourseAlert', msg, 'danger');
            }
        });
    });
});
// renderLogsAccordion and showSectionAlert are in common.ts
