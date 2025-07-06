document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".Wave-cloud").forEach((btn) => {
    let ripple = null;

    const create = (e) => {
      // منع ظهور الموجة عند النقر بالزر الأيمن (button === 2)
      if (ripple || (e.button !== undefined && e.button === 2)) return;

      const r = btn.getBoundingClientRect();
      const s = Math.max(r.width, r.height) * 0.5;

      // دعم إحداثيات اللمس
      let clientX = e.clientX,
        clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      // تحديد ما إذا كان الزر يحتوي على كلاس mid-wave
      const isMidWave = btn.classList.contains("mid-wave");

      // إذا كان mid-wave، نجعل الموجة تبدأ من المنتصف
      const startFromTopPercentage = isMidWave ? 0.5 : 0.8; // 50% للمنتصف، 80% للوضع العادي

      ripple = Object.assign(document.createElement("span"), {
        className: "ripple",
        style: `width:${s}px;height:${s}px;left:${
          clientX - r.left - s / 2
        }px;top:${clientY - r.top - s / 2}px;transform-origin: center ${
          startFromTopPercentage * 100
        }%`,
      });

      btn.appendChild(ripple);
      requestAnimationFrame(() => ripple.classList.add("expand"));
    };

    const release = () => {
      if (!ripple) return;
      const current = ripple;
      ripple = null;
      setTimeout(() => {
        current.classList.add("fade-out");
        current.addEventListener(
          "transitionend",
          () => {
            if (current.parentNode) current.remove();
          },
          { once: true }
        );
      }, 400);
    };

    ["mousedown", "touchstart"].forEach((e) => btn.addEventListener(e, create));
    ["mouseup", "touchend", "mouseleave", "touchcancel"].forEach((e) =>
      btn.addEventListener(e, release)
    );
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".toggle-button");
  const boxes = document.querySelectorAll(".content-box");
  let currentlyOpenBox = null;

  // إعداد الـ CSS المطلوب للانتقالات
  boxes.forEach((box) => {
    box.style.opacity = 0;
    box.style.transition = "opacity 0.3s ease";
    box.style.display = "none";
  });

  function fadeIn(element) {
    element.style.display = "block";
    requestAnimationFrame(() => {
      element.style.opacity = 1;
    });
  }

  function fadeOut(element) {
    element.style.opacity = 0;
    setTimeout(() => {
      element.style.display = "none";
    }, 300); // نفس مدة الانتقال
  }

  buttons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      const targetId = this.getAttribute("data-target");
      const targetBox = document.getElementById(targetId);

      if (currentlyOpenBox && currentlyOpenBox !== targetBox) {
        fadeOut(currentlyOpenBox);
      }

      if (targetBox.style.display === "block") {
        fadeOut(targetBox);
        currentlyOpenBox = null;
      } else {
        fadeIn(targetBox);
        currentlyOpenBox = targetBox;
      }
    });
  });

  // إضافة event listener للنقر واللمس
  function handleOutsideClick(event) {
    if (currentlyOpenBox && !currentlyOpenBox.contains(event.target)) {
      // تحقق أن النقر ليس على الزر نفسه
      const isButton = Array.from(buttons).some(button => 
        button === event.target || button.contains(event.target)
      );
      
      if (!isButton) {
        fadeOut(currentlyOpenBox);
        currentlyOpenBox = null;
      }
    }
  }

  // إضافة أحداث النقر واللمس
  document.addEventListener("mousedown", handleOutsideClick);
  document.addEventListener("touchstart", handleOutsideClick);

  boxes.forEach((box) => {
    box.addEventListener("click", function (event) {
      event.stopPropagation();
    });
    box.addEventListener("touchstart", function (event) {
      event.stopPropagation();
    });
  });
});




function selectText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function copyText(id) {
  const element = document.getElementById(id);
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");

  // إزالة التحديد بعد 1 ثانية
  setTimeout(() => {
    window.getSelection().removeAllRanges();
  }, 1000);
}




function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function applyFontBasedOnLanguage(el, text) {
  if (isArabic(text)) {
    el.classList.add("arabic-font");
    el.classList.remove("non-arabic-font");
  } else {
    el.classList.add("non-arabic-font");
    el.classList.remove("arabic-font");
  }
}

function updateFontsForAllElements() {
  const elements = document.querySelectorAll(
    'p, div, span, h1, h2, h3, h4, h5, h6, label, a, button, input[type="text"], textarea'
  );

  elements.forEach((el) => {
    let text = "";

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      text = el.value;
      el.addEventListener("input", () => {
        applyFontBasedOnLanguage(el, el.value);
      });
    } else {
      text = el.textContent.trim();
    }

    applyFontBasedOnLanguage(el, text);
  });
}

document.addEventListener("DOMContentLoaded", updateFontsForAllElements);
