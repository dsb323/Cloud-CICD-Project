/* ==========================================================================
   Cloud-CICD-Project — интерактивность
   1. Переключение светлой/тёмной темы с сохранением выбора
   2. Подсветка активного раздела в навигации
   3. Фильтрация проектов по категориям
   4. Валидация демо-формы обратной связи
   5. Кнопка «наверх» и тень шапки при прокрутке
   ========================================================================== */

(function () {
  'use strict';

  var THEME_KEY = 'cloud-cicd-theme';
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle ? themeToggle.querySelector('.theme-toggle__icon') : null;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Тема ---------- */
  function readStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      /* Приватный режим браузера может запрещать localStorage — это не критично. */
    }
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;

    if (themeToggle) {
      var isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      themeToggle.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    }

    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    if (persist) {
      storeTheme(theme);
    }
  }

  var storedTheme = readStoredTheme();
  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(storedTheme || (systemPrefersDark ? 'dark' : 'light'), false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------- 2. Активный раздел в навигации ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length > 0) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* ---------- 3. Фильтр проектов ---------- */
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var projectCards = Array.prototype.slice.call(document.querySelectorAll('#projects-grid [data-category]'));
  var projectsCount = document.getElementById('projects-count');

  function applyFilter(filter) {
    var visible = 0;

    projectCards.forEach(function (card) {
      var matches = filter === 'all' || card.dataset.category === filter;
      card.hidden = !matches;
      if (matches) {
        visible += 1;
      }
    });

    filterButtons.forEach(function (button) {
      var isActive = button.dataset.filter === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    if (projectsCount) {
      projectsCount.textContent = 'Показано ' + visible + ' из ' + projectCards.length + ' проектов';
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      applyFilter(button.dataset.filter);
    });
  });

  /* ---------- 4. Валидация формы ---------- */
  var form = document.getElementById('contact-form');
  var formStatus = document.getElementById('form-status');

  var validators = {
    name: function (value) {
      return value.trim().length >= 2 ? '' : 'Введите имя: минимум 2 символа.';
    },
    email: function (value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
        ? ''
        : 'Введите корректный адрес электронной почты.';
    },
    message: function (value) {
      return value.trim().length >= 10 ? '' : 'Сообщение должно содержать минимум 10 символов.';
    }
  };

  function showFieldError(input, message) {
    var field = input.closest('.field');
    var error = document.getElementById(input.id + '-error');
    var hasError = Boolean(message);

    if (field) {
      field.classList.toggle('has-error', hasError);
    }

    input.setAttribute('aria-invalid', String(hasError));

    if (error) {
      error.textContent = message;
    }
  }

  function validateField(input) {
    var validator = validators[input.name];

    if (!validator) {
      return true;
    }

    var message = validator(input.value);
    showFieldError(input, message);
    return message === '';
  }

  function setStatus(message, state) {
    if (!formStatus) {
      return;
    }

    formStatus.textContent = message;
    if (state) {
      formStatus.dataset.state = state;
    } else {
      delete formStatus.dataset.state;
    }
  }

  if (form) {
    var formFields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    var submitButton = form.querySelector('button[type="submit"]');

    formFields.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });

      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          validateField(input);
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var isValid = formFields.map(validateField).every(Boolean);

      if (!isValid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.focus();
        }
        setStatus('Проверьте выделенные поля.', 'error');
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
      }
      setStatus('Отправляем сообщение…', 'loading');

      /* Демонстрация асинхронной отправки: реального запроса к серверу нет. */
      window.setTimeout(function () {
        form.reset();
        formFields.forEach(function (input) {
          showFieldError(input, '');
        });

        if (submitButton) {
          submitButton.disabled = false;
        }

        setStatus('Спасибо! Это демо-форма: данные никуда не отправляются.', 'success');
      }, 900);
    });
  }

  /* ---------- 5. Прокрутка: шапка и кнопка «наверх» ---------- */
  var header = document.querySelector('.site-header');
  var toTopButton = document.getElementById('to-top');
  var ticking = false;

  function updateScrollState() {
    var scrolled = window.scrollY > 8;

    if (header) {
      header.classList.toggle('is-scrolled', scrolled);
    }

    if (toTopButton) {
      toTopButton.hidden = window.scrollY < 500;
    }

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateScrollState();

  if (toTopButton) {
    toTopButton.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* ---------- Год в подвале ---------- */
  var yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
})();
