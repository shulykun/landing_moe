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
    // Here you can integrate with your backend, CRM, or email service
    // For now, we'll use a simple approach
    
    const data = {
        message: formData.get('message'),
        phone: formData.get('phone'),
        fileName: formData.get('file')?.name || '',
        timestamp: new Date().toISOString(),
        source: 'landing_page'
    };
    
    // Log to console (replace with actual API call)
    console.log('Form submission:', data);
    
    // Option 1: Send to Telegram bot (if you have one)
    // sendToTelegram(data);
    
    // Option 2: Send email
    // sendEmail(data);
    
    // Option 3: Send to CRM
    // sendToCRM(data);
    
    // Option 4: Open WhatsApp with pre-filled message
    const message = `Здравствуйте! Хочу получить расчёт.\n${data.message}\nТелефон: ${data.phone}`;
    const whatsappUrl = `https://wa.me/79143350675?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Show success message
    showSuccessMessage(formId);
    
    // Reset form
    document.getElementById(formId).reset();
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
function scrollToForm() {
    const heroForm = document.getElementById('hero-form');
    if (heroForm) {
        heroForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            const input = document.querySelector('#area');
            if (input) {
                input.focus();
            }
        }, 500);
    }
}

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
            scrollToForm();
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
        desc: 'Современный бренд с расширенной гарантией 5 лет. Инверторные сплит-системы с функцией самоочистки, низким уровнем шума и управлением по Wi-Fi.',
        models: [
            { name: 'ENERGOLUX SAS', desc: 'Настенная сплит-система с инвертором. Класс A+++, Wi-Fi, ночной режим.' },
            { name: 'ENERGOLUX SAM', desc: 'Мульти-сплит — до 4 внутренних блоков на один наружный.' },
            { name: 'ENERGOLUX SAD', desc: 'Канальная серия для скрытой установки за подвесным потолком.' }
        ],
        link: 'https://energolux.ru.com/catalog/split-sistemy/'
    },
    tosot: {
        name: 'TOSOT',
        desc: 'Бренд от корпорации Gree — мирового лидера по производству климатической техники. Отличное соотношение цены и качества, расширенная гарантия до 5 лет.',
        models: [
            { name: 'TOSOT TWH', desc: 'Настенная сплит-система с инверторным компрессором. Тихая работа, быстрое охлаждение.' },
            { name: 'TOSOT TAC', desc: 'Кассетная серия для коммерческих помещений. Равномерное распределение воздуха.' },
            { name: 'TOSOT TWD', desc: 'Канальный тип — скрытая установка за потолком. Идеален для ремонта.' }
        ],
        link: 'https://tosot.ru'
    },
    lessar: {
        name: 'LESSAR',
        desc: 'Надёжный бренд с широкой линейкой бытовых и коммерческих систем. Гарантия до 4 лет, доступная цена и стабильная работа.',
        models: [
            { name: 'LS-HV', desc: 'Настенная серия с Wi-Fi управлением. Класс энергоэффективности A++.' },
            { name: 'LS-MUV', desc: 'Мульти-сплит система — до 5 внутренних блоков на один наружный.' },
            { name: 'LS-CUV', desc: 'Кассетная серия для офисов и магазинов с функцией подмеса свежего воздуха.' }
        ],
        link: 'https://lessar.ru'
    },
    daikin: {
        name: 'Daikin',
        desc: 'Японский премиум-бренд. Инверторные технологии, низкий уровень шума и высокая энергоэффективность.',
        models: [
            { name: 'Daikin FTXK', desc: 'Настенная серия с трёхступенчатой очисткой воздуха и ночным режимом.' },
            { name: 'Daikin FTXM', desc: 'Премиум-линейка с датчиком присутствия и интеллектуальным управлением.' },
            { name: 'Daikin FTKC', desc: 'Компактная серия — минимальный внутренний блок, подходит для небольших комнат.' }
        ],
        link: 'https://www.daikin.ru'
    },
    mitsubishi: {
        name: 'Mitsubishi Heavy',
        desc: 'Японское качество для тех, кто ценит долговечность. Одни из самых надёжных кондиционеров на рынке.',
        models: [
            { name: 'SRK-ZM', desc: 'Настенная серия с энергоэффективностью A+++ и фильтром Plasma Quad.' },
            { name: 'SRK-ZJ', desc: 'Премиум-линейка с 3D-автоматикой и датчиком температуры в пульте.' },
            { name: 'FDT', desc: 'Кассетные системы для коммерческих объектов с циркуляцией по всему помещению.' }
        ],
        link: 'https://www.mhi-machinery.co.jp'
    },
    toshiba: {
        name: 'Toshiba',
        desc: 'Японский бренд с богатой историей. Инверторные компрессоры, тихая работа и экономичность.',
        models: [
            { name: 'RAS-BK', desc: 'Настенная серия с ультразвуковым увлажнением и фильтром IAQ.' },
            { name: 'RAS-BKVG', desc: 'Серия с Wi-Fi — управление через приложение из любой точки мира.' },
            { name: 'RAS-M10', desc: 'Мульти-сплит до 4 комнат. Один наружный блок, до 4 внутренних.' }
        ],
        link: 'https://www.toshiba-aircon.com'
    },
    kentatsu: {
        name: 'Kentatsu',
        desc: 'Японские технологии по доступной цене. Широкий модельный ряд для квартир и офисов. Гарантия 3 года.',
        models: [
            { name: 'KSGB', desc: 'Настенная серия с генератором кислорода и ионизатором воздуха.' },
            { name: 'KSRC', desc: 'Кассетная серия для офисов — встроенный дренажный насос, низкий профиль.' },
            { name: 'KSGT', desc: 'Канальный тип для скрытой установки — подача свежего воздуха.' }
        ],
        link: 'https://kentatsu.ru'
    },
    midea: {
        name: 'Midea',
        desc: 'Один из крупнейших производителей в мире. Отличная базовая функциональность и конкурентная цена. Гарантия 3 года.',
        models: [
            { name: 'MSAG', desc: 'Настенная серия с функцией самоочистки и режимом энергосбережения.' },
            { name: 'MAB', desc: 'Мульти-сплит система — подключение до 5 внутренних блоков.' },
            { name: 'MCA', desc: 'Кассетная серия с автоматической заслонкой и таймером работы.' }
        ],
        link: 'https://www.midea.com'
    },
    fujitsu: {
        name: 'Fujitsu',
        desc: 'Японский бренд с фокусом на энергоэффективность и комфорт. Тихие и экономичные сплит-системы.',
        models: [
            { name: 'ASYG', desc: 'Настенная серия с минимальным шумом 21 дБ и режимом «тихий сон».' },
            { name: 'AOYG', desc: 'Наружные блоки с двухроторным компрессором — высокая надёжность.' },
            { name: 'AUYG', desc: 'Канальные системы для скрытой установки с функцией подогрева.' }
        ],
        link: 'https://www.fujitsu-general.com'
    },
    lg: {
        name: 'LG',
        desc: 'Корейский технологический гигант. Стильный дизайн, умное управление через приложение, тихая работа.',
        models: [
            { name: 'LG S13EW', desc: 'Настенная серия с Dual Inverter — на 40% быстрее охлаждает и на 70% экономичнее.' },
            { name: 'LG Dual Inverter', desc: 'С двойным инверторным компрессором — сверхтихая работа и долгий ресурс.' },
            { name: 'LG Art Cool', desc: 'Дизайнерская серия с интерьерной панелью — кондиционер как элемент декора.' }
        ],
        link: 'https://www.lg.com'
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
                    <h4>${m.name}</h4>
                    <p>${m.desc}</p>
                </div>
            `).join('')}
        </div>
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


