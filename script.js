// ============ mobile nav ============
const toggle = document.querySelector('.menu-toggle');
const navlinks = document.querySelector('.navlinks');
if(toggle && navlinks){
  toggle.addEventListener('click', () => {
    navlinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', navlinks.classList.contains('open'));
  });
  navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navlinks.classList.remove('open')));
}

// ============ terminal boot line ============
function typeTerminal(el, lines, speed = 26){
  if(!el) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    el.textContent = lines[lines.length - 1];
    return;
  }
  let li = 0;
  function typeLine(){
    if(li >= lines.length){
      const caret = document.createElement('span');
      caret.className = 'caret';
      el.appendChild(caret);
      return;
    }
    const text = lines[li];
    let ci = 0;
    el.textContent = '';
    const iv = setInterval(() => {
      el.textContent = text.slice(0, ci + 1);
      ci++;
      if(ci >= text.length){
        clearInterval(iv);
        li++;
        setTimeout(typeLine, li >= lines.length ? 0 : 380);
      }
    }, speed);
  }
  typeLine();
}

document.addEventListener('DOMContentLoaded', () => {
  const term = document.querySelector('[data-terminal]');
  if(term){
    const lines = JSON.parse(term.getAttribute('data-terminal'));
    typeTerminal(term, lines);
  }

  // ============ scroll reveal ============
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ============ copy to clipboard ============
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy');
      try{
        await navigator.clipboard.writeText(val);
        const original = btn.textContent;
        btn.textContent = 'COPIED';
        setTimeout(() => { btn.textContent = original; }, 1400);
      }catch(e){ /* clipboard unavailable, ignore silently */ }
    });
  });

  // ============ contact form -> mailto ============
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value.trim();
      const message = document.getElementById('cf-message').value.trim();

      const to = 'rayenhajjem04@gmail.com';
      const mailSubject = `[Portfolio] ${subject}`;
      const mailBody = `${message}\n\n—\n${name}\n${email}`;

      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

      const status = document.getElementById('cf-status');
      if(status) status.textContent = 'Opening your email app…';

      window.location.href = mailtoUrl;
    });
  }
});
