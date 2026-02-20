// Student Logs App - TypeScript + jQuery
// All DOM manipulation uses jQuery (no document.* or window.*)
// All AJAX uses jQuery $.get / $.ajax (no axios or fetch)

// --- Type definitions ---
interface Course {
  id: string;
  display: string;
}

interface LogEntry {
  id?: string;
  courseId: string;
  uvuId: string;
  date: string;
  text: string;
  [key: string]: unknown;
}

// --- Constants ---
const API_BASE: string = "https://json-server-qy0s.onrender.com";

// --- jQuery ready (replaces window.onload) ---
$(() => {
  // Load saved theme from localStorage
  const savedTheme: string | null = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    $("html").attr("data-bs-theme", "dark");
    $("#themeToggle").text("☀️ Light Mode");
  }

  // Fetch courses on page load
  loadCourses();

  // --- Event: Theme toggle (Extra Credit) ---
  $("#themeToggle").on("click", () => {
    const current: string = $("html").attr("data-bs-theme") || "light";
    if (current === "light") {
      $("html").attr("data-bs-theme", "dark");
      $("#themeToggle").text("☀️ Light Mode");
      localStorage.setItem("theme", "dark");
    } else {
      $("html").attr("data-bs-theme", "light");
      $("#themeToggle").text("🌙 Dark Mode");
      localStorage.setItem("theme", "light");
    }
  });

  // --- Event: UVU ID input ---
  $("#uvuId").on("input", function () {
    const val: string = $(this).val() as string;
    // Only allow digits, max 8 characters
    const cleaned: string = val.replace(/\D/g, "").slice(0, 8);
    $(this).val(cleaned);

    if (cleaned.length === 8) {
      $("#uvuIdError").text("");
      $("#course").prop("disabled", false);
      // Populate the add-log form's UVU ID field
      $("#newLogUvuId").val(cleaned);
      // If a course is already selected, fetch logs
      const selectedCourse: string = $("#course").val() as string;
      if (selectedCourse) {
        fetchLogs(selectedCourse, cleaned);
      }
    } else {
      $("#course").prop("disabled", true);
      $("#logs").empty();
      $("#addLogForm").hide();
      if (cleaned.length > 0) {
        $("#uvuIdError").text("UVU ID must be 8 digits");
      } else {
        $("#uvuIdError").text("");
      }
    }
  });

  // --- Event: Course selection ---
  $("#course").on("change", function () {
    const courseId: string = $(this).val() as string;
    const uvuId: string = $("#uvuId").val() as string;

    if (courseId && uvuId.length === 8) {
      fetchLogs(courseId, uvuId);
      // Sync the add-log form's course dropdown
      $("#newLogCourse").val(courseId);
    } else {
      $("#logs").empty();
      $("#addLogForm").hide();
    }
  });

  // --- Event: Add Log form submission ---
  $("#addLogForm").on("submit", function (e: JQuery.SubmitEvent) {
    e.preventDefault();

    const courseId: string = $("#newLogCourse").val() as string;
    const uvuId: string = $("#newLogUvuId").val() as string;
    const text: string = $.trim($("#newLogText").val() as string);

    if (!courseId || !uvuId || !text) return;

    const newLog: Partial<LogEntry> = {
      courseId: courseId,
      uvuId: uvuId,
      date: new Date().toISOString(),
      text: text,
    };

    // POST new log using jQuery AJAX
    $.ajax({
      url: `${API_BASE}/logs`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(newLog),
      success: () => {
        $("#newLogText").val("");
        // Refresh the logs display
        fetchLogs(courseId, uvuId);
      },
      error: (_xhr: JQuery.jqXHR, _status: string, err: string) => {
        console.error("Error adding log:", err);
      },
    });
  });

  // --- Event: Enable/disable add log button based on textarea content ---
  $("#newLogText").on("input", function () {
    const text: string = $.trim($(this).val() as string);
    $("[data-cy='add_log_btn']").prop("disabled", text.length === 0);
  });
});

// --- Functions ---

/**
 * Fetch all courses from the API and populate both dropdowns.
 */
function loadCourses(): void {
  $.get(`${API_BASE}/courses`, (data: Course[]) => {
    const $courseSelect = $("#course");
    const $newLogCourse = $("#newLogCourse");

    // Clear existing options except the placeholder
    $courseSelect.find("option:not(:first)").remove();
    $newLogCourse.find("option:not(:first)").remove();

    // Add each course as an option to both dropdowns
    $.each(data, (_i: number, course: Course) => {
      const $option = $("<option>").val(course.id).text(course.display);
      $courseSelect.append($option);
      $newLogCourse.append($option.clone());
    });
  }).fail((_xhr: JQuery.jqXHR, _status: string, err: string) => {
    console.error("Error loading courses:", err);
  });
}

/**
 * Fetch logs for a given course and UVU ID, then render them.
 */
function fetchLogs(courseId: string, uvuId: string): void {
  $.get(
    `${API_BASE}/logs`,
    { courseId: courseId, uvuId: uvuId },
    (data: LogEntry[]) => {
      renderLogs(data);
      // Show the add-log form and enable the course dropdown
      $("#addLogForm").show();
      $("#newLogCourse").prop("disabled", false);
      $("#newLogCourse").val(courseId);
      $("#newLogUvuId").val(uvuId);
    }
  ).fail((_xhr: JQuery.jqXHR, _status: string, err: string) => {
    console.error("Error fetching logs:", err);
  });
}

/**
 * Render an array of log entries into the #logs container.
 * Each log is a Bootstrap accordion item that expands on click.
 */
function renderLogs(logs: LogEntry[]): void {
  const $logsContainer = $("#logs");
  $logsContainer.empty();

  if (logs.length === 0) {
    $logsContainer.append(
      $("<p>")
        .addClass("text-muted fst-italic")
        .text("No logs found for this student/course combination.")
    );
    return;
  }

  const $accordion = $("<div>")
    .addClass("accordion")
    .attr("id", "logsAccordion");

  $.each(logs, (i: number, log: LogEntry) => {
    const collapseId: string = `collapse-${i}`;
    const headingId: string = `heading-${i}`;

    // Format the date for display
    const dateStr: string = new Date(log.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Build the accordion item using jQuery
    const $item = $("<div>").addClass("accordion-item");

    const $header = $("<h2>").addClass("accordion-header").attr("id", headingId);

    const $button = $("<button>")
      .addClass("accordion-button collapsed")
      .attr({
        type: "button",
        "data-bs-toggle": "collapse",
        "data-bs-target": `#${collapseId}`,
        "aria-expanded": "false",
        "aria-controls": collapseId,
      })
      .text(dateStr);

    const $collapseDiv = $("<div>")
      .addClass("accordion-collapse collapse")
      .attr({ id: collapseId, "aria-labelledby": headingId, "data-bs-parent": "#logsAccordion" });

    const $body = $("<div>").addClass("accordion-body").text(log.text);

    // Assemble
    $header.append($button);
    $collapseDiv.append($body);
    $item.append($header).append($collapseDiv);
    $accordion.append($item);
  });

  $logsContainer.append($accordion);
}