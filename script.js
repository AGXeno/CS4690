// Student Logs App - TypeScript + jQuery
// All DOM manipulation uses jQuery (no document.* or window.*)
// All AJAX uses jQuery $.get / $.ajax (no axios or fetch)
// --- Constants ---
var API_BASE = "http://localhost:3000";
// --- jQuery ready (replaces window.onload) ---
$(function () {
    // Load saved theme from localStorage
    var savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        $("html").attr("data-bs-theme", "dark");
        $("#themeToggle").text("☀️ Light Mode");
    }
    // Fetch courses on page load
    loadCourses();
    // --- Event: Theme toggle (Extra Credit) ---
    $("#themeToggle").on("click", function () {
        var current = $("html").attr("data-bs-theme") || "light";
        if (current === "light") {
            $("html").attr("data-bs-theme", "dark");
            $("#themeToggle").text("☀️ Light Mode");
            localStorage.setItem("theme", "dark");
        }
        else {
            $("html").attr("data-bs-theme", "light");
            $("#themeToggle").text("🌙 Dark Mode");
            localStorage.setItem("theme", "light");
        }
    });
    // --- Event: UVU ID input ---
    $("#uvuId").on("input", function () {
        var val = $(this).val();
        // Only allow digits, max 8 characters
        var cleaned = val.replace(/\D/g, "").slice(0, 8);
        $(this).val(cleaned);
        if (cleaned.length === 8) {
            $("#uvuIdError").text("");
            $("#course").prop("disabled", false);
            // Populate the add-log form's UVU ID field
            $("#newLogUvuId").val(cleaned);
            // If a course is already selected, fetch logs
            var selectedCourse = $("#course").val();
            if (selectedCourse) {
                fetchLogs(selectedCourse, cleaned);
            }
        }
        else {
            $("#course").prop("disabled", true);
            $("#logs").empty();
            $("#addLogForm").hide();
            if (cleaned.length > 0) {
                $("#uvuIdError").text("UVU ID must be 8 digits");
            }
            else {
                $("#uvuIdError").text("");
            }
        }
    });
    // --- Event: Course selection ---
    $("#course").on("change", function () {
        var courseId = $(this).val();
        var uvuId = $("#uvuId").val();
        if (courseId && uvuId.length === 8) {
            fetchLogs(courseId, uvuId);
            // Sync the add-log form's course dropdown
            $("#newLogCourse").val(courseId);
        }
        else {
            $("#logs").empty();
            $("#addLogForm").hide();
        }
    });
    // --- Event: Add Log form submission ---
    $("#addLogForm").on("submit", function (e) {
        e.preventDefault();
        var courseId = $("#newLogCourse").val();
        var uvuId = $("#newLogUvuId").val();
        var text = $.trim($("#newLogText").val());
        if (!courseId || !uvuId || !text)
            return;
        var newLog = {
            courseId: courseId,
            uvuId: uvuId,
            date: new Date().toISOString(),
            text: text,
        };
        // POST new log using jQuery AJAX
        $.ajax({
            url: "".concat(API_BASE, "/logs"),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(newLog),
            success: function () {
                $("#newLogText").val("");
                // Refresh the logs display
                fetchLogs(courseId, uvuId);
            },
            error: function (_xhr, _status, err) {
                console.error("Error adding log:", err);
            },
        });
    });
    // --- Event: Enable/disable add log button based on textarea content ---
    $("#newLogText").on("input", function () {
        var text = $.trim($(this).val());
        $("[data-cy='add_log_btn']").prop("disabled", text.length === 0);
    });
    // --- Event: Enable/disable add course button based on inputs ---
    $("#newCourseId, #newCourseDisplay").on("input", function () {
        var id = $.trim($("#newCourseId").val());
        var display = $.trim($("#newCourseDisplay").val());
        $("[data-cy='add_course_btn']").prop("disabled", !id || !display);
    });
    // --- Event: Add Course form submission ---
    $("#addCourseForm").on("submit", function (e) {
        e.preventDefault();
        var id = $.trim($("#newCourseId").val());
        var display = $.trim($("#newCourseDisplay").val());
        if (!id || !display)
            return;
        var newCourse = { id: id, display: display };
        $.ajax({
            url: "".concat(API_BASE, "/courses"),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(newCourse),
            success: function () {
                $("#newCourseId").val("");
                $("#newCourseDisplay").val("");
                $("[data-cy='add_course_btn']").prop("disabled", true);
                // Auto-update GUI: refresh course dropdowns
                loadCourses();
            },
            error: function (_xhr, _status, err) {
                console.error("Error adding course:", err);
            },
        });
    });
});
// --- Functions ---
/**
 * Fetch all courses from the API and populate both dropdowns.
 */
function loadCourses() {
    $.get("".concat(API_BASE, "/courses"), function (data) {
        var $courseSelect = $("#course");
        var $newLogCourse = $("#newLogCourse");
        // Clear existing options except the placeholder
        $courseSelect.find("option:not(:first)").remove();
        $newLogCourse.find("option:not(:first)").remove();
        // Add each course as an option to both dropdowns
        $.each(data, function (_i, course) {
            var $option = $("<option>").val(course.id).text(course.display);
            $courseSelect.append($option);
            $newLogCourse.append($option.clone());
        });
    }).fail(function (_xhr, _status, err) {
        console.error("Error loading courses:", err);
    });
}
/**
 * Fetch logs for a given course and UVU ID, then render them.
 */
function fetchLogs(courseId, uvuId) {
    $.get("".concat(API_BASE, "/logs"), { courseId: courseId, uvuId: uvuId }, function (data) {
        renderLogs(data);
        // Show the add-log form and enable the course dropdown
        $("#addLogForm").show();
        $("#newLogCourse").prop("disabled", false);
        $("#newLogCourse").val(courseId);
        $("#newLogUvuId").val(uvuId);
    }).fail(function (_xhr, _status, err) {
        console.error("Error fetching logs:", err);
    });
}
/**
 * Render an array of log entries into the #logs container.
 * Each log is a Bootstrap accordion item that expands on click.
 */
function renderLogs(logs) {
    var $logsContainer = $("#logs");
    $logsContainer.empty();
    if (logs.length === 0) {
        $logsContainer.append($("<p>")
            .addClass("text-muted fst-italic")
            .text("No logs found for this student/course combination."));
        return;
    }
    var $accordion = $("<div>")
        .addClass("accordion")
        .attr("id", "logsAccordion");
    $.each(logs, function (i, log) {
        var collapseId = "collapse-".concat(i);
        var headingId = "heading-".concat(i);
        // Format the date for display
        var dateStr = new Date(log.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        // Build the accordion item using jQuery
        var $item = $("<div>").addClass("accordion-item");
        var $header = $("<h2>").addClass("accordion-header").attr("id", headingId);
        var $button = $("<button>")
            .addClass("accordion-button collapsed")
            .attr({
            type: "button",
            "data-bs-toggle": "collapse",
            "data-bs-target": "#".concat(collapseId),
            "aria-expanded": "false",
            "aria-controls": collapseId,
        })
            .text(dateStr);
        var $collapseDiv = $("<div>")
            .addClass("accordion-collapse collapse")
            .attr({ id: collapseId, "aria-labelledby": headingId, "data-bs-parent": "#logsAccordion" });
        var $body = $("<div>").addClass("accordion-body").text(log.text);
        // Assemble
        $header.append($button);
        $collapseDiv.append($body);
        $item.append($header).append($collapseDiv);
        $accordion.append($item);
    });
    $logsContainer.append($accordion);
}
