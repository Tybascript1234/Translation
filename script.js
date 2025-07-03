document.addEventListener('DOMContentLoaded', function() {
    // تعريف العناصر مع التحقق من وجودها
    const elements = {
        fromText: document.querySelector(".from-text"),
        toText: document.querySelector(".to-text"),
        exchangeIcon: document.querySelector(".exchange-icon"),
        fromLangBtn: document.querySelector("#from-lang-btn"),
        toLangBtn: document.querySelector("#to-lang-btn"),
        fromLangOptions: document.querySelector("#from-lang-options"),
        toLangOptions: document.querySelector("#to-lang-options"),
        clearBtn: document.querySelector(".clear-btn"),
        micBtn: document.querySelector(".mic-btn"),
        copyBtn: document.querySelector(".copy-btn"),
        speakBtn: document.querySelector(".speak-btn"),
        searchBtn: document.querySelector(".search-btn")
    };

    // التحقق من وجود العناصر الأساسية
    const requiredElements = ['fromText', 'toText', 'exchangeIcon', 'fromLangBtn', 'toLangBtn', 
                            'fromLangOptions', 'toLangOptions'];
    
    for (const elem of requiredElements) {
        if (!elements[elem]) {
            console.error(`العنصر المطلوب غير موجود: ${elem}`);
            return;
        }
    }

    // تعيين المتغيرات للاستخدام في بقية الكود
    const {
        fromText, toText, exchangeIcon, fromLangBtn, toLangBtn,
        fromLangOptions, toLangOptions, clearBtn, micBtn, copyBtn, speakBtn, searchBtn
    } = elements;

    let translateFrom = "en";
    let translateTo = "ar";
    let firstMicClick = true;
    let currentRecognition = null;

    // ======== التعديلات الجديدة ======== //

    // التحقق من اتصال HTTPS
    if (window.location.protocol !== 'https:') {
        createToast("هذه الميزة تتطلب اتصالاً آمناً (HTTPS) للعمل بشكل صحيح", "error");
        if (micBtn) {
            micBtn.disabled = true;
            micBtn.title = "غير متاح على اتصال غير آمن";
        }
    }

    // دالة للكشف عن الأجهزة المحمولة
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // دالة لكشف المتصفح
    function getBrowser() {
        const ua = navigator.userAgent;
        if (ua.match(/chrome|chromium|crios/i)) return 'Chrome';
        if (ua.match(/firefox|fxios/i)) return 'Firefox';
        if (ua.match(/safari/i)) return 'Safari';
        if (ua.match(/opr\//i)) return 'Opera';
        if (ua.match(/edg/i)) return 'Edge';
        return 'Unknown';
    }

    // دالة لاختبار الميكروفون
    async function testMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            createToast("الميكروفون جاهز للاستخدام", "success");
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            let errorMsg = "تعذر الوصول إلى الميكروفون";
            if (error.name === 'NotAllowedError') {
                errorMsg = "تم رفض الإذن. يرجى السماح باستخدام الميكروفون في إعدادات المتصفح";
            } else if (error.name === 'NotFoundError') {
                errorMsg = "لم يتم العثور على ميكروفون متصل";
            }
            createToast(errorMsg, "error");
            return false;
        }
    }

    // عرض تعليمات الاستخدام على الهاتف
    function showMobileInstructions() {
        if (!isMobile()) return;
        
        const instructions = {
            title: "تعليمات الاستخدام على الهاتف",
            steps: [
                "1. اضغط على زر الميكروفون",
                "2. ابدأ بالتحدث بوضوح",
                "3. انتظر حتى انتهاء التسجيل"
            ],
            permission: "سيطلب منك السماح باستخدام الميكروفون"
        };
        
        const modal = document.createElement('div');
        modal.className = 'instruction-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${instructions.title}</h3>
                <ul>${instructions.steps.map(step => `<li>${step}</li>`).join('')}</ul>
                <p><i class="fas fa-info-circle"></i> ${instructions.permission}</p>
                <button class="ok-btn">حسناً</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.querySelector('.ok-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    // تسجيل الأخطاء وتحليلها
    function logRecognitionError(error) {
        const errorLog = {
            error: error.name || 'UnknownError',
            message: error.message || 'No error message',
            browser: getBrowser(),
            os: navigator.platform,
            timestamp: new Date().toISOString(),
            isMobile: isMobile()
        };
        
        console.error('Recognition Error:', errorLog);
        const existingLogs = JSON.parse(localStorage.getItem('recognitionErrors') || '[]');
        existingLogs.push(errorLog);
        localStorage.setItem('recognitionErrors', JSON.stringify(existingLogs));
    }

    // تحديث حالة زر الميكروفون بناء على الإذن
    function updateMicButtonState(state) {
        if (!micBtn) return;
        
        if (state === 'granted') {
            micBtn.disabled = false;
            micBtn.title = "التحدث";
            micBtn.style.opacity = 1;
        } else if (state === 'denied') {
            micBtn.disabled = true;
            micBtn.title = "تم رفض إذن الميكروفون";
            micBtn.style.opacity = 0.5;
        } else {
            micBtn.disabled = false;
            micBtn.title = "انقر للطلب إذن الميكروفون";
            micBtn.style.opacity = 0.8;
        }
    }

    // تحسينات للشاشات الصغيرة
    function adjustForMobile() {
        if (!isMobile()) return;
        
        const elementsToResize = [fromText, toText, micBtn, copyBtn, speakBtn];
        elementsToResize.forEach(el => {
            if (el) {
                el.style.fontSize = '16px';
                el.style.padding = '12px';
            }
        });
        
        const buttons = [micBtn, copyBtn, speakBtn];
        buttons.forEach(btn => {
            if (btn) {
                btn.style.minWidth = '50px';
                btn.style.minHeight = '50px';
            }
        });
    }

    // ======== نهاية التعديلات الجديدة ======== //

    // دالة لاختصار أسماء اللغات (مثل en-GB إلى en)
    function getShortLangCode(fullCode) {
        return fullCode.split('-')[0];
    }

    // إنشاء عنصر Toast لعرض الرسائل
    function createToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }, 100);
    }

    // معالجة أخطاء التعرف على الصوت
    function handleRecognitionError(error) {
        let errorMessage = "حدث خطأ في التعرف على الصوت";
        switch(error) {
            case 'not-allowed':
            case 'permission-denied':
                errorMessage = "تم رفض إذن استخدام الميكروفون. يرجى السماح بالإذن في إعدادات المتصفح";
                break;
            case 'no-speech':
                errorMessage = "لم يتم اكتشاف أي كلام. يرجى التحدث بوضوح";
                break;
            case 'audio-capture':
                errorMessage = "لم يتم العثور على ميكروفون";
                break;
            case 'network':
                errorMessage = "خطأ في الشبكة، يرجى المحاولة لاحقًا";
                break;
            default:
                errorMessage = `خطأ غير معروف: ${error}`;
        }
        createToast(errorMessage);
    }

    // بدء التعرف على الصوت (محدث)
    function startSpeechRecognition() {
        const browser = getBrowser();
        
        if (browser === 'Safari' && !window.webkitSpeechRecognition) {
            createToast("يجب تحديث Safari للإصدار 14.1 أو أعلى لدعم هذه الميزة", "warning");
            return;
        }
        
        if (browser === 'Firefox') {
            createToast("لأفضل تجربة على Firefox، يرجى التحدث بوضوح وببطء", "info");
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            createToast("المتصفح لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge");
            return;
        }

        // إيقاف أي تسجيل جارٍ
        if (currentRecognition) {
            currentRecognition.stop();
        }

        currentRecognition = new SpeechRecognition();
        currentRecognition.lang = getShortLangCode(translateFrom);
        currentRecognition.interimResults = false;
        currentRecognition.maxAlternatives = 1;

        // مؤشر التسجيل
        if (micBtn) {
            micBtn.innerHTML = '<i class="fas fa-circle pulse"></i>';
            micBtn.title = "جاري الاستماع...";
        }

        currentRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            fromText.value = transcript;
            translateText();
            createToast("تم التعرف على الصوت بنجاح", "success");
        };

        currentRecognition.onerror = (event) => {
            logRecognitionError(event.error);
            handleRecognitionError(event.error);
        };

        currentRecognition.onend = () => {
            if (micBtn) {
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                micBtn.title = "التحدث";
            }
            currentRecognition = null;
        };

        try {
            currentRecognition.start();
        } catch (e) {
            createToast("تعذر بدء التعرف على الصوت: " + e.message);
        }
    }

    // إنشاء خيارات اللغات مع إضافة البحث
    function createLangOptions() {
        if (!fromLangOptions || !toLangOptions) return;
        
        const fromOptionsList = fromLangOptions.querySelector('.lang-options-list');
        const toOptionsList = toLangOptions.querySelector('.lang-options-list');
        if (!fromOptionsList || !toOptionsList) return;
        
        fromOptionsList.innerHTML = '';
        toOptionsList.innerHTML = '';
        
        for (let country_code in countries) {
            const shortCode = getShortLangCode(country_code);
            const isFromSelected = country_code === translateFrom;
            const isToSelected = country_code === translateTo;
            
            // خيارات اللغة المصدر
            const fromOption = document.createElement('div');
            fromOption.className = `lang-option ${isFromSelected ? 'selected' : ''}`;
            fromOption.innerHTML = `
                <span class="lang-code">${shortCode.toUpperCase()}</span>
                <span class="lang-name">${countries[country_code]}</span>
            `;
            fromOption.dataset.lang = country_code;
            fromOption.addEventListener('click', () => {
                translateFrom = country_code;
                updateSelectedLang(fromLangBtn, fromOptionsList, country_code, shortCode);
                fromLangOptions.classList.remove('show');
                if (fromText.value.trim()) translateText();
            });
            fromOptionsList.appendChild(fromOption);
            
            // خيارات اللغة الهدف
            const toOption = document.createElement('div');
            toOption.className = `lang-option ${isToSelected ? 'selected' : ''}`;
            toOption.innerHTML = `
                <span class="lang-code">${shortCode.toUpperCase()}</span>
                <span class="lang-name">${countries[country_code]}</span>
            `;
            toOption.dataset.lang = country_code;
            toOption.addEventListener('click', () => {
                translateTo = country_code;
                updateSelectedLang(toLangBtn, toOptionsList, country_code, shortCode);
                toLangOptions.classList.remove('show');
                if (fromText.value.trim()) translateText();
            });
            toOptionsList.appendChild(toOption);
        }
        
        // تعيين اللغات الافتراضية
        updateSelectedLang(fromLangBtn, fromOptionsList, translateFrom, getShortLangCode(translateFrom));
        updateSelectedLang(toLangBtn, toOptionsList, translateTo, getShortLangCode(translateTo));
        
        // إضافة وظيفة البحث
        setupLangSearch(fromLangOptions);
        setupLangSearch(toLangOptions);
    }

    // تحديث اللغة المحددة
    function updateSelectedLang(btnElement, optionsList, countryCode, shortCode) {
        if (!btnElement || !countries[countryCode]) return;
        
        // تحديث الزر الرئيسي
        btnElement.innerHTML = `
            <span class="lang-code">${shortCode.toUpperCase()}</span>
            <span class="lang-name">${countries[countryCode]}</span>
        `;
        
        // تحديث الخيارات المحددة في القائمة
        if (optionsList) {
            optionsList.querySelectorAll('.lang-option').forEach(option => {
                option.classList.remove('selected');
                if (option.dataset.lang === countryCode) {
                    option.classList.add('selected');
                    // تمرير الخيار المحدد إلى الأعلى
                    optionsList.prepend(option.cloneNode(true));
                    option.remove();
                }
            });
        }
    }

    // إعداد وظيفة البحث
    function setupLangSearch(langOptions) {
        if (!langOptions) return;
        
        const searchInput = langOptions.querySelector('.lang-search');
        const optionsList = langOptions.querySelector('.lang-options-list');
        const closeBtn = langOptions.querySelector('.close-lang-options');
        
        if (!searchInput || !optionsList || !closeBtn) return;
        
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            let hasResults = false;
            
            optionsList.querySelectorAll('.lang-option').forEach(option => {
                const langName = option.querySelector('.lang-name')?.textContent.toLowerCase();
                const langCode = option.querySelector('.lang-code')?.textContent.toLowerCase();
                
                if (langName?.includes(searchTerm) || langCode?.includes(searchTerm)) {
                    option.style.display = 'flex';
                    hasResults = true;
                } else {
                    option.style.display = 'none';
                }
            });
            
            if (!hasResults) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No languages found';
                optionsList.appendChild(noResults);
            } else {
                const existingNoResults = optionsList.querySelector('.no-results');
                if (existingNoResults) {
                    existingNoResults.remove();
                }
            }
        });
        
        // زر الإغلاق
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langOptions.classList.remove('show');
            searchInput.value = '';
            optionsList.querySelectorAll('.lang-option').forEach(option => {
                option.style.display = 'flex';
            });
            const noResults = optionsList.querySelector('.no-results');
            if (noResults) noResults.remove();
        });
        
        // مسح البحث عند إغلاق القائمة
        langOptions.addEventListener('click', (e) => {
            if (e.target === langOptions) {
                searchInput.value = '';
                optionsList.querySelectorAll('.lang-option').forEach(option => {
                    option.style.display = 'flex';
                });
                const noResults = optionsList.querySelector('.no-results');
                if (noResults) noResults.remove();
            }
        });
    }

    // تبديل اللغات
    if (exchangeIcon) {
        exchangeIcon.addEventListener("click", () => {
            let tempText = fromText.value;
            let tempLang = translateFrom;
            
            fromText.value = toText.value;
            toText.value = tempText;
            
            translateFrom = translateTo;
            translateTo = tempLang;
            
            updateSelectedLang(fromLangBtn, fromLangOptions?.querySelector('.lang-options-list'), translateFrom, getShortLangCode(translateFrom));
            updateSelectedLang(toLangBtn, toLangOptions?.querySelector('.lang-options-list'), translateTo, getShortLangCode(translateTo));
            
            if (fromText.value.trim()) translateText();
        });
    }

    // إظهار/إخفاء قوائم اللغات
    if (fromLangBtn) {
        fromLangBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fromLangOptions.classList.toggle('show');
            toLangOptions.classList.remove('show');
            const langSelector = document.querySelector('.lang-selector');
            if (langSelector) {
                langSelector.classList.toggle('active', fromLangOptions.classList.contains('show'));
            }
            
            // التركيز على حقل البحث عند الفتح
            if (fromLangOptions.classList.contains('show')) {
                setTimeout(() => {
                    const searchInput = fromLangOptions.querySelector('.lang-search');
                    if (searchInput) searchInput.focus();
                }, 100);
            }
        });
    }

    if (toLangBtn) {
        toLangBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toLangOptions.classList.toggle('show');
            fromLangOptions.classList.remove('show');
            const langSelector = document.querySelector('.lang-selector:nth-child(2)');
            if (langSelector) {
                langSelector.classList.toggle('active', toLangOptions.classList.contains('show'));
            }
            
            // التركيز على حقل البحث عند الفتح
            if (toLangOptions.classList.contains('show')) {
                setTimeout(() => {
                    const searchInput = toLangOptions.querySelector('.lang-search');
                    if (searchInput) searchInput.focus();
                }, 100);
            }
        });
    }

    // إغلاق قوائم اللغات عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-selector')) {
            if (fromLangOptions) fromLangOptions.classList.remove('show');
            if (toLangOptions) toLangOptions.classList.remove('show');
            document.querySelectorAll('.lang-selector').forEach(el => el.classList.remove('active'));
            
            // مسح حقول البحث
            document.querySelectorAll('.lang-search').forEach(input => input.value = '');
            document.querySelectorAll('.lang-options-list .lang-option').forEach(option => {
                option.style.display = 'flex';
            });
            document.querySelectorAll('.no-results').forEach(el => el.remove());
        }
    });

    // مسح النص
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            fromText.value = '';
            toText.value = '';
        });
    }

    // إدخال الصوتي (محدث)
    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (firstMicClick) {
                showMobileInstructions();
                firstMicClick = false;
            }
            
            const micReady = await testMicrophone();
            if (micReady) {
                startSpeechRecognition();
            }
        });
        
        // إضافة حدث touchstart للهواتف
        micBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            micBtn.click();
        });
    }

    // نسخ النص المترجم
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!toText.value) return;
            navigator.clipboard.writeText(toText.value)
                .then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    createToast("تم نسخ النص بنجاح", "success");
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    createToast("فشل في نسخ النص: " + err);
                });
        });
    }

    // نطق النص المترجم
    if (speakBtn) {
        speakBtn.addEventListener('click', () => {
            if (!toText.value) return;
            const utterance = new SpeechSynthesisUtterance(toText.value);
            utterance.lang = translateTo;
            
            utterance.onerror = (event) => {
                createToast("حدث خطأ أثناء محاولة النطق: " + event.error);
            };
            
            speechSynthesis.speak(utterance);
        });
    }

    // البحث في جوجل بالنص المترجم
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (!toText.value.trim()) {
                createToast("لا يوجد نص مترجم للبحث عنه", "warning");
                return;
            }
            
            const searchQuery = encodeURIComponent(toText.value);
            const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
            window.open(googleSearchUrl, '_blank');
        });
    }

    // الترجمة التلقائية
    fromText.addEventListener("input", () => {
        if (!fromText.value.trim()) {
            toText.value = "";
            return;
        }
        
        clearTimeout(fromText.timer);
        fromText.timer = setTimeout(translateText, 500);
    });

    // وظيفة الترجمة
    function translateText() {
        let text = fromText.value.trim();
        if (!text) return;
        
        toText.setAttribute("placeholder", "Translating...");
        let apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${getShortLangCode(translateFrom)}|${getShortLangCode(translateTo)}`;
        
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.responseData) {
                    toText.value = data.responseData.translatedText;
                    if (data.matches) {
                        data.matches.forEach(match => {
                            if (match.id === 0) {
                                toText.value = match.translation;
                            }
                        });
                    }
                } else {
                    toText.value = "Translation failed";
                    createToast("فشل في الترجمة", "error");
                }
                toText.setAttribute("placeholder", "Translation");
            })
            .catch(error => {
                console.error("Translation error:", error);
                toText.value = "Translation error";
                toText.setAttribute("placeholder", "Translation");
                createToast("خطأ في الترجمة: " + error.message, "error");
            });
    }

    // تهيئة اللغات عند التحميل
    createLangOptions();
    
    // ======== استدعاء الدوال الجديدة عند التحميل ======== //
    adjustForMobile();
    window.addEventListener('resize', adjustForMobile);
    
    // مراقبة حالة إذن الميكروفون
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({name: 'microphone'}).then(permissionStatus => {
            updateMicButtonState(permissionStatus.state);
            permissionStatus.onchange = () => {
                updateMicButtonState(permissionStatus.state);
            };
        }).catch(() => {
            // بعض المتصفحات لا تدعم query للميكروفون
            updateMicButtonState('prompt');
        });
    } else {
        updateMicButtonState('prompt');
    }
});