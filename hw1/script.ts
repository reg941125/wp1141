// 導航功能
class Navigation {
    private navLinks: NodeListOf<Element>;
    private sections: NodeListOf<Element>;

    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section');
        this.init();
    }

    private init(): void {
        this.setupSmoothScrolling();
        this.setupActiveLink();
        this.setupScrollSpy();
    }

    private setupSmoothScrolling(): void {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href')?.substring(1);
                if (targetId) {
                    this.scrollToSection(targetId);
                }
            });
        });
    }

    private scrollToSection(sectionId: string): void {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            const headerHeight = document.querySelector('.header')?.clientHeight || 0;
            const targetPosition = targetSection.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    private setupActiveLink(): void {
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // 移除所有active類
                this.navLinks.forEach(navLink => navLink.classList.remove('active'));
                // 添加active類到當前點擊的鏈接
                link.classList.add('active');
            });
        });
    }

    private setupScrollSpy(): void {
        window.addEventListener('scroll', () => {
            let currentSection = '';
            
            this.sections.forEach(section => {
                const htmlElement = section as HTMLElement;
                const sectionTop = htmlElement.offsetTop - 100;
                const sectionHeight = htmlElement.clientHeight;
                
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id') || '';
                }
            });

            // 更新導航鏈接的active狀態
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        });
    }
}

// 聯繫表單功能
class ContactForm {
    private form: HTMLFormElement;
    private submitButton: HTMLButtonElement;

    constructor() {
        this.form = document.getElementById('contactForm') as HTMLFormElement;
        this.submitButton = this.form.querySelector('.submit-button') as HTMLButtonElement;
        this.init();
    }

    private init(): void {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupFormValidation();
    }

    private handleSubmit(e: Event): void {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const message = formData.get('message') as string;

        // 顯示載入狀態
        this.submitButton.textContent = '發送中...';
        this.submitButton.disabled = true;

        // 模擬發送過程
        setTimeout(() => {
            this.showSuccessMessage();
            this.form.reset();
            this.submitButton.textContent = '發送訊息';
            this.submitButton.disabled = false;
        }, 2000);
    }

    private showSuccessMessage(): void {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = '訊息已成功發送！我會盡快回覆您。';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #1e3a8a;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    private setupFormValidation(): void {
        const inputs = this.form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input as HTMLInputElement | HTMLTextAreaElement));
            input.addEventListener('input', () => this.clearError(input as HTMLInputElement | HTMLTextAreaElement));
        });
    }

    private validateField(field: HTMLInputElement | HTMLTextAreaElement): void {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = '此欄位為必填';
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = '請輸入有效的電子信箱';
            }
        }

        this.showFieldError(field, isValid, errorMessage);
    }

    private showFieldError(field: HTMLInputElement | HTMLTextAreaElement, isValid: boolean, message: string): void {
        const existingError = field.parentElement?.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                color: #ff0000;
                font-size: 0.8rem;
                margin-top: 0.25rem;
            `;
            field.parentElement?.appendChild(errorDiv);
            field.style.borderColor = '#1e3a8a';
        } else {
            field.style.borderColor = '#555555';
        }
    }

    private clearError(field: HTMLInputElement | HTMLTextAreaElement): void {
        const errorMessage = field.parentElement?.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        field.style.borderColor = '#555555';
    }
}

// 動畫效果
class AnimationController {
    private observer: IntersectionObserver;

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupIntersectionObserver();
        this.observeElements();
    }

    private setupIntersectionObserver(): void {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    private observeElements(): void {
        const elementsToAnimate = document.querySelectorAll('.about-item, .skill-category, .contact-form, .hero-text');
        elementsToAnimate.forEach(element => {
            this.observer.observe(element);
        });
    }
}

// 打字機效果
class TypewriterEffect {
    private element: HTMLElement;
    private text: string;
    private speed: number;
    private currentIndex: number;

    constructor(element: HTMLElement, text: string, speed: number = 100) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.currentIndex = 0;
        this.init();
    }

    private init(): void {
        this.element.textContent = '';
        this.type();
    }

    private type(): void {
        if (this.currentIndex < this.text.length) {
            this.element.textContent += this.text.charAt(this.currentIndex);
            this.currentIndex++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// 工具函數
function scrollToSection(sectionId: string): void {
    const navigation = new Navigation();
    (navigation as any).scrollToSection(sectionId);
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化導航
    new Navigation();
    
    // 初始化聯繫表單
    new ContactForm();
    
    // 初始化動畫控制器
    new AnimationController();
    
    // 為標題添加打字機效果
    const heroTitle = document.querySelector('.hero-title') as HTMLElement;
    if (heroTitle) {
        const originalText = heroTitle.textContent || '';
        new TypewriterEffect(heroTitle, originalText, 150);
    }
    
    // 添加頁面載入動畫
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// 添加CSS動畫類
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .nav-link.active {
        color: #1e3a8a !important;
    }
    
    .nav-link.active::after {
        width: 100% !important;
    }
`;
document.head.appendChild(style);
