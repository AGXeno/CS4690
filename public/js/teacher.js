// Teacher Dashboard logic
$(() => {
    loadTenantTheme();
    setTenantFavicon();
    initThemeToggle();
    const user = requireAuth(['teacher']);
    if (!user)
        return;
    $('#tenantLogo').attr('src', getTenantLogo());
    $('#tenantBadge').text(getTenantShortName());
    $('#welcomeMsg').text(`Logged in as ${user.username}`);
    $('#logoutBtn').on('click', logout);
    // Sidebar nav
    $('.sidebar-nav .nav-link').on('click', function (e) {
        e.preventDefault();
        const section = $(this).data('section');
        $('.sidebar-nav .nav-link').removeClass('active');
        $(this).addClass('active');
        $('.dashboard-section').removeClass('active');
        $(`#section-${section}`).addClass('active');
        if (section === 'courses')
            loadCourses();
        if (section === 'students')
            loadStudents();
        if (section === 'logs')
            loadLogFilters();
    });
    loadCourses();
    function loadCourses() {
        apiRequest(`${getApiBase()}/courses`, {
            success: (data) => {
                const $list = $('#coursesList').empty();
                if (data.length === 0) {
                    $list.append('<div class="col-12 text-muted">No courses yet. Create one!</div>');
                    return;
                }
                $.each(data, (_i, course) => {
                    $list.append(renderCourseCard(course, course.id));
                });
            }
        });
    }
    function loadStudents() {
        apiRequest(`${getApiBase()}/users?role=student`, {
            success: (data) => {
                const $tbody = $('#studentsTableBody').empty();
                if (data.length === 0) {
                    $tbody.append('<tr><td colspan="2" class="text-muted">No students found.</td></tr>');
                    return;
                }
                $.each(data, (_i, s) => {
                    $tbody.append(`<tr>
              <td>${s.username}</td>
              <td>${(s.courses || []).join(', ') || '—'}</td>
            </tr>`);
                });
            }
        });
    }
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
    // Create Course
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
    // Create Student
    $('#createStudentForm').on('submit', function (e) {
        e.preventDefault();
        const username = $.trim($('#studentUsername').val());
        const password = $('#studentPassword').val();
        apiRequest(`${getApiBase()}/users`, {
            method: 'POST',
            data: JSON.stringify({ username, password, role: 'student' }),
            success: () => {
                showSectionAlert('#createStudentAlert', `Student "${username}" created!`, 'success');
                $('#createStudentForm')[0].reset();
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Failed to create student';
                showSectionAlert('#createStudentAlert', msg, 'danger');
            }
        });
    });
});
// renderLogsAccordion and showSectionAlert are in common.ts
