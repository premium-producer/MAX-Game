function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
	options = {
		path: '/',
		// при необходимости добавьте другие значения по умолчанию
		...options
	};

	if (options.expires instanceof Date) {
		options.expires = options.expires.toUTCString();
	}

	let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

	for (let optionKey in options) {
		updatedCookie += "; " + optionKey;
		let optionValue = options[optionKey];
		if (optionValue !== true) {
			updatedCookie += "=" + optionValue;
		}
	}
	document.cookie = updatedCookie;
}

function deleteCookie(name) {
	setCookie(name, "", {
		'max-age': -1
	})
}


let searchString = window.location.search.slice(1)
if (searchString) {
	setCookie('searchString', searchString, { secure: true, 'max-age': 3600 })
}


// redirect
const redirectRuleArr = [
	{
		fromUrl: 'https://team.vk.company/career-max/android-developer/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/ios-developer/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/team-lead-java/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/senior-java-developer/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/senior-product-designer/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/senior-product-manager/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/site-reliability-engineer/',
		toUrl: 'https://team.vk.company/career-max/',
	},
	{
		fromUrl: 'https://team.vk.company/career-max/c-plus-plus-developer-senior/',
		toUrl: 'https://team.vk.company/career-max/',
	},
]

redirectRuleArr.forEach(redirectRule => {
	if (window.location.href == redirectRule.fromUrl) {
		window.location.replace(redirectRule.toUrl);
	}
})

window.scroll({
	top: 0,
	left: 0,
});

