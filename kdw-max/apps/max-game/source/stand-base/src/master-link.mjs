// The standalone launcher has no master at /. Never guess or reach another origin.
const link = document.querySelector('.master-return');
if (link && location.pathname.startsWith('/max-game/')) link.hidden = false;
