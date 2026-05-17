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
        area: formData.get('area'),
        phone: formData.get('phone'),
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
    const message = `Здравствуйте! Хочу получить расчет стоимости кондиционера.\nПлощадь помещения: ${data.area} м²\nТелефон: ${data.phone}`;
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
    const area = form.querySelector('input[name="area"]');
    const phone = form.querySelector('input[name="phone"]');
    
    let isValid = true;
    
    // Validate area
    if (!area.value || parseInt(area.value) < 10 || parseInt(area.value) > 500) {
        area.style.borderColor = '#dc3545';
        isValid = false;
    } else {
        area.style.borderColor = '#E0E0E0';
    }
    
    // Validate phone
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
    const finalCta = document.querySelector('.final-cta');
    if (finalCta) {
        finalCta.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus on first input after scroll
        setTimeout(() => {
            const input = document.querySelector('#finalArea');
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
        '.problem-card, .solution-card, .advantage-card, .featured-service-card, .secondary-service-item, .process-step, .proof-card'
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


