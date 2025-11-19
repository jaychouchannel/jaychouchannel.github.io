// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });
    
    // 初始化所有功能模块
    initThreeBackground();
    initMobileMenu();
    initCategoryFilter();
    initCounterAnimation();
    initAIChat();
    initSmoothScroll();
});

// Three.js 背景动画
function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // 创建粒子
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // 材质
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.8
    });
    
    // 网格
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // 相机位置
    camera.position.z = 2;
    
    // 鼠标移动效果
    let mouseX = 0;
    let mouseY = 0;
    
    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - window.innerWidth / 2) / 1000;
        mouseY = (event.clientY - window.innerHeight / 2) / 1000;
    }
    
    document.addEventListener('mousemove', onDocumentMouseMove);
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        
        particlesMesh.rotation.y += 0.001;
        particlesMesh.rotation.x += 0.0005;
        
        // 响应鼠标移动
        particlesMesh.rotation.y += mouseX * 0.001;
        particlesMesh.rotation.x += mouseY * 0.001;
        
        renderer.render(scene, camera);
    }
    
    animate();
}

// 移动端菜单功能
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.add('open');
    });
    
    closeMenuButton.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
    
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    });
}

// 分类筛选功能
function initCategoryFilter() {
    const filterButtons = document.querySelectorAll('.category-filter');
    const articleCards = document.querySelectorAll('.article-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新激活按钮样式
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-tech-blue', 'text-white');
                btn.classList.add('bg-tech-card', 'text-gray-300');
            });
            
            button.classList.add('active', 'bg-tech-blue', 'text-white');
            button.classList.remove('bg-tech-card', 'text-gray-300');
            
            const category = button.getAttribute('data-category');
            
            // 筛选文章
            articleCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// 数字计数动画
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    
    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const increment = target / speed;
        
        if (count < target) {
            counter.innerText = Math.ceil(count + increment);
            setTimeout(() => animateCounter(counter), 1);
        } else {
            counter.innerText = target;
        }
    };
    
    // 当元素进入视口时触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// AI 聊天助手功能
function initAIChat() {
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    const quickQuestions = document.querySelectorAll('.quick-question');
    
    // 切换聊天窗口显示/隐藏
    chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });
    
    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
    
    // 发送消息函数
    function sendChatMessage(message) {
        // 添加用户消息
        const userMessageHTML = `
            <div class="flex mb-4 justify-end">
                <div class="bg-tech-blue/20 rounded-lg p-3 max-w-[80%]">
                    <p class="text-gray-300 text-sm">
                        ${message}
                    </p>
                </div>
                <div class="w-8 h-8 rounded-full bg-tech-purple flex items-center justify-center ml-2 flex-shrink-0">
                    <i class="fa fa-user text-white text-xs"></i>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', userMessageHTML);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 模拟 AI 回复
        setTimeout(() => {
            let response = '';
            
            if (message.includes('算法')) {
                response = '我推荐你阅读"深入理解JavaScript排序算法：从原理到实现"这篇文章，它详细介绍了常见排序算法的原理和实现方式。';
            } else if (message.includes('旅行')) {
                response = '如果你喜欢自然风光，我推荐你阅读"瑞士阿尔卑斯山之旅：徒步与编程的完美结合"，里面分享了美丽的风景和旅行体验。';
            } else if (message.includes('工具')) {
                response = '我最近分享了一些提高开发效率的工具，包括VS Code插件、终端工具等，你可以在"开发工具分享"分类中找到相关文章。';
            } else {
                response = '感谢你的留言！我是TechVoyager的AI助手，可以回答关于技术、旅行或博客内容的问题。请问有什么可以帮助你的吗？';
            }
            
            const aiMessageHTML = `
                <div class="flex mb-4">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-tech-blue to-tech-purple flex items-center justify-center mr-2 flex-shrink-0">
                        <i class="fa fa-robot text-white text-xs"></i>
                    </div>
                    <div class="bg-tech-dark rounded-lg p-3 max-w-[80%]">
                        <p class="text-gray-300 text-sm">
                            ${response}
                        </p>
                    </div>
                </div>
            `;
            
            chatMessages.insertAdjacentHTML('beforeend', aiMessageHTML);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
    
    // 按钮点击发送消息
    sendMessage.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            sendChatMessage(message);
        }
    });
    
    // 回车键发送消息
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
            }
        }
    });
    
    // 快捷问题
    quickQuestions.forEach(question => {
        question.addEventListener('click', () => {
            sendChatMessage(question.textContent);
        });
    });
}

// 平滑滚动
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initNavActiveState() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll("nav a");
    
    window.addEventListener("scroll", () => {
        let current = "";
        
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // 当滚动到某个区域时，高亮对应的导航项
            if (scrollY >= sectionTop - 100) {
                current = section.getAttribute("id");
            }
        });
        
        navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.getAttribute("href") === `#${current}`) {
                link.classList.add("active");
            }
        });
    });
}

// 在DOMContentLoaded中调用新函数
document.addEventListener('DOMContentLoaded', function() {
    // ... 其他初始化函数
    
    initNavActiveState(); // 添加这一行
});