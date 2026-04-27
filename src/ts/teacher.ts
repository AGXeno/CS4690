// Teacher Dashboard logic

$(() => {
  loadTenantTheme();
  setTenantFavicon();
  initThemeToggle();

  const user = requireAuth(['teacher']);
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

    if (section === 'courses') loadCourses();
    if (section === 'students') loadStudents();
    if (section === 'logs') loadLogFilters();
  });

  loadCourses();

  function loadCourses(): void {
    apiRequest(`${getApiBase()}/courses`, {
      success: (data: CourseRecord[]) => {
        const $list = $('#coursesList').empty();
        if (data.length === 0) {
          $list.append('<div class="col-12 text-muted">No courses yet. Create one!</div>');
          return;
        }
        $.each(data, (_i: number, course: CourseRecord) => {
          $list.append(renderCourseCard(course, course.id));
        });
      }
    });
  }

  function loadStudents(): void {
    apiRequest(`${getApiBase()}/users?role=student`, {
      success: (data: Array<{ username: string; courses: string[] }>) => {
        const $tbody = $('#studentsTableBody').empty();
        if (data.length === 0) {
          $tbody.append('<tr><td colspan="2" class="text-muted">No students found.</td></tr>');
          return;
        }
        $.each(data, (_i: number, s: { username: string; courses: string[] }) => {
          $tbody.append(
            `<tr>
              <td>${s.username}</td>
              <td>${(s.courses || []).join(', ') || '—'}</td>
            </tr>`
          );
        });
      }
    });
  }

  function loadLogFilters(): void {
    apiRequest(`${getApiBase()}/courses`, {
      success: (data: Array<{ id: string; display: string }>) => {
        const $select = $('#logCourseFilter').empty()
          .append('<option value="">All courses</option>');
        $.each(data, (_i: number, c: { id: string; display: string }) => {
          $select.append(`<option value="${c.id}">${c.display}</option>`);
        });
      }
    });
  }

  function loadLogs(): void {
    const courseId = $('#logCourseFilter').val() as string;
    const uvuId = $.trim($('#logUvuIdFilter').val() as string);

    let url = `${getApiBase()}/logs`;
    const params: string[] = [];
    if (courseId) params.push(`courseId=${courseId}`);
    if (uvuId) params.push(`uvuId=${uvuId}`);
    if (params.length) url += '?' + params.join('&');

    apiRequest(url, {
      success: (data: Array<{ courseId: string; uvuId: string; date: string; text: string }>) => {
        renderLogsAccordion(data, '#logsDisplay');
      }
    });
  }

  $('#filterLogsBtn').on('click', loadLogs);

  // Create Course
  $('#createCourseForm').on('submit', function (e: JQuery.SubmitEvent) {
    e.preventDefault();
    const id = $.trim($('#newCourseId').val() as string);
    const display = $.trim($('#newCourseDisplay').val() as string);

    apiRequest(`${getApiBase()}/courses`, {
      method: 'POST',
      data: JSON.stringify({ id, display }),
      success: () => {
        showSectionAlert('#createCourseAlert', `Course "${display}" created!`, 'success');
        ($('#createCourseForm')[0] as HTMLFormElement).reset();
      },
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Failed to create course';
        showSectionAlert('#createCourseAlert', msg, 'danger');
      }
    });
  });

  // Create Student
  $('#createStudentForm').on('submit', function (e: JQuery.SubmitEvent) {
    e.preventDefault();
    const username = $.trim($('#studentUsername').val() as string);
    const password = $('#studentPassword').val() as string;

    apiRequest(`${getApiBase()}/users`, {
      method: 'POST',
      data: JSON.stringify({ username, password, role: 'student' }),
      success: () => {
        showSectionAlert('#createStudentAlert', `Student "${username}" created!`, 'success');
        ($('#createStudentForm')[0] as HTMLFormElement).reset();
      },
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Failed to create student';
        showSectionAlert('#createStudentAlert', msg, 'danger');
      }
    });
  });
});

// renderLogsAccordion and showSectionAlert are in common.ts
