// Student Dashboard logic

$(() => {
  loadTenantTheme();
  setTenantFavicon();
  initThemeToggle();

  const user = requireAuth(['student']);
  if (!user) return;

  $('#tenantLogo').attr('src', getTenantLogo());
  $('#tenantBadge').text(getTenantShortName());
  $('#welcomeMsg').text(`Logged in as ${user.username}`);
  $('#logoutBtn').on('click', logout);

  // Sidebar nav
  $('.sidebar-nav .nav-link').on('click', function (e: JQuery.ClickEvent) {
    e.preventDefault();
    const section = $(this).data('section') as string;
    $('.sidebar-nav .nav-link').removeClass('active');
    $(this).addClass('active');
    $('.dashboard-section').removeClass('active');
    $(`#section-${section}`).addClass('active');

    if (section === 'my-courses') loadMyCourses();
    if (section === 'join-course') loadAvailableCourses();
    if (section === 'logs') openLogsSection();
  });

  loadMyCourses();

  // --- My Courses ---
  function loadMyCourses(): void {
    apiRequest(`${getApiBase()}/users/me`, {
      success: (userData: { courses: string[] }) => {
        const $list = $('#myCoursesList').empty();
        const myCourses = userData.courses || [];
        if (myCourses.length === 0) {
          $list.append('<div class="col-12 text-muted">You haven\'t joined any courses yet. Go to "Join a Course".</div>');
          return;
        }
        // Fetch all courses to get display names
        apiRequest(`${getApiBase()}/courses`, {
          success: (allCourses: CourseRecord[]) => {
            $.each(myCourses, (_i: number, courseId: string) => {
              const course = allCourses.find((c) => c.id === courseId);
              $list.append(renderCourseCard(course, courseId));
            });
          }
        });
      }
    });
  }

  // --- Join Course ---
  function loadAvailableCourses(): void {
    // Get my current courses
    apiRequest(`${getApiBase()}/users/me`, {
      success: (userData: { courses: string[] }) => {
        const myCourses = userData.courses || [];

        apiRequest(`${getApiBase()}/courses`, {
          success: (allCourses: CourseRecord[]) => {
            const $list = $('#availableCourses').empty();
            const available = allCourses.filter((c) => !myCourses.includes(c.id));

            if (available.length === 0) {
              $list.append('<div class="col-12 text-muted">No more courses to join.</div>');
              return;
            }

            $.each(available, (_i: number, course: CourseRecord) => {
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
    if ($card.hasClass('joining')) return;
    const courseId = $card.data('course-id') as string;
    $card.addClass('joining');

    apiRequest(`${getApiBase()}/courses/${courseId}/join`, {
      method: 'POST',
      data: JSON.stringify({}),
      success: () => {
        showSectionAlert('#joinCourseAlert', `Joined "${courseId}" successfully!`, 'success');
        loadAvailableCourses();
      },
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Failed to join course';
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
  function openLogsSection(): void {
    apiRequest(`${getApiBase()}/users/me`, {
      success: (userData: { courses: string[]; studentId?: string }) => {
        myStudentId = userData.studentId || '';

        apiRequest(`${getApiBase()}/courses`, {
          success: (allCourses: Array<{ id: string; display: string }>) => {
            const myCourses = userData.courses || [];
            const $filter = $('#logCourseFilter').empty()
              .append('<option value="">All my courses</option>');
            const $newSelect = $('#newLogCourse').empty();

            $.each(allCourses, (_i: number, c: { id: string; display: string }) => {
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

  function loadLogs(): void {
    const courseId = $('#logCourseFilter').val() as string;
    const url = courseId
      ? `${getApiBase()}/logs?courseId=${encodeURIComponent(courseId)}`
      : `${getApiBase()}/logs`;

    apiRequest(url, {
      success: (data: Array<{ courseId: string; uvuId: string; date: string; text: string }>) => {
        renderLogsAccordion(data, '#logsDisplay');
      }
    });
  }

  // Re-fetch on filter change (no separate "View" button)
  $('#logCourseFilter').on('change', loadLogs);

  // Enable/disable add log button based on text content
  $('#newLogText').on('input', function () {
    const text = $.trim($(this).val() as string);
    $('[data-cy="add_log_btn"]').prop('disabled', text.length === 0);
  });

  // Add Log
  $('#addLogForm').on('submit', function (e: JQuery.SubmitEvent) {
    e.preventDefault();
    const courseId = $('#newLogCourse').val() as string;
    const text = $.trim($('#newLogText').val() as string);

    if (!courseId || !text || !myStudentId) return;

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
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Failed to add log';
        $('#logsDisplay').prepend(`<div class="alert alert-danger">${msg}</div>`);
      }
    });
  });
});

// renderLogsAccordion and showSectionAlert are in common.ts
