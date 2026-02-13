// Student Logs App
// All AJAX uses axios (CDN loaded in index.html)

// API base URL - update this if your StackBlitz URL changes
const API_BASE =
  'https://jsonserverjh9ne2-bwrx--3000--31fc58ec.local-corp.webcontainer.io';

// grab all the elements we need from the page
const courseSelect = document.getElementById('course');
const uvuIdInput = document.getElementById('uvuId');
const uvuIdDisplay = document.getElementById('uvuIdDisplay');
const logsList = document.querySelector('ul[data-cy="logs"]');
const textarea = document.querySelector('textarea');
const addButton = document.querySelector('button[data-cy="add_log_btn"]');
const themeToggle = document.getElementById('themeToggle');

// ========== DARK/LIGHT MODE ==========
// Assignment requires checking in this order:
// 1. User's stored preference (localStorage)
// 2. Browser preference
// 3. OS preference
// 4. Default to light if none found

// check if user saved a theme preference before
function getUserPref() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'unknown';
}

// check what the browser prefers
function getBrowserPref() {
  if (window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches)
      return 'light';
  }
  return 'unknown';
}

// check what the OS prefers
// note: browser usually reads this from the OS, so they tend to match
function getOSPref() {
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches)
      return 'light';
  } catch (e) {
    // matchMedia might not be supported
  }
  return 'unknown';
}

// apply the theme by adding a class to body
function applyTheme(theme) {
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(theme);
  // update button text to show the opposite option
  if (theme === 'dark') {
    themeToggle.textContent = '☀️ Light';
  } else {
    themeToggle.textContent = '🌙 Dark';
  }
}

// run on page load - figure out which theme to use
function initTheme() {
  const userPref = getUserPref();
  const browserPref = getBrowserPref();
  const osPref = getOSPref();

  // print to console as required by assignment
  console.log('User Pref: ' + userPref);
  console.log('Browser Pref: ' + browserPref);
  console.log('OS Pref: ' + osPref);

  // cascade: start with default, override with each level if it exists
  let theme = 'light';
  if (osPref !== 'unknown') theme = osPref;
  if (browserPref !== 'unknown') theme = browserPref;
  if (userPref !== 'unknown') theme = userPref;

  applyTheme(theme);
}

// when user clicks the toggle, switch theme and save it
themeToggle.addEventListener('click', function () {
  const current = document.body.classList.contains('dark') ? 'dark' : 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
});

// initialize theme on page load
initTheme();

// ========== COURSE SELECT / UVU ID VISIBILITY ==========

// hide the UVU ID input and label until a course is picked
uvuIdInput.style.display = 'none';
document.querySelector('label[for="uvuId"]').style.display = 'none';

// show/hide UVU ID input based on course selection
courseSelect.addEventListener('change', function () {
  if (courseSelect.value !== '') {
    // course selected - show the input
    uvuIdInput.style.display = 'block';
    document.querySelector('label[for="uvuId"]').style.display = 'block';
  } else {
    // course unselected - hide input and clear everything
    uvuIdInput.style.display = 'none';
    document.querySelector('label[for="uvuId"]').style.display = 'none';
    logsList.innerHTML = '';
    uvuIdDisplay.textContent = '';
    uvuIdInput.value = '';
  }
});

// ========== FETCH COURSES ==========
// load course options from the API using axios
axios
  .get(API_BASE + '/api/v1/courses')
  .then(function (response) {
    var data = response.data;
    // loop through each course and add it as a dropdown option
    data.forEach(function (course) {
      var option = document.createElement('option');
      option.value = course.id;
      option.textContent = course.display;
      courseSelect.appendChild(option);
    });
  })
  .catch(function (error) {
    console.error('Error fetching courses:', error);
  });

// ========== FETCH LOGS ==========
// tracks whether logs have been loaded (used for button enable/disable)
var logsLoaded = false;

// when user types in the UVU ID field
uvuIdInput.addEventListener('input', function () {
  // strip out anything that isn't a number
  uvuIdInput.value = uvuIdInput.value.replace(/[^0-9]/g, '');

  var uvuId = uvuIdInput.value;

  // once we have 8 digits, fetch the logs
  if (uvuId.length === 8) {
    var courseId = courseSelect.value;
    uvuIdDisplay.textContent = 'Student Logs for ' + uvuId;

    // get logs for this student and course
    axios
      .get(API_BASE + '/api/v1/logs', {
        params: {
          courseId: courseId,
          uvuId: uvuId,
        },
      })
      .then(function (response) {
        var logs = response.data;
        logsList.innerHTML = ''; // clear old logs

        if (logs.length === 0) {
          logsList.innerHTML = '<li>No logs found for this student.</li>';
        }

        // build each log entry and add it to the list
        logs.forEach(function (log) {
          var li = document.createElement('li');
          li.innerHTML =
            '<div><small>' +
            log.date +
            '</small></div>' +
            '<pre><p>' +
            log.text +
            '</p></pre>';

          // clicking a log toggles the text visibility
          li.addEventListener('click', function () {
            var text = li.querySelector('pre');
            if (text.style.display === 'none') {
              text.style.display = 'block';
            } else {
              text.style.display = 'none';
            }
          });

          logsList.appendChild(li);
        });

        logsLoaded = true;
        checkButton();
      })
      .catch(function (error) {
        console.error('Error fetching logs:', error);
        logsList.innerHTML =
          '<li>Error loading logs. Check your connection.</li>';
      });
  } else {
    // not 8 digits yet - clear display
    uvuIdDisplay.textContent = '';
    logsList.innerHTML = '';
    logsLoaded = false;
    checkButton();
  }
});

// ========== BUTTON ENABLE/DISABLE ==========
// button should only be enabled when logs are showing AND textarea has text
function checkButton() {
  if (logsLoaded && textarea.value.trim() !== '') {
    addButton.disabled = false;
  } else {
    addButton.disabled = true;
  }
}

// re-check button state whenever user types in textarea
textarea.addEventListener('input', checkButton);

// ========== ADD NEW LOG ==========
addButton.addEventListener('click', function (e) {
  e.preventDefault(); // stop form from actually submitting/refreshing

  var uvuId = uvuIdInput.value;
  var courseId = courseSelect.value;
  var logText = textarea.value.trim();

  if (!logText) return; // don't submit empty logs

  // build the log object to send to the server
  var now = new Date();
  var dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

  var newLog = {
    courseId: courseId,
    uvuId: uvuId,
    date: dateStr,
    text: logText,
  };

  // send the new log to the server
  axios
    .post(API_BASE + '/api/v1/logs', newLog)
    .then(function (response) {
      // add the new log to the page so user can see it right away
      var li = document.createElement('li');
      li.innerHTML =
        '<div><small>' +
        dateStr +
        '</small></div>' +
        '<pre><p>' +
        logText +
        '</p></pre>';

      // same toggle behavior as other logs
      li.addEventListener('click', function () {
        var text = li.querySelector('pre');
        if (text.style.display === 'none') {
          text.style.display = 'block';
        } else {
          text.style.display = 'none';
        }
      });

      logsList.appendChild(li);
      textarea.value = ''; // clear the textarea
      checkButton(); // re-disable the button
    })
    .catch(function (error) {
      console.error('Error adding log:', error);
      alert('Could not save log. Try again.');
    });
});
