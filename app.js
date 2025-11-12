// Scroll progress bar
const bar = document.getElementById('scrollBar');
function updateScrollBar() {
  const h = document.documentElement;
  const scrollable = h.scrollHeight - h.clientHeight;
  const scrolled = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
  bar.style.width = scrolled + '%';
}
document.addEventListener('scroll', updateScrollBar, { passive: true });
window.addEventListener('load', updateScrollBar);
window.addEventListener('resize', updateScrollBar);

// Reveal-on-scroll
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: 0.15 });
reveals.forEach(el => io.observe(el));



// Optional: Smooth scroll for in-page links (enhanced)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
