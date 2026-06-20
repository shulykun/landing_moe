// Yandex Metrika — virtual pageviews
(function() {
    function hit(url) {
        if (typeof ym === 'function') {
            ym(109687297, 'hit', url);
        }
    }

    // --- Навигация (меню) ---
    document.querySelectorAll('.site-nav a').forEach(function(a) {
        a.addEventListener('click', function() {
            hit('/nav/' + a.textContent.trim().toLowerCase().replace(/\s+/g, '-'));
        });
    });

    // --- CTA-кнопки (data-modal) ---
    document.querySelectorAll('[data-modal]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            hit('/cta/' + btn.textContent.trim().toLowerCase().replace(/\s+/g, '-'));
        });
    });

    // --- Кнопка Расчёт в навигации ---
    var navCta = document.querySelector('.site-nav-cta');
    if (navCta) {
        navCta.addEventListener('click', function() {
            hit('/nav/raschet');
        });
    }

    // --- Hero мобильный CTA ---
    var heroCta = document.querySelector('.hero-cta-mobile');
    if (heroCta) {
        heroCta.addEventListener('click', function() {
            hit('/cta/hero-mobile-raschet');
        });
    }

    // --- Бренды (клик по тегу) ---
    document.querySelectorAll('.brand-tag').forEach(function(btn) {
        btn.addEventListener('click', function() {
            hit('/brand/' + btn.dataset.brand);
        });
    });

    // --- Ссылка на сайт бренда ---
    document.addEventListener('click', function(e) {
        var link = e.target.closest('.brand-showcase-link');
        if (link) {
            var brandName = link.textContent.replace(/[^\w\s]/g, '').trim().split(' ').pop().toLowerCase();
            hit('/brand/' + brandName + '/site');
        }
    });

    // --- Telegram ---
    document.querySelectorAll('a[href*="t.me/climate_hall"]').forEach(function(a) {
        a.addEventListener('click', function() {
            hit('/social/telegram');
        });
    });

    // --- МАКС ---
    document.querySelectorAll('a[href*="max.ru"]').forEach(function(a) {
        a.addEventListener('click', function() {
            hit('/social/maks');
        });
    });

    // --- WhatsApp ---
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
        a.addEventListener('click', function() {
            hit('/social/whatsapp');
        });
    });

    // --- Кнопка «Что входит в мойку» ---
    var washBtn = document.querySelector('a[href="#maintenance-detail"]');
    if (washBtn) {
        washBtn.addEventListener('click', function() {
            hit('/cta/chto-vhodit-v-moyku');
        });
    }

    // --- Форма отправлена ---
    document.addEventListener('submit', function(e) {
        var formId = e.target.id || 'unknown';
        hit('/form/submit/' + formId);
    });
})();

// Sticky header: hide logo on scroll
(function() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                header.classList.toggle('scrolled', window.scrollY > 60);
                ticking = false;
            });
            ticking = true;
        }
    });
})();

// Dynamically set brand-tags sticky top to match header height
(function() {
    const header = document.querySelector('.site-header');
    const tags = document.querySelector('.brand-tags');
    if (!header || !tags) return;
    const ro = new ResizeObserver(function() {
        tags.style.top = header.offsetHeight + 'px';
    });
    ro.observe(header);
})();

// Phone mask
function initPhoneMask() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            
            if (value.startsWith('7')) {
                let formatted = '+7';
                if (value.length > 1) {
                    formatted += ' (' + value.slice(1, 4);
                }
                if (value.length >= 4) {
                    formatted += ') ' + value.slice(4, 7);
                }
                if (value.length >= 7) {
                    formatted += '-' + value.slice(7, 9);
                }
                if (value.length >= 9) {
                    formatted += '-' + value.slice(9, 11);
                }
                e.target.value = formatted;
            } else if (value.length > 0) {
                e.target.value = '+7 (' + value.slice(0, 3);
                if (value.length >= 3) {
                    e.target.value += ') ' + value.slice(3, 6);
                }
                if (value.length >= 6) {
                    e.target.value += '-' + value.slice(6, 8);
                }
                if (value.length >= 8) {
                    e.target.value += '-' + value.slice(8, 10);
                }
            }
        });
        
        input.addEventListener('focus', function(e) {
            if (!e.target.value) {
                e.target.value = '+7 (';
            }
        });
    });
}

