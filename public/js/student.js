// Student Dashboard logic
$(() => {
    loadTenantTheme();
    setTenantFavicon();
    initThemeToggle();
    const user = requireAuth(['student']);
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
        if (section === 'my-courses')
            loadMyCourses();
        if (section === 'join-course')
            loadAvailableCourses();
        if (section === 'logs')
            openLogsSection();
    });
    loadMyCourses();
    // --- My Courses ---
    function loadMyCourses() {
        apiRequest(`${getApiBase()}/users/me`, {
            success: (userData) => {
                const $list = $('#myCoursesList').empty();
                const myCourses = userData.courses || [];
                if (myCourses.length === 0) {
                    $list.append('<div class="col-12 text-muted">You haven\'t joined any courses yet. Go to "Join a Course".</div>');
                    return;
                }
                // Fetch all courses to get display names
                apiRequest(`${getApiBase()}/courses`, {
                    success: (allCourses) => {
                        $.each(myCourses, (_i, courseId) => {
                            const course = allCourses.find((c) => c.id === courseId);
                            $list.append(renderCourseCard(course, courseId));
                        });
                    }
                });
            }
        });
    }
    // --- Join Course ---
    function loadAvailableCourses() {
        // Get my current courses
        apiRequest(`${getApiBase()}/users/me`, {
            success: (userData) => {
                const myCourses = userData.courses || [];
                apiRequest(`${getApiBase()}/courses`, {
                    success: (allCourses) => {
                        const $list = $('#availableCourses').empty();
                        const available = allCourses.filter((c) => !myCourses.includes(c.id));
                        if (available.length === 0) {
                            $list.append('<div class="col-12 text-muted">No more courses to join.</div>');
                            return;
                        }
                        $.each(available, (_i, course) => {
                            $list.append(renderCourseCard(course, course.id, true));
                        });
                    }
                });
            }
        });
    }
    // Join course handler — whole card is the click target so the action is
    // obvious. Guard against re-entry while a join is in flight.
    $(document).on('click', '.course-joinable', function () {
        const $card = $(this);
        if ($card.hasClass('joining'))
            return;
        const courseId = $card.data('course-id');
        $card.addClass('joining');
        apiRequest(`${getApiBase()}/courses/${courseId}/join`, {
            method: 'POST',
            data: JSON.stringify({}),
            success: () => {
                showSectionAlert('#joinCourseAlert', `Joined "${courseId}" successfully!`, 'success');
                loadAvailableCourses();
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Failed to join course';
                showSectionAlert('#joinCourseAlert', msg, 'danger');
                $card.removeClass('joining');
            }
        });
    });
    // --- Logs ---
    // Cached from /users/me on each Logs section open. Used as the Student ID
    // when posting new logs (server still also enforces userId-scoped reads).
    let myStudentId = '';
    // Called whenever the Logs sidebar item is clicked. Populates filters and
    // immediately renders the student's logs — no "View Logs" button needed.
    function openLogsSection() {
        apiRequest(`${getApiBase()}/users/me`, {
            success: (userData) => {
                myStudentId = userData.studentId || '';
                apiRequest(`${getApiBase()}/courses`, {
                    success: (allCourses) => {
                        const myCourses = userData.courses || [];
                        const $filter = $('#logCourseFilter').empty()
                            .append('<option value="">All my courses</option>');
                        const $newSelect = $('#newLogCourse').empty();
                        $.each(allCourses, (_i, c) => {
                            if (myCourses.includes(c.id)) {
                                $filter.append(`<option value="${c.id}">${c.display}</option>`);
                                $newSelect.append(`<option value="${c.id}">${c.display}</option>`);
                            }
                        });
                        loadLogs();
                    }
                });
            }
        });
    }
    function loadLogs() {
        const courseId = $('#logCourseFilter').val();
        const url = courseId
            ? `${getApiBase()}/logs?courseId=${encodeURIComponent(courseId)}`
            : `${getApiBase()}/logs`;
        apiRequest(url, {
            success: (data) => {
                renderLogsAccordion(data, '#logsDisplay');
            }
        });
    }
    // Re-fetch on filter change (no separate "View" button)
    $('#logCourseFilter').on('change', loadLogs);
    // Enable/disable add log button based on text content
    $('#newLogText').on('input', function () {
        const text = $.trim($(this).val());
        $('[data-cy="add_log_btn"]').prop('disabled', text.length === 0);
    });
    // Add Log
    $('#addLogForm').on('submit', function (e) {
        e.preventDefault();
        const courseId = $('#newLogCourse').val();
        const text = $.trim($('#newLogText').val());
        if (!courseId || !text || !myStudentId)
            return;
        apiRequest(`${getApiBase()}/logs`, {
            method: 'POST',
            data: JSON.stringify({
                courseId,
                uvuId: myStudentId,
                date: new Date().toISOString(),
                text
            }),
            success: () => {
                $('#newLogText').val('');
                $('[data-cy="add_log_btn"]').prop('disabled', true);
                loadLogs();
            },
            error: (xhr) => {
                var _a;
                const msg = ((_a = xhr.responseJSON) === null || _a === void 0 ? void 0 : _a.error) || 'Failed to add log';
                $('#logsDisplay').prepend(`<div class="alert alert-danger">${msg}</div>`);
            }
        });
    });
});
// renderLogsAccordion and showSectionAlert are in common.ts
