// Admin Dashboard logic

$(() => {
  loadTenantTheme();
  setTenantFavicon();
  initThemeToggle();

  const user = requireAuth(['admin']);
  if (!user) return;

  // Set branding
  $('#tenantLogo').attr('src', getTenantLogo());
  $('#tenantBadge').text(getTenantShortName());
  $('#welcomeMsg').text(`Logged in as ${user.username}`);

  // Logout
  $('#logoutBtn').on('click', logout);

  // Sidebar navigation
  $('.sidebar-nav .nav-link').on('click', function (e: JQuery.ClickEvent) {
    e.preventDefault();
    const section = $(this).data('section') as string;
    $('.sidebar-nav .nav-link').removeClass('active');
    $(this).addClass('active');
    $('.dashboard-section').removeClass('active');
    $(`#section-${section}`).addClass('active');

    // Load data for the section
    if (section === 'courses') loadCourses();
    if (section === 'users') loadUsers();
    if (section === 'logs') loadLogFilters();
  });

  // Load initial data
  loadCourses();

  // --- Courses ---
  function loadCourses(): void {
    apiRequest(`${getApiBase()}/courses`, {
      success: (data: CourseRecord[]) => {
        const $list = $('#coursesList').empty();
        if (data.length === 0) {
          $list.append('<div class="col-12 text-muted">No courses found.</div>');
          return;
        }
        $.each(data, (_i: number, course: CourseRecord) => {
          $list.append(renderCourseCard(course, course.id));
        });
      }
    });
  }

  // --- Users ---
  function loadUsers(roleFilter?: string): void {
    const url = roleFilter
      ? `${getApiBase()}/users?role=${roleFilter}`
      : `${getApiBase()}/users`;

    apiRequest(url, {
      success: (data: Array<{ username: string; role: string; courses: string[] }>) => {
        const $tbody = $('#usersTableBody').empty();
        if (data.length === 0) {
          $tbody.append('<tr><td colspan="3" class="text-muted">No users found.</td></tr>');
          return;
        }
        $.each(data, (_i: number, u: { username: string; role: string; courses: string[] }) => {
          $tbody.append(
            `<tr>
              <td>${u.username}</td>
              <td><span class="badge bg-secondary">${u.role}</span></td>
              <td>${(u.courses || []).join(', ') || '—'}</td>
            </tr>`
          );
        });
      }
    });
  }

  $('#filterRole').on('change', function () {
    const role = $(this).val() as string;
    loadUsers(role || undefined);
  });

  // --- Logs ---
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

  // --- Create User ---
  $('#createUserForm').on('submit', function (e: JQuery.SubmitEvent) {
    e.preventDefault();
    const username = $.trim($('#newUsername').val() as string);
    const password = $('#newPassword').val() as string;
    const role = $('#newRole').val() as string;

    apiRequest(`${getApiBase()}/users`, {
      method: 'POST',
      data: JSON.stringify({ username, password, role }),
      success: () => {
        showSectionAlert('#createUserAlert', `User "${username}" created successfully!`, 'success');
        ($('#createUserForm')[0] as HTMLFormElement).reset();
      },
      error: (xhr: JQuery.jqXHR) => {
        const msg = xhr.responseJSON?.error || 'Failed to create user';
        showSectionAlert('#createUserAlert', msg, 'danger');
      }
    });
  });

  // --- Create Course ---
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
});

// renderLogsAccordion and showSectionAlert are in common.ts