// Form submission handler
function handleFormSubmit(formId, formData) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    const phone = formData.get('phone') || '';
    const message = formData.get('message') || '';
    const fileInput = formData.get('file');

    // Собираем данные для отправки
    const payload = new FormData();
    payload.append('phone', phone);
    payload.append('message', message);
    payload.append('page', window.location.href);
    if (fileInput && fileInput.name) {
        payload.append('file', fileInput);
    }

    // Отправка на свой PHP-обработчик
    fetch('sendmail.php', {
        method: 'POST',
        body: payload
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.success) {
            showSuccessMessage(formId);
        } else {
            alert('Ошибка отправки: ' + (data.error || 'попробуйте позже'));
        }
    })
    .catch(function(err) {
        console.error('Send error:', err);
        // Фолбэк: открыть WhatsApp
        var msg = 'Здравствуйте! Хочу получить расчёт.\n' + message + '\nТелефон: ' + phone;
        window.open('https://wa.me/79143350675?text=' + encodeURIComponent(msg), '_blank');
    });

    formEl.reset();
}

// Show success message
function showSuccessMessage(formId) {
    const form = document.getElementById(formId);
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
        background-color: #28A745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-top: 15px;
        text-align: center;
        font-weight: 500;
        animation: fadeIn 0.3s ease;
    `;
    successMessage.textContent = '✓ Спасибо! Мы свяжемся с вами в ближайшее время.';
    
    form.appendChild(successMessage);
    
    setTimeout(() => {
        successMessage.remove();
    }, 5000);
}

// Form validation
function validateForm(form) {
    const message = form.querySelector('#message');
    const phone = form.querySelector('input[name="phone"]');

    let isValid = true;

    if (!message.value.trim()) {
        message.style.borderColor = '#dc3545';
        isValid = false;
    } else {
        message.style.borderColor = '#E0E0E0';
    }

    const phoneValue = phone.value.replace(/\D/g, '');
    if (!phone.value || phoneValue.length < 11) {
        phone.style.borderColor = '#dc3545';
        isValid = false;
    } else {
        phone.style.borderColor = '#E0E0E0';
    }

    return isValid;
}

// Scroll to form
// Modal form
(function() {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const closeBtn = document.getElementById('modalClose');
    const modalForm = document.getElementById('modalForm');
    if (!overlay) return;

    function openModal(title) {
        if (modalTitle) modalTitle.textContent = title || 'Получить расчёт';
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const phoneInput = document.getElementById('modal-phone');
        if (phoneInput) setTimeout(function() { phoneInput.focus(); }, 300);
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        if (modalForm) modalForm.reset();
    }

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });

    // Close on × button
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // CTA buttons — open modal with button text as title
    document.querySelectorAll('[data-modal]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            openModal(btn.textContent.trim());
        });
    });

    // Nav "Расчёт" link
    var navCta = document.querySelector('.site-nav-cta');
    if (navCta) {
        navCta.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(navCta.textContent.trim());
        });
    }

    // Hero mobile CTA
    var heroCta = document.querySelector('.hero-cta-mobile');
    if (heroCta) {
        heroCta.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(heroCta.textContent.trim());
        });
    }

    // Modal form submit
    if (modalForm) {
        modalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(modalForm);
            handleFormSubmit('modalForm', formData);
            closeModal();
        });
    }
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.service-block-media img, .why-us-card, .lead-magnet, .telegram-mock, .expert-photo'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize phone mask
    initPhoneMask();
    
    // Handle hero form submission
    const heroForm = document.getElementById('heroForm');
    if (heroForm) {
        heroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(heroForm)) {
                const formData = new FormData(heroForm);
                handleFormSubmit('heroForm', formData);
            }
        });
    }
    
    // Handle final form submission
    const finalForm = document.getElementById('finalForm');
    if (finalForm) {
        finalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(finalForm)) {
                const formData = new FormData(finalForm);
                handleFormSubmit('finalForm', formData);
            }
        });
    }
    
    // Service CTA buttons (except anchor links)
    document.querySelectorAll('.featured-service-card .btn-secondary, .brizers-text .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const overlay = document.getElementById('modalOverlay');
            const modalTitle = document.getElementById('modalTitle');
            if (overlay) {
                if (modalTitle) modalTitle.textContent = btn.textContent.trim();
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
});

// Analytics tracking (placeholder for Google Analytics or Yandex Metrica)
function trackEvent(category, action, label) {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
    
    // Yandex Metrica
    if (typeof ym !== 'undefined') {
        ym(YANDEX_METRICA_ID, 'reachGoal', action, {
            category: category,
            label: label
        });
    }
    
    console.log('Event tracked:', { category, action, label });
}

// Track form submissions
document.addEventListener('submit', (e) => {
    if (e.target.id === 'heroForm' || e.target.id === 'finalForm') {
        trackEvent('Form', 'Submit', e.target.id);
    }
});

// Track button clicks
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const buttonText = btn.textContent.trim();
        trackEvent('Button', 'Click', buttonText);
    });
});

// Track external links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', () => {
        trackEvent('External Link', 'Click', link.href);
    });
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime, 'ms');

        // Track page load time
        trackEvent('Performance', 'Page Load', Math.round(pageLoadTime));
    }
});

// Brand info data
const brandInfo = {
    energolux: {
        name: 'ENERGOLUX',
        desc: 'Премиальные инверторные сплит-системы с расширенной гарантией 5 лет. Интеллектуальное управление по Wi-Fi, энергоэффективность A+++ и ультратихие режимы.',
        models: [
            { name: '🏆 ENERGOLUX LAUSANNE', desc: 'Дизайнерская серия • Интеллектуальный LED-дисплей • Энергоэффективность A+++ • DC-инвертор, Wi-Fi • Площадь: от 25 м²', image: 'static/images/brands/energolux/energolux_Lausanne-YAndeks-market_7_09.jpeg' },
            { name: '⭐ ENERGOLUX ZURICH 4', desc: 'Продвинутая серия • 3D-распределение воздуха • Многоступенчатая фильтрация • DC-инвертор, самоочистка • Площадь: от 20 м²', image: 'static/images/brands/energolux/energolux_Render_ProjectZurich_002.png' },
            { name: '🌙 ENERGOLUX DAVOS', desc: 'Ультратихая серия • Шум всего 20 дБ • Идеален для ночного режима • Инвертор, Wi-Fi • Площадь: от 15 м²', image: 'static/images/brands/energolux/energolux_DAVOS-YAndeks-market_1_09.jpg' }
        ],
        link: 'https://energolux.ru.com/catalog/split-sistemy/'
    },
    tosot: {
        name: 'TOSOT',
        desc: 'Бренд от корпорации Gree — мирового лидера по производству климатической техники. Отличное соотношение цены и качества, гарантия до 5 лет.',
        models: [
            { name: 'TOSOT Clivia DELUXE', desc: 'Флагман с адаптивным ИИ и энергоэффективностью A+++.', image: 'static/images/brands/tosot_clivia.png' },
            { name: 'TOSOT Synergy', desc: 'Премиальный тепловой насос с эксклюзивным дизайном, A+++.', image: 'static/images/brands/tosot_synergy.png' },
            { name: 'TOSOT Lyra X', desc: 'Новое поколение популярной LYRA — классический дизайн, актуальные характеристики.', image: 'static/images/brands/tosot_lyra.png' },
            { name: 'TOSOT Natal Инвертор', desc: 'Базовая инверторная модель 2024 года с полным набором технологий.', image: 'static/images/brands/tosot_natal.png' }
        ],
        link: 'https://tosot.ru'
    },
    lessar: {
        name: 'LESSAR',
        desc: 'Надёжный бренд с широкой линейкой бытовых и коммерческих систем. Гарантия до 4 лет, доступная цена и стабильная работа.',
        models: [
            { name: 'LESSAR Stella', desc: 'Флагманская серия с элегантным дизайном и расширенным функционалом.', image: 'static/images/brands/lessar_stella.png' },
            { name: 'LESSAR Tiger', desc: 'Высокая энергоэффективность, быстрое охлаждение и обогрев.', image: 'static/images/brands/lessar_tiger.jpg' },
            { name: 'LESSAR Ego', desc: 'Компактный внутренний блок и тихая работа для домашнего использования.', image: 'static/images/brands/lessar_ego.webp' },
            { name: 'LESSAR Flexcool', desc: 'Универсальная серия с гибкими настройками для дома и малого бизнеса.', image: 'static/images/brands/lessar_flexcool.webp' }
        ],
        link: 'https://lessar.ru'
    },
    dahaci: {
        name: 'Dahaci',
        desc: 'Современный бренд с широким ассортиментом бытовых и полупромышленных кондиционеров. Отличное соотношение цены и качества.',
        models: [
            { name: 'Dahaci DOMI', desc: 'Инверторная настенная сплит-система с Wi-Fi, класс A+++, шум от 22 дБ.', image: '' },
            { name: 'Dahaci HERO', desc: 'Настенная инверторная сплит-система с самоочисткой и обогревом до -25°C.', image: '' },
            { name: 'Dahaci RAY', desc: 'Базовая настенная сплит-система на хладагенте R32, тихая и экономичная.', image: '' }
        ],
        link: 'https://dahaci.biz'
    },
    kentatsu: {
        name: 'Kentatsu',
        desc: 'Японские технологии по доступной цене. Широкий модельный ряд для квартир и офисов. Гарантия 3 года.',
        models: [
            { name: 'Kentatsu OMORI', desc: 'Дизайнерский флагман с A+++, жалюзи 180° и глубоким фильтром очистки.', image: '' },
            { name: 'Kentatsu SEMPAI', desc: 'Биполярный ионизатор, шум от 20,5 дБ, технология Easy Climate Pro.', image: '' },
            { name: 'Kentatsu OTARI', desc: 'Тепловой насос: обогрев до -25°C, охлаждение до -15°C.', image: '' },
            { name: 'Kentatsu YUKI', desc: 'Доступная инверторная серия на R32 с 3D потоком и компактным дизайном.', image: '' }
        ],
        link: 'https://kentatsurussia.ru/catalog/konditsionirovanie/'
    },
    daichi: {
        name: 'Daichi',
        desc: 'Российский бренд с собственной линейкой климатического оборудования. Комфорт и ничего лишнего.',
        models: [
            { name: 'Daichi SIB', desc: 'Базовая инверторная сплит-система с энергоэффективностью класса A.', image: '' },
            { name: 'Daichi ATX', desc: 'Расширенный функционал, Wi-Fi и режим обогрева до -25°C.', image: '' },
            { name: 'Daichi ACE', desc: 'Приток свежего воздуха и многоступенчатая фильтрация для здорового микроклимата.', image: '' },
            { name: 'Daichi Elegant', desc: 'Элегантный дизайн, шум от 19 дБ, управление через приложение Daichi Comfort.', image: '' }
        ],
        link: 'https://daichi-aircon.com/catalog/'
    },
    midea: {
        name: 'Midea',
        desc: 'Один из крупнейших производителей в мире. Отличная базовая функциональность и конкурентная цена. Гарантия 3 года.',
        models: [
            { name: 'Midea MSAG', desc: 'Настенная серия с функцией самоочистки, энергосбережением и Wi-Fi.', image: '' },
            { name: 'Midea Blanc', desc: 'Инверторная настенная серия с элегантным дизайном и режимом Turbo.', image: '' },
            { name: 'Midea MAB', desc: 'Мульти-сплит система — подключение до 5 внутренних блоков.', image: '' },
            { name: 'Midea U-Shaped', desc: 'Инновационная U-образная серия с ультратихим инверторным компрессором.', image: '' }
        ],
        link: 'https://air-midea.com/'
    }
};

function renderBrandShowcase(key) {
    const info = brandInfo[key];
    if (!info) return;

    const showcase = document.getElementById('brandShowcase');
    showcase.innerHTML = `
        <p class="brand-showcase-desc">${info.desc}</p>
        <div class="brand-showcase-grid">
            ${info.models.map(m => `
                <div class="brand-model-card">
                    ${m.image ? `<img src="${m.image}" alt="${m.name}" class="brand-model-img" loading="lazy">` : ''}
                    <h4>${m.name}</h4>
                    <p>${m.desc}</p>
                </div>
            `).join('')}
        </div>
        <p class="sale-note">Подберите любую модель на официальном сайте бренда и обращайтесь к нам — сделаем скидку и обеспечим гарантию.</p>
        <a href="${info.link}" target="_blank" rel="noopener noreferrer" class="brand-showcase-link">Перейти на сайт ${info.name} &rarr;</a>
    `;
}

function initBrandSwitcher() {
    const buttons = document.querySelectorAll('.brand-tag');
    if (!buttons.length) return;

    // Show first brand by default
    const firstKey = buttons[0].dataset.brand;
    renderBrandShowcase(firstKey);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderBrandShowcase(btn.dataset.brand);
        });
    });
}

document.addEventListener('DOMContentLoaded', initBrandSwitcher);