document.addEventListener('DOMContentLoaded', function () {

	// hide closed vacancies
	document.querySelectorAll('.vacancy').forEach(wrapper => {
		let vacanciesArr = wrapper.querySelectorAll('[data-vacancy-id]')

		fetch('https://team.vk.company/career/api/v2/vacancies/?limit=100&parent_group=366', { method: "GET", })
			.then(response => {
				if (response.ok) {
					return response.json()
				} else {
					console.error(error.message)
				}
			})
			.then(data => {
				let vacanciesData = data.results;
				let vacanciesDataIdArr = Array.from(Object.values(vacanciesData), key => key.id)

				vacanciesArr.forEach(vacancyItem => {
					let currentId = vacancyItem.getAttribute('data-vacancy-id')
					if (!vacanciesDataIdArr.includes(+currentId)) {
						vacancyItem.style.display = 'none';
					}
				})

				document.body.removeAttribute('data-scroll-lock')
			})
			.catch(error => {
				console.error(error.message)
				document.body.removeAttribute('data-scroll-lock')
			})
	})

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
			let currentAnchor = e.target.href.split('#').slice(1).join('')
			anchorInit(currentAnchor)
		})
	}))

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


	// fancybox defaults
	Fancybox.bind('[data-fancybox]', {
		autoFocus: false,
		Thumbs: false,
	});


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


	// input-file
	document.querySelectorAll('.input-file').forEach(wrapper => {
		let input = wrapper.querySelector('.input-file__field')
		let name = wrapper.querySelector('.input-file__name')

		input.addEventListener('change', (e) => {
			if (input.files[0].size > 1024 * 1024 * 15) {
				input.value = '';
				name.innerHTML = '<span style="color:var(--red);">Размер файла должен быть меньше 15Mb. Выбранный файл не будет загружен.</span> '
			} else {
				name.innerHTML = input.files[0].name
			}
		})
	})



	function validateEmail(email) {
		let value = /\S+@\S+\.\S+/;
		return value.test(email);
	}

	// Выносим логику отправки в отдельную функцию
	async function sendForm(form, formData, captchaToken, client) {
		let popupError = document.querySelector('#popup-error');
		let popupSuccess = document.querySelector('#popup-success');

		// больше не используем smartcaptcha — поле smart-token не нужно
		formData.delete('smart-token');

		if (captchaToken) {
			formData.set('recaptcha_token', captchaToken);
		} else {
			formData.delete('recaptcha_token');
		}

		if (client) {
			formData.set('client', client);
		}

		try {
			const res = await fetch(form.action + '?from=career_max' + (getCookie('searchString') ? '&' + getCookie('searchString') : ''), {
				method: "post",
				body: formData
			});

			if (res.ok) {
				form.reset();
				Fancybox.close();
				const fancybox = new Fancybox([
					{
						src: popupSuccess,
						type: "html",
					},
				]);

				if (typeof handleTracking === 'function') {
					handleTracking(form.getAttribute('data-form-event'));
				}
				return;
			}

			if (res.status === 400) {
				const json = await res.json();

				// если captcha_url нет — это обычная валидационная ошибка, а не запрос капчи
				if (json.captcha_url) {
					const sdk = await window.vkidCaptcha;
					const token = await new sdk.CaptchaWidget().show({
						container: document.body,
						iframeSrc: json.captcha_url,
						captchaType: json.captcha_type || 'type_1',
						view: 'popup',
					});

					if (!token) return; // пользователь закрыл капчу — прерываем без ошибки

					return sendForm(form, formData, token, json.client);
				}
			}

			console.error('Ошибка отправки формы');
			const fancybox = new Fancybox([
				{
					src: popupError,
					type: "html",
				},
			]);
			console.error('Ошибка отправки формы');
		} catch (error) {
			console.error(error.message);
			const fancybox = new Fancybox([
				{
					src: popupError,
					type: "html",
				},
			]);
			console.error('Ошибка отправки формы');
		}
	}

	document.querySelectorAll('.form').forEach(form => {
		let btnSubmit = form.querySelector('.form__submit');
		let inputArr = form.querySelectorAll('.form__input');
		let checkbox = form.querySelector('.form__checkbox input');
		let formValid = false;

		btnSubmit.addEventListener('click', (e) => {
			e.preventDefault();

			const formData = new FormData(form);

			if (form.querySelector('input:required:invalid:not([name="resume"],[name="resume_link"])') ||
				!validateEmail(form.querySelector('input[type="email"]').value) ||
				(!form.querySelector('input[name="resume"]').value && !form.querySelector('input[name="resume_link"]').value)
			) {
				form.classList.add('form_error')
				formValid = false
			} else {
				form.classList.remove('form_error')
				formValid = true
			}

			if (formValid) {
				formData.set('phone', form.querySelector('.input-tel__btn .input-tel__code').innerHTML + ' ' + formData.get('phone'));

				sendForm(form, formData, null, null);
			}
		});

		inputArr.forEach(input => {
			if (!form.querySelector('input:required:invalid:not([name="resume"],[name="resume_link"],[type="email"])')) {
				form.classList.remove('form_error')
				formValid = true
			}

			if (input.closest('.form__input')) {
				let clearBtn = input.closest('.form__input').querySelector('.form__input-clear')

				clearBtn.addEventListener('click', (e) => {
					input.value = ''
				})
			}

			input.addEventListener('input', (e) => {
				if (!form.querySelector('input:required:invalid:not([name="resume"],[name="resume_link"],[type="email"])')) {
					form.classList.remove('form_error')
					formValid = true
				}
			})

			if (input.type == 'email') {
				input.addEventListener('input', (e) => {
					if (validateEmail(input.value)) {
						input.classList.remove('form__input_error')
						formValid = true
					} else {
						input.classList.add('form__input_error')
						formValid = false
					}

				})
			}
		})
	});


	// scrollbar anim
	document.querySelectorAll('.popup__form').forEach(wrapper => {
		let scrollbarTimeout
		wrapper.addEventListener('scroll', () => {
			clearTimeout(scrollbarTimeout);

			wrapper.classList.add('popup__form_scrolling')
			scrollbarTimeout = setTimeout(() => {
				wrapper.classList.remove('popup__form_scrolling')
			}, 1000);
		});
	})


	// input tel
	document.querySelectorAll('.input-tel').forEach(wrapper => {
		let btn = wrapper.querySelector('.input-tel__btn')
		let btnContent = wrapper.querySelector('.input-tel__btn-content')
		let itemsArr = wrapper.querySelectorAll('.input-tel__panel-item')
		let input = wrapper.querySelector('.input-tel__field')

		let mask = IMask(input, { mask: '000 000-00-00' })

		btn.addEventListener('click', (e) => {
			wrapper.classList.toggle('input-tel_show')
		})

		itemsArr.forEach(item => {
			item.addEventListener('click', (e) => {
				btnContent.innerHTML = item.innerHTML
				input.style.paddingLeft = btn.offsetWidth + 24 + 'px'
				wrapper.classList.remove('input-tel_show')

				mask.updateOptions({ mask: item.getAttribute('data-mask') })
			})
		})
	})


	// download-panel
	document.querySelectorAll('.download-panel').forEach(wrapper => {
		let btn = wrapper.querySelector('.download-panel__btn')
		let body = wrapper.querySelector('.download-panel__body')
		let bg = wrapper.querySelector('.download-panel__bg')

		btn.addEventListener('click', (e) => {
			wrapper.classList.add('download-panel_open')

			body.style.height = body.scrollHeight + 'px'
			btn.style.marginBottom = '-52px'
		})

		bg.addEventListener('click', (e) => {
			wrapper.classList.remove('download-panel_open')

			body.style.height = '0px'
			btn.style.marginBottom = '0px'
		})
	})



});


trackYandexMetrika = (goal) => {
	ym(103964396, 'reachGoal', goal);
	console.log('trackYandexMetrika - ', goal);
};

trackMyTracker = (goal) => {
	_tmr.push({ id: '3686925', type: 'reachGoal', goal });
	console.log('trackMyTracker - ', goal);
};

handleTracking = (goal) => {
	trackYandexMetrika(goal);
	trackMyTracker(goal);
};