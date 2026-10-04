const {gsap,ScrollTrigger}=window;
gsap.registerPlugin(ScrollTrigger);
document.addEventListener('DOMContentLoaded', function () {

	// menu
	document.querySelectorAll('.header__menu-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			document.querySelector('body').classList.toggle('header-open')
		})
	})
	document.querySelectorAll('.nav__link').forEach(link => {
		link.addEventListener('click', (e) => {
			document.querySelector('body').classList.remove('header-open')
		})
	})


	// anchor
	function anchorInit(currentAnchor) {
		let currentBlock = document.getElementById(currentAnchor)

		if (currentBlock && (Math.floor(currentBlock.getBoundingClientRect().top) > 130 || Math.floor(currentBlock.getBoundingClientRect().top) < 100)) {
			let headerHeight = document.querySelector('.header').clientHeight
			let blockPosition = currentBlock.getBoundingClientRect().top + window.scrollY

			let totalMargin = 0
			document.querySelectorAll('[data-total-margin]').forEach(block => {
				totalMargin += +block.getAttribute('data-total-margin').replace("px", "")
			})

			currentBlock.closest('.section-anim').classList.add('current-anchor')

			let totalMarginAfter = 0
			if (Math.floor(currentBlock.getBoundingClientRect().top) > 113) {
				document.querySelectorAll('.current-anchor~[data-total-margin]').forEach(block => {
					totalMarginAfter += +block.getAttribute('data-total-margin').replace("px", "")
				})
			}

			let currentMargin = 0
			document.querySelectorAll('.section-anim').forEach(block => {
				currentMargin += +getComputedStyle(block).marginTop.replace("px", "")
			})

			let resultMargin = totalMargin - totalMarginAfter + currentMargin
			window.scroll({
				top: blockPosition - resultMargin,
				left: 0,
			});
			currentBlock.closest('.section-anim').classList.remove('current-anchor')
		}
	}

	let anchorOnLoad = window.location.hash;
	if (anchorOnLoad) {
		window.tempHash = anchorOnLoad;
		history.replaceState(null, null, ' ');

		setTimeout(() => {
			anchorInit(anchorOnLoad.substring(1))
		}, 10);
	}

	document.querySelectorAll('.anchor').forEach((el => {
		el.addEventListener('click', (e) => {
			e.preventDefault()
			let currentAnchor = e.currentTarget.href.split('#').slice(1).join('')
			anchorInit(currentAnchor)
		})
	}))

	gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
	// sections anim
	let sectionsArr = document.querySelectorAll('.section-anim')
	sectionsArr.forEach((section, index) => {
		if (index + 1 < sectionsArr.length) {
			let blockHeight = sectionsArr[index + 1].offsetHeight
			let windowHeight = window.innerHeight
			let resultHeight = blockHeight < windowHeight ? blockHeight : windowHeight

			let tl = gsap.timeline({
				scrollTrigger: {
					trigger: section,
					start: "bottom 100%",
					end: "+=" + resultHeight,
					scrub: true,
					markers: false,
					pin: false,
					onLeave: (event) => {
						ScrollTrigger.refresh()
					}
				}
			});

			tl.to(sectionsArr[index + 1], {
				marginTop: -resultHeight / 2,
			});

			sectionsArr[index + 1].setAttribute('data-total-margin', resultHeight / 2)
		}
	})


	// max logo anim
	document.querySelectorAll('.logo-block').forEach(wrapper => {
		let img = wrapper.querySelector('.logo-block__img')

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: img,
				start: "top bottom",
				end: "top 30%",
				scrub: true,
				markers: false,
				pin: false,
			}
		});

		tl.fromTo(img, {
			rotate: '50deg',
			yPercent: 50,
		}, {
			rotate: '10deg',
			yPercent: 0,
		});
	})


	// completed list items anim
	document.querySelectorAll('.completed').forEach(wrapper => {
		let itemsArr = wrapper.querySelectorAll('.completed__item')

		itemsArr.forEach((item, index) => {
			let tl = gsap.timeline({
				scrollTrigger: {
					trigger: wrapper,
					start: "top 60%",
					end: "top 20%",
					scrub: false,
					markers: false,
					pin: false,
				}
			});

			tl.fromTo(item, {
				yPercent: 100 * index,
				duration: 1,
			}, {
				yPercent: 0,
				duration: 1,
			});
		})
	})


	// vacancy entrance anim
	document.querySelectorAll('.vacancy-entrance').forEach(wrapper => {
		let elemsArr = wrapper.querySelectorAll('.vacancy-entrance__anim')

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrapper,
				start: "top bottom",
				end: "top bottom",
				scrub: false,
				markers: false,
				pin: false,
			}
		});


		elemsArr.forEach((elem, index) => {
			tl.fromTo(elem, {
				y: '20px',
				opacity: 0,
				ease: "back.out(1.7)",
				duration: 0.8,
				delay: index * 0.2,
			}, {
				y: 0,
				opacity: 1,
				ease: "back.out(1.7)",
				duration: 0.8,
				delay: index * 0.2,
			}, 0);
		})
	})


	});
	// tab
	document.querySelectorAll('.tab').forEach(wrapper => {
		let linkArr = wrapper.querySelectorAll('.tab__link')

		linkArr.forEach((link, index) => {
			link.addEventListener('click', (e) => {
				wrapper.querySelectorAll('.tab__link_active').forEach(el => {
					el.classList.remove('tab__link_active')
				})
				link.classList.add('tab__link_active')
				wrapper.querySelectorAll('.tab__item_active').forEach(item => {
					item.classList.remove('tab__item_active')
				})

				wrapper.querySelectorAll('.tab__body').forEach(body => {
					body.querySelectorAll('.tab__item')[index].classList.add('tab__item_active')
				})
			})
		})
	})


	// accordion
	document.querySelectorAll('.accordion').forEach(accordion => {
		let itemArr = accordion.querySelectorAll('.accordion__item')
		itemArr.forEach(item => {

			let btn = item
			let body = item.querySelector('.accordion__body')
			if (!item.closest('.accordion__item_open')) {
				body.style.maxHeight = 0
			}
			btn.addEventListener('click', (e) => {

				if (!item.closest('.accordion__item_open')) {
					item.classList.add('accordion__item_open')
					body.style.maxHeight = body.scrollHeight + 'px'
				} else {
					item.classList.remove('accordion__item_open')
					body.style.maxHeight = 0
				}
			})
		})
	})



});
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const videos=[...document.querySelectorAll('video')];const visible=new Set();
function playback(){for(const video of videos){if(!document.hidden&&!reduced.matches&&visible.has(video))video.play().catch(()=>{});else video.pause();}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}playback();});
for(const video of videos){video.autoplay=false;video.muted=true;video.preload='metadata';observer.observe(video);}
document.addEventListener('visibilitychange',playback);reduced.addEventListener('change',playback);
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener noreferrer';}
